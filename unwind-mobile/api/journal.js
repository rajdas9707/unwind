import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

// List journal entries with optional date filter
export const listJournalEntries = async ({ date, page = 1, limit = 50 } = {}) => {
  const token = await getFreshToken();
  
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
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.get(`${API_BASE_URL}/api/journal${queryString}`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Create a new journal entry
// Required: content (string, 1-5000 chars)
// Optional: title (string, max 200 chars)
export const createJournalEntry = async ({ content, title }) => {
  // Client-side validation
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new Error("Journal content is required and cannot be empty");
  }
  
  if (content.trim().length > 5000) {
    throw new Error("Journal content must be less than 5000 characters");
  }
  
  if (title && typeof title !== "string") {
    throw new Error("Title must be a string");
  }
  
  if (title && title.length > 200) {
    throw new Error("Title must be less than 200 characters");
  }

  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.post(`${API_BASE_URL}/api/journal`, {
    content: content.trim(),
    title: title ? title.trim() : "",
  }, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 201) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  console.log("result from createnewjournal/api/journal", response);
  return response.data;
};

// Get a single journal entry by ID
export const getJournalEntry = async ({ id, signal }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.get(`${API_BASE_URL}/api/journal/${id}`, {
    headers,
    timeout: 10000,
    signal,
  });
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Delete a journal entry
export const deleteJournalEntry = async ({ id }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.delete(`${API_BASE_URL}/api/journal/${id}`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};
