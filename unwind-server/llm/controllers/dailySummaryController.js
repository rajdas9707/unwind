const dailySummaryService = require('../../services/dailySummaryService');

/**
 * Generate daily summary for the user
 * POST /api/llm/generate-summary
 */
const generateDailySummary = async (req, res) => {
  try {
    const userId = req.user.uid; // From Firebase auth middleware
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`Generating daily summary for user ${userId} on ${today}`);
    
    // Server-side rate limiting check
    if (await dailySummaryService.summaryExistsForDay(userId, today)) {
      return res.status(409).json({
        success: false,
        message: 'Summary already generated for today',
        code: 'SUMMARY_EXISTS'
      });
    }

    // Generate the summary
    const result = await dailySummaryService.generateDailySummary(userId, today);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        date: today,
        highlights: result.summary.highlights,
        lessonsLearned: result.summary.lessonsLearned,
        positives: result.summary.positives,
        negatives: result.summary.negatives,
        overallMood: result.summary.overallMood,
        score: result.summary.score,
        actionableTips: result.summary.actionableTips
      }
    });

  } catch (error) {
    console.error('Error in generateDailySummary:', error);
    
    if (error.message === 'Summary already generated for today') {
      return res.status(409).json({
        success: false,
        message: 'Summary already generated for today',
        code: 'SUMMARY_EXISTS'
      });
    }
    
    if (error.message === 'No data available for summary generation') {
      return res.status(400).json({
        success: false,
        message: 'No journal, mistake, or overthinking data found for today. Please add some entries first.',
        code: 'NO_DATA'
      });
    }
    
    // Handle AI service errors
    if (error.message.includes('AI feedback service is currently unavailable')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is temporarily unavailable. Please try again later.',
        code: 'AI_UNAVAILABLE'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  generateDailySummary
};