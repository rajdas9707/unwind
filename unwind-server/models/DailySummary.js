const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  highlights: [{
    type: String,
    required: true
  }],
  lessonsLearned: [{
    type: String
  }],
  positives: [{
    type: String
  }],
  negatives: [{
    type: String
  }],
  overallMood: {
    type: String,
    enum: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'],
    default: 'neutral'
  },
  score: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  actionableTips: [{
    type: String
  }],
  aiMetadata: {
    provider: String,
    model: String,
    tokens_used: Number,
    response_time: Number,
    timestamp: Date,
    error: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
dailySummarySchema.index({ userId: 1, date: -1 });
dailySummarySchema.index({ userId: 1, createdAt: -1 });

// Ensure only one summary per user per day
dailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySummary', dailySummarySchema);