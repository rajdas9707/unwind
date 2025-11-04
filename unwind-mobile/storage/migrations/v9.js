export const migrate = async (db) => {
  try {
    console.log("🔄 Running migration v9...");
    
    // Check if columns exist first
    const tableInfo = await db.getAllAsync("PRAGMA table_info(ideas)");
    const columnNames = tableInfo.map(col => col.name);
    
    // Add name column if it doesn't exist
    if (!columnNames.includes('name')) {
      await db.execAsync(`
        ALTER TABLE ideas ADD COLUMN name TEXT DEFAULT '';
      `);
      console.log("✅ Added 'name' column to ideas table");
    } else {
      console.log("⚠️ 'name' column already exists");
    }

    // Add researchTopics column if it doesn't exist
    if (!columnNames.includes('researchTopics')) {
      await db.execAsync(`
        ALTER TABLE ideas ADD COLUMN researchTopics TEXT DEFAULT '[]';
      `);
      console.log("✅ Added 'researchTopics' column to ideas table");
    } else {
      console.log("⚠️ 'researchTopics' column already exists");
    }

    console.log("✅ Migration v9 completed successfully");
  } catch (error) {
    console.error("❌ Error running migration v9:", error);
    throw error;
  }
};
