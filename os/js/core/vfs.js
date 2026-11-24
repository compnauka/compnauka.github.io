/* Віконце — віртуальна файлова система.
   Дерево вузлів живе в пам'яті (синхронний API для програм), а зберігається в IndexedDB
   окремо для кожного профілю. Якщо IndexedDB недоступна — у localStorage, як раніше. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { bus, store, uid } = VOS;

  const SPECIAL = {
    root: { name: "Комп'ютер", icon: 'computer' },
    desktop: { name: 'Робочий стіл', icon: 'folder-desktop' },
    docs: { name: 'Документи', icon: 'folder-docs' },
    pics: { name: 'Малюнки', icon: 'folder-pics' },
    trash: { name: 'Кошик', icon: 'trash' },
  };
  const BAD_CHARS = /[\\/:*?"<>|]/;

  let nodes = {};
  let backend = 'idb'; // 'idb' | 'ls' | 'memory'
  let profile = null; // профіль, якому належать вузли в пам'яті
  // Що вже лежить у сховищі: id → { meta (JSON без вмісту), content (посилання на рядок) }
  let saved = new Map();
  let flushing = Promise.resolve();
  let revision = 0;

  const metaOf = (n) => { const { content, ...m } = n; return JSON.stringify(m); };

  /** Записує в IndexedDB лише змінені й видалені вузли. */
  function flushNow() {
    const task = flushing.then(async () => {
      if (!profile || backend === 'memory') return;
      do {
        if (!store.canWriteProfile(profile)) throw new Error(tr('Сеанс завершився.'));
        const atRevision = revision;
        if (backend === 'ls') {
          if (!store.rawSet('p.' + profile + '.fs', { v: 1, nodes })) {
            throw new Error(tr('Не вдалося зберегти файлову систему.'));
          }
        } else {
          const puts = [], removes = [], next = new Map();
          for (const n of Object.values(nodes)) {
            const meta = metaOf(n), prev = saved.get(n.id);
            next.set(n.id, { meta, content: n.content });
            if (!prev || prev.meta !== meta || prev.content !== n.content) puts.push({ ...n });
          }
          for (const id of saved.keys()) if (!next.has(id)) removes.push(id);
          if (puts.length || removes.length) {
            try { await VOS.db.saveNodes(profile, puts, removes); }
            catch (e) { console.error('[fs] не вдалося зберегти', e); bus.emit('store:full', { error: e }); throw e; }
          }
          saved = next;
        }
        if (revision === atRevision) break;
      } while (true);
    });
    flushing = task.catch(() => {});
    return task;
  }
  let saveQueued = false;
  function save() {
    if (saveQueued) return;
    saveQueued = true;
    queueMicrotask(() => {
      saveQueued = false;
      flushNow().catch(() => {});
    });
  }
  // Вкладку закривають або ховають — зберігаємо негайно
  window.addEventListener('pagehide', () => { flushNow().catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow().catch(() => {}); });

  function now() { return Date.now(); }

  function ext(name) {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toLowerCase() : '';
  }
  function baseName(name) {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(0, i) : name;
  }

  function get(id) { return nodes[id] || null; }

  function label(node) {
    if (Object.hasOwn(SPECIAL, node.id) || node.id === 'link-computer' || node.id === 'link-trash') return tr(node.name);
    if (node.type === 'link' && !node.targetId) {
      const app = VOS.apps.get(node.app);
      if (app?.sourceName === node.name) return app.name;
    }
    if (node.type === 'folder' && node.parent === 'desktop') {
      const starterApp = node.name === 'Ігри' ? 'tangram' : node.name === 'Тренажери' ? 'klavio' : null;
      if (starterApp && (node.starterFolder || Object.values(nodes).some((child) => child.parent === node.id && child.app === starterApp))) return tr(node.name);
    }
    return node.name;
  }

  function children(id) {
    return Object.values(nodes)
      .filter((n) => n.parent === id)
      .sort((a, b) => {
        if (!!a.system !== !!b.system) return a.system ? -1 : 1;
        if (a.system && b.system) return a.id === 'link-computer' ? -1 : 1;
        // На робочому столі значки не «стрибають»: нові з'являються в кінці
        if (id === 'desktop') return (a.placed || a.created || 0) - (b.placed || b.created || 0);
        const fa = a.type === 'folder' ? 0 : 1, fb = b.type === 'folder' ? 0 : 1;
        if (fa !== fb) return fa - fb;
        return label(a).localeCompare(label(b), VOS.i18n.locale, { numeric: true });
      });
  }

  function ancestors(id) {
    const out = [];
    let n = get(id);
    while (n) {
      out.unshift(n);
      n = n.parent ? get(n.parent) : null;
    }
    return out;
  }
  function pathString(id) { return ancestors(id).map(label).join(' › '); }

  function isDescendant(id, ofId) {
    let n = get(id);
    while (n) {
      if (n.id === ofId) return true;
      n = n.parent ? get(n.parent) : null;
    }
    return false;
  }
  const isSpecialFolder = (id) => id in SPECIAL;
  const isInTrash = (id) => isDescendant(id, 'trash') && id !== 'trash';
  const isProtected = (id) => isSpecialFolder(id) || !!(get(id) && get(id).system);

  function nameExists(parent, name, exceptId) {
    const low = name.toLocaleLowerCase('uk');
    return children(parent).some((n) => n.id !== exceptId && n.name.toLocaleLowerCase('uk') === low);
  }

  function uniqueName(parent, name, exceptId) {
    if (!nameExists(parent, name, exceptId)) return name;
    const e = ext(name), b = baseName(name);
    for (let i = 2; i < 999; i++) {
      const cand = b + ' (' + i + ')' + (e ? '.' + e : '');
      if (!nameExists(parent, cand, exceptId)) return cand;
    }
    return name + ' ' + uid('');
  }

  function validateName(name) {
    name = (name || '').trim();
    if (!name) throw new Error(tr('Назва не може бути порожньою.'));
    if (BAD_CHARS.test(name)) throw new Error(tr('У назві не можна писати символи  \\ / : * ? " < > |'));
    if (name.length > 60) throw new Error(tr('Назва задовга. Спробуй коротше (до 60 символів).'));
    if (/^\.+$/.test(name)) throw new Error(tr('Назва не може складатися лише з крапок.'));
    return name;
  }

  function sizeOf(id) {
    const n = get(id);
    if (!n) return 0;
    if (n.type === 'folder') return children(id).reduce((s, c) => s + sizeOf(c.id), 0);
    if (n.type === 'link') return 64;
    const c = n.content || '';
    if (ext(n.name) !== 'txt' && c.startsWith('data:')) return Math.round(((c.length - c.indexOf(',') - 1) * 3) / 4);
    return new Blob([c]).size;
  }

  function changed(parents) {
    revision++;
    save();
    bus.emit('fs:change', { parents: [...new Set(parents.filter(Boolean))] });
  }

  function add(node) {
    nodes[node.id] = node;
    return node;
  }

  /* ---------- Операції ---------- */
  function createFolder(parent, name = tr('Нова папка')) {
    const n = add({ id: uid('f'), type: 'folder', name: uniqueName(parent, validateName(name)), parent, created: now(), modified: now() });
    changed([parent]);
    bus.emit('fs:create', { node: n });
    return n;
  }

  function createFile(parent, name, content = '') {
    const n = add({ id: uid('f'), type: 'file', name: uniqueName(parent, validateName(name)), parent, content, created: now(), modified: now() });
    changed([parent]);
    bus.emit('fs:create', { node: n });
    return n;
  }

  function createLink(parent, name, app, args, id = uid('l')) {
    const n = add({ id, type: 'link', name: uniqueName(parent, validateName(name)), parent, app, args: args || null, created: now(), modified: now() });
    changed([parent]);
    bus.emit('fs:create', { node: n });
    return n;
  }

  function ensureDesktopAppLink(app, id) {
    const existing = children('desktop').find((node) => node.type === 'link' && node.app === app && !node.args);
    return existing || createLink('desktop', VOS.apps.get(app)?.sourceName || VOS.apps.name(app), app, null, id);
  }

  function addDefaultBrowserLink() {
    if (nodes.desktop.browserShortcutAdded) return;
    // Запам’ятовуємо міграцію, щоб не повертати ярлик, який учень прибрав.
    nodes.desktop.browserShortcutAdded = true;
    ensureDesktopAppLink('browser', 'link-browser');
    save();
  }

  function createShortcut(targetId, parent = 'desktop') {
    const target = get(targetId);
    if (!target || target.type === 'link' || isProtected(targetId) || isInTrash(targetId)) throw new Error(tr('Для цього об’єкта не можна створити ярлик.'));
    if (get(parent)?.type !== 'folder' || parent === 'trash' || isInTrash(parent)) throw new Error(tr('У цій папці не можна створити ярлик.'));
    const base = target.name.slice(0, 49).trimEnd() + tr(' — ярлик');
    const n = add({ id: uid('l'), type: 'link', name: uniqueName(parent, base), parent, targetId, created: now(), modified: now() });
    changed([parent]);
    bus.emit('fs:create', { node: n });
    bus.emit('fs:shortcut', { node: n, targetId });
    return n;
  }

  function write(id, content) {
    const n = get(id);
    if (!n || n.type !== 'file') throw new Error(tr('Файл не знайдено.'));
    n.content = content;
    n.modified = now();
    changed([n.parent]);
    bus.emit('fs:write', { node: n });
    return n;
  }

  function rename(id, newName) {
    const n = get(id);
    if (!n) throw new Error(tr('Об\'єкт не знайдено.'));
    if (isSpecialFolder(id)) throw new Error(tr('Цю системну папку не можна перейменувати.'));
    newName = validateName(newName);
    if (newName === n.name) return n;
    if (nameExists(n.parent, newName, id)) throw new Error(tr('Тут уже є об\'єкт з назвою «') + newName + tr('». Обери іншу назву.'));
    const oldName = n.name;
    n.name = newName;
    n.modified = now();
    changed([n.parent]);
    bus.emit('fs:rename', { node: n, oldName });
    return n;
  }

  function move(id, target) {
    const n = get(id);
    if (!n) throw new Error(tr('Об\'єкт не знайдено.'));
    if (isProtected(id)) throw new Error(tr('Цей системний значок не можна переміщувати.'));
    const t = get(target);
    if (!t || t.type !== 'folder') throw new Error(tr('Туди не можна перемістити.'));
    if (target === n.parent) return n;
    if (isDescendant(target, id)) throw new Error(tr('Папку не можна покласти саму в себе.'));
    if (target === 'trash') return trash(id);
    const from = n.parent;
    n.name = uniqueName(target, n.name, id);
    n.parent = target;
    n.placed = now();
    delete n.origParent;
    changed([from, target]);
    bus.emit('fs:move', { node: n, from, to: target });
    return n;
  }

  function cloneTree(id, parent, name) {
    const src = get(id);
    const copy = { ...src, id: uid('f'), parent, name: name || src.name, created: now(), modified: now() };
    delete copy.system;
    delete copy.origParent;
    add(copy);
    if (src.type === 'folder') children(id).forEach((c) => cloneTree(c.id, copy.id));
    return copy;
  }

  function copy(id, target) {
    const n = get(id);
    if (!n) throw new Error(tr('Об\'єкт не знайдено.'));
    if (isSpecialFolder(id)) throw new Error(tr('Системну папку не можна копіювати.'));
    if (isDescendant(target, id)) throw new Error(tr('Папку не можна скопіювати саму в себе.'));
    let name = n.name;
    if (nameExists(target, name)) {
      const e = ext(name);
      name = uniqueName(target, baseName(name) + tr(' — копія') + (e ? '.' + e : ''));
    }
    const c = cloneTree(id, target, name);
    changed([target]);
    bus.emit('fs:copy', { node: c, source: n });
    return c;
  }

  function trash(id) {
    const n = get(id);
    if (!n) throw new Error(tr('Об\'єкт не знайдено.'));
    if (isProtected(id)) throw new Error(tr('Цей системний значок не можна видалити.'));
    if (isInTrash(id)) return deleteForever(id);
    const from = n.parent;
    n.origParent = from;
    n.trashed = now();
    n.name = uniqueName('trash', n.name, id);
    n.parent = 'trash';
    changed([from, 'trash']);
    bus.emit('fs:trash', { node: n, from });
    VOS.sound.play('trash');
    return n;
  }

  function restore(id) {
    const n = get(id);
    if (!n || n.parent !== 'trash') throw new Error(tr('Цього немає в кошику.'));
    let to = n.origParent && get(n.origParent) && !isInTrash(n.origParent) ? n.origParent : 'desktop';
    n.parent = to;
    n.placed = now();
    n.name = uniqueName(to, n.name, id);
    delete n.origParent;
    delete n.trashed;
    changed(['trash', to]);
    bus.emit('fs:restore', { node: n, to });
    return n;
  }

  function removeTree(id) {
    children(id).forEach((c) => removeTree(c.id));
    delete nodes[id];
  }

  function deleteForever(id) {
    const n = get(id);
    if (!n) return;
    if (isProtected(id)) throw new Error(tr('Цей системний значок не можна видалити.'));
    const parent = n.parent;
    removeTree(id);
    changed([parent]);
    bus.emit('fs:delete', { node: n });
  }

  function emptyTrash() {
    const items = children('trash');
    items.forEach((c) => removeTree(c.id));
    changed(['trash']);
    bus.emit('fs:empty', { count: items.length });
    if (items.length) VOS.sound.play('trash');
    return items.length;
  }

  function findByName(parent, name) {
    const low = name.toLocaleLowerCase('uk');
    return children(parent).find((n) => n.name.toLocaleLowerCase('uk') === low) || null;
  }

  function searchByName(folder, query) {
    const normalize = (name) => name.normalize('NFC').toLocaleLowerCase('uk');
    const text = normalize(query.trim());
    if (!text) return [];
    return Object.values(nodes)
      .filter((n) => n.id !== folder && isDescendant(n.id, folder) && (normalize(n.name).includes(text) || normalize(label(n)).includes(text)))
      .sort((a, b) => label(a).localeCompare(label(b), VOS.i18n.locale, { numeric: true }));
  }

  /* ---------- Початковий вміст ---------- */
  function sampleDrawing() {
    try {
      const c = document.createElement('canvas');
      c.width = 480; c.height = 320;
      const g = c.getContext('2d');
      g.fillStyle = '#bfe6ff'; g.fillRect(0, 0, 480, 320);
      g.fillStyle = '#7cc96b'; g.beginPath(); g.ellipse(240, 360, 360, 130, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(380, 80, 42, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffd43b'; g.lineWidth = 6;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.beginPath(); g.moveTo(380 + Math.cos(a) * 54, 80 + Math.sin(a) * 54); g.lineTo(380 + Math.cos(a) * 72, 80 + Math.sin(a) * 72); g.stroke();
      }
      g.fillStyle = '#e8590c'; g.fillRect(90, 160, 120, 90);
      g.fillStyle = '#c92a2a'; g.beginPath(); g.moveTo(75, 165); g.lineTo(150, 105); g.lineTo(225, 165); g.fill();
      g.fillStyle = '#74c0fc'; g.fillRect(110, 180, 30, 30);
      g.fillStyle = '#5c3d2e'; g.fillRect(160, 200, 30, 50);
      return c.toDataURL('image/png');
    } catch (e) {
      return '';
    }
  }

  function seed() {
    nodes = {};
    const t = now();
    const sys = (id, parent) => add({ id, type: 'folder', name: SPECIAL[id].name, parent, created: t, modified: t });
    sys('root', null);
    sys('desktop', 'root');
    sys('docs', 'root');
    sys('pics', 'root');
    sys('trash', null);

    const link = (parent, name, app, args, extra) => add({ id: uid('l'), type: 'link', name, parent, app, args: args || null, created: t, modified: t, ...extra });
    const file = (parent, name, content) => add({ id: uid('f'), type: 'file', name, parent, content, created: t, modified: t });
    const folder = (parent, name) => add({ id: uid('f'), type: 'folder', name, parent, created: t, modified: t });

    link('desktop', "Комп'ютер", 'explorer', { folder: 'root' }, { system: true, id: 'link-computer' });
    link('desktop', 'Кошик', 'explorer', { folder: 'trash' }, { system: true, id: 'link-trash' });
    link('desktop', 'Завдання', 'missions');
    link('desktop', 'Блокнот', 'notepad');
    link('desktop', 'Малюнок', 'paint');
    link('desktop', 'Калькулятор', 'calculator');
    link('desktop', VOS.apps.get('browser').sourceName, 'browser', null, { id: 'link-browser' });
    nodes.desktop.browserShortcutAdded = true;
    link('desktop', 'Друкарик', 'drukaryk');
    link('desktop', 'Пензлик', 'penslyk');

    const games = folder('desktop', 'Ігри');
    games.starterFolder = true;
    ['tangram', 'magic_square', 'math_quiz', 'kids_games'].forEach((a) => link(games.id, VOS.apps.get(a).sourceName, a));
    const trainers = folder('desktop', 'Тренажери');
    trainers.starterFolder = true;
    ['mouse_click', 'fireflies', 'mouse_keys', 'maze', 'windows_trainer', 'tyts', 'key_puzzle', 'first_letters', 'klavio'].forEach((a) =>
      link(trainers.id, VOS.apps.get(a).sourceName, a)
    );

    file('docs', tr('Привіт.txt'),
      tr('Привіт! Це твій перший документ у «Віконці».\n\n') +
      tr('Тут можна писати тексти, а потім зберігати їх у папки.\n') +
      tr('Спробуй щось дописати й натисни «Файл → Зберегти».\n'));
    file('docs', tr('Загадка.txt'), tr('Сидить дівчина в коморі,\nа коса її на дворі.\n\nЩо це? (Відповідь: морква)\n'));
    folder('docs', tr('Шкільні роботи'));
    const img = sampleDrawing();
    if (img) file('pics', tr('Будиночок.png'), img);
    save();
  }

  const valid = (list) => list && list.root && Object.keys(SPECIAL).every((id) => list[id]);

  /** Завантажує файли поточного профілю (store.profileId). Асинхронно: IndexedDB. */
  async function load({ temporary = false } = {}) {
    if (temporary) {
      await flushNow();
      profile = store.profileId;
      backend = 'memory';
      saved = new Map();
      seed();
      return;
    }
    await loadRaw();
    migrateNames();
    addDefaultBrowserLink();
  }

  /** Оновлення назв зі старих версій: «Мій комп'ютер» → «Комп'ютер». */
  function migrateNames() {
    let touched = false;
    for (const id of ['root', 'link-computer']) {
      if (nodes[id] && nodes[id].name === "Мій комп'ютер") { nodes[id].name = SPECIAL.root.name; touched = true; }
    }
    if (touched) save();
  }

  async function loadRaw() {
    await flushNow(); // дописати зміни попереднього профілю до перемикання
    profile = store.profileId;
    saved = new Map();
    nodes = {};
    let rows = null;
    try {
      rows = await VOS.db.loadProfile(profile);
      backend = 'idb';
    } catch (e) {
      console.warn('[fs] IndexedDB недоступна, працюю з localStorage', e);
      backend = 'ls';
    }

    if (backend === 'idb' && rows.length) {
      const list = {};
      rows.forEach((n) => { list[n.id] = n; });
      if (valid(list)) {
        nodes = list;
        rows.forEach((n) => saved.set(n.id, { meta: metaOf(n), content: n.content }));
        return;
      }
      // пошкоджені дані — починаємо з чистого аркуша, старі записи приберемо при збереженні
      rows.forEach((n) => saved.set(n.id, { meta: '', content: null }));
    }

    // Перенесення старих даних з localStorage (версія до IndexedDB) або робота без IndexedDB
    const old = store.get('fs', null);
    if (old && valid(old.nodes)) {
      nodes = old.nodes;
      if (backend === 'idb') {
        await flushNow();
        if (saved.size) store.remove('fs'); // перенесено — звільняємо localStorage
      }
      return;
    }
    seed();
    await flushNow();
  }

  async function unload() {
    await flushNow();
    await discard();
  }

  async function discard() {
    profile = null;
    await flushing;
    nodes = {};
    saved = new Map();
    revision++;
  }

  function reset() {
    seed();
    bus.emit('fs:change', { parents: Object.keys(SPECIAL), reset: true });
  }

  /** Додає готові вузли (імпорт). Вузол має містити id, parent, name, type. */
  function addNodes(list) {
    list.forEach(add);
    changed(list.map((n) => n.parent));
  }

  VOS.fs = {
    SPECIAL, load, unload, discard, reset, flush: flushNow, addNodes, get backend() { return backend; }, get, label, children, ancestors, pathString, isDescendant, isSpecialFolder, isInTrash, isProtected,
    ext, baseName, uniqueName, validateName, sizeOf, nameExists, findByName, searchByName,
    createFolder, createFile, createLink, ensureDesktopAppLink, createShortcut, write, rename, move, copy, trash, restore, deleteForever, emptyTrash,
    all: () => Object.values(nodes),
  };
})();
