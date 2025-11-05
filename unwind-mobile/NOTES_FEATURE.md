# Notes Feature Documentation

## Overview
The Notes feature is a comprehensive multimedia note-taking system integrated into your Expo React Native app. It allows users to create, edit, and manage notes with text content, images, and PDF attachments—all stored locally in SQLite for offline use.

## Features

### ✨ Core Functionality
- **Text Notes**: Rich text input with title, content, and tags
- **Multimedia Attachments**: 
  - 📷 Take photos with camera
  - 🖼️ Pick images from gallery (multiple selection)
  - 📄 Attach PDF documents
- **Search**: Full-text search across titles, content, and tags
- **Auto-save**: Automatic saving after 2 seconds of inactivity (edit mode only)
- **CRUD Operations**: Create, Read, Update, Delete notes
- **Offline-first**: All data stored locally in SQLite

### 📱 User Interface
- **NotesListScreen**: 
  - Clean card-based layout
  - Image thumbnails for notes with photos
  - PDF and image count indicators
  - Tag badges
  - Search bar with real-time filtering
  - Floating "+" button to create new notes
  - Pull-to-refresh
  
- **NoteEditorScreen**:
  - Large title input
  - Multiline content editor
  - Tag input with comma separation
  - Three attachment buttons (camera, gallery, document picker)
  - Visual attachment preview with remove option
  - Auto-save indicator
  - Delete button (for existing notes)
  - Confirmation dialogs before destructive actions

## File Structure

```
unwind-mobile/
├── storage/
│   └── notes/
│       └── db.js                    # Database operations (CRUD)
├── screens/
│   ├── NotesListScreen.js           # List all notes with search
│   └── NoteEditorScreen.js          # Create/edit notes with attachments
├── app/
│   ├── notes/
│   │   ├── index.js                 # Route: /notes (list)
│   │   └── [id].js                  # Route: /notes/:id (editor)
│   └── (tabs)/
│       └── index.js                 # Home - Notes quick action added
└── storage/
    └── initTable.js                 # Database initialization
```

## Database Schema

### `notes` Table
```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  attachments TEXT,              -- JSON: [{type: "image"|"pdf", uri: string, name?: string}]
  tags TEXT,                     -- Comma-separated
  createdAt TEXT NOT NULL,       -- ISO timestamp
  updatedAt TEXT NOT NULL        -- ISO timestamp
);

-- Indexes for performance
CREATE INDEX idx_notes_createdAt ON notes(createdAt);
CREATE INDEX idx_notes_updatedAt ON notes(updatedAt);
CREATE INDEX idx_notes_title ON notes(title);
```

## API Reference

### Database Functions (`storage/notes/db.js`)

#### `initNotesTable(db)`
Initialize the notes table with schema and indexes.

#### `insertNote({ title, content, attachments, tags })`
Create a new note. Returns the created note object.

#### `getAllNotes(limit?)`
Get all notes sorted by creation date (newest first).

#### `searchNotes(searchQuery)`
Search notes by title, content, or tags. Returns matching notes.

#### `getNoteById(id)`
Get a single note by ID.

#### `updateNote({ id, title, content, attachments, tags })`
Update an existing note. Returns the updated note.

#### `deleteNoteById(id)`
Delete a note by ID.

#### `getNotesByTag(tag)`
Filter notes by a specific tag.

#### `getNotesCount()`
Get total count of all notes.

## Usage

### Navigation
1. From Home screen → Tap "Notes" quick action
2. Notes List → Tap "+" button → Create new note
3. Notes List → Tap note card → Edit existing note

### Creating a Note
1. Enter a title (required)
2. Add content text (optional)
3. Add tags separated by commas (optional)
4. Attach multimedia:
   - **Take Photo**: Opens camera to capture new photo
   - **Add Image**: Select one or more images from gallery
   - **Attach PDF**: Pick PDF files from device storage
5. Tap checkmark (✓) in header to save

### Editing a Note
1. From Notes List, tap any note card
2. Make your changes
3. Changes auto-save after 2 seconds of inactivity
4. Or tap checkmark (✓) to save immediately

### Searching Notes
- Use the search bar at the top of Notes List
- Search matches title, content, and tags
- Results update in real-time as you type

### Deleting a Note
1. Open note in editor
2. Scroll to bottom
3. Tap "Delete Note" button
4. Confirm deletion

## Permissions Required

The app requests these permissions when needed:
- **Camera**: For taking photos
- **Media Library**: For selecting images from gallery
- **File System**: For accessing PDFs (granted by default on most devices)

## Tech Stack

- **React Native** with Expo SDK 54
- **expo-sqlite**: Local database
- **expo-image-picker**: Image selection and camera
- **expo-document-picker**: PDF file selection
- **expo-camera**: Camera permissions
- **expo-sharing**: PDF viewing/sharing
- **expo-router**: File-based navigation
- **@expo/vector-icons**: Ionicons
- **expo-linear-gradient**: UI gradients

## Design Patterns

### Auto-save
- Uses `useRef` timer to delay saves
- Only active when editing existing notes
- Clears previous timer on each keystroke
- 2-second debounce prevents excessive writes

### Attachment Storage
- Attachments stored as JSON in SQLite
- File URIs only (no file copying)
- Structure: `[{type: "image"|"pdf", uri: string, name?: string}]`

### Search Implementation
- Uses SQL `LIKE` operator for pattern matching
- Searches across multiple columns (title, content, tags)
- Case-insensitive matching

## Styling

The design follows your app's existing theme:
- **Colors**: Purple (#8B5CF6) primary, gray backgrounds
- **Typography**: Bold titles, medium body text
- **Cards**: Rounded corners (12px), subtle shadows
- **Spacing**: Consistent 16px padding
- **Icons**: Ionicons from @expo/vector-icons

## Future Enhancements

Potential additions:
- Rich text formatting
- Voice notes recording
- Note sharing/export
- Cloud sync
- Note categories/folders
- Reminders/due dates
- Collaborative notes
- Note templates
- Dark mode support

## Troubleshooting

### Images not showing
- Ensure media library permissions are granted
- Check that URIs are valid file paths

### PDFs not opening
- Verify expo-sharing is properly installed
- On some Android devices, ensure a PDF viewer is installed

### Database errors
- Check that `initNotesTable()` is called in `initTable.js`
- Verify database migrations are running correctly

## Testing

To test the feature:
```bash
cd unwind-mobile
npm start
# or
expo start --android
```

Then:
1. Navigate to Home → Notes
2. Create a note with all attachment types
3. Test search functionality
4. Verify auto-save works
5. Test delete functionality

## Maintenance

- Database version is managed by migration system in `storage/mainDb.js`
- No server-side sync (fully offline)
- Attachment files remain on device filesystem
- SQLite database backed up with app data

---

**Created**: 2025-11-05  
**Compatible with**: Expo SDK 54, React Native 0.81.4  
**Tested on**: Android with Expo Go
