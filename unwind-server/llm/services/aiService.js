const axios = require('axios');
const { LLM_CONFIG, validateConfig } = require('../config/llmConfig');
const { handleApiError, handleValidationError, handleConfigurationError, logError } = require('../utils/errorHandler');

/**
 * Simple AI Service Functions
 * Just the essential functions needed for AI queries
 */

/**
 * Query AI with a prompt
 * @param {string} prompt - The user prompt
 * @param {Object} options - Optional parameters
 * @returns {Object} AI response with metadata
 */
async function queryAI(prompt, options = {}) {
  // Validate input
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw handleValidationError('Prompt must be a non-empty string');
  }

  if (prompt.length > LLM_CONFIG.app.maxPromptLength) {
    throw handleValidationError(`Prompt too long. Maximum ${LLM_CONFIG.app.maxPromptLength} characters allowed`);
  }

  try {
    // Call Perplexity API
    const response = await callPerplexity(prompt, options);
    
    return {
      provider: 'perplexity',
      model: response.model,
      response: response.content,
      metadata: {
        tokens_used: response.tokens_used,
        response_time: response.response_time,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logError(error, 'AI Service');
    throw error;
  }
}

/**
 * Call Perplexity API directly
 * @param {string} prompt - The prompt to send
 * @param {Object} options - API options
 * @returns {Object} Raw API response
 */
async function callPerplexity(prompt, options = {}) {
  const startTime = Date.now();
  
  // Check configuration
  if (!LLM_CONFIG.api.apiKey || LLM_CONFIG.api.apiKey === 'your-api-key-here') {
    throw handleConfigurationError('PERPLEXITY_API_KEY not configured');
  }
  
  try {
    const response = await axios.post(
      `${LLM_CONFIG.api.baseUrl}/chat/completions`,
      {
        model: options.model || LLM_CONFIG.model.default,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.max_tokens || LLM_CONFIG.model.maxTokens,
        temperature: options.temperature || LLM_CONFIG.model.temperature,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${LLM_CONFIG.api.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: LLM_CONFIG.api.timeout
      }
    );

    const responseTime = Date.now() - startTime;
    const result = response.data;

    return {
      content: result.choices[0]?.message?.content || 'No response received',
      tokens_used: result.usage?.total_tokens,
      response_time: responseTime,
      model: result.model
    };
  } catch (error) {
    throw handleApiError(error, 'Perplexity API');
  }
}

/**
 * Check if the AI service is working
 * @returns {Object} Health status
 */
async function checkHealth() {
  // First check configuration
  const validation = validateConfig();
  
  if (!validation.success) {
    return {
      status: 'unhealthy',
      provider: 'perplexity',
      working: false,
      errors: validation.errors
    };
  }

  // Try a simple API call
  try {
    const result = await queryAI('Hello', { max_tokens: 5 });
    
    return {
      status: 'healthy',
      provider: 'perplexity',
      working: true,
      response_time: result.metadata.response_time
    };
  } catch (error) {
    logError(error, 'Health Check');
    return {
      status: 'unhealthy',
      provider: 'perplexity',
      working: false,
      error: error.message
    };
  }
}

module.exports = {
  queryAI,
  checkHealth
};
