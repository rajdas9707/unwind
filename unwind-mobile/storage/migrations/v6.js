export const migrate = async (db) => {
  try {
    console.log("🔄 Starting v6 migration (enforce NOT NULL on notify_time)...");

    // Detect current schema
    const tableInfo = await db.getAllAsync("PRAGMA table_info(habits)");
    const hasNotifyTime = tableInfo.some(c => c.name === 'notify_time');
    const hasNotNullNotify = tableInfo.some(c => c.name === 'notify_time' && c.notnull === 1);

    if (!hasNotifyTime || !hasNotNullNotify) {
      // Rebuild table to enforce NOT NULL
      await db.execAsync("BEGIN TRANSACTION;");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habits_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          notify_time TEXT NOT NULL,
          notif_ids TEXT
        );
      `);
      await db.execAsync(`
        INSERT INTO habits_new (id, name, start_date, end_date, created_at, notify_time, notif_ids)
        SELECT id, name, start_date, end_date, created_at, COALESCE(notify_time, '08:00'), notif_ids FROM habits;
      `);
      await db.execAsync(`DROP TABLE IF EXISTS habits;`);
      await db.execAsync(`ALTER TABLE habits_new RENAME TO habits;`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_habits_start_date ON habits(start_date);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_habits_end_date ON habits(end_date);`);
      await db.execAsync("COMMIT;");
      console.log("✅ v6 migration completed - NOT NULL enforced on notify_time");
    } else {
      console.log("ℹ️ v6 migration skipped - notify_time already NOT NULL");
    }
  } catch (error) {
    try { await db.execAsync("ROLLBACK;"); } catch {}
    console.error("❌ Error in v6 migration:", error);
    throw error;
  }
};
