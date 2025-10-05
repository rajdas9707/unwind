const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const overthinkingRoutes = require('./overthinkingRoutes');
const verifyToken = require('../../verifyToken');

/**
 * LLM Routes
 * All routes require Firebase authentication via verifyToken middleware
 * 
 * Available endpoints:
 * - POST /ask - Main AI query functionality
 * - GET /health - Service health check
 * - /overthinking/* - Specialized overthinking AI endpoints
 */

// Main AI query endpoint (with auth)
router.post('/ask', verifyToken, aiController.askAI);

// Health check endpoint (no auth needed)
router.get('/health', aiController.healthCheck);

// Overthinking-specific AI routes
router.use('/overthinking', overthinkingRoutes);

module.exports = router;
