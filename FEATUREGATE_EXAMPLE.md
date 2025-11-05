# 🔒 FeatureGate Component - Usage Examples

The **FeatureGate** component now displays a beautiful, blurred overlay with a lock icon when users try to access premium features.

---

## 🎨 New Design Features

### **Visual Elements**
- ✅ **Blurred background** - Uses expo-blur for frosted glass effect
- ✅ **Gradient lock icon** - Purple gradient circular badge
- ✅ **Benefits list** - Shows 3 key benefits with checkmarks
- ✅ **Gradient upgrade button** - Eye-catching call-to-action
- ✅ **Current tier badge** - Shows user's current plan with dot indicator
- ✅ **Professional shadows** - Multiple elevation levels
- ✅ **Smooth animations** - Native feel

---

## 📖 Usage Examples

### **Example 1: Protect Entire Screen**

```jsx
import FeatureGate from "../components/FeatureGate";

export default function AdvancedAnalyticsScreen() {
  return (
    <FeatureGate feature="advanced_analytics">
      {/* This content only shows for users with access */}
      <View style={styles.container}>
        <Text>Advanced Analytics Dashboard</Text>
        <Chart data={analyticsData} />
      </View>
    </FeatureGate>
  );
}
```

**Result**: Free users see beautiful lock overlay, Pro+ users see content.

---

### **Example 2: Protect Specific Section**

```jsx
import FeatureGate from "../components/FeatureGate";

export default function SettingsScreen() {
  return (
    <ScrollView>
      {/* Free content - everyone can see */}
      <View>
        <Text>Basic Settings</Text>
        <Switch value={notifications} />
      </View>

      {/* Premium content - locked for free users */}
      <FeatureGate feature="custom_themes">
        <View>
          <Text>Theme Customization</Text>
          <ThemePicker />
        </View>
      </FeatureGate>

      {/* More free content */}
      <View>
        <Text>Account Settings</Text>
      </View>
    </ScrollView>
  );
}
```

**Result**: Lock overlay appears inline where premium section would be.

---

### **Example 3: Tier-Based Protection**

```jsx
<FeatureGate tier="premium">
  <PremiumOnlyComponent />
</FeatureGate>
```

**Result**: 
- Free users see: "Upgrade to Premium"
- Pro users see: "Upgrade to Premium"
- Premium users see: Content unlocked

---

### **Example 4: Hide Instead of Showing Lock**

```jsx
<FeatureGate 
  feature="export_data" 
  showUpgradePrompt={false}
>
  <ExportButton />
</FeatureGate>
```

**Result**: Feature completely hidden (not just locked) for users without access.

---

### **Example 5: Custom Fallback**

```jsx
<FeatureGate 
  feature="ai_insights"
  fallback={<Text>Upgrade to get AI-powered insights!</Text>}
>
  <AIInsightsPanel />
</FeatureGate>
```

**Result**: Shows custom message instead of default lock overlay.

---

## 🎯 Real-World Examples

### **Meditation Screen**

```jsx
// app/meditation.js
import FeatureGate from "../components/FeatureGate";

export default function MeditationScreen() {
  return (
    <ScrollView>
      <Text style={styles.title}>Meditation</Text>

      {/* Free content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Free Meditations</Text>
        <MeditationCard title="5-Minute Breathing" free />
        <MeditationCard title="Quick Calm" free />
      </View>

      {/* Premium library - locked for free users */}
      <FeatureGate feature="meditation_library">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Library</Text>
          <MeditationCard title="Deep Sleep Journey" />
          <MeditationCard title="Anxiety Relief" />
          <MeditationCard title="Focus Enhancement" />
          {/* 50+ more meditations */}
        </View>
      </FeatureGate>
    </ScrollView>
  );
}
```

---

### **Analytics Dashboard**

```jsx
// app/analytics.js
import FeatureGate from "../components/FeatureGate";

export default function AnalyticsScreen() {
  return (
    <FeatureGate feature="advanced_analytics">
      <View style={styles.container}>
        <Text style={styles.title}>Advanced Analytics</Text>
        
        {/* All premium analytics content */}
        <LineChart data={moodTrends} />
        <BarChart data={activityStats} />
        <HeatMap data={weeklyPatterns} />
        <InsightsPanel insights={aiInsights} />
      </View>
    </FeatureGate>
  );
}
```

---

### **Export Feature**

```jsx
// In any settings screen
import FeatureGate from "../components/FeatureGate";

export default function DataScreen() {
  return (
    <View>
      <Text>Your Data</Text>
      
      {/* Show button only to premium users */}
      <FeatureGate feature="export_data" showUpgradePrompt={false}>
        <TouchableOpacity onPress={handleExport}>
          <Text>Export All Data</Text>
        </TouchableOpacity>
      </FeatureGate>
    </View>
  );
}
```

---

