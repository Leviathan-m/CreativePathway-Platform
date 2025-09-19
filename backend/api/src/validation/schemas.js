const Joi = require('joi');

// Behavioral data validation schema based on Park et al. (2017) research
const behavioralDataSchema = Joi.object({
    userId: Joi.string()
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.pattern.base': 'User ID must contain only letters, numbers, hyphens, and underscores',
            'string.min': 'User ID must be at least 3 characters long',
            'string.max': 'User ID must not exceed 50 characters'
        }),

    type: Joi.string()
        .valid('attentiveness', 'scientific_attitude', 'creativity', 'general')
        .required()
        .messages({
            'any.only': 'Type must be one of: attentiveness, scientific_attitude, creativity, general'
        }),

    data: Joi.object({
        timestamp: Joi.date().iso().required(),

        // Attentiveness metrics (AS1-AS8)
        attentiveness: Joi.object({
            focus_duration: Joi.number().min(0).max(3600000), // max 1 hour in ms
            tab_switches: Joi.number().integer().min(0).max(1000),
            scroll_events: Joi.number().integer().min(0).max(10000),
            typing_pauses: Joi.number().integer().min(0).max(10000),
            click_frequency: Joi.number().min(0).max(100),
            window_focus_time: Joi.number().min(0).max(3600000),
            distraction_events: Joi.number().integer().min(0).max(1000),
            task_completion_rate: Joi.number().min(0).max(1)
        }).min(1),

        // Scientific attitude metrics (SA1-SA9)
        scientific_attitude: Joi.object({
            hypothesis_count: Joi.number().integer().min(0).max(100),
            experiment_attempts: Joi.number().integer().min(0).max(100),
            question_frequency: Joi.number().min(0).max(100),
            observation_notes: Joi.number().integer().min(0).max(1000),
            pattern_recognition: Joi.number().min(0).max(1),
            causal_reasoning: Joi.number().min(0).max(1),
            evidence_based_decisions: Joi.number().min(0).max(1),
            critical_thinking: Joi.number().min(0).max(1),
            scientific_method_usage: Joi.number().min(0).max(1)
        }).min(1),

        // Creativity metrics (CP1-CP16)
        creativity: Joi.object({
            original_ideas: Joi.number().integer().min(0).max(100),
            divergent_thinking: Joi.number().min(0).max(1),
            convergent_thinking: Joi.number().min(0).max(1),
            creative_expression: Joi.number().min(0).max(1),
            problem_solving: Joi.number().min(0).max(1),
            innovative_solutions: Joi.number().integer().min(0).max(100),
            artistic_creation: Joi.number().min(0).max(1),
            imaginative_play: Joi.number().min(0).max(1),
            creative_risk_taking: Joi.number().min(0).max(1),
            novel_approaches: Joi.number().integer().min(0).max(100),
            aesthetic_sensitivity: Joi.number().min(0).max(1),
            creative_confidence: Joi.number().min(0).max(1),
            imaginative_visualization: Joi.number().min(0).max(1),
            creative_problem_framing: Joi.number().min(0).max(1),
            innovative_communication: Joi.number().min(0).max(1),
            creative_persistence: Joi.number().min(0).max(1)
        }).min(1),

        // General behavioral data
        general: Joi.object({
            session_duration: Joi.number().min(0).max(86400000), // max 24 hours in ms
            page_views: Joi.number().integer().min(0).max(10000),
            interactions: Joi.number().integer().min(0).max(50000),
            completion_rate: Joi.number().min(0).max(1),
            engagement_score: Joi.number().min(0).max(1)
        }).min(1)
    }).required().min(1),

    metadata: Joi.object({
        browser: Joi.string().max(100),
        platform: Joi.string().max(50),
        screen_resolution: Joi.string().pattern(/^\d+x\d+$/),
        timezone: Joi.string().max(50),
        language: Joi.string().max(10)
    }).optional()
});

// User ID validation middleware
const validateBehavioralData = (req, res, next) => {
    const { error, value } = behavioralDataSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const errorMessages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context.value
        }));

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errorMessages,
            timestamp: new Date().toISOString()
        });
    }

    req.validatedData = value;
    next();
};

module.exports = {
    behavioralDataSchema,
    validateBehavioralData
};
