# Todo App

A fully-featured, client-side To-Do list application built with **vanilla JavaScript, HTML and CSS** – no frameworks, no build step. Just open `index.html` and start managing your tasks.

---

## Features

- **Add, edit, delete** tasks with a single form
- **Mark tasks as completed** with an animated checkbox
- **Priorities** – Low, Medium, High (colour-coded border + badge)
- **Categories** – free-text category with autocomplete suggestions; filter by category
- **Due dates** with smart visual labels: *Overdue*, *Today*, *Soon*, *Upcoming*
- **Search** – instant, debounced full-text search across title, description and category
- **Filters** – by status (All / Active / Completed), priority and category
- **Sorting** – by newest, due date, priority or title
- **Statistics** – total, completed, overdue, completion %, breakdown by priority
- **Export / Import** – download or restore a JSON backup of all tasks
- **Auto-save** – every change is persisted to `localStorage` automatically
- **Dark mode** – toggle with the moon/sun icon; preference is saved across sessions
- **Offline support (PWA)** – core assets are cached by a service worker
- **Data hardening** – invalid/corrupted imported tasks are sanitized or discarded safely
- **Fully responsive** – mobile, tablet and desktop layouts

---

## Project Structure

```
todo-app/
├── index.html          # App shell & markup
├── css/
│   ├── styles.css      # Light theme, layout, components
│   └── dark-mode.css   # Dark theme overrides
├── js/
│   ├── utils.js        # Pure helpers (IDs, dates, sorting, escaping…)
│   ├── storage.js      # localStorage persistence + file import/export
│   ├── app.js          # State management & business logic
│   └── ui.js           # DOM rendering & event handling
├── package.json        # Project metadata
└── README.md
```

---

## Getting Started

### Option 1 – Open directly

```bash
git clone https://github.com/HP-PRODUCTION/todo-app.git
cd todo-app
open index.html        # macOS
# or xdg-open index.html   # Linux
# or just double-click the file in your file manager
```

### Option 2 – Local dev server (recommended)

```bash
# Python 3
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Usage

| Action | How |
|--------|-----|
| Add task | Fill in title (required) + optional fields → **Add Task** |
| Edit task | Click the ✏️ pencil icon → form pre-fills → **Update Task** |
| Delete task | Click the 🗑️ trash icon → confirm dialog |
| Complete task | Click the checkbox on the left |
| Search | Type in the search bar (live, debounced) |
| Filter | Use the sidebar buttons / category dropdown |
| Sort | Use the sort dropdown in the toolbar |
| Dark mode | Click the moon / sun icon in the header |
| Export JSON | **Export** button in the header |
| Import JSON | **Import** button in the header → select your `.json` backup |
| Delete all completed | **Delete Completed** button in the sidebar |

---

## LocalStorage Schema

```json
{
  "tasks": [
    {
      "id": "lqr3z9abc",
      "title": "Buy groceries",
      "description": "milk, eggs, bread",
      "completed": false,
      "priority": "high",
      "category": "Shopping",
      "dueDate": "2025-12-25",
      "createdAt": "2025-03-31T10:00:00.000Z",
      "updatedAt": "2025-03-31T10:00:00.000Z"
    }
  ],
  "settings": {
    "theme": "light",
    "sortBy": "createdAt",
    "lastUpdated": "2025-03-31T10:00:00.000Z"
  }
}
```

## Backup File Schema (Export)

```json
{
  "backupVersion": 1,
  "exportedAt": "2026-04-03T10:00:00.000Z",
  "data": {
    "tasks": [],
    "settings": {
      "theme": "light",
      "sortBy": "createdAt",
      "lastUpdated": "2026-04-03T10:00:00.000Z"
    }
  }
}
```

The importer accepts both this wrapped format and legacy raw `{ tasks, settings }` JSON backups.

---

## JavaScript API

### `app`

| Method | Description |
|--------|-------------|
| `app.init()` | Bootstrap the application |
| `app.addTask(title, desc, priority, category, dueDate)` | Create a new task |
| `app.updateTask(id, data)` | Partially update a task |
| `app.deleteTask(id)` | Remove a task |
| `app.toggleComplete(id)` | Flip completed state |
| `app.deleteCompleted()` | Remove all completed tasks |
| `app.getTasks()` | Return all tasks (unfiltered) |
| `app.getFilteredTasks()` | Return filtered + sorted tasks |
| `app.getStats()` | Return statistics object |
| `app.getCategories()` | Return sorted unique category list |
| `app.setFilter(key, value)` | Update a filter (status/priority/category/search) |
| `app.clearFilters()` | Reset all filters |
| `app.setSortBy(value)` | Change sort order |
| `app.toggleTheme()` | Switch dark/light mode |
| `app.exportBackup()` | Trigger JSON download |
| `app.importBackup(jsonString)` | Restore from JSON string |

### `storage`

| Method | Description |
|--------|-------------|
| `storage.save(data)` | Persist full state to localStorage |
| `storage.load()` | Load state from localStorage |
| `storage.clear()` | Remove all app data |
| `storage.exportData()` | Download data as `.json` file |
| `storage.importData(jsonString)` | Parse & save imported JSON |

### `utils`

| Method | Description |
|--------|-------------|
| `utils.generateId()` | Unique short ID |
| `utils.formatDate(str)` | `"YYYY-MM-DD"` → human-readable |
| `utils.getDueDateStatus(str)` | `'overdue'` / `'today'` / `'soon'` / `'upcoming'` |
| `utils.isOverdue(str)` | Boolean |
| `utils.getPriorityClass(priority)` | CSS class string |
| `utils.sortTasks(tasks, sortBy)` | Sorted copy of task array |
| `utils.debounce(fn, delay)` | Debounced wrapper |
| `utils.escapeHtml(str)` | XSS-safe HTML escaping |

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome (latest) | ✅ |
| Firefox (latest) | ✅ |
| Safari 14+ | ✅ |
| Edge (latest) | ✅ |
| Mobile Chrome | ✅ |
| Mobile Safari | ✅ |

---

## License

MIT
