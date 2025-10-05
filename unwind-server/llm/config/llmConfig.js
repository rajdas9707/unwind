/**
 * Simple LLM Configuration
 * Just the essential settings
 */

// Main configuration object
const LLM_CONFIG = {
  api: {
    baseUrl: process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai',
    apiKey: process.env.PERPLEXITY_API_KEY,
    timeout: parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000,
  },
  model: {
    default: process.env.AI_DEFAULT_MODEL || 'sonar',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
  },
  app: {
    maxPromptLength: 4000,
  }
};

/**
 * Check if configuration is valid
 */
function validateConfig() {
  const errors = [];

  if (!LLM_CONFIG.api.apiKey) {
    errors.push('PERPLEXITY_API_KEY is not configured');
  }

  if (LLM_CONFIG.model.maxTokens <= 0) {
    errors.push('AI_MAX_TOKENS must be greater than 0');
  }

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Get safe config for external use
 */
function getConfig() {
  return {
    model: LLM_CONFIG.model,
    app: LLM_CONFIG.app,
    api: {
      baseUrl: LLM_CONFIG.api.baseUrl,
      timeout: LLM_CONFIG.api.timeout,
      configured: !!LLM_CONFIG.api.apiKey
    }
  };
}

module.exports = {
  LLM_CONFIG,
  validateConfig,
  getConfig
};
