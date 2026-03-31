/**
 * storage.js – LocalStorage persistence + import/export
 */

const storage = (() => {
  const STORAGE_KEY = 'todoAppData';

  /** Save the full application state object to localStorage. */
  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('storage.save failed:', e);
    }
  }

  /**
   * Load the full application state from localStorage.
   * @returns {object|null}
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('storage.load failed:', e);
      return null;
    }
  }

  /** Remove all app data from localStorage. */
  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export the stored data as a downloadable JSON file.
   */
  function exportData() {
    const data = load();
    if (!data) {
      alert('No data to export.');
      return;
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from a JSON string, replacing current data.
   * @param {string} jsonString
   * @returns {object|null} parsed data, or null on error
   */
  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      // Basic schema validation
      if (!data || !Array.isArray(data.tasks)) {
        throw new Error('Invalid backup format: "tasks" array missing.');
      }
      save(data);
      return data;
    } catch (e) {
      console.error('storage.importData failed:', e);
      throw e;
    }
  }

  /** Low-level getItem wrapper */
  function getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /** Low-level setItem wrapper */
  function setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('storage.setItem failed:', e);
    }
  }

  /** Low-level removeItem wrapper */
  function removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('storage.removeItem failed:', e);
    }
  }

  return { save, load, clear, exportData, importData, getItem, setItem, removeItem };
})();
