export const migrate = async (db) => {
  try {
    // Create custom_lists table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6BCB77',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        server_id TEXT,
        server_meta TEXT
      );
    `);

    // Create custom_list_items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        note TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        server_id TEXT,
        server_meta TEXT,
        FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for faster queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_custom_lists_created_at ON custom_lists(created_at);
      CREATE INDEX IF NOT EXISTS idx_custom_lists_synced ON custom_lists(synced);
      CREATE INDEX IF NOT EXISTS idx_custom_list_items_list_id ON custom_list_items(list_id);
      CREATE INDEX IF NOT EXISTS idx_custom_list_items_status ON custom_list_items(status);
      CREATE INDEX IF NOT EXISTS idx_custom_list_items_synced ON custom_list_items(synced);
    `);

    console.log("✅ Migration v8 completed successfully");
  } catch (error) {
    console.error("❌ Error running migration v8:", error);
    throw error;
  }
};
