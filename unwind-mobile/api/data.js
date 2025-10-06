import { authorizedFetch } from "./utils";

export const purgeAllUserData = async () => {
  try {
    const result = await authorizedFetch("/api/data/all", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (result.status === 200 && result.data?.success) {
      return { success: true, deleted: result.data.deleted };
    }
    return { success: false, message: result.data?.message || `Unexpected status ${result.status}` };
  } catch (e) {
    return { success: false, message: e.message || "Network error" };
  }
};
