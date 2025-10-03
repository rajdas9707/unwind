const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * Simplified LLM Routes
 * All routes require Firebase authentication via verifyToken middleware
 * 
 * Available endpoints:
 * - POST /ask - Main AI query functionality
 * - GET /health - Service health check
 */

// Main AI query endpoint
router.post('/ask', aiController.askAI);

// Health check endpoint
router.get('/health', aiController.healthCheck);

module.exports = router;
