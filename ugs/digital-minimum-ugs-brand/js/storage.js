(() => {
  'use strict';
  const memory = {};
  const key = 'digital-minimum-progress-v2';
  const validStatuses = new Set(['new', 'training', 'almost', 'mastered']);

  function storageAvailable() {
    try {
      const test = '__dm_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch { return false; }
  }
  const persistent = storageAvailable();

  function read() {
    if (!persistent) return { ...memory };
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }

  function write(data) {
    if (!persistent) {
      Object.keys(memory).forEach(k => delete memory[k]);
      Object.assign(memory, data);
      return;
    }
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* graceful fallback */ }
  }

  window.ProgressStore = {
    key,
    isPersistent: persistent,
    read,
    get(id) {
      const value = read()[id];
      return validStatuses.has(value) ? value : 'new';
    },
    set(id, status) {
      if (!validStatuses.has(status)) return;
      const data = read();
      data[id] = status;
      write(data);
    },
    reset() { write({}); }
  };
})();
