# Custom Lists Feature Documentation

## 📂 File Structure

```
unwind-mobile/
├── app/
│   ├── lists.js                    # Main lists screen (All Lists)
│   └── lists/
│       ├── [id].js                 # Dynamic route for list details
│       └── create.js               # Create/Edit form (reusable)
└── storage/
    ├── customLists/
    │   ├── db.js                  # Database operations
    │   └── storage.js             # Business logic & validation
    ├── migrations/
    │   └── v8.js                  # Database schema migration
    ├── mainDb.js                  # Updated with v8 migration
    └── initTable.js               # Updated with customLists init
```

## 🎨 Screens

### 1. **app/lists.js** - All Lists Screen
- Root level screen (like `topic.js`)
- Displays all custom lists as colored cards
- Shows item count and progress for each list
- Edit & delete with confirmation
- Floating "+" button → `/lists/create`
- Tap on card → `/lists/[id]` with params

**Navigation:**
```javascript
// Open list details
router.push({
  pathname: "/lists/[id]",
  params: { id: list.id, listName: list.title, listColor: list.color }
});

// Create new list
router.push("/lists/create");
```

### 2. **app/lists/create.js** - Create/Edit Form
- Reusable for both create and edit modes
- Fields: Title (required), Color selector, Description (optional)
- 8 predefined colors with circular swatches
- Character counters (100 for title, 500 for description)
- Validates and saves to SQLite

**Usage:**
```javascript
// Create mode
router.push("/lists/create");

// Edit mode
router.push({
  pathname: "/lists/create",
  params: {
    listId: list.id,
    title: list.title,
    description: list.description,
    color: list.color
  }
});
```

### 3. **app/lists/[id].js** - List Details Screen
- Dynamic route pattern (like `topic/[id].js`)
- Shows all items in the list
- Add/edit/delete items with Title + Note + Status
- Status toggle (done/pending)
- Undo delete with animated snackbar (5 seconds)
- Pending items shown first, completed at bottom

**Route params:**
- `id` - List ID (required)
- `listName` - List name for header
- `listColor` - List color for theming

## 🎨 Color Palette

8 predefined colors in `storage/customLists/storage.js`:
```javascript
const LIST_COLORS = [
  "#6BCB77", // Green (default)
  "#4D96FF", // Blue
  "#FF6B9D", // Pink
  "#FFA500", // Orange
  "#9D4EDD", // Purple
  "#06BCC1", // Teal
  "#EF4444", // Red
  "#F59E0B", // Amber
];
```

## 💾 Database Schema

### custom_lists table
- `id` - INTEGER PRIMARY KEY
- `title` - TEXT (required)
- `description` - TEXT
- `color` - TEXT (default: #6BCB77)
- `created_at` - TEXT (ISO timestamp)
- `updated_at` - TEXT (ISO timestamp)
- `synced`, `server_id`, `server_meta` - Sync fields

### custom_list_items table
- `id` - INTEGER PRIMARY KEY
- `list_id` - INTEGER (FK to custom_lists, CASCADE DELETE)
- `title` - TEXT (required)
- `note` - TEXT
- `status` - TEXT (default: 'pending', values: 'pending' | 'done')
- `created_at` - TEXT (ISO timestamp)
- `updated_at` - TEXT (ISO timestamp)
- `synced`, `server_id`, `server_meta` - Sync fields

## 🔧 Key Features

✅ **Local SQLite storage** - No server required  
✅ **Cascade delete** - Deleting a list removes all items  
✅ **Undo delete** - 5-second window with animated snackbar  
✅ **Status toggle** - Done/pending with checkboxes  
✅ **Validation** - Title required, character limits enforced  
✅ **Color coding** - Visual organization with 8 colors  
✅ **Pull-to-refresh** - All screens support refresh  
✅ **Empty states** - Clean UI with helpful messages  
✅ **Expo Router** - File-based routing pattern  

## 📱 Usage Example

```javascript
// Import in your navigation or home screen
import { router } from "expo-router";

// Navigate to lists screen
router.push("/lists");

// Navigate directly to a specific list
router.push({
  pathname: "/lists/[id]",
  params: { id: 1, listName: "Shopping", listColor: "#6BCB77" }
});
```

## 🚀 API Functions

### Lists
```javascript
import {
  createCustomList,
  fetchAllCustomLists,
  fetchCustomListById,
  updateCustomListData,
  deleteCustomList,
  LIST_COLORS
} from "./storage/customLists/storage";

// Create a new list
await createCustomList({
  title: "My List",
  description: "Optional description",
  color: "#6BCB77"
});

// Get all lists with item counts
const lists = await fetchAllCustomLists();
// Returns: [{ id, title, description, color, totalItems, doneItems, ... }]
```

### Items
```javascript
import {
  createListItem,
  fetchItemsForList,
  updateListItemData,
  toggleListItemStatus,
  deleteListItem
} from "./storage/customLists/storage";

// Create item
await createListItem({
  listId: 1,
  title: "Item title",
  note: "Optional note"
});

// Get all items for a list
const items = await fetchItemsForList(1);

// Toggle status
await toggleListItemStatus(itemId);
```

## 🎯 Design Patterns

- **Functional components** with React hooks
- **Expo Router** for file-based navigation
- **SQLite** for local persistence
- **Async/await** for database operations
- **useCallback** with useFocusEffect for screen refresh
- **Animated API** for smooth snackbar transitions
- **Modal** components for create/edit forms
- **Pull-to-refresh** on all list screens

## 🔄 Data Flow

1. User opens `/lists` → Shows all lists from SQLite
2. User taps "+" → Navigate to `/lists/create`
3. User saves → Data stored in SQLite → Navigate back
4. User taps list card → Navigate to `/lists/[id]` with params
5. User manages items → CRUD operations on custom_list_items table
6. User deletes item → Shows undo snackbar for 5 seconds

---

**Built with:** React Native, Expo Router, SQLite, Expo Icons
