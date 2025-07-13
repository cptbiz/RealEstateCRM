const mongoose = require('mongoose');

// Integration logs schema for external service tracking
const integrationLogSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Integration service information
    service: {
        name: {
            type: String,
            enum: ['whatsapp', 'telegram', 'google_workspace', 'gmail', 'google_drive', 'google_calendar', 'stripe', 'aws_s3', 'cloudinary', 'twilio', 'openai', 'google_maps', 'google_translate'],
            required: true
        },
        version: { type: String },
        endpoint: { type: String },
        method: { type: String } // GET, POST, PUT, DELETE, etc.
    },
    
    // Action details
    action: {
        type: {
            type: String,
            enum: ['send_message', 'receive_message', 'upload_file', 'download_file', 'create_event', 'update_event', 'payment_processing', 'api_call', 'webhook', 'sync_data', 'translate_text', 'generate_content', 'analyze_image', 'send_notification'],
            required: true
        },
        description: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed }
    },
    
    // Request details
    request: {
        payload: { type: mongoose.Schema.Types.Mixed },
        headers: { type: mongoose.Schema.Types.Mixed },
        params: { type: mongoose.Schema.Types.Mixed },
        size: { type: Number }, // in bytes
        timestamp: { type: Date, default: Date.now }
    },
    
    // Response details
    response: {
        status: { type: String }, // 'success', 'error', 'timeout', 'rate_limited'
        statusCode: { type: Number },
        data: { type: mongoose.Schema.Types.Mixed },
        headers: { type: mongoose.Schema.Types.Mixed },
        size: { type: Number }, // in bytes
        timestamp: { type: Date, default: Date.now }
    },
    
    // Performance metrics
    performance: {
        responseTime: { type: Number }, // in milliseconds
        retryCount: { type: Number, default: 0 },
        cacheHit: { type: Boolean, default: false },
        rateLimited: { type: Boolean, default: false }
    },
    
    // Error handling
    error: {
        occurred: { type: Boolean, default: false },
        message: { type: String },
        code: { type: String },
        stack: { type: String },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        }
    },
    
    // Business context
    businessContext: {
        propertyId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Property'
        },
        projectId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Project'
        },
        leadId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Lead'
        },
        contactId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Contact'
        },
        campaignId: { type: String },
        source: { type: String }, // 'web', 'mobile', 'api', 'webhook'
        category: { type: String } // 'marketing', 'sales', 'support', 'analytics'
    },
    
    // Integration-specific data
    integrationData: {
        // WhatsApp specific
        whatsapp: {
            phoneNumber: { type: String },
            messageId: { type: String },
            messageType: { type: String }, // 'text', 'image', 'document', 'audio'
            groupId: { type: String },
            isGroup: { type: Boolean, default: false }
        },
        
        // Telegram specific
        telegram: {
            chatId: { type: String },
            messageId: { type: String },
            messageType: { type: String },
            username: { type: String },
            isBot: { type: Boolean, default: false }
        },
        
        // Google Workspace specific
        googleWorkspace: {
            documentId: { type: String },
            eventId: { type: String },
            calendarId: { type: String },
            driveFileId: { type: String },
            sheetId: { type: String },
            emailId: { type: String }
        },
        
        // Payment specific
        payment: {
            transactionId: { type: String },
            amount: { type: Number },
            currency: { type: String },
            paymentMethod: { type: String },
            status: { type: String }
        },
        
        // AI specific
        ai: {
            modelName: { type: String },
            tokensUsed: { type: Number },
            cost: { type: Number },
            confidence: { type: Number }
        }
    },
    
    // Compliance and security
    compliance: {
        gdprProcessed: { type: Boolean, default: false },
        dataRetention: { type: Date },
        consentGiven: { type: Boolean, default: false },
        encryptionUsed: { type: Boolean, default: false }
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
integrationLogSchema.index({ userId: 1, createdAt: -1 });
integrationLogSchema.index({ 'service.name': 1, createdAt: -1 });
integrationLogSchema.index({ 'action.type': 1 });
integrationLogSchema.index({ 'response.status': 1 });
integrationLogSchema.index({ 'error.occurred': 1 });
integrationLogSchema.index({ 'businessContext.propertyId': 1 });
integrationLogSchema.index({ 'businessContext.projectId': 1 });
integrationLogSchema.index({ 'integrationData.whatsapp.phoneNumber': 1 });
integrationLogSchema.index({ 'integrationData.telegram.chatId': 1 });

// Pre-save middleware
integrationLogSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static methods for analytics
integrationLogSchema.statics.getServiceStats = async function(serviceName, startDate, endDate) {
    return await this.aggregate([
        {
            $match: {
                'service.name': serviceName,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$response.status',
                count: { $sum: 1 },
                avgResponseTime: { $avg: '$performance.responseTime' },
                totalRetries: { $sum: '$performance.retryCount' }
            }
        }
    ]);
};

integrationLogSchema.statics.getErrorReport = async function(startDate, endDate) {
    return await this.aggregate([
        {
            $match: {
                'error.occurred': true,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    service: '$service.name',
                    error: '$error.code'
                },
                count: { $sum: 1 },
                severity: { $first: '$error.severity' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

integrationLogSchema.statics.getUsageStats = async function(userId, startDate, endDate) {
    return await this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$service.name',
                totalRequests: { $sum: 1 },
                successCount: {
                    $sum: { $cond: [{ $eq: ['$response.status', 'success'] }, 1, 0] }
                },
                avgResponseTime: { $avg: '$performance.responseTime' },
                totalCost: { $sum: '$integrationData.ai.cost' }
            }
        }
    ]);
};

// Instance methods
integrationLogSchema.methods.markAsError = function(error) {
    this.error.occurred = true;
    this.error.message = error.message;
    this.error.code = error.code;
    this.error.stack = error.stack;
    this.response.status = 'error';
    return this.save();
};

integrationLogSchema.methods.recordSuccess = function(responseData) {
    this.response.status = 'success';
    this.response.data = responseData;
    this.response.timestamp = new Date();
    this.error.occurred = false;
    return this.save();
};

integrationLogSchema.methods.updatePerformanceMetrics = function(responseTime, retryCount) {
    this.performance.responseTime = responseTime;
    this.performance.retryCount = retryCount;
    return this.save();
};

module.exports = mongoose.model('IntegrationLog', integrationLogSchema, 'IntegrationLogs');