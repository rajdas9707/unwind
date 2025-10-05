const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: null
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mood: {
    type: String,
    enum: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'],
    default: 'neutral'
  },
  type: {
    type: String,
    default: 'journal'
  },
  aiResponse: {
    type: String,
    default: null
  },
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
journalSchema.index({ userId: 1, date: -1 });
journalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Journal', journalSchema);