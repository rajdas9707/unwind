import { authorizedFetch } from "./utils";

// List mistakes entries with optional filters
export const listMistakesEntries = async ({ date, page = 1, limit = 50 } = {}) => {
  console.log("listMistakesEntries called with:", { date, page, limit });
  
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
  
  console.log("Making request to:", `/api/mistakes${queryString}`);
  
  try {
    const result = await authorizedFetch(`/api/mistakes${queryString}`, {
      method: "GET",
    });
    
    console.log("listMistakesEntries result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("listMistakesEntries error:", error);
    throw error;
  }
};

// Create a new mistake entry
export const createMistakeEntry = async ({ mistake, solution, category, date }) => {
  console.log("createMistakeEntry called with:", {
    mistake,
    solution,
    category,
    date,
  });
  
  const body = JSON.stringify({ mistake, solution, category, date });
  console.log("Request body:", body);
  console.log("Making request to:", "/api/mistakes");
  
  try {
    const result = await authorizedFetch("/api/mistakes", {
      method: "POST",
      body,
    });
    
    console.log("createMistakeEntry result:", result);

    if (result.status !== 201) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }

    return result.data;
  } catch (error) {
    console.log("createMistakeEntry error:", error);
    throw error;
  }
};

// Delete a mistake entry
export const deleteMistakeEntry = async ({ id }) => {
  console.log("deleteMistakeEntry called with:", { id });
  
  console.log("Making request to:", `/api/mistakes/${id}`);
  
  try {
    const result = await authorizedFetch(`/api/mistakes/${id}`, {
      method: "DELETE",
    });
    
    console.log("deleteMistakeEntry result:", result);
    
    if (result.status !== 200 && result.status !== 204) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("deleteMistakeEntry error:", error);
    throw error;
  }
};