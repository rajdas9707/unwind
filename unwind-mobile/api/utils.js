import axios from "axios";
import { auth } from "../firebaseConfig";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.29.225:5000";

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
  return "https://your-help-center-url.com"; // Replace with your actual help center URL
};

export { API_BASE_URL };
