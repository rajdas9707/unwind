import { initWorkoutTables } from "../workout/db";

export const migrate = async (db) => {
  try {
    console.log("🔄 Running migration v12...");
    
    // Initialize workout tables
    await initWorkoutTables(db);

    console.log("✅ Migration v12 completed successfully");
  } catch (error) {
    console.error("❌ Error running migration v12:", error);
    throw error;
  }
};
