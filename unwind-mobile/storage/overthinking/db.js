// Overthinking data is stored in the backend only. SQLite removed.

export const initOverthinkingsTable = async (db) => {
  // No-op: overthinking uses backend-only storage
};

export const insertOverthinkingEntry = async () => null;

export const getRecentOverthinkingEntries = async () => [];

export const getOverthinkingEntriesByDate = async () => [];

export const getOverthinkingEntryById = async () => null;

export const updateOverthinkingEntry = async () => null;

export const toggleOverthinkingDumped = async () => null;

export const markOverthinkingEntrySynced = async () => null;

export const getUnsyncedOverthinkingEntries = async () => [];

export const deleteOverthinkingEntryById = async () => true;

export const upsertOverthinkingFromServer = async () => true;

export const getOverthinkingEntriesCountForDate = async () => 0;

export const getOverthinkingSyncAttemptsCountToday = async () => 0;
