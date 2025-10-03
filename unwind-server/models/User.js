// models/User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Firebase UID for auth
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },

    // Basic info
    email: { type: String, required: true },
    name: { type: String },

    // Subscription info
    subscription: {
      isActive: { type: Boolean, default: false },
      trialStart: { type: Date },
      trialEnd: { type: Date },
      plan: {
        type: String,
        enum: ["trial", "basic", "premium"],
        default: "trial",
      },
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model("User", UserSchema);
