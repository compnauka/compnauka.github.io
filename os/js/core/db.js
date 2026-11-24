/* Віконце — сховище файлів в IndexedDB.
   Кожен вузол файлової системи — окремий запис { key: "<профіль>/<id>", profile, ...вузол }.
   Так зміна одного файлу не переписує всі малюнки, а місця значно більше, ніж у localStorage (~5 МБ). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const DB_NAME = 'vikontse';
  const STORE = 'nodes';
  let dbPromise = null;

  function open() {
    if (!('indexedDB' in window)) return Promise.reject(new Error(tr('IndexedDB недоступна')));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let req;
        try { req = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
        req.onupgradeneeded = () => {
          const s = req.result.createObjectStore(STORE, { keyPath: 'key' });
          s.createIndex('profile', 'profile');
        };
        req.onsuccess = () => {
          const db = req.result;
          db.onversionchange = () => db.close();
          resolve(db);
        };
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error(tr('IndexedDB заблокована іншою вкладкою')));
      }).catch((e) => { dbPromise = null; throw e; });
    }
    return dbPromise;
  }

  const done = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error(tr('Транзакцію скасовано')));
  });

  /** Усі вузли профілю (без службових полів key/profile). */
  async function loadProfile(profile) {
    const db = await open();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('profile').getAll(profile);
    const rows = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    return rows.map(({ key, profile: p, ...node }) => node);
  }

  /** Зберігає змінені вузли й видаляє прибрані — однією транзакцією. */
  async function saveNodes(profile, puts, removes) {
    if (!puts.length && !removes.length) return;
    const db = await open();
    if (!VOS.store.canWriteProfile(profile)) throw new Error(tr('Сеанс завершився.'));
    const tx = db.transaction(STORE, 'readwrite');
    const s = tx.objectStore(STORE);
    for (const n of puts) s.put({ ...n, key: profile + '/' + n.id, profile });
    for (const id of removes) s.delete(profile + '/' + id);
    await done(tx);
  }

  async function clearProfile(profile) {
    const db = await open();
    const tx = db.transaction(STORE, 'readwrite');
    const idx = tx.objectStore(STORE).index('profile');
    const req = idx.openKeyCursor(IDBKeyRange.only(profile));
    req.onsuccess = () => {
      const c = req.result;
      if (c) { tx.objectStore(STORE).delete(c.primaryKey); c.continue(); }
    };
    await done(tx);
  }

  /** Скільки місця зайнято і доступно (оцінка браузера). */
  async function estimate() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        return { usage: e.usage || 0, quota: e.quota || 0 };
      }
    } catch (e) { /* немає оцінки */ }
    return null;
  }

  /** Просимо браузер не стирати дані автоматично, коли мало місця на диску. */
  async function persist() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        if (await navigator.storage.persisted()) return true;
        return await navigator.storage.persist();
      }
    } catch (e) { /* не підтримується */ }
    return false;
  }

  VOS.db = { open, loadProfile, saveNodes, clearProfile, estimate, persist };
})();
