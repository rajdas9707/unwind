import { authorizedFetch } from "./utils";

// List overthinking entries with optional filters
export const listOverthinkingEntries = async ({ date, page = 1, limit = 50 } = {}) => {
  console.log("listOverthinkingEntries called with:", { date, page, limit });
  
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
  
  console.log("Making request to:", `/api/overthinking${queryString}`);
  
  try {
    const result = await authorizedFetch(`/api/overthinking${queryString}`, {
      method: "GET",
    });
    
    console.log("listOverthinkingEntries result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("listOverthinkingEntries error:", error);
    throw error;
  }
};

// Create a new overthinking entry
export const createOverthinkingEntry = async ({ thought, solution, date }) => {
  console.log("createOverthinkingEntry called with:", {
    thought,
    solution,
    date,
  });
  
  const body = JSON.stringify({ thought, solution, date });
  console.log("Request body:", body);
  console.log("Making request to:", "/api/overthinking");
  
  try {
    const result = await authorizedFetch("/api/overthinking", {
      method: "POST",
      body,
    });

    console.log("createOverthinkingEntry result:", result);
    
    if (result.status !== 201) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }

    return result.data;
  } catch (error) {
    console.log("createOverthinkingEntry error:", error);
    throw error;
  }
};

// Delete an overthinking entry
export const deleteOverthinkingEntry = async ({ id }) => {
  console.log("deleteOverthinkingEntry called with:", { id });
  
  console.log("Making request to:", `/api/overthinking/${id}`);
  
  try {
    const result = await authorizedFetch(`/api/overthinking/${id}`, {
      method: "DELETE",
    });
    
    console.log("deleteOverthinkingEntry result:", result);
    
    if (result.status !== 200 && result.status !== 204) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("deleteOverthinkingEntry error:", error);
    throw error;
  }
};