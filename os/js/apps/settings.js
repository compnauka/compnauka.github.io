/* Віконце — Налаштування. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, settings, bus } = VOS;

  const PAGES = [
    { id: 'look', icon: 'palette', name: tr('Оформлення') },
    { id: 'mouse', icon: 'mouse', name: tr('Значки й мишка') },
    { id: 'account', icon: 'user', name: tr('Мій профіль') },
    { id: 'data', icon: 'save', name: tr('Мої роботи') },
    { id: 'about', icon: 'info', name: tr('Про систему') },
  ];

  function seg(options, value, onPick, hintPrefix) {
    const box = el('div.seg', { role: 'radiogroup' });
    options.forEach(([v, label]) => {
      const b = el('button.seg-btn' + (v === value ? '.active' : ''), { type: 'button', role: 'radio', 'aria-checked': String(v === value), dataset: { hint: hintPrefix ? hintPrefix + '-' + v : null } }, label);
      if (!hintPrefix) delete b.dataset.hint;
      b.addEventListener('click', () => {
        box.querySelectorAll('.seg-btn').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-checked', String(x === b)); });
        onPick(v);
      });
      box.append(b);
    });
    return box;
  }

  function toggle(label, key, desc) {
    const input = el('input', { type: 'checkbox', checked: !!settings.get(key) });
    input.addEventListener('change', () => settings.set(key, input.checked));
    return el('label.set-toggle', el('span.set-toggle-text', el('b', label), desc ? el('small', desc) : null), input, el('span.switch', { 'aria-hidden': 'true' }));
  }

  function pageLook() {
    const grid = el('div.wp-grid', { role: 'radiogroup', 'aria-label': tr('Шпалери') });
    Object.entries(VOS.shell.WALLPAPERS).forEach(([id, wp]) => {
      const b = el('button.wp' + (settings.get('wallpaper') === id ? '.active' : ''), { type: 'button', role: 'radio', title: wp.name, dataset: { wp: id, hint: 'wp' } },
        el('span.wp-prev', { style: { background: wp.css } }), el('span.wp-name', wp.name));
      b.addEventListener('click', () => {
        grid.querySelectorAll('.wp').forEach((x) => x.classList.toggle('active', x === b));
        settings.set('wallpaper', id);
      });
      grid.append(b);
    });
    return [
      el('h2', tr('Шпалери робочого столу')), grid,
      el('h2', tr('Тема вікон')),
      seg([['light', [VOS.icon('sun'), tr(' Світла')]], ['dark', [VOS.icon('moon'), tr(' Темна')]]], settings.get('theme'), (v) => settings.set('theme', v), 'theme'),
    ];
  }

  function pageMouse() {
    return [
      el('h2', tr('Розмір значків')),
      seg([['s', tr('Маленькі')], ['m', tr('Середні')], ['l', tr('Великі')]], settings.get('iconSize'), (v) => settings.set('iconSize', v), 'icons'),
      toggle(tr('Показувати тип файлу (.txt, .png)'), 'showExt', tr('Маленька позначка на значку показує, яка програма відкриває файл')),
      el('h2', tr('Як відкривати файли й папки')),
      seg([[false, tr('Подвійним клацанням')], [true, tr('Одним клацанням')]], settings.get('singleClick'), (v) => settings.set('singleClick', v)),
      el('p.set-note', tr('На планшеті й телефоні значки завжди відкриваються одним дотиком, а меню — утриманням пальця.')),
      el('h2', tr('Інше')),
      toggle(tr('Звуки'), 'sounds', tr('Короткі звуки під час роботи')),
      toggle(tr('Відкривати Совеня під час входу'), 'helperAuto', tr('Інакше Совеня чекає на кнопці внизу праворуч, а ти досліджуєш вільно')),
    ];
  }

  function pageAccount() {
    const p = VOS.session.profile;
    const name = el('input.input', { type: 'text', value: p.name, maxlength: 24, 'aria-label': tr("Ім'я") });
    const av = el('div.avatar-grid');
    const cur = VOS.icons.avatarId(p.avatar);
    const list = VOS.session.AVATARS.includes(cur) ? VOS.session.AVATARS : [cur, ...VOS.session.AVATARS];
    list.forEach((a) => {
      const nm = VOS.session.AVATAR_NAMES[a] || a;
      const on = a === cur;
      const b = el('button.avatar-pick' + (on ? '.active' : ''), { type: 'button', title: nm, 'aria-label': tr('Аватар: ') + nm, 'aria-pressed': String(on) }, VOS.icons.avatar(a));
      b.addEventListener('click', () => {
        av.querySelectorAll('.avatar-pick').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        VOS.session.updateProfile({ avatar: a });
      });
      av.append(b);
    });
    const saveName = () => {
      const v = name.value.trim();
      if (!v) { name.value = VOS.session.profile.name; return; }
      VOS.session.updateProfile({ name: v });
      VOS.toast(tr("Ім'я змінено"), 'user');
    };
    name.addEventListener('change', saveName);
    return [el('h2', tr("Ім'я")), name, el('h2', tr('Аватар')), av];
  }

  /** Шкала пам'яті: розмір робіт цього учня і скільки місця дає браузер. */
  function memoryBlock() {
    const files = VOS.fs.all().filter((n) => n.type === 'file');
    const folders = VOS.fs.all().filter((n) => n.type === 'folder').length;
    const mine = files.reduce((s, n) => s + VOS.fs.sizeOf(n.id), 0);
    const bar = el('span', { style: { width: '2%' } });
    const note = el('p.set-note', tr('Рахую…'));
    const fill = (limit, label) => {
      bar.style.width = Math.max(2, Math.min(100, Math.round((mine / limit) * 100))) + '%';
      note.textContent = tr('Твої роботи: ') + VOS.fmtSize(mine) + ' (' + files.length + ' ' + VOS.plural(files.length, tr('файл'), tr('файли'), tr('файлів')) + ', ' + folders + ' ' + VOS.plural(folders, tr('папка'), tr('папки'), tr('папок')) + ') · ' + label;
    };
    if (VOS.fs.backend === 'idb') {
      VOS.db.estimate().then((e) => {
        if (e && e.quota) fill(e.quota, tr('доступно ще приблизно ') + VOS.fmtSize(Math.max(0, e.quota - e.usage)));
        else fill(500 * 1024 * 1024, tr('місця багато'));
      });
    } else fill(5 * 1024 * 1024, tr('браузер дає лише ~5 МБ (сховище localStorage)'));
    return [el('div.meter', bar), note];
  }

  function pageData() {
    return [
      el('p', tr('Твої файли зберігаються в цьому браузері. Щоб не загубити роботи (або перенести їх на інший комп\'ютер), збережи копію.')),
      el('h2', tr('Копія всіх робіт')),
      el('p.set-note', tr('Файли й папки з Комп’ютера, Робочого столу, Документів і Малюнків — одним архівом .zip.')),
      el('button.btn.btn-primary', { type: 'button', dataset: { hint: 'export-all' }, on: { click: () => VOS.transfer.exportAll() } }, VOS.icon('download'), tr(' Завантажити копію на комп\'ютер')),
      el('h2', tr('Відновити з копії')),
      el('p.set-note', tr('Вибери архів, який раніше завантажив з Віконця. Файли повернуться у свої папки (нічого не зітреться, а файли, які вже є, не задвояться).')),
      el('button.btn', { type: 'button', on: { click: () => VOS.transfer.pickAndImport('docs', { restore: true, accept: '.zip,application/zip' }) } }, VOS.icon('upload'), tr(' Відновити з архіву…')),
      el('h2', tr('Окремі файли')),
      el('ul.set-list',
        el('li', VOS.icon('download'), ' ', el('b', tr('На комп\'ютер:')), tr(' права кнопка на файлі чи папці → «Завантажити на комп\'ютер».')),
        el('li', VOS.icon('upload'), ' ', el('b', tr('З комп\'ютера:')), tr(' перетягни файл просто у вікно Віконця або натисни «Додати» в програмі «Файли».')),
        el('li', VOS.icon('file-text'), tr(' Віконце відкриває тексти (.txt) і малюнки (.png, .jpg). Архіви .zip розпаковуються в папку.'))),
      el('p.set-note', VOS.icon('alert'), tr(' Завантажуй файли з інтернету лише разом із дорослими.')),
      el('h2', tr('Пам\'ять')),
      ...memoryBlock(),
    ];
  }

  function pageAbout(rerender) {
    return [
      el('div.about-logo', VOS.icon('logo', 60), el('div', el('b', tr('Віконце')), el('small', tr('Навчальна операційна система · версія 1.1')))),
      el('p', tr('Віконце працює просто в браузері. Тут можна вчитися працювати з вікнами, файлами й папками без страху щось зламати.')),
      el('h2', tr('Пам\'ять')),
      ...memoryBlock(),
      el('p.set-note', tr('Усі файли зберігаються лише в цьому браузері на цьому пристрої. Копію можна зберегти в розділі «Мої роботи».')),
      el('h2', tr('Почати спочатку')),
      el('button.btn.btn-danger', { type: 'button', on: { click: async () => {
        const yes = await VOS.dialog.confirm(tr('Повернути Віконце до початкового стану? Твої файли й папки буде видалено, а налаштування скинуто. Зірочки за завдання залишаться.'), { title: tr('Скидання'), okText: tr('Скинути'), danger: true, icon: 'alert' });
        if (!yes) return;
        VOS.wm.closeAll(true);
        VOS.store.remove('settings');
        settings.load();
        VOS.fs.reset();
        VOS.shell.applyLook();
        VOS.toast(tr('Віконце повернуто до початкового стану'), 'sparkles');
      } } }, VOS.icon('refresh'), tr(' Скинути файли й налаштування')),
      el('p.set-note', tr('Сайт: '), el('a', { href: 'https://itnauka.org/', target: '_blank', rel: 'noopener' }, 'itnauka.org')),
    ];
  }

  function launch(args) {
    let page = args.page || 'look';
    const nav = el('nav.set-nav', { 'aria-label': tr('Розділи') });
    const content = el('div.set-content');
    const root = el('div.app-settings', nav, content);
    PAGES.forEach((p) => nav.append(el('button.set-nav-btn', { type: 'button', dataset: { page: p.id, hint: 'set-' + p.id }, on: { click: () => go(p.id) } }, VOS.icon(p.icon), el('span.set-nav-name', p.name))));
    function go(id) {
      page = id;
      nav.querySelectorAll('.set-nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.page === id));
      content.innerHTML = '';
      const fn = { look: pageLook, mouse: pageMouse, account: pageAccount, data: pageData, about: pageAbout }[id];
      content.append(el('h1', PAGES.find((p) => p.id === id).name), ...fn(() => go(page)));
      content.scrollTop = 0;
      bus.emit('settings:page', { page: id });
    }
    const win = VOS.wm.open({
      app: 'settings', singleton: 'settings', title: tr('Налаштування'), icon: 'settings', content: root, width: 720, height: 500, minWidth: 320, minHeight: 300,
      onReopen: (o) => { if (o && o.page) go(o.page); },
    });
    go(page);
    return win;
  }

  const def = VOS.apps.register({ id: 'settings', name: 'Налаштування', icon: 'settings', color: '#868e96', category: 'computer', desc: tr('Шпалери, тема, значки, профіль'), launch });
  // singleton-вікно отримує нову сторінку через onReopen
  const orig = def.launch;
  def.launch = (args) => {
    const ex = VOS.wm.byApp('settings')[0];
    if (ex) { if (ex.minimized) VOS.wm.restore(ex.id); VOS.wm.focus(ex.id); if (ex.onReopen) ex.onReopen(args); return ex; }
    return orig(args);
  };
})();
