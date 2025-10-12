import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

// List todos with optional filters
export const listTodos = async ({ category, page = 1, limit = 50 } = {}) => {
  const token = await getFreshToken();
  
  // Build query parameters explicitly
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
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
  
  const response = await axios.get(`${API_BASE_URL}/api/todos${queryString}`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Create a new todo
export const createTodo = async ({
  title,
  description,
  category,
  priority,
  dueDate,
}) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.post(`${API_BASE_URL}/api/todos`, {
    title,
    description,
    category,
    priority,
    dueDate,
  }, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 201) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Update an existing todo
export const updateTodo = async ({
  id,
  title,
  description,
  category,
  priority,
  dueDate,
  completed,
}) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.put(`${API_BASE_URL}/api/todos/${id}`, {
    title,
    description,
    category,
    priority,
    dueDate,
    completed,
  }, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Delete a todo
export const deleteTodo = async ({ id }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.delete(`${API_BASE_URL}/api/todos/${id}`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};
