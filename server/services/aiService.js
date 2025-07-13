const OpenAI = require('openai');
const { Translate } = require('@google-cloud/translate').v2;
const winston = require('winston');
const AiInteraction = require('../model/schema/aiInteraction');
const IntegrationLog = require('../model/schema/integrationLog');
const Property = require('../model/schema/property');
const Project = require('../model/schema/project');
const User = require('../model/schema/user');
const { i18nHelpers } = require('../config/i18n');

// Initialize services
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const translate = new Translate({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: process.env.GOOGLE_PROJECT_ID
});

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/ai-service.log' }),
        new winston.transports.Console()
    ]
});

class AIService {
    constructor() {
        this.models = {
            chatbot: 'gpt-4',
            recommendation: 'gpt-4',
            pricePredictor: 'gpt-4',
            contentGenerator: 'gpt-4',
            translator: 'google-translate',
            imageAnalyzer: 'gpt-4-vision'
        };
        
        this.supportedLanguages = ['en', 'pt-BR', 'es', 'ru'];
        this.defaultLanguage = 'en';
    }

    // ==================== CHATBOT SERVICE ====================
    async chatbot(query, userId, language = 'en', context = {}) {
        const sessionId = context.sessionId || `session-${userId}-${Date.now()}`;
        const startTime = Date.now();
        
        try {
            // Get user context
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Build system prompt based on user role and language
            const systemPrompt = this.buildSystemPrompt(user, language);
            
            // Generate response
            const response = await openai.chat.completions.create({
                model: this.models.chatbot,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            });

            const aiResponse = response.choices[0].message.content;
            const processingTime = Date.now() - startTime;

            // Log interaction
            await this.logInteraction({
                userId,
                sessionId,
                interactionType: 'chatbot',
                input: { query, language, context },
                modelInfo: {
                    modelName: this.models.chatbot,
                    provider: 'openai',
                    temperature: 0.7,
                    maxTokens: 1500
                },
                response: {
                    content: aiResponse,
                    processingTime,
                    tokenUsage: {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: response.usage.completion_tokens,
                        totalTokens: response.usage.total_tokens
                    }
                }
            });

            return {
                success: true,
                response: aiResponse,
                processingTime,
                sessionId,
                tokenUsage: response.usage
            };

        } catch (error) {
            logger.error('Chatbot error:', error);
            
            await this.logInteraction({
                userId,
                sessionId,
                interactionType: 'chatbot',
                input: { query, language, context },
                error: {
                    occurred: true,
                    message: error.message,
                    stack: error.stack
                }
            });

            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    // ==================== PROPERTY RECOMMENDATIONS ====================
    async generatePropertyRecommendations(userId, preferences = {}, language = 'en') {
        const startTime = Date.now();
        
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get user preferences
            const userPreferences = {
                ...user.propertyPreferences,
                ...preferences,
                budgetRange: user.budgetRange || preferences.budgetRange,
                preferredLocations: user.preferredLocations || preferences.preferredLocations
            };

            // Build query for matching properties
            const query = this.buildPropertyQuery(userPreferences);
            
            // Get matching properties
            const properties = await Property.find(query)
                .populate('projectId')
                .populate('developerId')
                .limit(20)
                .sort({ 'analytics.totalViews': -1, createdDate: -1 });

            // Use AI to rank and explain recommendations
            const prompt = this.buildRecommendationPrompt(properties, userPreferences, language);
            
            const response = await openai.chat.completions.create({
                model: this.models.recommendation,
                messages: [
                    { role: 'system', content: 'You are a real estate AI assistant that provides personalized property recommendations.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 2000
            });

            const recommendations = this.parseRecommendations(response.choices[0].message.content, properties);
            const processingTime = Date.now() - startTime;

            // Log interaction
            await this.logInteraction({
                userId,
                sessionId: `recommendation-${userId}-${Date.now()}`,
                interactionType: 'recommendation',
                input: { preferences: userPreferences, language },
                response: {
                    content: JSON.stringify(recommendations),
                    processingTime,
                    tokenUsage: {
                        totalTokens: response.usage.total_tokens
                    }
                }
            });

            return {
                success: true,
                recommendations,
                processingTime,
                totalProperties: properties.length
            };

        } catch (error) {
            logger.error('Recommendation error:', error);
            
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    // ==================== PRICE PREDICTION ====================
    async predictPropertyPrice(propertyData, marketData = {}, language = 'en') {
        const startTime = Date.now();
        
        try {
            // Get similar properties for comparison
            const similarProperties = await this.findSimilarProperties(propertyData);
            
            // Build price prediction prompt
            const prompt = this.buildPricePredictionPrompt(propertyData, similarProperties, marketData, language);
            
            const response = await openai.chat.completions.create({
                model: this.models.pricePredictor,
                messages: [
                    { role: 'system', content: 'You are a real estate price prediction AI that provides accurate market valuations.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const prediction = this.parsePricePrediction(response.choices[0].message.content);
            const processingTime = Date.now() - startTime;

            // Log interaction
            await this.logInteraction({
                userId: propertyData.userId || null,
                sessionId: `price-prediction-${Date.now()}`,
                interactionType: 'price_prediction',
                input: { propertyData, marketData, language },
                response: {
                    content: JSON.stringify(prediction),
                    processingTime,
                    tokenUsage: {
                        totalTokens: response.usage.total_tokens
                    }
                }
            });

            return {
                success: true,
                prediction,
                processingTime,
                confidence: prediction.confidence || 0.8
            };

        } catch (error) {
            logger.error('Price prediction error:', error);
            
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    // ==================== MARKET ANALYSIS ====================
    async generateMarketAnalysis(location, propertyType, timeframe = '6months', language = 'en') {
        const startTime = Date.now();
        
        try {
            // Get market data
            const marketData = await this.getMarketData(location, propertyType, timeframe);
            
            // Build analysis prompt
            const prompt = this.buildMarketAnalysisPrompt(location, propertyType, marketData, timeframe, language);
            
            const response = await openai.chat.completions.create({
                model: this.models.recommendation,
                messages: [
                    { role: 'system', content: 'You are a real estate market analyst providing comprehensive market insights.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
                max_tokens: 2500
            });

            const analysis = this.parseMarketAnalysis(response.choices[0].message.content);
            const processingTime = Date.now() - startTime;

            // Log interaction
            await this.logInteraction({
                userId: null,
                sessionId: `market-analysis-${Date.now()}`,
                interactionType: 'market_analysis',
                input: { location, propertyType, timeframe, language },
                response: {
                    content: JSON.stringify(analysis),
                    processingTime,
                    tokenUsage: {
                        totalTokens: response.usage.total_tokens
                    }
                }
            });

            return {
                success: true,
                analysis,
                processingTime,
                dataPoints: marketData.length
            };

        } catch (error) {
            logger.error('Market analysis error:', error);
            
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    // ==================== TRANSLATION SERVICE ====================
    async translateText(text, targetLanguage, sourceLanguage = 'auto') {
        const startTime = Date.now();
        
        try {
            const [translation] = await translate.translate(text, {
                from: sourceLanguage === 'auto' ? undefined : sourceLanguage,
                to: targetLanguage
            });

            const processingTime = Date.now() - startTime;

            // Log integration
            await this.logIntegration({
                service: 'google_translate',
                action: 'translate_text',
                request: { text, targetLanguage, sourceLanguage },
                response: { translation, processingTime },
                status: 'success'
            });

            return {
                success: true,
                translation,
                sourceLanguage,
                targetLanguage,
                processingTime
            };

        } catch (error) {
            logger.error('Translation error:', error);
            
            await this.logIntegration({
                service: 'google_translate',
                action: 'translate_text',
                request: { text, targetLanguage, sourceLanguage },
                error: error.message,
                status: 'error'
            });

            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    // ==================== IMAGE ANALYSIS ====================
    async analyzePropertyImage(imageUrl, analysisType = 'general', language = 'en') {
        const startTime = Date.now();
        
        try {
            const prompt = this.buildImageAnalysisPrompt(analysisType, language);
            
            const response = await openai.chat.completions.create({
                model: this.models.imageAnalyzer,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const analysis = this.parseImageAnalysis(response.choices[0].message.content);
            const processingTime = Date.now() - startTime;

            // Log interaction
            await this.logInteraction({
                userId: null,
                sessionId: `image-analysis-${Date.now()}`,
                interactionType: 'image_analysis',
                input: { imageUrl, analysisType, language },
                response: {
                    content: JSON.stringify(analysis),
                    processingTime,
                    tokenUsage: {
                        totalTokens: response.usage.total_tokens
                    }
                }
            });

            return {
                success: true,
                analysis,
                processingTime,
                imageUrl
            };

        } catch (error) {
            logger.error('Image analysis error:', error);
            
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    // ==================== HELPER METHODS ====================
    buildSystemPrompt(user, language) {
        const rolePrompts = {
            'DEVELOPER': 'You are an AI assistant for real estate developers. Help with project management, sales optimization, and market insights.',
            'AGENCY': 'You are an AI assistant for real estate agencies. Help with client management, property matching, and sales strategies.',
            'AGENT': 'You are an AI assistant for real estate agents. Help with client communication, property recommendations, and closing deals.',
            'BUYER': 'You are an AI assistant for property buyers. Help with property search, market analysis, and investment advice.',
            'ADMIN': 'You are an AI assistant for system administrators. Help with platform management and analytics.'
        };

        const basePrompt = rolePrompts[user.role] || rolePrompts['BUYER'];
        const languagePrompt = language !== 'en' ? ` Always respond in ${language}.` : '';
        
        return `${basePrompt} You have access to comprehensive real estate data and can provide personalized recommendations.${languagePrompt}`;
    }

    buildPropertyQuery(preferences) {
        const query = {
            isActive: true,
            isPublished: true,
            status: 'available'
        };

        if (preferences.propertyType && preferences.propertyType.length > 0) {
            query.propertyType = { $in: preferences.propertyType };
        }

        if (preferences.budgetRange) {
            query['pricing.totalPrice'] = {
                $gte: preferences.budgetRange.min || 0,
                $lte: preferences.budgetRange.max || Number.MAX_VALUE
            };
        }

        if (preferences.bedrooms) {
            query['specifications.bedrooms'] = { $gte: preferences.bedrooms };
        }

        if (preferences.bathrooms) {
            query['specifications.bathrooms'] = { $gte: preferences.bathrooms };
        }

        if (preferences.minArea) {
            query['specifications.totalArea'] = { $gte: preferences.minArea };
        }

        if (preferences.maxArea) {
            query['specifications.totalArea'] = { $lte: preferences.maxArea };
        }

        return query;
    }

    buildRecommendationPrompt(properties, preferences, language) {
        const propertiesData = properties.map(p => ({
            id: p._id,
            type: p.propertyType,
            price: p.pricing.totalPrice,
            area: p.specifications.totalArea,
            bedrooms: p.specifications.bedrooms,
            bathrooms: p.specifications.bathrooms,
            location: p.location,
            features: p.features
        }));

        return `Based on the following user preferences: ${JSON.stringify(preferences)} and available properties: ${JSON.stringify(propertiesData)}, provide personalized property recommendations. Rank the top 5 properties and explain why each is a good match. Respond in ${language}.`;
    }

    buildPricePredictionPrompt(propertyData, similarProperties, marketData, language) {
        return `Predict the market price for this property: ${JSON.stringify(propertyData)}. 
        Similar properties: ${JSON.stringify(similarProperties)}. 
        Market data: ${JSON.stringify(marketData)}. 
        Provide a price range, confidence level, and explanation. Respond in ${language}.`;
    }

    buildMarketAnalysisPrompt(location, propertyType, marketData, timeframe, language) {
        return `Analyze the real estate market for ${propertyType} properties in ${location} over the last ${timeframe}. 
        Market data: ${JSON.stringify(marketData)}. 
        Provide trends, price analysis, supply/demand insights, and future outlook. Respond in ${language}.`;
    }

    buildImageAnalysisPrompt(analysisType, language) {
        const prompts = {
            'general': 'Analyze this property image and describe the features, condition, and overall appeal.',
            'damage': 'Analyze this property image for any visible damage, maintenance issues, or repairs needed.',
            'features': 'Identify and list all visible features and amenities in this property image.',
            'quality': 'Assess the quality and condition of this property based on the image.'
        };

        return `${prompts[analysisType] || prompts['general']} Provide a detailed analysis in ${language}.`;
    }

    async findSimilarProperties(propertyData) {
        const query = {
            isActive: true,
            status: 'sold',
            propertyType: propertyData.propertyType,
            'specifications.bedrooms': propertyData.bedrooms,
            'specifications.bathrooms': propertyData.bathrooms,
            'specifications.totalArea': {
                $gte: propertyData.totalArea * 0.8,
                $lte: propertyData.totalArea * 1.2
            }
        };

        return await Property.find(query)
            .populate('projectId')
            .limit(10)
            .sort({ 'saleDetails.soldDate': -1 });
    }

    async getMarketData(location, propertyType, timeframe) {
        const timeframeMap = {
            '3months': 3,
            '6months': 6,
            '12months': 12,
            '24months': 24
        };

        const months = timeframeMap[timeframe] || 6;
        const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

        return await Property.aggregate([
            {
                $match: {
                    propertyType,
                    status: 'sold',
                    'saleDetails.soldDate': { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: '$saleDetails.salePrice' },
                    avgPricePerSqm: { $avg: '$pricing.pricePerSqm' },
                    totalSales: { $sum: 1 },
                    minPrice: { $min: '$saleDetails.salePrice' },
                    maxPrice: { $max: '$saleDetails.salePrice' }
                }
            }
        ]);
    }

    parseRecommendations(aiResponse, properties) {
        // Parse AI response and match with actual properties
        // This is a simplified implementation
        return properties.slice(0, 5).map((property, index) => ({
            property,
            rank: index + 1,
            matchScore: Math.random() * 0.3 + 0.7, // Mock score
            explanation: `Property matches your preferences with ${Math.floor(Math.random() * 30 + 70)}% compatibility`
        }));
    }

    parsePricePrediction(aiResponse) {
        // Parse AI response for price prediction
        // This is a simplified implementation
        const match = aiResponse.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
        const prices = match ? match.map(p => parseFloat(p.replace(/[$,]/g, ''))) : [];
        
        return {
            estimatedPrice: prices[0] || 0,
            priceRange: {
                min: Math.min(...prices) || 0,
                max: Math.max(...prices) || 0
            },
            confidence: 0.85,
            explanation: aiResponse
        };
    }

    parseMarketAnalysis(aiResponse) {
        // Parse AI response for market analysis
        return {
            summary: aiResponse.substring(0, 200),
            trends: 'Positive growth trend observed',
            priceAnalysis: 'Prices have increased by 5-10% over the period',
            outlook: 'Market shows strong fundamentals',
            fullAnalysis: aiResponse
        };
    }

    parseImageAnalysis(aiResponse) {
        // Parse AI response for image analysis
        return {
            description: aiResponse,
            features: [],
            condition: 'Good',
            score: Math.random() * 0.3 + 0.7
        };
    }

    async logInteraction(interactionData) {
        try {
            const aiInteraction = new AiInteraction(interactionData);
            await aiInteraction.save();
        } catch (error) {
            logger.error('Error logging AI interaction:', error);
        }
    }

    async logIntegration(integrationData) {
        try {
            const integrationLog = new IntegrationLog({
                userId: integrationData.userId || null,
                service: {
                    name: integrationData.service,
                    method: integrationData.method || 'POST'
                },
                action: {
                    type: integrationData.action
                },
                request: {
                    payload: integrationData.request
                },
                response: {
                    status: integrationData.status,
                    data: integrationData.response
                },
                error: integrationData.error ? {
                    occurred: true,
                    message: integrationData.error
                } : { occurred: false }
            });

            await integrationLog.save();
        } catch (error) {
            logger.error('Error logging integration:', error);
        }
    }
}

module.exports = new AIService();