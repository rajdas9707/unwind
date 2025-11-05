# 📦 Backup & Restore System Documentation

## Overview
Complete Backup and Restore system for the Unwind Expo React Native app with local (free) and cloud (premium) options.

---

## 🎯 Features Implemented

### ✅ Local Backup (Free)
- Export all SQLite tables and AsyncStorage data to JSON
- Save backup file to device with timestamp
- Share/save backup using expo-sharing
- Restore from JSON backup file
- Validate backup file format before restoring
- Confirmation dialogs to prevent accidental data loss

### ☁️ Cloud Backup (Premium)
- Upload backup to cloud storage via backend API
- Download latest or specific backup from cloud
- List all cloud backups with metadata
- Premium membership verification
- In-app purchase integration for premium upgrade
- Membership status display with expiration date

### 📊 Additional Features
- Real-time backup statistics (total records, last backup date, backup type)
- Progress indicators during backup/restore operations
- Comprehensive error handling with user-friendly messages
- Clean, minimal UI with toast notifications
- Support for both Android and iOS

---

## 📂 Files Created

### 1. **utils/backupManager.js**
Core utility for backup and restore operations.

**Functions:**
- `exportSQLiteData()` - Export all SQLite tables
- `exportAsyncStorageData()` - Export AsyncStorage data
- `createBackup()` - Create complete backup object with metadata
- `saveBackupToFile()` - Save backup to local file system
- `shareBackupFile()` - Share backup file with user
- `pickBackupFile()` - Let user pick backup file to restore
- `restoreSQLiteData()` - Restore SQLite data from backup
- `restoreAsyncStorageData()` - Restore AsyncStorage data
- `restoreBackup()` - Complete restore operation
- `getBackupStats()` - Get backup statistics
- `performLocalBackup()` - Complete local backup workflow
- `performLocalRestore()` - Complete local restore workflow

**SQLite Tables Backed Up:**
- notes
- journals
- mistakes
- overthinking
- todos
- habits
- ideas
- documents
- custom_lists
- water_reminders
- daily_summaries

### 2. **api/membership.js**
API integration for membership management.

**Functions:**
- `getMembershipStatus()` - Get user's membership status
- `updateMembershipAfterPurchase()` - Update membership after IAP
- `verifyPayment()` - Verify payment with backend
- `canUseCloudBackup()` - Check if user can use cloud backup
- `getPremiumPlans()` - Get available premium plans

### 3. **api/backup.js**
API integration for cloud backup operations.

**Functions:**
- `uploadBackupToCloud()` - Upload backup to cloud storage
- `downloadBackupFromCloud()` - Download backup from cloud
- `getCloudBackupsList()` - Get list of all cloud backups
- `deleteCloudBackup()` - Delete specific cloud backup
- `getCloudStorageInfo()` - Get storage usage information

### 4. **app/settings/backup-restore.js**
Main UI screen component for backup and restore.

**Features:**
- Local backup/restore buttons
- Cloud backup/restore buttons (with premium gating)
- Backup statistics display
- Premium upgrade modal
- In-app purchase integration
- Progress indicators and loading states
- Comprehensive error handling

---

## 🔧 Backend API Requirements

You need to implement the following endpoints in your Node.js + MongoDB backend:

### Membership Endpoints

#### 1. GET `/api/membership/status`
Get user's membership status.

**Headers:**
```json
{
  "Authorization": "Bearer <firebase_token>"
}
```

**Response:**
```json
{
  "canUseCloudBackup": true,
  "expiresAt": "2024-12-31T23:59:59.999Z",
  "subscriptionType": "monthly",
  "isActive": true
}
```

#### 2. POST `/api/membership/update`
Update membership after successful purchase.

**Request:**
```json
{
  "purchaseToken": "string",
  "productId": "premium_monthly",
  "platform": "android" | "ios"
}
```

**Response:**
```json
{
  "success": true,
  "membership": {
    "canUseCloudBackup": true,
    "expiresAt": "2024-12-31T23:59:59.999Z"
  }
}
```

#### 3. POST `/api/membership/verify-payment`
Verify payment status.

