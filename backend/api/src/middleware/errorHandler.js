const { logError } = require('../utils/logger');

// Custom error classes
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
    }
}

class RateLimitError extends Error {
    constructor(message = 'Rate limit exceeded') {
        super(message);
        this.name = 'RateLimitError';
        this.statusCode = 429;
    }
}

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log the error
    logError(err, req, {
        userId: req.body?.userId || 'anonymous',
        endpoint: `${req.method} ${req.path}`,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            type: err.name || 'InternalServerError',
            message: getErrorMessage(err, statusCode),
            timestamp: new Date().toISOString()
        }
    };

    // Add additional error details for development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.stack = err.stack;
        if (err.details) {
            errorResponse.error.details = err.details;
        }
    }

    // Add retry information for rate limiting
    if (err.name === 'RateLimitError') {
        errorResponse.error.retryAfter = err.retryAfter || 60;
    }

    res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError('Endpoint');
    error.statusCode = 404;
    next(error);
};

// Get appropriate error message based on environment and error type
function getErrorMessage(err, statusCode) {
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        return 'Internal server error';
    }

    // Return the original error message
    return err.message || 'An error occurred';
}

// Graceful shutdown handler
const gracefulShutdown = (server, signal) => {
    console.log(`\n🚨 Received ${signal}. Starting graceful shutdown...`);

    server.close((err) => {
        if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
        }

        console.log('✅ Server closed successfully');
        process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

module.exports = {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    asyncHandler,
    errorHandler,
    notFoundHandler,
    gracefulShutdown
};
