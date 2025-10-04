import { authorizedFetch } from "./utils";

// List journal entries with optional date filter
export const listJournalEntries = async ({ date, page = 1, limit = 50 } = {}) => {
  console.log("listJournalEntries called with:", { date, page, limit });
  
  // Build query parameters explicitly
  const params = new URLSearchParams();
  if (date) {
    params.set("date", date);
  }
  if (page) {
    params.set("page", String(page));
  }
  if (limit) {
    params.set("limit", String(limit));
  }
  const queryString = params.toString() ? `?${params.toString()}` : "";
  
  console.log("Making request to:", `/api/journal${queryString}`);

  try {
    const result = await authorizedFetch(`/api/journal${queryString}`, {
      method: "GET",
    });
    
    console.log("listJournalEntries result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("listJournalEntries error:", error);
    throw error;
  }
};

// Create a new journal entry
export const createJournalEntry = async ({ content, date, tags, mood, title }) => {
  console.log("createJournalEntry called with:", { content, date, tags, mood, title });
  const body = JSON.stringify({ content, date, tags, mood, title });
  console.log("Request body:", body);

  try {
    const result = await authorizedFetch("/api/journal", {
      method: "POST",
      body,
    });
    
    console.log("createJournalEntry result:", result);
    
    if (result.status !== 201) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }

    return result.data;
  } catch (error) {
    console.log("createJournalEntry error:", error);
    throw error;
  }
};

// Get a single journal entry by ID
export const getJournalEntry = async ({ id, signal }) => {
  console.log("getJournalEntry called with:", { id });
  
  console.log("Making request to:", `/api/journal/${id}`);
  
  try {
    const result = await authorizedFetch(`/api/journal/${id}`, {
      method: "GET",
      signal,
    });
    
    console.log("getJournalEntry result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("getJournalEntry error:", error);
    throw error;
  }
};

// Delete a journal entry
export const deleteJournalEntry = async ({ id }) => {
  console.log("deleteJournalEntry called with:", { id });
  
  console.log("Making request to:", `/api/journal/${id}`);
  
  try {
    const result = await authorizedFetch(`/api/journal/${id}`, {
      method: "DELETE",
    });
    
    console.log("deleteJournalEntry result:", result);
    
    if (result.status !== 200 && result.status !== 204) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("deleteJournalEntry error:", error);
    throw error;
  }
};