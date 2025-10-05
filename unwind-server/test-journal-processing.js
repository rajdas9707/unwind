const { processJournalEntry } = require('./services/journalService');

async function testJournalProcessing() {
  console.log('🧪 Testing journal processing without deleted fields...\n');

  const testInput = "Had a really good day today! Started with a great workout at the gym, then had a productive meeting with my team about the new project. We made some solid progress and everyone was really engaged. Later in the evening, I had dinner with some friends and we talked about our weekend plans. The only downside was getting stuck in traffic for over an hour on the way home, which was pretty frustrating. But overall, I feel grateful for the good people in my life and excited about the project we're working on.";

  console.log('📝 Raw input:', testInput);
  console.log('📏 Raw input length:', testInput.length);
  console.log('\n⚙️ Processing with AI...\n');

  try {
    const result = await processJournalEntry(testInput);
    
    console.log('✅ AI Processing Results:');
    console.log('=====================================');
    console.log('📋 Processed Content:');
    console.log('- Summary:', result.processedContent.summary);
    console.log('- Positives:', result.processedContent.positives);
    console.log('- Negatives:', result.processedContent.negatives);
    console.log('- Lessons:', result.processedContent.lessons);
    console.log('- Intensity:', result.processedContent.intensity);
    console.log('- Rating:', result.processedContent.rating);
    
    console.log('\n🔧 AI Metadata:');
    console.log('- Error:', result.aiMetadata.error || 'None');
    console.log('- Fallback used:', result.aiMetadata.fallback_used || false);
    console.log('- Timestamp:', result.aiMetadata.timestamp);
    
    console.log('\n✅ SUCCESS: Journal processing completed successfully!');
    
    // Verify no deleted fields are present
    if (result.processedContent.mood_indicator !== undefined) {
      console.log('❌ ERROR: mood_indicator field still present!');
    } else {
      console.log('✅ GOOD: mood_indicator field properly removed');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testJournalProcessing();