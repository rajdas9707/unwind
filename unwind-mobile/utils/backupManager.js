import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { openDB } from "../storage/mainDb";

/**
 * Backup Manager
 * Handles complete backup and restore operations for SQLite and AsyncStorage
 */

// List of all SQLite tables to backup
const SQLITE_TABLES = [
  "notes",
  "journals",
  "mistakes",
  "overthinking",
  "todos",
  "habits",
  "ideas",
  "documents",
  "custom_lists",
  "water_reminders",
  "daily_summaries",
];

// AsyncStorage keys to backup (add more as needed)
const ASYNC_STORAGE_KEYS = [
  "userPreferences",
  "appSettings",
  "themeSettings",
  "notificationSettings",
  "syncSettings",
  "lastBackupDate",
  "premiumStatus",
];

/**
 * Export all SQLite table data
 * @returns {Object} Object containing all table data
 */
export const exportSQLiteData = async () => {
  try {
    const db = await openDB();
    const sqliteData = {};

    for (const tableName of SQLITE_TABLES) {
      try {
        // Check if table exists
        const tableExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName]
        );

        if (tableExists) {
          const rows = await db.getAllAsync(`SELECT * FROM ${tableName}`);
          sqliteData[tableName] = rows || [];
          console.log(`✅ Exported ${rows?.length || 0} rows from ${tableName}`);
        } else {
          sqliteData[tableName] = [];
          console.log(`⚠️ Table ${tableName} does not exist, skipping`);
        }
      } catch (error) {
        console.error(`Error exporting table ${tableName}:`, error);
        sqliteData[tableName] = [];
      }
    }

    return sqliteData;
  } catch (error) {
    console.error("Error exporting SQLite data:", error);
    throw new Error("Failed to export SQLite data");
  }
};

/**
 * Export all AsyncStorage data
 * @returns {Object} Object containing all AsyncStorage data
 */
export const exportAsyncStorageData = async () => {
  try {
    const asyncStorageData = {};

    for (const key of ASYNC_STORAGE_KEYS) {
      try {
        const value = await AsyncStorage.getItem(key);
        asyncStorageData[key] = value ? JSON.parse(value) : null;
      } catch (error) {
        console.error(`Error reading AsyncStorage key ${key}:`, error);
        asyncStorageData[key] = null;
      }
    }

    // Also get all keys to capture any additional data
    const allKeys = await AsyncStorage.getAllKeys();
    const additionalKeys = allKeys.filter(
      (key) => !ASYNC_STORAGE_KEYS.includes(key)
    );

    for (const key of additionalKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        asyncStorageData[key] = value ? JSON.parse(value) : null;
      } catch (error) {
        console.error(`Error reading additional AsyncStorage key ${key}:`, error);
      }
    }

    return asyncStorageData;
  } catch (error) {
    console.error("Error exporting AsyncStorage data:", error);
    throw new Error("Failed to export AsyncStorage data");
  }
};

/**
 * Create a complete backup JSON object
 * @returns {Object} Complete backup object with metadata
 */
export const createBackup = async () => {
  try {
    console.log("🔄 Creating backup...");

    const sqliteData = await exportSQLiteData();
    const asyncStorageData = await exportAsyncStorageData();

    const backup = {
      metadata: {
        version: "1.0.0",
        appName: "Unwind",
        createdAt: new Date().toISOString(),
        platform: "expo",
      },
      sqliteData,
      asyncStorageData,
    };

    // Calculate approximate size
    const backupString = JSON.stringify(backup);
    const sizeInBytes = new Blob([backupString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    backup.metadata.size = sizeInBytes;
    backup.metadata.sizeFormatted =
      sizeInBytes > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`;

    console.log(`✅ Backup created: ${backup.metadata.sizeFormatted}`);
    return backup;
  } catch (error) {
    console.error("Error creating backup:", error);
    throw error;
  }
};

/**
 * Save backup to local file system
 * @param {Object} backup - Backup object to save
 * @returns {string} File path of saved backup
 */
export const saveBackupToFile = async (backup) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `unwind-backup-${timestamp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error saving backup to file:", error);
    throw new Error("Failed to save backup file");
  }
};

/**
 * Share backup file with user (allows them to save/share)
 * @param {string} filePath - Path to backup file
 */
export const shareBackupFile = async (filePath) => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Sharing is not available on this device");
    }

    await Sharing.shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Save Unwind Backup",
      UTI: "public.json",
    });

    console.log("✅ Backup file shared successfully");
  } catch (error) {
    console.error("Error sharing backup file:", error);
    throw error;
  }
};

/**
 * Let user pick a backup file to restore
 * @returns {Object} Backup object from selected file
 */
export const pickBackupFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const backup = JSON.parse(fileContent);

    // Validate backup structure
    if (!backup.metadata || !backup.sqliteData || !backup.asyncStorageData) {
      throw new Error("Invalid backup file format");
    }

    console.log("✅ Backup file loaded successfully");
    return backup;
  } catch (error) {
    console.error("Error picking backup file:", error);
    throw new Error("Failed to load backup file. Please select a valid backup file.");
  }
};

