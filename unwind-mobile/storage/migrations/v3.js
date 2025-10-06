import { initSummaryScoreTable } from "../summaryscore/db";

export const migrate = async (db) => {
  try {
    console.log("🔄 Starting v3 migration...");
    await initSummaryScoreTable(db);
    console.log("✅ v3 migration completed - Created summaryscore table");
  } catch (error) {
    console.error("❌ Error in v3 migration:", error);
    throw error;
  }
};
