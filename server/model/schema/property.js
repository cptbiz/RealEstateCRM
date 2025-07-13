const mongoose = require("mongoose");

// Enhanced property schema for multilingual real estate CRM
const propertySchema = new mongoose.Schema({
    // Project and ownership references
    projectId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
        required: true
    },
    
    developerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Property identification
    propertyNumber: { type: String, required: true },
    unitNumber: { type: String },
    
    // Property type and classification
    propertyType: {
        type: String,
        enum: ['apartment', 'house', 'villa', 'townhouse', 'studio', 'penthouse', 'commercial', 'land'],
        required: true
    },
    
    // Property specifications
    specifications: {
        totalArea: { type: Number, required: true }, // in square meters
        livingArea: { type: Number },
        kitchenArea: { type: Number },
        balconyArea: { type: Number },
        bedrooms: { type: Number, required: true },
        bathrooms: { type: Number, required: true },
        halfBathrooms: { type: Number, default: 0 },
        floor: { type: Number },
        totalFloors: { type: Number },
        ceilingHeight: { type: Number },
        yearBuilt: { type: Number },
        facing: { type: String }, // 'north', 'south', 'east', 'west'
        view: [{ type: String }], // 'sea', 'mountain', 'city', 'garden'
        furnished: { type: Boolean, default: false },
        petFriendly: { type: Boolean, default: false }
    },
    
    // Location within project
    location: {
        building: { type: String },
        floor: { type: Number },
        position: { type: String }, // 'corner', 'middle', 'end'
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
    
    // Pricing information
    pricing: {
        totalPrice: { type: Number, required: true },
        pricePerSqm: { type: Number, required: true },
        currency: { 
            type: String, 
            enum: ['USD', 'BRL', 'EUR', 'RUB'],
            default: 'USD' 
        },
        discountPercentage: { type: Number, default: 0 },
        finalPrice: { type: Number },
        paymentPlan: {
            downPayment: { type: Number },
            installments: { type: Number },
            installmentAmount: { type: Number },
            monthlyPayment: { type: Number }
        }
    },
    
    // Property features and amenities
    features: {
        interior: [{ type: String }], // 'hardwood_floors', 'marble_counters', 'built_in_wardrobe'
        exterior: [{ type: String }], // 'balcony', 'terrace', 'garden', 'parking'
        appliances: [{ type: String }], // 'dishwasher', 'washing_machine', 'ac'
        security: [{ type: String }], // 'security_system', 'gated_community', 'doorman'
        utilities: [{ type: String }] // 'heating', 'cooling', 'fiber_internet'
    },
    
    // Property status and availability
    status: {
        type: String,
        enum: ['available', 'reserved', 'sold', 'under_construction', 'maintenance'],
        default: 'available'
    },
    
    reservationDetails: {
        reservedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        reservedDate: { type: Date },
        reservationExpiry: { type: Date },
        agentId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        agencyId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    },
    
    saleDetails: {
        soldTo: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        soldDate: { type: Date },
        salePrice: { type: Number },
        agentId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        agencyId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        commissionPaid: { type: Number }
    },
    
    // Media and documentation
    images: [{
        url: { type: String },
        type: { type: String }, // 'interior', 'exterior', 'floorplan', 'view'
        caption: {
            en: { type: String },
            'pt-BR': { type: String },
            es: { type: String },
            ru: { type: String }
        },
        isPrimary: { type: Boolean, default: false },
        uploadDate: { type: Date, default: Date.now }
    }],
    
    floorPlan: {
        image: { type: String },
        pdf: { type: String },
        dimensions: { type: String }
    },
    
    virtualTour: {
        enabled: { type: Boolean, default: false },
        url: { type: String },
        provider: { type: String }
    },
    
    // Analytics and performance
    analytics: {
        totalViews: { type: Number, default: 0 },
        totalInquiries: { type: Number, default: 0 },
        totalBookings: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        lastViewed: { type: Date }
    },
    
    // Buyer interactions
    inquiries: [{
        buyerId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        agentId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        message: { type: String },
        inquiryDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['pending', 'responded', 'closed'],
            default: 'pending'
        }
    }],
    
    // Showing appointments
    showings: [{
        buyerId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        agentId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        scheduledDate: { type: Date },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
            default: 'scheduled'
        },
        notes: { type: String }
    }],
    
    // Reviews and ratings
    reviews: [{
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewDate: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false }
    }],
    
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
    
    // Property status flags
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    
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

