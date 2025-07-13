const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

// Configuration for i18next
const i18nConfig = {
    backend: {
        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json')
    },
    
    // Language detection
    detection: {
        order: ['header', 'querystring', 'cookie', 'session'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupSession: 'lng',
        lookupFromPathIndex: 0,
        lookupFromSubdomainIndex: 0,
        caches: ['cookie'],
        cookieSecure: process.env.NODE_ENV === 'production',
        cookieExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
    
    // Fallback configuration
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es', 'ru'],
    nonExplicitSupportedLngs: true,
    
    // Namespace configuration
    ns: ['common', 'errors', 'validation', 'properties', 'projects', 'users', 'ai', 'integrations'],
    defaultNS: 'common',
    
    // Interpolation
    interpolation: {
        escapeValue: false,
        formatSeparator: ',',
        format: function(value, format, lng) {
            if (format === 'uppercase') return value.toUpperCase();
            if (format === 'lowercase') return value.toLowerCase();
            if (format === 'currency') {
                const currencies = {
                    'en': 'USD',
                    'pt-BR': 'BRL',
                    'es': 'EUR',
                    'ru': 'RUB'
                };
                const currency = currencies[lng] || 'USD';
                return new Intl.NumberFormat(lng, {
                    style: 'currency',
                    currency: currency
                }).format(value);
            }
            if (format === 'date') {
                return new Intl.DateTimeFormat(lng).format(new Date(value));
            }
            if (format === 'datetime') {
                return new Intl.DateTimeFormat(lng, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(new Date(value));
            }
            return value;
        }
    },
    
    // Debug and development
    debug: process.env.NODE_ENV === 'development',
    
    // React options (for consistent behavior)
    react: {
        useSuspense: false,
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '',
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'b', 'u', 'span', 'p', 'div']
    },
    
    // Performance optimizations
    preload: ['en', 'pt-BR', 'es', 'ru'],
    cleanCode: true,
    
    // Key separator and nesting
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Missing keys handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: function(lng, ns, key, fallbackValue) {
        console.warn(`Missing translation: ${lng}.${ns}.${key}`);
    },
    
    // Postprocessing
    postProcess: ['interval', 'plural'],
    
    // Resources (can be loaded dynamically)
    resources: {
        en: {
            common: require('../locales/en/common.json'),
            errors: require('../locales/en/errors.json'),
            validation: require('../locales/en/validation.json'),
            properties: require('../locales/en/properties.json'),
            projects: require('../locales/en/projects.json'),
            users: require('../locales/en/users.json'),
            ai: require('../locales/en/ai.json'),
            integrations: require('../locales/en/integrations.json')
        }
    }
};

// Initialize i18next
i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init(i18nConfig);

// Currency mapping
const currencyMap = {
    'en': 'USD',
    'pt-BR': 'BRL',
    'es': 'EUR',
    'ru': 'RUB'
};

// Helper functions
const i18nHelpers = {
    // Get currency for language
    getCurrency: (language) => currencyMap[language] || 'USD',
    
    // Format currency
    formatCurrency: (amount, language) => {
        const currency = currencyMap[language] || 'USD';
        return new Intl.NumberFormat(language, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    // Format date
    formatDate: (date, language, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(new Date(date));
    },
    
    // Format number
    formatNumber: (number, language) => {
        return new Intl.NumberFormat(language).format(number);
    },
    
    // Get localized property status
    getPropertyStatus: (status, language) => {
        const statusMap = {
            'available': {
                'en': 'Available',
                'pt-BR': 'Disponível',
                'es': 'Disponible',
                'ru': 'Доступен'
            },
            'reserved': {
                'en': 'Reserved',
                'pt-BR': 'Reservado',
                'es': 'Reservado',
                'ru': 'Зарезервирован'
            },
            'sold': {
                'en': 'Sold',
                'pt-BR': 'Vendido',
                'es': 'Vendido',
                'ru': 'Продан'
            },
            'under_construction': {
                'en': 'Under Construction',
                'pt-BR': 'Em Construção',
                'es': 'En Construcción',
                'ru': 'Строится'
            }
        };
        return statusMap[status]?.[language] || statusMap[status]?.['en'] || status;
    },
    
    // Get localized construction stage
    getConstructionStage: (stage, language) => {
        const stageMap = {
            'planning': {
                'en': 'Planning',
                'pt-BR': 'Planejamento',
                'es': 'Planificación',
                'ru': 'Планирование'
            },
            'excavation': {
                'en': 'Excavation',
                'pt-BR': 'Escavação',
                'es': 'Excavación',
                'ru': 'Раскопки'
            },
            'foundation': {
                'en': 'Foundation',
                'pt-BR': 'Fundação',
                'es': 'Fundación',
                'ru': 'Фундамент'
            },
            'walls': {
                'en': 'Walls',
                'pt-BR': 'Paredes',
                'es': 'Paredes',
                'ru': 'Стены'
            },
            'roofing': {
                'en': 'Roofing',
                'pt-BR': 'Telhado',
                'es': 'Techado',
                'ru': 'Кровля'
            },
            'finishing': {
                'en': 'Finishing',
                'pt-BR': 'Acabamento',
                'es': 'Acabado',
                'ru': 'Отделка'
            },
            'completed': {
                'en': 'Completed',
                'pt-BR': 'Concluído',
                'es': 'Completado',
                'ru': 'Завершено'
            }
        };
        return stageMap[stage]?.[language] || stageMap[stage]?.['en'] || stage;
    },
    
    // Get RTL direction for language
    getDirection: (language) => {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    },
    
    // Get timezone for language/country
    getTimezone: (language) => {
        const timezoneMap = {
            'en': 'America/New_York',
            'pt-BR': 'America/Sao_Paulo',
            'es': 'Europe/Madrid',
            'ru': 'Europe/Moscow'
        };
        return timezoneMap[language] || 'UTC';
    }
};

// Middleware for Express
const i18nMiddleware = middleware.handle(i18next, {
    ignoreRoutes: ['/api/health', '/api/status'],
    removeLngFromUrl: false
});

module.exports = {
    i18next,
    i18nConfig,
    i18nHelpers,
    i18nMiddleware,
    currencyMap
};