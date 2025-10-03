const mongoose = require('mongoose');

const overthinkingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  thought: {
    type: String,
    required: true
  },
  solution: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['work', 'relationships', 'health', 'finance', 'future', 'past', 'other'],
    default: 'other'
  },
  intensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  dumped: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  type: {
    type: String,
    default: 'overthinking'
  }
}, {
  timestamps: true
});

// Index for efficient queries
overthinkingSchema.index({ userId: 1, date: -1 });
overthinkingSchema.index({ userId: 1, createdAt: -1 });
overthinkingSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Overthinking', overthinkingSchema);