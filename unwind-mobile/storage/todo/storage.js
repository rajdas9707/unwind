import {
  createTodo,
  listTodos,
  updateTodo,
  deleteTodo,
} from '../../api/todos';

const TODO_CATEGORIES = ['2-Minute', 'Urgent', 'Important', 'Low Energy'];

export const getTodoCategories = () => TODO_CATEGORIES;

export const getCategoryColor = (category) => {
  const colors = {
    '2-Minute': '#10B981', Urgent: '#EF4444', Important: '#8B5CF6', 'Low Energy': '#3B82F6',
  };
  return colors[category] || '#10B981';
};

const getPriorityEmoji = (priority) => {
  const emojis = { low: '\U0001F7E2', medium: '\U0001F7E1', high: '\U0001F534' };
  return emojis[priority] || '\U0001F7E1';
};

export const getCategoryEmoji = (category) => {
  const emojis = {
    '2-Minute': '\u26A1', Urgent: '\U0001F6A8', Important: '\u2B50', 'Low Energy': '\U0001F634',
  };
  return emojis[category] || '\u26A1';
};

const normalizeEntry = (entry) => ({
  id: entry._id, _id: entry._id,
  title: entry.title || '', description: entry.description || '',
  category: entry.category || '2-Minute', priority: entry.priority || 'medium',
  completed: entry.completed || false,
  due_date: entry.dueDate || entry.due_date || null,
  created_at: entry.createdAt || entry.created_at || '',
  updated_at: entry.updatedAt || entry.updated_at || '',
  synced: true, server_id: entry._id, server_meta: null,
  priorityEmoji: getPriorityEmoji(entry.priority || 'medium'),
  categoryEmoji: getCategoryEmoji(entry.category || '2-Minute'),
  truncatedTitle: (entry.title || '').length > 50
    ? entry.title.substring(0, 50) + '...' : entry.title || '',
});

export const createTodoEntryLocal = async ({ title, description, category, priority }) => {
  if (!title || title.trim().length === 0) {
    throw new Error('Todo title is required and cannot be empty');
  }
  const validCategory = TODO_CATEGORIES.includes(category) ? category : '2-Minute';
  const entry = await createTodo({
    title: title.trim(), description: description?.trim() || '',
    category: validCategory, priority: priority || 'medium',
  });
  return normalizeEntry(entry);
};

export const fetchTodosByCategory = async (category) => {
  try {
    const response = await listTodos({ category, limit: 100 });
    const entries = response?.todos || response?.entries || (Array.isArray(response) ? response : []);
    return entries.map(normalizeEntry);
  } catch (error) {
    console.error('Error fetching todos by category:', error);
    throw error;
  }
};

export const fetchRecentTodoEntries = async (limit = 10) => {
  try {
    const response = await listTodos({ limit });
    const entries = response?.todos || response?.entries || (Array.isArray(response) ? response : []);
    return entries.map(normalizeEntry);
  } catch (error) {
    console.error('Error fetching recent todos:', error);
    throw error;
  }
};

// Carried-over todos not supported in backend-only mode
export const fetchCarriedOverTodosByCategory = async (category) => [];

export const fetchTodoEntryById = async (id) => {
  try {
    const response = await listTodos({ limit: 200 });
    const entries = response?.todos || response?.entries || (Array.isArray(response) ? response : []);
    const entry = entries.find((e) => e._id === id);
    if (!entry) return null;
    return normalizeEntry(entry);
  } catch (error) { return null; }
};

export const updateTodoEntryLocal = async ({ id, title, description, category, priority }) => {
  if (!title || title.trim().length === 0) {
    throw new Error('Todo title is required and cannot be empty');
  }
  const entry = await updateTodo({
    id, title: title.trim(), description: description?.trim() || '',
    category: TODO_CATEGORIES.includes(category) ? category : '2-Minute',
    priority: priority || 'medium',
  });
  return normalizeEntry(entry);
};

export const toggleTodoCompleteLocal = async ({ id, completed }) => {
  const entry = await updateTodo({ id, completed });
  return normalizeEntry(entry);
};

// No-op for carried-over in backend-only mode
export const toggleCarriedOverCompleteLocal = async ({ id, completed }) => ({ id, completed });

export const deleteTodoEntryLocal = async (id) => {
  await deleteTodo({ id });
  return true;
};

// Move to carried over not supported - no action taken
export const moveTaskToCarriedOverLocal = async (taskId) => null;

export const performDailyCleanupLocal = async () => 0;

export const getUnsyncedTodoCount = async () => 0;
export const canCreateTodoToday = async () => true;
export const canSyncTodosToday = async () => false;
