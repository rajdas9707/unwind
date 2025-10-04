import { authorizedFetch } from "./utils";

// List todos with optional filters
export const listTodos = async ({ category, page = 1, limit = 50 } = {}) => {
  console.log("listTodos called with:", { category, page, limit });
  
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
  
  console.log("Making request to:", `/api/todos${queryString}`);
  
  try {
    const result = await authorizedFetch(`/api/todos${queryString}`, {
      method: "GET",
    });
    
    console.log("listTodos result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("listTodos error:", error);
    throw error;
  }
};

// Create a new todo
export const createTodo = async ({
  title,
  description,
  category,
  priority,
  dueDate,
}) => {
  console.log("createTodo called with:", {
    title,
    description,
    category,
    priority,
    dueDate,
  });
  
  const body = JSON.stringify({
    title,
    description,
    category,
    priority,
    dueDate,
  });
  console.log("Request body:", body);
  console.log("Making request to:", "/api/todos");
  
  try {
    const result = await authorizedFetch("/api/todos", {
      method: "POST",
      body,
    });
    
    console.log("createTodo result:", result);
    
    if (result.status !== 201) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("createTodo error:", error);
    throw error;
  }
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
  console.log("updateTodo called with:", {
    id,
    title,
    description,
    category,
    priority,
    dueDate,
    completed,
  });
  
  const body = JSON.stringify({
    title,
    description,
    category,
    priority,
    dueDate,
    completed,
  });
  console.log("Request body:", body);
  console.log("Making request to:", `/api/todos/${id}`);
  
  try {
    const result = await authorizedFetch(`/api/todos/${id}`, {
      method: "PUT",
      body,
    });
    
    console.log("updateTodo result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("updateTodo error:", error);
    throw error;
  }
};

// Delete a todo
export const deleteTodo = async ({ id }) => {
  console.log("deleteTodo called with:", { id });
  
  console.log("Making request to:", `/api/todos/${id}`);
  
  try {
    const result = await authorizedFetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    
    console.log("deleteTodo result:", result);
    
    if (result.status !== 200 && result.status !== 204) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("deleteTodo error:", error);
    throw error;
  }
};