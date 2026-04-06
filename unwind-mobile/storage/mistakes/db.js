// Mistakes data is stored in the backend only. SQLite removed.

export const initMistakesTable = async (db) => {
  // No-op: mistakes uses backend-only storage
};

export const insertMistakesEntry = async () => null;

export const getRecentMistakesEntries = async () => [];

export const getMistakesEntriesByDate = async () => [];

export const getMistakesEntryById = async () => null;

export const updateMistakesEntry = async () => null;

export const toggleMistakesAvoided = async () => null;

export const markMistakesEntrySynced = async () => null;

export const getUnsyncedMistakesEntries = async () => [];

export const deleteMistakesEntryById = async () => true;

export const upsertMistakesFromServer = async () => true;

export const getMistakesEntriesCountForDate = async () => 0;

export const getMistakesSyncAttemptsCountToday = async () => 0;
