import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";
import { Alert } from "react-native";

// Get user profile information
export const getProfile = async ({ uid }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.get(`${API_BASE_URL}/api/auth/profile/${uid}`, {
    headers,
    timeout: 10000,
  });
  
  
  
  return response.data;
};

// Sign up a new user
export const signup = async ({ uid, email, name, trialStart }) => {
 
  console.log("Signing up user with UID:", uid, "Email:", email, "Name:", name, "Trial Start:", trialStart);
  
  const headers = {
    "Content-Type": "application/json",
  };
  

  try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
    uid,
    email,
    name,
    trialStart,
  }, {
    headers,
    timeout: 10000,
  });
  

  return response.status 
  }
  
   catch (error) {
    // Get status safely
    const status = error.response?.status;

    if (status === 401 ) {
      Alert.alert(
        "⚠️ Account Already Exists",
        "🙂 This email is already registered.\n\nPlease log in or use another email to create a new account.",
        [{ text: "Got it ✅", style: "default" }]
      );
      return;
    }

    if (status >= 500) {
      Alert.alert(
        "💥 Server Issue",
        "🚧 Our servers are taking a quick break.\n\nPlease try again in a few moments.",
        [{ text: "OK 👍", style: "default" }]
      );
      return;
    }

    Alert.alert(
      "🌐 Network Error",
      "📶 We couldn’t connect to the server.\n\nPlease check your internet connection and try again.",
      [{ text: "Retry 🔁", style: "default" }]
    );

    console.error("Signup error:", error);
  }

};

// Delete user account
export const deleteUserAccount = async () => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.delete(`${API_BASE_URL}/api/auth/delete-account`, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};




// Update user name
export const updateUserName = async ({ uid, name }) => {
  const token = await getFreshToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.put(
    `${API_BASE_URL}/api/auth/update-name`,
    { uid, name },
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

// ...existing code...
