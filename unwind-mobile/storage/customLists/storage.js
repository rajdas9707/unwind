import * as db from "./db";

// Predefined color palette
export const LIST_COLORS = [
  "#6BCB77", // Green (default)
  "#4D96FF", // Blue
  "#FF6B9D", // Pink
  "#FFA500", // Orange
  "#9D4EDD", // Purple
  "#06BCC1", // Teal
  "#EF4444", // Red
  "#F59E0B", // Amber
];

// Validate list data
const validateListData = (title, description = "", color = "#6BCB77") => {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new Error("List title is required and cannot be empty");
  }

  if (title.trim().length > 100) {
    throw new Error("List title must be less than 100 characters");
  }

  if (description && description.length > 500) {
    throw new Error("Description must be less than 500 characters");
  }

  // Validate color
  if (!LIST_COLORS.includes(color)) {
    color = "#6BCB77"; // Default color if invalid
  }

  return {
    title: title.trim(),
    description: description?.trim() || "",
    color,
  };
};

// Validate list item data
const validateItemData = (title, note = "") => {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new Error("Item title is required and cannot be empty");
  }

  if (title.trim().length > 200) {
    throw new Error("Item title must be less than 200 characters");
  }

  if (note && note.length > 500) {
    throw new Error("Note must be less than 500 characters");
  }

  return {
    title: title.trim(),
    note: note?.trim() || "",
  };
};

// ============= LIST OPERATIONS =============

// Create new custom list
export const createCustomList = async ({ title, description, color }) => {
  try {
    const validatedData = validateListData(title, description, color);
    const now = new Date().toISOString();

    const newList = await db.insertCustomList({
      title: validatedData.title,
      description: validatedData.description,
      color: validatedData.color,
      created_at: now,
      updated_at: now,
    });

    return newList;
  } catch (error) {
    console.error("Error creating custom list:", error);
    throw error;
  }
};

// Fetch all custom lists with item counts
export const fetchAllCustomLists = async () => {
  try {
    const lists = await db.getAllCustomLists();

    // Add item counts to each list
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        const totalItems = await db.getItemsCountForList(list.id);
        const doneItems = await db.getDoneItemsCountForList(list.id);
        return {
          ...list,
          totalItems,
          doneItems,
        };
      })
    );

    return listsWithCounts;
  } catch (error) {
    console.error("Error fetching all custom lists:", error);
    throw error;
  }
};

// Fetch custom list by ID with item counts
export const fetchCustomListById = async (id) => {
  try {
    const list = await db.getCustomListById(id);
    if (!list) return null;

    const totalItems = await db.getItemsCountForList(list.id);
    const doneItems = await db.getDoneItemsCountForList(list.id);

    return {
      ...list,
      totalItems,
      doneItems,
    };
  } catch (error) {
    console.error("Error fetching custom list by ID:", error);
    throw error;
  }
};

// Update custom list
export const updateCustomListData = async ({ id, title, description, color }) => {
  try {
    const validatedData = validateListData(title, description, color);
    const updatedAt = new Date().toISOString();

    const updatedList = await db.updateCustomList({
      id,
      title: validatedData.title,
      description: validatedData.description,
      color: validatedData.color,
      updated_at: updatedAt,
    });

    return updatedList;
  } catch (error) {
    console.error("Error updating custom list:", error);
    throw error;
  }
};

// Delete custom list
export const deleteCustomList = async (id) => {
  try {
    const result = await db.deleteCustomListById(id);
    return result;
  } catch (error) {
    console.error("Error deleting custom list:", error);
    throw error;
  }
};

// ============= LIST ITEM OPERATIONS =============

// Create new list item
export const createListItem = async ({ listId, title, note }) => {
  try {
    const validatedData = validateItemData(title, note);
    const now = new Date().toISOString();

    const newItem = await db.insertListItem({
      list_id: listId,
      title: validatedData.title,
      note: validatedData.note,
      status: "pending",
      created_at: now,
      updated_at: now,
    });

    return newItem;
  } catch (error) {
    console.error("Error creating list item:", error);
    throw error;
  }
};

// Fetch items for a list
export const fetchItemsForList = async (listId) => {
  try {
    const items = await db.getItemsByListId(listId);
    return items;
  } catch (error) {
    console.error("Error fetching items for list:", error);
    throw error;
  }
};

// Fetch list item by ID
export const fetchListItemById = async (id) => {
  try {
    const item = await db.getListItemById(id);
    return item;
  } catch (error) {
    console.error("Error fetching list item by ID:", error);
    throw error;
  }
};

// Update list item
export const updateListItemData = async ({ id, title, note, status }) => {
  try {
    const validatedData = validateItemData(title, note);
    const updatedAt = new Date().toISOString();

    const updatedItem = await db.updateListItem({
      id,
      title: validatedData.title,
      note: validatedData.note,
      status: status || "pending",
      updated_at: updatedAt,
    });

    return updatedItem;
  } catch (error) {
    console.error("Error updating list item:", error);
    throw error;
  }
};

// Toggle item status (done/pending)
export const toggleListItemStatus = async (id) => {
  try {
    const updatedAt = new Date().toISOString();
    const updatedItem = await db.toggleItemStatus(id, updatedAt);
    return updatedItem;
  } catch (error) {
    console.error("Error toggling list item status:", error);
    throw error;
  }
};

// Delete list item
export const deleteListItem = async (id) => {
  try {
    const result = await db.deleteListItemById(id);
    return result;
  } catch (error) {
    console.error("Error deleting list item:", error);
    throw error;
  }
};
