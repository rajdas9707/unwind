import { openDB } from "../mainDb";

/**
 * Initialize diet tables
 * - diet_items: Daily diet entries (today's meals)
 * - repeat_diet_items: Templates for recurring meals
 */
export const initDietTables = async (db) => {
  try {
    console.log("🍽️ Initializing diet tables...");

    // Main diet items table - stores individual diet entries per day
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS diet_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        repeat_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Repeating diet items table - stores templates for daily recurring meals
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS repeat_diet_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Create indexes for faster queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_diet_items_date ON diet_items(date);
      CREATE INDEX IF NOT EXISTS idx_diet_items_repeat_id ON diet_items(repeat_id);
      CREATE INDEX IF NOT EXISTS idx_repeat_diet_items_active ON repeat_diet_items(active);
    `);

    console.log("✅ Diet tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing diet tables:", error);
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
 * Insert a new diet item
 * @param {Object} params - Diet item parameters
 * @param {string} params.name - Meal name
 * @param {string} params.time - Time to eat (HH:MM format)
 * @param {string} params.date - Date (YYYY-MM-DD)
 * @param {number|null} params.repeatId - ID of repeat template if this is a recurring item
 */
export const insertDietItem = async ({ name, time, date, repeatId = null }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO diet_items (name, time, date, status, repeat_id, created_at, updated_at) 
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
      [name, time, date, repeatId, now, now]
    );

    const newItem = await db.getFirstAsync(
      "SELECT * FROM diet_items WHERE id = ?",
      [result.lastInsertRowId]
    );

    return newItem;
  } catch (error) {
    console.error("Error inserting diet item:", error);
    throw error;
  }
};

/**
 * Insert a repeating diet item template
 */
export const insertRepeatDietItem = async ({ name, time }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO repeat_diet_items (name, time, active, created_at, updated_at) 
       VALUES (?, ?, 1, ?, ?)`,
      [name, time, now, now]
    );

    const newItem = await db.getFirstAsync(
      "SELECT * FROM repeat_diet_items WHERE id = ?",
      [result.lastInsertRowId]
    );

    return newItem;
  } catch (error) {
    console.error("Error inserting repeat diet item:", error);
    throw error;
  }
};

/**
 * Get all diet items for a specific date
 */
export const getDietItemsByDate = async (date) => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync(
      "SELECT * FROM diet_items WHERE date = ? ORDER BY time ASC",
      [date]
    );
    return rows;
  } catch (error) {
    console.error("Error getting diet items by date:", error);
    throw error;
  }
};

/**
 * Get all active repeating diet items
 */
export const getActiveRepeatDietItems = async () => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync(
      "SELECT * FROM repeat_diet_items WHERE active = 1 ORDER BY time ASC"
    );
    return rows;
  } catch (error) {
    console.error("Error getting repeat diet items:", error);
    throw error;
  }
};

/**
 * Update diet item status (pending/completed)
 */
export const updateDietItemStatus = async (id, status) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE diet_items SET status = ?, updated_at = ? WHERE id = ?",
      [status, now, id]
    );

    const updatedItem = await db.getFirstAsync(
      "SELECT * FROM diet_items WHERE id = ?",
      [id]
    );

    return updatedItem;
  } catch (error) {
    console.error("Error updating diet item status:", error);
    throw error;
  }
};

/**
 * Update diet item details
 */
export const updateDietItem = async ({ id, name, time }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE diet_items SET name = ?, time = ?, updated_at = ? WHERE id = ?",
      [name, time, now, id]
    );

    const updatedItem = await db.getFirstAsync(
      "SELECT * FROM diet_items WHERE id = ?",
      [id]
    );

    return updatedItem;
  } catch (error) {
    console.error("Error updating diet item:", error);
    throw error;
  }
};

/**
 * Update repeating diet item
 */
export const updateRepeatDietItem = async ({ id, name, time }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();

    await db.runAsync(
      "UPDATE repeat_diet_items SET name = ?, time = ?, updated_at = ? WHERE id = ?",
      [name, time, now, id]
    );

    const updatedItem = await db.getFirstAsync(
      "SELECT * FROM repeat_diet_items WHERE id = ?",
      [id]
    );

    return updatedItem;
  } catch (error) {
    console.error("Error updating repeat diet item:", error);
    throw error;
  }
};

/**
 * Delete a diet item
 */
export const deleteDietItem = async (id) => {
  try {
    const db = await openDB();
    await db.runAsync("DELETE FROM diet_items WHERE id = ?", [id]);
    return true;
  } catch (error) {
    console.error("Error deleting diet item:", error);
    throw error;
  }
};

/**
 * Delete a repeating diet item and optionally all future instances
 */
export const deleteRepeatDietItem = async (repeatId) => {
  try {
    const db = await openDB();
    
    // Delete the repeat template
    await db.runAsync("DELETE FROM repeat_diet_items WHERE id = ?", [repeatId]);
    
    // Delete all future instances (from today onwards)
    const today = getTodayDate();
    await db.runAsync(
      "DELETE FROM diet_items WHERE repeat_id = ? AND date >= ?",
      [repeatId, today]
    );
    
    return true;
  } catch (error) {
    console.error("Error deleting repeat diet item:", error);
    throw error;
  }
};

/**
 * Auto-load repeating items for today
 * Checks if repeating items exist for today, and creates them if not
 */
export const autoLoadRepeatingItems = async () => {
  try {
    const today = getTodayDate();
    const repeatItems = await getActiveRepeatDietItems();
    const existingItems = await getDietItemsByDate(today);

    // Get repeat_ids that already exist for today
    const existingRepeatIds = new Set(
      existingItems
        .filter((item) => item.repeat_id !== null)
        .map((item) => item.repeat_id)
    );

    // Insert missing repeat items for today
    for (const repeatItem of repeatItems) {
      if (!existingRepeatIds.has(repeatItem.id)) {
        await insertDietItem({
          name: repeatItem.name,
          time: repeatItem.time,
          date: today,
          repeatId: repeatItem.id,
        });
        console.log(`✅ Auto-loaded repeat item: ${repeatItem.name}`);
      }
    }

    return true;
  } catch (error) {
    console.error("Error auto-loading repeating items:", error);
    throw error;
  }
};

/**
 * Get diet progress for a specific date
 * Returns total count and completed count
 */
export const getDietProgress = async (date) => {
  try {
    const db = await openDB();
    
    const total = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM diet_items WHERE date = ?",
      [date]
    );
    
    const completed = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM diet_items WHERE date = ? AND status = 'completed'",
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
    console.error("Error getting diet progress:", error);
    return { total: 0, completed: 0, percentage: 0 };
  }
};

/**
 * Get today's diet progress
 */
export const getTodayDietProgress = async () => {
  const today = getTodayDate();
  return await getDietProgress(today);
};
