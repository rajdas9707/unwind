// Journal data is stored in the backend only. SQLite removed.

// No-op: table initialization is no longer needed
export const initJournalsTable = async (db) => {
  // No-op: journal uses backend-only storage
};

export const insertJournalEntry = async () => null;

export const getRecentJournalEntries = async () => [];

export const getJournalEntriesByDate = async () => [];

export const getJournalEntryById = async () => null;

export const updateJournalEntry = async () => null;

export const markJournalEntrySynced = async () => null;

export const getUnsyncedJournalEntries = async () => [];

export const deleteJournalEntryById = async () => true;

export const upsertJournalFromServer = async () => true;

export const getJournalEntriesCountForDate = async () => 0;

export const getSyncAttemptsCountToday = async () => 0;
