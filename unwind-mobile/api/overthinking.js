import { authorizedFetch } from "./utils";

// List overthinking entries with optional filters
export const listOverthinkingEntries = async ({ date, page = 1, limit = 50 } = {}) => {
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
  
  const result = await authorizedFetch(`/api/overthinking${queryString}`, {
    method: "GET",
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Create a new overthinking entry
export const createOverthinkingEntry = async ({ thought, solution, date }) => {
  const body = JSON.stringify({ thought, solution, date });
  
  const result = await authorizedFetch("/api/overthinking", {
    method: "POST",
    body,
  });

  if (result.status !== 201) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }

  return result.data;
};

// Delete an overthinking entry
export const deleteOverthinkingEntry = async ({ id }) => {
  const result = await authorizedFetch(`/api/overthinking/${id}`, {
    method: "DELETE",
  });
  
  if (result.status !== 200 && result.status !== 204) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};
