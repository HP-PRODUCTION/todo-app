/**
 * utils.js – Utility / helper functions
 */

const utils = (() => {

  /** Generate a unique ID based on timestamp + random suffix */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Format an ISO date string (YYYY-MM-DD) to a locale-friendly display string.
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Return a due-date status label: 'overdue' | 'today' | 'soon' | 'upcoming' | ''
   * @param {string} dueDateStr  YYYY-MM-DD
   * @returns {string}
   */
  function getDueDateStatus(dueDateStr) {
    if (!dueDateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    const diff = Math.round((due - today) / 86400000); // days
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 3) return 'soon';
    return 'upcoming';
  }

  /**
   * Check if a due date is in the past (overdue).
   * @param {string} dueDateStr
   * @returns {boolean}
   */
  function isOverdue(dueDateStr) {
    return getDueDateStatus(dueDateStr) === 'overdue';
  }

  /**
   * Return the CSS utility class for a priority value.
   * @param {'low'|'medium'|'high'} priority
   * @returns {string}
   */
  function getPriorityClass(priority) {
    const map = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high' };
    return map[priority] || '';
  }

  /**
   * Sort an array of tasks without mutating the original.
   * @param {Task[]} tasks
   * @param {'dueDate'|'priority'|'createdAt'|'title'} sortBy
   * @returns {Task[]}
   */
  function sortTasks(tasks, sortBy) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const copy = [...tasks];
    switch (sortBy) {
      case 'priority':
        return copy.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
      case 'dueDate':
        return copy.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
      case 'title':
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case 'createdAt':
      default:
        return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  /**
   * Debounce a function.
   * @param {Function} fn
   * @param {number} delay  milliseconds
   * @returns {Function}
   */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Clamp a number between min and max.
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  return { generateId, formatDate, getDueDateStatus, isOverdue, getPriorityClass, sortTasks, debounce, escapeHtml, clamp };
})();