// Dynamic fields support
const fetchSchemaFields = async () => {
    const CustomFieldModel = mongoose.model("CustomField");
    return await CustomFieldModel.find({ moduleName: "Properties" });
};

// Indexes for better performance
propertySchema.index({ projectId: 1 });
propertySchema.index({ developerId: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'pricing.totalPrice': 1 });
propertySchema.index({ 'pricing.pricePerSqm': 1 });
propertySchema.index({ 'specifications.bedrooms': 1 });
propertySchema.index({ 'specifications.bathrooms': 1 });
propertySchema.index({ 'specifications.totalArea': 1 });
propertySchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });
propertySchema.index({ isActive: 1, isPublished: 1 });
propertySchema.index({ 'seoData.slug': 1 });

// Pre-save middleware
propertySchema.pre('save', function(next) {
    this.updatedDate = Date.now();
    
    // Calculate final price with discount
    if (this.pricing.discountPercentage > 0) {
        this.pricing.finalPrice = this.pricing.totalPrice * (1 - this.pricing.discountPercentage / 100);
    } else {
        this.pricing.finalPrice = this.pricing.totalPrice;
    }
    
    // Auto-generate slug if not provided
    if (!this.seoData.slug && this.propertyNumber) {
        this.seoData.slug = `property-${this.propertyNumber}-${this.projectId}`.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    next();
});

// Virtuals
propertySchema.virtual('pricePerSqmFormatted').get(function() {
    return `${this.pricing.currency} ${this.pricing.pricePerSqm.toLocaleString()}`;
});

propertySchema.virtual('totalPriceFormatted').get(function() {
    return `${this.pricing.currency} ${this.pricing.totalPrice.toLocaleString()}`;
});

propertySchema.virtual('availabilityStatus').get(function() {
    return this.status === 'available' && this.isActive && this.isPublished;
});

// Methods
propertySchema.methods.updateAnalytics = function(type) {
    switch(type) {
        case 'view':
            this.analytics.totalViews += 1;
            this.analytics.lastViewed = new Date();
            break;
        case 'inquiry':
            this.analytics.totalInquiries += 1;
            break;
        case 'booking':
            this.analytics.totalBookings += 1;
            break;
    }
    return this.save();
};

propertySchema.methods.reserve = function(buyerId, agentId, agencyId) {
    this.status = 'reserved';
    this.reservationDetails = {
        reservedBy: buyerId,
        reservedDate: new Date(),
        reservationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        agentId: agentId,
        agencyId: agencyId
    };
    return this.save();
};

propertySchema.methods.sell = function(buyerId, salePrice, agentId, agencyId, commissionPaid) {
    this.status = 'sold';
    this.saleDetails = {
        soldTo: buyerId,
        soldDate: new Date(),
        salePrice: salePrice,
        agentId: agentId,
        agencyId: agencyId,
        commissionPaid: commissionPaid
    };
    return this.save();
};

// Initialize property schema with custom fields
const initializePropertySchema = async () => {
    try {
        const customFields = await fetchSchemaFields();
        
        if (customFields && customFields.length > 0) {
            const customFieldObj = {};
            customFields.forEach(field => {
                customFieldObj[field.name] = { type: field.backendType };
                if (field.ref) {
                    customFieldObj[field.name].ref = field.ref;
                }
            });
            
            propertySchema.add(customFieldObj);
        }
    } catch (error) {
        console.error('Error initializing property schema:', error);
    }
};

module.exports = mongoose.model('Property', propertySchema, 'Properties');
module.exports.initializePropertySchema = initializePropertySchema;
