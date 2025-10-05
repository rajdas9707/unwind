const { queryAI } = require('./aiService');
const { logError } = require('../utils/errorHandler');

/**
 * AI-powered Overthinking Processing Service
 * Generates solutions, categorizes thoughts, and determines intensity levels
 */

/**
 * Process overthinking entry with AI analysis
 * @param {string} thought - The overthinking description (required)
 * @param {string} userSolution - Optional solution provided by user
 * @returns {Object} Processed overthinking data with AI-generated fields
 */
async function processOverthinkingEntry(thought, userSolution = '') {
  if (!thought || !thought.trim()) {
    throw new Error('Thought description is required');
  }

  try {
    // Create comprehensive prompt for AI processing
    const analysisPrompt = `
Analyze this overthinking pattern and provide comprehensive structured insights:

Overthinking Description: "${thought}"
${userSolution ? `User's Initial Solution: "${userSolution}"` : 'User provided no initial solution.'}

Please provide a JSON response with the following structure:
{
  "thought_summary": "A concise, professional 1-2 sentence summary of the main concern (max 100 words)",
  "solution": "A helpful, actionable solution (if user provided a solution, build upon it)",
  "category": "One of: work, relationships, health, finance, future, past, other",
  "intensity": "A number from 1-10 representing the stress/anxiety level",
  "triggers": [
    "Primary trigger or cause 1",
    "Secondary trigger 2 (if applicable)",
    "Additional trigger 3 (if applicable)"
  ],
  "patterns": [
    "Thought pattern 1 (e.g., catastrophizing, all-or-nothing thinking)",
    "Thought pattern 2 (if applicable)"
  ],
  "coping_strategies": [
    "Specific coping strategy 1",
    "Specific coping strategy 2",
    "Specific coping strategy 3 (if applicable)"
  ],
  "reframe": "A positive, realistic reframing of the overthinking thought",
  "urgency": "low|medium|high (how urgent/critical is this concern really?)"
}

Guidelines:
- Thought Summary: Concise, clean 1-2 sentence summary of the core concern. Remove rambling, make it professional.
- Solution: Practical, supportive advice. Build on user's solution if provided.
- Category: Best fitting category for the overthinking topic.
- Intensity: 1=mild worry, 5=moderate stress, 10=severe anxiety/panic.
- Triggers: 1-3 root causes or triggers that led to this overthinking.
- Patterns: 1-2 cognitive patterns (catastrophizing, rumination, etc.).
- Coping Strategies: 2-3 specific, actionable coping techniques.
- Reframe: Balanced, realistic perspective on the situation.
- Urgency: Actual urgency level of the concern (most overthinking is low urgency).
- Keep all responses concise (1-2 sentences per item).
- If arrays would be empty, use empty arrays [].

Respond ONLY with valid JSON in the exact format specified above.
    `.trim();

    const aiResponse = await queryAI(analysisPrompt, {
      max_tokens: 300,
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
      const response = aiResponse.response.toLowerCase();
      
      // Extract category
      const categoryMatch = response.match(/category["']?\s*:\s*["']?(work|relationships|health|finance|future|past|other)/);
      const category = categoryMatch ? categoryMatch[1] : 'other';
      
      // Extract intensity
      const intensityMatch = response.match(/intensity["']?\s*:\s*["']?(\d+)/);
      const intensity = intensityMatch ? parseInt(intensityMatch[1]) : 5;
      
      // Use the full response as solution if we can't parse it properly
      parsedResponse = {
        thought_summary: 'Experiencing overthinking and anxiety about a personal concern.',
        solution: aiResponse.response.replace(/category|intensity|[\{\}]/gi, '').trim() || 'Consider taking a step back and breathing deeply. Focus on what you can control in this situation.',
        category: category,
        intensity: Math.min(Math.max(intensity, 1), 10) // Ensure it's between 1-10
      };
    }

    // Validate and sanitize the response
    const processedData = {
      thought_summary: parsedResponse.thought_summary || 'Experiencing concerns and overthinking about a personal situation.',
      solution: parsedResponse.solution || 'Take a moment to breathe and focus on what you can control in this situation.',
      category: validateCategory(parsedResponse.category),
      intensity: validateIntensity(parsedResponse.intensity),
      triggers: validateArrayField(parsedResponse.triggers),
      patterns: validateArrayField(parsedResponse.patterns),
      coping_strategies: validateArrayField(parsedResponse.coping_strategies),
      reframe: parsedResponse.reframe || '',
      urgency: validateUrgency(parsedResponse.urgency)
    };

    console.log(`[Overthinking Service] Processed entry - Category: ${processedData.category}, Intensity: ${processedData.intensity}`);
    
    return processedData;

  } catch (error) {
    logError(error, 'Overthinking Processing Service');
    
    // Return fallback values if AI processing fails
    return {
      thought_summary: 'Experiencing personal concerns and overthinking patterns.',
      solution: userSolution || 'Take a moment to breathe deeply. Consider writing down your thoughts to help process them more clearly.',
      category: 'other',
      intensity: 5,
      triggers: [],
      patterns: [],
      coping_strategies: ['Take deep breaths', 'Focus on what you can control'],
      reframe: '',
      urgency: 'medium'
    };
  }
}

/**
 * Validate and normalize category
 * @param {string} category 
 * @returns {string} Valid category
 */
function validateCategory(category) {
  const validCategories = ['work', 'relationships', 'health', 'finance', 'future', 'past', 'other'];
  
  if (!category || typeof category !== 'string') {
    return 'other';
  }
  
  const normalizedCategory = category.toLowerCase().trim();
  return validCategories.includes(normalizedCategory) ? normalizedCategory : 'other';
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
 * Generate enhanced solution based on existing entry
 * @param {string} thought - The original thought
 * @param {string} currentSolution - Current solution in DB
 * @returns {Object} Enhanced solution
 */
async function enhanceSolution(thought, currentSolution = '') {
  try {
    const enhancementPrompt = `
Improve and enhance this solution for the overthinking pattern:

Original Thought: "${thought}"
Current Solution: "${currentSolution}"

Please provide an improved, more detailed solution that:
- Builds upon the current solution if it exists
- Adds specific, actionable steps
- Includes coping strategies
- Remains supportive and encouraging

Keep the response concise but helpful (max 200 words).
    `.trim();

    const aiResponse = await queryAI(enhancementPrompt, {
      max_tokens: 250,
      temperature: 0.6
    });

    return {
      solution: aiResponse.response
    };

  } catch (error) {
    logError(error, 'Solution Enhancement Service');
    return {
      solution: currentSolution || 'Focus on taking one step at a time and remember that this feeling will pass.'
    };
  }
}

/**
 * Validate and clean array fields
 * @param {Array} array 
 * @returns {Array} Valid array with max 3 items
 */
function validateArrayField(array) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  return array
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 3)
    .map(item => item.trim());
}

/**
 * Validate and normalize urgency
 * @param {string} urgency 
 * @returns {string} Valid urgency level
 */
function validateUrgency(urgency) {
  const validUrgencies = ['low', 'medium', 'high'];
  
  if (!urgency || typeof urgency !== 'string') {
    return 'medium';
  }
  
  const normalizedUrgency = urgency.toLowerCase().trim();
  return validUrgencies.includes(normalizedUrgency) ? normalizedUrgency : 'medium';
}

module.exports = {
  processOverthinkingEntry,
  enhanceSolution,
  validateCategory,
  validateIntensity,
  validateArrayField,
  validateUrgency
};