**Request:**
```json
{
  "purchaseToken": "string"
}
```

**Response:**
```json
{
  "isValid": true,
  "expiresAt": "2024-12-31T23:59:59.999Z"
}
```

#### 4. GET `/api/membership/plans`
Get available premium plans.

**Response:**
```json
[
  {
    "id": "premium_monthly",
    "name": "Premium Monthly",
    "price": "$4.99",
    "duration": "month",
    "features": ["Cloud Backup", "Priority Support"]
  }
]
```

### Backup Endpoints

#### 5. POST `/api/backup/upload`
Upload backup to cloud.

**Headers:**
```json
{
  "Authorization": "Bearer <firebase_token>",
  "Content-Type": "application/json"
}
```

**Request:**
```json
{
  "backupData": {
    "metadata": {
      "version": "1.0.0",
      "appName": "Unwind",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "size": 1024000,
      "sizeFormatted": "1.00 MB"
    },
    "sqliteData": { /* all table data */ },
    "asyncStorageData": { /* all storage data */ }
  },
  "metadata": {
    "uploadedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "backupId": "backup_123456",
  "backupUrl": "https://your-storage.com/backups/backup_123456.json",
  "uploadedAt": "2024-01-15T10:35:00.000Z"
}
```

#### 6. GET `/api/backup/download/latest` or `/api/backup/download/:backupId`
Download backup from cloud.

**Response:**
```json
{
  "metadata": { /* backup metadata */ },
  "sqliteData": { /* all table data */ },
  "asyncStorageData": { /* all storage data */ }
}
```

#### 7. GET `/api/backup/list`
Get list of all backups for user.

**Response:**
```json
[
  {
    "backupId": "backup_123456",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "size": 1024000,
    "sizeFormatted": "1.00 MB",
    "platform": "android"
  }
]
```

#### 8. DELETE `/api/backup/delete/:backupId`
Delete specific backup.

**Response:**
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

#### 9. GET `/api/backup/storage-info`
Get storage usage information.

**Response:**
```json
{
  "usedSpace": 5120000,
  "totalSpace": 104857600,
  "backupCount": 5
}
```

---

