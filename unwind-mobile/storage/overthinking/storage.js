import {
  createOverthinkingEntry,
  listOverthinkingEntries,
  updateOverthinkingEntry as updateOverthinkingEntryAPI,
  dumpOverthinkingEntry as dumpOverthinkingEntryAPI,
  deleteOverthinkingEntry as deleteOverthinkingEntryAPI,
} from '../../api/overthinking';

const getMoodEmoji = (thought) => {
  const lowerThought = (thought || '').toLowerCase();
  const anxiousWords = ['worry', 'anxious', 'nervous', 'stress', 'panic', 'fear', 'scared', 'overthink', 'spiral'];
  const reliefWords = ['calm', 'peace', 'better', 'solved', 'clear', 'understand', 'relief', 'resolved'];
  let anxiousCount = 0;
  let reliefCount = 0;
  anxiousWords.forEach((word) => { if (lowerThought.includes(word)) anxiousCount++; });
  reliefWords.forEach((word) => { if (lowerThought.includes(word)) reliefCount++; });
  if (reliefCount > anxiousCount) return '\U0001F60C';
  if (anxiousCount > reliefCount) return '\U0001F630';
  return '\U0001F914';
};

const normalizeEntry = (entry) => {
  const thought = entry.thought || '';
  return {
    id: entry._id, _id: entry._id, title: entry.title || '',
    thought, solution: entry.solution || '',
    created_at: entry.createdAt || entry.created_at || '',
    updated_at: entry.updatedAt || entry.updated_at || '',
    synced: true, server_id: entry._id,
    dumped: entry.dumped || false,
    mood: getMoodEmoji(thought),
    category: entry.category || null,
    intensity: entry.intensity || null,
    triggers: entry.triggers || [],
    patterns: entry.patterns || [],
    coping_strategies: entry.coping_strategies || [],
    reframe: entry.reframe || null,
    urgency: entry.urgency || null,
    tags: entry.tags || [], server_meta: null,
    truncatedThought: thought.length > 100 ? thought.substring(0, 100) + '...' : thought,
  };
};

export const createOverthinkingEntryLocal = async ({ title, thought, solution }) => {
  if (!thought || thought.trim().length === 0) {
    throw new Error('Overthinking thought is required and cannot be empty');
  }
  const entry = await createOverthinkingEntry({
    title: title?.trim() || '',
    thought: thought.trim(),
    solution: solution?.trim() || '',
    date: new Date().toISOString().split('T')[0],
    dumped: false,
  });
  return normalizeEntry(entry);
};

export const fetchRecentOverthinkingEntries = async (limit = 10) => {
  const response = await listOverthinkingEntries({ limit });
  const entries = response?.entries || (Array.isArray(response) ? response : []);
  return entries.map(normalizeEntry);
};

export const fetchOverthinkingByDate = async (date) => {
  const response = await listOverthinkingEntries({ date, limit: 50 });
  const entries = response?.entries || (Array.isArray(response) ? response : []);
  return entries.map(normalizeEntry);
};

export const fetchOverthinkingEntryById = async (id) => {
  try {
    const response = await listOverthinkingEntries({ limit: 200 });
    const entries = response?.entries || (Array.isArray(response) ? response : []);
    const entry = entries.find((e) => e._id === id);
    if (!entry) return null;
    return normalizeEntry(entry);
  } catch (error) { return null; }
};

export const updateOverthinkingEntryLocal = async ({ id, title, thought, solution }) => {
  if (!thought || thought.trim().length === 0) {
    throw new Error('Overthinking thought is required and cannot be empty');
  }
  const entry = await updateOverthinkingEntryAPI({
    id, thought: thought.trim(), solution: solution?.trim() || '', dumped: false,
  });
  return normalizeEntry(entry);
};

export const toggleOverthinkingDumpedLocal = async ({ id, dumped }) => {
  const entry = await dumpOverthinkingEntryAPI({ id });
  return normalizeEntry(entry);
};

export const deleteOverthinkingEntryLocal = async ({ entry }) => {
  await deleteOverthinkingEntryAPI({ id: entry.id || entry._id });
  return true;
};

export const getUnsyncedOverthinkingCount = async () => 0;
export const canCreateOverthinkingEntryToday = async () => true;
export const canSyncOverthinkingToday = async () => false;
