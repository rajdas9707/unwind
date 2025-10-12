import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

// List mistakes entries with optional filters
export const listMistakesEntries = async ({ date, page = 1, limit = 50 } = {}) => {
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
  
  const response = await axios.get(`${API_BASE_URL}/api/mistakes${queryString}`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Create a new mistake entry
export const createMistakeEntry = async ({ description, category, learning, date }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.post(`${API_BASE_URL}/api/mistakes`, {
    description,
    category,
    learning,
    date,
  }, {
    headers,
    timeout: 10000,
  });

  if (response.status !== 201) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Update a mistake entry
export const updateMistakeEntry = async ({ id, description, category, learning }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.put(`${API_BASE_URL}/api/mistakes/${id}`, {
    description,
    category,
    learning,
  }, {
    headers,
    timeout: 10000,
  });

  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Get mistake statistics
export const getMistakeStats = async () => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.get(`${API_BASE_URL}/api/mistakes/stats`, {
    headers,
    timeout: 10000,
  });

  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Delete a mistake entry
export const deleteMistakeEntry = async ({ id }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.delete(`${API_BASE_URL}/api/mistakes/${id}`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};
