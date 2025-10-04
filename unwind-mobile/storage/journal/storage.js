import {
  deleteJournalEntryById,
  getJournalEntriesByDate,
  getJournalEntriesCountForDate,
  getJournalEntryById,
  getRecentJournalEntries,
  getSyncAttemptsCountToday,
  getUnsyncedJournalEntries,
  insertJournalEntry,
  updateJournalEntry,
} from "./db";

// Business logic and validation layer for journal entries

// Validate journal entry content
const validateJournalEntry = (content, title = "") => {
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new Error("Journal content is required and cannot be empty");
  }

  if (content.trim().length > 5000) {
    throw new Error("Journal content must be less than 5000 characters");
  }

  if (title && title.length > 200) {
    throw new Error("Journal title must be less than 200 characters");
  }

  return {
    title: title?.trim() || "",
    content: content.trim(),
  };
}
// Create new journal entry with validation and rate limiting
export const createJournalEntryLocal = async ({ title, content }) => {
  try {
    // Validate input
    const validatedData = validateJournalEntry(content, title);

    // Check daily limit (3 entries per day)
    const today = new Date().toISOString().split("T")[0];
    const todayCount = await getJournalEntriesCountForDate(today);

    if (todayCount >= 3) {
      throw new Error(
        "You can only create 3 journal entries per day. Try again tomorrow!"
      );
    }

    // Create timestamps
    const now = new Date().toISOString();

    // Insert locally first
    const localEntry = await insertJournalEntry({
      title: validatedData.title,
      content: validatedData.content,
      created_at: now,
      updated_at: now,
    });

    return {
      ...localEntry
    };
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }

}

// Fetch recent journal entries
export const fetchRecentJournalEntries = async (limit = 10, signal) => {
  const entries = await getRecentJournalEntries(limit);
  console.log("Recent entries fetched/storage/journal/storage.js:", entries);
  return entries.map((entry) => ({
    ...entry,
    truncatedContent:
      entry.content.length > 100
        ? entry.content.substring(0, 100) + "..."
        : entry.content,
  }));
};

// Fetch journal entries by date
export const fetchJournalsByDate = async (date, signal) => {
  const entries = await getJournalEntriesByDate(date);
  return entries.map((entry) => ({
    ...entry,
    truncatedContent:
      entry.content.length > 100
        ? entry.content.substring(0, 100) + "..."
        : entry.content,
  }));
};

// Get single journal entry by ID
export const fetchJournalEntryById = async (id) => {
  const entry = await getJournalEntryById(id);
  if (!entry) return null;
  return {
    ...entry
  };
};


// Update journal entry with validation
export const updateJournalEntryLocal = async ({ id, title, content }) => {
  // Validate input
  const validatedData = validateJournalEntry(content, title);

  const updatedEntry = await updateJournalEntry({
    id,
    title: validatedData.title,
    content: validatedData.content,
    updated_at: new Date().toISOString(),
  });

  return {
    ...updatedEntry
  };
};

// Delete journal entry locally only
export const deleteJournalEntryLocal = async ({ entry }) => {
  // Delete from local database only
  await deleteJournalEntryById(entry.id);
  return true;
};

// Get unsynced entries count
export const getUnsyncedCount = async () => {
  const unsyncedEntries = await getUnsyncedJournalEntries();
  return unsyncedEntries.length;
};

// Check if user can create more entries today
export const canCreateEntryToday = async () => {
  const today = new Date().toISOString().split("T")[0];
  const todayCount = await getJournalEntriesCountForDate(today);
  return todayCount < 3;
};

// Check if user can sync today
export const canSyncToday = async () => {
  const todaySyncCount = await getSyncAttemptsCountToday();
  return todaySyncCount < 3;
};

