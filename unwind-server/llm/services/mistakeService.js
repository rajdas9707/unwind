const { queryAI } = require('./aiService');
const { logError } = require('../utils/errorHandler');

/**
 * AI-powered Mistake Processing Service
 * Generates learning insights, solutions, and intensity ratings for mistakes
 */

/**
 * Process mistake entry with AI analysis
 * @param {string} description - The mistake description (required)
 * @param {string} category - The mistake category (required)
 * @param {string} userLearning - Optional learning provided by user
 * @returns {Object} Processed mistake data with AI-generated fields
 */
async function processMistakeEntry(description, category, userLearning = '') {
  if (!description || !description.trim()) {
    throw new Error('Mistake description is required');
  }

  if (!category || !category.trim()) {
    throw new Error('Mistake category is required');
  }

  try {
    // Create comprehensive prompt for AI processing
    const analysisPrompt = `
Analyze this mistake and provide the requested information:

Mistake Description: "${description}"
Category: ${category}
${userLearning ? `User's Initial Learning: "${userLearning}"` : 'User provided no initial learning.'}

Please provide a JSON response with the following structure:
{
  "description_summary": "1-2 sentence summary (max 40 words). Concisely describe what went wrong without judgment.",
  "learning": "Meaningful insight gained (build upon user's input if provided). Keep under 25 words.",
  "solution": "Clear, actionable step(s) to avoid or handle this mistake better next time. Max 30 words.",
  "intensity": "1-10 number based on impact: 
                1-3 = minor issue, small effect; 
                4-6 = moderate mistake, noticeable impact; 
                7-10 = major or recurring issue with strong emotional or practical effect."
}

Keep responses growth-oriented, short, and specific.
Respond ONLY with valid JSON in the exact format specified above.
    `.trim();

    const aiResponse = await queryAI(analysisPrompt, {
      max_tokens: 400,
      temperature: 0.7
    });

    // Parse the AI response
    let parsedResponse;
    try {
      // Clean the response to extract JSON
      const cleanResponse = aiResponse.response
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();
      
      parsedResponse = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, using fallback:', aiResponse.response);
      
      // Fallback parsing - extract values manually if JSON parsing fails
      const response = aiResponse.response;
      
      // Extract intensity
      const intensityMatch = response.match(/intensity["']?\s*:\s*["']?(\d+)/i);
      const intensity = intensityMatch ? parseInt(intensityMatch[1]) : 5;
      
      // Split response into sections for learning and solution
      const sections = response.split(/solution|learning/i);
      
      parsedResponse = {
        description_summary: 'Made an error that provides learning opportunities for improvement.',
        learning: userLearning || 'This experience provides valuable insights for future growth and decision-making.',
        solution: 'Take time to reflect on this experience and consider how to approach similar situations differently in the future.',
        intensity: Math.min(Math.max(intensity, 1), 10)
      };
    }

    // Validate and sanitize the response
    const processedData = {
      description_summary: parsedResponse.description_summary || 'Encountered a situation that resulted in a mistake with learning potential.',
      learning: parsedResponse.learning || userLearning || 'Every mistake is an opportunity to learn and grow.',
      solution: parsedResponse.solution || 'Reflect on this experience and create a plan to handle similar situations better in the future.',
      intensity: validateIntensity(parsedResponse.intensity)
    };

    console.log(`[Mistake Service] Processed entry - Category: ${category}, Intensity: ${processedData.intensity}`);
    
    return processedData;

  } catch (error) {
    logError(error, 'Mistake Processing Service');
    
    // Return fallback values if AI processing fails
    return {
      description_summary: 'Made a mistake that provides opportunities for learning and growth.',
      learning: userLearning || 'This mistake offers valuable learning opportunities for personal growth.',
      solution: 'Take time to analyze what led to this mistake and develop strategies to prevent similar issues in the future.',
      intensity: 5
    };
  }
}

/**
 * Validate and normalize intensity
 * @param {number|string} intensity 
 * @returns {number} Valid intensity (1-10)
 */
function validateIntensity(intensity) {
  const numericIntensity = typeof intensity === 'string' ? parseInt(intensity) : intensity;
  
  if (isNaN(numericIntensity)) {
    return 5; // Default to moderate intensity
  }
  
  return Math.min(Math.max(Math.round(numericIntensity), 1), 10);
}

/**
 * Validate mistake category
 * @param {string} category 
 * @returns {boolean} Whether category is valid
 */
function validateCategory(category) {
  const validCategories = [
    'Work/Career',
    'Relationships', 
    'Health',
    'Finance',
    'Personal Growth',
    'Communication',
    'Time Management',
    'Decision Making',
    'Other'
  ];
  
  return validCategories.includes(category);
}

/**
 * Generate enhanced learning based on existing entry
 * @param {string} description - The mistake description
 * @param {string} category - The mistake category
 * @param {string} currentLearning - Current learning in DB
 * @returns {Object} Enhanced learning
 */
async function enhanceLearning(description, category, currentLearning = '') {
  try {
    const enhancementPrompt = `
Expand and enhance the learning insights for this mistake:

Mistake: "${description}"
Category: ${category}
Current Learning: "${currentLearning}"

Please provide deeper insights and additional lessons that can be learned from this mistake. 
Build upon the current learning if it exists, adding:
- Root cause analysis
- Patterns to watch for
- Broader life lessons
- Preventive mindset shifts

Keep the response thoughtful and growth-focused (max 200 words).
    `.trim();

    const aiResponse = await queryAI(enhancementPrompt, {
      max_tokens: 250,
      temperature: 0.6
    });

    return {
      learning: aiResponse.response
    };

  } catch (error) {
    logError(error, 'Learning Enhancement Service');
    return {
      learning: currentLearning || 'This experience provides valuable insights for future growth and better decision-making.'
    };
  }
}

module.exports = {
  processMistakeEntry,
  enhanceLearning,
  validateIntensity,
  validateCategory
};