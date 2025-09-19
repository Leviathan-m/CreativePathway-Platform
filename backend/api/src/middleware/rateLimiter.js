const rateLimit = require('express-rate-limit');

// General API rate limiter
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests from this IP, please try again later.') => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: message,
                retryAfter: Math.ceil(windowMs / 1000),
                timestamp: new Date().toISOString()
            });
        }
    });
};

// API endpoints rate limiter (stricter)
const apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'API rate limit exceeded. Please try again later.'
);

// Behavioral data specific rate limiter (more lenient for data collection)
const behavioralDataLimiter = createRateLimit(
    60 * 1000, // 1 minute
    30, // limit each IP to 30 behavioral data submissions per minute
    'Behavioral data submission rate limit exceeded.'
);

// Health check rate limiter (very lenient)
const healthLimiter = createRateLimit(
    60 * 1000, // 1 minute
    60, // allow more health checks
    'Health check rate limit exceeded.'
);

module.exports = {
    createRateLimit,
    apiLimiter,
    behavioralDataLimiter,
    healthLimiter
};
