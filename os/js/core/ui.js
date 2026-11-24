/* Віконце — спільні елементи інтерфейсу: значки файлів, виділення, перейменування,
   контекстне меню, перетягування (мишка й палець), буфер обміну. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, fs, bus } = VOS;

  /* ---------- Значки ---------- */
  const EXT_ICONS = { txt: 'txt', png: 'img', jpg: 'img', jpeg: 'img', zip: 'zip', csv: 'csv', html: 'html' };
  const EXT_TYPES = { txt: 'Текстовий документ', png: 'Малюнок', jpg: 'Малюнок', jpeg: 'Малюнок', zip: 'Архів', csv: 'Таблиця', html: 'Вебсторінка' };
  const trashIcon = () => (fs.children('trash').length ? 'trash-full' : 'trash');

  /** Назва кольорового значка (ART) для об'єкта файлової системи. Для ярлика — значок програми. */
  function iconFor(n) {
    if (!n) return 'file-unknown';
    if (n.type === 'folder') {
      if (n.id === 'trash') return trashIcon();
      if (fs.SPECIAL[n.id]) return fs.SPECIAL[n.id].icon;
      return 'folder';
    }
    if (n.type === 'link') {
      if (n.id === 'link-trash') return trashIcon();
      if (n.id === 'link-computer') return 'computer';
      if (n.targetId) {
        const target = fs.get(n.targetId);
        return target && target.type !== 'link' && !fs.isInTrash(target.id) ? iconFor(target) : 'file-unknown';
      }
      const a = VOS.apps.get(n.app);
      return a ? a.icon : 'file-unknown';
    }
    return EXT_ICONS[fs.ext(n.name)] || 'file-unknown';
  }

  /** Готовий значок: ярлик програми — біла іконка на кольоровій плитці, решта — ілюстрація. */
  function renderIcon(n, cls = 'item-ico') {
    const app = n.type === 'link' && !n.system ? VOS.apps.get(n.app) : null;
    const box = el('div.' + cls + (app ? '.app-tile' : ''), app ? { style: { '--tile': app.color || '#64748b' } } : null);
    const isImg = n.type === 'file' && /^(png|jpe?g)$/.test(fs.ext(n.name)) && n.content && n.content.startsWith('data:');
    if (isImg) box.append(el('img.thumb', { src: n.content, alt: '', draggable: false }));
    else box.append(VOS.icon(iconFor(n)));
    return box;
  }

  /** Вид файла за розширенням: txt / img / zip / other (від нього залежить колір позначки). */
  const EXT_KIND = { txt: 'txt', png: 'img', jpg: 'img', jpeg: 'img', zip: 'zip', csv: 'csv', html: 'html' };
  const extKind = (name) => EXT_KIND[fs.ext(name)] || 'other';

  /** Маленька кольорова позначка з розширенням (лише для файлів і лише якщо увімкнено в налаштуваннях). */
  function extBadge(n) {
    if (!n || n.type !== 'file') return null;
    const e = fs.ext(n.name);
    if (!e) return null;
    return el('span.ext-badge.k-' + extKind(n.name), { 'aria-hidden': 'true' }, '.' + e);
  }

  /** Кольорова «пігулка» з типом файла (для вікна «Що це?»): той самий колір, що й позначка. */
  function typeChip(n, text) {
    return el('span.ext-chip.k-' + extKind(n.name), text || typeName(n));
  }

  function typeName(n) {
    const e = fs.ext(n.name);
    return (EXT_TYPES[e] || 'Файл') + (e ? ' (.' + e + ')' : '');
  }

  function dropTargetOf(n) {
    if (n.type === 'folder') return n.id;
    if (n.id === 'link-trash') return 'trash';
    return null;
  }

  function renderItem(n, opts = {}) {
    const ico = renderIcon(n);
    if (n.type === 'link' && !n.system) ico.append(el('span.link-badge', { 'aria-hidden': 'true' }, VOS.icon('link')));
    if (VOS.settings.get('showExt')) { const b = extBadge(n); if (b) ico.append(b); }
    if (n.id === 'link-trash') {
      const cnt = fs.children('trash').length;
      if (cnt) ico.append(el('span.count-badge', String(cnt)));
    }
    const item = el('div.item', {
      tabindex: '-1',
      role: 'option',
      'aria-selected': 'false',
      'aria-label': n.name + (n.type === 'folder' ? ', папка' : n.type === 'link' ? ', ярлик' : ''),
      dataset: { id: n.id },
      title: opts.title || n.name,
    }, ico, el('div.item-label', n.name), el('button.item-actions', { type: 'button', 'aria-label': 'Дії: ' + n.name, title: 'Дії', dataset: { hint: 'item-actions' } }, VOS.icon('list')));
    const drop = dropTargetOf(n);
    if (drop) item.dataset.drop = drop;
    if (clipboard && clipboard.op === 'cut' && clipboard.id === n.id) item.classList.add('cut');
    return item;
  }

  /* ---------- Буфер обміну ---------- */
  let clipboard = null;
  function setClipboard(op, id) {
    const node = fs.get(id);
    if (!node || fs.isProtected(id) || fs.isInTrash(id)) return;
    clipboard = { op, id };
    bus.emit('clipboard:change', { op, id });
    bus.emit('clipboard:' + op, { node });
  }
  /** Спорожнити кишеню. Подія має форму { op: null, id: null }, щоб підписники могли безпечно читати поля. */
  function clearClipboard() {
    if (!clipboard) return;
    clipboard = null;
    bus.emit('clipboard:change', { op: null, id: null });
  }
  function paste(folder) {
    if (!clipboard) return null;
    const src = fs.get(clipboard.id);
    if (!src || fs.isInTrash(src.id)) { clearClipboard(); return null; }
    if (fs.get(folder)?.type !== 'folder' || folder === 'root' || folder === 'trash' || fs.isInTrash(folder)) return null;
    try {
      let res;
      if (clipboard.op === 'copy') res = fs.copy(src.id, folder);
      else {
        res = fs.move(src.id, folder);
        clearClipboard();
      }
      bus.emit('clipboard:paste', { node: res, folder });
      return res;
    } catch (e) {
      VOS.dialog.error(e.message);
      return null;
    }
  }

  /* ---------- Дії над об'єктами ---------- */
  async function askDelete(id) {
    const n = fs.get(id);
    if (!n) return;
    try {
      if (fs.isInTrash(id)) {
        const allowedForever = () => {
          const active = VOS.missions && VOS.missions.active;
          if (!active || !active.m || active.m.id !== 'trash') return fs.isInTrash(id);
          return active.ctx && active.ctx.state && active.ctx.state.file === id && fs.isInTrash(id);
        };
        if (!allowedForever()) { VOS.dialog.alert('У цьому завданні видали назавжди лише тренувальний файл.', { title: 'Кошик', icon: 'trash' }); return; }
        const yes = await VOS.dialog.confirm('Видалити «' + n.name + '» назавжди? Повернути вже не вийде.', { title: 'Видалення назавжди', okText: 'Видалити', danger: true, icon: 'alert' });
        if (yes && allowedForever()) fs.deleteForever(id);
      } else fs.trash(id);
    } catch (e) {
      VOS.dialog.error(e.message);
    }
  }

  async function askEmptyTrash() {
    const trainingOnly = () => VOS.missions && VOS.missions.active && VOS.missions.active.m && VOS.missions.active.m.id === 'trash';
    if (trainingOnly()) { VOS.dialog.alert('У цьому завданні видали лише тренувальний файл.', { title: 'Кошик', icon: 'trash' }); return; }
    const cnt = fs.children('trash').length;
    if (!cnt) { VOS.dialog.alert('Кошик і так порожній.', { title: 'Кошик', icon: 'trash' }); return; }
    const yes = await VOS.dialog.confirm('Видалити назавжди ' + cnt + ' ' + VOS.plural(cnt, 'об\'єкт', 'об\'єкти', 'об\'єктів') + ' з кошика?', { title: 'Очистити кошик', okText: 'Очистити', danger: true, icon: 'trash' });
    if (yes && trainingOnly()) { VOS.dialog.alert('У цьому завданні видали лише тренувальний файл.', { title: 'Кошик', icon: 'trash' }); return; }
    if (yes) fs.emptyTrash();
  }

  function startRename(container, id) {
    const n = fs.get(id);
    if (!n) return;
    if (fs.isSpecialFolder(id) || n.system) { VOS.dialog.error('Цей системний значок не можна перейменувати.'); return; }
    const item = container.querySelector('.item[data-id="' + id + '"]');
    if (!item || item.classList.contains('renaming')) return;
    const label = item.querySelector('.item-label');
    const input = el('textarea.rename-input', { rows: 1, spellcheck: false, 'aria-label': 'Нова назва' });
    input.value = n.name;
    label.replaceWith(input);
    item.classList.add('renaming');
    let finished = false;
    const grow = () => { input.style.height = 'auto'; const h = input.scrollHeight + input.offsetHeight - input.clientHeight; input.style.height = Math.min(h, 70) + 'px'; input.style.overflowY = h > 70 ? 'auto' : 'hidden'; };
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      document.removeEventListener('pointerdown', outsideDown, true);
      const val = input.value.replace(/\n/g, '').trim();
      item.classList.remove('renaming');
      if (commit && val !== n.name) {
        try { fs.rename(id, val); return; } catch (e) { VOS.dialog.error(e.message); }
      }
      input.replaceWith(label);
    };
    // Клік або дотик будь-де поза полем — підтвердити, як у Windows і macOS
    const outsideDown = (e) => { if (e.target !== input) finish(true); };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('input', grow);
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());
    setTimeout(() => { if (!finished) document.addEventListener('pointerdown', outsideDown, true); }, 0);
    input.focus();
    grow();
    const b = n.type === 'file' ? fs.baseName(n.name).length : n.name.length;
    input.setSelectionRange(0, b);
    bus.emit('ui:rename-start', { node: n });
  }

  async function createIn(container, folder, kind) {
    try {
      let n;
      if (kind === 'folder') n = fs.createFolder(folder, 'Нова папка');
      else if (kind === 'txt') n = fs.createFile(folder, 'Новий документ.txt', '');
      if (n) setTimeout(() => { select(container, n.id); startRename(container, n.id); }, 30);
    } catch (e) {
      VOS.dialog.error(e.message);
    }
  }

  /* ---------- Контекстне меню ---------- */
  let menuEl = null;
  function closeMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; }
    document.removeEventListener('pointerdown', outside, true);
  }
  function outside(e) { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }

  /** items: [{label, icon, action, disabled, danger, bold, sep, submenu, hint}] */
  function menu(x, y, items, eventData = {}) {
    closeMenu();
    const build = (list) => {
      const m = el('div.ctx-menu', { role: 'menu' });
      list.forEach((it) => {
        if (!it) return;
        if (it.sep) { m.append(el('div.ctx-sep')); return; }
        const b = el('button.ctx-item' + (it.danger ? '.danger' : '') + (it.bold ? '.bold' : ''), {
          type: 'button', role: 'menuitem', disabled: !!it.disabled, dataset: it.hint ? { hint: it.hint } : {},
        }, el('span.ctx-ico', it.icon ? VOS.ico(it.icon) : ''), el('span.ctx-label', it.label), it.submenu ? el('span.ctx-arrow', VOS.icon('chevron-right')) : null);
        if (it.submenu) {
          const sub = build(it.submenu);
          sub.classList.add('ctx-sub');
          const wrap = el('div.ctx-has-sub', b, sub);
          let openedByHover = false;
          const setOpen = (v) => { wrap.classList.toggle('open', v); fit(wrap); };
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            if (openedByHover) { openedByHover = false; setOpen(true); return; }
            setOpen(!wrap.classList.contains('open'));
          });
          wrap.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse') return;
            if (!wrap.classList.contains('open')) openedByHover = true;
            setOpen(true);
          });
          wrap.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setOpen(false); });
          m.append(wrap);
        } else {
          b.addEventListener('click', () => { closeMenu(); if (it.action) it.action(); });
          m.append(b);
        }
      });
      return m;
    };
    menuEl = build(items);
    menuEl.classList.add('ctx-root');
    document.body.append(menuEl);
    // Розміри беремо з offsetWidth/Height: getBoundingClientRect бреше, поки триває анімація появи (scale)
    function fit(wrap) {
      if (!menuEl) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = menuEl.offsetWidth, h = menuEl.offsetHeight;
      menuEl.style.left = Math.max(4, Math.min(x, vw - w - 4)) + 'px';
      menuEl.style.top = Math.max(4, Math.min(y, vh - h - 4)) + 'px';
      menuEl.classList.toggle('subs-left', menuEl.offsetLeft + w * 2 > vw);
      // Вилітне підменю не повинно виходити за нижній край
      const sub = wrap && wrap.querySelector('.ctx-sub');
      if (sub && wrap.classList.contains('open') && getComputedStyle(sub).position === 'absolute') {
        sub.style.top = '';
        const subTop = menuEl.offsetTop + wrap.offsetTop + sub.offsetTop;
        const over = subTop + sub.offsetHeight - (vh - 4);
        if (over > 0) sub.style.top = (sub.offsetTop - over) + 'px';
      }
    }
    fit();
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
    const first = menuEl.querySelector('.ctx-item:not([disabled])');
    if (first) first.focus({ preventScroll: true });
    bus.emit('ui:menu', eventData);
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuEl) closeMenu(); });
  window.addEventListener('resize', closeMenu);

  function itemMenu(container, id, x, y) {
    const n = fs.get(id);
    if (!n) return;
    const eventData = { target: 'item', id };
    const inTrash = fs.isInTrash(id);
    const prot = fs.isProtected(id);
    if (n.id === 'link-trash') {
      return menu(x, y, [
        { label: 'Відкрити', icon: 'folder-open', bold: true, action: () => VOS.apps.openNode(id) },
        { label: 'Очистити кошик', icon: 'trash-x', danger: true, hint: 'empty-trash', action: askEmptyTrash, disabled: !fs.children('trash').length },
        ...VOS.explain.sepAndItem(() => VOS.explain.forNode(fs.get(id))),
      ], eventData);
    }
    if (inTrash) {
      return menu(x, y, [
        { label: 'Відновити', icon: 'restore', bold: true, hint: 'restore', action: () => { try { fs.restore(id); } catch (e) { VOS.dialog.error(e.message); } } },
        { label: 'Видалити назавжди', icon: 'x', danger: true, hint: 'delete-forever', action: () => askDelete(id) },
        { sep: true },
        { label: 'Властивості', icon: 'info', action: () => VOS.dialog.properties(id) },
        VOS.explain.nodeItem(id),
      ], eventData);
    }
    menu(x, y, [
      { label: 'Відкрити', icon: 'folder-open', bold: true, action: () => VOS.apps.openNode(id) },
      n.type === 'file' && fs.ext(n.name) === 'zip' ? { label: 'Розпакувати', icon: 'archive', hint: 'extract-zip', action: () => VOS.transfer.extractZip(id) } : null,
      n.type !== 'link' && !prot ? { label: 'Створити ярлик на столі', icon: 'link', hint: 'create-shortcut', action: () => {
        try {
          const shortcut = fs.createShortcut(id);
          VOS.toast('Ярлик «' + shortcut.name + '» на робочому столі.', 'link');
        } catch (e) { VOS.dialog.error(e.message); }
      } } : null,
      { sep: true },
      { label: 'Вирізати', icon: 'scissors', hint: 'cut', disabled: prot, action: () => setClipboard('cut', id) },
      { label: 'Копіювати', icon: 'copy', hint: 'copy', disabled: fs.isSpecialFolder(id) || n.system, action: () => setClipboard('copy', id) },
      n.type === 'folder' ? { label: 'Вставити сюди', icon: 'clipboard', disabled: !clipboard, action: () => paste(id) } : null,
      { sep: true },
      { label: 'Перейменувати', icon: 'pencil', hint: 'rename', disabled: fs.isSpecialFolder(id) || n.system, action: () => startRename(container, id) },
      { label: 'Видалити', icon: 'trash', hint: 'delete', danger: true, disabled: prot, action: () => askDelete(id) },
      { sep: true },
      n.type !== 'link' ? { label: n.type === 'folder' ? 'Завантажити на комп\'ютер (.zip)' : 'Завантажити на комп\'ютер', icon: 'download', hint: 'export', action: () => VOS.transfer.exportNode(id) } : null,
      n.type === 'folder' ? { label: 'Додати сюди з комп\'ютера…', icon: 'upload', action: () => VOS.transfer.pickAndImport(id) } : null,
      { label: 'Властивості', icon: 'info', action: () => VOS.dialog.properties(id) },
      VOS.explain.nodeItem(id),
    ], eventData);
  }

  function backgroundMenu(container, folder, x, y, extra = []) {
    const eventData = { target: 'background', folder };
    if (folder === 'trash') {
      return menu(x, y, [
        { label: 'Відновити все', icon: 'restore', disabled: !fs.children('trash').length, action: () => fs.children('trash').forEach((c) => fs.restore(c.id)) },
        { label: 'Очистити кошик', icon: 'trash-x', danger: true, hint: 'empty-trash', disabled: !fs.children('trash').length, action: askEmptyTrash },
        ...(extra.length ? [{ sep: true }, ...extra] : []),
        { sep: true }, VOS.explain.backgroundItem(folder),
      ], eventData);
    }
    if (folder === 'root' || fs.isInTrash(folder)) return menu(x, y, [...extra, ...(extra.length ? [{ sep: true }] : []), VOS.explain.backgroundItem(folder)], eventData);
    menu(x, y, [
      { label: 'Створити', icon: 'plus', hint: 'create', submenu: [
        { label: 'Папку', icon: 'folder', hint: 'create-folder', action: () => createIn(container, folder, 'folder') },
        { label: 'Текстовий документ', icon: 'file-text', hint: 'create-txt', action: () => createIn(container, folder, 'txt') },
      ] },
      { label: 'Вставити', icon: 'clipboard', hint: 'paste', disabled: !clipboard, action: () => paste(folder) },
      { label: 'Додати з комп\'ютера…', icon: 'upload', hint: 'import', action: () => VOS.transfer.pickAndImport(folder) },
      { label: 'Додати ZIP як файл…', icon: 'archive', hint: 'import-archive', action: () => VOS.transfer.pickAndImport(folder, { keepArchive: true }) },
      ...(extra.length ? [{ sep: true }, ...extra] : []),
      { sep: true }, VOS.explain.backgroundItem(folder),
    ], eventData);
  }

  /* ---------- Виділення ---------- */
  function select(container, id, { focus = true, announce = true } = {}) {
    container.querySelectorAll('.item.selected').forEach((i) => {
      i.classList.remove('selected');
      i.setAttribute('aria-selected', 'false');
    });
    container.dataset.selected = id || '';
    if (!id) return;
    const it = container.querySelector('.item[data-id="' + id + '"]');
    if (it) {
      it.classList.add('selected');
      it.setAttribute('aria-selected', 'true');
      if (focus) it.focus({ preventScroll: !announce });
      if (announce) bus.emit('ui:select', { node: fs.get(id) });
    } else container.dataset.selected = '';
  }
  const selectedId = (container) => container.dataset.selected || null;

  /* ---------- Перетягування ---------- */
  let drag = null;
  document.addEventListener('touchmove', (e) => { if (drag && drag.lifted) e.preventDefault(); }, { passive: false });

  function dropTargetAt(x, y) {
    const t = document.elementFromPoint(x, y);
    if (!t) return null;
    const d = t.closest('[data-drop]');
    return d || null;
  }

  function startDrag(state, e) {
    const n = fs.get(state.id);
    if (!n || fs.isProtected(state.id)) return false;
    const src = state.item;
    const r = src.getBoundingClientRect();
    const ghost = src.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.classList.remove('selected', 'lifted');
    ghost.style.width = r.width + 'px';
    document.body.append(ghost);
    state.ghost = ghost;
    state.offX = e.clientX - r.left;
    state.offY = e.clientY - r.top;
    state.dragging = true;
    src.classList.add('dragging');
    document.body.classList.add('is-dragging');
    return true;
  }

  function moveGhost(state, e) {
    state.ghost.style.transform = `translate(${e.clientX - state.offX}px, ${e.clientY - state.offY}px)`;
    const t = dropTargetAt(e.clientX, e.clientY);
    const valid = t && t.dataset.drop !== state.id && !(t.dataset.drop && fs.isDescendant(t.dataset.drop, state.id));
    if (state.over && state.over !== t) state.over.classList.remove('drop-over');
    state.over = valid ? t : null;
    if (state.over) state.over.classList.add('drop-over');
    state.ghost.classList.toggle('copying', !!(e.ctrlKey || e.altKey) && !!state.over);
  }

  function endDrag(state, e, cancelled) {
    if (state.ghost) state.ghost.remove();
    state.item.classList.remove('dragging', 'lifted');
    document.body.classList.remove('is-dragging');
    if (state.over) state.over.classList.remove('drop-over');
    if (cancelled || !state.over) return;
    const target = state.over.dataset.drop;
    const n = fs.get(state.id);
    if (!n || target === n.id) return;
    try {
      if ((e.ctrlKey || e.altKey) && target !== 'trash') fs.copy(n.id, target);
      else if (target !== n.parent) {
        fs.move(n.id, target);
        bus.emit('ui:drop', { node: n, target });
      }
    } catch (err) {
      VOS.dialog.error(err.message);
    }
  }

  /**
   * Підключає поведінку значків до контейнера (робочий стіл або вікно Провідника).
   * opts: { folder: () => id, onBack?: fn, extraBgMenu?: () => items }
   */
  function bindItems(container, opts) {
    const folderOf = opts.folder;
    container.dataset.drop = folderOf();
    container.setAttribute('role', 'listbox');
    container.tabIndex = 0;
    let renameCandidate = null;

    const actionButton = opts.backgroundButton || el('button.bg-actions', { type: 'button', 'aria-label': 'Дії', title: 'Дії', dataset: { hint: container.id === 'desk-icons' ? 'desktop-actions' : 'explorer-actions' } }, VOS.icon('list'), el('span', 'Дії'));
    if (!opts.backgroundButton) container.append(actionButton);
    actionButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = actionButton.getBoundingClientRect();
      backgroundMenu(container, folderOf(), r.left, r.bottom, opts.extraBgMenu ? opts.extraBgMenu() : []);
    });
    container.addEventListener('click', (e) => {
      const candidate = renameCandidate;
      renameCandidate = null;
      // Окремий клік по виділеній назві. Швидке подвійне клацання обробить dblclick.
      if (candidate && e.detail === 1 && e.target.closest('.item-label')?.closest('.item') === candidate) {
        const id = candidate.dataset.id;
        if (selectedId(container) === id && fs.get(id) && !fs.isProtected(id) && !fs.isInTrash(id)) {
          startRename(container, id);
          return;
        }
      }
      const b = e.target.closest('.item-actions');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const item = b.closest('.item');
      select(container, item.dataset.id);
      const r = b.getBoundingClientRect();
      itemMenu(container, item.dataset.id, r.left, r.bottom);
    });
    const openItem = (id) => { bus.emit('ui:open', { node: fs.get(id) }); VOS.apps.openNode(id); };

    let lastPointer = 'mouse';
    container.addEventListener('pointerdown', (e) => {
      renameCandidate = null;
      lastPointer = e.pointerType;
      if (e.target.closest('.rename-input')) return;
      const item = e.target.closest('.item');
      if (e.target.closest('button, a, input, .ex-empty small')) return;
      if (!item || !container.contains(item)) {
        if (e.button !== 0) return;
        select(container, null);
        if (e.pointerType !== 'mouse') {
          // утримання пальця на порожньому місці — контекстне меню
          const sx = e.clientX, sy = e.clientY;
          const t = setTimeout(() => {
            off();
            if (navigator.vibrate) try { navigator.vibrate(12); } catch (er) { /* */ }
            backgroundMenu(container, folderOf(), sx, sy, opts.extraBgMenu ? opts.extraBgMenu() : []);
          }, 550);
          const mv = (ev) => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) off(); };
          const off = () => {
            clearTimeout(t);
            document.removeEventListener('pointermove', mv);
            document.removeEventListener('pointerup', off);
            document.removeEventListener('pointercancel', off);
          };
          document.addEventListener('pointermove', mv);
          document.addEventListener('pointerup', off);
          document.addEventListener('pointercancel', off);
        }
        return;
      }
      if (e.button === 2) { select(container, item.dataset.id); return; }
      if (e.button !== 0) return;
      const id = item.dataset.id;
      const touch = e.pointerType !== 'mouse';
      const renameClick = !touch && selectedId(container) === id && e.target.closest('.item-label')
        && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
      const state = { id, item, x: e.clientX, y: e.clientY, touch, lifted: false, dragging: false, pid: e.pointerId };
      drag = state;
      if (!touch) select(container, id);
      if (touch) {
        state.timer = setTimeout(() => {
          state.lifted = true;
          item.classList.add('lifted');
          select(container, id);
          if (navigator.vibrate) try { navigator.vibrate(12); } catch (er) { /* */ }
        }, 420);
      }

      const onMove = (ev) => {
        if (ev.pointerId !== state.pid) return;
        const dist = Math.hypot(ev.clientX - state.x, ev.clientY - state.y);
        if (state.touch && !state.lifted) {
          if (dist > 10) { clearTimeout(state.timer); cleanup(); } // це прокручування
          return;
        }
        if (!state.dragging) {
          if (dist < 6) return;
          if (!startDrag(state, ev)) { if (fs.isProtected(state.id) && !state.warned) state.warned = true; return; }
        }
        moveGhost(state, ev);
      };
      const onUp = (ev) => {
        if (ev.pointerId !== state.pid) return;
        clearTimeout(state.timer);
        cleanup();
        if (state.dragging) { endDrag(state, ev, ev.type === 'pointercancel'); return; }
        if (ev.type === 'pointercancel') { item.classList.remove('lifted'); return; }
        if (state.touch) {
          if (state.lifted) {
            item.classList.remove('lifted');
            itemMenu(container, id, ev.clientX, ev.clientY);
          } else {
            select(container, id);
            openItem(id);
          }
        } else if (VOS.settings.get('singleClick')) {
          openItem(id);
        } else if (renameClick) {
          renameCandidate = item;
        }
      };
      const cleanup = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        if (drag === state && !state.dragging) drag = null;
        setTimeout(() => { if (drag === state) drag = null; }, 0);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });

    container.addEventListener('dblclick', (e) => {
      if (e.target.closest('button, a, input')) return;
      const item = e.target.closest('.item');
      if (!item || item.classList.contains('renaming') || VOS.settings.get('singleClick') || lastPointer !== 'mouse') return;
      openItem(item.dataset.id);
    });

    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (lastPointer !== 'mouse') return; // на сенсорних екранах меню відкриває утримання (див. вище)
      if (e.target.closest('.rename-input')) return;
      const item = e.target.closest('.item');
      if (item && container.contains(item)) {
        select(container, item.dataset.id);
        itemMenu(container, item.dataset.id, e.clientX, e.clientY);
      } else {
        select(container, null);
        backgroundMenu(container, folderOf(), e.clientX, e.clientY, opts.extraBgMenu ? opts.extraBgMenu() : []);
      }
    });

    container.addEventListener('keydown', (e) => {
      if (e.target.closest('button, .rename-input')) return;
      const selected = selectedId(container);
      const sel = fs.get(selected) ? selected : null;
      const items = [...container.querySelectorAll('.item')];
      const idx = items.findIndex((i) => i.dataset.id === sel);
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Enter' && sel) { e.preventDefault(); openItem(sel); }
      else if (e.key === 'Delete' && sel) { e.preventDefault(); askDelete(sel); }
      else if (e.key === 'F2' && sel) { e.preventDefault(); startRename(container, sel); }
      else if (ctrl && e.code === 'KeyC' && sel) { e.preventDefault(); setClipboard('copy', sel); }
      else if (ctrl && e.code === 'KeyX' && sel) { e.preventDefault(); setClipboard('cut', sel); }
      else if (ctrl && e.code === 'KeyV') { e.preventDefault(); paste(folderOf()); }
      else if (e.key === 'Backspace' && opts.onBack) { e.preventDefault(); opts.onBack(); }
      else if (/^Arrow/.test(e.key) && items.length) {
        e.preventDefault();
        let next = idx < 0 ? 0 : idx;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(items.length - 1, idx + 1);
        else next = Math.max(0, idx - 1);
        select(container, items[next].dataset.id);
      }
    });
  }

  VOS.ui = {
    iconFor, renderIcon, typeName, renderItem, bindItems, select, selectedId, startRename, createIn, menu, closeMenu,
    itemMenu, backgroundMenu, askDelete, askEmptyTrash, paste, setClipboard, clearClipboard, extBadge, typeChip, extKind,
    get clipboard() { return clipboard; },
  };
})();
