import { authorizedFetch } from "./utils";

// List journal entries with optional date filter
export const listJournalEntries = async ({ date, page = 1, limit = 50 } = {}) => {
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
  
  const result = await authorizedFetch(`/api/journal${queryString}`, {
    method: "GET",
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
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

  const body = JSON.stringify({ 
    content: content.trim(),
    title: title ? title.trim() : ""
  });

  const result = await authorizedFetch("/api/journal", {
    method: "POST",
    body,
  });
  
  if (result.status !== 201) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }

  return result.data;
};

// Get a single journal entry by ID
export const getJournalEntry = async ({ id, signal }) => {
  const result = await authorizedFetch(`/api/journal/${id}`, {
    method: "GET",
    signal,
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Delete a journal entry
export const deleteJournalEntry = async ({ id }) => {
  const result = await authorizedFetch(`/api/journal/${id}`, {
    method: "DELETE",
  });
  
  if (result.status !== 200 && result.status !== 204) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};
