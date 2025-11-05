# 🔧 Troubleshooting Guide

## ❌ Error: "Error syncing membership: Request failed with status code 404"

### Cause
The membership routes are not accessible. This happens when:
1. Backend server hasn't been restarted after adding membership routes
2. Plans haven't been seeded in the database

---

## ✅ Solution

### 1. **Restart Backend Server**

```bash
cd unwind-server

# Stop the server (Ctrl+C if running)
# Then restart:
npm start
```

### 2. **Verify Plans Are Seeded**

```bash
cd unwind-server
node scripts/seed-plans.js
```

You should see:
```
✅ Connected to MongoDB
🗑️  Cleared existing plans
✅ Seeded plans successfully
📊 Total plans in database: 3
```

### 3. **Test Endpoints**

Open browser or use curl:

```bash
# Test health
https://your-backend-url.com/api/health

# Test plans (should return 3 plans)
https://your-backend-url.com/api/membership/plans
```

### 4. **Restart Mobile App**

```bash
cd unwind-mobile
npm start
# Press 'r' to reload
```

---

## 🔍 Verify Backend is Running

Check your backend console for:
```
Server running on port 5000
Environment: development
MongoDB Connected: ...
```

---

## 📋 Quick Checklist

- [ ] Backend server is running (`npm start` in unwind-server)
- [ ] MongoDB is connected
- [ ] Plans are seeded (`node scripts/seed-plans.js`)
- [ ] Backend shows no errors in console
- [ ] Can access `/api/health` endpoint
- [ ] Can access `/api/membership/plans` endpoint
- [ ] Mobile app restarted after backend changes

---

## 🚨 Still Getting 404?

### Check API URL in Mobile App

Edit `unwind-mobile/api/utils.js`:

```javascript
// Make sure this matches your backend URL
const API_BASE_URL = "http://192.168.x.x:5000"; // Local network
// OR
const API_BASE_URL = "https://your-tunnel.trycloudflare.com"; // Tunnel
```

### Verify Routes Are Registered

Check `unwind-server/server.js` has:
```javascript
const membershipRoutes = require("./routes/membership");
app.use("/api/membership", membershipRoutes);
```

### Check Backend Console

Look for errors like:
```
Error: Cannot find module './routes/membership'
```

If you see this, run:
```bash
cd unwind-server
npm install
```

---

## 📱 Common Mobile App Errors

### Error: "Network request failed"
**Solution**: Backend is not running or wrong API_BASE_URL

### Error: "Failed to load membership plans"
**Solution**: Plans not seeded. Run `node scripts/seed-plans.js`

### Error: "User not found" (when testing status)
**Solution**: User needs to be created. Log in to the app first.

---

## 🎯 Expected Behavior After Fix

1. **Mobile App Logs:**
```
✅ Membership synced: free
```

2. **Backend Logs:**
```
GET /api/membership/status 200
```

3. **No Errors:**
- No 404 errors
- Membership modal loads plans
- Feature gates work correctly

---

## 🔄 Complete Reset (If Nothing Works)

```bash
# 1. Stop everything
# Press Ctrl+C in all terminals

# 2. Restart MongoDB (if local)
# Windows: Check Services
# Mac: brew services restart mongodb-community

# 3. Seed plans
cd unwind-server
node scripts/seed-plans.js

# 4. Restart backend
npm start

# 5. Clear mobile cache
cd unwind-mobile
npm start -- --clear

# 6. In Expo app, shake phone > Reload
```

---

## 📞 Need More Help?

Check these files:
- `README_MEMBERSHIP.md` - Main documentation
- `MOCK_IAP_TESTING.md` - Testing guide
- `QUICK_REFERENCE.md` - Quick lookup

Look for console errors in:
- Backend terminal
- Expo Metro bundler
- Mobile app console (React Native Debugger)
