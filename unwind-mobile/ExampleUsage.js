// Example of how to use the simplified client in components
import React, { useState, useEffect } from 'react';
import { View, Button, Text, TextInput } from 'react-native';
import { createClient, showError, showSuccess, handleApiError } from './api/client';

const ExampleJournalComponent = () => {
  const [journalContent, setJournalContent] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Example: Create a journal entry
  const createJournalEntry = async () => {
    if (!journalContent.trim()) {
      showError('Validation Error', 'Please enter some content');
      return;
    }

    setLoading(true);
    try {
      const client = await createClient();
      const response = await client.post('/api/journal', {
        content: journalContent,
        date: new Date().toISOString().split('T')[0],
        tags: [],
        mood: 'neutral'
      });

      console.log('Journal entry created:', response.data);
      showSuccess('Success', 'Journal entry created successfully!');
      setJournalContent('');
      fetchJournalEntries(); // Refresh the list
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Example: Fetch journal entries
  const fetchJournalEntries = async () => {
    try {
      const client = await createClient();
      const response = await client.get('/api/journal');
      
      console.log('Journal entries:', response.data);
      setJournalEntries(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      handleApiError(error);
    }
  };

  // Example: Delete a journal entry
  const deleteJournalEntry = async (entryId) => {
    try {
      const client = await createClient();
      await client.delete(`/api/journal/${entryId}`);
      
      showSuccess('Deleted', 'Journal entry deleted successfully');
      fetchJournalEntries(); // Refresh the list
    } catch (error) {
      handleApiError(error);
    }
  };

  // Example: Handle different types of API calls
  const handleDifferentApiCalls = async () => {
    try {
      const client = await createClient();

      // GET request with query parameters
      const getResponse = await client.get('/api/journal', {
        params: { date: '2024-01-01', limit: 10 }
      });

      // POST request
      const postResponse = await client.post('/api/overthinking', {
        thought: 'Sample thought',
        solution: 'Sample solution',
        date: new Date().toISOString().split('T')[0]
      });

      // PUT request
      const putResponse = await client.put(`/api/todos/${todoId}`, {
        title: 'Updated title',
        completed: true
      });

      // DELETE request
      const deleteResponse = await client.delete(`/api/mistakes/${mistakeId}`);

      console.log('All API calls successful');
      showSuccess('Success', 'All operations completed');

    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Simple API Client Example</Text>
      
      <TextInput
        value={journalContent}
        onChangeText={setJournalContent}
        placeholder="Enter journal content..."
        multiline
        style={{ 
          borderWidth: 1, 
          borderColor: '#ccc', 
          padding: 10, 
          marginVertical: 10,
          minHeight: 100 
        }}
      />
      
      <Button
        title={loading ? 'Creating...' : 'Create Journal Entry'}
        onPress={createJournalEntry}
        disabled={loading}
      />

      <Button
        title="Refresh Entries"
        onPress={fetchJournalEntries}
      />

      <Text>Entries: {journalEntries.length}</Text>
      
      {journalEntries.map((entry, index) => (
        <View key={entry._id || index} style={{ marginVertical: 5 }}>
          <Text>{entry.content}</Text>
          <Button
            title="Delete"
            onPress={() => deleteJournalEntry(entry._id)}
            color="red"
          />
        </View>
      ))}
    </View>
  );
};

export default ExampleJournalComponent;

/*
HOW TO USE THE SIMPLIFIED CLIENT:

1. Import what you need:
   import { createClient, showError, showSuccess, handleApiError } from './api/client';

2. Create API calls in your component:
   - Always wrap in try/catch
   - Use createClient() to get axios instance
   - Use handleApiError(error) in catch blocks
   - Use showSuccess() for success feedback

3. Basic pattern:
   const apiCall = async () => {
     try {
       const client = await createClient();
       const response = await client.post('/api/endpoint', data);
       console.log(response.data);
       showSuccess('Success', 'Operation completed');
     } catch (error) {
       handleApiError(error);
     }
   };

4. Error handling is automatic:
   - 401: Shows "Please log in again"
   - 404: Shows "Resource not found"
   - 400: Shows server validation message
   - 500+: Shows "Server error, try again later"
   - Network error: Shows connection error message

5. No more complex interceptors, ApiResult wrappers, or sync checking!
*/