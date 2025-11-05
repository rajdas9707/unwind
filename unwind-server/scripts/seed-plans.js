// scripts/seed-plans.js
// Run this script to seed initial plan data: node scripts/seed-plans.js

const mongoose = require("mongoose");
require("dotenv").config();

const Plan = require("../models/Plan");

const plans = [
  {
    tier: "free",
    name: "Free",
    description: "Essential features to get started with mental wellness",
    pricing: {
      monthly: { usd: 0 },
      yearly: { usd: 0 },
    },
    features: [
      {
        id: "basic_journal",
        name: "Basic Journal Entries",
        description: "Create daily journal entries",
      },
      {
        id: "mood_tracking",
        name: "Mood Tracking",
        description: "Track your daily mood",
      },
      {
        id: "basic_reminders",
        name: "Basic Reminders",
        description: "Set up to 3 reminders",
      },
    ],
    featureIds: ["basic_journal", "mood_tracking", "basic_reminders"],
    isActive: true,
    order: 1,
  },
  {
    tier: "pro",
    name: "Pro",
    description: "Advanced features for serious mental wellness practitioners",
    pricing: {
      monthly: {
        usd: 999, // $9.99
        ios_product_id: "com.unwind.pro.monthly",
        android_product_id: "com.unwind.pro.monthly",
      },
      yearly: {
        usd: 9599, // $95.99 (20% off)
        ios_product_id: "com.unwind.pro.yearly",
        android_product_id: "com.unwind.pro.yearly",
      },
    },
    features: [
      {
        id: "basic_journal",
        name: "Basic Journal Entries",
        description: "Create daily journal entries",
      },
      {
        id: "mood_tracking",
        name: "Mood Tracking",
        description: "Track your daily mood",
      },
      {
        id: "unlimited_reminders",
        name: "Unlimited Reminders",
        description: "Set unlimited reminders",
      },
      {
        id: "advanced_analytics",
        name: "Advanced Analytics",
        description: "Detailed insights and trends",
      },
      {
        id: "meditation_library",
        name: "Meditation Library",
        description: "Access to guided meditations",
      },
      {
        id: "ai_insights",
        name: "AI-Powered Insights",
        description: "Get personalized recommendations",
      },
    ],
    featureIds: [
      "basic_journal",
      "mood_tracking",
      "unlimited_reminders",
      "advanced_analytics",
      "meditation_library",
      "ai_insights",
    ],
    isActive: true,
    order: 2,
  },
  {
    tier: "premium",
    name: "Premium",
    description: "Complete mental wellness toolkit with all features unlocked",
    pricing: {
      monthly: {
        usd: 1999, // $19.99
        ios_product_id: "com.unwind.premium.monthly",
        android_product_id: "com.unwind.premium.monthly",
      },
      yearly: {
        usd: 19199, // $191.99 (20% off)
        ios_product_id: "com.unwind.premium.yearly",
        android_product_id: "com.unwind.premium.yearly",
      },
    },
    features: [
      {
        id: "basic_journal",
        name: "Basic Journal Entries",
        description: "Create daily journal entries",
      },
      {
        id: "mood_tracking",
        name: "Mood Tracking",
        description: "Track your daily mood",
      },
      {
        id: "unlimited_reminders",
        name: "Unlimited Reminders",
        description: "Set unlimited reminders",
      },
      {
        id: "advanced_analytics",
        name: "Advanced Analytics",
        description: "Detailed insights and trends",
      },
      {
        id: "meditation_library",
        name: "Full Meditation Library",
        description: "Access to all guided meditations",
      },
      {
        id: "ai_insights",
        name: "AI-Powered Insights",
        description: "Get personalized recommendations",
      },
      {
        id: "priority_support",
        name: "Priority Support",
        description: "Get help when you need it",
      },
      {
        id: "offline_mode",
        name: "Offline Mode",
        description: "Access all features offline",
      },
      {
        id: "custom_themes",
        name: "Custom Themes",
        description: "Personalize your experience",
      },
      {
        id: "export_data",
        name: "Export Data",
        description: "Download your complete data",
      },
    ],
    featureIds: [
      "basic_journal",
      "mood_tracking",
      "unlimited_reminders",
      "advanced_analytics",
      "meditation_library",
      "ai_insights",
      "priority_support",
      "offline_mode",
      "custom_themes",
      "export_data",
    ],
    isActive: true,
    order: 3,
  },
];

const seedPlans = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mental-clarity"
    );
    console.log("✅ Connected to MongoDB");

    // Clear existing plans
    await Plan.deleteMany({});
    console.log("🗑️  Cleared existing plans");

    // Insert new plans
    await Plan.insertMany(plans);
    console.log("✅ Seeded plans successfully");

    const count = await Plan.countDocuments();
    console.log(`📊 Total plans in database: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
    process.exit(1);
  }
};

seedPlans();
