/* Віконце — пункт «Що це?» у кожному контекстному меню: проста розповідь про об'єкт.
   VOS.explain.menuItem(...) повертає готовий пункт для VOS.ui.menu(); тексти зібрані в таблицях нижче. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, fs } = VOS;

  /* ---------- Таблиця пояснень (за видом елемента) ---------- */
  const KINDS = {
    folder: { title: 'Папка', icon: 'folder', lines: [
      'Папка — це як справжня тека для паперів: у ній лежать файли й інші папки.',
      'Папки допомагають тримати порядок: малюнки до малюнків, тексти до текстів.',
      'Двічі клацни, щоб відкрити. Можна дати їй свою назву, перенести або видалити.',
    ] },
    docs: { title: 'Документи', icon: 'folder-docs', lines: [
      'Це особлива папка для твоїх текстів і робіт. Її не можна видалити чи перейменувати.',
      'Сюди Блокнот зберігає файли, якщо не вибрати інше місце.',
    ] },
    pics: { title: 'Малюнки', icon: 'folder-pics', lines: [
      'Це особлива папка для малюнків і фото. Її не можна видалити чи перейменувати.',
      'Сюди зручно зберігати те, що ти намалював у програмі «Малюнок».',
    ] },
    desktop: { title: 'Робочий стіл', icon: 'folder-desktop', lines: [
      'Робочий стіл — це те, що ти бачиш одразу, коли вмикаєш комп\'ютер. Тут лежать значки та ярлики.',
      'Це теж папка! Усе, що ти поклав на стіл, лежить у папці «Робочий стіл».',
    ] },
    root: { title: 'Комп\'ютер', icon: 'computer', lines: [
      'Це «головна полиця» комп\'ютера: тут видно всі основні місця — Робочий стіл, Документи й Малюнки.',
      'Починай звідси, якщо загубив файл і не знаєш, де він.',
      'Двічі клацни, щоб відкрити.',
    ] },
    trash: { title: 'Кошик', icon: 'trash', lines: [
      'Кошик — це місце для того, що ти видалив. Файл не зникає одразу: його можна повернути, поки кошик не очищений.',
      'Щоб повернути, клацни правою кнопкою й вибери «Відновити». «Очистити кошик» видаляє все назавжди.',
    ] },
    games: { title: 'Ігри', icon: 'folder', lines: [
      'У цій папці живуть ігри. Усередині — ярлики: кожен запускає свою гру.',
      'Відкрий папку й двічі клацни на ярлику гри.',
    ] },
    trainers: { title: 'Тренажери', icon: 'folder', lines: [
      'У цій папці живуть тренажери: вони вчать працювати з мишкою й клавіатурою.',
      'Відкрий папку й двічі клацни на ярлику, щоб потренуватися.',
    ] },
    txt: { title: 'Текстовий документ', icon: 'txt', ext: 'txt', typeText: 'текстовий документ', app: 'notepad', lines: [
      'У цьому файлі записаний текст: лист, казка чи нотатка.',
      'Двічі клацни — він відкриється в Блокноті, де його можна читати й змінювати.',
    ] },
    img: { title: 'Малюнок', icon: 'img', typeText: 'малюнок (картинка)', app: 'photos', lines: [
      'Це картинка: малюнок або фото.',
      'Двічі клацни — вона відкриється для перегляду. Змінити її можна в програмі «Малюнок».',
    ] },
    zip: { title: 'Архів', icon: 'zip', ext: 'zip', typeText: 'архів', lines: [
      'Архів — це «валіза», у яку складено кілька файлів разом, щоб їх було легко передати.',
      'Двічі клацни або вибери «Розпакувати» — і файли з\'являться в папці.',
    ] },
    file: { title: 'Файл', icon: 'file-unknown', typeText: 'невідомий тип', lines: [
      'Файл — це збережена робота: текст, малюнок або щось інше.',
      'Віконце вміє відкривати тексти (.txt), малюнки (.png, .jpg) й архіви (.zip). Цей тип мені не знайомий.',
    ] },
    shortcut: { title: 'Ярлик', icon: 'link', lines: [
      'Ярлик — це «двері» до програми, файлу чи папки. Він сам нічого не містить, а лише запускає.',
      'Ярлик можна впізнати за маленькою стрілкою на значку.',
      'Якщо видалити ярлик, сама програма (або файл) нікуди не дівається.',
    ] },
    app: { title: 'Програма', icon: 'star', lines: [
      'Програма — це «помічник» для певної справи на комп\'ютері.',
      'Двічі клацни, щоб запустити.',
    ] },
    background: { title: 'Вільне місце в папці', icon: 'folder-open', lines: [
      'Це порожнє місце у вікні папки. Права кнопка тут відкриває меню для всієї папки.',
      'Можна створити нову папку чи документ, вставити скопійоване або додати файл із комп\'ютера.',
    ] },
    taskbar: { title: 'Панель задач', icon: 'monitor', lines: [
      'Панель задач — смужка внизу екрана. На ній видно всі відкриті програми.',
      'Клацни на кнопці, щоб показати вікно або сховати його. Праворуч — годинник.',
    ] },
    taskbtn: { title: 'Кнопка вікна', icon: 'monitor', lines: [
      'Кожна відкрита програма має на панелі задач свою кнопку.',
      'Клацни — вікно з\'явиться або згорнеться. Права кнопка дає змогу закрити вікно.',
    ] },
    start: { title: 'Меню «Пуск»', icon: 'logo', lines: [
      'Це «Пуск» — головні двері до всіх програм. Тут можна знайти будь-яку програму й вимкнути комп\'ютер.',
      'Клацни, щоб відкрити, а потім обери програму зі списку.',
    ] },
    power: { title: 'Вимкнення', icon: 'power', lines: [
      'Тут можна вимкнути комп\'ютер, запустити його знову або змінити користувача.',
      'Завжди вимикай комп\'ютер правильно — так твої файли залишаться цілими.',
    ] },
    pocket: { title: 'Кишеня (буфер обміну)', icon: 'pocket', lines: [
      'Кишеня — це місце, куди комп\'ютер ховає те, що ти скопіював (Ctrl+C) або вирізав (Ctrl+X).',
      'У ній вміщається лише одна річ: нове копіювання виштовхує попереднє.',
      'Щоб вставити — клацни правою кнопкою в папці й вибери «Вставити» або натисни Ctrl+V.',
    ] },
    window: { title: 'Вікно', icon: 'window', lines: [
      'Вікно — це «екран у екрані»: у ньому працює одна програма.',
      'Верхня смужка з назвою — це заголовок. За неї вікно можна перетягувати. Кнопки справа згортають, збільшують і закривають вікно.',
    ] },
  };

  /* Пояснення для окремих програм (за id) */
  const APPS = {
    notepad: ['Блокнот — програма, щоб писати тексти. У ній відкриваються файли .txt.', 'Напиши казку чи список справ і збережи: «Файл → Зберегти».'],
    paint: ['«Малюнок» — програма, щоб малювати пензликом і фарбами.', 'Готовий малюнок зберігається у файл .png.'],
    photos: ['«Фото» показує малюнки й фотографії (файли .png, .jpg).', 'Тут можна розглядати картинки, а змінювати їх — у «Малюнку».'],
    calculator: ['Калькулятор швидко рахує: додає, віднімає, множить і ділить.', 'Натискай цифри й знаки, як на справжньому.'],
    explorer: ['«Файли» показують папки й файли. Тут видно Комп\'ютер, Документи, Малюнки й Кошик.', 'Так можна знайти потрібне, перенести чи видалити.'],
    settings: ['У «Налаштуваннях» можна змінити шпалери, вигляд значків і свій профіль.', 'Це як прикрасити власну кімнату.'],
    help: ['«Довідка» просто пояснює, що таке вікно, файл, папка й кошик.', 'Заглядай сюди, якщо щось незрозуміло.'],
    missions: ['«Завдання» — це навчальні вправи від Совеня.', 'Виконуй їх по черзі й вивчай комп\'ютер крок за кроком.'],
    browser: ['Це програма для перегляду сторінок.', 'Користуйся нею лише з дозволу дорослих.'],
  };
  const CAT_TEXT = { trainers: 'Це тренажер: він допомагає потренувати руки й увагу.', games: 'Це гра: у ній можна й погратися, і чогось навчитися.', creative: 'У ній можна творити.' };

  const fmtApp = (id) => VOS.apps.name(id);

  /* ---------- Побудова опису для вузла файлової системи ---------- */
  function specForNode(n) {
    if (!n) return { ...KINDS.file };
    const inTrash = fs.isInTrash(n.id);
    let spec;
    const facts = [['Назва', n.name]];
    if (n.id === 'link-computer') spec = { ...KINDS.root, shortcut: true };
    else if (n.id === 'link-trash') spec = { ...KINDS.trash };
    else if (n.type === 'folder') {
      if (KINDS[n.id] && fs.SPECIAL[n.id]) spec = { ...KINDS[n.id] };
      else if (n.parent === 'desktop' && n.name === 'Ігри') spec = { ...KINDS.games };
      else if (n.parent === 'desktop' && n.name === 'Тренажери') spec = { ...KINDS.trainers };
      else spec = { ...KINDS.folder };
      if (spec === KINDS.folder || spec.title === 'Папка') facts.push(['Тип', 'Папка']);
      else facts.push(['Тип', 'Особлива папка']);
    } else if (n.type === 'link') {
      spec = { ...KINDS.shortcut };
      const target = n.targetId ? fs.get(n.targetId) : null;
      if (n.targetId) {
        spec.lines = ['Це ярлик на ' + (target ? (target.type === 'folder' ? 'папку' : 'файл') + ' «' + target.name + '»' : 'об\'єкт, якого вже немає') + '. Він лише веде до оригіналу.', KINDS.shortcut.lines[1], 'Якщо видалити ярлик, оригінал залишиться на місці.'];
        if (target) { spec.icon = VOS.ui.iconFor(n); facts.push(['Тип', 'Ярлик'], ['Оригінал', target.name]); }
      } else {
        const a = VOS.apps.get(n.app);
        const t = APPS[n.app];
        spec.title = 'Ярлик: ' + (a ? a.name : n.name);
        spec.lines = ['Це ярлик програми «' + (a ? a.name : n.name) + '». Двічі клацни — програма запуститься.']
          .concat(t ? [t[0]] : [a && a.desc ? a.desc + '.' : ''], ['Якщо видалити ярлик, сама програма нікуди не зникне.']).filter(Boolean);
        facts.push(['Тип', 'Ярлик програми'], ['Запускає', a ? a.name : '—']);
      }
    } else {
      const e = fs.ext(n.name);
      const key = e === 'txt' ? 'txt' : /^(png|jpe?g)$/.test(e) ? 'img' : e === 'zip' ? 'zip' : 'file';
      spec = { ...KINDS[key] };
      facts.push(['Тип', VOS.ui.typeChip(n, spec.typeText + (e ? ' (.' + e + ')' : ''))]);
      facts.push(['Відкривається у програмі', key === 'img' ? 'Фото (змінити — у «Малюнку»)' : spec.app ? fmtApp(spec.app) : key === 'zip' ? 'розпаковується у папку' : 'жодна не підходить']);
    }
    if (n.parent && fs.get(n.parent)) facts.push(['Де лежить', fs.pathString(n.parent)]);
    spec.facts = facts;
    spec.node = n;
    if (inTrash && n.id !== 'trash') spec.lines = spec.lines.concat(['Зараз цей об\'єкт лежить у кошику. Його ще можна відновити.']);
    return spec;
  }

  /* ---------- Опис програми (кнопка на панелі задач, вікно) ---------- */
  function specForApp(appId) {
    const a = VOS.apps.get(appId);
    const t = APPS[appId];
    return {
      title: a ? a.name : 'Програма', icon: a ? a.icon : 'star', color: a && a.color,
      lines: t ? t.slice() : [(a && a.desc ? a.desc + '.' : KINDS.app.lines[0]), CAT_TEXT[a && a.category] || 'Двічі клацни ярлик, щоб запустити.'],
      facts: a ? [['Тип', 'Програма']] : [],
    };
  }

  /* ---------- Показ діалогу ---------- */
  function show(spec) {
    VOS.bus.emit('explain:show', { title: spec.title });
    return VOS.dialog.modal((d) => {
      const pic = spec.node ? VOS.ui.renderIcon(spec.node, 'item-ico') : el('div.item-ico' + (spec.color ? '.app-tile' : ''), spec.color ? { style: { '--tile': spec.color } } : null, VOS.icon(spec.icon));
      if (spec.node && spec.node.type === 'link' && !spec.node.system) pic.append(el('span.link-badge', { 'aria-hidden': 'true' }, VOS.icon('link')));
      d.content.append(
        el('div.explain-head', el('span.explain-ico', pic), el('strong.explain-title', spec.title)),
        ...spec.lines.map((t) => el('p.dialog-msg.explain-line', t)),
        spec.facts && spec.facts.length ? el('table.props.explain-facts', spec.facts.map(([k, v]) => el('tr', el('th', k), el('td', v)))) : null
      );
      d.foot.append(el('button.btn.btn-primary', { type: 'button', on: { click: () => d.close(true) } }, 'Зрозуміло'));
      d.onEnter = () => d.close(true);
    }, { title: 'Що це?', icon: 'help', className: 'explain-dialog' });
  }

  const wrap = (spec) => ({ label: 'Що це?', icon: 'help', hint: 'explain', action: () => show(typeof spec === 'function' ? spec() : spec) });

  const sepAndItem = (spec) => [{ sep: true }, wrap(spec)];

  VOS.explain = {
    KINDS, APPS,
    show,
    kind: (k) => KINDS[k],
    forNode: specForNode,
    forApp: specForApp,
    /** Пункт меню для вузла файлової системи (id) */
    nodeItem: (id) => wrap(() => specForNode(fs.get(id))),
    /** Пункт меню для виду елемента (ключ у KINDS) */
    kindItem: (k) => wrap(() => ({ ...KINDS[k] })),
    appItem: (appId) => wrap(() => specForApp(appId)),
    /** Пункт меню для вільного місця: папка або Кошик */
    backgroundItem: (folder) => wrap(() => {
      if (folder === 'trash') return { ...KINDS.trash, title: 'Кошик (вільне місце)' };
      if (folder === 'desktop') return { ...KINDS.desktop };
      return { ...KINDS.background };
    }),
    sepAndItem,
  };
})();
