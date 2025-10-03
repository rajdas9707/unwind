# Mental Clarity Backend API

A REST API for the Mental Clarity self-improvement app, built with Node.js, Express, and MongoDB.

## Features

- **Journal Entries**: CRUD operations for personal journal entries
- **Overthinking Management**: Track and manage overthinking patterns
- **Mistake Learning**: Log mistakes and track improvement streaks
- **Statistics**: Get insights and analytics for each feature
- **MongoDB Integration**: Persistent data storage with Mongoose
- **RESTful API**: Clean, organized endpoint structure

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables**
Create a `.env` file based on `.env.example`:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mental-clarity
NODE_ENV=development
```

3. **Start MongoDB**
Make sure MongoDB is running on your system.

4. **Run the Server**
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Journal Entries
- `GET /api/journal/:userId` - Get all journal entries for a user
- `GET /api/journal/:userId/:id` - Get specific journal entry
- `POST /api/journal/:userId` - Create new journal entry
- `PUT /api/journal/:userId/:id` - Update journal entry
- `DELETE /api/journal/:userId/:id` - Delete journal entry
- `GET /api/journal/:userId/stats` - Get journal statistics

### Overthinking Management
- `GET /api/overthinking/:userId` - Get all overthinking entries
- `GET /api/overthinking/:userId/:id` - Get specific overthinking entry
- `POST /api/overthinking/:userId` - Create new overthinking entry
- `PUT /api/overthinking/:userId/:id` - Update overthinking entry
- `DELETE /api/overthinking/:userId/:id` - Delete overthinking entry
- `PATCH /api/overthinking/:userId/:id/dump` - Mark thought as released
- `GET /api/overthinking/:userId/stats` - Get overthinking statistics

### Mistake Learning
- `GET /api/mistakes/:userId` - Get all mistake entries
- `GET /api/mistakes/:userId/:id` - Get specific mistake entry
- `POST /api/mistakes/:userId` - Create new mistake entry
- `PUT /api/mistakes/:userId/:id` - Update mistake entry
- `DELETE /api/mistakes/:userId/:id` - Delete mistake entry
- `PATCH /api/mistakes/:userId/:id/toggle-avoided` - Toggle avoided status
- `GET /api/mistakes/:userId/stats` - Get mistake statistics

## Request/Response Examples

### Create Journal Entry
```bash
POST /api/journal/user123
Content-Type: application/json

{
  "content": "Today I reflected on my goals and felt motivated to continue my journey.",
  "date": "2024-01-15",
  "mood": "happy",
  "tags": ["goals", "motivation", "reflection"]
}
```

### Create Overthinking Entry
```bash
POST /api/overthinking/user123
Content-Type: application/json

{
  "thought": "I keep worrying about the presentation tomorrow",
  "solution": "I will practice once more and remember that I'm well-prepared",
  "date": "2024-01-15",
  "category": "work",
  "intensity": 7
}
```

### Create Mistake Entry
```bash
POST /api/mistakes/user123
Content-Type: application/json

{
  "mistake": "I interrupted my colleague during the meeting",
  "solution": "I will listen more carefully and wait for natural pauses before speaking",
  "category": "communication",
  "date": "2024-01-15"
}
```

## Data Models

### Journal Entry
```javascript
{
  userId: String,
  content: String,
  date: String,
  mood: String, // 'very_happy', 'happy', 'neutral', 'sad', 'very_sad'
  tags: [String],
  type: String // 'journal'
}
```

### Overthinking Entry
```javascript
{
  userId: String,
  thought: String,
  solution: String,
  date: String,
  category: String, // 'work', 'relationships', 'health', etc.
  intensity: Number, // 1-10
  dumped: Boolean,
  tags: [String],
  type: String // 'overthinking'
}
```

### Mistake Entry
```javascript
{
  userId: String,
  mistake: String,
  solution: String,
  category: String, // 'work_career', 'relationships', 'health', etc.
  date: String,
  avoided: Boolean,
  streakInfo: {
    currentStreak: Number,
    bestStreak: Number,
    lastAvoidedDate: String
  },
  tags: [String],
  type: String // 'mistake'
}
```

## Future Enhancements

- AI-powered insights and suggestions
- Cross-referencing between journal, overthinking, and mistake entries
- Advanced analytics and reporting
- User authentication integration
- Data export functionality
- Webhook support for real-time updates

## Security

- CORS enabled for cross-origin requests
- Helmet.js for security headers
- Input validation and sanitization
- Error handling middleware
- Environment-based configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.