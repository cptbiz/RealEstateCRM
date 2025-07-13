const mongoose = require('mongoose');

// Multilingual project schema
const projectSchema = new mongoose.Schema({
    // Developer reference
    developerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Multilingual project information
    name: {
        en: { type: String, required: true },
        'pt-BR': { type: String },
        es: { type: String },
        ru: { type: String }
    },
    
    description: {
        en: { type: String },
        'pt-BR': { type: String },
        es: { type: String },
        ru: { type: String }
    },
    
    // Location and address
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        zipCode: { type: String },
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }
    },
    
    // Project status and timeline
    constructionStage: {
        type: String,
        enum: ['planning', 'excavation', 'foundation', 'walls', 'roofing', 'finishing', 'completed'],
        default: 'planning'
    },
    
    completionDate: {
        expected: { type: Date },
        actual: { type: Date }
    },
    
    startDate: { type: Date },
    
    // Project specifications
    totalUnits: { type: Number, required: true },
    availableUnits: { type: Number },
    soldUnits: { type: Number, default: 0 },
    reservedUnits: { type: Number, default: 0 },
    
    buildingHeight: { type: Number }, // number of floors
    totalArea: { type: Number }, // total project area in m²
    
    // Pricing information
    priceRange: {
        min: { type: Number },
        max: { type: Number }
    },
    
    pricePerSqm: {
        min: { type: Number },
        max: { type: Number }
    },
    
    // Project features and amenities
    amenities: [{
        name: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        category: { type: String }, // e.g., 'recreation', 'security', 'convenience'
        available: { type: Boolean, default: true }
    }],
    
    infrastructure: [{
        type: { type: String }, // e.g., 'school', 'hospital', 'shopping', 'transport'
        name: { type: String },
        distance: { type: Number }, // distance in meters
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    }],
    
    // Media and documentation
    images: [{
        url: { type: String },
        type: { type: String }, // 'exterior', 'interior', 'amenity', 'blueprint'
        caption: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        isPrimary: { type: Boolean, default: false }
    }],
    
    documents: [{
        name: { type: String },
        type: { type: String }, // 'blueprint', 'legal', 'permit', 'brochure'
        url: { type: String },
        uploadDate: { type: Date, default: Date.now }
    }],
    
    // Virtual tour and 360 images
    virtualTour: {
        enabled: { type: Boolean, default: false },
        url: { type: String },
        provider: { type: String } // 'matterport', 'custom', etc.
    },
    
    // Sales and marketing
    promotions: [{
        name: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        description: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        discountPercentage: { type: Number },
        validFrom: { type: Date },
        validTo: { type: Date },
        isActive: { type: Boolean, default: true }
    }],
    
    // Agency connections
    connectedAgencies: [{
        agencyId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        commissionRate: { type: Number },
        isActive: { type: Boolean, default: true },
        connectedDate: { type: Date, default: Date.now }
    }],
    
    // Analytics and performance
    analytics: {
        totalViews: { type: Number, default: 0 },
        totalInquiries: { type: Number, default: 0 },
        totalBookings: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 }
    },
    
    // SEO and metadata
    seoData: {
        metaTitle: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        metaDescription: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        keywords: [{ type: String }],
        slug: { type: String, unique: true }
    },
    
    // Project status
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    
    // Timestamps
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    },
    publishedDate: { type: Date },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedDate: { type: Date }
}, {
    timestamps: true
});

// Indexes for better performance
projectSchema.index({ developerId: 1 });
projectSchema.index({ 'address.coordinates.latitude': 1, 'address.coordinates.longitude': 1 });
projectSchema.index({ constructionStage: 1 });
projectSchema.index({ isActive: 1, isPublished: 1 });
projectSchema.index({ 'seoData.slug': 1 });
projectSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });

// Pre-save middleware
projectSchema.pre('save', function(next) {
    this.updatedDate = Date.now();
    
    // Auto-generate slug if not provided
    if (!this.seoData.slug && this.name.en) {
        this.seoData.slug = this.name.en.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Update available units
    this.availableUnits = this.totalUnits - this.soldUnits - this.reservedUnits;
    
    next();
});

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
    const stages = ['planning', 'excavation', 'foundation', 'walls', 'roofing', 'finishing', 'completed'];
    const currentStageIndex = stages.indexOf(this.constructionStage);
    return Math.round((currentStageIndex + 1) / stages.length * 100);
});

// Virtual for sales percentage
projectSchema.virtual('salesPercentage').get(function() {
    if (this.totalUnits === 0) return 0;
    return Math.round(this.soldUnits / this.totalUnits * 100);
});

// Method to get localized name
projectSchema.methods.getLocalizedName = function(language = 'en') {
    return this.name[language] || this.name.en;
};

// Method to get localized description
projectSchema.methods.getLocalizedDescription = function(language = 'en') {
    return this.description[language] || this.description.en;
};

module.exports = mongoose.model('Project', projectSchema, 'Projects');