import { authorizedFetch } from "./utils";

// Get user profile information
export const getProfile = async ({ uid }) => {
  console.log("getProfile called with:", { uid });
  
  try {
    const result = await authorizedFetch(`/api/auth/profile/${uid}`, {
      method: "GET",
    });
    
    console.log("getProfile result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("getProfile error:", error);
    throw error;
  }
};

// Sign up a new user
export const signup = async ({ uid, email, name, trialStart }) => {
  console.log("signup called with:", { uid, email, name, trialStart });
  
  const body = JSON.stringify({ uid, email, name, trialStart });
  console.log("Request body:", body);
  
  try {
    const result = await authorizedFetch("/api/auth/signup", {
      method: "POST",
      body,
    });
    
    console.log("signup result:", result);
    
    if (result.status !== 201 && result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("signup error:", error);
    throw error;
  }
};

// Delete user account
export const deleteUserAccount = async () => {
  console.log("deleteUserAccount called");
  
  try {
    const result = await authorizedFetch("/api/auth/delete-account", {
      method: "DELETE",
    });
    
    console.log("deleteUserAccount result:", result);
    
    if (result.status !== 200) {
      throw new Error(`Unexpected response status: ${result.status}`);
    }
    
    return result.data;
  } catch (error) {
    console.log("deleteUserAccount error:", error);
    throw error;
  }
};
