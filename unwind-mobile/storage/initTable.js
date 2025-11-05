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

export const initTable = async () => {
  try {
    // Initialize all tables
    await initBuyItemsTable();
    await initCustomListsTable();
    await initDocumentsTable();
    await initIdeasTable();
    await initJournalsTable();
    await initMistakesTable();
    await initNotesTable();
    await initOverthinkingsTable();
    await initTopicsTable();
    await initwaterRemindersTable();
    await initTodosTable();

    console.log("✅ All tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
};
