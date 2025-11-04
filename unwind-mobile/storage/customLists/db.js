import { openDB } from "../mainDb";

// Initialize custom lists tables
export const initCustomListsTable = async (db) => {
  try {
    // Tables are created via migrations
    console.log("✅ Custom lists database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing custom lists database:", error);
    throw error;
  }
};

// ============= CUSTOM LISTS OPERATIONS =============

// Create new custom list
export const insertCustomList = async ({ title, description, color, created_at, updated_at }) => {
  try {
    const db = await openDB();
    const result = await db.runAsync(
      "INSERT INTO custom_lists (title, description, color, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, 0)",
      [title, description || "", color, created_at, updated_at]
    );

    const newList = await db.getFirstAsync(
      "SELECT * FROM custom_lists WHERE id = ?",
      [result.lastInsertRowId]
    );

    return {
      ...newList,
      server_meta: newList.server_meta ? JSON.parse(newList.server_meta) : null,
    };
  } catch (error) {
    console.error("Error inserting custom list:", error);
    throw error;
  }
};

// Get all custom lists
export const getAllCustomLists = async () => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync(
      "SELECT * FROM custom_lists ORDER BY created_at DESC"
    );

    return rows.map((row) => ({
      ...row,
      synced: row.synced === 1,
      server_meta: row.server_meta ? JSON.parse(row.server_meta) : null,
    }));
  } catch (error) {
    console.error("Error getting all custom lists:", error);
    throw error;
  }
};

// Get custom list by ID
export const getCustomListById = async (id) => {
  try {
    const db = await openDB();
    const row = await db.getFirstAsync("SELECT * FROM custom_lists WHERE id = ?", [id]);

    if (!row) return null;

    return {
      ...row,
      synced: row.synced === 1,
      server_meta: row.server_meta ? JSON.parse(row.server_meta) : null,
    };
  } catch (error) {
    console.error("Error getting custom list by ID:", error);
    throw error;
  }
};

// Update custom list
export const updateCustomList = async ({ id, title, description, color, updated_at }) => {
  try {
    const db = await openDB();
    await db.runAsync(
      "UPDATE custom_lists SET title = ?, description = ?, color = ?, updated_at = ?, synced = 0 WHERE id = ?",
      [title, description || "", color, updated_at, id]
    );

    return await getCustomListById(id);
  } catch (error) {
    console.error("Error updating custom list:", error);
    throw error;
  }
};

// Delete custom list (cascade deletes all items)
export const deleteCustomListById = async (id) => {
  try {
    const db = await openDB();
    
    // First check if the list exists
    const existingList = await db.getFirstAsync("SELECT id FROM custom_lists WHERE id = ?", [id]);
    if (!existingList) {
      throw new Error("List not found in database");
    }
    
    // Delete the list (items will be cascade deleted)
    await db.runAsync("DELETE FROM custom_lists WHERE id = ?", [id]);
    
    return true;
  } catch (error) {
    console.error("Error deleting custom list:", error);
    throw error;
  }
};

// ============= LIST ITEMS OPERATIONS =============

// Create new list item
export const insertListItem = async ({ list_id, title, note, status, created_at, updated_at }) => {
  try {
    const db = await openDB();
    const result = await db.runAsync(
      "INSERT INTO custom_list_items (list_id, title, note, status, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [list_id, title, note || "", status, created_at, updated_at]
    );

    const newItem = await db.getFirstAsync(
      "SELECT * FROM custom_list_items WHERE id = ?",
      [result.lastInsertRowId]
    );

    return {
      ...newItem,
      server_meta: newItem.server_meta ? JSON.parse(newItem.server_meta) : null,
    };
  } catch (error) {
    console.error("Error inserting list item:", error);
    throw error;
  }
};

// Get all items for a list
export const getItemsByListId = async (listId) => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync(
      "SELECT * FROM custom_list_items WHERE list_id = ? ORDER BY created_at DESC",
      [listId]
    );

    return rows.map((row) => ({
      ...row,
      synced: row.synced === 1,
      server_meta: row.server_meta ? JSON.parse(row.server_meta) : null,
    }));
  } catch (error) {
    console.error("Error getting items by list ID:", error);
    throw error;
  }
};

// Get list item by ID
export const getListItemById = async (id) => {
  try {
    const db = await openDB();
    const row = await db.getFirstAsync("SELECT * FROM custom_list_items WHERE id = ?", [id]);

    if (!row) return null;

    return {
      ...row,
      synced: row.synced === 1,
      server_meta: row.server_meta ? JSON.parse(row.server_meta) : null,
    };
  } catch (error) {
    console.error("Error getting list item by ID:", error);
    throw error;
  }
};

// Update list item
export const updateListItem = async ({ id, title, note, status, updated_at }) => {
  try {
    const db = await openDB();
    await db.runAsync(
      "UPDATE custom_list_items SET title = ?, note = ?, status = ?, updated_at = ?, synced = 0 WHERE id = ?",
      [title, note || "", status, updated_at, id]
    );

    return await getListItemById(id);
  } catch (error) {
    console.error("Error updating list item:", error);
    throw error;
  }
};

// Toggle item status
export const toggleItemStatus = async (id, updated_at) => {
  try {
    const db = await openDB();
    const item = await getListItemById(id);
    if (!item) throw new Error("Item not found");

    const newStatus = item.status === "done" ? "pending" : "done";
    
    await db.runAsync(
      "UPDATE custom_list_items SET status = ?, updated_at = ?, synced = 0 WHERE id = ?",
      [newStatus, updated_at, id]
    );

    return await getListItemById(id);
  } catch (error) {
    console.error("Error toggling item status:", error);
    throw error;
  }
};

// Delete list item by ID
export const deleteListItemById = async (id) => {
  try {
    const db = await openDB();
    
    const existingItem = await db.getFirstAsync("SELECT id FROM custom_list_items WHERE id = ?", [id]);
    if (!existingItem) {
      throw new Error("Item not found in database");
    }
    
    await db.runAsync("DELETE FROM custom_list_items WHERE id = ?", [id]);
    
    return true;
  } catch (error) {
    console.error("Error deleting list item:", error);
    throw error;
  }
};

// Get items count for a list
export const getItemsCountForList = async (listId) => {
  try {
    const db = await openDB();
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM custom_list_items WHERE list_id = ?",
      [listId]
    );

    return result?.count || 0;
  } catch (error) {
    console.error("Error getting items count for list:", error);
    throw error;
  }
};

// Get done items count for a list
export const getDoneItemsCountForList = async (listId) => {
  try {
    const db = await openDB();
    const result = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM custom_list_items WHERE list_id = ? AND status = 'done'",
      [listId]
    );

    return result?.count || 0;
  } catch (error) {
    console.error("Error getting done items count for list:", error);
    throw error;
  }
};
