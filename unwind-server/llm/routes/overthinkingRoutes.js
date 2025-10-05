const express = require('express');
const router = express.Router();
const verifyToken = require('../../verifyToken');
const { 
  analyzeOverthinking, 
  generateSolution, 
  getPersonalizedInsights, 
  suggestTags 
} = require('../controllers/overthinkingController');

/**
 * Overthinking AI Routes
 * All routes require authentication via verifyToken middleware
 */

// Analyze overthinking pattern and provide insights
router.post('/analyze', verifyToken, analyzeOverthinking);

// Generate solution suggestions for a specific thought
router.post('/solution', verifyToken, generateSolution);

// Get personalized insights based on user's patterns
router.post('/insights', verifyToken, getPersonalizedInsights);

// Suggest tags for categorization
router.post('/suggest-tags', verifyToken, suggestTags);

module.exports = router;