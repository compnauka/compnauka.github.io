/* Віконце — модальні діалоги: повідомлення, питання, введення назви, «Зберегти як…», «Відкрити…», властивості. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, fs, bus } = VOS;

  function modal(buildFn, { title = 'Віконце', icon = 'info', wide = false, className = '' } = {}) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement;
      const overlay = el('div.modal-overlay');
      const box = el('div.dialog' + (wide ? '.dialog-wide' : '') + (className ? '.' + className : ''), { role: 'alertdialog', 'aria-modal': 'true', 'aria-label': title });
      const close = (val) => {
        overlay.remove();
        document.removeEventListener('keydown', onKey, true);
        if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* */ }
        resolve(val);
      };
      const head = el('div.dialog-head', el('span.dialog-icon' + (icon === 'alert' ? '.warn' : ''), VOS.ico(icon)), el('span.dialog-title', title),
        el('button.win-btn.win-close', { type: 'button', 'aria-label': 'Закрити', on: { click: () => close(undefined) } }, VOS.icon('x')));
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
        if (e.key === 'Escape') { e.stopPropagation(); close(undefined); }
        else if (e.key === 'Enter' && api.onEnter && !(e.target && e.target.tagName === 'TEXTAREA')) { e.preventDefault(); e.stopPropagation(); api.onEnter(); }
      };
      document.addEventListener('keydown', onKey, true);
      buildFn(api);
      document.body.append(overlay);
      box.animate([{ opacity: 0, transform: 'translateY(10px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
      const f = box.querySelector('[autofocus]') || foot.querySelector('.btn-primary') || foot.querySelector('button');
      if (f) setTimeout(() => f.focus(), 30);
    });
  }

  const btn = (label, cls, onClick) => el('button.btn' + (cls ? '.' + cls : ''), { type: 'button', on: { click: onClick } }, label);

  function alert(message, opts = {}) {
    if (opts.icon === 'alert' || opts.error) VOS.sound.play('error');
    return modal((d) => {
      d.content.append(el('p.dialog-msg', message));
      d.foot.append(btn('Добре', 'btn-primary', () => d.close(true)));
      d.onEnter = () => d.close(true);
    }, { title: opts.title || 'Повідомлення', icon: opts.icon || 'info' });
  }

  function error(message, title = 'Ой!') {
    return alert(message, { title, icon: 'alert', error: true });
  }

  function confirm(message, opts = {}) {
    return modal((d) => {
      d.content.append(el('p.dialog-msg', message));
      d.foot.append(
        btn(opts.okText || 'Так', opts.danger ? 'btn-danger' : 'btn-primary', () => d.close(true)),
        btn(opts.cancelText || 'Скасувати', '', () => d.close(false))
      );
      d.onEnter = () => d.close(true);
    }, { title: opts.title || 'Питання', icon: opts.icon || 'help' }).then((v) => !!v);
  }

  /** buttons: [{label, value, primary, danger}] */
  function choice(message, buttons, opts = {}) {
    return modal((d) => {
      d.content.append(el('p.dialog-msg', message));
      buttons.forEach((b) => d.foot.append(btn(b.label, b.primary ? 'btn-primary' : b.danger ? 'btn-danger' : '', () => d.close(b.value))));
      const p = buttons.find((b) => b.primary);
      if (p) d.onEnter = () => d.close(p.value);
    }, { title: opts.title || 'Питання', icon: opts.icon || 'help' });
  }

  function prompt(message, opts = {}) {
    return modal((d) => {
      const input = el('input.input', { type: 'text', value: opts.value || '', autofocus: true, maxlength: opts.maxlength || 60, 'aria-label': message });
      d.content.append(el('label.dialog-msg', message), input);
      const ok = () => d.close(input.value);
      d.foot.append(btn(opts.okText || 'Готово', 'btn-primary', ok), btn('Скасувати', '', () => d.close(null)));
      d.onEnter = ok;
      setTimeout(() => { input.focus(); input.select(); }, 40);
    }, { title: opts.title || 'Введи назву', icon: opts.icon || 'pencil' }).then((v) => (v == null ? null : v));
  }

  /* ---------- Вибір файлу ---------- */
  const PLACES = [
    { id: 'desktop', label: 'Робочий стіл', icon: 'monitor' },
    { id: 'docs', label: 'Документи', icon: 'books' },
    { id: 'pics', label: 'Малюнки', icon: 'image' },
  ];

  function filePicker(mode, opts) {
    const exts = opts.exts || (opts.ext ? [opts.ext] : null);
    let folder = opts.folder && fs.get(opts.folder) && !fs.isInTrash(opts.folder) ? opts.folder : (opts.defaultFolder || 'docs');
    let selected = null;
    return modal((d) => {
      const places = el('div.fp-places');
      const crumbs = el('div.fp-crumbs');
      const list = el('div.fp-list', { role: 'listbox' });
      const nameInput = el('input.input', { type: 'text', value: opts.name || '', 'aria-label': 'Назва файлу', maxlength: 60 });
      const upBtn = btn(VOS.icon('arrow-up'), 'btn-icon', () => { const n = fs.get(folder); if (n && n.parent && n.parent !== null && fs.get(n.parent)) { folder = n.parent; render(); } });
      upBtn.title = 'На рівень вгору';
      const newFolderBtn = btn([VOS.icon('folder-plus'), ' Нова папка'], 'btn-small', async () => {
        const name = await prompt('Як назвати нову папку?', { value: 'Нова папка', title: 'Нова папка', icon: 'folder' });
        if (name == null) return;
        try { const f = fs.createFolder(folder, name); folder = f.id; render(); } catch (e) { error(e.message); }
      });
      const typeHint = exts ? el('div.fp-type', 'Тип файлу: ' + exts.map((e) => '.' + e).join(', ')) : null;

      PLACES.forEach((p) => places.append(el('button.fp-place', { type: 'button', dataset: { id: p.id }, on: { click: () => { folder = p.id; render(); } } }, VOS.icon(p.icon), ' ', p.label)));

      function render() {
        crumbs.innerHTML = '';
        fs.ancestors(folder).forEach((n, i, a) => {
          crumbs.append(el('button.crumb', { type: 'button', on: { click: () => { folder = n.id; render(); } } }, n.name));
          if (i < a.length - 1) crumbs.append(el('span.crumb-sep', '›'));
        });
        requestAnimationFrame(() => { crumbs.scrollLeft = crumbs.scrollWidth; });
        places.querySelectorAll('.fp-place').forEach((b) => b.classList.toggle('active', b.dataset.id === folder));
        list.innerHTML = '';
        const items = fs.children(folder).filter((n) => n.type === 'folder' || (n.type === 'file' && (!exts || exts.includes(fs.ext(n.name)))));
        if (!items.length) list.append(el('div.fp-empty', 'Тут поки порожньо'));
        items.forEach((n) => {
          const row = el('button.fp-item' + (n.type === 'folder' ? '.is-folder' : ''), { type: 'button', role: 'option', dataset: { id: n.id } },
            el('span.fp-ico', VOS.icon(VOS.ui.iconFor(n))), el('span.fp-name', n.name));
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
        if (mode === 'open') {
          if (!selected) { error('Спочатку вибери файл у списку.'); return; }
          d.close(selected);
          return;
        }
        let name = nameInput.value.trim();
        try { name = fs.validateName(name); } catch (e) { error(e.message); return; }
        if (opts.ext && fs.ext(name) !== opts.ext) name += '.' + opts.ext;
        const existing = fs.findByName(folder, name);
        if (existing) {
          if (existing.type !== 'file') { error('Тут уже є папка з такою назвою.'); return; }
          const yes = await confirm('Файл «' + name + '» уже є. Замінити його?', { title: 'Заміна файлу', okText: 'Замінити', danger: true, icon: 'alert' });
          if (!yes) return;
          d.close({ folder, name, replaceId: existing.id });
          return;
        }
        d.close({ folder, name });
      }

      d.onEnter = ok;
      d.content.append(
        el('div.fp-top', upBtn, crumbs, newFolderBtn),
        el('div.fp-main', places, list),
        mode === 'save' ? el('label.fp-name-row', el('span', 'Назва файлу:'), nameInput) : null,
        typeHint
      );
      d.foot.append(btn(mode === 'save' ? 'Зберегти' : 'Відкрити', 'btn-primary', ok), btn('Скасувати', '', () => d.close(null)));
      render();
      if (mode === 'save') setTimeout(() => { nameInput.focus(); const b = fs.baseName(nameInput.value); nameInput.setSelectionRange(0, b.length); }, 40);
    }, { title: opts.title || (mode === 'save' ? 'Зберегти як' : 'Відкрити'), icon: mode === 'save' ? 'save' : 'folder-open', wide: true, className: 'file-picker' })
      .then((v) => (v === undefined ? null : v));
  }

  const saveAs = (opts = {}) => filePicker('save', opts).then((r) => { if (r) bus.emit('dialog:saveas', r); return r; });
  const openFile = (opts = {}) => filePicker('open', opts);

  /* ---------- Властивості ---------- */
  function properties(id) {
    const n = fs.get(id);
    if (!n) return;
    const typeName = n.type === 'folder' ? 'Папка' : n.type === 'link' ? 'Ярлик програми' : VOS.ui.typeName(n);
    const rows = [
      ['Тип', typeName],
      ['Розташування', n.parent ? fs.pathString(n.parent) : '—'],
      ['Розмір', VOS.fmtSize(fs.sizeOf(id))],
    ];
    if (n.type === 'folder') {
      const c = fs.children(id);
      const files = c.filter((x) => x.type !== 'folder').length, folders = c.length - files;
      rows.push(['Містить', files + ' ' + VOS.plural(files, 'файл', 'файли', 'файлів') + ', ' + folders + ' ' + VOS.plural(folders, 'папку', 'папки', 'папок')]);
    }
    if (n.type === 'link') rows.push(['Відкриває', VOS.apps.name(n.app)]);
    rows.push(['Створено', VOS.fmtDate(n.created)], ['Змінено', VOS.fmtDate(n.modified)]);
    bus.emit('dialog:properties', { node: n });
    return modal((d) => {
      d.content.append(
        el('div.props-head', el('span.props-ico', VOS.ui.renderIcon(n)), el('strong', n.name)),
        el('table.props', rows.map(([k, v]) => el('tr', el('th', k), el('td', v))))
      );
      d.foot.append(btn('Добре', 'btn-primary', () => d.close(true)));
      d.onEnter = () => d.close(true);
    }, { title: 'Властивості: ' + n.name, icon: 'clipboard' });
  }

  VOS.dialog = { modal, alert, error, confirm, choice, prompt, saveAs, openFile, properties };
})();
