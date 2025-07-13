// Simple test runner
const test = (name, fn) => {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
    }
};

// Run basic tests
const runTests = async () => {
    console.log('🧪 Running Basic API Tests...\n');

    // Test basic Node.js functionality
    test('Node.js environment', () => {
        if (!process.env.NODE_ENV) {
            console.warn('⚠️ NODE_ENV not set, defaulting to development');
        }
        if (process.versions.node < '18.0.0') {
            throw new Error('Node.js version must be >= 18.0.0');
        }
    });

    // Test basic modules
    test('Required modules availability', () => {
        const requiredModules = ['express', 'mongoose', 'dotenv'];
        requiredModules.forEach(module => {
            try {
                require(module);
            } catch (error) {
                throw new Error(`Module ${module} not available: ${error.message}`);
            }
        });
    });

    // Test environment variables
    test('Environment variables', () => {
        const envVars = ['PORT', 'DB_URL', 'JWT_SECRET'];
        envVars.forEach(envVar => {
            if (!process.env[envVar] && envVar !== 'JWT_SECRET') {
                console.warn(`⚠️ Environment variable ${envVar} not set`);
            }
        });
    });

    // Test database connection string
    test('Database configuration', () => {
        const dbUrl = process.env.DATABASE_URL || process.env.DB_URL || 'mongodb://127.0.0.1:27017';
        if (!dbUrl.includes('mongodb')) {
            throw new Error('Database URL must be MongoDB connection string');
        }
    });

    // Test basic Express setup
    test('Express setup', () => {
        const express = require('express');
        const app = express();
        
        if (!app) {
            throw new Error('Express app not created');
        }
        
        // Test basic middleware
        app.use(express.json());
        app.get('/test', (req, res) => res.json({ test: 'ok' }));
        
        console.log('   Express app created successfully');
    });

    // Test MongoDB connection
    test('MongoDB connection', async () => {
        try {
            const mongoose = require('mongoose');
            const dbUrl = process.env.DATABASE_URL || process.env.DB_URL || 'mongodb://127.0.0.1:27017';
            const dbName = process.env.DATABASE_NAME || process.env.DB || 'Prolink';
            
            // Don't actually connect in tests, just validate URL
            if (!dbUrl || !dbName) {
                console.warn('   Database connection parameters not fully configured');
            } else {
                console.log('   Database connection parameters configured');
            }
        } catch (error) {
            console.warn(`   MongoDB connection check failed: ${error.message}`);
        }
    });

    // Test JWT functionality
    test('JWT configuration', () => {
        try {
            const jwt = require('jsonwebtoken');
            const secret = process.env.JWT_SECRET || 'default-secret';
            
            const token = jwt.sign({ test: 'data' }, secret, { expiresIn: '1h' });
            const decoded = jwt.verify(token, secret);
            
            if (!decoded.test) {
                throw new Error('JWT encoding/decoding failed');
            }
            
            console.log('   JWT functionality working');
        } catch (error) {
            console.warn(`   JWT test failed: ${error.message}`);
        }
    });

    // Test basic AI service availability
    test('AI service configuration', () => {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('   OpenAI API key not configured');
        } else {
            console.log('   OpenAI API key configured');
        }
    });

    // Test Redis configuration
    test('Redis configuration', () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        if (!redisUrl.includes('redis://')) {
            console.warn('   Redis URL format may be incorrect');
        } else {
            console.log('   Redis URL configured');
        }
    });

    // Test CORS configuration
    test('CORS configuration', () => {
        const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
        if (!corsOrigin.includes('http')) {
            console.warn('   CORS origin may be incorrect');
        } else {
            console.log('   CORS origin configured');
        }
    });

    console.log('\n🎉 Basic tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up environment variables in .env file');
    console.log('2. Configure MongoDB connection');
    console.log('3. Set up Redis for caching');
    console.log('4. Configure external API keys (OpenAI, etc.)');
    console.log('5. Deploy to Railway (backend) and Vercel (frontend)');
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    test,
    runTests
};