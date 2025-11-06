import { openDB } from "../mainDb";

/**
 * Initialize workout tables
 * - workout_items: Daily workout entries (today's workouts)
 * - repeat_workout_items: Templates for recurring workouts
 */
export const initWorkoutTables = async (db) => {
  try {
    console.log("💪 Initializing workout tables...");

    // Main workout items table - stores individual workout entries per day
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        time TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        repeat_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Repeating workout items table - stores templates for daily recurring workouts
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS repeat_workout_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        time TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Create indexes for faster queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_workout_items_date ON workout_items(date);
      CREATE INDEX IF NOT EXISTS idx_workout_items_repeat_id ON workout_items(repeat_id);
      CREATE INDEX IF NOT EXISTS idx_repeat_workout_items_active ON repeat_workout_items(active);
    `);

    console.log("✅ Workout tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing workout tables:", error);
    throw error;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

/**
 * Insert a new workout item
 * @param {Object} params - Workout item parameters
 * @param {string} params.name - Exercise name
 * @param {number} params.sets - Number of sets
 * @param {number} params.reps - Number of reps per set
 * @param {string} params.time - Time to workout (HH:MM format)
 * @param {string} params.date - Date (YYYY-MM-DD)
 * @param {number|null} params.repeatId - ID of repeat template if this is a recurring item
 */
export const insertWorkoutItem = async ({ name, sets, reps, time, date, repeatId = null }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO workout_items (name, sets, reps, time, date, status, repeat_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [name, sets, reps, time, date, repeatId, now, now]
    );

    const newItem = await db.getFirstAsync(
      "SELECT * FROM workout_items WHERE id = ?",
      [result.lastInsertRowId]
    );

    return newItem;
  } catch (error) {
    console.error("Error inserting workout item:", error);
    throw error;
  }
};

/**
 * Insert a repeating workout item template
 */
export const insertRepeatWorkoutItem = async ({ name, sets, reps, time }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO repeat_workout_items (name, sets, reps, time, active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [name, sets, reps, time, now, now]
    );

    const newItem = await db.getFirstAsync(
      "SELECT * FROM repeat_workout_items WHERE id = ?",
      [result.lastInsertRowId]
    );

    return newItem;
  } catch (error) {
    console.error("Error inserting repeat workout item:", error);
    throw error;
  }
};

/**
 * Get all workout items for a specific date
 */
export const getWorkoutItemsByDate = async (date) => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync(
      "SELECT * FROM workout_items WHERE date = ? ORDER BY time ASC",
      [date]
    );
    return rows;
  } catch (error) {
    console.error("Error getting workout items by date:", error);
    throw error;
  }
};

/**
 * Get all active repeating workout items
 */
export const getActiveRepeatWorkoutItems = async () => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync(
      "SELECT * FROM repeat_workout_items WHERE active = 1 ORDER BY time ASC"
    );
    return rows;
  } catch (error) {
    console.error("Error getting repeat workout items:", error);
    throw error;
  }
};

/**
 * Update workout item status (pending/completed)
 */
export const updateWorkoutItemStatus = async (id, status) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE workout_items SET status = ?, updated_at = ? WHERE id = ?",
      [status, now, id]
    );

    const updatedItem = await db.getFirstAsync(
      "SELECT * FROM workout_items WHERE id = ?",
      [id]
    );

    return updatedItem;
  } catch (error) {
    console.error("Error updating workout item status:", error);
    throw error;
  }
};

/**
 * Update workout item details
 */
export const updateWorkoutItem = async ({ id, name, sets, reps, time }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE workout_items SET name = ?, sets = ?, reps = ?, time = ?, updated_at = ? WHERE id = ?",
      [name, sets, reps, time, now, id]
    );

    const updatedItem = await db.getFirstAsync(
      "SELECT * FROM workout_items WHERE id = ?",
      [id]
    );

    return updatedItem;
  } catch (error) {
    console.error("Error updating workout item:", error);
    throw error;
  }
};

/**
 * Update repeating workout item
 */
export const updateRepeatWorkoutItem = async ({ id, name, sets, reps, time }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE repeat_workout_items SET name = ?, sets = ?, reps = ?, time = ?, updated_at = ? WHERE id = ?",
      [name, sets, reps, time, now, id]
    );

    const updatedItem = await db.getFirstAsync(
      "SELECT * FROM repeat_workout_items WHERE id = ?",
      [id]
    );

    return updatedItem;
  } catch (error) {
    console.error("Error updating repeat workout item:", error);
    throw error;
  }
};

/**
 * Delete a workout item
 */
export const deleteWorkoutItem = async (id) => {
  try {
    const db = await openDB();
    await db.runAsync("DELETE FROM workout_items WHERE id = ?", [id]);
    return true;
  } catch (error) {
    console.error("Error deleting workout item:", error);
    throw error;
  }
};

/**
 * Delete a repeating workout item and optionally all future instances
 */
export const deleteRepeatWorkoutItem = async (repeatId) => {
  try {
    const db = await openDB();
    
    // Delete the repeat template
    await db.runAsync("DELETE FROM repeat_workout_items WHERE id = ?", [repeatId]);
    
    // Delete all future instances (from today onwards)
    const today = getTodayDate();
    await db.runAsync(
      "DELETE FROM workout_items WHERE repeat_id = ? AND date >= ?",
      [repeatId, today]
    );
    
    return true;
  } catch (error) {
    console.error("Error deleting repeat workout item:", error);
    throw error;
  }
};

/**
 * Auto-load repeating items for today
 * Checks if repeating items exist for today, and creates them if not
 */
export const autoLoadRepeatingWorkouts = async () => {
  try {
    const today = getTodayDate();
    const repeatItems = await getActiveRepeatWorkoutItems();
    const existingItems = await getWorkoutItemsByDate(today);

    // Get repeat_ids that already exist for today
    const existingRepeatIds = new Set(
      existingItems
        .filter((item) => item.repeat_id !== null)
        .map((item) => item.repeat_id)
    );

    // Insert missing repeat items for today
    for (const repeatItem of repeatItems) {
      if (!existingRepeatIds.has(repeatItem.id)) {
        await insertWorkoutItem({
          name: repeatItem.name,
          sets: repeatItem.sets,
          reps: repeatItem.reps,
          time: repeatItem.time,
          date: today,
          repeatId: repeatItem.id,
        });
        console.log(`✅ Auto-loaded repeat workout: ${repeatItem.name}`);
      }
    }

    return true;
  } catch (error) {
    console.error("Error auto-loading repeating workouts:", error);
    throw error;
  }
};

/**
 * Get workout progress for a specific date
 * Returns total count and completed count
 */
export const getWorkoutProgress = async (date) => {
  try {
    const db = await openDB();
    
    const total = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM workout_items WHERE date = ?",
      [date]
    );
    
    const completed = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM workout_items WHERE date = ? AND status = 'completed'",
      [date]
    );

    return {
      total: total?.count || 0,
      completed: completed?.count || 0,
      percentage:
        total?.count > 0
          ? Math.round((completed?.count / total?.count) * 100)
          : 0,
    };
  } catch (error) {
    console.error("Error getting workout progress:", error);
    return { total: 0, completed: 0, percentage: 0 };
  }
};

/**
 * Get today's workout progress
 */
export const getTodayWorkoutProgress = async () => {
  const today = getTodayDate();
  return await getWorkoutProgress(today);
};
