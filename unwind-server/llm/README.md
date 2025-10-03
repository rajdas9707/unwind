# LLM Integration for Unwind Server

This module provides AI/LLM functionality to the Unwind mental health application server, integrated in a modular fashion with Firebase authentication.

## Structure

```
llm/
├── controllers/
│   └── aiController.js     # HTTP request handlers for AI endpoints
├── services/
│   └── aiService.js        # Core AI service logic and API calls
├── routes/
│   └── llm.js             # Express routes definition
├── utils/                 # Utility functions (reserved for future use)
└── README.md              # This file
```

## Endpoints

All endpoints require Firebase authentication via Bearer token in Authorization header.

### POST `/api/llm/ask`
Main AI query endpoint.

**Request Body:**
```json
{
  "prompt": "How can I manage stress better?",
  "options": {
    "model": "llama-3.1-sonar-small-128k-online",
    "max_tokens": 1000,
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "response": "Here are some effective stress management techniques...",
  "provider": "perplexity",
  "model": "llama-3.1-sonar-small-128k-online",
  "metadata": {
    "tokens_used": 150,
    "response_time": 2500,
    "timestamp": "2025-01-03T13:47:54.000Z",
    "userId": "user-firebase-uid"
  }
}
```

### GET `/api/llm/health`
Health check for LLM service.

### GET `/api/llm/status`
Get AI service status and configuration.

### GET `/api/llm/suggestions`
Get suggested prompts for the user.

### POST `/api/llm/switch-provider`
Switch AI provider (admin functionality).

## Environment Variables

Add these to your `.env` file:

```bash
# LLM Configuration
PERPLEXITY_API_KEY=your-perplexity-api-key-here
PERPLEXITY_BASE_URL=https://api.perplexity.ai
AI_DEFAULT_PROVIDER=perplexity
AI_DEFAULT_MODEL=llama-3.1-sonar-small-128k-online
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
AI_REQUEST_TIMEOUT=30000
```

## Setup

1. Install dependencies (already done if following integration guide):
   ```bash
   npm install langchain @langchain/openai axios
   ```

2. Get a Perplexity API key from https://www.perplexity.ai/settings/api

3. Add environment variables to your `.env` file

4. The LLM routes are automatically integrated with the main server and use the existing Firebase authentication

## Usage Examples

### Client-side (React Native/JavaScript):
```javascript
// Make sure you have a valid Firebase auth token
const response = await fetch('/api/llm/ask', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "What are some mindfulness techniques for anxiety?"
  })
});

const data = await response.json();
console.log(data.response); // AI response text
```

### cURL example:
```bash
curl -X POST http://localhost:5000/api/llm/ask \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "How can I improve my sleep quality?"}'
```

## Integration Details

- **Authentication**: Uses the existing Firebase `verifyToken` middleware
- **Error Handling**: Follows the same pattern as other server routes
- **Logging**: Includes user context and request logging
- **Modular**: Completely separated from existing code, can be removed easily

## Future Enhancements

- Integration with user's journal entries for personalized responses
- Conversation history storage
- Multiple AI provider support (OpenAI, Anthropic, etc.)
- Rate limiting per user
- Response caching
- Analytics and usage tracking

## Troubleshooting

### "PERPLEXITY_API_KEY not configured"
Make sure you've added your API key to the `.env` file and restarted the server.

### "Failed to process AI request"
Check the server logs for detailed error messages. Common issues:
- Invalid API key
- Network connectivity issues
- Rate limiting from the AI provider

### Authentication errors
Ensure your Firebase token is valid and properly formatted in the Authorization header.