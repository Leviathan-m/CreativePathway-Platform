const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.colorize({ all: true })
);

// Define which transports the logger must use
const transports = [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
    }),
];

// If we're not in production then log to the console with colors
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
                winston.format.errors({ stack: true }),
                winston.format.colorize({ all: true }),
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}`
                )
            )
        })
    );
}

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
});

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Custom request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.body?.userId || 'anonymous'
        };

        if (res.statusCode >= 400) {
            logger.warn('Request completed with error', logData);
        } else {
            logger.info('Request completed', logData);
        }
    });

    next();
};

// Error logging function
const logError = (error, req = null, additionalData = {}) => {
    const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        ...additionalData
    };

    if (req) {
        errorData.method = req.method;
        errorData.url = req.url;
        errorData.ip = req.ip;
        errorData.userId = req.body?.userId || 'anonymous';
    }

    logger.error('Application error occurred', errorData);
};

// Security event logging
const logSecurity = (event, data = {}) => {
    logger.warn('Security event detected', {
        event,
        timestamp: new Date().toISOString(),
        ...data
    });
};

// Performance logging
const logPerformance = (operation, duration, data = {}) => {
    logger.info('Performance measurement', {
        operation,
        duration: `${duration}ms`,
        ...data
    });
};

module.exports = {
    logger,
    requestLogger,
    logError,
    logSecurity,
    logPerformance
};
