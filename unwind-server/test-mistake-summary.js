const { processMistakeEntry } = require('./llm/services/mistakeService');

async function testMistakeDescriptionSummary() {
  console.log('🧪 Testing mistake description summary generation...\n');

  const testInput = "I was rushing to finish this project report for work because I procrastinated all week and now the deadline is tomorrow morning. I didn't double check my calculations and I used the wrong data from last quarter instead of this quarter. When I submitted it to my manager, she immediately noticed the errors and now she probably thinks I'm careless and unreliable. The whole presentation to the client needs to be redone and it's making our team look unprofessional. I feel so embarrassed and stressed because this might affect my performance review...";
  
  const category = "Work/Career";
  const userLearning = "I need to manage my time better";

  console.log('📝 Raw input:', testInput);
  console.log('📏 Raw input length:', testInput.length);
  console.log('🏷️ Category:', category);
  console.log('📚 User learning:', userLearning);
  console.log('\n⚙️ Processing with AI...\n');

  try {
    const result = await processMistakeEntry(testInput, category, userLearning);
    
    console.log('✅ AI Processing Results:');
    console.log('=====================================');
    console.log('💭 Description Summary:', result.description_summary);
    console.log('📏 Summary length:', result.description_summary?.length || 0);
    console.log('\n📋 Other AI fields:');
    console.log('- Learning:', result.learning);
    console.log('- Solution:', result.solution);
    console.log('- Intensity:', result.intensity);
    
    console.log('\n✅ SUCCESS: Mistake description summary generated successfully!');
    console.log(`📊 Compression ratio: ${Math.round((result.description_summary?.length / testInput.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testMistakeDescriptionSummary();