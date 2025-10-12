import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

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
  
  if (response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
};

// Sign up a new user
export const signup = async ({ uid, email, name, trialStart }) => {
  const token = await getFreshToken();
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
    uid,
    email,
    name,
    trialStart,
  }, {
    headers,
    timeout: 10000,
  });
  
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
  
  return response.data;
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
