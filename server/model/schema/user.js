const mongoose = require('mongoose');

// Enhanced user schema for multilingual real estate CRM
const user = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role: { 
        type: String, 
        enum: ['DEVELOPER', 'AGENCY', 'BUYER', 'ADMIN', 'AGENT'],
        default: 'BUYER' 
    },
    
    // Personal Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String },
    avatar: { type: String },
    
    // Localization Settings
    preferredLanguage: { 
        type: String, 
        enum: ['en', 'pt-BR', 'es', 'ru'],
        default: 'en' 
    },
    timezone: { type: String, default: 'UTC' },
    currency: { 
        type: String, 
        enum: ['USD', 'BRL', 'EUR', 'RUB'],
        default: 'USD' 
    },
    
    // Company Information (for DEVELOPER and AGENCY roles)
    companyName: { type: String },
    companyLicense: { type: String },
    companyAddress: { type: String },
    companyPhone: { type: String },
    companyEmail: { type: String },
    companyWebsite: { type: String },
    
    // Location Information
    country: { type: String },
    city: { type: String },
    address: { type: String },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    
    // Agency-specific fields
    agencyRating: { type: Number, default: 0 },
    agentCount: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    
    // Developer-specific fields
    projectCount: { type: Number, default: 0 },
    totalProperties: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    
    // Buyer-specific fields
    budgetRange: {
        min: { type: Number },
        max: { type: Number }
    },
    preferredLocations: [{ type: String }],
    propertyPreferences: {
        propertyType: [{ type: String }],
        bedrooms: { type: Number },
        bathrooms: { type: Number },
        minArea: { type: Number },
        maxArea: { type: Number },
        amenities: [{ type: String }]
    },
    
    // Agent-specific fields (for agents under agencies)
    agencyId: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'User' 
    },
    specialization: [{ type: String }],
    languages: [{ type: String }],
    salesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    
    // Activity tracking
    emailsent: { type: Number, default: 0 },
    textsent: { type: Number, default: 0 },
    outboundcall: { type: Number, default: 0 },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    
    // Permissions and roles
    roles: [{
        type: mongoose.Schema.ObjectId,
        ref: 'RoleAccess',
        required: true
    }],
    permissions: [{
        module: { type: String },
        actions: [{ type: String }]
    }],
    
    // AI and preferences
    aiInteractions: { type: Number, default: 0 },
    aiPreferences: {
        enableChatbot: { type: Boolean, default: true },
        enableRecommendations: { type: Boolean, default: true },
        enableAnalytics: { type: Boolean, default: true }
    },
    
    // Integration settings
    integrations: {
        whatsapp: {
            enabled: { type: Boolean, default: false },
            phoneNumber: { type: String }
        },
        telegram: {
            enabled: { type: Boolean, default: false },
            username: { type: String }
        },
        googleWorkspace: {
            enabled: { type: Boolean, default: false },
            email: { type: String }
        }
    },
    
    // Notification settings
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false }
    },
    
    // Status and verification
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    
    // Timestamps
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedDate: { type: Date }
}, {
    timestamps: true
});

// Indexes for better performance
user.index({ email: 1 });
user.index({ role: 1 });
user.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
user.index({ preferredLanguage: 1 });
user.index({ country: 1, city: 1 });
user.index({ agencyId: 1 });

// Pre-save middleware
user.pre('save', function(next) {
    this.updatedDate = Date.now();
    next();
});

// Virtual for full name
user.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for company display name
user.virtual('displayName').get(function() {
    if (this.role === 'DEVELOPER' || this.role === 'AGENCY') {
        return this.companyName || this.fullName;
    }
    return this.fullName;
});

module.exports = mongoose.model('User', user, 'User')
