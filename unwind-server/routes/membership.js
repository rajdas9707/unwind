// routes/membership.js

const express = require("express");
const router = express.Router();
const Plan = require("../models/Plan");
const User = require("../models/User");
const axios = require("axios");
const verifyToken = require("../verifyToken");

// GET /api/membership/plans - Fetch all active plans
// router.get("/plans", async (req, res) => {
//   try {
//     const plans = await Plan.find({ isActive: true }).sort({ order: 1 });
//     res.json({
//       success: true,
//       plans: plans.map((plan) => ({
//         tier: plan.tier,
//         name: plan.name,
//         description: plan.description,
//         pricing: plan.pricing,
//         features: plan.features,
//         order: plan.order,
//       })),
//     });
//   } catch (error) {
//     console.error("Error fetching plans:", error);
//     res.status(500).json({ success: false, error: "Failed to fetch plans" });
//   }
// });

// GET /api/membership/status - Get user's current membership
// Protected route - requires verifyToken middleware
router.get("/status", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if membership has expired
    let membership = user?.membership;

    if (membership.expiry && new Date(membership.expiry) < new Date()) {
      // Membership expired - reset to free
      membership.tier = "free";
      membership.expiry = null;
      membership.lastUpdated = new Date();
      user.membership = membership;
      await user.save();
    }

    res.status(200).json({
      success: true,
      membership: {
        tier: membership.tier,
        expiry: membership.expiry,
        features: membership.features,
        lastUpdated: membership.lastUpdated,
        isExpired:
          membership.expiry && new Date(membership.expiry) < new Date(),
      },
    });
  } catch (error) {
    console.error("Error fetching membership status:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch membership" });
  }
});

// POST /api/membership/verify-purchase - Verify IAP and update membership
// Protected route - requires verifyToken middleware
// router.post("/verify-purchase", verifyToken, async (req, res) => {
//   try {
//     const { platform, productId, purchaseToken, transactionReceipt } = req.body;

//     if (!platform || !productId) {
//       return res.status(400).json({
//         success: false,
//         error: "Missing required fields: platform, productId",
//       });
//     }

//     const user = await User.findOne({ firebaseUid: req.user.uid });

//     if (!user) {
//       return res.status(404).json({ success: false, error: "User not found" });
//     }

//     // **CHECK FOR MOCK TOKEN (Development/Testing)**
//     const token = purchaseToken || transactionReceipt;
//     const isMockToken = token && token.startsWith("MOCK_TOKEN_DEV_");

//     // **SECURITY: Reject mock tokens in production**
//     if (process.env.NODE_ENV === "production" && isMockToken) {
//       console.warn("⚠️ Mock token detected in production environment. Rejecting.");
//       return res.status(403).json({
//         success: false,
//         error: "Mock tokens are not allowed in production"
//       });
//     }

//     // Verify purchase with Apple/Google or simulate if mock
//     let verificationResult;
//     let isMock = false;

//     if (isMockToken) {
//       // **MOCK MODE: Simulate successful verification**
//       console.log("🧪 DEV MODE: Processing mock IAP token", token);
//       verificationResult = {
//         valid: true,
//         transactionId: token,
//       };
//       isMock = true;
//     } else if (platform === "ios") {
//       verificationResult = await verifyApplePurchase(transactionReceipt);
//     } else if (platform === "android") {
//       verificationResult = await verifyGooglePurchase(productId, purchaseToken);
//     } else {
//       return res.status(400).json({ success: false, error: "Invalid platform" });
//     }

//     if (!verificationResult.valid) {
//       return res.status(400).json({
//         success: false,
//         error: "Purchase verification failed",
//       });
//     }

//     // Determine tier based on productId
//     const tier = determineTierFromProductId(productId);
//     const plan = await Plan.findOne({ tier, isActive: true });

//     if (!plan) {
//       return res.status(400).json({ success: false, error: "Invalid plan" });
//     }

//     // Calculate expiry (30 days for monthly, 365 for yearly)
//     const isYearly = productId.includes("yearly") || productId.includes("annual");
//     const expiryDate = new Date();
//     expiryDate.setDate(expiryDate.getDate() + (isYearly ? 365 : 30));

//     // Update user membership
//     user.membership = {
//       tier: plan.tier,
//       expiry: expiryDate,
//       features: plan.featureIds || [],
//       lastUpdated: new Date(),
//       purchaseHistory: [
//         ...(user.membership?.purchaseHistory || []),
//         {
//           productId,
//           transactionId: verificationResult.transactionId,
//           platform,
//           purchaseDate: new Date(),
//           expiryDate,
//         },
//       ],
//     };

//     await user.save();

//     // Log mock purchase for debugging
//     if (isMock) {
//       console.log(`✅ Mock purchase successful for user ${user.firebaseUid}: ${plan.tier} (${isYearly ? 'yearly' : 'monthly'})`);
//     }

//     res.json({
//       success: true,
//       mock: isMock, // Indicate if this was a mock purchase
//       membership: {
//         tier: user.membership.tier,
//         expiry: user.membership.expiry,
//         features: user.membership.features,
//         lastUpdated: user.membership.lastUpdated,
//       },
//     });
//   } catch (error) {
//     console.error("Error verifying purchase:", error);
//     res.status(500).json({ success: false, error: "Failed to verify purchase" });
//   }
// });

// Helper: Verify Apple purchase
// async function verifyApplePurchase(receiptData) {
//   try {
//     // Use sandbox for development, production for live
//     const appleUrl = process.env.NODE_ENV === "production"
//       ? "https://buy.itunes.apple.com/verifyReceipt"
//       : "https://sandbox.itunes.apple.com/verifyReceipt";

//     const response = await axios.post(appleUrl, {
//       "receipt-data": receiptData,
//       password: process.env.APPLE_SHARED_SECRET, // Set in .env
//     });

//     if (response.data.status === 0) {
//       return {
//         valid: true,
//         transactionId: response.data.receipt.transaction_id,
//       };
//     }

//     return { valid: false };
//   } catch (error) {
//     console.error("Apple verification error:", error);
//     return { valid: false };
//   }
// }

// Helper: Verify Google purchase
// async function verifyGooglePurchase(productId, purchaseToken) {
//   try {
//     // Google Play Developer API verification
//     // Requires service account setup
//     const packageName = process.env.ANDROID_PACKAGE_NAME;
//     const googleUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

//     const response = await axios.get(googleUrl, {
//       headers: {
//         Authorization: `Bearer ${process.env.GOOGLE_PLAY_ACCESS_TOKEN}`,
//       },
//     });

//     if (response.data && response.data.purchaseState === 0) {
//       return {
//         valid: true,
//         transactionId: response.data.orderId,
//       };
//     }

//     return { valid: false };
//   } catch (error) {
//     console.error("Google verification error:", error);
//     return { valid: false };
//   }
// }

// Helper: Determine tier from product ID
// function determineTierFromProductId(productId) {
//   const lowerId = productId.toLowerCase();

//   if (lowerId.includes("premium")) return "premium";
//   if (lowerId.includes("pro")) return "pro";

//   return "free";
// }

module.exports = router;
