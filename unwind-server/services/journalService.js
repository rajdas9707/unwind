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
  "summary": [
    "Point 1: Brief summary of main event/thought",
    "Point 2: Another key aspect", 
    "Point 3: Additional important detail",
    "Point 4: Another relevant point (if applicable)",
    "Point 5: Final important aspect (if applicable)"
  ],
  "positives": [
    "Positive aspect 1",
    "Positive aspect 2 (if any)",
    "Positive aspect 3 (if any)"
  ],
  "negatives": [
    "Negative/challenging aspect 1", 
    "Negative/challenging aspect 2 (if any)",
    "Negative/challenging aspect 3 (if any)"
  ],
  "lessons": [
    "Key lesson or insight 1",
    "Key lesson or insight 2 (if applicable)",
    "Key lesson or insight 3 (if applicable)"
  ],
  "intensity": "low|medium|high",
  "rating": 7
}

Rules:
- Provide 3-5 summary points maximum
- Extract 1-3 positive aspects if they exist
- Extract 1-3 negative/challenging aspects if they exist  
- Identify 1-3 key lessons or insights
- Determine emotional intensity level
- Rate the overall day/experience on a scale of 1-10 (1=very bad, 10=excellent)
- Keep each point concise (1-2 sentences max)
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