const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import custom modules
const { requestLogger, logger } = require('./src/utils/logger');
const { apiLimiter, behavioralDataLimiter, healthLimiter } = require('./src/middleware/rateLimiter');
const { validateBehavioralData } = require('./src/validation/schemas');
const { errorHandler, notFoundHandler, gracefulShutdown } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP logging (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware with enhanced configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration - restrict to specific origins
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://creativepathway.org',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Request logging
app.use(requestLogger);

// Body parsing with size limits
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        // Raw body for signature verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/v1/behavioral-data', behavioralDataLimiter);
app.use('/health', healthLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        research: 'Park et al. (2017) Implementation'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'CreativePathway API Documentation',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Real-time learning analytics API based on Park et al. (2017) research',
        baseUrl: `${req.protocol}://${req.get('host')}`,
        endpoints: {
            'GET /health': 'Health check endpoint',
            'GET /api/docs': 'API documentation',
            'POST /api/v1/behavioral-data': 'Submit behavioral data'
        },
        research_basis: {
            paper: 'Park, J., Kim, M., & Jang, S. (2017). Analysis of Factors Influencing Creative Personality of Elementary School Students',
            doi: '10.5539/ies.v10n5p167',
            journal: 'International Education Studies',
            volume: 10,
            number: 5,
            pages: '167-180'
        },
        rate_limits: {
            general: '100 requests per 15 minutes',
            behavioral_data: '30 requests per minute',
            health: '60 requests per minute'
        }
    });
});

// Behavioral data endpoint with validation
app.post('/api/v1/behavioral-data', validateBehavioralData, async (req, res) => {
    try {
        const { userId, type, data, metadata } = req.validatedData;

        // Log the behavioral data submission
        logger.info('Behavioral data received', {
            userId,
            type,
            dataPoints: Object.keys(data).length,
            timestamp: data.timestamp,
            ip: req.ip
        });

        // Here you would typically save to database
        // For now, just return success response
        res.json({
            success: true,
            message: 'Behavioral data received successfully',
            data: {
                userId,
                type,
                processedAt: new Date().toISOString(),
                dataPoints: Object.keys(data).length
            },
            research_note: 'Data will be analyzed using Park et al. (2017) pathway model'
        });

    } catch (error) {
        logger.error('Error processing behavioral data', {
            error: error.message,
            userId: req.body?.userId,
            type: req.body?.type
        });
        throw error;
    }
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const server = app.listen(PORT, () => {
    console.log(`🚀 CreativePathway API Server Started!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Research: Park et al. (2017) Implementation`);
    console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
    console.log(`🚀 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`🔒 Security: Rate limiting enabled`);
    console.log(`📊 Logging: Winston logger active`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));
process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
});

module.exports = app;