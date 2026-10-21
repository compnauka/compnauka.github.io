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
  let persistent = storageAvailable();

  function read() {
    if (!persistent) return { ...memory };
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return { ...memory }; }
  }

  function write(data) {
    Object.keys(memory).forEach(k => delete memory[k]);
    Object.assign(memory, data);
    if (!persistent) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { persistent = false; }
  }

  window.ProgressStore = {
    key,
    get isPersistent() { return persistent; },
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
