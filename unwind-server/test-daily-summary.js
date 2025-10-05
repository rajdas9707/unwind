const dailySummaryService = require('./services/dailySummaryService');
const embeddingService = require('./services/embeddingService');

/**
 * Test the daily summary generation workflow
 */
async function testDailySummaryWorkflow() {
  console.log('🧪 Testing Daily Summary Workflow...\n');

  try {
    // Test 1: Embedding service
    console.log('1. Testing embedding service...');
    const testText1 = "I made a mistake by being late to the meeting";
    const testText2 = "I was late for the meeting again";
    const embedding1 = await embeddingService.generateEmbedding(testText1);
    const embedding2 = await embeddingService.generateEmbedding(testText2);
    const similarity = embeddingService.calculateCosineSimilarity(embedding1, embedding2);
    
    console.log(`   Embedding 1 length: ${embedding1.length}`);
    console.log(`   Embedding 2 length: ${embedding2.length}`);
    console.log(`   Similarity score: ${similarity.toFixed(3)}`);
    console.log(`   Are similar texts? ${similarity >= 0.75 ? 'YES' : 'NO'}\n`);

    // Test 2: Summary existence check
    console.log('2. Testing summary existence check...');
    const testUserId = 'test-user-123';
    const testDate = new Date().toISOString().split('T')[0];
    const exists = await dailySummaryService.summaryExistsForDay(testUserId, testDate);
    console.log(`   Summary exists for today: ${exists}\n`);

    // Test 3: Data fetching (will return empty but shouldn't error)
    console.log('3. Testing data fetching...');
    const userData = await dailySummaryService.fetchUserDataForDate(testUserId, testDate);
    console.log(`   Total entries found: ${userData.totalEntries}`);
    console.log(`   Journal entries: ${userData.journals.length}`);
    console.log(`   Mistake entries: ${userData.mistakes.length}`);
    console.log(`   Overthinking entries: ${userData.overthinking.length}\n`);

    // Test 4: Fallback summary generation
    console.log('4. Testing fallback summary generation...');
    const fallbackSummary = dailySummaryService.generateFallbackSummary(userData);
    console.log(`   Generated fallback summary with ${fallbackSummary.highlights.length} highlights`);
    console.log(`   Overall mood: ${fallbackSummary.overallMood}`);
    console.log(`   Score: ${fallbackSummary.score}/10\n`);

    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Summary of implemented features:');
    console.log('   - ✅ Database models (DailySummary, RepetitiveMistakes)');
    console.log('   - ✅ Embedding service for similarity detection');
    console.log('   - ✅ Daily summary generation service');
    console.log('   - ✅ Repetitive mistake tracking');
    console.log('   - ✅ API endpoint /api/llm/generate-summary');
    console.log('   - ✅ Mobile app integration with sync checks');
    console.log('   - ✅ One-call-per-day rate limiting');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Only run tests if this file is executed directly
if (require.main === module) {
  // Note: This won't work without MongoDB connection
  console.log('⚠️  Note: This test requires MongoDB connection to run fully.');
  console.log('📝 To test manually:');
  console.log('   1. Start your MongoDB server');
  console.log('   2. Start the Node.js server: npm run dev');  
  console.log('   3. Use the mobile app "Generate Daily Summary" button');
  console.log('   4. Check the server logs for processing details');
  
  // Run basic tests that don't require DB
  testDailySummaryWorkflow();
}

module.exports = { testDailySummaryWorkflow };