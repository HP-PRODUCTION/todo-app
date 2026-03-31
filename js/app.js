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

  // ── Persistence helpers ────────────────────────────────────────────────
  function _persist() {
    settings.lastUpdated = new Date().toISOString();
    storage.save({ tasks, settings });
  }

  // ── Initialisation ─────────────────────────────────────────────────────
  function init() {
    const saved = storage.load();
    if (saved) {
      tasks = Array.isArray(saved.tasks) ? saved.tasks : [];
      settings = Object.assign({ theme: 'light', sortBy: 'createdAt', lastUpdated: null }, saved.settings || {});
    }
    ui.init();
    ui.applyTheme(settings.theme);
    ui.render();
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
    const task = {
      id: utils.generateId(),
      title: title.trim(),
      description: (description || '').trim(),
      completed: false,
      priority: priority || 'medium',
      category: (category || 'General').trim(),
      dueDate: dueDate || '',
      createdAt: now,
      updatedAt: now
    };
    tasks.unshift(task);
    _persist();
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
    tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
    _persist();
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
    _persist();
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
    _persist();
    ui.render();
  }

  /** Delete all completed tasks */
  function deleteCompleted() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) { ui.showNotification('No completed tasks to delete.', 'info'); return; }
    tasks = tasks.filter(t => !t.completed);
    _persist();
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
    filters[key] = value;
    ui.render();
  }

  function getFilters() { return { ...filters }; }

  function clearFilters() {
    filters = { status: 'all', priority: 'all', category: 'all', search: '' };
    ui.render();
  }

  function setSortBy(value) {
    settings.sortBy = value;
    _persist();
    ui.render();
  }

  function getSortBy() { return settings.sortBy; }

  // ── Theme ──────────────────────────────────────────────────────────────
  function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    ui.applyTheme(settings.theme);
    _persist();
  }

  function getTheme() { return settings.theme; }

  // ── Import / Export ────────────────────────────────────────────────────
  function exportBackup() { storage.exportData(); }

  function importBackup(jsonString) {
    const data = storage.importData(jsonString);
    tasks = Array.isArray(data.tasks) ? data.tasks : [];
    settings = Object.assign({ theme: 'light', sortBy: 'createdAt', lastUpdated: null }, data.settings || {});
    ui.applyTheme(settings.theme);
    ui.render();
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
