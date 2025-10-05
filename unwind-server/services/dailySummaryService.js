const DailySummary = require('../models/DailySummary');
const RepetitiveMistakes = require('../models/RepetitiveMistakes');
const Journal = require('../models/Journal');
const Mistake = require('../models/Mistake');
const Overthinking = require('../models/Overthinking');
const { queryAI } = require('../llm/services/aiService');
const embeddingService = require('./embeddingService');

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
   * Extract all mistake texts from user data
   * @param {Object} userData 
   * @returns {Array}
   */
  extractMistakeTexts(userData) {
    const mistakes = [];
    
    // From journal lessons
    userData.journals.forEach(journal => {
      if (journal.lessons) {
        journal.lessons.forEach(lesson => {
          mistakes.push({
            text: lesson,
            source: { type: 'journal', entryId: journal._id.toString(), date: journal.date }
          });
        });
      }
      // Also check negatives for mistake patterns
      if (journal.negatives) {
        journal.negatives.forEach(negative => {
          mistakes.push({
            text: negative,
            source: { type: 'journal', entryId: journal._id.toString(), date: journal.date }
          });
        });
      }
    });

    // From mistake entries
    userData.mistakes.forEach(mistake => {
      mistakes.push({
        text: mistake.description,
        source: { type: 'mistake', entryId: mistake._id.toString(), date: mistake.date },
        category: mistake.category
      });
    });

    // From overthinking solutions
    userData.overthinking.forEach(thought => {
      if (thought.solution) {
        mistakes.push({
          text: thought.solution,
          source: { type: 'overthinking', entryId: thought._id.toString(), date: thought.date }
        });
      }
    });

    return mistakes;
  }

  /**
   * Update repetitive mistakes tracking
   * @param {string} userId 
   * @param {Object} userData 
   */
  async updateRepetitiveMistakes(userId, userData) {
    try {
      const mistakeTexts = this.extractMistakeTexts(userData);
      
      for (const mistakeData of mistakeTexts) {
        await this.processIndividualMistake(userId, mistakeData);
      }
      
      console.log(`Processed ${mistakeTexts.length} mistakes for repetitive pattern detection`);
    } catch (error) {
      console.error('Error updating repetitive mistakes:', error);
      throw error;
    }
  }

  /**
   * Process individual mistake for repetitive pattern detection
   * @param {string} userId 
   * @param {Object} mistakeData 
   */
  async processIndividualMistake(userId, mistakeData) {
    const embedding = await embeddingService.generateEmbedding(mistakeData.text);
    
    // Find existing similar mistakes
    const existingMistakes = await RepetitiveMistakes.find({ userId });
    
    let similarMistake = null;
    for (const existing of existingMistakes) {
      const similarity = embeddingService.calculateCosineSimilarity(
        embedding, 
        existing.embedding
      );
      
      if (similarity >= 0.75) { // 75% similarity threshold
        similarMistake = existing;
        break;
      }
    }

    if (similarMistake) {
      // Update existing repetitive mistake
      similarMistake.occurrences += 1;
      similarMistake.lastOccurred = new Date();
      similarMistake.sources.push(mistakeData.source);
      
      // Update severity based on frequency
      if (similarMistake.occurrences >= 5) {
        similarMistake.severity = 'high';
      } else if (similarMistake.occurrences >= 3) {
        similarMistake.severity = 'medium';
      }
      
      await similarMistake.save();
      console.log(`Updated repetitive mistake: ${similarMistake.mistakeText} (${similarMistake.occurrences} times)`);
    } else {
      // Create new repetitive mistake entry
      const newRepetitiveMistake = new RepetitiveMistakes({
        userId,
        mistakeText: mistakeData.text,
        embedding,
        occurrences: 1,
        category: mistakeData.category || 'Other',
        sources: [mistakeData.source],
        severity: 'low'
      });
      
      await newRepetitiveMistake.save();
      console.log(`Created new mistake pattern: ${mistakeData.text}`);
    }
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

      // Update repetitive mistakes tracking
      await this.updateRepetitiveMistakes(userId, userData);

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