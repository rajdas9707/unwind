import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";
import { Alert } from "react-native";

export const fetchMembershipStatus = async () => {
  console.log("fetchmembership in api/membership")
  const token = await getFreshToken();
  if (!token) {
    Alert.alert("Authentication Error", "Please log in again.");
    return;
  }
  console.log('token',token)
  console.log("token from fetchmembership in api/membership:",`${API_BASE_URL}/api/membership/status`)
  const response = await axios.get('http://localhost:5000/api/membership/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("response from fetchmembership in api/membership")
  return response;
};

//*****FUTURE SCOPE */

/**
 * Get membership status for current user
 * @returns {Object} Membership status object with canUseCloudBackup and expiresAt
 */
// export const getMembershipStatus = async () => {
//   try {
//     const token = await getFreshToken();

//     const headers = {
//       "Content-Type": "application/json",
//     };

//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//     }

//     const response = await axios.get(`${API_BASE_URL}/api/membership/status`, {
//       headers,
//       timeout: 10000,
//     });

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching membership status:", error);

//     const status = error.response?.status;

//     if (status === 401) {
//       throw new Error("Authentication required. Please log in again.");
//     }

//     if (status >= 500) {
//       throw new Error("Server error. Please try again later.");
//     }

//     throw new Error(
//       "Failed to fetch membership status. Check your connection."
//     );
//   }
// };

/**
 * Update membership after successful payment
 * @param {Object} params - Payment details
 * @param {string} params.purchaseToken - Receipt/purchase token from IAP
 * @param {string} params.productId - Product ID purchased
 * @param {string} params.platform - 'android' or 'ios'
 * @returns {Object} Updated membership data
 */
// export const updateMembershipAfterPurchase = async ({
//   purchaseToken,
//   productId,
//   platform,
// }) => {
//   try {
//     const token = await getFreshToken();

//     const headers = {
//       "Content-Type": "application/json",
//     };

//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//     }

//     const response = await axios.post(
//       `${API_BASE_URL}/api/membership/update`,
//       {
//         purchaseToken,
//         productId,
//         platform,
//       },
//       {
//         headers,
//         timeout: 15000,
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error updating membership:", error);

//     const status = error.response?.status;

//     if (status === 401) {
//       throw new Error("Authentication required. Please log in again.");
//     }

//     if (status === 400) {
//       throw new Error("Invalid purchase information. Please contact support.");
//     }

//     if (status >= 500) {
//       throw new Error("Server error. Please try again later.");
//     }

//     throw new Error("Failed to activate membership. Please try again.");
//   }
// };

/**
 * Verify payment status with backend
 * @param {string} purchaseToken - Receipt/purchase token from IAP
 * @returns {Object} Payment verification result
 */
// export const verifyPayment = async (purchaseToken) => {
//   try {
//     const token = await getFreshToken();

//     const headers = {
//       "Content-Type": "application/json",
//     };

//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//     }

//     const response = await axios.post(
//       `${API_BASE_URL}/api/membership/verify-payment`,
//       {
//         purchaseToken,
//       },
//       {
//         headers,
//         timeout: 15000,
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error verifying payment:", error);

//     const status = error.response?.status;

//     if (status === 401) {
//       throw new Error("Authentication required. Please log in again.");
//     }

//     if (status === 404) {
//       throw new Error("Payment not found. Please contact support.");
//     }

//     if (status >= 500) {
//       throw new Error("Server error. Please try again later.");
//     }

//     throw new Error("Failed to verify payment. Please try again.");
//   }
// };

/**
 * Check if user can use cloud backup feature
 * @returns {boolean} True if user has active premium membership
 */
// export const canUseCloudBackup = async () => {
//   try {
//     const membershipStatus = await getMembershipStatus();

//     // Check if membership is active and not expired
//     const isActive = membershipStatus.canUseCloudBackup === true;
//     const expiresAt = membershipStatus.expiresAt
//       ? new Date(membershipStatus.expiresAt)
//       : null;
//     const now = new Date();

//     // If no expiry date, check only canUseCloudBackup
//     if (!expiresAt) {
//       return isActive;
//     }

//     // If there's an expiry date, check if it's still valid
//     return isActive && expiresAt > now;
//   } catch (error) {
//     console.error("Error checking cloud backup eligibility:", error);
//     return false;
//   }
// };

/**
 * Get premium subscription products/plans
 * @returns {Array} Array of available premium plans
 */
// export const getPremiumPlans = async () => {
//   try {
//     const token = await getFreshToken();

//     const headers = {
//       "Content-Type": "application/json",
//     };

//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//     }

//     const response = await axios.get(`${API_BASE_URL}/api/membership/plans`, {
//       headers,
//       timeout: 10000,
//     });

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching premium plans:", error);

//     // Return default plans if API fails
//     return [
//       {
//         id: "premium_monthly",
//         name: "Premium Monthly",
//         price: "$4.99",
//         duration: "month",
//         features: ["Cloud Backup", "Priority Support", "Advanced Analytics"],
//       },
//       {
//         id: "premium_yearly",
//         name: "Premium Yearly",
//         price: "$49.99",
//         duration: "year",
//         features: ["Cloud Backup", "Priority Support", "Advanced Analytics"],
//         savings: "Save 17%",
//       },
//     ];
//   }
// };
