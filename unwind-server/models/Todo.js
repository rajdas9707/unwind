const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'health', 'learning', 'other'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
todoSchema.index({ userId: 1, completed: 1 });
todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, dueDate: 1 });

// Update completedAt when completed status changes
todoSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    if (this.completed && !this.completedAt) {
      this.completedAt = new Date();
    } else if (!this.completed) {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.model('Todo', todoSchema);