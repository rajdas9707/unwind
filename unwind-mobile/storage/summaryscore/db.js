import { openDB } from "../mainDb";

export const initSummaryScoreTable = async (db) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS summaryscore (
        date TEXT PRIMARY KEY,
        score INTEGER NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_summaryscore_date ON summaryscore(date);
    `);
  } catch (e) {
    console.error("Error initializing summaryscore table:", e);
    throw e;
  }
};

export const upsertSummaryScore = async ({ date, score }) => {
  const db = await openDB();
  await db.runAsync(
    `INSERT INTO summaryscore (date, score) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET score=excluded.score`,
    [date, score]
  );
};

export const getSummaryScoresInRange = async ({ startDate, endDate }) => {
  const db = await openDB();
  const rows = await db.getAllAsync(
    `SELECT date, score FROM summaryscore
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC`,
    [startDate, endDate]
  );
  return rows;
};
