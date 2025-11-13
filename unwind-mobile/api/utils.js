import axios from "axios";
import { auth } from "../firebaseConfig";

// const API_BASE_URL = "http://192.168.29.225:5000";
const API_BASE_URL = "https://clear-slip-proxy-jon.trycloudflare.com";

// Helper function to get fresh Firebase ID token
export const getFreshToken = async () => {
  if (auth?.currentUser) {
    // Force refresh token to ensure it's valid
    return await auth.currentUser.getIdToken(true);
  }
  return null;
};

// Get help center URL
export const getHelpCenterUrl = () => {
  // Serve the static Help Center from the same API base host under /help-center
  // This respects EXPO_PUBLIC_API_URL when set; otherwise falls back to API_BASE_URL default.
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  // If base is empty (shouldn't happen), default to local dev server
  return base ? `${base}/help-center/` : "http://localhost:5000/help-center/";
};

// Membership API functions
export const fetchPlans = async () => {
  // Public endpoint - no auth required
  const response = await axios.get(`${API_BASE_URL}/api/membership/plans`);
  return response.data;
};

export const verifyPurchase = async (purchaseData) => {
  const token = await getFreshToken();
  const response = await axios.post(
    `${API_BASE_URL}/api/membership/verify-purchase`,
    purchaseData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

export { API_BASE_URL };
