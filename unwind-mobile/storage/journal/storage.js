import {
  createJournalEntry,
  listJournalEntries,
  getJournalEntry,
  updateJournalEntry as updateJournalEntryAPI,
  deleteJournalEntry as deleteJournalEntryAPI,
} from '../../api/journal';

const normalizeEntry = (entry) => {
  const content = entry.content || '';
  return {
    id: entry._id,
    _id: entry._id,
    title: entry.title || '',
    content,
    created_at: entry.createdAt || entry.created_at || '',
    updated_at: entry.updatedAt || entry.updated_at || '',
    synced: true,
    server_id: entry._id,
    summary: entry.summary || null,
    positives: entry.positives || null,
    negatives: entry.negatives || null,
    lessons: entry.lessons || null,
    rating: entry.rating || null,
    mood: entry.mood || null,
    tags: entry.tags || [],
    truncatedContent: content.length > 100 ? content.substring(0, 100) + '...' : content,
  };
};

export const createJournalEntryLocal = async ({ title, content }) => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Journal content is required and cannot be empty');
  }
  if (content.trim().length > 5000) {
    throw new Error('Journal content must be less than 5000 characters');
  }
  if (title && title.length > 200) {
    throw new Error('Journal title must be less than 200 characters');
  }
  const entry = await createJournalEntry({
    title: title?.trim() || '',
    content: content.trim(),
  });
  return normalizeEntry(entry);
};

export const fetchRecentJournalEntries = async (limit = 10) => {
  try {
    const response = await listJournalEntries({ limit });
    const entries = response?.entries || (Array.isArray(response) ? response : []);
    return entries.map(normalizeEntry);
  } catch (error) {
    console.error('Error fetching recent journal entries:', error);
    throw error;
  }
};

export const fetchJournalsByDate = async (date) => {
  try {
    const response = await listJournalEntries({ date, limit: 50 });
    const entries = response?.entries || (Array.isArray(response) ? response : []);
    return entries.map(normalizeEntry);
  } catch (error) {
    console.error('Error fetching journal entries by date:', error);
    throw error;
  }
};

export const fetchJournalEntryById = async (id) => {
  try {
    const entry = await getJournalEntry({ id });
    if (!entry) return null;
    return normalizeEntry(entry);
  } catch (error) {
    console.error('Error fetching journal entry by id:', error);
    return null;
  }
};

export const updateJournalEntryLocal = async ({ id, title, content }) => {
  if (!content || content.trim().length === 0) {
    throw new Error('Journal content is required and cannot be empty');
  }
  const entry = await updateJournalEntryAPI({ id, title, content });
  return normalizeEntry(entry);
};

export const deleteJournalEntryLocal = async ({ entry }) => {
  await deleteJournalEntryAPI({ id: entry.id || entry._id });
  return true;
};

export const getUnsyncedCount = async () => 0;
export const canCreateEntryToday = async () => true;
export const canSyncToday = async () => false;
