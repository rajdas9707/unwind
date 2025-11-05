import axios from "axios";
import { getFreshToken, API_BASE_URL } from "./utils";

/**
 * Upload backup to cloud storage
 * @param {Object} backupData - Complete backup object with metadata and data
 * @returns {Object} Upload result with backup ID and URL
 */
export const uploadBackupToCloud = async (backupData) => {
  try {
    const token = await getFreshToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/backup/upload`,
      {
        backupData,
        metadata: {
          ...backupData.metadata,
          uploadedAt: new Date().toISOString(),
        },
      },
      {
        headers,
        timeout: 60000, // 60 seconds for large backups
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading backup to cloud:", error);

    const status = error.response?.status;

    if (status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (status === 403) {
      throw new Error(
        "Cloud backup is not available. Please upgrade to premium."
      );
    }

    if (status === 413) {
      throw new Error("Backup file is too large. Please contact support.");
    }

    if (status >= 500) {
      throw new Error("Server error. Please try again later.");
    }

    throw new Error("Failed to upload backup. Please check your connection.");
  }
};

/**
 * Download backup from cloud storage
 * @param {string} backupId - Optional backup ID to download specific backup
 * @returns {Object} Backup data object
 */
export const downloadBackupFromCloud = async (backupId = null) => {
  try {
    const token = await getFreshToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // If no backupId provided, get the latest backup
    const url = backupId
      ? `${API_BASE_URL}/api/backup/download/${backupId}`
      : `${API_BASE_URL}/api/backup/download/latest`;

    const response = await axios.get(url, {
      headers,
      timeout: 60000, // 60 seconds for large backups
    });

    return response.data;
  } catch (error) {
    console.error("Error downloading backup from cloud:", error);

    const status = error.response?.status;

    if (status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (status === 403) {
      throw new Error(
        "Cloud backup is not available. Please upgrade to premium."
      );
    }

    if (status === 404) {
      throw new Error("No backup found. Please create a backup first.");
    }

    if (status >= 500) {
      throw new Error("Server error. Please try again later.");
    }

    throw new Error("Failed to download backup. Please check your connection.");
  }
};

/**
 * Get list of all cloud backups for current user
 * @returns {Array} Array of backup metadata objects
 */
export const getCloudBackupsList = async () => {
  try {
    const token = await getFreshToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(`${API_BASE_URL}/api/backup/list`, {
      headers,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching cloud backups list:", error);

    const status = error.response?.status;

    if (status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (status === 403) {
      throw new Error(
        "Cloud backup is not available. Please upgrade to premium."
      );
    }

    if (status >= 500) {
      throw new Error("Server error. Please try again later.");
    }

    return [];
  }
};

/**
 * Delete a specific cloud backup
 * @param {string} backupId - Backup ID to delete
 * @returns {Object} Deletion result
 */
export const deleteCloudBackup = async (backupId) => {
  try {
    const token = await getFreshToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.delete(
      `${API_BASE_URL}/api/backup/delete/${backupId}`,
      {
        headers,
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting cloud backup:", error);

    const status = error.response?.status;

    if (status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (status === 403) {
      throw new Error(
        "You don't have permission to delete this backup."
      );
    }

    if (status === 404) {
      throw new Error("Backup not found.");
    }

    if (status >= 500) {
      throw new Error("Server error. Please try again later.");
    }

    throw new Error("Failed to delete backup. Please try again.");
  }
};

/**
 * Get cloud backup storage info (used space, quota, etc.)
 * @returns {Object} Storage information
 */
export const getCloudStorageInfo = async () => {
  try {
    const token = await getFreshToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(`${API_BASE_URL}/api/backup/storage-info`, {
      headers,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching cloud storage info:", error);

    return {
      usedSpace: 0,
      totalSpace: 0,
      backupCount: 0,
    };
  }
};
