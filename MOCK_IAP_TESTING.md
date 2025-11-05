# 🧪 Mock IAP Testing Guide

This document explains how to test the **In-App Purchase (IAP)** and **membership flow** in **Expo Go** or **unsigned Android builds** without needing real App Store/Play Store integration.

---

## 🎯 Overview

The mock IAP system allows you to:
- ✅ Test membership upgrades in **Expo Go**
- ✅ Test on **unsigned Android builds** without Play Store setup
- ✅ Simulate purchases instantly without payment
- ✅ Validate the entire membership flow (frontend + backend)
- ✅ Automatically disabled in **production** for security

---

## 🔄 How It Works

### Development Mode (`__DEV__ === true`)
```
User clicks "Subscribe" → Mock token generated → Sent to backend → 
Backend simulates verification → Membership upgraded → UI updates
```

### Production Mode (`__DEV__ === false`)
```
User clicks "Subscribe" → Real IAP flow → Receipt sent to backend → 
Backend verifies with Apple/Google → Membership upgraded → UI updates
```

---

## 🚀 Getting Started

### No Configuration Required!

The mock system is **automatically enabled** when:
- Running in Expo Go
- Running debug builds (`__DEV__ === true`)
- Backend is not in production mode

**Production builds automatically use real IAP.**

---

## 🎨 Using Mock IAP

### 1. Open Membership Modal

In any screen:
```jsx
import { useState } from "react";
import MembershipModal from "../components/MembershipModal";

export default function MyScreen() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button 
        title="Upgrade" 
        onPress={() => setShowModal(true)} 
      />
      
      <MembershipModal 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}
```

### 2. Select a Plan

- Choose **Pro** or **Premium**
- Select **Monthly** or **Yearly**
- Click **"Subscribe Now"**

### 3. Mock Purchase Flow

You'll see:
1. Alert: **"Development Mode - Mock purchase initiated"**
2. Backend processes mock token
3. Membership upgraded instantly
4. Success alert: **"[DEV] Mock purchase successful!"**

### 4. Verify Membership

```jsx
import { useMembership } from "../context/MembershipProvider";

const { membership } = useMembership();

console.log(membership.tier); // "pro" or "premium"
console.log(membership.features); // Array of unlocked features
```

---

## 🔍 How to Identify Mock Purchases

### Frontend Console
```
🧪 DEV MODE: Simulating IAP purchase with mock token
```

### Backend Console
```
🧪 DEV MODE: Processing mock IAP token MOCK_TOKEN_DEV_1704412345_pro_monthly
✅ Mock purchase successful for user abc123: pro (monthly)
```

### API Response
```json
{
  "success": true,
  "mock": true,  // ← Indicates mock purchase
  "membership": {
    "tier": "pro",
    "expiry": "2025-02-05T...",
    "features": ["..."]
  }
}
```

---

## 🧪 Testing Different Scenarios

### Test Pro Monthly
1. Open membership modal
2. Select **Pro** plan
3. Choose **Monthly**
4. Click Subscribe
5. ✅ User upgraded to Pro (30 days)

### Test Premium Yearly
1. Open membership modal
2. Select **Premium** plan
3. Choose **Yearly**
4. Click Subscribe
5. ✅ User upgraded to Premium (365 days)

### Test Feature Gates
```jsx
import FeatureGate from "../components/FeatureGate";

// Before mock purchase - shows lock screen
<FeatureGate feature="advanced_analytics">
  <AdvancedAnalytics />
</FeatureGate>

// After mock purchase - shows content
// (if user has "advanced_analytics" in features)
```

### Test Membership Context
```jsx
const { membership, hasFeature, hasTier } = useMembership();

// Check tier
if (hasTier("pro")) {
  console.log("User has Pro or higher");
}

// Check specific feature
if (hasFeature("meditation_library")) {
  console.log("User can access meditation library");
}
```

---

## 🔐 Security Features

### 1. Production Protection
Mock tokens are **automatically rejected** in production:

```javascript
// Backend check
if (process.env.NODE_ENV === "production" && isMockToken) {
  return res.status(403).json({ 
    error: "Mock tokens are not allowed in production" 
  });
}
```

### 2. Token Format
Mock tokens follow this pattern:
```
MOCK_TOKEN_DEV_{timestamp}_{tier}_{period}

Example:
MOCK_TOKEN_DEV_1704412345_pro_monthly
```

### 3. Environment Detection
- **Frontend**: Uses `__DEV__` flag (React Native built-in)
- **Backend**: Uses `process.env.NODE_ENV`

---

## 📋 Mock Token Details

### Structure
```
MOCK_TOKEN_DEV_
├── Timestamp: 1704412345
├── Tier: pro | premium
└── Period: monthly | yearly
```

### Example Tokens
```
iOS (transactionReceipt):
MOCK_TOKEN_DEV_1704412345_pro_monthly

Android (purchaseToken):
MOCK_TOKEN_DEV_1704412345_premium_yearly
```

---

## 🛠 Manual Testing

### Test Mock Purchase via API

You can test the backend directly:

