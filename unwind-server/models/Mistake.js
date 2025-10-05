const mongoose = require("mongoose");

const mistakeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
       // AI-generated structured analysis

    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Work/Career",
        "Relationships",
        "Health",
        "Finance",
        "Personal Growth",
        "Communication",
        "Time Management",
        "Decision Making",
        "Other",
      ],
      required: true,
    },
    learning: {
      type: String,
      default: ''
    },
    solution: {
      type: String,
      default: ''
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    date: {
      type: String,
      required: true,
      index: true,
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
mistakeSchema.index({ userId: 1, date: -1 });
mistakeSchema.index({ userId: 1, createdAt: -1 });
mistakeSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("Mistake", mistakeSchema);
