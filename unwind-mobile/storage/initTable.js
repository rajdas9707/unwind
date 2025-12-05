import { initBuyItemsTable } from "./buyItems/db";
import { initCustomListsTable } from "./customLists/db";
import { initDocumentsTable } from "./document/db";
import { initIdeasTable } from "./idea/db";
import { initJournalsTable } from "./journal/db";
import { initMistakesTable } from "./mistakes/db";
import { initNotesTable } from "./notes/db";
import { initOverthinkingsTable } from "./overthinking/db";
import { initTodosTable } from "./todo/db";
import { initTopicsTable } from "./topic/db";
import { initwaterRemindersTable } from "./waterreminder/db";
import { initReminderTable } from "./reminder/db";

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
    await initJournalsTable(db);
    await initMistakesTable(db);
    await initNotesTable(db);
    await initOverthinkingsTable(db);
    await initTopicsTable(db);
    await initwaterRemindersTable(db);
    // General reminder feature uses its own small SQLite file; just ensure its table exists
    await initReminderTable(db);
    await initTodosTable(db);

    // console.log("✅ All tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};
