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

    // Membership system (new IAP-based system)
    membership: {
      tier: {
        type: String,
        enum: ["free", "trial", "premium"],
        default: "free",
      },
      expiry: { type: Date },
      features: [{ type: String }],
      lastUpdated: { type: Date },
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