/**
 * Restore SQLite data from backup
 * @param {Object} sqliteData - SQLite data from backup
 */
export const restoreSQLiteData = async (sqliteData) => {
  try {
    const db = await openDB();

    for (const [tableName, rows] of Object.entries(sqliteData)) {
      if (!rows || rows.length === 0) {
        console.log(`⚠️ No data to restore for table ${tableName}`);
        continue;
      }

      try {
        // Check if table exists
        const tableExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName]
        );

        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist, skipping`);
          continue;
        }

        // Clear existing data
        await db.runAsync(`DELETE FROM ${tableName}`);

        // Get column names from first row
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => "?").join(", ");
        const columnNames = columns.join(", ");

        // Insert all rows
        for (const row of rows) {
          const values = columns.map((col) => {
            const value = row[col];
            // Handle JSON strings and objects
            if (typeof value === "object" && value !== null) {
              return JSON.stringify(value);
            }
            return value;
          });

          await db.runAsync(
            `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
            values
          );
        }

        console.log(`✅ Restored ${rows.length} rows to ${tableName}`);
      } catch (error) {
        console.error(`Error restoring table ${tableName}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error restoring SQLite data:", error);
    throw new Error("Failed to restore database data");
  }
};

/**
 * Restore AsyncStorage data from backup
 * @param {Object} asyncStorageData - AsyncStorage data from backup
 */
export const restoreAsyncStorageData = async (asyncStorageData) => {
  try {
    for (const [key, value] of Object.entries(asyncStorageData)) {
      if (value === null || value === undefined) {
        continue;
      }

      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error restoring AsyncStorage key ${key}:`, error);
      }
    }

    console.log("✅ AsyncStorage data restored successfully");
  } catch (error) {
    console.error("Error restoring AsyncStorage data:", error);
    throw new Error("Failed to restore app settings");
  }
};

/**
 * Complete restore operation from backup object
 * @param {Object} backup - Backup object to restore
 */
export const restoreBackup = async (backup) => {
  try {
    console.log("🔄 Restoring backup...");

    // Validate backup
    if (!backup.metadata || !backup.sqliteData || !backup.asyncStorageData) {
      throw new Error("Invalid backup format");
    }

    await restoreSQLiteData(backup.sqliteData);
    await restoreAsyncStorageData(backup.asyncStorageData);

    // Store last restore date
    await AsyncStorage.setItem(
      "lastRestoreDate",
      JSON.stringify({
        date: new Date().toISOString(),
        backupDate: backup.metadata.createdAt,
      })
    );

    console.log("✅ Backup restored successfully");
  } catch (error) {
    console.error("Error restoring backup:", error);
    throw error;
  }
};

/**
 * Get backup statistics
 * @returns {Object} Statistics about current data
 */
export const getBackupStats = async () => {
  try {
    const db = await openDB();
    const stats = {
      tables: {},
      totalRecords: 0,
    };

    for (const tableName of SQLITE_TABLES) {
      try {
        const tableExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName]
        );

        if (tableExists) {
          const result = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          const count = result?.count || 0;
          stats.tables[tableName] = count;
          stats.totalRecords += count;
        }
      } catch (error) {
        console.error(`Error getting stats for table ${tableName}:`, error);
      }
    }

    // Get last backup date
    const lastBackup = await AsyncStorage.getItem("lastBackupDate");
    stats.lastBackupDate = lastBackup ? JSON.parse(lastBackup) : null;

    const lastRestore = await AsyncStorage.getItem("lastRestoreDate");
    stats.lastRestoreDate = lastRestore ? JSON.parse(lastRestore) : null;

    return stats;
  } catch (error) {
    console.error("Error getting backup stats:", error);
    return {
      tables: {},
      totalRecords: 0,
      lastBackupDate: null,
      lastRestoreDate: null,
    };
  }
};

/**
 * Perform complete local backup operation
 * @returns {Object} Result object with success status and file path
 */
export const performLocalBackup = async () => {
  try {
    const backup = await createBackup();
    const filePath = await saveBackupToFile(backup);
    await shareBackupFile(filePath);

    // Store last backup date
    await AsyncStorage.setItem(
      "lastBackupDate",
      JSON.stringify({
        date: new Date().toISOString(),
        type: "local",
        size: backup.metadata.size,
      })
    );

    return {
      success: true,
      filePath,
      size: backup.metadata.sizeFormatted,
    };
  } catch (error) {
    console.error("Error performing local backup:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Perform complete local restore operation
 * @returns {Object} Result object with success status
 */
export const performLocalRestore = async () => {
  try {
    const backup = await pickBackupFile();
    
    if (!backup) {
      return {
        success: false,
        cancelled: true,
      };
    }

    await restoreBackup(backup);

    return {
      success: true,
      backupDate: backup.metadata.createdAt,
    };
  } catch (error) {
    console.error("Error performing local restore:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
