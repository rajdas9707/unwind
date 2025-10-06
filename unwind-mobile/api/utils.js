import axios from "axios";
import { auth } from "../firebaseConfig";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://20.255.57.181:5000";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Helper function for authenticated requests
export const authorizedFetch = async (path, options = {}) => {
  // Auto-attach Firebase ID token if available
  let token;
  if (auth?.currentUser) {
    // Force refresh token to ensure it's valid
    token = await auth.currentUser.getIdToken(true);
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = (options.method || "GET").toLowerCase();
  let data;
  if (typeof options.body === "string") {
    try {
      data = JSON.parse(options.body);
    } catch {
      data = options.body;
    }
  } else if (options.body !== undefined) {
    data = options.body;
  }

  const response = await apiClient.request({
    url: path,
    method,
    headers,
    data,
    params: options.params,
    signal: options.signal,
  });
  
  return { data: response.data, status: response.status };
};

// Get help center URL
export const getHelpCenterUrl = () => {
  // Serve the static Help Center from the same API base host under /help-center
  // This respects EXPO_PUBLIC_API_URL when set; otherwise falls back to API_BASE_URL default.
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  // If base is empty (shouldn't happen), default to local dev server
  return base ? `${base}/help-center/` : "http://localhost:5000/help-center/";
};

export { API_BASE_URL };
