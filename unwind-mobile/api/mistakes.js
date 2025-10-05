import { authorizedFetch } from "./utils";

// List mistakes entries with optional filters
export const listMistakesEntries = async ({ date, page = 1, limit = 50 } = {}) => {
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
  
  const result = await authorizedFetch(`/api/mistakes${queryString}`, {
    method: "GET",
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Create a new mistake entry
export const createMistakeEntry = async ({ description, category, learning, date }) => {
  const body = JSON.stringify({ description, category, learning, date });
  
  const result = await authorizedFetch("/api/mistakes", {
    method: "POST",
    body,
  });

  if (result.status !== 201) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }

  return result.data;
};

// Update a mistake entry
export const updateMistakeEntry = async ({ id, description, category, learning }) => {
  const body = JSON.stringify({ description, category, learning });
  
  const result = await authorizedFetch(`/api/mistakes/${id}`, {
    method: "PUT",
    body,
  });

  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }

  return result.data;
};

// Get mistake statistics
export const getMistakeStats = async () => {
  const result = await authorizedFetch("/api/mistakes/stats", {
    method: "GET",
  });

  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }

  return result.data;
};

// Delete a mistake entry
export const deleteMistakeEntry = async ({ id }) => {
  const result = await authorizedFetch(`/api/mistakes/${id}`, {
    method: "DELETE",
  });
  
  if (result.status !== 200 && result.status !== 204) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};
