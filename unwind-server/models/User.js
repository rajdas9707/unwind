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

    // Subscription info (legacy - kept for backward compatibility)
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

    // Membership system (new IAP-based system)
    membership: {
      tier: {
        type: String,
        enum: ["free", "pro", "premium"],
        default: "free",
      },
      expiry: { type: Date },
      features: [{ type: String }],
      lastUpdated: { type: Date, default: Date.now },
      purchaseHistory: [
        {
          productId: String,
          transactionId: String,
          platform: { type: String, enum: ["ios", "android"] },
          purchaseDate: Date,
          expiryDate: Date,
        },
      ],
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model("User", UserSchema);
