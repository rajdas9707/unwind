# Journal + LLM Client Integration Guide

## Overview

The journal endpoints now automatically process entries with AI to provide supportive feedback. This guide shows how to handle responses and errors on the client side.

## API Changes

### Journal Entry Response Format

When you save a journal entry, the response now includes:

```javascript
{
  "_id": "entry_id",
  "userId": "user_firebase_uid",
  "content": "Today I felt anxious...",
  "date": "2025-01-03",
  "tags": ["anxiety", "work"],
  "mood": "sad",
  "aiResponse": "I hear that you're feeling anxious, and that's completely valid...",
  "aiMetadata": {
    "provider": "perplexity",
    "model": "llama-3.1-sonar-small-128k-online",
    "tokens_used": 150,
    "response_time": 2500,
    "timestamp": "2025-01-03T14:30:00.000Z"
  },
  "createdAt": "2025-01-03T14:30:00.000Z",
  "updatedAt": "2025-01-03T14:30:00.000Z"
}
```

If AI processing fails, you might get:

```javascript
{
  // ... other fields
  "aiResponse": null,
  "aiMetadata": {
    "error": "PERPLEXITY_API_KEY not configured",
    "timestamp": "2025-01-03T14:30:00.000Z"
  }
}
```

## Client-Side Implementation Examples

### React Native with Error Handling

```javascript
// Save journal entry function
const saveJournalEntry = async (content, date, tags, mood) => {
  try {
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        date,
        tags,
        mood
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save journal entry');
    }

    // Check if AI processing was successful
    if (data.aiResponse) {
      // Success - show AI feedback
      showSuccessAlert('Journal saved with AI feedback!', data.aiResponse);
    } else if (data.aiMetadata?.error) {
      // Journal saved but AI failed
      showWarningAlert(
        'Journal saved', 
        'Your entry was saved, but AI feedback is temporarily unavailable.'
      );
    } else {
      // Saved without AI processing
      showSuccessAlert('Journal saved successfully!');
    }

    return data;
  } catch (error) {
    console.error('Save journal error:', error);
    showErrorAlert('Failed to save journal', error.message);
    throw error;
  }
};

// Manual sync function
const syncJournalEntry = async (entryId) => {
  try {
    const response = await fetch(`/api/journal/sync/${entryId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        showErrorAlert('Entry not found', 'This journal entry could not be found.');
      } else {
        showErrorAlert('Sync failed', data.error || 'Failed to sync with AI');
      }
      throw new Error(data.error);
    }

    if (data.entry.aiResponse) {
      showSuccessAlert('AI feedback generated!', data.entry.aiResponse);
    } else {
      showWarningAlert('Sync completed', data.message);
    }

    return data.entry;
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};
```

### Alert Functions (React Native)

```javascript
import { Alert } from 'react-native';

const showSuccessAlert = (title, message = '') => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'default' }]
  );
};

const showWarningAlert = (title, message) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'default' }]
  );
};

const showErrorAlert = (title, message) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'destructive' }]
  );
};

// For retry scenarios
const showRetryAlert = (title, message, onRetry) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: onRetry }
    ]
  );
};
```

### Usage in Components

```javascript
const JournalEntryScreen = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      showErrorAlert('Missing content', 'Please write something before saving.');
      return;
    }

    setIsLoading(true);
    try {
      const entry = await saveJournalEntry(
        content,
        new Date().toISOString().split('T')[0], // YYYY-MM-DD
        [],
        'neutral'
      );
      
      // Navigate to entry view or clear form
      navigation.goBack();
    } catch (error) {
      // Error already handled in saveJournalEntry
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async (entryId) => {
    setIsLoading(true);
    try {
      await syncJournalEntry(entryId);
    } catch (error) {
      // Error already handled in syncJournalEntry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="How are you feeling today?"
        multiline
      />
      <Button
        title={isLoading ? 'Saving...' : 'Save Entry'}
        onPress={handleSave}
        disabled={isLoading}
      />
    </View>
  );
};
```

## Error Scenarios and Handling

### 1. AI Service Unavailable
- **What happens**: Journal saves, but `aiResponse` is null and `aiMetadata.error` contains error message
- **Client handling**: Show warning that entry was saved but AI feedback is unavailable
- **User action**: Can manually sync later

### 2. Network Error During Save
- **What happens**: Entire request fails
- **Client handling**: Show error alert, offer retry option
- **User action**: Retry saving

### 3. Authentication Error
- **What happens**: 401 Unauthorized response
- **Client handling**: Redirect to login or refresh token
- **User action**: Re-authenticate

### 4. Manual Sync on Already Processed Entry
- **What happens**: Returns 200 with message "Entry already has AI feedback"
- **Client handling**: Show info message
- **User action**: No action needed

## Best Practices

1. **Always check for `aiResponse`** - Don't assume it exists
2. **Handle partial failures gracefully** - Journal might save even if AI fails
3. **Provide manual sync option** - Let users retry AI processing
4. **Show appropriate loading states** - AI processing takes time
5. **Cache responses locally** - Avoid unnecessary re-processing
6. **Respect user privacy** - Make AI processing opt-in if required

## API Endpoints Summary

- `POST /api/journal` - Create entry (auto-processes with AI)
- `POST /api/journal/sync/:id` - Manual AI processing for existing entry
- `GET /api/journal/:id` - Get entry (includes AI response if available)
- `GET /api/journal` - Get all entries (includes AI responses)

All endpoints require Firebase authentication via Bearer token.