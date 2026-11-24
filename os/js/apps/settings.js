/* Віконце — Налаштування. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, settings, bus } = VOS;

  const PAGES = [
    { id: 'look', icon: 'palette', name: 'Оформлення' },
    { id: 'mouse', icon: 'mouse', name: 'Значки й мишка' },
    { id: 'account', icon: 'user', name: 'Мій профіль' },
    { id: 'data', icon: 'save', name: 'Мої роботи' },
    { id: 'about', icon: 'info', name: 'Про систему' },
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
    const grid = el('div.wp-grid', { role: 'radiogroup', 'aria-label': 'Шпалери' });
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
      el('h2', 'Шпалери робочого столу'), grid,
      el('h2', 'Тема вікон'),
      seg([['light', [VOS.icon('sun'), ' Світла']], ['dark', [VOS.icon('moon'), ' Темна']]], settings.get('theme'), (v) => settings.set('theme', v), 'theme'),
    ];
  }

  function pageMouse() {
    return [
      el('h2', 'Розмір значків'),
      seg([['s', 'Маленькі'], ['m', 'Середні'], ['l', 'Великі']], settings.get('iconSize'), (v) => settings.set('iconSize', v), 'icons'),
      toggle('Показувати тип файлу (.txt, .png)', 'showExt', 'Маленька позначка на значку показує, яка програма відкриває файл'),
      el('h2', 'Як відкривати файли й папки'),
      seg([[false, 'Подвійним клацанням'], [true, 'Одним клацанням']], settings.get('singleClick'), (v) => settings.set('singleClick', v)),
      el('p.set-note', 'На планшеті й телефоні значки завжди відкриваються одним дотиком, а меню — утриманням пальця.'),
      el('h2', 'Інше'),
      toggle('Звуки', 'sounds', 'Короткі звуки під час роботи'),
      toggle('Відкривати Совеня під час входу', 'helperAuto', 'Інакше Совеня чекає на кнопці внизу праворуч, а ти досліджуєш вільно'),
    ];
  }

  function pageAccount() {
    const p = VOS.session.profile;
    const name = el('input.input', { type: 'text', value: p.name, maxlength: 24, 'aria-label': "Ім'я" });
    const av = el('div.avatar-grid');
    const cur = VOS.icons.avatarId(p.avatar);
    const list = VOS.session.AVATARS.includes(cur) ? VOS.session.AVATARS : [cur, ...VOS.session.AVATARS];
    list.forEach((a) => {
      const nm = VOS.session.AVATAR_NAMES[a] || a;
      const on = a === cur;
      const b = el('button.avatar-pick' + (on ? '.active' : ''), { type: 'button', title: nm, 'aria-label': 'Аватар: ' + nm, 'aria-pressed': String(on) }, VOS.icons.avatar(a));
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
      VOS.toast("Ім'я змінено", 'user');
    };
    name.addEventListener('change', saveName);
    return [el('h2', "Ім'я"), name, el('h2', 'Аватар'), av];
  }

  /** Шкала пам'яті: розмір робіт цього учня і скільки місця дає браузер. */
  function memoryBlock() {
    const files = VOS.fs.all().filter((n) => n.type === 'file');
    const folders = VOS.fs.all().filter((n) => n.type === 'folder').length;
    const mine = files.reduce((s, n) => s + VOS.fs.sizeOf(n.id), 0);
    const bar = el('span', { style: { width: '2%' } });
    const note = el('p.set-note', 'Рахую…');
    const fill = (limit, label) => {
      bar.style.width = Math.max(2, Math.min(100, Math.round((mine / limit) * 100))) + '%';
      note.textContent = 'Твої роботи: ' + VOS.fmtSize(mine) + ' (' + files.length + ' ' + VOS.plural(files.length, 'файл', 'файли', 'файлів') + ', ' + folders + ' ' + VOS.plural(folders, 'папка', 'папки', 'папок') + ') · ' + label;
    };
    if (VOS.fs.backend === 'idb') {
      VOS.db.estimate().then((e) => {
        if (e && e.quota) fill(e.quota, 'доступно ще приблизно ' + VOS.fmtSize(Math.max(0, e.quota - e.usage)));
        else fill(500 * 1024 * 1024, 'місця багато');
      });
    } else fill(5 * 1024 * 1024, 'браузер дає лише ~5 МБ (сховище localStorage)');
    return [el('div.meter', bar), note];
  }

  function pageData() {
    return [
      el('p', 'Твої файли зберігаються в цьому браузері. Щоб не загубити роботи (або перенести їх на інший комп\'ютер), збережи копію.'),
      el('h2', 'Копія всіх робіт'),
      el('p.set-note', 'Робочий стіл, Документи й Малюнки — одним архівом .zip.'),
      el('button.btn.btn-primary', { type: 'button', dataset: { hint: 'export-all' }, on: { click: () => VOS.transfer.exportAll() } }, VOS.icon('download'), ' Завантажити копію на комп\'ютер'),
      el('h2', 'Відновити з копії'),
      el('p.set-note', 'Вибери архів, який раніше завантажив з Віконця. Файли повернуться у свої папки (нічого не зітреться, а файли, які вже є, не задвояться).'),
      el('button.btn', { type: 'button', on: { click: () => VOS.transfer.pickAndImport('docs', { restore: true, accept: '.zip,application/zip' }) } }, VOS.icon('upload'), ' Відновити з архіву…'),
      el('h2', 'Окремі файли'),
      el('ul.set-list',
        el('li', VOS.icon('download'), ' ', el('b', 'На комп\'ютер:'), ' права кнопка на файлі чи папці → «Завантажити на комп\'ютер».'),
        el('li', VOS.icon('upload'), ' ', el('b', 'З комп\'ютера:'), ' перетягни файл просто у вікно Віконця або натисни «Додати» в програмі «Файли».'),
        el('li', VOS.icon('file-text'), ' Віконце відкриває тексти (.txt) і малюнки (.png, .jpg). Архіви .zip розпаковуються в папку.')),
      el('p.set-note', VOS.icon('alert'), ' Завантажуй файли з інтернету лише разом із дорослими.'),
      el('h2', 'Пам\'ять'),
      ...memoryBlock(),
    ];
  }

  function pageAbout(rerender) {
    return [
      el('div.about-logo', VOS.icon('logo', 60), el('div', el('b', 'Віконце'), el('small', 'Навчальна операційна система · версія 1.1'))),
      el('p', 'Віконце працює просто в браузері. Тут можна вчитися працювати з вікнами, файлами й папками без страху щось зламати.'),
      el('h2', 'Пам\'ять'),
      ...memoryBlock(),
      el('p.set-note', 'Усі файли зберігаються лише в цьому браузері на цьому пристрої. Копію можна зберегти в розділі «Мої роботи».'),
      el('h2', 'Почати спочатку'),
      el('button.btn.btn-danger', { type: 'button', on: { click: async () => {
        const yes = await VOS.dialog.confirm('Повернути Віконце до початкового стану? Твої файли й папки буде видалено, а налаштування скинуто. Зірочки за завдання залишаться.', { title: 'Скидання', okText: 'Скинути', danger: true, icon: 'alert' });
        if (!yes) return;
        VOS.wm.closeAll(true);
        VOS.store.remove('settings');
        settings.load();
        VOS.fs.reset();
        VOS.shell.applyLook();
        VOS.toast('Віконце повернуто до початкового стану', 'sparkles');
      } } }, VOS.icon('refresh'), ' Скинути файли й налаштування'),
      el('p.set-note', 'Сайт: ', el('a', { href: 'https://itnauka.org/', target: '_blank', rel: 'noopener' }, 'itnauka.org')),
    ];
  }

  function launch(args) {
    let page = args.page || 'look';
    const nav = el('nav.set-nav', { 'aria-label': 'Розділи' });
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
      app: 'settings', singleton: 'settings', title: 'Налаштування', icon: 'settings', content: root, width: 720, height: 500, minWidth: 320, minHeight: 300,
      onReopen: (o) => { if (o && o.page) go(o.page); },
    });
    go(page);
    return win;
  }

  const def = VOS.apps.register({ id: 'settings', name: 'Налаштування', icon: 'settings', color: '#868e96', category: 'system', desc: 'Шпалери, тема, значки, профіль', launch });
  // singleton-вікно отримує нову сторінку через onReopen
  const orig = def.launch;
  def.launch = (args) => {
    const ex = VOS.wm.byApp('settings')[0];
    if (ex) { if (ex.minimized) VOS.wm.restore(ex.id); VOS.wm.focus(ex.id); if (ex.onReopen) ex.onReopen(args); return ex; }
    return orig(args);
  };
})();
