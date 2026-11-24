/* Віконце — Блокнот (.txt). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, fs, bus } = VOS;

  /** Невелике рядкове меню («Файл», «Правка», …), спільне для програм. */
  VOS.menubar = function (menus) {
    const bar = el('div.menubar', { role: 'menubar' });
    menus.forEach((m) => {
      const b = el('button.menubar-btn', { type: 'button', dataset: m.hint ? { hint: m.hint } : {} }, m.label);
      b.addEventListener('click', () => {
        const r = b.getBoundingClientRect();
        VOS.ui.menu(r.left, r.bottom + 2, typeof m.items === 'function' ? m.items() : m.items);
      });
      bar.append(b);
    });
    return bar;
  };

  function launch(args) {
    let fileId = null;
    let saved = '';
    let fontSize = 18;

    const ta = el('textarea.np-text', { spellcheck: true, lang: 'uk', 'aria-label': 'Текст', placeholder: 'Пиши тут…' });
    const status = el('div.np-status');
    const updateStatus = () => {
      const t = ta.value;
      const words = (t.match(/[\p{L}\p{N}'’ʼ-]+/gu) || []).length;
      status.textContent = 'Символів: ' + t.length + ' · Слів: ' + words + ' · Шрифт: ' + fontSize;
    };
    const isDirty = () => ta.value !== saved;
    const title = () => {
      const n = fileId && fs.get(fileId);
      return (isDirty() ? '• ' : '') + (n ? n.name : 'Безіменний') + ' — Блокнот';
    };
    const refresh = () => { win.setTitle(title()); updateStatus(); };

    function load(id) {
      const n = fs.get(id);
      if (!n) return;
      fileId = id;
      saved = ta.value = n.content || '';
      refresh();
    }

    let savePromise = null;
    function save(as) {
      if (savePromise) return savePromise;
      const pending = saveNow(as);
      savePromise = pending;
      return pending.finally(() => { if (savePromise === pending) savePromise = null; });
    }

    async function saveNow(as) {
      const content = ta.value;
      const n = fileId && fs.get(fileId);
      if (!as && n && !fs.isInTrash(fileId)) {
        try { fs.write(fileId, content); }
        catch (e) { VOS.dialog.error(e.message); return false; }
      } else {
        const r = await VOS.dialog.saveAs({ ext: 'txt', name: n ? n.name : 'Мій текст.txt', folder: n ? n.parent : 'docs', title: 'Зберегти текст' });
        if (!r) return false;
        try {
          if (r.replaceId) { fs.write(r.replaceId, content); fileId = r.replaceId; }
          else fileId = fs.createFile(r.folder, r.name, content).id;
        } catch (e) { VOS.dialog.error(e.message); return false; }
      }
      try { await fs.flush(); }
      catch (e) { VOS.dialog.error('Не вдалося зберегти файл. Перевір вільне місце й спробуй ще раз.'); return false; }
      const savedNode = fs.get(fileId);
      if (!savedNode) { VOS.dialog.error('Файл зник під час збереження. Збережи текст як новий файл.'); return false; }
      saved = content;
      refresh();
      VOS.toast('Збережено: ' + savedNode.name, 'save');
      bus.emit('notepad:save', { node: savedNode, winId: win.id });
      return true;
    }

    async function confirmDiscard() {
      while (true) {
        if (savePromise) await savePromise;
        if (!isDirty()) return true;
        const r = await VOS.dialog.choice('Зберегти зміни в тексті «' + ((fileId && fs.get(fileId)) ? fs.get(fileId).name : 'Безіменний') + '»?',
          [{ label: 'Зберегти', value: 'save', primary: true }, { label: 'Не зберігати', value: 'no', danger: true }, { label: 'Скасувати', value: 'cancel' }],
          { title: 'Блокнот', icon: 'notebook' });
        if (r === 'save') { if (!(await save(false))) return false; continue; }
        return r === 'no';
      }
    }

    async function openDlg() {
      if (!(await confirmDiscard())) return;
      const id = await VOS.dialog.openFile({ exts: ['txt'], folder: fileId && fs.get(fileId) ? fs.get(fileId).parent : 'docs', title: 'Відкрити текст' });
      if (id) load(id);
    }

    const clip = async (cmd) => {
      ta.focus();
      if (cmd === 'paste') {
        try { const t = await navigator.clipboard.readText(); ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
        catch (e) { VOS.toast('Щоб вставити, натисни Ctrl+V', 'keyboard'); }
      } else document.execCommand(cmd);
    };

    const setFont = (s) => { fontSize = VOS.clamp(s, 12, 48); ta.style.fontSize = fontSize + 'px'; updateStatus(); };

    const bar = VOS.menubar([
      { label: 'Файл', hint: 'np-file', items: () => [
        { label: 'Створити', icon: 'file-text', action: async () => { if (await confirmDiscard()) { fileId = null; saved = ta.value = ''; refresh(); } } },
        { label: 'Відкрити…', icon: 'folder-open', action: openDlg },
        { label: 'Зберегти', icon: 'save', hint: 'np-save', action: () => save(false) },
        { label: 'Зберегти як…', icon: 'save', hint: 'np-saveas', action: () => save(true) },
        { sep: true },
        { label: 'Закрити', icon: 'x', action: () => win.close() },
      ] },
      { label: 'Правка', items: [
        { label: 'Скасувати', icon: 'undo', action: () => { ta.focus(); document.execCommand('undo'); } },
        { sep: true },
        { label: 'Вирізати', icon: 'scissors', action: () => clip('cut') },
        { label: 'Копіювати', icon: 'file-text', action: () => clip('copy') },
        { label: 'Вставити', icon: 'clipboard', action: () => clip('paste') },
        { sep: true },
        { label: 'Виділити все', icon: 'select-all', action: () => { ta.focus(); ta.select(); } },
      ] },
      { label: 'Вигляд', items: () => [
        { label: 'Більший шрифт', icon: 'text-size', action: () => setFont(fontSize + 2) },
        { label: 'Менший шрифт', icon: 'text-small', action: () => setFont(fontSize - 2) },
        { label: (ta.classList.contains('nowrap') ? 'Увімкнути' : 'Вимкнути') + ' перенос рядків', icon: 'restore', action: () => ta.classList.toggle('nowrap') },
      ] },
    ]);
    const saveBtn = el('button.tb-btn.wide', { type: 'button', title: 'Зберегти (Ctrl+S)', dataset: { hint: 'np-savebtn' }, on: { click: () => save(false) } }, VOS.icon('save'), el('span.tb-label', ' Зберегти'));
    const quick = el('div.np-quick',
      saveBtn,
      el('button.tb-btn', { type: 'button', title: 'Більший шрифт', on: { click: () => setFont(fontSize + 2) } }, 'A+'),
      el('button.tb-btn', { type: 'button', title: 'Менший шрифт', on: { click: () => setFont(fontSize - 2) } }, 'A−'));
    const root = el('div.app-notepad', el('div.np-bars', bar, quick), ta, status);

    let inputSent = false;
    ta.addEventListener('input', () => {
      refresh();
      if (!inputSent && ta.value.trim().length >= 3) { inputSent = true; }
      bus.emit('notepad:input', { length: ta.value.trim().length, winId: win.id });
    });
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') { e.preventDefault(); save(e.shiftKey); }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') { e.preventDefault(); openDlg(); }
    });

    const win = VOS.wm.open({
      app: 'notepad', title: 'Безіменний — Блокнот', icon: 'notebook', content: root, width: 620, height: 440, minWidth: 300, minHeight: 220,
      beforeClose: () => confirmDiscard(),
    });
    setFont(fontSize);
    if (args.file) load(args.file);
    else {
      if (typeof args.text === 'string') ta.value = args.text;
      refresh();
    }
    setTimeout(() => ta.focus(), 60);
    // якщо файл перейменували в Провіднику — оновлюємо заголовок
    const off = bus.on('fs:rename', ({ node }) => { if (node.id === fileId) refresh(); });
    const prevClose = win.onClose;
    win.onClose = (w) => { off(); if (prevClose) prevClose(w); };
    return win;
  }

  VOS.apps.register({ id: 'notepad', name: 'Блокнот', icon: 'notebook', color: '#4dabf7', category: 'standard', desc: 'Простий текстовий редактор', exts: ['txt'], launch });
})();