```bash
# Get your Firebase auth token first
TOKEN="your_firebase_token"

# Mock purchase
curl -X POST http://localhost:5000/api/membership/verify-purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "productId": "com.unwind.pro.monthly",
    "purchaseToken": "MOCK_TOKEN_DEV_1704412345_pro_monthly"
  }'
```

### Expected Response
```json
{
  "success": true,
  "mock": true,
  "membership": {
    "tier": "pro",
    "expiry": "2025-02-05T04:31:56.000Z",
    "features": [
      "basic_journal",
      "mood_tracking",
      "unlimited_reminders",
      "advanced_analytics",
      "meditation_library",
      "ai_insights"
    ],
    "lastUpdated": "2025-01-05T04:31:56.000Z"
  }
}
```

---

## 🔄 Reset Membership

To test upgrades multiple times:

### Via MongoDB
```javascript
db.users.updateOne(
  { firebaseUid: "your_user_id" },
  { 
    $set: { 
      "membership.tier": "free",
      "membership.features": ["basic_journal", "mood_tracking", "basic_reminders"],
      "membership.expiry": null
    }
  }
)
```

### Via AsyncStorage (Frontend)
```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clear cached membership
await AsyncStorage.removeItem("@unwind_membership");

// Reload app or call
const { syncMembership } = useMembership();
await syncMembership(true);
```

---

## ✅ Verification Checklist

After mock purchase, verify:

- [ ] **Console logs** show mock token detected
- [ ] **Membership tier** updated in database
- [ ] **Features array** contains correct features
- [ ] **Expiry date** set correctly (30 or 365 days)
- [ ] **Frontend UI** shows new tier
- [ ] **Feature gates** unlock automatically
- [ ] **AsyncStorage** cache updated
- [ ] **API response** includes `"mock": true`

---

## 🚨 Common Issues

### Issue: Mock purchase not working
**Solution:**
- Ensure backend is running (`NODE_ENV !== "production"`)
- Check console for `__DEV__` value
- Verify backend logs show mock token detection

### Issue: Features not unlocking
**Solution:**
- Check `membership.features` array in backend
- Ensure plan in database has correct `featureIds`
- Force sync: `syncMembership(true)`

### Issue: "Mock tokens not allowed in production"
**Solution:**
- This is expected in production builds
- Use real IAP for production testing
- For staging, set `NODE_ENV=development`

---

## 🎓 Best Practices

### 1. Always Test Both Tiers
```javascript
// Test Pro
handleMockPurchase("pro", "monthly");

// Test Premium
handleMockPurchase("premium", "yearly");
```

### 2. Verify All Features Unlock
```javascript
const { hasFeature } = useMembership();

// Pro features
expect(hasFeature("advanced_analytics")).toBe(true);
expect(hasFeature("meditation_library")).toBe(true);

// Premium-only features
expect(hasFeature("export_data")).toBe(false); // Pro user
```

### 3. Test Expiry Logic
```javascript
// Mock purchase with custom expiry
const mockPurchase = {
  tier: "pro",
  expiry: new Date(Date.now() + 1000), // 1 second
};

// Wait and verify tier resets to free
setTimeout(() => {
  syncMembership(true);
  expect(membership.tier).toBe("free");
}, 2000);
```

---

## 🔄 Transitioning to Production

### 1. Configure Real IAP Products
- Create products in **App Store Connect** (iOS)
- Create products in **Google Play Console** (Android)
- Match product IDs in database seed script

### 2. Add Environment Variables
```env
# .env (production)
NODE_ENV=production
APPLE_SHARED_SECRET=your_actual_secret
ANDROID_PACKAGE_NAME=com.yourapp
GOOGLE_PLAY_ACCESS_TOKEN=your_actual_token
```

### 3. Build Production App
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 4. Test Real IAP
- Use **sandbox accounts** (iOS)
- Use **test accounts** (Android)
- Verify real receipts are processed

---

## 📊 Comparison Table

| Feature | Mock IAP (Dev) | Real IAP (Prod) |
|---------|----------------|-----------------|
| **Environment** | Expo Go, Debug builds | Signed production builds |
| **Token Format** | `MOCK_TOKEN_DEV_*` | Real receipt/token |
| **Verification** | Simulated (instant) | Apple/Google API |
| **Cost** | Free | Real money / Sandbox |
| **Setup Required** | None | App Store / Play Console |
| **Backend Logs** | 🧪 DEV MODE | Production logs |
| **Response Flag** | `"mock": true` | `"mock": false` or absent |

---

## 📚 Related Documentation

- **Full System Documentation**: `MEMBERSHIP_IMPLEMENTATION.md`
- **Usage Guide**: `MEMBERSHIP_USAGE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`
- **Main README**: `README_MEMBERSHIP.md`

---

## 🎉 Summary

✅ **Mock IAP is enabled by default in development**  
✅ **No configuration needed to start testing**  
✅ **Automatically disabled in production**  
✅ **Full membership flow works identically**  
✅ **Safe and secure for all environments**

Start testing your membership features in Expo Go right now! 🚀

---

**Need Help?** Check the backend console logs for detailed mock purchase information.
