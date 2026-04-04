/**
 * app.js – Core application state and business logic
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   completed: boolean,
 *   priority: 'low'|'medium'|'high',
 *   category: string,
 *   dueDate: string,
 *   createdAt: string,
 *   updatedAt: string
 * }} Task
 */

const app = (() => {
  const MAX_TASKS = 5000;

  // ── State ──────────────────────────────────────────────────────────────
  let tasks = [];
  let settings = {
    theme: 'light',
    sortBy: 'createdAt',
    lastUpdated: null
  };
  let filters = {
    status: 'all',      // 'all' | 'active' | 'completed'
    priority: 'all',    // 'all' | 'low' | 'medium' | 'high'
    category: 'all',
    search: ''
  };

  // ── Validation helpers ─────────────────────────────────────────────────
  function _isValidDate(dateStr) {
    if (!dateStr) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function _normalizeText(value, maxLen, fallback = '') {
    const text = String(value ?? '').trim();
    if (!text) return fallback;
    return text.slice(0, maxLen);
  }

  function _normalizePriority(value) {
    return ['low', 'medium', 'high'].includes(value) ? value : 'medium';
  }

  function _normalizeSortBy(value) {
    return ['createdAt', 'dueDate', 'priority', 'title'].includes(value) ? value : 'createdAt';
  }

  function _normalizeTheme(value) {
    return value === 'dark' ? 'dark' : 'light';
  }

  /**
   * Normalize and validate a task object.
   * @param {Partial<Task>} raw
   * @param {string} fallbackCreatedAt
   * @returns {Task|null}
   */
  function _normalizeTask(raw, fallbackCreatedAt = new Date().toISOString()) {
    const title = _normalizeText(raw && raw.title, 120);
    if (!title) return null;

    const createdAt = typeof raw?.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))
      ? raw.createdAt
      : fallbackCreatedAt;

    const updatedAt = typeof raw?.updatedAt === 'string' && !Number.isNaN(Date.parse(raw.updatedAt))
      ? raw.updatedAt
      : createdAt;

    return {
      id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : utils.generateId(),
      title,
      description: _normalizeText(raw && raw.description, 400),
      completed: Boolean(raw && raw.completed),
      priority: _normalizePriority(raw && raw.priority),
      category: _normalizeText(raw && raw.category, 40, 'General'),
      dueDate: _isValidDate(raw && raw.dueDate) ? raw.dueDate : '',
      createdAt,
      updatedAt
    };
  }

  function _normalizeState(rawState) {
    const source = rawState && typeof rawState === 'object' ? rawState : {};
    const incomingTasks = Array.isArray(source.tasks) ? source.tasks : [];
    const warnings = [];
    const seenIds = new Set();

    const normalizedTasks = [];
    let changed = !Array.isArray(source.tasks);

    for (let i = 0; i < incomingTasks.length && normalizedTasks.length < MAX_TASKS; i++) {
      const normalizedTask = _normalizeTask(incomingTasks[i]);
      if (!normalizedTask) {
        changed = true;
        continue;
      }

      if (seenIds.has(normalizedTask.id)) {
        normalizedTask.id = utils.generateId();
        changed = true;
      }
      seenIds.add(normalizedTask.id);
      normalizedTasks.push(normalizedTask);
    }

    if (incomingTasks.length > MAX_TASKS) {
      warnings.push('Task list exceeded supported size and was truncated.');
      changed = true;
    }

    if (normalizedTasks.length !== incomingTasks.length) {
      warnings.push('Some invalid tasks were removed while loading data.');
    }

    const incomingSettings = source.settings && typeof source.settings === 'object' ? source.settings : {};
    const normalizedSettings = {
      theme: _normalizeTheme(incomingSettings.theme),
      sortBy: _normalizeSortBy(incomingSettings.sortBy),
      lastUpdated: typeof incomingSettings.lastUpdated === 'string' ? incomingSettings.lastUpdated : null
    };

    if (!source.settings) changed = true;

    return { tasks: normalizedTasks, settings: normalizedSettings, warnings, changed };
  }

  // ── Persistence helpers ────────────────────────────────────────────────
  function _persist(showError = true) {
    settings.lastUpdated = new Date().toISOString();
    const ok = storage.save({ tasks, settings });
    if (!ok && showError && typeof ui !== 'undefined' && ui.showNotification) {
      ui.showNotification('Could not save changes. Storage may be full.', 'error');
    }
    return ok;
  }

  // ── Initialisation ─────────────────────────────────────────────────────
  function init() {
    const normalized = _normalizeState(storage.load());
    tasks = normalized.tasks;
    settings = normalized.settings;

    ui.init();
    ui.applyTheme(settings.theme);
    ui.render();

    if (normalized.changed) _persist(false);
    if (normalized.warnings.length > 0) {
      ui.showNotification(normalized.warnings[0], 'info');
    }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────
  /**
   * Add a new task.
   * @param {string} title
   * @param {string} description
   * @param {'low'|'medium'|'high'} priority
   * @param {string} category
   * @param {string} dueDate  YYYY-MM-DD
   * @returns {Task}
   */
  function addTask(title, description, priority, category, dueDate) {
    const now = new Date().toISOString();
    const task = _normalizeTask({
      id: utils.generateId(),
      title,
      description,
      completed: false,
      priority,
      category,
      dueDate,
      createdAt: now,
      updatedAt: now
    }, now);

    if (!task) {
      ui.showNotification('Title is required to add a task.', 'error');
      return null;
    }

    tasks.unshift(task);
    _persist(true);
    ui.render();
    ui.showNotification('Task added!', 'success');
    return task;
  }

  /**
   * Update an existing task.
   * @param {string} id
   * @param {Partial<Task>} data
   * @returns {Task|null}
   */
  function updateTask(id, data) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const nextTask = _normalizeTask(
      { ...tasks[idx], ...data, updatedAt: new Date().toISOString() },
      tasks[idx].createdAt
    );

    if (!nextTask) {
      ui.showNotification('Invalid task update.', 'error');
      return null;
    }

    tasks[idx] = nextTask;
    _persist(true);
    ui.render();
    ui.showNotification('Task updated!', 'success');
    return tasks[idx];
  }

  /**
   * Delete a task by id.
   * @param {string} id
   */
  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks.splice(idx, 1);
    _persist(true);
    ui.render();
    ui.showNotification('Task deleted.', 'info');
  }

  /**
   * Toggle the completed state of a task.
   * @param {string} id
   */
  function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    _persist(true);
    ui.render();
  }

  /** Delete all completed tasks */
  function deleteCompleted() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) { ui.showNotification('No completed tasks to delete.', 'info'); return; }
    tasks = tasks.filter(t => !t.completed);
    _persist(true);
    ui.render();
    ui.showNotification(`Deleted ${count} completed task(s).`, 'info');
  }

  // ── Queries ────────────────────────────────────────────────────────────
  function getTasks() { return [...tasks]; }

  function getFilteredTasks() {
    let result = [...tasks];

    if (filters.status === 'active')    result = result.filter(t => !t.completed);
    if (filters.status === 'completed') result = result.filter(t => t.completed);
    if (filters.priority !== 'all')     result = result.filter(t => t.priority === filters.priority);
    if (filters.category !== 'all')     result = result.filter(t => t.category === filters.category);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    return utils.sortTasks(result, settings.sortBy);
  }

  /**
   * Return statistics about all tasks.
   */
  function getStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const overdue = tasks.filter(t => !t.completed && utils.isOverdue(t.dueDate)).length;

    const byPriority = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => { if (byPriority[t.priority] !== undefined) byPriority[t.priority]++; });

    const byCategory = {};
    tasks.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });

    return { total, completed, active, pct, overdue, byPriority, byCategory };
  }

  /** Get unique categories from current tasks */
  function getCategories() {
    return [...new Set(tasks.map(t => t.category).filter(Boolean))].sort();
  }

  // ── Filters & sorting ──────────────────────────────────────────────────
  function setFilter(key, value) {
    if (!Object.prototype.hasOwnProperty.call(filters, key)) return;
    filters[key] = value;
    ui.render();
  }

  function getFilters() { return { ...filters }; }

  function clearFilters() {
    filters = { status: 'all', priority: 'all', category: 'all', search: '' };
    ui.render();
  }

  function setSortBy(value) {
    settings.sortBy = _normalizeSortBy(value);
    _persist(true);
    ui.render();
  }

  function getSortBy() { return settings.sortBy; }

  // ── Theme ──────────────────────────────────────────────────────────────
  function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    ui.applyTheme(settings.theme);
    _persist(true);
  }

  function getTheme() { return settings.theme; }

  // ── Import / Export ────────────────────────────────────────────────────
  function exportBackup() { storage.exportData({ tasks, settings }); }

  function importBackup(jsonString) {
    const imported = storage.importData(jsonString);
    const normalized = _normalizeState(imported);

    tasks = normalized.tasks;
    settings = normalized.settings;

    _persist(true);
    ui.applyTheme(settings.theme);
    ui.render();
    if (normalized.warnings.length > 0) {
      ui.showNotification(normalized.warnings[0], 'info');
      return;
    }
    ui.showNotification('Backup imported successfully!', 'success');
  }

  return {
    init,
    addTask, updateTask, deleteTask, toggleComplete, deleteCompleted,
    getTasks, getFilteredTasks, getStats, getCategories,
    setFilter, getFilters, clearFilters, setSortBy, getSortBy,
    toggleTheme, getTheme,
    exportBackup, importBackup
  };
})();
