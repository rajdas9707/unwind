const axios = require('axios');

class EmbeddingService {
  /**
   * Generate text embeddings using a simple text-to-vector approach
   * This is a basic implementation - in production you'd use a proper embedding service
   * @param {string} text - Text to generate embedding for
   * @returns {Array<number>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      // For now, use a simple TF-IDF style approach with character frequency
      // In production, you would use OpenAI embeddings, sentence-transformers, etc.
      return this.simpleTextEmbedding(text);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Simple text embedding using character frequency and basic NLP features
   * @param {string} text 
   * @returns {Array<number>}
   */
  simpleTextEmbedding(text) {
    const normalizedText = text.toLowerCase().trim();
    const embedding = new Array(100).fill(0);
    
    // Character frequency features
    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      if (charCode >= 97 && charCode <= 122) { // a-z
        embedding[charCode - 97] += 1;
      }
    }
    
    // Word count features
    const words = normalizedText.split(/\s+/);
    embedding[26] = words.length;
    
    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    embedding[27] = avgWordLength;
    
    // Common mistake-related keywords
    const mistakeKeywords = [
      'mistake', 'error', 'wrong', 'fail', 'bad', 'regret', 'should', 'shouldnt',
      'stupid', 'dumb', 'mess', 'screw', 'forget', 'late', 'angry', 'upset'
    ];
    
    mistakeKeywords.forEach((keyword, index) => {
      if (index < 20) { // Use positions 28-47 for keyword features
        embedding[28 + index] = (normalizedText.includes(keyword) ? 1 : 0) * 
          (normalizedText.split(keyword).length - 1);
      }
    });
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array<number>} embedding1 
   * @param {Array<number>} embedding2 
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateCosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Check if two texts are similar based on embedding similarity
   * @param {string} text1 
   * @param {string} text2 
   * @param {number} threshold - Similarity threshold (default 0.8)
   * @returns {boolean}
   */
  async areSimilarTexts(text1, text2, threshold = 0.8) {
    const embedding1 = await this.generateEmbedding(text1);
    const embedding2 = await this.generateEmbedding(text2);
    const similarity = this.calculateCosineSimilarity(embedding1, embedding2);
    return similarity >= threshold;
  }
}

module.exports = new EmbeddingService();