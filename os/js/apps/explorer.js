/* Віконце — програма «Файли» (Комп'ютер, папки, Кошик). У Windows схожа програма зветься «Провідник». */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, fs, bus } = VOS;

  const PLACES = [
    { id: 'desktop', label: 'Робочий стіл', icon: 'folder-desktop' },
    { id: 'docs', label: 'Документи', icon: 'folder-docs' },
    { id: 'pics', label: 'Малюнки', icon: 'folder-pics' },
    { id: 'trash', label: 'Кошик', icon: 'trash' },
  ];

  function launch(args) {
    let folder = args.folder && fs.get(args.folder) ? args.folder : 'root';
    const history = [folder];
    let hpos = 0;
    let view = 'icons';

    const btnBack = el('button.tb-btn', { type: 'button', title: 'Назад', 'aria-label': 'Назад' }, VOS.icon('chevron-left'));
    const crumbs = el('nav.ex-crumbs', { 'aria-label': 'Шлях до папки' });
    const btnActions = el('button.bg-actions', { type: 'button', 'aria-label': 'Дії', title: 'Дії', dataset: { hint: 'explorer-actions' } }, VOS.icon('list'), el('span', 'Дії'));
    const toolbar = el('div.ex-toolbar', btnBack, crumbs, btnActions);
    const searchInput = el('input.ex-search-input', { type: 'search', placeholder: 'Знайти файл або папку', 'aria-label': 'Знайти файл або папку', autocomplete: 'off', dataset: { hint: 'ex-search' } });
    const clearSearch = el('button.ex-search-clear', { type: 'button', hidden: true, 'aria-label': 'Очистити пошук', title: 'Очистити пошук' }, VOS.icon('x'));
    const search = el('div.ex-search', VOS.icon('search'), searchInput, clearSearch);
    const side = el('nav.ex-side', { 'aria-label': 'Місця' });
    const items = el('div.ex-items.items-bg');
    const results = el('div.ex-results', { hidden: true, 'aria-label': 'Результати пошуку' });
    const status = el('div.ex-status', { 'aria-live': 'polite' });
    const root = el('div.app-explorer', toolbar, search, el('div.ex-main', side, items, results), status);

    PLACES.forEach((p) => {
      const b = el('button.ex-place', {
        type: 'button', 'aria-label': p.label, title: p.label,
        dataset: { id: p.id, drop: p.id, hint: 'place-' + p.id },
      }, el('span.ex-place-ico', VOS.icon(p.icon)), el('span', p.label));
      b.addEventListener('click', () => go(p.id));
      side.append(b);
    });

    function go(id, fromHistory) {
      if (!fs.get(id)) id = 'root';
      folder = id;
      searchInput.value = '';
      if (!fromHistory) {
        history.splice(hpos + 1);
        history.push(id);
        hpos = history.length - 1;
      }
      render();
      bus.emit('explorer:open', { folder: id, winId: win.id });
    }

    function renderSearch() {
      const query = searchInput.value.trim();
      clearSearch.hidden = !searchInput.value;
      items.hidden = !!query;
      results.hidden = !query;
      if (!query) {
        results.replaceChildren();
        const count = fs.children(folder).length;
        status.textContent = count + ' ' + VOS.plural(count, "об'єкт", "об'єкти", "об'єктів") + (folder === 'trash' && count ? ' у кошику' : '');
        return;
      }

      const matches = fs.searchByName(folder, query);
      results.replaceChildren(el('p.ex-search-scope', 'Шукаємо в «' + fs.get(folder).name + '» та її підпапках.'));
      if (!matches.length) results.append(el('p.ex-search-empty', 'Нічого не знайшлося. Спробуй іншу назву.'));
      for (const node of matches) {
        const openItem = el('button.ex-result-open', { type: 'button', title: 'Відкрити ' + node.name, on: { click: () => VOS.apps.openNode(node.id) } },
          VOS.ui.renderIcon(node, 'ex-result-icon'), el('span.ex-result-name', node.name));
        const reveal = el('button.ex-result-reveal', {
          type: 'button', title: 'Показати, де лежить «' + node.name + '»', 'aria-label': 'Відкрити папку для «' + node.name + '»', dataset: { hint: 'ex-reveal' },
          on: { click: () => {
            const current = fs.get(node.id);
            if (!current || !fs.get(current.parent)) { render(); return; }
            go(current.parent);
            VOS.ui.select(items, current.id);
            bus.emit('explorer:reveal', { fileId: current.id, folder: current.parent, winId: win.id });
          } },
        }, VOS.icon('folder-open'), el('span', 'Відкрити папку'));
        results.append(el('div.ex-result', { dataset: { id: node.id } }, openItem, el('small.ex-result-path', fs.pathString(node.parent)), reveal));
      }
      status.textContent = 'Знайдено: ' + matches.length;
    }

    function render() {
      const node = fs.get(folder);
      if (!node) { go('root'); return; }
      win.setTitle(node.name);
      win.setIcon(VOS.ui.iconFor(node));
      items.dataset.drop = folder;
      if (folder === 'root') delete items.dataset.drop;
      btnBack.disabled = hpos <= 0;
      side.querySelectorAll('.ex-place').forEach((b) => b.classList.toggle('active', b.dataset.id === folder));
      side.querySelector('[data-id="trash"] .ex-place-ico').replaceChildren(VOS.icon(fs.children('trash').length ? 'trash-full' : 'trash'));

      crumbs.innerHTML = '';
      fs.ancestors(folder).forEach((n, i, a) => {
        if (i === a.length - 1) crumbs.append(el('span.ex-current-folder', { 'aria-current': 'location' }, n.name));
        else crumbs.append(el('button.crumb', { type: 'button', on: { click: () => go(n.id) } }, n.name), el('span.crumb-sep', { 'aria-hidden': 'true' }, '›'));
      });
      requestAnimationFrame(() => { crumbs.scrollLeft = crumbs.scrollWidth; });

      const sel = VOS.ui.selectedId(items);
      const focus = !!document.activeElement?.closest('.item') && items.contains(document.activeElement);
      items.innerHTML = '';
      items.classList.toggle('view-list', view === 'list');
      const list = fs.children(folder);
      if (!list.length) {
        items.append(el('div.ex-empty', VOS.icon(folder === 'trash' ? 'trash' : 'folder', 56), el('b', folder === 'trash' ? 'Кошик порожній' : 'Ця папка порожня'), fs.isInTrash(folder) || folder === 'trash' ? null : el('small', 'У меню «Дії» можна створити папку або додати файл.')));
      }
      list.forEach((n) => {
        const it = VOS.ui.renderItem(n);
        if (view === 'list') {
          it.append(el('div.item-meta', n.type === 'folder' ? 'Папка' : n.type === 'link' ? 'Ярлик' : VOS.ui.typeName(n)),
            el('div.item-meta', n.type === 'file' ? VOS.fmtSize(fs.sizeOf(n.id)) : ''),
            el('div.item-meta', VOS.fmtDate(n.modified)));
        }
        if (folder === 'trash') {
          it.title = n.name + '\nЗвідки: ' + (n.origParent && fs.get(n.origParent) ? fs.pathString(n.origParent) : 'Робочий стіл');
        }
        items.append(it);
      });
      renderSearch();
      const selected = !items.hidden && fs.get(sel)?.parent === folder ? sel : null;
      VOS.ui.select(items, selected, { focus, announce: false });
      if (focus && !selected && !items.hidden) items.focus();
    }

    searchInput.addEventListener('input', () => {
      renderSearch();
      const query = searchInput.value.trim();
      if (query) bus.emit('explorer:search', { folder, query, winId: win.id });
    });
    function resetSearch() {
      searchInput.value = '';
      renderSearch();
      searchInput.focus();
    }
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape' && searchInput.value) { e.preventDefault(); e.stopPropagation(); resetSearch(); } });
    clearSearch.addEventListener('click', resetSearch);
    btnBack.addEventListener('click', () => { if (hpos > 0) go(history[--hpos], true); });
    // файли, перетягнуті зі справжнього робочого столу, потрапляють у відкриту папку
    VOS.transfer.bindDrop(items, () => (folder === 'root' || folder === 'trash' ? 'docs' : folder));

    VOS.ui.bindItems(items, {
      folder: () => folder,
      backgroundButton: btnActions,
      onBack: () => { const n = fs.get(folder); if (n && n.parent) go(n.parent); },
      extraBgMenu: () => [
        hpos < history.length - 1 ? { label: 'Вперед', icon: 'chevron-right', action: () => go(history[++hpos], true) } : null,
        {
          label: view === 'icons' ? 'Показати списком' : 'Показати значками',
          icon: view === 'icons' ? 'list' : 'folder',
          action: () => { view = view === 'icons' ? 'list' : 'icons'; render(); },
        },
        { label: 'Властивості папки', icon: 'info', action: () => VOS.dialog.properties(folder) },
      ],
    });
    // Місця в бічній панелі теж приймають перетягнуті файли — підсвічування робить ui.js
    const unsub = [
      bus.on('fs:change', ({ parents, reset }) => {
        if (reset || parents.includes(folder) || !fs.get(folder) || parents.some((p) => fs.isDescendant(folder, p) || (!results.hidden && fs.isDescendant(p, folder)))) render();
      }),
      bus.on('clipboard:change', () => render()),
      bus.on('settings:showExt', () => render()),
    ];

    const win = VOS.wm.open({
      app: 'explorer', title: 'Файли', icon: 'folder', content: root, width: 720, height: 460, minWidth: 340, minHeight: 240,
      onClose: () => unsub.forEach((u) => u()),
      onResize: (w) => root.classList.toggle('narrow', w.el.offsetWidth < 560),
    });
    win.explorer = { go, get folder() { return folder; } };
    render();
    bus.emit('explorer:open', { folder, winId: win.id });
    return win;
  }

  VOS.apps.register({ id: 'explorer', name: 'Файли', icon: 'folder', color: '#f59f00', category: 'standard', desc: 'Папки й файли: Комп\'ютер, Документи, Малюнки, Кошик', launch });
})();
