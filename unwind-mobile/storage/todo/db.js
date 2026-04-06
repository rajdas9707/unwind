// Todo data is stored in the backend only. SQLite removed.

export const initTodosTable = async (db) => {
  // No-op: todos uses backend-only storage
};

export const insertTodoEntry = async () => null;
export const getRecentTodoEntries = async () => [];
export const getTodosByCategory = async () => [];
export const getCarriedOverTodosByCategory = async () => [];
export const getCarriedOverEntryById = async () => null;
export const getTodoEntryById = async () => null;
export const updateTodoEntry = async () => null;
export const toggleTodoComplete = async () => null;
export const toggleCarriedOverComplete = async () => null;
export const markTodoEntrySynced = async () => null;
export const getUnsyncedTodoEntries = async () => [];
export const deleteTodoEntryById = async () => true;
export const moveTaskToCarriedOver = async () => null;
export const moveAllPendingTasksToCarriedOver = async () => 0;
export const upsertTodoFromServer = async () => true;
export const getTodoEntriesCountForDate = async () => 0;
export const getTodoSyncAttemptsCountToday = async () => 0;
export const performDailyCleanup = async () => 0;
