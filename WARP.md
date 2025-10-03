# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Unwind** is a full-stack mental health and self-improvement application consisting of:
- **Backend**: Node.js/Express API server with MongoDB and AI integration
- **Frontend**: React Native mobile app built with Expo

The app focuses on three core mental health features: **Journal Entries**, **Overthinking Management**, and **Mistake Learning**, with AI-powered insights and cross-platform synchronization.

## Development Commands

### Server Development (unwind-server/)
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Test LLM integration
node test-llm.js
```

### Mobile Development (unwind-mobile/)
```bash
# Install dependencies
npm install

# Start Expo development server
npm run start

# Run on Android device/emulator
npm run android

# Run on iOS device/simulator
npm run ios

# Run in web browser
npm run web
```

### Database Setup
1. Ensure MongoDB is running locally or configure `MONGODB_URI` in server's `.env`
2. Server auto-creates collections on first run with proper indexing
3. Mobile app uses SQLite locally with optional cloud sync

## High-Level Architecture

### Dual-Platform Design
The app follows a **hybrid offline-first/cloud-sync architecture**:
- **Mobile app**: SQLite for local storage, Firebase Auth, optional cloud sync
- **Server**: MongoDB + Express API with Firebase Admin SDK for auth verification
- **Sync Strategy**: Mobile-first with background sync when connected

### Authentication Flow
- **Firebase Authentication** with AsyncStorage persistence on mobile
- **Firebase Admin SDK** for server-side token verification
- All API routes (except auth) protected with `verifyToken` middleware
- Automatic token refresh and retry mechanisms

### Data Architecture
Three core mental health features share common patterns:

**Journal Entries**
- Daily reflections with mood tracking and tags
- AI-powered supportive feedback via LLM integration
- Automatic and manual AI processing options

**Overthinking Management** 
- Thought capture with solution tracking
- "Dumping" mechanism for releasing negative thoughts
- Category-based organization and intensity ratings

**Mistake Learning**
- Mistake documentation with improvement solutions
- Streak tracking for avoiding repeated mistakes
- Category-based analytics and progress insights

### AI Integration (LLM Module)
- **Perplexity AI** integration via LangChain
- Modular LLM system in `/llm` directory with controller-service-route pattern
- Automatic AI processing on journal entry creation
- Manual sync endpoint for retry scenarios
- AI responses stored with metadata (tokens, response time, model used)

### Mobile App Architecture
- **Expo Router** for file-based navigation with tab-based structure
- **Context-driven state management**: `AuthProvider` → App content
- **API Client**: Centralized HTTP client with Firebase token injection
- **Offline Support**: Local SQLite storage with background sync
- **Network-aware**: Uses `useNetworkStatus` hook for connectivity decisions

### Server Architecture
```
unwind-server/
├── models/           # Mongoose schemas with proper indexing
├── routes/           # Express route definitions
├── llm/              # Modular AI integration
│   ├── controllers/  # Request handlers
│   ├── services/     # Core AI logic
│   └── routes/       # LLM endpoints
├── server.js         # Main server setup
└── verifyToken.js    # Firebase auth middleware
```

### Mobile App Structure
```
unwind-mobile/
├── app/              # Expo Router screens
│   ├── (tabs)/       # Tab navigation screens
│   ├── auth.js       # Authentication flow
│   └── _layout.js    # Root layout with providers
├── api/              # HTTP client and API functions
├── context/          # React contexts (Auth)
├── components/       # Reusable UI components
└── firebaseConfig.js # Firebase configuration
```

## Key Technical Patterns

### Database Operations
**Server-side**: Use Mongoose models with proper error handling:
```javascript
// All models have userId indexing and timestamps
const journal = await Journal.findOne({ userId, _id: id });
```

**Mobile-side**: All API calls use centralized client with automatic auth:
```javascript
// Automatic Firebase token injection and error handling
const result = await client.post('/api/journal', journalData);
```

### Error Handling Strategy
- **Server**: Centralized error middleware with development vs production message filtering
- **Client**: `ApiResult` wrapper for consistent success/error response handling
- **Network Failures**: Graceful degradation with offline storage fallback

### AI Processing Patterns
```javascript
// Journal entries automatically attempt AI processing
// If AI fails, entry still saves with null aiResponse
// Manual sync available via POST /api/journal/sync/:id
```

### Authentication Patterns
- Firebase tokens automatically injected into API requests
- Server middleware validates tokens and attaches user context
- Automatic token refresh on mobile with retry logic

## Environment Configuration

### Server (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/mental-clarity

# Server
PORT=5000
NODE_ENV=development

# Firebase Admin
FIREBASE_PROJECT_ID=unwind-5bc5c
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# AI Integration
PERPLEXITY_API_KEY=your-api-key-here
AI_DEFAULT_MODEL=llama-3.1-sonar-small-128k-online
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

### Mobile (Environment Variables)
```bash
EXPO_PUBLIC_API_URL=http://your-server:5000
EXPO_PUBLIC_API_DEBUG=false
```

## Development Workflows

### Adding New Features
1. **Server**: Create model → route → controller pattern
2. **Mobile**: Add API client function → implement UI → handle sync
3. **Both**: Update authentication if needed, test offline scenarios

### Testing AI Integration
```bash
# Server-side AI testing
cd unwind-server
node test-llm.js
```

### Database Schema Updates
- Server: Modify Mongoose models, migrations auto-handled
- Mobile: SQLite schema changes need manual migration logic

### Debugging Network Issues
- Use `EXPO_PUBLIC_API_DEBUG=true` for detailed client logging
- Check server logs for Firebase token validation issues
- Test offline functionality with network disconnection

## Key Integration Points

### Firebase Integration
- **Mobile**: Firebase SDK for auth, AsyncStorage for persistence
- **Server**: Firebase Admin SDK for token verification
- **Security**: All non-auth endpoints require valid Firebase tokens

### MongoDB Schema Design
- All documents include `userId` field with indexing
- Timestamps automatically added via Mongoose
- Text fields support tags and categorical organization
- AI metadata stored alongside user content

### Cross-Platform Sync
- Mobile-first design with local SQLite storage
- Background sync respects user privacy settings
- Conflict resolution favors local changes
- Graceful handling of sync failures

## Critical Files to Review

### Server
- `server.js` - Main server setup and middleware configuration
- `verifyToken.js` - Firebase authentication middleware
- `llm/services/aiService.js` - Core AI processing logic
- `models/*.js` - Database schema definitions

### Mobile
- `app/_layout.js` - App-wide provider setup and navigation
- `api/client.js` - Centralized HTTP client with auth handling
- `context/AuthProvider.js` - Authentication state management
- `firebaseConfig.js` - Firebase configuration and setup

## Common Development Tasks

### Server Development
```bash
# Start server with auto-reload
npm run dev

# Test specific API endpoint
curl -H "Authorization: Bearer $FIREBASE_TOKEN" http://localhost:5000/api/health

# Check database connections
# MongoDB connection logged on server startup
```

### Mobile Development
```bash
# Start with specific platform
npm run android  # or ios, web

# Clear Expo cache (if having issues)
npx expo start --clear

# Check network connectivity
# Use device settings or disable WiFi to test offline mode
```

### Troubleshooting
- **AI not working**: Check `PERPLEXITY_API_KEY` configuration
- **Auth errors**: Verify Firebase configuration matches project settings
- **Database issues**: Ensure MongoDB is running and accessible
- **Mobile sync failing**: Check server URL and network connectivity