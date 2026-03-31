# Copilot Instructions – Todo App

## Project Overview

This is a **fully client-side Todo list application** built with **vanilla JavaScript, HTML and CSS**. There are no frameworks, no bundlers, no build steps and no server-side code. The app runs entirely in the browser and persists data using `localStorage`.

## Tech Stack

- **HTML5** – single page (`index.html`)
- **CSS3** – two stylesheets: `css/styles.css` (light theme + layout) and `css/dark-mode.css` (dark overrides)
- **Vanilla JavaScript (ES6+)** – four script files loaded via `<script>` tags (no ES modules, no `import`/`export`)
- **No npm dependencies** – `package.json` exists only for metadata; there is nothing to install or build

## Architecture & Module Pattern

Every JS file uses an **IIFE (Immediately Invoked Function Expression)** that returns a public API object (revealing module pattern). Each module is assigned to a global `const`:

| Global | File | Responsibility |
|--------|------|----------------|
| `utils` | `js/utils.js` | Pure helper functions (ID generation, date formatting, sorting, HTML escaping, debounce) |
| `storage` | `js/storage.js` | `localStorage` persistence, JSON import/export |
| `app` | `js/app.js` | Application state, business logic, CRUD operations, filters, sorting, theme |
| `ui` | `js/ui.js` | DOM rendering, event binding, notifications, modals, theme toggling |

### Script Load Order (critical)

Scripts are loaded in `index.html` in this exact order – **each module depends on the ones loaded before it**:

```
utils.js → storage.js → app.js → ui.js
```

- `utils` has no dependencies on other modules.
- `storage` uses only browser APIs (`localStorage`, `JSON`, `Blob`); it does not depend on other app modules.
- `app` calls `utils` and `storage` directly, and calls `ui` methods (e.g., `ui.render()`, `ui.showNotification()`).
- `ui` calls `utils` helpers and `app` methods (e.g., `app.addTask()`, `app.getFilteredTasks()`).

> **Note on `app` ↔ `ui` interaction:** Both modules reference each other, but this is not a circular import problem because IIFEs assign globals at load time and the cross-references are only invoked inside functions that run *after* all scripts have loaded (starting from `app.init()` on `DOMContentLoaded`).

**Never use `import`/`export` syntax or ES modules.** Always follow the existing IIFE pattern when adding or modifying JavaScript.

## Key Conventions

### JavaScript

- Use `const` for module declarations and values that don't change; use `let` for mutable state.
- Prefix private/internal functions with an underscore (e.g., `_persist()`).
- Always use `utils.escapeHtml()` when inserting user-provided text into the DOM to prevent XSS.
- Use JSDoc comments (`@typedef`, `@param`, `@returns`) for type documentation.
- Use `utils.generateId()` for creating unique task IDs.
- Use `utils.debounce()` for search input and similar high-frequency events.
- Date strings use `YYYY-MM-DD` format throughout the application.

### CSS

- Use CSS custom properties (variables) defined in `:root` for colors, spacing and typography.
- Dark mode overrides are in `css/dark-mode.css` and activated via `[data-theme="dark"]` on `<html>`.
- Use BEM-like naming where applicable (e.g., `.task-item`, `.task-item__title`, `.btn-primary`).
- The layout is responsive: mobile-first with flexbox/grid.

### HTML

- Use semantic HTML elements (`<header>`, `<main>`, `<footer>`, `<aside>`, `<section>`).
- All interactive elements must have `aria-*` attributes for accessibility.
- IDs on elements follow a `kebab-case` naming convention (e.g., `task-form`, `stat-total`).

## Data Model

A task object has this shape:

```js
{
  id: string,          // unique short ID (via utils.generateId)
  title: string,       // required, max 120 chars
  description: string, // optional, max 400 chars
  completed: boolean,
  priority: 'low' | 'medium' | 'high',
  category: string,    // defaults to 'General'
  dueDate: string,     // 'YYYY-MM-DD' or empty string
  createdAt: string,   // ISO 8601
  updatedAt: string    // ISO 8601
}
```

The full state persisted to `localStorage` (key: `todoAppData`) is:

```js
{ tasks: Task[], settings: { theme, sortBy, lastUpdated } }
```

## What NOT to Do

- **Do NOT add npm packages or external dependencies.** This is a zero-dependency project.
- **Do NOT use ES module syntax** (`import`/`export`). Use the existing IIFE pattern.
- **Do NOT add build tools** (webpack, Vite, esbuild, etc.). The app loads scripts directly.
- **Do NOT add TypeScript.** The project uses plain JavaScript with JSDoc for types.
- **Do NOT run `npm install`** – there are no dependencies to install.
- **Do NOT create unit tests** unless explicitly asked. There is no testing framework set up.
- **Do NOT use `innerHTML` with unsanitized user input.** Always escape with `utils.escapeHtml()`.

## How to Run

Open `index.html` in a browser, or use:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

There is no build step, no compilation, and no dev server configuration needed.
