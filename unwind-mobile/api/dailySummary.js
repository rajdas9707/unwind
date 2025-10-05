import { authorizedFetch } from "./utils";

/**
 * Generate daily summary using AI
 * @returns {Promise<Object>} - Generated summary data
 */
export const generateDailySummary = async () => {
  try {
    const result = await authorizedFetch("/api/llm/generate-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (result.status === 201 && result.data?.success) {
      return {
        success: true,
        data: result.data.data,
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