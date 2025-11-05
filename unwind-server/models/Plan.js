// models/Plan.js

const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    // Plan identifier
    tier: {
      type: String,
      enum: ["free", "pro", "premium"],
      required: true,
      unique: true,
    },

    // Display info
    name: { type: String, required: true },
    description: { type: String },
    
    // Pricing (in cents to avoid floating point issues)
    pricing: {
      monthly: {
        usd: { type: Number, default: 0 },
        ios_product_id: { type: String },
        android_product_id: { type: String },
      },
      yearly: {
        usd: { type: Number, default: 0 },
        ios_product_id: { type: String },
        android_product_id: { type: String },
      },
    },

    // Features included in this plan
    features: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
      },
    ],

    // Feature access list (for quick lookup)
    featureIds: [{ type: String }],

    // Status
    isActive: { type: Boolean, default: true },
    
    // Display order
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
