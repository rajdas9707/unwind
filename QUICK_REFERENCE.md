# 🚀 Membership System Quick Reference

## ⚡ Getting Started (3 Steps)

### 1. Seed Plans
```bash
cd unwind-server
node scripts/seed-plans.js
```

### 2. Add Environment Variables
```env
# unwind-server/.env
APPLE_SHARED_SECRET=your_secret
ANDROID_PACKAGE_NAME=com.yourapp
GOOGLE_PLAY_ACCESS_TOKEN=your_token
```

### 3. Use in Code
```jsx
import FeatureGate from "../components/FeatureGate";

<FeatureGate feature="advanced_analytics">
  <PremiumFeature />
</FeatureGate>
```

---

## 📦 Components

### `<FeatureGate>`
Lock features by feature ID or tier.

**Props:**
- `feature` - Feature ID (e.g., "advanced_analytics")
- `tier` - Tier level (e.g., "pro", "premium")
- `fallback` - Custom component when locked
- `showUpgradePrompt` - Show lock screen (default: true)

**Examples:**
```jsx
// By feature
<FeatureGate feature="meditation_library">
  <Meditation />
</FeatureGate>

// By tier
<FeatureGate tier="premium">
  <PremiumOnly />
</FeatureGate>

// Custom fallback
<FeatureGate 
  feature="export_data"
  fallback={<Text>Upgrade for exports</Text>}
>
  <ExportButton />
</FeatureGate>

// Hidden when locked
<FeatureGate feature="custom_themes" showUpgradePrompt={false}>
  <ThemeSelector />
</FeatureGate>
```

### `<MembershipModal>`
Show upgrade modal with plans.

**Props:**
- `visible` - Show/hide modal (boolean)
- `onClose` - Close handler function

**Example:**
```jsx
const [show, setShow] = useState(false);

<Button title="Upgrade" onPress={() => setShow(true)} />
<MembershipModal visible={show} onClose={() => setShow(false)} />
```

---

## 🪝 Hooks

### `useMembership()`
Access membership data anywhere.

**Returns:**
- `membership` - Current membership object
- `hasFeature(featureId)` - Check feature access
- `hasTier(tier)` - Check tier level
- `syncMembership(force)` - Refresh from server
- `updateMembership(data)` - Update after purchase
- `clearMembership()` - Clear on logout

**Example:**
```jsx
import { useMembership } from "../context/MembershipProvider";

function MyComponent() {
  const { membership, hasFeature, hasTier } = useMembership();
  
  console.log(membership.tier); // "free", "pro", "premium"
  
  if (hasFeature("ai_insights")) {
    // Show AI features
  }
  
  if (hasTier("pro")) {
    // Show pro+ content
  }
}
```

---

## 🎯 Feature IDs

| Feature ID | Tier | Description |
|------------|------|-------------|
| `basic_journal` | Free | Basic journal entries |
| `mood_tracking` | Free | Daily mood tracking |
| `basic_reminders` | Free | Up to 3 reminders |
| `unlimited_reminders` | Pro | Unlimited reminders |
| `advanced_analytics` | Pro | Detailed insights |
| `meditation_library` | Pro | Guided meditations |
| `ai_insights` | Pro | AI recommendations |
| `priority_support` | Premium | Priority help |
| `offline_mode` | Premium | Full offline access |
| `custom_themes` | Premium | Theme customization |
| `export_data` | Premium | Data export |

---

## 🛠 API Endpoints

### Public
```
GET /api/membership/plans
```
Returns all active plans with pricing.

### Protected (requires auth)
```
GET /api/membership/status
```
Returns user's current membership.

```
POST /api/membership/verify-purchase
Body: { platform, productId, purchaseToken, transactionReceipt }
```
Verify purchase and update membership.

---

## 🧪 Testing

### Manual Membership Update (MongoDB)
```javascript
db.users.updateOne(
  { firebaseUid: "user123" },
  { 
    $set: { 
      "membership.tier": "pro",
      "membership.features": ["basic_journal", "mood_tracking", "unlimited_reminders", "advanced_analytics", "meditation_library", "ai_insights"],
      "membership.expiry": new Date("2025-12-31"),
      "membership.lastUpdated": new Date()
    }
  }
)
```

### Clear Cache (React Native)
```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";
await AsyncStorage.removeItem("@unwind_membership");
```

---

## 💰 Pricing (Default)

| Plan | Monthly | Yearly |
|------|---------|--------|
| Free | $0 | $0 |
| Pro | $9.99 | $95.99 (20% off) |
| Premium | $19.99 | $191.99 (20% off) |

---

## 🎨 Common Patterns

### Show Different UI by Tier
```jsx
const { membership } = useMembership();

{membership.tier === "free" && <FreeTierBanner />}
{membership.tier === "pro" && <ProBadge />}
{membership.tier === "premium" && <PremiumBadge />}
```

### Conditional Button
```jsx
const { hasFeature } = useMembership();

{hasFeature("export_data") ? (
  <Button title="Export" onPress={handleExport} />
) : (
  <Button title="Upgrade to Export" onPress={showUpgrade} />
)}
```

### Check Before Action
```jsx
const { hasFeature } = useMembership();

const handleAction = () => {
  if (!hasFeature("advanced_analytics")) {
    Alert.alert("Premium Feature", "Upgrade to access");
    return;
  }
  // Perform action
};
```

---

## 🔧 Customization

### Change Plan Prices
Edit `unwind-server/scripts/seed-plans.js` and re-run:
```bash
node scripts/seed-plans.js
```

### Add New Feature
1. Add to plan in `seed-plans.js`
2. Re-seed database
3. Use in `<FeatureGate feature="new_feature">`

### Change Lock Screen UI
Edit `unwind-mobile/components/FeatureGate.js`

### Change Modal Design
Edit `unwind-mobile/components/MembershipModal.js`

---

## 🐛 Troubleshooting

**Problem:** Plans not loading
- Check backend is running
- Check `/api/membership/plans` endpoint
- Check MongoDB has plans (run seed script)

**Problem:** Membership not syncing
- Check network connection
- Force sync: `syncMembership(true)`
- Check Firebase auth token is valid

**Problem:** IAP not working
- Check product IDs match in App Store/Play Console
- Use sandbox/test accounts
- Check `expo-in-app-purchases` is installed

**Problem:** Features not unlocking
- Check membership.features array
- Verify feature ID spelling
- Check tier hierarchy (free < pro < premium)

---

## 📋 Checklist for Production

- [ ] Seed plans in production DB
- [ ] Add production env variables (.env)
- [ ] Configure IAP products (iOS & Android)
- [ ] Test purchase flow end-to-end
- [ ] Test restore purchases
- [ ] Test offline mode
- [ ] Test expiry logic
- [ ] Add error tracking (Sentry/etc)
- [ ] Add analytics for upgrades
- [ ] Document for your team

---

## 📚 Full Documentation

- **Implementation Details**: `MEMBERSHIP_IMPLEMENTATION.md`
- **Detailed Usage Guide**: `MEMBERSHIP_USAGE.md`
- **This Quick Reference**: `QUICK_REFERENCE.md`

---

**Need Help?** Check the full docs or inspect component source code for inline comments.
