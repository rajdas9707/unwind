# Membership System Usage Guide

This document explains how to use the membership-based access control system in your Expo React Native app.

## 📋 Table of Contents
- [Setup](#setup)
- [Using FeatureGate](#using-featuregate)
- [Using the Membership Hook](#using-the-membership-hook)
- [Backend Setup](#backend-setup)
- [Testing](#testing)

---

## 🚀 Setup

### 1. Backend: Seed Plans

First, seed the plan data into MongoDB:

```bash
cd unwind-server
node scripts/seed-plans.js
```

### 2. Backend: Environment Variables

Add these to your `.env` file:

```env
# Apple IAP
APPLE_SHARED_SECRET=your_apple_shared_secret

# Google Play IAP
ANDROID_PACKAGE_NAME=com.yourapp.package
GOOGLE_PLAY_ACCESS_TOKEN=your_google_play_token
```

### 3. Mobile: Configure IAP Products

In your Apple App Store Connect and Google Play Console, create products with IDs matching the seed data:
- `com.unwind.pro.monthly`
- `com.unwind.pro.yearly`
- `com.unwind.premium.monthly`
- `com.unwind.premium.yearly`

---

## 🔒 Using FeatureGate

### Basic Feature Gate

Wrap any premium feature with `<FeatureGate>`:

```jsx
import FeatureGate from "../components/FeatureGate";

function MyScreen() {
  return (
    <View>
      {/* Free content - accessible to everyone */}
      <Text>This is free content</Text>

      {/* Premium content - locked for free users */}
      <FeatureGate feature="advanced_analytics">
        <AdvancedAnalyticsComponent />
      </FeatureGate>
    </View>
  );
}
```

### Tier-Based Gate

Lock content by tier:

```jsx
<FeatureGate tier="pro">
  <ProFeatureComponent />
</FeatureGate>

<FeatureGate tier="premium">
  <PremiumOnlyFeature />
</FeatureGate>
```

### Custom Fallback

Show custom content when locked:

```jsx
<FeatureGate 
  feature="meditation_library"
  fallback={<Text>Upgrade to access meditation library</Text>}
>
  <MeditationLibrary />
</FeatureGate>
```

### Hide Instead of Showing Lock

```jsx
<FeatureGate 
  feature="export_data" 
  showUpgradePrompt={false}
>
  <ExportButton />
</FeatureGate>
```

---

## 🪝 Using the Membership Hook

Access membership data anywhere in your app:

```jsx
import { useMembership } from "../context/MembershipProvider";

function MyComponent() {
  const { 
    membership, 
    hasFeature, 
    hasTier, 
    syncMembership 
  } = useMembership();

  // Check current tier
  console.log(membership.tier); // "free", "pro", or "premium"

  // Check specific feature
  if (hasFeature("advanced_analytics")) {
    // Show analytics
  }

  // Check tier level
  if (hasTier("pro")) {
    // Show pro+ features
  }

  // Force refresh from server
  const handleRefresh = async () => {
    await syncMembership(true);
  };

  return (
    <View>
      <Text>Current Plan: {membership.tier.toUpperCase()}</Text>
      <Button title="Refresh Membership" onPress={handleRefresh} />
    </View>
  );
}
```

---

## 🎯 Example: Protecting a Screen

Here's a complete example of protecting the meditation screen:

```jsx
// app/meditation.js
import { View, Text, StyleSheet } from "react-native";
import FeatureGate from "../components/FeatureGate";
import { useMembership } from "../context/MembershipProvider";

export default function MeditationScreen() {
  const { membership } = useMembership();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meditation</Text>

      {/* Free meditation - accessible to all */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Free Meditations</Text>
        <FreeMeditationList />
      </View>

      {/* Pro meditation library */}
      <FeatureGate feature="meditation_library">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Library</Text>
          <PremiumMeditationList />
        </View>
      </FeatureGate>

      {/* Show upgrade button for free users */}
      {membership.tier === "free" && (
        <View style={styles.upgradeSection}>
          <Text>Unlock 100+ guided meditations</Text>
          <Button title="Upgrade to Pro" onPress={showUpgradeModal} />
        </View>
      )}
    </View>
  );
}
```

---

## 🛠 Backend Setup

### Update User Membership Manually (for testing)

```javascript
// In MongoDB or via API
const user = await User.findOne({ firebaseUid: "user123" });
user.membership = {
  tier: "pro",
  expiry: new Date("2025-12-31"),
  features: ["basic_journal", "mood_tracking", "unlimited_reminders", "advanced_analytics", "meditation_library", "ai_insights"],
  lastUpdated: new Date(),
};
await user.save();
```

### Check Membership via API

```bash
# Get membership status
curl -H "Authorization: Bearer <firebase_token>" \
  https://your-api.com/api/membership/status

# Get all plans
curl https://your-api.com/api/membership/plans
```

---

## 🧪 Testing

### Test Without IAP

For development, you can manually set user membership in the database to test different tiers without making real purchases.

### Test IAP Flow

1. **iOS**: Use sandbox accounts in App Store Connect
2. **Android**: Use test accounts in Google Play Console
3. Make a test purchase
4. Verify the receipt is sent to your backend
5. Confirm membership updates in the app

### Clear Membership Cache

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clear membership cache
await AsyncStorage.removeItem("@unwind_membership");
```

---

## 📝 Feature IDs

Available feature IDs (from seed data):
- `basic_journal` (Free)
- `mood_tracking` (Free)
- `basic_reminders` (Free)
- `unlimited_reminders` (Pro+)
- `advanced_analytics` (Pro+)
- `meditation_library` (Pro+)
- `ai_insights` (Pro+)
- `priority_support` (Premium)
- `offline_mode` (Premium)
- `custom_themes` (Premium)
- `export_data` (Premium)

---

## 🔄 How It Works

1. **User logs in** → MembershipProvider loads cached membership from AsyncStorage
2. **App checks cache age** → If >24h old, fetches fresh data from backend
3. **User opens premium feature** → FeatureGate checks membership.features array
4. **Access denied** → Shows upgrade modal with dynamic plans from backend
5. **User purchases** → IAP receipt sent to backend for verification
6. **Backend verifies** → Updates user.membership in MongoDB
7. **App syncs** → Updates local state + AsyncStorage
8. **Feature unlocked** → FeatureGate renders children

---

## 🎨 Customization

### Customize Lock Screen

Edit `components/FeatureGate.js` to change the locked overlay design.

### Customize Membership Modal

Edit `components/MembershipModal.js` to change plan card layouts, colors, or add marketing copy.

### Add New Features

1. Add feature to plan in `scripts/seed-plans.js`
2. Re-run seed script
3. Use feature ID in `<FeatureGate feature="new_feature">`

---

## ⚠️ Important Notes

- **No hardcoded plans**: All plan data comes from the backend dynamically
- **Offline support**: Membership is cached and works offline (marked as "unverified")
- **Auto-expiry**: Backend checks expiry date and resets to "free" if expired
- **Purchase history**: All purchases are logged in user.membership.purchaseHistory
- **Platform-specific**: Uses correct product IDs for iOS vs Android automatically

---

## 🐛 Troubleshooting

### "Product not found"
- Ensure product IDs in MongoDB match App Store Connect / Google Play Console
- Check that products are in "Ready to Submit" or "Approved" status

### Membership not syncing
- Check network connection
- Force sync: `syncMembership(true)`
- Check backend logs for errors

### IAP not connecting
- Ensure `expo-in-app-purchases` is installed
- Check that IAP is configured correctly in app.json/app.config.js
- Test with sandbox accounts

---

## 📚 Additional Resources

- [Expo In-App Purchases Docs](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Apple IAP Testing](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases)
- [Google Play Billing Testing](https://developer.android.com/google/play/billing/test)
