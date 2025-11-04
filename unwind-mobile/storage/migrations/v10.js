export const migrate = async (db) => {
  try {
    console.log("🔄 Running migration v10...");
    
    // Check if columns exist first
    const tableInfo = await db.getAllAsync("PRAGMA table_info(ideas)");
    const columnNames = tableInfo.map(col => col.name);
    
    // Add learnings column if it doesn't exist
    if (!columnNames.includes('learnings')) {
      await db.execAsync(`
        ALTER TABLE ideas ADD COLUMN learnings TEXT DEFAULT '[]';
      `);
      console.log("✅ Added 'learnings' column to ideas table");
    } else {
      console.log("⚠️ 'learnings' column already exists");
    }

    console.log("✅ Migration v10 completed successfully");
  } catch (error) {
    console.error("❌ Error running migration v10:", error);
    throw error;
  }
};
