import axios from "axios";
import { auth } from "../firebaseConfig";
import { Alert } from "react-native";

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
  try {
    if (auth?.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
  } catch {
    Alert.alert(
      "Authentication Error",
      "Failed to retrieve authentication token. Please log in again."
    );
    throw new Error("Failed to retrieve authentication token");
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

  try {
    const response = await apiClient.request({
      url: path,
      method,
      headers,
      data,
      params: options.params,
      signal: options.signal,
    });
    return { data: response.data, status: response.status };
  } catch (error) {
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const message =
      (payload && (payload.error || payload.message)) ||
      error?.message ||
      (status ? `Request failed with ${status}` : "Network request failed");
    throw new Error(message);
  }
};

// Get help center URL
export const getHelpCenterUrl = () => {
  return "https://your-help-center-url.com"; // Replace with your actual help center URL
};

export { API_BASE_URL };
