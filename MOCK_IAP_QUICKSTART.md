# 🚀 Mock IAP Quick Start (1 Minute)

Test in-app purchases in Expo Go **without any setup!**

---

## ✅ What You Get

- ✅ Test membership upgrades **instantly**
- ✅ Works in **Expo Go** (no need for signed builds)
- ✅ No App Store/Play Console setup required
- ✅ Automatically disabled in production

---

## 🎯 How to Test Right Now

### 1. Start Your App
```bash
# In terminal 1: Start backend
cd unwind-server
npm start

# In terminal 2: Start mobile app
cd unwind-mobile
npm start
```

### 2. Open Membership Modal
In any screen of your app:
```jsx
import { useState } from "react";
import MembershipModal from "../components/MembershipModal";

// Add this to any screen
const [show, setShow] = useState(false);

<Button title="Upgrade" onPress={() => setShow(true)} />
<MembershipModal visible={show} onClose={() => setShow(false)} />
```

### 3. Click "Subscribe Now"
- Choose **Pro** or **Premium**
- Choose **Monthly** or **Yearly**
- Click **"Subscribe Now"**

### 4. Done! ✨
- You'll see: **"Development Mode - Mock purchase initiated"**
- Then: **"[DEV] Mock purchase successful!"**
- Your membership is now upgraded!

---

## 🔍 Verify It Worked

```jsx
import { useMembership } from "../context/MembershipProvider";

const { membership } = useMembership();

console.log(membership.tier); // "pro" or "premium" ✅
console.log(membership.features); // Array of unlocked features ✅
```

---

## 🛠 Already Implemented

The mock IAP system is **already built into your app**:

### Frontend (`unwind-mobile/`)
- ✅ `components/MembershipModal.js` - Auto-detects dev mode
- ✅ Generates mock tokens automatically
- ✅ Works with existing membership flow

### Backend (`unwind-server/`)
- ✅ `routes/membership.js` - Accepts mock tokens in dev
- ✅ Simulates successful verification
- ✅ Rejects mock tokens in production

---

## 📊 What Happens

### In Development (Expo Go)
```
Click Subscribe → Mock Token Generated → Sent to Backend → 
Backend Simulates Verification → Membership Upgraded → 
Features Unlocked ✅
```

### In Production (Signed Builds)
```
Click Subscribe → Real IAP Flow → Receipt Sent to Backend → 
Backend Verifies with Apple/Google → Membership Upgraded → 
Features Unlocked ✅
```

---

## 🎨 Test Different Scenarios

### Test Pro Plan
```
1. Open modal
2. Select "Pro"
3. Choose "Monthly" 
4. Subscribe
Result: User tier = "pro" for 30 days
```

### Test Premium Plan
```
1. Open modal
2. Select "Premium"
3. Choose "Yearly"
4. Subscribe
Result: User tier = "premium" for 365 days
```

### Test Feature Gates
```jsx
import FeatureGate from "../components/FeatureGate";

// This will be locked for free users
<FeatureGate feature="advanced_analytics">
  <AdvancedAnalytics />
</FeatureGate>

// After mock purchase → unlocked! ✅
```

---

## 🔒 Security

### Production Protection
Mock tokens are **automatically rejected** in production:

```javascript
// Backend automatically checks
if (process.env.NODE_ENV === "production" && isMockToken) {
  return res.status(403).json({ 
    error: "Mock tokens not allowed" 
  });
}
```

### Environment Detection
- **Frontend**: Uses `__DEV__` (React Native built-in)
- **Backend**: Uses `process.env.NODE_ENV`

---

## 🔄 Reset and Test Again

### Clear Membership
```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clear cache
await AsyncStorage.removeItem("@unwind_membership");

// Reload or force sync
const { syncMembership } = useMembership();
await syncMembership(true);
```

### Or Via MongoDB
```javascript
db.users.updateOne(
  { firebaseUid: "your_user_id" },
  { $set: { "membership.tier": "free" } }
)
```

---

## 📋 Console Logs to Look For

### Frontend (React Native)
```
🧪 DEV MODE: Simulating IAP purchase with mock token
```

### Backend (Node.js)
```
🧪 DEV MODE: Processing mock IAP token MOCK_TOKEN_DEV_1704412345_pro_monthly
✅ Mock purchase successful for user abc123: pro (monthly)
```

---

## 🚨 Common Questions

**Q: Do I need to configure anything?**  
A: No! It works automatically in Expo Go.

**Q: Will this work in production?**  
A: No. Mock tokens are automatically rejected in production builds.

**Q: How do I switch to real IAP?**  
A: Just build a production app. Real IAP is used automatically.

**Q: Can I test offline?**  
A: Yes! Membership is cached in AsyncStorage.

---

## 📚 More Information

For detailed documentation, see:
- **Full Guide**: `MOCK_IAP_TESTING.md`
- **Main README**: `README_MEMBERSHIP.md`
- **Usage Examples**: `MEMBERSHIP_USAGE.md`

---

## 🎉 You're Ready!

Open your app, click "Upgrade", and start testing! The mock IAP system is **already working**.

No setup. No configuration. Just test! 🚀

---

**Need Help?** Check the backend console logs for detailed mock purchase information.
