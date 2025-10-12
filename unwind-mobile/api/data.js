import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

export const purgeAllUserData = async () => {
  try {
    const token = await getFreshToken();
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const result = await axios.delete(`${API_BASE_URL}/api/data/all`, {
      headers,
      timeout: 10000,
    });
    
    if (result.status === 200 && result.data?.success) {
      return { success: true, deleted: result.data.deleted };
    }
    return { success: false, message: result.data?.message || `Unexpected status ${result.status}` };
  } catch (e) {
    return { success: false, message: e.message || "Network error" };
  }
};
