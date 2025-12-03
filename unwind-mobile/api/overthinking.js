import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

// List overthinking entries with optional filters
export const listOverthinkingEntries = async ({
  date,
  page = 1,
  limit = 50,
} = {}) => {
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

  const response = await axios.get(
    `${API_BASE_URL}/api/overthinking${queryString}`,
    {
      headers,
      timeout: 10000,
    }
  );

  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Create a new overthinking entry
export const createOverthinkingEntry = async ({
  title,
  thought,
  solution,
  date,
  dumped = false,
}) => {
  const token = await getFreshToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.post(
    `${API_BASE_URL}/api/overthinking`,
    {
      title,
      thought,
      solution,
      date,
      dumped,
    },
    {
      headers,
      timeout: 10000,
    }
  );

  if (response.status !== 201) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Update an overthinking entry
export const updateOverthinkingEntry = async ({
  id,
  thought,
  solution,
  dumped,
}) => {
  const token = await getFreshToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.put(
    `${API_BASE_URL}/api/overthinking/${id}`,
    {
      thought,
      solution,
      dumped,
    },
    {
      headers,
      timeout: 10000,
    }
  );

  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Toggle dumped status for an overthinking entry
export const dumpOverthinkingEntry = async ({ id }) => {
  const token = await getFreshToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.patch(
    `${API_BASE_URL}/api/overthinking/${id}/dump`,
    {},
    {
      headers,
      timeout: 10000,
    }
  );

  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Delete an overthinking entry
export const deleteOverthinkingEntry = async ({ id }) => {
  const token = await getFreshToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.delete(
    `${API_BASE_URL}/api/overthinking/${id}`,
    {
      headers,
      timeout: 10000,
    }
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  return response.data;
};

// Note: AI processing (solution generation, category detection, intensity assessment)
// now happens automatically on the server when creating or updating entries
