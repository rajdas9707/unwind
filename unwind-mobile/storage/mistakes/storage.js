import * as db from "./db";

// Business logic and validation layer for mistakes entries

// Predefined categories
// Predefined categories for mistakes
const MISTAKE_CATEGORIES = [
  "Work/Career",
  "Relationships",
  "Health",
  "Finance",
  "Personal Growth",
  "Communication",
  "Time Management",
  "Decision Making",
  "Other",
];

// Helper function to get all available categories
export const getMistakeCategories = () => {
  return MISTAKE_CATEGORIES;
};

// Validate mistakes entry content
const validateMistakesEntry = (
  description,
  lesson,
  title = "",
  category = "Other"
) => {
  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    throw new Error("Mistake description is required and cannot be empty");
  }

  // Lesson is optional
  if (lesson && typeof lesson !== "string") {
    lesson = "";
  }

  if (description.trim().length > 3000) {
    throw new Error("Mistake description must be less than 3000 characters");
  }

  if (lesson && lesson.trim().length > 3000) {
    throw new Error("Lesson must be less than 3000 characters");
  }

  if (title && title.length > 200) {
    throw new Error("Title must be less than 200 characters");
  }

  // Validate category
  if (!MISTAKE_CATEGORIES.includes(category)) {
    category = "Other"; // Default to Other if invalid
  }

  return {
    title: title?.trim() || "",
    mistake: description.trim(),
    solution: lesson?.trim() || "",
    category,
  };
};

// Get category color
export const getCategoryColor = (category) => {
  const colors = {
    "Work/Career": "#3B82F6",
    Relationships: "#EF4444",
    Health: "#10B981",
    Finance: "#F59E0B",
    "Personal Growth": "#8B5CF6",
    Communication: "#06B6D4",
    "Time Management": "#84CC16",
    "Decision Making": "#F97316",
    Other: "#6B7280",
  };
  return colors[category] || "#6B7280";
};

// Get learning emoji based on category
const getLearningEmoji = (category) => {
  const emojis = {
    "Work/Career": "💼",
    Relationships: "💝",
    Health: "🏥",
    Finance: "💰",
    "Personal Growth": "🌱",
    Communication: "💬",
    "Time Management": "⏰",
    "Decision Making": "🤔",
    Other: "📚",
  };
  return emojis[category] || "📚";
};

// Get category emoji for UI display
export const getCategoryEmoji = (category) => {
  return getLearningEmoji(category);
};

// Create new mistakes entry with validation and rate limiting
export const createMistakeEntryLocal = async ({
  description,
  lesson,
  category,
}) => {
  try {
    // Validate input
    const validatedData = validateMistakesEntry(
      description,
      lesson,
      "",
      category
    );

    // Check daily limit (3 mistakes per day - encourage learning, not dwelling)
    const today = new Date().toISOString().split("T")[0];
    const todayCount = await db.getMistakesEntriesCountForDate(today);

    // if (todayCount >= 3) {
    //   throw new Error(
    //     "You can only log 3 mistakes per day. Focus on learning from what you've already identified!"
    //   );
    // }

    // Create timestamps
    const now = new Date().toISOString();

    // Insert locally first
    const localEntry = await db.insertMistakesEntry({
      title: validatedData.title,
      mistake: validatedData.mistake,
      solution: validatedData.solution,
      category: validatedData.category,
      created_at: now,
      updated_at: now,
    });

    return {
      ...localEntry,
      learning: getLearningEmoji(validatedData.category),
    };
  } catch (error) {
    console.error("Error creating mistakes entry:", error);
    throw error;
  }
};



// Fetch recent mistakes entries with learning emojis
export const fetchRecentMistakesEntries = async (limit = 10, signal) => {
  const entries = await db.getRecentMistakesEntries(limit);

  return entries.map((entry) => ({
    ...entry,
    learning: getLearningEmoji(entry.category),
    truncatedDescription:
      entry.description && entry.description.length > 80
        ? entry.description.substring(0, 80) + "..."
        : entry.description || "",
  }));
};

// Fetch mistakes entries by date with learning emojis
export const fetchMistakesByDate = async (date, signal) => {
  const entries = await db.getMistakesEntriesByDate(date);

  return entries.map((entry) => ({
    ...entry,
    learning: getLearningEmoji(entry.category),
    truncatedDescription:
      entry.description && entry.description.length > 80
        ? entry.description.substring(0, 80) + "..."
        : entry.description || "",
  }));
};

// Get single mistakes entry by ID
export const fetchMistakesEntryById = async (id) => {
  const entry = await db.getMistakesEntryById(id);

  if (!entry) return null;

  return {
    ...entry,
    learning: getLearningEmoji(entry.category),
  };
};

// Update mistakes entry with validation
export const updateMistakesEntryLocal = async ({
  id,
  title,
  mistake,
  solution,
  category,
}) => {
  // Validate input
  const validatedData = validateMistakesEntry(
    mistake,
    solution,
    title,
    category
  );

  const updatedEntry = await db.updateMistakesEntry({
    id,
    title: validatedData.title,
    mistake: validatedData.mistake,
    solution: validatedData.solution,
    category: validatedData.category,
    updated_at: new Date().toISOString(),
  });

  return {
    ...updatedEntry,
    learning: getLearningEmoji(validatedData.category),
  };
};

// Toggle avoided status for mistakes entry
export const toggleMistakesAvoidedLocal = async ({ id, avoided }) => {
  const updatedEntry = await db.toggleMistakesAvoided({ id, avoided });

  return {
    ...updatedEntry,
    learning: getLearningEmoji(updatedEntry.category),
  };
};

// Delete mistakes entry locally only
export const deleteMistakesEntryLocal = async ({ entry }) => {
  // Delete from local database only
  await db.deleteMistakesEntryById(entry.id);
  return true;
};

// Get unsynced entries count
export const getUnsyncedMistakesCount = async () => {
  const unsyncedEntries = await db.getUnsyncedMistakesEntries();
  return unsyncedEntries.length;
};

// Check if user can create more entries today
export const canCreateMistakeEntryToday = async () => {
  const today = new Date().toISOString().split("T")[0];
  const todayCount = await db.getMistakesEntriesCountForDate(today);
  return todayCount < 3;
};

// Check if user can sync today
export const canSyncMistakesToday = async () => {
  const todaySyncCount = await db.getMistakesSyncAttemptsCountToday();
  return todaySyncCount < 3;
};