## 🎨 What Users See

### **Free User Viewing Premium Feature**

```
┌─────────────────────────────┐
│    [Blurred Background]     │
│                             │
│  ┌───────────────────────┐  │
│  │    [Purple Lock 🔒]   │  │
│  │                       │  │
│  │  🔒 Premium Feature   │  │
│  │                       │  │
│  │  This feature requires│  │
│  │  a Pro membership     │  │
│  │                       │  │
│  │  ✓ Unlock advanced    │  │
│  │  ✓ Access premium     │  │
│  │  ✓ Priority support   │  │
│  │                       │  │
│  │  [Upgrade to Pro]     │  │
│  │                       │  │
│  │  Current Plan: FREE   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 🔑 Available Feature IDs

| Feature ID | Tier | Description |
|------------|------|-------------|
| `basic_journal` | Free | Basic journal entries |
| `mood_tracking` | Free | Daily mood tracking |
| `basic_reminders` | Free | Up to 3 reminders |
| `unlimited_reminders` | Pro | Unlimited reminders |
| `advanced_analytics` | Pro | Detailed insights & charts |
| `meditation_library` | Pro | Full meditation library |
| `ai_insights` | Pro | AI-powered recommendations |
| `priority_support` | Premium | Priority customer support |
| `offline_mode` | Premium | Full offline access |
| `custom_themes` | Premium | Theme customization |
| `export_data` | Premium | Export all user data |

---

## 📊 Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `feature` | string | `null` | Feature ID to check (e.g., "ai_insights") |
| `tier` | string | `null` | Required tier (e.g., "pro", "premium") |
| `fallback` | component | `null` | Custom component when locked |
| `showUpgradePrompt` | boolean | `true` | Show lock overlay or hide completely |
| `children` | component | - | Content to protect |

---

## 💡 Pro Tips

### **1. Use Feature IDs for Specific Features**
```jsx
// Good - specific feature check
<FeatureGate feature="ai_insights">

// Less good - tier check (less flexible)
<FeatureGate tier="pro">
```

### **2. Combine Multiple Gates**
```jsx
<FeatureGate feature="advanced_analytics">
  <AnalyticsHeader />
  
  <FeatureGate feature="export_data" showUpgradePrompt={false}>
    <ExportButton />
  </FeatureGate>
</FeatureGate>
```

### **3. Progressive Disclosure**
```jsx
// Show basic version to free users, advanced to paid
{hasTier("free") ? (
  <BasicChart data={data} />
) : (
  <FeatureGate feature="advanced_analytics">
    <AdvancedChart data={data} />
  </FeatureGate>
)}
```

---

## 🎬 Step-by-Step Integration

### **1. Import the Component**
```jsx
import FeatureGate from "../components/FeatureGate";
```

### **2. Wrap Your Premium Content**
```jsx
<FeatureGate feature="your_feature_id">
  <YourPremiumComponent />
</FeatureGate>
```

### **3. Test Different Tiers**
- Update your membership via billing screen
- Or test with mock purchases (dev mode)
- Or manually update in MongoDB

---

## 🚀 Testing Guide

### **Test Free User**
```mongodb
db.users.updateOne(
  { firebaseUid: "test_user" },
  { $set: { "membership.tier": "free" } }
)
```
**Expected**: Lock overlay appears ✅

### **Test Pro User**
```mongodb
db.users.updateOne(
  { firebaseUid: "test_user" },
  { $set: { 
    "membership.tier": "pro",
    "membership.features": ["basic_journal", "advanced_analytics", "meditation_library"]
  }}
)
```
**Expected**: Pro features unlocked, Premium still locked ✅

### **Test Premium User**
```mongodb
db.users.updateOne(
  { firebaseUid: "test_user" },
  { $set: { 
    "membership.tier": "premium",
    "membership.features": ["all_features"]
  }}
)
```
**Expected**: Everything unlocked ✅

---

## 🎨 Customization

### **Change Colors**
Edit `components/FeatureGate.js`:
```jsx
// Change gradient colors
<LinearGradient
  colors={["#YOUR_COLOR_1", "#YOUR_COLOR_2"]}
  // ...
/>
```

### **Change Benefits Text**
```jsx
<Text style={styles.benefitText}>Your custom benefit</Text>
```

### **Change Button Text**
```jsx
<Text style={styles.upgradeButtonText}>
  Get {requiredTier} Now
</Text>
```

---

## ✨ Summary

The enhanced FeatureGate component provides:
- 🎨 **Beautiful UI** with blur, gradients, and shadows
- 🔒 **Clear messaging** about locked features
- 📱 **Native feel** with smooth animations
- 🚀 **Easy integration** - just wrap your content
- 🎯 **Flexible options** - feature or tier based
- 💪 **Production ready** - tested and polished

**Just wrap any premium content with `<FeatureGate>` and you're done!**
