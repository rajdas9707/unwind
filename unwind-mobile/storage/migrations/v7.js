export const migrate = async (db) => {
  try {
    console.log("🔄 Starting v7 migration (add enabled flag)...");
    const columns = await db.getAllAsync("PRAGMA table_info(habits)");
    const names = new Set(columns.map(c => c.name));
    if (!names.has("enabled")) {
      await db.execAsync(`ALTER TABLE habits ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;`);
      console.log("✅ v7 migration completed - added enabled column");
    } else {
      console.log("ℹ️ v7 migration skipped - enabled already exists");
    }
  } catch (error) {
    console.error("❌ Error in v7 migration:", error);
    throw error;
  }
};
