const mongoose = require('mongoose');

// AI Interaction tracking schema
const aiInteractionSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Session information
    sessionId: {
        type: String,
        required: true
    },
    
    // Interaction details
    interactionType: {
        type: String,
        enum: ['chatbot', 'recommendation', 'price_prediction', 'market_analysis', 'lead_scoring', 'property_matching', 'voice_assistant', 'image_analysis'],
        required: true
    },
    
    // Input data
    input: {
        query: { type: String },
        language: { 
            type: String,
            enum: ['en', 'pt-BR', 'es', 'ru'],
            default: 'en'
        },
        context: { type: mongoose.Schema.Types.Mixed }, // Additional context data
        parameters: { type: mongoose.Schema.Types.Mixed } // Input parameters
    },
    
    // AI Model information
    modelInfo: {
        modelName: { type: String }, // e.g., 'gpt-4', 'claude', 'custom-model'
        modelVersion: { type: String },
        provider: { type: String }, // e.g., 'openai', 'anthropic', 'custom'
        temperature: { type: Number },
        maxTokens: { type: Number }
    },
    
    // Response data
    response: {
        content: { type: String },
        confidence: { type: Number }, // 0-1 confidence score
        metadata: { type: mongoose.Schema.Types.Mixed },
        processingTime: { type: Number }, // in milliseconds
        tokenUsage: {
            promptTokens: { type: Number },
            completionTokens: { type: Number },
            totalTokens: { type: Number }
        }
    },
    
    // Quality metrics
    quality: {
        userRating: { type: Number, min: 1, max: 5 }, // User feedback
        wasHelpful: { type: Boolean },
        userFeedback: { type: String },
        accuracy: { type: Number }, // System-calculated accuracy
        relevance: { type: Number }, // System-calculated relevance
        followupRequired: { type: Boolean, default: false }
    },
    
    // Business impact
    businessImpact: {
        leadGenerated: { type: Boolean, default: false },
        propertyViewed: { type: Boolean, default: false },
        inquirySent: { type: Boolean, default: false },
        bookingMade: { type: Boolean, default: false },
        conversionValue: { type: Number, default: 0 }
    },
    
    // Error handling
    error: {
        occurred: { type: Boolean, default: false },
        message: { type: String },
        code: { type: String },
        stack: { type: String }
    },
    
    // Performance metrics
    performance: {
        responseTime: { type: Number }, // in milliseconds
        cacheHit: { type: Boolean, default: false },
        retryCount: { type: Number, default: 0 }
    },
    
    // Integration context
    integration: {
        platform: { type: String }, // 'web', 'mobile', 'whatsapp', 'telegram', 'api'
        deviceType: { type: String }, // 'desktop', 'mobile', 'tablet'
        userAgent: { type: String },
        ipAddress: { type: String },
        location: {
            country: { type: String },
            city: { type: String },
            coordinates: {
                latitude: { type: Number },
                longitude: { type: Number }
            }
        }
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
aiInteractionSchema.index({ userId: 1, createdAt: -1 });
aiInteractionSchema.index({ sessionId: 1 });
aiInteractionSchema.index({ interactionType: 1, createdAt: -1 });
aiInteractionSchema.index({ 'input.language': 1 });
aiInteractionSchema.index({ 'modelInfo.modelName': 1 });
aiInteractionSchema.index({ 'quality.userRating': 1 });
aiInteractionSchema.index({ 'businessImpact.leadGenerated': 1 });
aiInteractionSchema.index({ 'integration.platform': 1 });

// Pre-save middleware
aiInteractionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static methods for analytics
aiInteractionSchema.statics.getInteractionStats = async function(userId, startDate, endDate) {
    return await this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$interactionType',
                count: { $sum: 1 },
                avgRating: { $avg: '$quality.userRating' },
                avgResponseTime: { $avg: '$performance.responseTime' },
                successRate: {
                    $avg: { $cond: [{ $eq: ['$error.occurred', false] }, 1, 0] }
                },
                conversionRate: {
                    $avg: { $cond: ['$businessImpact.leadGenerated', 1, 0] }
                }
            }
        }
    ]);
};

aiInteractionSchema.statics.getTopPerformingModels = async function(limit = 10) {
    return await this.aggregate([
        {
            $group: {
                _id: '$modelInfo.modelName',
                totalInteractions: { $sum: 1 },
                avgRating: { $avg: '$quality.userRating' },
                avgResponseTime: { $avg: '$performance.responseTime' },
                successRate: {
                    $avg: { $cond: [{ $eq: ['$error.occurred', false] }, 1, 0] }
                },
                conversionRate: {
                    $avg: { $cond: ['$businessImpact.leadGenerated', 1, 0] }
                }
            }
        },
        {
            $sort: { avgRating: -1, successRate: -1 }
        },
        {
            $limit: limit
        }
    ]);
};

aiInteractionSchema.statics.getLanguageDistribution = async function() {
    return await this.aggregate([
        {
            $group: {
                _id: '$input.language',
                count: { $sum: 1 },
                avgRating: { $avg: '$quality.userRating' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Instance methods
aiInteractionSchema.methods.markAsHelpful = function(rating, feedback) {
    this.quality.userRating = rating;
    this.quality.wasHelpful = rating >= 4;
    this.quality.userFeedback = feedback;
    return this.save();
};

aiInteractionSchema.methods.recordBusinessImpact = function(impact) {
    Object.assign(this.businessImpact, impact);
    return this.save();
};

module.exports = mongoose.model('AiInteraction', aiInteractionSchema, 'AiInteractions');