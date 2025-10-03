/**
 * Simple test script for LLM service
 * Run this to verify everything is working
 */

const { queryAI, checkHealth } = require('./llm/services/aiService');

async function testLLMService() {
  console.log('🧪 Testing LLM Service...\n');

  // Test 1: Health check
  console.log('1. Testing health check...');
  try {
    const health = await checkHealth();
    console.log('✅ Health check passed:', {
      status: health.status,
      working: health.working,
      provider: health.provider
    });
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('\n2. Testing AI query...');
  
  // Test 2: Simple query (only if health check passes)
  try {
    const response = await queryAI('Hello, how are you?', { 
      max_tokens: 20,
      temperature: 0.5 
    });
    
    console.log('✅ AI query successful:');
    console.log('Response:', response.response);
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Tokens used:', response.metadata.tokens_used);
    console.log('Response time:', response.metadata.response_time + 'ms');
  } catch (error) {
    console.log('❌ AI query failed:', error.message);
    
    if (error.message.includes('not configured')) {
      console.log('\n💡 Make sure to set PERPLEXITY_API_KEY in your .env file');
    }
  }

  console.log('\n🎉 Test complete!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLLMService().catch(console.error);
}

module.exports = testLLMService;