## 🗄️ MongoDB Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  uid: String,              // Firebase UID
  email: String,
  name: String,
  membership: {
    canUseCloudBackup: Boolean,
    expiresAt: Date,
    subscriptionType: String, // "monthly", "yearly"
    isActive: Boolean,
    purchaseToken: String,
    platform: String          // "android" or "ios"
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Backups Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // Reference to users collection
  backupId: String,         // Unique backup identifier
  backupUrl: String,        // S3 or MongoDB GridFS URL
  backupData: Object,       // Or store reference to file storage
  metadata: {
    version: String,
    appName: String,
    createdAt: Date,
    uploadedAt: Date,
    size: Number,
    sizeFormatted: String,
    platform: String
  },
  paymentStatus: {
    isVerified: Boolean,
    purchaseToken: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Usage

### Navigate to Backup Screen
In your app, add navigation to the backup screen:

```javascript
import { router } from 'expo-router';

// Navigate to backup screen
router.push('/settings/backup-restore');
```

### Local Backup Flow
1. User taps "Create Local Backup"
2. App exports all SQLite and AsyncStorage data
3. Creates JSON file with timestamp
4. Shares file using system share sheet
5. User can save to Files, Drive, or share via other apps

### Local Restore Flow
1. User taps "Restore from File"
2. Document picker opens
3. User selects backup JSON file
4. App validates file format
5. Confirmation dialog appears
6. Data is restored to SQLite and AsyncStorage

### Cloud Backup Flow (Premium)
1. User taps "Backup to Cloud"
2. If not premium, upgrade modal appears
3. If premium, backup is uploaded to backend
4. Backend stores in MongoDB or S3
5. Success message shown to user

### Cloud Restore Flow (Premium)
1. User taps "Restore from Cloud"
2. If not premium, upgrade modal appears
3. If premium, latest backup is downloaded
4. Confirmation dialog appears
5. Data is restored from cloud backup

---

## 🔐 Security Considerations

### Frontend
- All API calls use Firebase authentication tokens
- Backup files are stored locally with device security
- Confirmation dialogs prevent accidental data loss
- Sensitive data encrypted before cloud upload (implement if needed)

### Backend
- Verify Firebase tokens on all endpoints
- Check membership status before cloud operations
- Validate purchase tokens with Apple/Google
- Rate limit backup uploads
- Encrypt backups at rest in cloud storage
- Implement backup size limits

---

## 🎨 UI/UX Features

- **Clean Design**: Minimal, iOS-style interface
- **Progress Indicators**: Show loading states during operations
- **Error Handling**: User-friendly error messages
- **Confirmation Dialogs**: Prevent accidental data loss
- **Statistics Display**: Show backup info and status
- **Premium Badge**: Clear indication of premium features
- **Responsive Layout**: Works on all screen sizes

---

## 🧪 Testing Checklist

### Local Backup
- [ ] Create backup successfully
- [ ] Share backup file works
- [ ] Backup includes all tables
- [ ] Backup metadata is correct
- [ ] File size is calculated correctly

### Local Restore
- [ ] Pick file works on both platforms
- [ ] Validate backup file format
- [ ] Restore all data correctly
- [ ] Show error for invalid files
- [ ] Confirmation dialog appears

### Cloud Backup (Premium)
- [ ] Premium check works
- [ ] Upload backup successfully
- [ ] Backend receives correct data
- [ ] Success message appears
- [ ] Stats update after backup

### Cloud Restore (Premium)
- [ ] Premium check works
- [ ] Download backup successfully
- [ ] Restore data correctly
- [ ] Handle no backup found
- [ ] Confirmation dialog appears

### Premium Features
- [ ] IAP initialization works
- [ ] Product loading works
- [ ] Purchase flow completes
- [ ] Backend updates membership
- [ ] UI updates after purchase

### Error Handling
- [ ] Network errors handled
- [ ] Authentication errors handled
- [ ] File system errors handled
- [ ] Invalid backup format handled
- [ ] Expired membership handled

---

## 📝 Notes

1. **Backup File Format**: Backups are stored as JSON with metadata, SQLite data, and AsyncStorage data
2. **File Naming**: Local backups use timestamp: `unwind-backup-2024-01-15T10-30-00-000Z.json`
3. **Data Validation**: Both backup and restore validate data structure
4. **Platform Support**: Works on Android and iOS with platform-specific IAP
5. **Offline Support**: Local backup/restore works offline
6. **Cloud Sync**: Cloud features require internet connection

---

## 🔄 Future Enhancements

- [ ] Automatic scheduled backups
- [ ] Selective backup (choose specific data types)
- [ ] Backup encryption with user password
- [ ] Backup compression to reduce size
- [ ] Multiple cloud backup versions
- [ ] Backup diff/incremental backups
- [ ] Email backup file to user
- [ ] Backup to Google Drive/iCloud directly
- [ ] Backup history with restore points
- [ ] Data export in other formats (CSV, etc.)

---

## 🐛 Troubleshooting

### "Backup Failed" Error
- Check database permissions
- Ensure sufficient storage space
- Verify all tables exist in database

### "Restore Failed" Error
- Verify backup file format
- Check for corrupted JSON
- Ensure database is accessible

### "Cloud Backup Not Available" Error
- Check internet connection
- Verify premium membership status
- Check backend API availability

### IAP Issues
- Ensure IAP is configured in App Store Connect / Google Play Console
- Check product IDs match
- Verify IAP permissions in app.json

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in console
3. Contact backend team for API issues
4. Test with sample backup files

---

## ✅ Implementation Complete

All required components have been created:
- ✅ `utils/backupManager.js` - Core backup/restore logic
- ✅ `api/membership.js` - Membership API integration
- ✅ `api/backup.js` - Cloud backup API integration
- ✅ `app/settings/backup-restore.js` - UI screen component

**Next Steps:**
1. Implement backend API endpoints (see Backend API Requirements section)
2. Configure In-App Purchases in App Store Connect and Google Play Console
3. Test local backup/restore functionality
4. Test premium upgrade flow
5. Test cloud backup/restore after backend is ready
6. Add navigation link from settings screen
