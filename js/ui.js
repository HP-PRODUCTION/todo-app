/**
 * ui.js – DOM rendering, event binding and UI helpers
 */

const ui = (() => {
  // ── DOM references (populated in init) ────────────────────────────────
  let els = {};

  // ── Notification timer ─────────────────────────────────────────────────
  let notifTimer = null;

  // ── Edit state ────────────────────────────────────────────────────────
  let editingId = null;

  // ══════════════════════════════════════════════════════════════════════
  //  init – wire up every interactive element
  // ══════════════════════════════════════════════════════════════════════
  function init() {
    els = {
      // Form
      taskForm:       document.getElementById('task-form'),
      titleInput:     document.getElementById('task-title'),
      descInput:      document.getElementById('task-desc'),
      prioritySelect: document.getElementById('task-priority'),
      categoryInput:  document.getElementById('task-category'),
      dueDateInput:   document.getElementById('task-due-date'),
      formSubmitBtn:  document.getElementById('form-submit-btn'),
      formCancelBtn:  document.getElementById('form-cancel-btn'),

      // Filters
      searchInput:    document.getElementById('search-input'),
      statusBtns:     document.querySelectorAll('[data-filter-status]'),
      priorityBtns:   document.querySelectorAll('[data-filter-priority]'),
      categoryFilter: document.getElementById('category-filter'),
      clearFilterBtn: document.getElementById('clear-filters-btn'),

      // Sort
      sortSelect:     document.getElementById('sort-select'),

      // Task list
      taskList:       document.getElementById('task-list'),
      emptyState:     document.getElementById('empty-state'),

      // Stats
      statTotal:      document.getElementById('stat-total'),
      statCompleted:  document.getElementById('stat-completed'),
      statPct:        document.getElementById('stat-pct'),
      statOverdue:    document.getElementById('stat-overdue'),
      progressBar:    document.getElementById('progress-bar'),
      statHigh:       document.getElementById('stat-high'),
      statMedium:     document.getElementById('stat-medium'),
      statLow:        document.getElementById('stat-low'),

      // Controls
      themeToggle:    document.getElementById('theme-toggle'),
      deleteCompleted:document.getElementById('delete-completed-btn'),
      exportBtn:      document.getElementById('export-btn'),
      importBtn:      document.getElementById('import-btn'),
      importFile:     document.getElementById('import-file'),

      // Notification
      notification:   document.getElementById('notification'),

      // Modal
      modal:          document.getElementById('confirm-modal'),
      modalMsg:       document.getElementById('modal-message'),
      modalOk:        document.getElementById('modal-ok'),
      modalCancel:    document.getElementById('modal-cancel'),
    };

    _bindEvents();
    // Pre-set sort selector from saved state
    if (els.sortSelect) els.sortSelect.value = app.getSortBy();
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Event binding
  // ══════════════════════════════════════════════════════════════════════
  function _bindEvents() {
    // Task form submit
    els.taskForm.addEventListener('submit', _handleFormSubmit);

    // Cancel edit
    els.formCancelBtn.addEventListener('click', _cancelEdit);

    // Search – debounced
    els.searchInput.addEventListener('input', utils.debounce(e => {
      app.setFilter('search', e.target.value.trim());
    }, 250));

    // Status filter buttons
    els.statusBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        app.setFilter('status', btn.dataset.filterStatus);
        _updateActiveBtn(els.statusBtns, btn);
      });
    });

    // Priority filter buttons
    els.priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        app.setFilter('priority', btn.dataset.filterPriority);
        _updateActiveBtn(els.priorityBtns, btn);
      });
    });

    // Category filter
    els.categoryFilter.addEventListener('change', e => {
      app.setFilter('category', e.target.value);
    });

    // Clear filters
    els.clearFilterBtn.addEventListener('click', () => {
      app.clearFilters();
      _resetFilterUI();
    });

    // Sort
    els.sortSelect.addEventListener('change', e => app.setSortBy(e.target.value));

    // Theme toggle
    els.themeToggle.addEventListener('click', () => app.toggleTheme());

    // Delete completed
    els.deleteCompleted.addEventListener('click', () => {
      showConfirm('Delete all completed tasks?', () => app.deleteCompleted());
    });

    // Export
    els.exportBtn.addEventListener('click', () => app.exportBackup());

    // Import
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', _handleImport);

    // Task list – event delegation
    els.taskList.addEventListener('click', _handleTaskAction);

    // Modal
    els.modalCancel.addEventListener('click', _closeModal);
    els.modal.addEventListener('click', e => { if (e.target === els.modal) _closeModal(); });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Form handlers
  // ══════════════════════════════════════════════════════════════════════
  function _handleFormSubmit(e) {
    e.preventDefault();
    const title = els.titleInput.value.trim();
    if (!title) { _shake(els.titleInput); return; }

    const desc     = els.descInput.value;
    const priority = els.prioritySelect.value;
    const category = els.categoryInput.value.trim() || 'General';
    const dueDate  = els.dueDateInput.value;

    if (editingId) {
      app.updateTask(editingId, { title, description: desc, priority, category, dueDate });
      _cancelEdit();
    } else {
      app.addTask(title, desc, priority, category, dueDate);
      els.taskForm.reset();
    }
  }

  function _cancelEdit() {
    editingId = null;
    els.taskForm.reset();
    els.formSubmitBtn.textContent = 'Add Task';
    els.formCancelBtn.classList.add('hidden');
    els.titleInput.focus();
  }

  function _startEdit(task) {
    editingId = task.id;
    els.titleInput.value    = task.title;
    els.descInput.value     = task.description;
    els.prioritySelect.value = task.priority;
    els.categoryInput.value = task.category;
    els.dueDateInput.value  = task.dueDate;
    els.formSubmitBtn.textContent = 'Update Task';
    els.formCancelBtn.classList.remove('hidden');
    els.titleInput.focus();
    // Scroll form into view on mobile
    els.taskForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Task list delegation
  // ══════════════════════════════════════════════════════════════════════
  function _handleTaskAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.closest('[data-id]')?.dataset.id;
    if (!id) return;

    switch (btn.dataset.action) {
      case 'toggle':
        app.toggleComplete(id);
        break;
      case 'edit': {
        const task = app.getTasks().find(t => t.id === id);
        if (task) _startEdit(task);
        break;
      }
      case 'delete':
        showConfirm('Delete this task?', () => app.deleteTask(id));
        break;
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Import handler
  // ══════════════════════════════════════════════════════════════════════
  function _handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        app.importBackup(ev.target.result);
      } catch (err) {
        showNotification('Import failed: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════════════════════════════
  function render() {
    _renderTasks();
    _renderStats();
    _renderCategoryFilter();
  }

  function _renderTasks() {
    const tasks = app.getFilteredTasks();
    els.taskList.innerHTML = '';

    if (tasks.length === 0) {
      els.emptyState.classList.remove('hidden');
      return;
    }
    els.emptyState.classList.add('hidden');

    const frag = document.createDocumentFragment();
    tasks.forEach(task => {
      const li = _buildTaskElement(task);
      frag.appendChild(li);
    });
    els.taskList.appendChild(frag);
  }

  function _buildTaskElement(task) {
    const dueDateStatus = utils.getDueDateStatus(task.dueDate);
    const prioClass     = utils.getPriorityClass(task.priority);

    // Build with DOM methods to avoid innerHTML XSS risks
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${prioClass}`.trim();
    li.dataset.id = task.id;

    // Checkbox
    const checkWrap = document.createElement('div');
    checkWrap.className = 'task-checkbox-wrap';
    const checkBtn = document.createElement('button');
    checkBtn.className = `task-checkbox${task.completed ? ' checked' : ''}`;
    checkBtn.dataset.action = 'toggle';
    const checkLabel = task.completed ? 'Mark incomplete' : 'Mark complete';
    checkBtn.setAttribute('aria-label', checkLabel);
    checkBtn.title = checkLabel;
    if (task.completed) checkBtn.innerHTML = _icon('check'); // static SVG, not user data
    checkWrap.appendChild(checkBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'task-body';

    // Header row
    const header = document.createElement('div');
    header.className = 'task-header';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;
    const badgeSpan = document.createElement('span');
    // priority is constrained to 'low'|'medium'|'high' but sanitise for class use
    const safePriority = ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium';
    badgeSpan.className = `task-priority-badge badge-${safePriority}`;
    badgeSpan.textContent = _capitalize(safePriority);
    header.appendChild(titleSpan);
    header.appendChild(badgeSpan);
    body.appendChild(header);

    // Optional description
    if (task.description) {
      const desc = document.createElement('p');
      desc.className = 'task-desc';
      desc.textContent = task.description;
      body.appendChild(desc);
    }

    // Meta row
    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const catSpan = document.createElement('span');
    catSpan.className = 'task-category';
    catSpan.innerHTML = _icon('tag'); // static SVG
    catSpan.appendChild(document.createTextNode(' ' + task.category));
    meta.appendChild(catSpan);

    if (task.dueDate) {
      // dueDateStatus is a controlled value from our own function
      const safeStatus = ['overdue', 'today', 'soon', 'upcoming'].includes(dueDateStatus) ? dueDateStatus : 'upcoming';
      const dueSpan = document.createElement('span');
      dueSpan.className = `task-due due-${safeStatus}`;
      dueSpan.innerHTML = _icon('calendar'); // static SVG
      dueSpan.appendChild(document.createTextNode(' ' + utils.formatDate(task.dueDate) + _dueDateLabel(safeStatus)));
      meta.appendChild(dueSpan);
    }

    body.appendChild(meta);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon btn-edit';
    editBtn.dataset.action = 'edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.title = 'Edit';
    editBtn.innerHTML = _icon('edit'); // static SVG
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon btn-delete';
    delBtn.dataset.action = 'delete';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.title = 'Delete';
    delBtn.innerHTML = _icon('trash'); // static SVG
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkWrap);
    li.appendChild(body);
    li.appendChild(actions);
    return li;
  }

  function _dueDateLabel(status) {
    const map = { today: ' (Today)', soon: ' (Soon)', overdue: ' (Overdue)', upcoming: '' };
    return map[status] || '';
  }

  function _renderStats() {
    const s = app.getStats();
    if (els.statTotal)     els.statTotal.textContent     = s.total;
    if (els.statCompleted) els.statCompleted.textContent = s.completed;
    if (els.statPct)       els.statPct.textContent       = s.pct + '%';
    if (els.statOverdue)   els.statOverdue.textContent   = s.overdue;
    if (els.progressBar) {
      els.progressBar.style.width = s.pct + '%';
      els.progressBar.parentElement.setAttribute('aria-valuenow', s.pct);
    }
    const pctLabel = document.getElementById('stat-pct-label');
    if (pctLabel) pctLabel.textContent = s.pct + '%';
    if (els.statHigh)      els.statHigh.textContent      = s.byPriority.high;
    if (els.statMedium)    els.statMedium.textContent    = s.byPriority.medium;
    if (els.statLow)       els.statLow.textContent       = s.byPriority.low;
  }

  function _renderCategoryFilter() {
    const cats = app.getCategories();
    const current = app.getFilters().category;
    els.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      if (cat === current) opt.selected = true;
      els.categoryFilter.appendChild(opt);
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Theme
  // ══════════════════════════════════════════════════════════════════════
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (els.themeToggle) {
      els.themeToggle.innerHTML = theme === 'dark' ? _icon('sun') : _icon('moon');
      els.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      els.themeToggle.title = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Notification toast
  // ══════════════════════════════════════════════════════════════════════
  function showNotification(msg, type = 'info') {
    const el = els.notification;
    if (!el) return;
    el.textContent = msg;
    el.className = `notification show ${type}`;
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => { el.className = 'notification'; }, 3000);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Confirm modal
  // ══════════════════════════════════════════════════════════════════════
  let _modalCallback = null;

  function showConfirm(message, callback) {
    els.modalMsg.textContent = message;
    _modalCallback = callback;
    els.modal.classList.remove('hidden');
    els.modal.setAttribute('aria-hidden', 'false');
    els.modalOk.onclick = () => {
      _closeModal();
      if (_modalCallback) _modalCallback();
    };
    els.modalOk.focus();
  }

  function _closeModal() {
    els.modal.classList.add('hidden');
    els.modal.setAttribute('aria-hidden', 'true');
    _modalCallback = null;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════════════════════════════════════
  function _capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  function _updateActiveBtn(btnList, active) {
    btnList.forEach(b => b.classList.toggle('active', b === active));
  }

  function _resetFilterUI() {
    els.statusBtns.forEach(b => b.classList.toggle('active', b.dataset.filterStatus === 'all'));
    els.priorityBtns.forEach(b => b.classList.toggle('active', b.dataset.filterPriority === 'all'));
    els.categoryFilter.value = 'all';
    els.searchInput.value = '';
  }

  function _shake(el) {
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  // ── Inline SVG icons (minimal, theme-aware via currentColor) ──────────
  function _icon(name) {
    const icons = {
      check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      edit:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      trash:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
      tag:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
      calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      sun:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
      moon:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    };
    return icons[name] || '';
  }

  return { init, render, renderTask: _buildTaskElement, applyTheme, showNotification, showConfirm };
})();
