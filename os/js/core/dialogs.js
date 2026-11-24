/* Віконце — модальні діалоги: повідомлення, питання, введення назви, «Зберегти як…», «Відкрити…», властивості. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs, bus } = VOS;
  const modals = [];

  function modal(buildFn, { title = tr('Віконце'), icon = 'info', wide = false, className = '' } = {}) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement;
      const overlay = el('div.modal-overlay');
      const box = el('div.dialog' + (wide ? '.dialog-wide' : '') + (className ? '.' + className : ''), { role: 'alertdialog', 'aria-modal': 'true', 'aria-label': title });
      const close = (val) => {
        if (modals.at(-1) !== overlay) return;
        modals.pop();
        overlay.remove();
        document.removeEventListener('keydown', onKey, true);
        if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* */ }
        resolve(val);
      };
      const head = el('div.dialog-head', el('span.dialog-icon' + (icon === 'alert' ? '.warn' : ''), VOS.ico(icon)), el('span.dialog-title', title),
        el('button.win-btn.win-close', { type: 'button', 'aria-label': tr('Закрити'), on: { click: () => close(undefined) } }, VOS.icon('x')));
      const content = el('div.dialog-body');
      const foot = el('div.dialog-foot');
      box.append(head, content, foot);
      overlay.append(box);
      overlay.addEventListener('pointerdown', (e) => {
        if (e.target === overlay) {
          box.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], 200);
          VOS.sound.play('error');
        }
      });
      const api = { close, content, foot, box };
      const onKey = (e) => {
        if (modals.at(-1) !== overlay) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(undefined); }
        else if (e.key === 'Tab') {
          const controls = [...box.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')].filter((node) => node.getClientRects().length);
          const edge = e.shiftKey ? controls[0] : controls.at(-1);
          if (!box.contains(e.target) || e.target === edge) {
            e.preventDefault();
            (e.shiftKey ? controls.at(-1) : controls[0])?.focus();
          }
        }
        else if (e.key === 'Enter' && api.onEnter && !e.target.closest?.('button, textarea, a, select, [contenteditable]')) {
          e.preventDefault(); e.stopImmediatePropagation();
          if (box.contains(e.target)) api.onEnter();
        }
      };
      document.addEventListener('keydown', onKey, true);
      buildFn(api);
      modals.push(overlay);
      document.body.append(overlay);
      box.animate([{ opacity: 0, transform: 'translateY(10px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
      const f = box.querySelector('[autofocus]') || foot.querySelector('.btn-primary') || foot.querySelector('button:not(.btn-danger)') || head.querySelector('button');
      if (f) setTimeout(() => { if (modals.at(-1) === overlay) f.focus(); }, 30);
    });
  }

  const btn = (label, cls, onClick) => el('button.btn' + (cls ? '.' + cls : ''), { type: 'button', on: { click: onClick } }, label);

  function alert(message, opts = {}) {
    if (opts.icon === 'alert' || opts.error) VOS.sound.play('error');
    return modal((d) => {
      d.content.append(el('p.dialog-msg', message));
      d.foot.append(btn(tr('Добре'), 'btn-primary', () => d.close(true)));
      d.onEnter = () => d.close(true);
    }, { title: opts.title || tr('Повідомлення'), icon: opts.icon || 'info' });
  }

  function error(message, title = tr('Ой!')) {
    return alert(message, { title, icon: 'alert', error: true });
  }

  function confirm(message, opts = {}) {
    return modal((d) => {
      d.content.append(el('p.dialog-msg', message));
      d.foot.append(
        btn(opts.okText || tr('Так'), opts.danger ? 'btn-danger' : 'btn-primary', () => d.close(true)),
        btn(opts.cancelText || tr('Скасувати'), '', () => d.close(false))
      );
      d.onEnter = () => d.close(true);
    }, { title: opts.title || tr('Питання'), icon: opts.icon || 'help' }).then((v) => !!v);
  }

  /** buttons: [{label, value, primary, danger}] */
  function choice(message, buttons, opts = {}) {
    return modal((d) => {
      d.content.append(el('p.dialog-msg', message));
      buttons.forEach((b) => d.foot.append(btn(b.label, b.primary ? 'btn-primary' : b.danger ? 'btn-danger' : '', () => d.close(b.value))));
      const p = buttons.find((b) => b.primary);
      if (p) d.onEnter = () => d.close(p.value);
    }, { title: opts.title || tr('Питання'), icon: opts.icon || 'help' });
  }

  function prompt(message, opts = {}) {
    return modal((d) => {
      const input = el('input.input', { type: 'text', value: opts.value || '', autofocus: true, maxlength: opts.maxlength || 60, 'aria-label': message });
      d.content.append(el('label.dialog-msg', message), input);
      const ok = () => d.close(input.value);
      d.foot.append(btn(opts.okText || tr('Готово'), 'btn-primary', ok), btn(tr('Скасувати'), '', () => d.close(null)));
      d.onEnter = ok;
      setTimeout(() => { input.focus(); input.select(); }, 40);
    }, { title: opts.title || tr('Введи назву'), icon: opts.icon || 'pencil' }).then((v) => (v == null ? null : v));
  }

  /* ---------- Вибір файлу ---------- */
  const PLACES = [
    { id: 'desktop', label: tr('Робочий стіл'), icon: 'monitor' },
    { id: 'docs', label: tr('Документи'), icon: 'books' },
    { id: 'pics', label: tr('Малюнки'), icon: 'image' },
  ];

  function filePicker(mode, opts) {
    const exts = opts.exts || (opts.ext ? [opts.ext] : null);
    const available = (id) => fs.get(id)?.type === 'folder' && id !== 'trash' && !fs.isInTrash(id);
    let folder = available(opts.folder) ? opts.folder : (opts.defaultFolder || 'docs');
    let selected = null;
    return modal((d) => {
      const places = el('div.fp-places');
      const crumbs = el('div.fp-crumbs');
      const list = el('div.fp-list', { role: 'listbox' });
      const nameInput = el('input.input', { type: 'text', value: opts.name || '', 'aria-label': tr('Назва файлу'), maxlength: 60 });
      const upBtn = btn(VOS.icon('arrow-up'), 'btn-icon', () => { const n = fs.get(folder); if (n && n.parent && n.parent !== null && fs.get(n.parent)) { folder = n.parent; render(); } });
      upBtn.title = tr('На рівень вгору');
      const newFolderBtn = btn([VOS.icon('folder-plus'), tr(' Нова папка')], 'btn-small', async () => {
        const name = await prompt(tr('Як назвати нову папку?'), { value: tr('Нова папка'), title: tr('Нова папка'), icon: 'folder' });
        if (name == null) return;
        try { const f = fs.createFolder(folder, name); folder = f.id; render(); } catch (e) { error(e.message); }
      });
      const typeHint = exts ? el('div.fp-type', tr('Тип файлу: ') + exts.map((e) => '.' + e).join(', ')) : null;

      PLACES.forEach((p) => places.append(el('button.fp-place', { type: 'button', dataset: { id: p.id }, on: { click: () => { folder = p.id; render(); } } }, VOS.icon(p.icon), ' ', p.label)));

      function render() {
        selected = null;
        crumbs.innerHTML = '';
        fs.ancestors(folder).forEach((n, i, a) => {
          crumbs.append(el('button.crumb', { type: 'button', on: { click: () => { folder = n.id; render(); } } }, fs.label(n)));
          if (i < a.length - 1) crumbs.append(el('span.crumb-sep', '›'));
        });
        requestAnimationFrame(() => { crumbs.scrollLeft = crumbs.scrollWidth; });
        places.querySelectorAll('.fp-place').forEach((b) => b.classList.toggle('active', b.dataset.id === folder));
        list.innerHTML = '';
        const items = fs.children(folder).filter((n) => n.type === 'folder' || (n.type === 'file' && (!exts || exts.includes(fs.ext(n.name)))));
        if (!items.length) list.append(el('div.fp-empty', tr('Тут поки порожньо')));
        items.forEach((n) => {
          const row = el('button.fp-item' + (n.type === 'folder' ? '.is-folder' : ''), { type: 'button', role: 'option', dataset: { id: n.id } },
            el('span.fp-ico', VOS.icon(VOS.ui.iconFor(n))), el('span.fp-name', fs.label(n)));
          row.addEventListener('click', () => {
            if (n.type === 'folder') { folder = n.id; selected = null; render(); return; }
            selected = n.id;
            list.querySelectorAll('.fp-item').forEach((r) => r.classList.toggle('selected', r === row));
            if (mode === 'save') nameInput.value = n.name;
          });
          row.addEventListener('dblclick', () => { if (n.type === 'file') { selected = n.id; ok(); } });
          list.append(row);
        });
      }

      async function ok() {
        if (!available(folder)) { folder = 'docs'; render(); error(tr('Ця папка більше недоступна. Обери іншу.')); return; }
        if (mode === 'open') {
          const file = fs.get(selected);
          if (!file || file.parent !== folder || (exts && !exts.includes(fs.ext(file.name)))) { error(tr('Спочатку вибери файл у списку.')); return; }
          d.close(selected);
          return;
        }
        let name = nameInput.value.trim();
        try {
          name = fs.validateName(name);
          if (opts.ext && fs.ext(name) !== opts.ext) name = fs.validateName(name + '.' + opts.ext);
        } catch (e) { error(e.message); return; }
        const existing = fs.findByName(folder, name);
        if (existing) {
          if (existing.type !== 'file') { error(tr('Тут уже є папка з такою назвою.')); return; }
          const yes = await confirm(tr('Файл «') + name + tr('» уже є. Замінити його?'), { title: tr('Заміна файлу'), okText: tr('Замінити'), danger: true, icon: 'alert' });
          if (!yes) return;
          if (!available(folder) || fs.findByName(folder, name)?.id !== existing.id) { error(tr('Файл для заміни змінився. Вибери його знову.')); return; }
          d.close({ folder, name, replaceId: existing.id });
          return;
        }
        d.close({ folder, name });
      }

      d.onEnter = ok;
      d.content.append(...[
        el('div.fp-top', upBtn, crumbs, newFolderBtn),
        el('div.fp-main', places, list),
        mode === 'save' ? el('label.fp-name-row', el('span', tr('Назва файлу:')), nameInput) : null,
        typeHint,
      ].filter(Boolean)); // append() перетворює null на текст «null»
      d.foot.append(btn(mode === 'save' ? tr('Зберегти') : tr('Відкрити'), 'btn-primary', ok), btn(tr('Скасувати'), '', () => d.close(null)));
      render();
      if (mode === 'save') setTimeout(() => { nameInput.focus(); const b = fs.baseName(nameInput.value); nameInput.setSelectionRange(0, b.length); }, 40);
    }, { title: opts.title || (mode === 'save' ? tr('Зберегти як') : tr('Відкрити')), icon: mode === 'save' ? 'save' : 'folder-open', wide: true, className: 'file-picker' })
      .then((v) => (v === undefined ? null : v));
  }

  const saveAs = (opts = {}) => filePicker('save', opts).then((r) => { if (r) bus.emit('dialog:saveas', r); return r; });
  const openFile = (opts = {}) => filePicker('open', opts);

  /* ---------- Властивості ---------- */
  function properties(id) {
    const n = fs.get(id);
    if (!n) return;
    const typeName = n.type === 'folder' ? tr('Папка') : n.type === 'link' ? tr('Ярлик програми') : VOS.ui.typeName(n);
    const rows = [
      [tr('Тип'), typeName],
      [tr('Розташування'), n.parent ? fs.pathString(n.parent) : '—'],
      [tr('Розмір'), VOS.fmtSize(fs.sizeOf(id))],
    ];
    if (n.type === 'folder') {
      const c = fs.children(id);
      const files = c.filter((x) => x.type !== 'folder').length, folders = c.length - files;
      rows.push([tr('Містить'), files + ' ' + VOS.plural(files, tr('файл'), tr('файли'), tr('файлів')) + ', ' + folders + ' ' + VOS.plural(folders, tr('папку'), tr('папки'), tr('папок'))]);
    }
    if (n.type === 'link') rows.push([tr('Відкриває'), VOS.apps.name(n.app)]);
    rows.push([tr('Створено'), VOS.fmtDate(n.created)], [tr('Змінено'), VOS.fmtDate(n.modified)]);
    bus.emit('dialog:properties', { node: n });
    return modal((d) => {
      d.content.append(
        el('div.props-head', el('span.props-ico', VOS.ui.renderIcon(n)), el('strong', fs.label(n))),
        el('table.props', rows.map(([k, v]) => el('tr', el('th', k), el('td', v))))
      );
      d.foot.append(btn(tr('Добре'), 'btn-primary', () => d.close(true)));
      d.onEnter = () => d.close(true);
    }, { title: tr('Властивості: ') + fs.label(n), icon: 'clipboard' });
  }

  VOS.dialog = { modal, alert, error, confirm, choice, prompt, saveAs, openFile, properties };
})();
