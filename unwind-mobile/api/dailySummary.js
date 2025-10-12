import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

/**
 * Generate daily summary using AI
 * @returns {Promise<Object>} - Generated summary data
 */
export const generateDailySummary = async () => {
  try {
    const token = await getFreshToken();
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const result = await axios.post(`${API_BASE_URL}/api/llm/generate-summary`, {}, {
      headers,
      timeout: 10000,
    });

    if (result.status === 201 && result.data?.success) {
      return {
        success: true,
        data: result.data.data, // { date, highlights, ..., score }
        message: result.data.message
      };
    } else if (result.status === 409) {
      // Summary already exists
      return {
        success: false,
        error: "SUMMARY_EXISTS", 
        message: result.data?.message || "Summary already generated for today"
      };
    } else if (result.status === 400) {
      // No data available
      return {
        success: false,
        error: "NO_DATA",
        message: result.data?.message || "No data available for summary generation"
      };
    } else if (result.status === 503) {
      // AI service unavailable
      return {
        success: false,
        error: "AI_UNAVAILABLE",
        message: result.data?.message || "AI service is temporarily unavailable"
      };
    } else {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
  } catch (error) {
    console.error("Error generating daily summary:", error);
    
    if (error.message.includes("Network request failed") || error.code === "NETWORK_ERROR") {
      return {
        success: false,
        error: "NETWORK_ERROR",
        message: "Network error. Please check your internet connection and try again."
      };
    }
    
    if (error.response?.status === 401) {
      return {
        success: false,
        error: "AUTH_ERROR",
        message: "Authentication failed. Please sign in again."
      };
    }
    
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: error.message || "Failed to generate daily summary. Please try again."
    };
  }
};

/**
 * Fetch an existing daily summary by date (YYYY-MM-DD)
 */
export const fetchDailySummaryByDate = async (date) => {
  try {
    const token = await getFreshToken();
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const qs = new URLSearchParams({ date }).toString();
    const result = await axios.get(`${API_BASE_URL}/api/llm/summary?${qs}`, {
      headers,
      timeout: 10000,
    });

    if (result.status === 200 && result.data?.success) {
      return { success: true, data: result.data.data };
    }
    if (result.status === 404) {
      return { success: false, error: "NOT_FOUND", message: "Summary not found" };
    }
    throw new Error(`Unexpected response status: ${result.status}`);
  } catch (error) {
    console.error("Error fetching summary by date:", error);
    return { success: false, error: "UNKNOWN_ERROR", message: error.message };
  }
};

