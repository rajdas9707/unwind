import { openDB } from "../mainDb";

// Initialize reminders table using the shared unwind.db connection
// (called from storage/initTable.js, same pattern as waterreminder/db.js)
export const initReminderTable = async (db) => {
  try {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS task_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        datetime TEXT,
        repeat_every_days INTEGER,
        repeat_until TEXT,
        series_id TEXT,
        notification_id TEXT
      )`
    );
  } catch (error) {
    console.error("Error initializing task_reminders table:", error);
    throw error;
  }
};

// Fetch helpers (use shared DB via openDB, like waterreminder)
export const fetchAllReminders = async () => {
  const database = await openDB();
  return database.getAllAsync(
    "SELECT * FROM task_reminders ORDER BY datetime ASC"
  );
};

export const getReminderById = async (id) => {
  const database = await openDB();
  return database.getFirstAsync("SELECT * FROM task_reminders WHERE id = ?", [
    id,
  ]);
};

export const getReminderMetaById = async (id) => {
  const database = await openDB();
  return database.getFirstAsync(
    "SELECT series_id, notification_id FROM task_reminders WHERE id = ?",
    [id]
  );
};

// Insert / update helpers
export const insertReminder = async ({
  name,
  description,
  datetimeISO,
  repeatEveryDays = null,
  repeatUntilISO = null,
  seriesId = null,
}) => {
  const database = await openDB();
  return database.runAsync(
    "INSERT INTO task_reminders (name, description, datetime, repeat_every_days, repeat_until, series_id, notification_id) VALUES (?, ?, ?, ?, ?, ?, NULL)",
    [name, description, datetimeISO, repeatEveryDays, repeatUntilISO, seriesId]
  );
};

export const updateReminderCore = async ({
  id,
  name,
  description,
  datetimeISO,
}) => {
  const database = await openDB();
  return database.runAsync(
    "UPDATE task_reminders SET name = ?, description = ?, datetime = ? WHERE id = ?",
    [name, description, datetimeISO, id]
  );
};

export const updateReminderNotificationId = async (id, notificationId) => {
  const database = await openDB();
  return database.runAsync(
    "UPDATE task_reminders SET notification_id = ? WHERE id = ?",
    [notificationId, id]
  );
};

export const clearReminderNotificationId = async (id) => {
  const database = await openDB();
  return database.runAsync(
    "UPDATE task_reminders SET notification_id = NULL WHERE id = ?",
    [id]
  );
};

export const getRemindersBySeriesId = async (seriesId) => {
  const database = await openDB();
  return database.getAllAsync(
    "SELECT id, notification_id FROM task_reminders WHERE series_id = ?",
    [seriesId]
  );
};

export const deleteReminderById = async (id) => {
  const database = await openDB();
  return database.runAsync("DELETE FROM task_reminders WHERE id = ?", [id]);
};

export const deleteRemindersBySeriesId = async (seriesId) => {
  const database = await openDB();
  return database.runAsync("DELETE FROM task_reminders WHERE series_id = ?", [
    seriesId,
  ]);
};
