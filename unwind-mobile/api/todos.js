import { authorizedFetch } from "./utils";

// List todos with optional filters
export const listTodos = async ({ category, page = 1, limit = 50 } = {}) => {
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
  
  const result = await authorizedFetch(`/api/todos${queryString}`, {
    method: "GET",
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Create a new todo
export const createTodo = async ({
  title,
  description,
  category,
  priority,
  dueDate,
}) => {
  const body = JSON.stringify({
    title,
    description,
    category,
    priority,
    dueDate,
  });
  
  const result = await authorizedFetch("/api/todos", {
    method: "POST",
    body,
  });
  
  if (result.status !== 201) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
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
  const body = JSON.stringify({
    title,
    description,
    category,
    priority,
    dueDate,
    completed,
  });
  
  const result = await authorizedFetch(`/api/todos/${id}`, {
    method: "PUT",
    body,
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Delete a todo
export const deleteTodo = async ({ id }) => {
  const result = await authorizedFetch(`/api/todos/${id}`, {
    method: "DELETE",
  });
  
  if (result.status !== 200 && result.status !== 204) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};
