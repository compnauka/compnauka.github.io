/* Віконце — пункт «Що це?» у кожному контекстному меню: проста розповідь про об'єкт.
   VOS.explain.menuItem(...) повертає готовий пункт для VOS.ui.menu(); тексти зібрані в таблицях нижче. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs } = VOS;

  /* ---------- Таблиця пояснень (за видом елемента) ---------- */
  const KINDS = {
    folder: { title: tr('Папка'), icon: 'folder', lines: [
      tr('Папка — це як коробка або шухляда: у ній лежать файли й інші папки.'),
      tr('Папки допомагають тримати порядок: малюнки — до малюнків, тексти — до текстів.'),
      tr('Двічі клацни, щоб відкрити. Папку можна назвати по-своєму, перенести або видалити.'),
    ] },
    docs: { title: tr('Документи'), icon: 'folder-docs', lines: [
      tr('Це особлива папка для твоїх текстів. Її не можна видалити чи перейменувати.'),
      tr('Блокнот пропонує зберігати тексти саме сюди.'),
    ] },
    pics: { title: tr('Малюнки'), icon: 'folder-pics', lines: [
      tr('Це особлива папка для малюнків і фото. Її не можна видалити чи перейменувати.'),
      tr('Сюди зручно зберігати те, що ти намалював у програмі «Малюнок».'),
    ] },
    desktop: { title: tr('Робочий стіл'), icon: 'folder-desktop', lines: [
      tr('Робочий стіл — це екран, який ти бачиш одразу після входу. На ньому лежать значки.'),
      tr('Це теж папка! Усе, що ти кладеш на стіл, зберігається в папці «Робочий стіл».'),
    ] },
    root: { title: tr('Комп\'ютер'), icon: 'computer', lines: [
      tr('Тут зібрані всі головні місця комп\'ютера: Робочий стіл, Документи й Малюнки.'),
      tr('Загубив файл? Почни шукати звідси.'),
      tr('Двічі клацни, щоб відкрити.'),
    ] },
    trash: { title: tr('Кошик'), icon: 'trash', lines: [
      tr('У Кошик потрапляє все, що ти видалив. Файл не зникає одразу: його ще можна повернути.'),
      tr('Щоб повернути файл, клацни на ньому правою кнопкою мишки й вибери «Відновити».'),
      tr('«Очистити кошик» видаляє все назавжди — повернути вже не вийде.'),
    ] },
    games: { title: tr('Ігри'), icon: 'folder', lines: [
      tr('У цій папці лежать ігри. Кожен значок усередині запускає свою гру.'),
      tr('Відкрий папку й двічі клацни на грі.'),
    ] },
    trainers: { title: tr('Тренажери'), icon: 'folder', lines: [
      tr('У цій папці лежать тренажери: вони вчать працювати з мишкою й клавіатурою.'),
      tr('Відкрий папку й двічі клацни на тренажері, щоб потренуватися.'),
    ] },
    txt: { title: tr('Текстовий файл'), icon: 'txt', ext: 'txt', typeText: tr('текст'), app: 'notepad', lines: [
      tr('У цьому файлі записаний текст: лист, казка чи список справ.'),
      tr('Двічі клацни — він відкриється в Блокноті. Там текст можна читати й змінювати.'),
    ] },
    img: { title: tr('Малюнок'), icon: 'img', typeText: tr('малюнок'), app: 'photos', lines: [
      tr('У цьому файлі — картинка: малюнок або фото.'),
      tr('Двічі клацни, щоб відкрити її у «Фото».'),
    ] },
    csv: { title: tr('Таблиця'), icon: 'csv', ext: 'csv', typeText: tr('таблиця'), app: 'komirnyk', lines: [
      tr('Це таблиця: числа й слова, розкладені по клітинках.'),
      tr('Двічі клацни — вона відкриється в Комірнику.'),
    ] },
    html: { title: tr('Вебсторінка'), icon: 'html', ext: 'html', typeText: tr('вебсторінка'), app: 'drukaryk', lines: [
      tr('Це вебсторінка — така сама, як сторінки в інтернеті.'),
      tr('Двічі клацни — вона відкриється в Друкарику.'),
    ] },
    zip: { title: tr('Архів'), icon: 'zip', ext: 'zip', typeText: tr('архів'), lines: [
      tr('Архів — це як валіза: у ній складено кілька файлів разом, щоб їх було легко передати.'),
      tr('Двічі клацни або вибери «Розпакувати» — і файли з валізи з\'являться в новій папці.'),
    ] },
    file: { title: tr('Файл'), icon: 'file-unknown', typeText: tr('незнайомий'), lines: [
      tr('Файл — це збережена робота: текст, малюнок або щось інше.'),
      tr('Віконце відкриває тексти (.txt), малюнки (.png, .jpg) і архіви (.zip). Такий файл воно відкрити не вміє.'),
    ] },
    shortcut: { title: tr('Ярлик'), icon: 'link', lines: [
      tr('Ярлик — це як дороговказ: він швидко відкриває програму, файл чи папку, але сам нічого не зберігає.'),
      tr('Ярлик легко впізнати за маленькою стрілочкою в куточку значка.'),
      tr('Якщо видалити ярлик, сама програма чи файл залишаться на місці.'),
    ] },
    app: { title: tr('Програма'), icon: 'star', lines: [
      tr('Програма — це помічник для певної справи: писати, малювати, рахувати чи гратися.'),
      tr('Двічі клацни, щоб запустити.'),
    ] },
    background: { title: tr('Порожнє місце в папці'), icon: 'folder-open', lines: [
      tr('Це порожнє місце у вікні папки. Клацни тут правою кнопкою мишки — і з\'являться дії для цієї папки.'),
      tr('Так можна створити нову папку чи текст, вставити те, що лежить у Кишені, або додати файл.'),
    ] },
    taskbar: { title: tr('Панель задач'), icon: 'monitor', lines: [
      tr('Панель задач — смужка внизу екрана. На ній є кнопка для кожного відкритого вікна.'),
      tr('Ліворуч — кнопка «Меню», праворуч — Кишеня, Совеня й годинник.'),
    ] },
    taskbtn: { title: tr('Кнопка вікна'), icon: 'monitor', lines: [
      tr('Кожне відкрите вікно має на панелі задач свою кнопку.'),
      tr('Клацни — і вікно з\'явиться або сховається. Права кнопка мишки дає змогу закрити вікно.'),
    ] },
    start: { title: tr('Кнопка «Меню»'), icon: 'logo', lines: [
      tr('Кнопка «Меню» відкриває список усіх програм. У Windows таку кнопку називають «Пуск».'),
      tr('Знайди програму в списку або напиши її назву в полі пошуку. Тут же можна вимкнути комп\'ютер.'),
    ] },
    power: { title: tr('Вимкнення'), icon: 'power', lines: [
      tr('Тут можна вимкнути комп\'ютер, перезавантажити його або завершити сеанс, щоб працював інший учень.'),
      tr('Вимикай комп\'ютер саме так — тоді твої роботи збережуться.'),
    ] },
    pocket: { title: tr('Кишеня'), icon: 'pocket', lines: [
      tr('Коли ти копіюєш (Ctrl+C) або вирізаєш (Ctrl+X) файл чи папку, вони потрапляють у Кишеню.'),
      tr('У Кишені вміщається лише одна річ. Скопіюєш щось нове — воно займе її місце.'),
      tr('Щоб вставити, відкрий потрібну папку, клацни правою кнопкою мишки й вибери «Вставити» або натисни Ctrl+V.'),
      tr('Дорослі називають Кишеню «буфер обміну».'),
    ] },
    window: { title: tr('Вікно'), icon: 'window', lines: [
      tr('Вікно — це рамка, у якій працює програма.'),
      tr('За верхню смужку з назвою вікно можна перетягувати. Кнопки праворуч ховають вікно, роблять його на весь екран або закривають.'),
    ] },
  };

  /* Пояснення для окремих програм (за id) */
  const APPS = {
    notepad: [tr('Блокнот — програма, щоб писати тексти. У ній відкриваються файли .txt.'), tr('Напиши казку чи список справ і збережи: «Файл» → «Зберегти».')],
    paint: [tr('«Малюнок» — програма, щоб малювати олівцем, пензлем і фарбами.'), tr('Готовий малюнок зберігається у файл .png.')],
    photos: [tr('«Фото» показує малюнки й фотографії (файли .png, .jpg).'), tr('Тут можна обрізати малюнок або змінити його розмір. Щоб малювати на ньому, відкрий його в «Малюнку».')],
    calculator: [tr('Калькулятор швидко рахує: додає, віднімає, множить і ділить.'), tr('Натискай цифри й знаки, як на справжньому калькуляторі.')],
    explorer: [tr('«Файли» показують усі твої папки й файли: Комп\'ютер, Документи, Малюнки й Кошик.'), tr('Тут можна знайти потрібний файл, перенести його чи видалити.')],
    settings: [tr('У «Налаштуваннях» можна змінити картинку на робочому столі, розмір значків і свій профіль.'), tr('Зроби Віконце таким, як тобі подобається.')],
    help: [tr('«Довідка» простими словами пояснює, що таке вікно, файл, папка й кошик.'), tr('Заглядай сюди, якщо щось незрозуміло.')],
    missions: [tr('«Завдання» — це вправи від Совеня.'), tr('Виконуй їх по черзі — і крок за кроком навчишся працювати з комп\'ютером.')],
    browser: [tr('Браузер — програма, щоб відкривати сайти.'), tr('Тут є уроки й тренажери itnauka.org і навчальний сайт школи «Стежинка».')],
  };
  const CAT_TEXT = { trainers: tr('Це тренажер: він допомагає натренувати руки й увагу.'), games: tr('Це гра: у ній можна і пограти, і чогось навчитися.'), creative: tr('Тут можна творити: писати, малювати, вигадувати.') };

  const fmtApp = (id) => VOS.apps.name(id);

  /* ---------- Побудова опису для вузла файлової системи ---------- */
  function specForNode(n) {
    if (!n) return { ...KINDS.file };
    const inTrash = fs.isInTrash(n.id);
    let spec;
    const facts = [[tr('Назва'), fs.label(n)]];
    if (n.id === 'link-computer') spec = { ...KINDS.root, shortcut: true };
    else if (n.id === 'link-trash') spec = { ...KINDS.trash };
    else if (n.type === 'folder') {
      if (KINDS[n.id] && fs.SPECIAL[n.id]) spec = { ...KINDS[n.id] };
      else if (n.parent === 'desktop' && n.name === 'Ігри') spec = { ...KINDS.games };
      else if (n.parent === 'desktop' && n.name === 'Тренажери') spec = { ...KINDS.trainers };
      else spec = { ...KINDS.folder };
      if (spec === KINDS.folder || spec.title === tr('Папка')) facts.push([tr('Тип'), tr('Папка')]);
      else facts.push([tr('Тип'), tr('Особлива папка')]);
    } else if (n.type === 'link') {
      spec = { ...KINDS.shortcut };
      const target = n.targetId ? fs.get(n.targetId) : null;
      if (n.targetId) {
        const what = target && target.type === 'folder' ? tr('папку') : tr('файл');
        spec.lines = target
          ? [tr('Це ярлик: він швидко відкриває ') + what + ' «' + target.name + tr('». Сам ярлик нічого не зберігає.'), KINDS.shortcut.lines[1], tr('Якщо видалити ярлик, ') + (what === tr('папку') ? tr('сама папка залишиться') : tr('сам файл залишиться')) + tr(' на місці.')]
          : [tr('Це ярлик, але файлу чи папки, які він відкривав, уже немає.'), tr('Такий ярлик можна видалити.')];
        if (target) { spec.icon = VOS.ui.iconFor(n); facts.push([tr('Тип'), tr('Ярлик')], [tr('Відкриває'), target.name]); }
      } else {
        const a = VOS.apps.get(n.app);
        const t = APPS[n.app];
        spec.title = tr('Ярлик: ') + (a ? a.name : n.name);
        spec.lines = [tr('Це ярлик програми «') + (a ? a.name : n.name) + tr('». Двічі клацни — програма запуститься.')]
          .concat(t ? [t[0]] : [a && a.desc ? a.desc + '.' : ''], [tr('Якщо видалити ярлик, сама програма нікуди не зникне.')]).filter(Boolean);
        facts.push([tr('Тип'), tr('Ярлик програми')], [tr('Запускає'), a ? a.name : '—']);
      }
    } else {
      const e = fs.ext(n.name);
      const key = e === 'txt' ? 'txt' : /^(png|jpe?g)$/.test(e) ? 'img' : e === 'zip' ? 'zip' : e === 'csv' ? 'csv' : e === 'html' ? 'html' : 'file';
      spec = { ...KINDS[key] };
      facts.push([tr('Тип'), VOS.ui.typeChip(n, spec.typeText + (e ? ' (.' + e + ')' : ''))]);
      facts.push([tr('Відкривається у програмі'), spec.app ? fmtApp(spec.app) : key === 'zip' ? tr('не відкривається, а розпаковується в папку') : tr('у Віконці такої програми немає')]);
    }
    if (n.parent && fs.get(n.parent)) facts.push([tr('Де лежить'), fs.pathString(n.parent)]);
    spec.facts = facts;
    spec.node = n;
    if (inTrash && n.id !== 'trash') spec.lines = spec.lines.concat([tr('Зараз це лежить у Кошику, і його ще можна відновити.')]);
    return spec;
  }

  /* ---------- Опис програми (кнопка на панелі задач, вікно) ---------- */
  function specForApp(appId) {
    const a = VOS.apps.get(appId);
    const t = APPS[appId];
    return {
      title: a ? a.name : tr('Програма'), icon: a ? a.icon : 'star', color: a && a.color,
      lines: t ? t.slice() : [(a && a.desc ? a.desc + '.' : KINDS.app.lines[0]), CAT_TEXT[a && a.category] || tr('Двічі клацни ярлик, щоб запустити.')],
      facts: a ? [[tr('Тип'), tr('Програма')]] : [],
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
        ...spec.lines.map((t) => el('p.dialog-msg.explain-line', t))
      );
      if (spec.facts?.length) {
        d.content.append(el('table.props.explain-facts', spec.facts.map(([k, v]) => el('tr', el('th', k), el('td', v)))));
      }
      d.foot.append(el('button.btn.btn-primary', { type: 'button', on: { click: () => d.close(true) } }, tr('Зрозуміло')));
      d.onEnter = () => d.close(true);
    }, { title: tr('Що це?'), icon: 'help', className: 'explain-dialog' });
  }

  const wrap = (spec) => ({ label: tr('Що це?'), icon: 'help', hint: 'explain', action: () => show(typeof spec === 'function' ? spec() : spec) });

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
      if (folder === 'trash') return { ...KINDS.trash, title: tr('Кошик (вільне місце)') };
      if (folder === 'desktop') return { ...KINDS.desktop };
      return { ...KINDS.background };
    }),
    sepAndItem,
  };
})();
