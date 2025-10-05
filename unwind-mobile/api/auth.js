import { authorizedFetch } from "./utils";

// Get user profile information
export const getProfile = async ({ uid }) => {
  const result = await authorizedFetch(`/api/auth/profile/${uid}`, {
    method: "GET",
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Sign up a new user
export const signup = async ({ uid, email, name, trialStart }) => {
  const body = JSON.stringify({ uid, email, name, trialStart });
  
  const result = await authorizedFetch("/api/auth/signup", {
    method: "POST",
    body,
  });
  
  if (result.status !== 201 && result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};

// Delete user account
export const deleteUserAccount = async () => {
  const result = await authorizedFetch("/api/auth/delete-account", {
    method: "DELETE",
  });
  
  if (result.status !== 200) {
    throw new Error(`Unexpected response status: ${result.status}`);
  }
  
  return result.data;
};
