import { initBuyItemsTable } from "./buyItems/db";
import { initCustomListsTable } from "./customLists/db";
import { initDocumentsTable } from "./document/db";
import { initIdeasTable } from "./idea/db";
import { initNotesTable } from "./notes/db";
import { initTopicsTable } from "./topic/db";
import { initwaterRemindersTable } from "./waterreminder/db";
import { initReminderTable } from "./reminder/db";
// Note: journal, mistakes, overthinking, todo use backend-only storage (no SQLite)

import { openDB } from "./mainDb";

export const initTable = async () => {
  try {
    // open the shared database connection and pass it to each initializer so
    // the table creation runs in a single DB instance (prevents missing tables)
    const db = await openDB();

    // Initialize all tables with explicit DB connection
    await initBuyItemsTable(db);
    await initCustomListsTable(db);
    await initDocumentsTable(db);
    await initIdeasTable(db);
    await initNotesTable(db);
    await initTopicsTable(db);
    await initwaterRemindersTable(db);
    // General reminder feature uses its own small SQLite file; just ensure its table exists
    await initReminderTable(db);
    // journal, mistakes, overthinking, todo: backend-only (no SQLite tables needed)

    // console.log("✅ All tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};
