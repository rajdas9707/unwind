const mongoose = require('mongoose');

const overthinkingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
   // AI-generated structured analysis
  thought: {
    type: String,
    required: true
  },
 
  solution: {
    type: String,
    default: ''
  },
  triggers: [{
    type: String  // What triggered this overthinking
  }],
  patterns: [{
    type: String  // Thought patterns identified
  }],
  coping_strategies: [{
    type: String  // Specific coping strategies
  }],
  reframe: {
    type: String,  // Positive reframing of the thought
    default: ''
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['work', 'relationships', 'health', 'finance', 'future', 'past', 'other'],
    required: true
  },
  intensity: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  dumped: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
module.exports = mongoose.model("Overthinking", overthinkingSchema);
