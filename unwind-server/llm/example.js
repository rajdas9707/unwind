/**
 * Simple LLM Usage Example
 * Shows how to use the simplified LLM service
 */

const { queryAI, checkHealth } = require('./services/aiService');

// Example 1: Simple AI query
async function exampleQuery() {
  try {
    const response = await queryAI("What is mindfulness?", {
      max_tokens: 100,
      temperature: 0.7
    });
    
    console.log('AI Response:', response.response);
    console.log('Tokens used:', response.metadata.tokens_used);
  } catch (error) {
    console.error('Query failed:', error.message);
  }
}

// Example 2: Health check
async function exampleHealthCheck() {
  try {
    const health = await checkHealth();
    console.log('Service health:', health);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

// Run examples (uncomment to test)
// exampleQuery();
// exampleHealthCheck();

module.exports = {
  exampleQuery,
  exampleHealthCheck
};