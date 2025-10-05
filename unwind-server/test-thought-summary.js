const { processOverthinkingEntry } = require('./llm/services/overthinkingService');

async function testThoughtSummary() {
  console.log('🧪 Testing thought summary generation...\n');

  const testInput = "I can't stop thinking about this job interview tomorrow and I'm so nervous. What if I don't know the answers? What if they think I'm not qualified? What if I stutter or say something stupid? Maybe I should just cancel it. But then I'll never get a better job and I'll be stuck here forever. My family will be disappointed in me. I should have prepared more. Why didn't I start preparing earlier? I'm such a procrastinator and now I'm going to fail this interview and ruin my life...";

  console.log('📝 Raw input:', testInput);
  console.log('📏 Raw input length:', testInput.length);
  console.log('\n⚙️ Processing with AI...\n');

  try {
    const result = await processOverthinkingEntry(testInput);
    
    console.log('✅ AI Processing Results:');
    console.log('=====================================');
    console.log('💭 Thought Summary:', result.thought_summary);
    console.log('📏 Summary length:', result.thought_summary?.length || 0);
    console.log('\n📋 Other AI fields:');
    console.log('- Category:', result.category);
    console.log('- Intensity:', result.intensity);
    console.log('- Solution:', result.solution);
    console.log('- Triggers:', result.triggers);
    console.log('- Patterns:', result.patterns);
    console.log('- Coping strategies:', result.coping_strategies);
    console.log('- Reframe:', result.reframe);
    console.log('- Urgency:', result.urgency);
    
    console.log('\n✅ SUCCESS: Thought summary generated successfully!');
    console.log(`📊 Compression ratio: ${Math.round((result.thought_summary?.length / testInput.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testThoughtSummary();