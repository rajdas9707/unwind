import { openDB } from "../mainDb";

export const initHabitsTable = async (db) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_habits_start_date ON habits(start_date);
      CREATE INDEX IF NOT EXISTS idx_habits_end_date ON habits(end_date);
    `);
  } catch (e) {
    console.error("Error initializing habits table:", e);
    throw e;
  }
};

export const insertHabit = async ({ name, startDate, endDate, notifyTime = '08:00', notifIds = null }) => {
  const db = await openDB();
  const now = new Date().toISOString();
  const notifJson = notifIds ? JSON.stringify(notifIds) : null;
  const res = await db.runAsync(
    `INSERT INTO habits (name, start_date, end_date, created_at, notify_time, notif_ids) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, startDate, endDate, now, notifyTime, notifJson]
  );
  const row = await db.getFirstAsync(`SELECT * FROM habits WHERE id = ?`, [res.lastInsertRowId]);
  return row;
};

export const getAllHabits = async () => {
  const db = await openDB();
  const rows = await db.getAllAsync(`SELECT * FROM habits ORDER BY created_at DESC`);
  return rows.map(r => ({ ...r, notif_ids: r.notif_ids ? JSON.parse(r.notif_ids) : null, enabled: r.enabled === 1 }));
};

export const setHabitEnabled = async ({ id, enabled, notifIds = null }) => {
  const db = await openDB();
  const json = notifIds ? JSON.stringify(notifIds) : null;
  await db.runAsync(`UPDATE habits SET enabled = ?, notif_ids = ? WHERE id = ?`, [enabled ? 1 : 0, json, id]);
};

export const updateHabitNotifIds = async ({ id, notifIds }) => {
  const db = await openDB();
  const json = notifIds ? JSON.stringify(notifIds) : null;
  await db.runAsync(`UPDATE habits SET notif_ids = ? WHERE id = ?`, [json, id]);
};


export const deleteHabit = async (id) => {
  const db = await openDB();
  await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
};

export const updateHabit = async ({ id, name, startDate, endDate, notifyTime, notifIds }) => {
  const db = await openDB();
  const notifJson = notifIds ? JSON.stringify(notifIds) : null;
  await db.runAsync(
    `UPDATE habits SET name = ?, start_date = ?, end_date = ?, notify_time = ?, notif_ids = ? WHERE id = ?`,
    [name, startDate, endDate, notifyTime, notifJson, id]
  );
};
