import { initBuyItemsTable } from "../buyItems/db";
import { initDocumentsTable } from "../document/db";
import { initIdeasTable } from "../idea/db";
import { initTopicsTable } from "../topic/db";
import { initwaterRemindersTable } from "../waterreminder/db";
// Note: journal, mistakes, overthinking, todo use backend-only storage (no SQLite)

export const migrate = async (db) => {
  try {
    // Initialize all tables
    await initBuyItemsTable(db);
    await initDocumentsTable(db);
    await initIdeasTable(db);
    await initTopicsTable(db);
    await initwaterRemindersTable(db);
    // journal, mistakes, overthinking, todo: backend-only (skipped)

    console.log("✅ All tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
};
