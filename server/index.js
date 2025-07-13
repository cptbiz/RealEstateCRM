const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Internal imports
const db = require('./db/config');
const route = require('./controllers/route');

// Load environment variables
require('dotenv').config();

// Constants
const port = process.env.PORT || 5001;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const mongoUrl = process.env.DATABASE_URL || process.env.DB_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DATABASE_NAME || process.env.DB || 'Prolink';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize Redis client
let redisClient;
let RedisStore;

try {
    redisClient = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
                console.error('Redis connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                console.error('Redis retry time exhausted');
                return undefined;
            }
            if (options.attempt > 10) {
                console.error('Redis max attempts reached');
                return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
        }
    });

    // Redis connection handlers
    redisClient.on('connect', () => {
        console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
        console.error('Redis connection error:', err);
    });

    // Initialize RedisStore only if Redis is available
    try {
        const ConnectRedis = require('connect-redis');
        RedisStore = ConnectRedis(session);
    } catch (error) {
        console.warn('Redis session store not available, using memory store');
    }
} catch (error) {
    console.warn('Redis not available, continuing without Redis');
}

// Initialize logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'real-estate-crm' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Add file logging if in development or logs directory exists
if (process.env.NODE_ENV === 'development' || fs.existsSync('logs')) {
    logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
    logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health' || req.path === '/api/status';
    }
});

app.use(limiter);

// API-specific rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many API requests, please try again later.'
});

app.use('/api/', apiLimiter);

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'sessionId'
};

// Use Redis store if available
if (RedisStore && redisClient) {
    sessionConfig.store = new RedisStore({ client: redisClient });
}

app.use(session(sessionConfig));

// CORS configuration
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With']
}));

// Internationalization middleware - load dynamically
try {
    const { i18nMiddleware } = require('./config/i18n');
    app.use(i18nMiddleware);
} catch (error) {
    console.warn('i18n middleware not available:', error.message);
}

// Request ID middleware for tracing
app.use((req, res, next) => {
    req.id = require('crypto').randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        language: req.language
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Status endpoint with system information
app.get('/api/status', async (req, res) => {
    try {
        const status = {
            server: 'running',
            database: 'connected',
            redis: redisClient && redisClient.isOpen ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(status);
    } catch (error) {
        logger.error('Status check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Status check failed'
        });
    }
});

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Multilingual Real Estate CRM API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', route);

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Join user to their room for personal notifications
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        logger.info(`User ${userId} joined their room`);
    });
    
    // Handle property views in real-time
    socket.on('property-view', (data) => {
        socket.to(`property-${data.propertyId}`).emit('property-view-update', {
            propertyId: data.propertyId,
            viewCount: data.viewCount,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle chat messages
    socket.on('chat-message', (data) => {
        socket.to(`chat-${data.chatId}`).emit('new-message', {
            message: data.message,
            sender: data.sender,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle property inquiries
    socket.on('property-inquiry', (data) => {
        socket.to(`agent-${data.agentId}`).emit('new-inquiry', {
            propertyId: data.propertyId,
            buyerId: data.buyerId,
            message: data.message,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        requestId: req.id,
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });
    
    res.status(err.status || 500).json({
        error: {
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
            requestId: req.id,
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            requestId: req.id,
            timestamp: new Date().toISOString()
        }
    });
});

// Scheduled tasks (only if not in serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.RAILWAY_DEPLOYMENT) {
    cron.schedule('0 0 * * *', async () => {
        // Daily cleanup tasks
        logger.info('Running daily cleanup tasks');
        
        try {
            // Clean up expired reservations
            const Property = require('./model/schema/property');
            await Property.updateMany(
                {
                    status: 'reserved',
                    'reservationDetails.reservationExpiry': { $lt: new Date() }
                },
                {
                    $set: { status: 'available' },
                    $unset: { reservationDetails: 1 }
                }
            );
            
            // Clean up old logs (keep last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            try {
                const AiInteraction = require('./model/schema/aiInteraction');
                await AiInteraction.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
                
                const IntegrationLog = require('./model/schema/integrationLog');
                await IntegrationLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
            } catch (cleanupError) {
                logger.warn('Cleanup of AI logs failed:', cleanupError.message);
            }
            
            logger.info('Daily cleanup completed');
        } catch (error) {
            logger.error('Daily cleanup failed:', error);
        }
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    server.close(() => {
        logger.info('HTTP server closed');
        
        if (redisClient && redisClient.isOpen) {
            redisClient.quit(() => {
                logger.info('Redis client closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    
    server.close(() => {
        logger.info('HTTP server closed');
        
        if (redisClient && redisClient.isOpen) {
            redisClient.quit(() => {
                logger.info('Redis client closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
server.listen(port, () => {
    const protocol = (process.env.HTTPS === 'true' || process.env.NODE_ENV === 'production') ? 'https' : 'http';
    const host = process.env.HOST || '0.0.0.0';
    
    logger.info(`Server started successfully`, {
        url: `${protocol}://${host}:${port}`,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
    
    console.log(`🚀 Server listening at ${protocol}://${host}:${port}/`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origin: ${corsOrigin}`);
    console.log(`💾 Database: ${dbName}`);
    console.log(`🔴 Redis: ${redisUrl}`);
});

// Connect to MongoDB
db(mongoUrl, dbName);

// Export for testing
module.exports = { app, server, io, redisClient };
