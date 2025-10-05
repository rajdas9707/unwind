const { queryAI } = require('../services/aiService');
const { toHttpResponse, logError } = require('../utils/errorHandler');
const Overthinking = require('../../models/Overthinking');

/**
 * Overthinking-specific AI Controller Functions
 * Handles AI-powered analysis and solution generation for overthinking patterns
 */

/**
 * Analyze overthinking pattern and generate insights
 * POST /api/llm/overthinking/analyze
 */
async function analyzeOverthinking(req, res) {
  try {
    const { thought, category, intensity } = req.body;
    const userId = req.user?.uid;

    if (!thought || !thought.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Thought content is required for analysis'
      });
    }

    console.log(`[LLM] Analyzing overthinking for user ${userId} - category: ${category}, intensity: ${intensity}`);

    // Create analysis prompt based on schema fields
    const analysisPrompt = `
As a mental health assistant, analyze this overthinking pattern and provide helpful insights:

Thought: "${thought}"
Category: ${category || 'general'}
Intensity Level: ${intensity || 5}/10

Please provide:
1. A brief analysis of the overthinking pattern (2-3 sentences)
2. Suggested coping strategies (3-4 practical techniques)
3. Potential underlying concerns to address
4. Recommended tags for categorization (2-4 relevant tags)

Keep the response supportive, non-judgmental, and actionable. Focus on helping the person break the overthinking cycle.
    `.trim();

    const aiResponse = await queryAI(analysisPrompt, {
      max_tokens: 500,
      temperature: 0.7
    });

    res.json({
      success: true,
      analysis: aiResponse.response,
      metadata: {
        ...aiResponse.metadata,
        userId: userId,
        originalThought: thought.substring(0, 100) + (thought.length > 100 ? '...' : ''),
        category: category,
        intensity: intensity
      }
    });
  } catch (error) {
    logError(error, 'Overthinking Analysis Controller');
    const errorResponse = toHttpResponse(error);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * Generate solution suggestions for a specific thought
 * POST /api/llm/overthinking/solution
 */
async function generateSolution(req, res) {
  try {
    const { thought, category, intensity } = req.body;
    const userId = req.user?.uid;

    if (!thought || !thought.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Thought content is required to generate solutions'
      });
    }

    console.log(`[LLM] Generating solution for user ${userId} - category: ${category}`);

    // Create solution generation prompt
    const solutionPrompt = `
As a supportive mental health assistant, help generate practical solutions for this overthinking situation:

Overthinking Pattern: "${thought}"
Category: ${category || 'general'}
Stress Level: ${intensity || 5}/10

Please provide:
1. A concise reframe of the situation (1-2 sentences)
2. Three specific, actionable solutions or steps the person can take
3. A grounding technique they can use right now
4. A positive affirmation related to this situation

Format the response in a clear, encouraging way that empowers the person to take action rather than continuing to overthink.
    `.trim();

    const aiResponse = await queryAI(solutionPrompt, {
      max_tokens: 400,
      temperature: 0.6
    });

    res.json({
      success: true,
      solution: aiResponse.response,
      metadata: {
        ...aiResponse.metadata,
        userId: userId,
        originalThought: thought.substring(0, 100) + (thought.length > 100 ? '...' : ''),
        category: category,
        intensity: intensity
      }
    });
  } catch (error) {
    logError(error, 'Solution Generation Controller');
    const errorResponse = toHttpResponse(error);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * Get personalized insights based on user's overthinking patterns
 * POST /api/llm/overthinking/insights
 */
async function getPersonalizedInsights(req, res) {
  try {
    const userId = req.user?.uid;
    const { timeframe = '7' } = req.body; // days

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    console.log(`[LLM] Generating personalized insights for user ${userId}`);

    // Get user's recent overthinking entries
    const recentEntries = await Overthinking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    if (recentEntries.length === 0) {
      return res.json({
        success: true,
        insights: "You haven't logged any overthinking patterns yet. Start tracking your thoughts to get personalized insights!",
        metadata: {
          userId: userId,
          entryCount: 0
        }
      });
    }

    // Analyze patterns without including sensitive thought content
    const patternSummary = {
      totalEntries: recentEntries.length,
      categories: {},
      averageIntensity: 0,
      dumpedCount: 0
    };

    recentEntries.forEach(entry => {
      patternSummary.categories[entry.category] = (patternSummary.categories[entry.category] || 0) + 1;
      patternSummary.averageIntensity += entry.intensity;
      if (entry.dumped) patternSummary.dumpedCount++;
    });

    patternSummary.averageIntensity = (patternSummary.averageIntensity / recentEntries.length).toFixed(1);

    const insightsPrompt = `
As a mental health assistant, provide personalized insights based on these overthinking patterns:

Recent Activity Summary:
- Total overthinking entries: ${patternSummary.totalEntries}
- Category distribution: ${Object.entries(patternSummary.categories).map(([cat, count]) => `${cat}: ${count}`).join(', ')}
- Average intensity: ${patternSummary.averageIntensity}/10
- Thoughts released: ${patternSummary.dumpedCount}/${patternSummary.totalEntries}

Please provide:
1. Key patterns you notice (without referencing specific thoughts)
2. Progress recognition and encouragement
3. Personalized recommendations for managing overthinking
4. Suggested areas of focus for improvement

Keep the tone supportive and focus on actionable insights that promote mental wellness.
    `.trim();

    const aiResponse = await queryAI(insightsPrompt, {
      max_tokens: 600,
      temperature: 0.8
    });

    res.json({
      success: true,
      insights: aiResponse.response,
      patterns: patternSummary,
      metadata: {
        ...aiResponse.metadata,
        userId: userId,
        entriesAnalyzed: recentEntries.length
      }
    });
  } catch (error) {
    logError(error, 'Personalized Insights Controller');
    const errorResponse = toHttpResponse(error);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * Suggest tags for categorizing overthinking entries
 * POST /api/llm/overthinking/suggest-tags
 */
async function suggestTags(req, res) {
  try {
    const { thought } = req.body;
    const userId = req.user?.uid;

    if (!thought || !thought.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Thought content is required for tag suggestions'
      });
    }

    console.log(`[LLM] Suggesting tags for user ${userId}`);

    const tagPrompt = `
Analyze this overthinking pattern and suggest 3-5 relevant tags for categorization:

Thought: "${thought}"

Consider these aspects:
- Emotions involved (anxiety, worry, fear, etc.)
- Life domains (work, relationships, health, finance, future, past)
- Thought patterns (rumination, catastrophizing, perfectionism, etc.)
- Specific triggers or themes

Provide only the tags as a comma-separated list, focusing on helpful categorization for mental health tracking.
    `.trim();

    const aiResponse = await queryAI(tagPrompt, {
      max_tokens: 100,
      temperature: 0.5
    });

    // Parse the response to extract tags
    const suggestedTags = aiResponse.response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length < 20)
      .slice(0, 5);

    res.json({
      success: true,
      suggestedTags: suggestedTags,
      metadata: {
        ...aiResponse.metadata,
        userId: userId
      }
    });
  } catch (error) {
    logError(error, 'Tag Suggestion Controller');
    const errorResponse = toHttpResponse(error);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

module.exports = {
  analyzeOverthinking,
  generateSolution,
  getPersonalizedInsights,
  suggestTags
};