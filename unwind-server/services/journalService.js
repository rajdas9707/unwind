const aiService = require('../llm/services/aiService');

/**
 * Process raw journal text into structured summary
 * @param {string} rawText - The raw journal text from user
 * @returns {Promise<Object>} - Structured journal summary
 */
async function processJournalEntry(rawText) {
  console.log('[journalService] Processing raw journal text');
  
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Raw text is required and must be a non-empty string');
  }

  const aiPrompt = `
Analyze the following journal entry and provide a structured summary. Extract key insights and present them in the following JSON format:

{
  "summary": ["3-5 short one-liners (main events/thoughts)"],
  "positives": ["1-3 short positive points "],
  "negatives": ["1-3 short negative/challenging points"],
  "lessons": ["1-3 short lessons or insights"],
  "intensity": "low | medium | high",
  "rating": "1-10 (based on clarity, mistake awareness, and overthinking control — higher clarity & awareness = higher score)"
}

- If no positives/negatives/lessons exist, use empty arrays
- Respond ONLY with valid JSON, no additional text

Journal entry to analyze:
"${rawText}"
`;

  try {
    const aiResponse = await aiService.queryAI(aiPrompt, {
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('[journalService] Raw AI response:', aiResponse.response);
    
    // Parse the AI response as JSON
    let parsedResponse;
    try {
      // Try to parse as JSON directly
      parsedResponse = JSON.parse(aiResponse.response);
    } catch (parseError) {
      console.log('[journalService] Direct JSON parse failed, trying cleanup');
      
      // Try to extract JSON from response if it has extra text
      const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI response is not valid JSON format');
      }
    }

    // Validate the parsed response structure
    const processedJournal = validateAndCleanResponse(parsedResponse);
    
    console.log('[journalService] Successfully processed journal entry');
    
    return {
      processedContent: processedJournal,
      aiMetadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens_used: aiResponse.metadata.tokens_used,
        response_time: aiResponse.metadata.response_time,
        timestamp: new Date()
      }
    };

  } catch (error) {
    console.error('[journalService] Error processing journal entry:', error.message);
    
    // Return fallback structure if AI processing fails
    const fallbackContent = {
      summary: [rawText.length > 200 ? rawText.substring(0, 200) + '...' : rawText],
      positives: [],
      negatives: [],
      lessons: [],
      intensity: 'medium',
      rating: 5
    };
    
    return {
      processedContent: fallbackContent,
      aiMetadata: {
        error: error.message,
        timestamp: new Date(),
        fallback_used: true
      }
    };
  }
}

/**
 * Validate and clean the AI response structure
 * @param {Object} response - Parsed AI response
 * @returns {Object} - Validated and cleaned response
 */
function validateAndCleanResponse(response) {
  const cleaned = {
    summary: [],
    positives: [],
    negatives: [],
    lessons: [],
    intensity: 'medium',
    rating: 5
  };

  // Validate and clean summary (required, max 5 points)
  if (Array.isArray(response.summary)) {
    cleaned.summary = response.summary
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 5)
      .map(item => item.trim());
  }
  
  if (cleaned.summary.length === 0) {
    throw new Error('Summary must contain at least one point');
  }

  // Validate and clean positives (optional, max 3)
  if (Array.isArray(response.positives)) {
    cleaned.positives = response.positives
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 3)
      .map(item => item.trim());
  }

  // Validate and clean negatives (optional, max 3) 
  if (Array.isArray(response.negatives)) {
    cleaned.negatives = response.negatives
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 3)
      .map(item => item.trim());
  }

  // Validate and clean lessons (optional, max 3)
  if (Array.isArray(response.lessons)) {
    cleaned.lessons = response.lessons
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 3)
      .map(item => item.trim());
  }

  // Validate intensity
  const validIntensities = ['low', 'medium', 'high'];
  if (validIntensities.includes(response.intensity)) {
    cleaned.intensity = response.intensity;
  }

  // Validate rating (1-10 scale)
  if (typeof response.rating === 'number' && response.rating >= 1 && response.rating <= 10) {
    cleaned.rating = Math.round(response.rating);
  }

  return cleaned;
}

module.exports = {
  processJournalEntry
};