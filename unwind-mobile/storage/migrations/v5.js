import { initHabitsTable } from "../habits/db";

export const migrate = async (db) => {
  try {
    console.log("🔄 Starting v5 migration...");
    // Ensure base table exists
    await initHabitsTable(db);

    // Add columns notify_time and notif_ids if missing
    const columns = await db.getAllAsync("PRAGMA table_info(habits)");
    const names = new Set(columns.map(c => c.name));

    if (!names.has("notify_time")) {
      await db.execAsync(`ALTER TABLE habits ADD COLUMN notify_time TEXT DEFAULT '08:00';`);
    }
    if (!names.has("notif_ids")) {
      await db.execAsync(`ALTER TABLE habits ADD COLUMN notif_ids TEXT;`);
    }

    console.log("✅ v5 migration completed - Added notify_time and notif_ids");
  } catch (error) {
    console.error("❌ Error in v5 migration:", error);
    throw error;
  }
};
