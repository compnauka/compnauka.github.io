/**
 * storage.js — збереження на час сеансу.
 *
 * sessionStorage, а не localStorage: у комп'ютерному класі за одним
 * пристроєм працюють різні учні, і чужий діалог у наступного на екрані —
 * зайве. Дані живуть, поки відкрита вкладка.
 *
 * Усі операції обгорнуті в try/catch: у приватному режимі деяких браузерів
 * sessionStorage кидає помилку, і це не має ламати сторінку.
 */

const KEYS = {
  transcript: 'eliza.transcript',
  customRules: 'eliza.customRules',
  brainMode: 'eliza.brainMode',
  shownCards: 'eliza.shownCards'
};

function read(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn('[eliza] не вдалося прочитати', key, error);
    return fallback;
  }
}

function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[eliza] не вдалося зберегти', key, error);
  }
}

export const storage = {
  loadTranscript: () => {
    const list = read(KEYS.transcript, []);
    return Array.isArray(list) ? list : [];
  },
  saveTranscript: (list) => write(KEYS.transcript, list.slice(-120)),

  loadCustomRules: () => {
    const list = read(KEYS.customRules, []);
    return Array.isArray(list) ? list : [];
  },
  saveCustomRules: (list) => write(KEYS.customRules, list),

  loadBrainMode: () => read(KEYS.brainMode, false) === true,
  saveBrainMode: (value) => write(KEYS.brainMode, Boolean(value)),

  loadShownCards: () => {
    const list = read(KEYS.shownCards, []);
    return Array.isArray(list) ? list : [];
  },
  saveShownCards: (list) => write(KEYS.shownCards, list),

  clearAll() {
    try {
      Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('[eliza] не вдалося очистити сховище', error);
    }
  }
};
