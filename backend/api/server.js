const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        research: 'Park et al. (2017) Implementation'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'CreativePathway API Documentation',
        version: '1.0.0',
        description: 'Real-time learning analytics API based on Park et al. (2017) research',
        endpoints: {
            'GET /health': 'Health check',
            'GET /api/docs': 'API documentation'
        },
        research_basis: {
            paper: 'Park, J., Kim, M., & Jang, S. (2017). Analysis of Factors Influencing Creative Personality of Elementary School Students'
        }
    });
});

// Basic behavioral data endpoint
app.post('/api/v1/behavioral-data', (req, res) => {
    const { userId, type, data } = req.body;
    console.log(`Received behavioral data for user ${userId}, type: ${type}`);

    res.json({
        success: true,
        message: 'Behavioral data received',
        data: { userId, type, timestamp: new Date().toISOString() }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 CreativePathway API Server Started!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Research: Park et al. (2017) Implementation`);
    console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;