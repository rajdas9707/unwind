const mongoose = require('mongoose');

const repetitiveMistakesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  mistakeText: {
    type: String,
    required: true
  },
  embedding: [{
    type: Number,
    required: true
  }],
  occurrences: {
    type: Number,
    default: 1,
    min: 1
  },
  firstOccurred: {
    type: Date,
    default: Date.now
  },
  lastOccurred: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: [
      'Work/Career',
      'Relationships', 
      'Health',
      'Finance',
      'Personal Growth',
      'Communication',
      'Time Management',
      'Decision Making',
      'Other'
    ],
    default: 'Other'
  },
  sources: [{
    type: {
      type: String,
      enum: ['journal', 'mistake', 'overthinking'],
      required: true
    },
    entryId: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    }
  }],
  notified: {
    type: Boolean,
    default: false
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
repetitiveMistakesSchema.index({ userId: 1, occurrences: -1 });
repetitiveMistakesSchema.index({ userId: 1, lastOccurred: -1 });
repetitiveMistakesSchema.index({ userId: 1, category: 1 });
repetitiveMistakesSchema.index({ userId: 1, notified: 1 });

module.exports = mongoose.model('RepetitiveMistakes', repetitiveMistakesSchema);