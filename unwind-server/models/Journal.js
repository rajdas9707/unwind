const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Structured content processed by AI from raw text
  summary: [{
    type: String,
    required: true
  }],
  positives: [{
    type: String
  }],
  negatives: [{
    type: String
  }],
  lessons: [{
    type: String
  }],
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  mood: {
    type: String,
    enum: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'],
    default: 'neutral'
  },
  aiMetadata: {
    provider: String,
    model: String,
    tokens_used: Number,
    response_time: Number,
    timestamp: Date,
    error: String
  },
  editHistory: [{
    editedAt: {
      type: Date,
      required: true
    },
    editDate: {
      type: String,
      required: true
    }
  }],
  editCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
journalSchema.index({ userId: 1, date: -1 });
journalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Journal', journalSchema);