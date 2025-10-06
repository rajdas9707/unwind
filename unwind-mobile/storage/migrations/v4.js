import { initHabitsTable } from "../habits/db";

export const migrate = async (db) => {
  try {
    console.log("🔄 Starting v4 migration...");
    await initHabitsTable(db);
    console.log("✅ v4 migration completed - Created habits table");
  } catch (error) {
    console.error("❌ Error in v4 migration:", error);
    throw error;
  }
};
