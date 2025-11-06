import { initDietTables } from "../diet/db";

export const migrate = async (db) => {
  try {
    console.log("🔄 Running migration v11...");
    
    // Initialize diet tables
    await initDietTables(db);

    console.log("✅ Migration v11 completed successfully");
  } catch (error) {
    console.error("❌ Error running migration v11:", error);
    throw error;
  }
};
