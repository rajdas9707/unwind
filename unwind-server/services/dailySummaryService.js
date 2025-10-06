const DailySummary = require('../models/DailySummary');
const Journal = require('../models/Journal');
const Mistake = require('../models/Mistake');
const Overthinking = require('../models/Overthinking');
const { queryAI } = require('../llm/services/aiService');

class DailySummaryService {
  /**
   * Check if a daily summary already exists for user and date
   * @param {string} userId 
   * @param {string} date 
   * @returns {boolean}
   */
  async summaryExistsForDay(userId, date) {
    const existingSummary = await DailySummary.findOne({ userId, date });
    return !!existingSummary;
  }

  /**
   * Fetch all user data for a specific date
   * @param {string} userId 
   * @param {string} date 
   * @returns {Object}
   */
  async fetchUserDataForDate(userId, date) {
    try {
      const [journals, mistakes, overthinking] = await Promise.all([
        Journal.find({ userId, date }).sort({ createdAt: -1 }),
        Mistake.find({ userId, date }).sort({ createdAt: -1 }),
        Overthinking.find({ userId, date }).sort({ createdAt: -1 })
      ]);

      return {
        journals,
        mistakes,
        overthinking,
        totalEntries: journals.length + mistakes.length + overthinking.length
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered daily summary
   * @param {Object} userData 
   * @returns {Object}
   */
  async generateAISummary(userData) {
    const { journals, mistakes, overthinking } = userData;

    // Build context for AI
    let context = "Generate a structured daily summary based on the following data:\n\n";

    if (journals.length > 0) {
      context += "JOURNAL ENTRIES:\n";
      journals.forEach((entry, index) => {
        context += `${index + 1}. Summary: ${entry.summary?.join(', ') || 'N/A'}\n`;
        context += `   Positives: ${entry.positives?.join(', ') || 'N/A'}\n`;
        context += `   Negatives: ${entry.negatives?.join(', ') || 'N/A'}\n`;
        context += `   Lessons: ${entry.lessons?.join(', ') || 'N/A'}\n`;
        context += `   Rating: ${entry.rating}/10\n\n`;
      });
    }

    if (mistakes.length > 0) {
      context += "MISTAKES:\n";
      mistakes.forEach((mistake, index) => {
        context += `${index + 1}. Description: ${mistake.description}\n`;
        context += `   Category: ${mistake.category}\n`;
        context += `   Learning: ${mistake.learning}\n`;
        context += `   Solution: ${mistake.solution}\n`;
        context += `   Intensity: ${mistake.intensity}/10\n\n`;
      });
    }

    if (overthinking.length > 0) {
      context += "OVERTHINKING PATTERNS:\n";
      overthinking.forEach((thought, index) => {
        context += `${index + 1}. Thought: ${thought.thought}\n`;
        context += `   Solution: ${thought.solution}\n`;
        context += `   Category: ${thought.category}\n`;
        context += `   Intensity: ${thought.intensity}/10\n`;
        context += `   Reframe: ${thought.reframe}\n\n`;
      });
    }

    context += `\nPlease provide a structured response in the following JSON format:
{
  "highlights": ["point 1", "point 2", "point 3"],
  "lessonsLearned": ["lesson 1", "lesson 2"],
  "positives": ["positive 1", "positive 2"],
  "negatives": ["negative 1", "negative 2"],
  "overallMood": "positive|negative|neutral|very_positive|very_negative",
  "score": 7,
  "actionableTips": ["tip 1", "tip 2", "tip 3"]
}

Focus on:
1. Key highlights from all activities
2. Main lessons learned from mistakes and challenges
3. Overall emotional tone
4. Actionable advice for tomorrow
5. A score (1-10) representing overall day quality`;

    try {
      const aiResponse = await queryAI(context, {
        max_tokens: 800,
        temperature: 0.7
      });

      // Parse AI response as JSON
      let parsedResponse;
      try {
        // Extract JSON from response (remove any markdown formatting)
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON, using fallback');
        parsedResponse = this.generateFallbackSummary(userData);
      }

      return {
        ...parsedResponse,
        aiMetadata: aiResponse.metadata
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return {
        ...this.generateFallbackSummary(userData),
        aiMetadata: { error: error.message }
      };
    }
  }

  /**
   * Generate fallback summary when AI fails
   * @param {Object} userData 
   * @returns {Object}
   */
  generateFallbackSummary(userData) {
    const { journals, mistakes, overthinking } = userData;
    
    return {
      highlights: [
        `Recorded ${journals.length} journal entries`,
        `Processed ${mistakes.length} learning experiences`,
        `Worked through ${overthinking.length} thought patterns`
      ],
      lessonsLearned: mistakes.map(m => m.learning).filter(Boolean),
      positives: journals.flatMap(j => j.positives || []),
      negatives: journals.flatMap(j => j.negatives || []),
      overallMood: 'neutral',
      score: 5,
      actionableTips: [
        'Continue journaling for self-reflection',
        'Apply lessons learned from today\'s experiences',
        'Focus on positive aspects identified today'
      ]
    };
  }




  /**
   * Generate complete daily summary with repetitive mistakes tracking
   * @param {string} userId 
   * @param {string} date 
   * @returns {Object}
   */
  async generateDailySummary(userId, date) {
    try {
      // Check if summary already exists
      if (await this.summaryExistsForDay(userId, date)) {
        throw new Error('Summary already generated for today');
      }

      // Fetch user data for the date
      const userData = await this.fetchUserDataForDate(userId, date);
      
      if (userData.totalEntries === 0) {
        throw new Error('No data available for summary generation');
      }

      // Generate AI summary
      const summaryData = await this.generateAISummary(userData);

      // Save daily summary
      const dailySummary = new DailySummary({
        userId,
        date,
        ...summaryData
      });
      
      await dailySummary.save();

      console.log(`Generated daily summary for user ${userId} on ${date}`);
      
      return {
        success: true,
        summary: dailySummary,
        message: 'Daily summary generated successfully'
      };
    } catch (error) {
      console.error('Error generating daily summary:', error);
      throw error;
    }
  }
}

module.exports = new DailySummaryService();