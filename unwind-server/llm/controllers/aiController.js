const { queryAI, checkHealth } = require('../services/aiService');
const { getConfig } = require('../config/llmConfig');
const { toHttpResponse, logError } = require('../utils/errorHandler');

/**
 * Simple AI Controller Functions
 * Just the essential request handlers
 */

/**
 * Handle AI query requests
 * POST /api/llm/ask
 */
async function askAI(req, res) {
  try {
    const { prompt, options = {} } = req.body;
    const userId = req.user?.uid;

    console.log(`[LLM] AI query from user ${userId} - prompt length: ${prompt?.length || 0}`);

    const aiResponse = await queryAI(prompt, options);

    res.json({
      success: true,
      response: aiResponse.response,
      provider: aiResponse.provider,
      model: aiResponse.model,
      metadata: {
        ...aiResponse.metadata,
        userId: userId
      }
    });
  } catch (error) {
    logError(error, 'AI Controller');
    const errorResponse = toHttpResponse(error);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * Health check endpoint for the LLM service
 * GET /api/llm/health
 */
async function healthCheck(req, res) {
  try {
    const aiHealth = await checkHealth();
    const config = getConfig();
    
    res.json({
      status: 'running',
      ai_service: aiHealth,
      config: {
        model: config.model,
        api_configured: config.api.configured
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logError(error, 'Health Check');
    const errorResponse = toHttpResponse(error);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

module.exports = {
  askAI,
  healthCheck
};
