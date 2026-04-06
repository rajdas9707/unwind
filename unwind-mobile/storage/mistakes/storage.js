import {
  createMistakeEntry,
  listMistakesEntries,
  updateMistakeEntry as updateMistakeEntryAPI,
  deleteMistakeEntry as deleteMistakeEntryAPI,
} from '../../api/mistakes';

const MISTAKE_CATEGORIES = [
  'Work/Career', 'Relationships', 'Health', 'Finance',
  'Personal Growth', 'Communication', 'Time Management',
  'Decision Making', 'Other',
];

export const getMistakeCategories = () => MISTAKE_CATEGORIES;

export const getCategoryColor = (category) => {
  const colors = {
    'Work/Career': '#3B82F6', Relationships: '#EF4444', Health: '#10B981',
    Finance: '#F59E0B', 'Personal Growth': '#8B5CF6', Communication: '#06B6D4',
    'Time Management': '#84CC16', 'Decision Making': '#F97316', Other: '#6B7280',
  };
  return colors[category] || '#6B7280';
};

const getLearningEmoji = (category) => {
  const emojis = {
    'Work/Career': '\U0001F4BC', Relationships: '\U0001F49D', Health: '\U0001F3E5',
    Finance: '\U0001F4B0', 'Personal Growth': '\U0001F331', Communication: '\U0001F4AC',
    'Time Management': '\u23F0', 'Decision Making': '\U0001F914', Other: '\U0001F4DA',
  };
  return emojis[category] || '\U0001F4DA';
};

export const getCategoryEmoji = (category) => getLearningEmoji(category);

const normalizeEntry = (entry) => {
  const description = entry.description || entry.mistake || '';
  const category = entry.category || 'Other';
  return {
    id: entry._id, _id: entry._id, title: entry.title || '',
    mistake: description, description,
    solution: entry.learning || entry.solution || '',
    learning: getLearningEmoji(category), category,
    created_at: entry.createdAt || entry.created_at || '',
    updated_at: entry.updatedAt || entry.updated_at || '',
    synced: true, server_id: entry._id, avoided: false,
    intensity: entry.intensity || null,
    prevention_strategies: entry.prevention_strategies || [],
    root_causes: entry.root_causes || [], next_steps: entry.next_steps || [],
    tags: entry.tags || [], server_meta: null,
    truncatedDescription:
      description.length > 80 ? description.substring(0, 80) + '...' : description,
  };
};

export const createMistakeEntryLocal = async ({ description, lesson, category }) => {
  if (!description || description.trim().length === 0) {
    throw new Error('Mistake description is required and cannot be empty');
  }
  const validCategory = MISTAKE_CATEGORIES.includes(category) ? category : 'Other';
  const entry = await createMistakeEntry({
    description: description.trim(), category: validCategory, learning: lesson?.trim() || '',
  });
  return normalizeEntry(entry);
};

export const fetchRecentMistakesEntries = async (limit = 10) => {
  const response = await listMistakesEntries({ limit });
  const entries = response?.entries || (Array.isArray(response) ? response : []);
  return entries.map(normalizeEntry);
};

export const fetchMistakesByDate = async (date) => {
  const response = await listMistakesEntries({ date, limit: 50 });
  const entries = response?.entries || (Array.isArray(response) ? response : []);
  return entries.map(normalizeEntry);
};

export const fetchMistakesEntryById = async (id) => {
  try {
    const response = await listMistakesEntries({ limit: 200 });
    const entries = response?.entries || (Array.isArray(response) ? response : []);
    const entry = entries.find((e) => e._id === id);
    if (!entry) return null;
    return normalizeEntry(entry);
  } catch (error) { return null; }
};

export const updateMistakesEntryLocal = async ({ id, title, mistake, solution, category }) => {
  const entry = await updateMistakeEntryAPI({
    id, description: mistake || '',
    category: MISTAKE_CATEGORIES.includes(category) ? category : 'Other',
    learning: solution || '',
  });
  return normalizeEntry(entry);
};

export const toggleMistakesAvoidedLocal = async ({ id, avoided }) => ({ id, avoided });

export const deleteMistakesEntryLocal = async ({ entry }) => {
  await deleteMistakeEntryAPI({ id: entry.id || entry._id });
  return true;
};

export const getUnsyncedMistakesCount = async () => 0;
export const canCreateMistakeEntryToday = async () => true;
export const canSyncMistakesToday = async () => false;
