import axios from "axios";
import { auth } from "../firebaseConfig";


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.29.225:5000";

// Create simple axios instance with auth token
export const createClient = async () => {
  try {
    const token = await auth.currentUser?.getIdToken();
    
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      timeout: 10000
    });
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};


export { API_BASE_URL };
