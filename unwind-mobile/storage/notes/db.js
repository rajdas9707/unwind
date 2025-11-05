import * as SQLite from "expo-sqlite";
import { openDB } from "../mainDb";

/**
 * Initialize the notes table in the database
 * Table structure:
 * - id: Primary key, auto-increment
 * - title: Note title (TEXT)
 * - content: Note content (TEXT)
 * - attachments: JSON array of attachments with {type: "image"|"pdf", uri: string} (TEXT)
 * - tags: Comma-separated tags (TEXT)
 * - createdAt: ISO timestamp (TEXT)
 * - updatedAt: ISO timestamp (TEXT)
 */
export const initNotesTable = async (db) => {
  try {
    // Create notes table with required schema
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        attachments TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Create indexes for faster queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_createdAt ON notes(createdAt);
      CREATE INDEX IF NOT EXISTS idx_notes_updatedAt ON notes(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
    `);

    console.log("✅ Notes database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing notes database:", error);
    throw error;
  }
};

/**
 * Insert a new note entry
 * @param {Object} params - Note parameters
 * @param {string} params.title - Note title
 * @param {string} params.content - Note content
 * @param {Array} params.attachments - Array of attachment objects [{type: "image"|"pdf", uri: string}]
 * @param {string} params.tags - Comma-separated tags
 * @returns {Object} The newly created note
 */
export const insertNote = async ({ title, content = "", attachments = [], tags = "" }) => {
  try {
    const db = await openDB();
    const now = new Date().toISOString();
    const attachmentsJson = JSON.stringify(attachments);

    const result = await db.runAsync(
      "INSERT INTO notes (title, content, attachments, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      [title, content, attachmentsJson, tags, now, now]
    );

    // Return the newly created entry
    const newEntry = await db.getFirstAsync(
      "SELECT * FROM notes WHERE id = ?",
      [result.lastInsertRowId]
    );

    return {
      ...newEntry,
      attachments: newEntry.attachments ? JSON.parse(newEntry.attachments) : [],
    };
  } catch (error) {
    console.error("Error inserting note:", error);
    throw error;
  }
};

/**
 * Get all notes sorted by creation date (newest first)
 * @param {number} limit - Maximum number of notes to return (optional)
 * @returns {Array} Array of notes
 */
export const getAllNotes = async (limit = null) => {
  try {
    const db = await openDB();
    const query = limit 
      ? "SELECT * FROM notes ORDER BY createdAt DESC LIMIT ?"
      : "SELECT * FROM notes ORDER BY createdAt DESC";
    
    const rows = limit 
      ? await db.getAllAsync(query, [limit])
      : await db.getAllAsync(query);

    return rows.map((row) => ({
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }));
  } catch (error) {
    console.error("Error getting all notes:", error);
    throw error;
  }
};

/**
 * Search notes by title, content, or tags
 * @param {string} searchQuery - Search query string
 * @returns {Array} Array of matching notes
 */
export const searchNotes = async (searchQuery) => {
  try {
    const db = await openDB();
    const searchPattern = `%${searchQuery}%`;
    
    const rows = await db.getAllAsync(
      `SELECT * FROM notes 
       WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? 
       ORDER BY createdAt DESC`,
      [searchPattern, searchPattern, searchPattern]
    );

    return rows.map((row) => ({
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }));
  } catch (error) {
    console.error("Error searching notes:", error);
    throw error;
  }
};

/**
 * Get a note by ID
 * @param {number} id - Note ID
 * @returns {Object|null} Note object or null if not found
 */
export const getNoteById = async (id) => {
  try {
    const db = await openDB();
    const row = await db.getFirstAsync("SELECT * FROM notes WHERE id = ?", [id]);

    if (!row) return null;

    return {
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
    };
  } catch (error) {
    console.error("Error getting note by ID:", error);
    throw error;
  }
};

/**
 * Update a note entry
 * @param {Object} params - Update parameters
 * @param {number} params.id - Note ID
 * @param {string} params.title - Updated title
 * @param {string} params.content - Updated content
 * @param {Array} params.attachments - Updated attachments array
 * @param {string} params.tags - Updated tags
 * @returns {Object} Updated note
 */
export const updateNote = async ({ id, title, content, attachments, tags }) => {
  try {
    const db = await openDB();
    const updatedAt = new Date().toISOString();
    const attachmentsJson = JSON.stringify(attachments);

    await db.runAsync(
      "UPDATE notes SET title = ?, content = ?, attachments = ?, tags = ?, updatedAt = ? WHERE id = ?",
      [title, content, attachmentsJson, tags, updatedAt, id]
    );

    return await getNoteById(id);
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};

/**
 * Delete a note by ID
 * @param {number} id - Note ID
 * @returns {boolean} True if deleted successfully
 */
export const deleteNoteById = async (id) => {
  try {
    const db = await openDB();
    await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
    return true;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

/**
 * Get notes by tag
 * @param {string} tag - Tag to filter by
 * @returns {Array} Array of notes with the specified tag
 */
export const getNotesByTag = async (tag) => {
  try {
    const db = await openDB();
    const searchPattern = `%${tag}%`;
    
    const rows = await db.getAllAsync(
      "SELECT * FROM notes WHERE tags LIKE ? ORDER BY createdAt DESC",
      [searchPattern]
    );

    return rows.map((row) => ({
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
    }));
  } catch (error) {
    console.error("Error getting notes by tag:", error);
    throw error;
  }
};

/**
 * Get count of all notes
 * @returns {number} Total number of notes
 */
export const getNotesCount = async () => {
  try {
    const db = await openDB();
    const result = await db.getFirstAsync("SELECT COUNT(*) as count FROM notes");
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting notes count:", error);
    throw error;
  }
};
