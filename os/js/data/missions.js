/* Віконце — перелік навчальних завдань.
   Кожен крок: text і touchText — інструкції, tip — порада, hint — що підсвітити (селектор, масив або функція),
   check(type, data, ctx) — чи виконано крок за подією шини, skipCompact — пропускати на телефоні. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const fs = () => VOS.fs;

  const deskItem = (pred) => () => {
    const n = fs().children('desktop').find(pred);
    return n ? document.querySelector('#desk-icons .item[data-id="' + n.id + '"]') : null;
  };
  const deskLink = (app) => deskItem((n) => n.type === 'link' && n.app === app);
  const itemHint = (key, area = '#desk-icons') => (ctx) => area + ' .item[data-id="' + ctx.state[key] + '"]';
  const fileInFiles = itemHint('file', '.win[data-app="explorer"]');
  const itemActions = (item) => (ctx) => item(ctx) + ' [data-hint="item-actions"]';
  const nameOf = (ctx, key) => fs().get(ctx.state[key])?.name || ctx.state[key + 'Name'] || '';
  const startApp = (app) => ['[data-hint="start-' + app + '"]', '#start-btn'];
  const winOf = (app, sel) => '.win.active[data-app="' + app + '"] ' + sel;
  const opened = (app) => (t, d) => (t === 'win:open' || t === 'win:focus') && d.app === app;
  const closed = (app) => (t, d) => t === 'win:close' && d.app === app;
  const nameIs = (n, name) => n && n.name.toLocaleLowerCase('uk').trim() === name.toLocaleLowerCase('uk');

  function practiceFile(ctx, name, content) {
    const file = fs().createFile('desktop', name, content);
    ctx.state.file = file.id;
    ctx.state.fileName = file.name;
  }

  function savedIn(app, folder) {
    return (t, d, ctx) => {
      if (t !== app + ':save' || d.node.parent !== folder || d.winId !== ctx.state.win) return false;
      ctx.state.file = d.node.id;
      ctx.state.fileName = d.node.name;
      return true;
    };
  }

  const openedFile = (t, d, ctx) => t === 'file:open' && d.fileId === ctx.state.file;
  const openedFolder = (folder) => (t, d) => t === 'explorer:open' && d.folder === folder;
  const fileAction = (event) => (t, d, ctx) => t === event && d.node?.id === ctx.state.file;
  const newWindow = (app) => (t, d, ctx) => {
    if (t !== 'win:open' || d.app !== app) return false;
    ctx.state.win = d.winId;
    return true;
  };
  const closedWindow = (t, d, ctx) => t === 'win:close' && d.winId === ctx.state.win;

  const place = (folder) => ['.win.active [data-hint="place-' + folder + '"]', deskLink('explorer')];
  const openImages = { text: tr('Відкрий «Комп\'ютер», тоді вибери «Малюнки».'), hint: place('pics'), check: openedFolder('pics') };
  const searchBox = winOf('explorer', '[data-hint="ex-search"]');
  const revealFileHint = (ctx) => winOf('explorer', '[data-id="' + ctx.state.file + '"] [data-hint="ex-reveal"]');
  const foundFile = (t, d, ctx) => t === 'explorer:reveal' && d.fileId === ctx.state.file;
  const fileStem = (ctx) => fs().baseName(nameOf(ctx, 'file'));

  function searchImages(t, d, ctx) {
    if (t !== 'explorer:search' || d.folder !== 'pics') return false;
    const query = d.query.trim().normalize('NFC').toLocaleLowerCase('uk');
    return query.length >= Math.min(2, fileStem(ctx).length) && nameOf(ctx, 'file').normalize('NFC').toLocaleLowerCase('uk').includes(query);
  }

  function practicePicture() {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 160;
    const g = canvas.getContext('2d');
    g.fillStyle = '#233b73';
    g.fillRect(0, 0, 240, 160);
    g.fillStyle = '#ffe89a';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5 - Math.PI / 2;
      const radius = i % 2 ? 24 : 53;
      g.lineTo(120 + Math.cos(angle) * radius, 80 + Math.sin(angle) * radius);
    }
    g.fill();
    return canvas.toDataURL('image/png');
  }

  VOS.MISSIONS = [
    {
      id: 'start', icon: 'menu', title: tr('Привіт, «Меню»!'), desc: tr('Відкриваємо програму через «Меню».'),
      steps: [
        { text: tr('Натисни кнопку «Меню» у лівому нижньому куті екрана.'), hint: '#start-btn', check: (t) => t === 'start:open' },
        { text: tr('Знайди в меню «Калькулятор» і натисни на нього.'), tip: tr('Він є серед «Закріплених» програм.'), hint: startApp('calculator'), check: opened('calculator') },
        { text: tr('Порахуй щось: натисни 2, потім +, потім 3 і =.'), hint: '.win[data-app="calculator"] .calc-key.eq', check: (t) => t === 'calc:result' },
        { text: tr('Закрий вікно кнопкою з хрестиком у правому верхньому куті вікна.'), hint: '.win[data-app="calculator"] .win-close', check: closed('calculator') },
      ],
    },
    {
      id: 'buttons', icon: 'window', title: tr('Чарівні кнопки вікна'), desc: tr('Згортаємо, розгортаємо й закриваємо вікно.'),
      steps: [
        { text: tr('Відкрий «Блокнот» зі значка на робочому столі.'), hint: [deskLink('notepad'), '#start-btn'], check: (t, d) => t === 'win:open' && d.app === 'notepad' },
        { text: tr('Згорни вікно кнопкою з рисочкою. Воно сховається на панель задач.'), hint: winOf('notepad', '.win-min'), check: (t, d) => t === 'win:minimize' && d.app === 'notepad' },
        { text: tr('Поверни вікно: натисни на його кнопку на панелі задач унизу.'), hint: '.task-btn.min[data-app="notepad"]', check: (t, d) => t === 'win:unminimize' && d.app === 'notepad' },
        { text: tr('Розгорни вікно на весь екран кнопкою з квадратиком.'), hint: winOf('notepad', '.win-max'), skipCompact: true, check: (t, d) => t === 'win:maximize' && d.app === 'notepad' },
        { text: tr('Поверни звичайний розмір кнопкою з двома квадратиками.'), hint: winOf('notepad', '.win-max'), skipCompact: true, check: (t, d) => t === 'win:restore' && d.app === 'notepad' },
        { text: tr('Закрий вікно кнопкою з хрестиком.'), hint: '.win[data-app="notepad"] .win-close', check: closed('notepad') },
      ],
    },
    {
      id: 'drag', icon: 'hand', title: tr('Вікна-мандрівники'), desc: tr('Пересуваємо вікно й змінюємо його розмір.'), desktopOnly: true,
      steps: [
        { text: tr('Відкрий «Калькулятор» (через «Меню» або робочий стіл).'), hint: [deskLink('calculator'), '#start-btn'], check: opened('calculator') },
        { text: tr('Перетягни Калькулятор за заголовок в інше місце.'), hint: winOf('calculator', '.win-titlebar'), check: (t, d) => t === 'win:move' && d.app === 'calculator' },
        { text: tr('Зміни розмір вікна: потягни за його правий нижній кут.'), hint: winOf('calculator', '.rs-se'), check: (t, d) => t === 'win:resize' && d.app === 'calculator' },
        { text: tr('Перетягни вікно за заголовок до самого лівого краю екрана — воно займе половину екрана.'), hint: winOf('calculator', '.win-titlebar'), check: (t, d) => t === 'win:snap' && d.app === 'calculator' && d.side === 'left' },
        { text: tr('Закрий вікно.'), hint: '.win[data-app="calculator"] .win-close', check: closed('calculator') },
      ],
    },
    {
      id: 'folder', icon: 'folder', title: tr('Моя перша папка'), desc: tr('Створюємо й перейменовуємо папку.'),
      setup: (ctx) => { ctx.state.folderName = fs().uniqueName('desktop', tr('Мої роботи')); },
      steps: [
        {
          text: tr('Клацни правою кнопкою на робочому столі. Обери «Створити», а потім «Папку».'),
          touchText: tr('На робочому столі натисни «Дії», потім «Створити» й «Папку».'),
          hint: ['[data-hint="create-folder"]', '[data-hint="create"]', '[data-hint="desktop-actions"]', '#desk-icons'],
          check: (t, d, ctx) => {
            if (t !== 'fs:create' || d.node.type !== 'folder' || d.node.parent !== 'desktop') return false;
            ctx.state.folder = d.node.id;
            return true;
          },
        },
        {
          text: (ctx) => tr('Напиши назву «') + ctx.state.folderName + tr('» і натисни Enter.'),
          touchText: (ctx) => tr('Напиши назву «') + ctx.state.folderName + tr('» і торкнися будь-де поруч (або натисни Enter).'),
          tip: tr('Якщо поле назви закрилося, відкрий дії папки й обери «Перейменувати».'),
          hint: ['[data-hint="rename"]', itemHint('folder')],
          check: (t, d, ctx) => t === 'fs:rename' && d.node.id === ctx.state.folder && d.node.parent === 'desktop' && nameIs(d.node, ctx.state.folderName),
        },
        {
          text: (ctx) => tr('Відкрий папку «') + ctx.state.folderName + '».',
          hint: itemHint('folder'),
          check: (t, d, ctx) => {
            if (t !== 'explorer:open' || d.folder !== ctx.state.folder) return false;
            ctx.state.win = d.winId;
            return true;
          },
        },
        { text: tr('Закрий вікно папки.'), hint: winOf('explorer', '.win-close'), check: closedWindow },
      ],
    },
    {
      id: 'notepad', icon: 'notebook', title: tr('Пишемо в Блокноті'), desc: tr('Пишемо текст і зберігаємо його у файл.'),
      steps: [
        { text: tr('Відкрий «Блокнот».'), hint: [deskLink('notepad'), '#start-btn'], check: newWindow('notepad') },
        { text: tr('Напиши, що тобі подобається робити.'), hint: winOf('notepad', '.np-text'), check: (t, d, ctx) => t === 'notepad:input' && d.winId === ctx.state.win && d.length >= 5 },
        { text: tr('Натисни «Зберегти». Напиши нову назву й збережи файл у «Документах».'), tip: tr('Якщо зберіг не туди, відкрий «Файл» → «Зберегти як…».'), hint: ['.file-picker [data-id="docs"]', winOf('notepad', '[data-hint="np-savebtn"]')], check: savedIn('notepad', 'docs') },
        { text: tr('Закрий Блокнот.'), hint: winOf('notepad', '.win-close'), check: closedWindow },
        { text: tr('Відкрий «Комп\'ютер», а тоді папку «Документи».'), hint: ['.win[data-app="explorer"] [data-hint="place-docs"]', deskLink('explorer')], check: openedFolder('docs') },
        { text: (ctx) => tr('Відкрий свій файл «') + nameOf(ctx, 'file') + '».', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'paint', icon: 'palette', title: tr('Маленький художник'), desc: tr('Малюємо й зберігаємо малюнок.'),
      steps: [
        { text: tr('Відкрий програму «Малюнок».'), hint: [deskLink('paint'), '#start-btn'], check: newWindow('paint') },
        { text: tr('Зроби щонайменше три штрихи. Можеш змінювати колір і інструмент.'), hint: winOf('paint', '.pt-palette'), check: (t, d, ctx) => t === 'paint:draw' && d.winId === ctx.state.win && (ctx.state.draws = (ctx.state.draws || 0) + 1) >= 3 },
        { text: tr('Натисни «Зберегти». Напиши нову назву й збережи файл у «Малюнках».'), hint: ['.file-picker .btn-primary', winOf('paint', '[data-hint="pt-savebtn"]')], check: savedIn('paint', 'pics') },
        { text: tr('Закрий «Малюнок».'), hint: winOf('paint', '.win-close'), check: closedWindow },
        { text: tr('Відкрий «Комп\'ютер», а тоді папку «Малюнки».'), hint: ['.win[data-app="explorer"] [data-hint="place-pics"]', deskLink('explorer')], check: openedFolder('pics') },
        { text: (ctx) => tr('Відкрий свій малюнок «') + nameOf(ctx, 'file') + '».', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'trash', icon: 'trash', title: tr('Кошик'), desc: tr('Відновлюємо файл із кошика й видаляємо його назавжди.'),
      setup: (ctx) => practiceFile(ctx, tr('Тренування — Кошик.txt'), tr('Цей навчальний файл можна видалити.')),
      steps: [
        {
          text: (ctx) => tr('Перетягни файл «') + nameOf(ctx, 'file') + tr('» на «Кошик».'),
          touchText: (ctx) => tr('Біля файла «') + nameOf(ctx, 'file') + tr('» натисни «Дії» → «Видалити».'),
          hint: ['[data-hint="delete"]', itemActions(itemHint('file')), itemHint('file')],
          check: fileAction('fs:trash'),
        },
        { text: tr('Відкрий «Кошик» на робочому столі.'), hint: deskItem((n) => n.id === 'link-trash'), check: openedFolder('trash') },
        {
          text: (ctx) => tr('Відкрий «Дії» біля «') + nameOf(ctx, 'file') + tr('» і натисни «Відновити».'),
          hint: ['[data-hint="restore"]', itemActions(fileInFiles), fileInFiles],
          check: fileAction('fs:restore'),
        },
        {
          text: (ctx) => tr('Знову видали зі столу файл «') + nameOf(ctx, 'file') + '».',
          tip: tr('Скористайся кнопкою «Дії» біля файла або перетягни його на «Кошик».'),
          hint: ['[data-hint="delete"]', itemActions(itemHint('file')), itemHint('file')],
          check: fileAction('fs:trash'),
        },
        {
          text: (ctx) => tr('У «Кошику» відкрий «Дії» біля «') + nameOf(ctx, 'file') + tr('» й обери «Видалити назавжди».'),
          tip: tr('Підтвердь видалення лише цього тренувального файла.'),
          hint: ['[data-hint="delete-forever"]', itemActions(fileInFiles), fileInFiles, deskItem((n) => n.id === 'link-trash')],
          check: fileAction('fs:delete'),
        },
      ],
    },
    {
      id: 'order', icon: 'folder-open', title: tr('Порядок на столі'), desc: tr('Перекладаємо файл у папку.'),
      setup: (ctx) => {
        const folder = fs().createFolder('desktop', tr('Тренування — Навчання'));
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
        practiceFile(ctx, tr('Тренування — Казка.txt'), tr('Жили-були дід та баба, і була в них курочка Ряба…'));
      },
      steps: [
        {
          text: (ctx) => tr('Перетягни «') + nameOf(ctx, 'file') + tr('» на папку «') + nameOf(ctx, 'folder') + '».',
          touchText: (ctx) => tr('Перемісти «') + nameOf(ctx, 'file') + tr('» у «') + nameOf(ctx, 'folder') + tr('». У діях файла обери «Вирізати», у діях папки — «Вставити сюди».'),
          hint: (ctx) => {
            const item = VOS.ui.clipboard?.op === 'cut' && VOS.ui.clipboard.id === ctx.state.file ? itemHint('folder') : itemHint('file');
            return itemActions(item)(ctx);
          },
          check: (t, d, ctx) => t === 'fs:move' && d.node.id === ctx.state.file && d.to === ctx.state.folder,
        },
        { text: (ctx) => tr('Відкрий папку «') + nameOf(ctx, 'folder') + '».', hint: itemHint('folder'), check: (t, d, ctx) => openedFolder(ctx.state.folder)(t, d) },
        { text: tr('Відкрий казку і прочитай її.'), hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'copy', icon: 'copy', title: tr('Копіюємо файл'), desc: tr('Робимо копію файлу в іншій папці.'),
      setup: (ctx) => practiceFile(ctx, tr('Тренування — Розклад.txt'), tr('Понеділок: читання, математика, малювання\nВівторок: письмо, природа, фізкультура')),
      steps: [
        { text: (ctx) => tr('Відкрий «Дії» біля «') + nameOf(ctx, 'file') + tr('» і натисни «Копіювати».'), hint: ['[data-hint="copy"]', itemActions(itemHint('file')), itemHint('file')], check: fileAction('clipboard:copy') },
        { text: tr('Відкрий «Комп\'ютер», а в ньому — папку «Документи».'), hint: ['.win[data-app="explorer"] [data-hint="place-docs"]', deskLink('explorer')], check: (t, d) => t === 'explorer:open' && d.folder === 'docs' },
        { text: tr('Угорі у «Документах» натисни «Дії» → «Вставити».'), hint: ['[data-hint="paste"]', winOf('explorer', '[data-hint="explorer-actions"]')], check: (t, d, ctx) => t === 'fs:copy' && d.source.id === ctx.state.file && d.node.parent === 'docs' },
      ],
    },
    {
      id: 'multi', icon: 'windows', title: tr('Багато вікон'), desc: tr('Перемикаємося між програмами.'),
      steps: [
        { text: tr('Відкрий «Калькулятор».'), hint: [deskLink('calculator'), '#start-btn'], check: opened('calculator') },
        { text: tr('Тепер відкрий «Блокнот». Калькулятор сховається позаду.'), hint: [deskLink('notepad'), '#start-btn'], check: (t, d) => t === 'win:open' && d.app === 'notepad' },
        { text: tr('Перейди до Калькулятора: натисни його кнопку на панелі задач.'), hint: '.task-btn[data-app="calculator"]', check: (t, d) => t === 'taskbar:switch' && d.app === 'calculator' },
        { text: tr('Сховай усі вікна кнопкою «Згорнути все» в правому нижньому куті.'), hint: '#show-desktop', check: (t) => t === 'desktop:show' },
      ],
    },
    {
      id: 'search', icon: 'search', title: tr('Шукаємо програму'), desc: tr('Знаходимо програму пошуком.'),
      steps: [
        { text: tr('Відкрий «Меню».'), hint: '#start-btn', check: (t) => t === 'start:open' },
        { text: tr('Почни писати в полі пошуку слово «Пензлик».'), hint: '[data-hint="start-search"]', check: (t, d) => t === 'start:search' && d.q.toLocaleLowerCase('uk').includes(tr('пенз')) },
        { text: tr('Запусти знайдену програму «Пензлик».'), hint: startApp('penslyk'), check: opened('penslyk') },
        { text: tr('Помалюй трішки, а потім закрий вікно.'), hint: '.win[data-app="penslyk"] .win-close', check: closed('penslyk') },
      ],
    },
    {
      id: 'look', icon: 'palette', title: tr('Мій робочий стіл'), desc: tr('Налаштовуємо шпалери й значки.'),
      steps: [
        { text: tr('На робочому столі натисни «Дії» → «Змінити шпалери…».'), tip: tr('Або відкрий «Меню» → «Налаштування».'), hint: ['[data-hint="bg-wallpaper"]', '[data-hint="desktop-actions"]'], check: opened('settings') },
        { text: tr('Вибери шпалери, які тобі подобаються.'), hint: '.win[data-app="settings"] .wp-grid', check: (t) => t === 'settings:wallpaper' },
        { text: tr('Відкрий розділ «Значки й мишка».'), hint: '[data-hint="set-mouse"]', check: (t, d) => t === 'settings:page' && d.page === 'mouse' },
        { text: tr('Зміни розмір значків на робочому столі.'), hint: '.win[data-app="settings"] [data-hint="icons-l"]', check: (t) => t === 'settings:iconSize' },
      ],
    },
    {
      id: 'shutdown', icon: 'power', title: tr('Правильне вимкнення'), desc: tr('Вимикаємо комп\'ютер через «Меню».'),
      steps: [
        { text: tr('Відкрий «Меню».'), hint: '#start-btn', check: (t) => t === 'start:open' },
        { text: tr('Натисни круглу кнопку вимкнення вгорі меню.'), hint: '[data-hint="power"]', check: (t, d) => t === 'ui:menu' && d.target === 'power' },
        { text: tr('Вибери «Вимкнути».'), hint: '[data-hint="power-off"]', check: (t) => t === 'power:off' },
      ],
    },
    {
      id: 'find-file', icon: 'search', title: tr('Де мій малюнок?'), desc: tr('Знаходимо файл за назвою й відкриваємо його папку.'),
      setup: (ctx) => {
        const folder = fs().createFolder('pics', tr('Тренування — Небо'));
        const file = fs().createFile(folder.id, tr('Нічна зірка.png'), practicePicture());
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
        ctx.state.file = file.id;
        ctx.state.fileName = file.name;
      },
      steps: [
        openImages,
        { text: tr('У полі пошуку файлів напиши «зірка».'), hint: searchBox, check: searchImages },
        { text: (ctx) => tr('Біля «Нічна зірка.png» з папки «') + nameOf(ctx, 'folder') + tr('» натисни «Відкрити папку».'), hint: revealFileHint, check: foundFile },
        { text: tr('Відкрий виділений малюнок.'), hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'shortcut', icon: 'link', title: tr('Швидка стежка до папки'), desc: tr('Створюємо ярлик і перевіряємо, де лишився оригінал.'),
      setup: (ctx) => {
        const folder = fs().createFolder('docs', tr('Тренування — Екскурсія'));
        fs().createFile(folder.id, tr('Маршрут.txt'), tr('Стартуємо біля школи, ідемо до бібліотеки й повертаємося через парк.'));
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
      },
      steps: [
        { text: tr('Відкрий «Комп\'ютер», тоді вибери «Документи».'), hint: place('docs'), check: openedFolder('docs') },
        {
          text: (ctx) => tr('Відкрий «Дії» біля «') + nameOf(ctx, 'folder') + tr('» й створи ярлик на робочому столі.'),
          hint: ['[data-hint="create-shortcut"]', itemActions(itemHint('folder', '.win[data-app="explorer"]'))],
          check: (t, d, ctx) => {
            if (t !== 'fs:shortcut' || d.targetId !== ctx.state.folder) return false;
            ctx.state.shortcut = d.node.id;
            return true;
          },
        },
        { text: tr('Покажи робочий стіл кнопкою «Згорнути все». Відкрий новий значок зі стрілочкою.'), hint: [itemHint('shortcut'), '#show-desktop'], check: (t, d, ctx) => t === 'file:shortcut-open' && d.id === ctx.state.shortcut && d.targetId === ctx.state.folder },
        { text: tr('Знову покажи робочий стіл. У «Діях» ярлика обери «Видалити».'), hint: ['[data-hint="delete"]', itemActions(itemHint('shortcut')), '#show-desktop'], check: (t, d, ctx) => t === 'fs:trash' && d.node.id === ctx.state.shortcut },
        { text: (ctx) => tr('Повернися в «Документи» й відкрий папку «') + nameOf(ctx, 'folder') + tr('». Оригінал на місці!'), hint: [itemHint('folder', '.win.active[data-app="explorer"]'), ...place('docs')], check: (t, d, ctx) => t === 'explorer:open' && d.folder === ctx.state.folder && fs().isInTrash(ctx.state.shortcut) },
      ],
    },
    {
      id: 'unzip', icon: 'archive', title: tr('Що в архіві?'), desc: tr('Розпаковуємо ZIP і відкриваємо малюнок із набору.'),
      setup: (ctx) => {
        const picture = practicePicture().split(',')[1];
        const archive = VOS.transfer.createPracticeZip('desktop', tr('Тренування — Небо.zip'), [
          { path: tr('Підказка.txt'), content: tr('У папці «Зображення» є нічна зірка.') },
          { path: tr('Зображення/Нічна зірка.png'), bytes: Uint8Array.from(atob(picture), (ch) => ch.charCodeAt(0)) },
        ]);
        ctx.state.archive = archive.id;
        ctx.state.archiveName = archive.name;
        ctx.state.folderName = fs().baseName(archive.name);
      },
      steps: [
        {
          text: (ctx) => tr('На робочому столі відкрий «Дії» біля «') + nameOf(ctx, 'archive') + tr('» й обери «Розпакувати».'),
          hint: ['[data-hint="extract-zip"]', itemActions(itemHint('archive')), '#show-desktop'],
          check: (t, d, ctx) => {
            if (t !== 'fs:extract' || d.fileId !== ctx.state.archive) return false;
            ctx.state.folder = d.folderId;
            return true;
          },
        },
        {
          text: (ctx) => tr('У розпакованій папці «') + nameOf(ctx, 'folder') + tr('» відкрий «Зображення».'),
          hint: [itemHint('folder'), winOf('explorer', '.ex-items')],
          check: (t, d, ctx) => {
            if (t !== 'explorer:open' || fs().get(d.folder)?.parent !== ctx.state.folder) return false;
            const file = fs().findByName(d.folder, tr('Нічна зірка.png'));
            if (!file) return false;
            ctx.state.file = file.id;
            return true;
          },
        },
        { text: tr('Відкрий «Нічна зірка.png».'), hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'exhibition', icon: 'palette', title: tr('Готуємо виставку'), desc: tr('Створюємо листівку, знаходимо файл і додаємо копію до виставки.'),
      setup: (ctx) => {
        const folder = fs().createFolder('docs', tr('Виставка'));
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
        ctx.state.cardName = fs().baseName(fs().uniqueName('pics', tr('Листівка.png')));
        ctx.state.fileName = ctx.state.cardName + '.png';
      },
      steps: [
        { text: tr('Відкрий «Малюнок».'), hint: [deskLink('paint'), ...startApp('paint')], check: newWindow('paint') },
        { text: tr('Намалюй листівку для шкільної виставки.'), hint: winOf('paint', 'canvas'), check: (t, d, ctx) => t === 'paint:draw' && d.winId === ctx.state.win },
        { text: (ctx) => tr('Збережи малюнок у «Малюнках». Назви його «') + ctx.state.cardName + '».', hint: ['.file-picker .btn-primary', winOf('paint', '[data-hint="pt-savebtn"]')], check: savedIn('paint', 'pics') },
        { text: tr('Закрий «Малюнок».'), hint: winOf('paint', '.win-close'), check: closedWindow },
        openImages,
        { text: (ctx) => tr('Знайди листівку через пошук. Введи «') + fileStem(ctx) + tr('» або частину назви.'), hint: searchBox, check: searchImages },
        { text: tr('Біля своєї листівки в результатах натисни «Відкрити папку».'), hint: revealFileHint, check: foundFile },
        { text: (ctx) => tr('У «Діях» файла «') + nameOf(ctx, 'file') + tr('» обери «Копіювати».'), hint: ['[data-hint="copy"]', itemActions(fileInFiles)], check: fileAction('clipboard:copy') },
        { text: (ctx) => tr('У «Документах» відкрий папку «') + nameOf(ctx, 'folder') + '».', hint: [itemHint('folder', '.win.active[data-app="explorer"]'), ...place('docs')], check: (t, d, ctx) => t === 'explorer:open' && d.folder === ctx.state.folder },
        {
          text: tr('Угорі натисни «Дії» → «Вставити». У папці виставки має з’явитися копія.'),
          hint: ['[data-hint="paste"]', winOf('explorer', '[data-hint="explorer-actions"]')],
          check: (t, d, ctx) => t === 'fs:copy' && d.source.id === ctx.state.file && d.source.parent === 'pics' && d.node.parent === ctx.state.folder,
        },
      ],
    },
    {
      id: 'organize-and-save', icon: 'folder-open', title: tr('Відкрий, упорядкуй і збережи'),
      desc: tr('Сортуємо навчальні файли, доповнюємо текст і відкриваємо його знову.'),
      setup: ({ state }) => {
        const folder = fs().createFolder('desktop', tr('Тренування — Подорож'));
        const docs = fs().createFolder(folder.id, tr('Документи'));
        const pics = fs().createFolder(folder.id, tr('Малюнки'));
        state.folder = folder.id;
        state.docs = docs.id;
        state.pics = pics.id;
        state.file = fs().createFile(folder.id, '01.txt', tr('Наша подорож почалася біля школи.')).id;
        state.notes = fs().createFile(folder.id, tr('Маршрут.txt'), tr('Від школи до парку.')).id;
        state.picture = fs().createFile(folder.id, tr('Нічна зірка.png'), practicePicture()).id;
        state.filename = tr('Подорож.txt');
      },
      steps: [
        { text: (ctx) => tr('Відкрий на робочому столі папку «') + nameOf(ctx, 'folder') + '».', hint: itemHint('folder'), check: (t, d, ctx) => t === 'explorer:open' && d.folder === ctx.state.folder },
        {
          text: ({ state }) => tr('Заміни назву 01 на «') + fs().baseName(state.filename) + tr('». Залиш розширення .txt.'),
          hint: ['[data-hint="rename"]', itemActions(fileInFiles), fileInFiles],
          check: (t, d, { state }) => t === 'fs:rename' && d.node.id === state.file && nameIs(d.node, state.filename),
        },
        {
          text: tr('Перемісти обидва тексти в «Документи», а малюнок — у «Малюнки».'),
          tip: tr('Можеш перемістити файли по одному через «Вирізати» й «Вставити».'),
          hint: winOf('explorer', '.ex-items'),
          check: (t, d, { state }) => t === 'fs:move'
            && [state.file, state.notes].every((id) => fs().get(id)?.parent === state.docs)
            && fs().get(state.picture)?.parent === state.pics,
        },
        {
          text: ({ state }) => tr('У полі пошуку введи «') + fs().baseName(state.filename) + '».',
          hint: searchBox,
          check: (t, d, { state }) => t === 'explorer:search' && d.folder === state.folder
            && d.query.trim().toLocaleLowerCase().includes(fs().baseName(state.filename).toLocaleLowerCase()),
        },
        {
          text: tr('Відкрий знайдений текст у Блокноті.'),
          hint: (ctx) => winOf('explorer', '[data-id="' + ctx.state.file + '"] .ex-result-open'),
          check: (t, d, { state }) => {
            if (t !== 'file:open' || d.fileId !== state.file || d.app !== 'notepad') return false;
            state.win = d.winId;
            state.original = fs().get(state.file).content.trim();
            return true;
          },
        },
        {
          text: tr('Допиши одне речення та натисни «Зберегти».'),
          hint: [winOf('notepad', '[data-hint="np-savebtn"]'), winOf('notepad', '.np-text')],
          check: (t, d, { state }) => t === 'notepad:save' && d.winId === state.win && d.node.id === state.file
            && d.node.content.trim().length > state.original.length,
        },
        { text: tr('Закрий Блокнот.'), hint: winOf('notepad', '.win-close'), check: closedWindow },
        {
          text: tr('Знову запусти Блокнот. У меню «Файл» натисни «Відкрити». На «Робочому столі» знайди папку завдання, відкрий її «Документи» й обери свій текст.'),
          hint: [
            (ctx) => '.file-picker .fp-item[data-id="' + ctx.state.file + '"]',
            (ctx) => '.file-picker .fp-item[data-id="' + ctx.state.docs + '"]',
            (ctx) => '.file-picker .fp-item[data-id="' + ctx.state.folder + '"]',
            '.file-picker .fp-place[data-id="desktop"]', '[data-hint="np-open"]',
            winOf('notepad', '[data-hint="np-file"]'), deskLink('notepad'), ...startApp('notepad'),
          ],
          check: (t, d, { state }) => t === 'notepad:open' && d.fileId === state.file && d.winId !== state.win,
        },
      ],
    },
    {
      id: 'web-source', icon: 'books', title: tr('Малюнок із бібліотеки'), desc: tr('Переходимо за посиланням, зберігаємо ілюстрацію та підписуємо джерело.'),
      steps: [
        { text: tr('Через «Меню» відкрий «Навчальний браузер».'), hint: startApp('browser'), check: newWindow('browser') },
        { text: tr('На початковій сторінці знайди школу «Стежинка» і відкрий «Шкільна бібліотека».'), hint: winOf('browser', '[data-hint="browser-library"]'), check: (t, d, ctx) => t === 'browser:navigate' && d.fromPageId === 'home' && d.pageId === 'library' && d.via === 'link' && d.winId === ctx.state.win },
        { text: tr('У бібліотеці перейди за посиланням до галереї.'), hint: winOf('browser', '[data-hint="browser-gallery"]'), check: (t, d, ctx) => t === 'browser:navigate' && d.fromPageId === 'library' && d.pageId === 'gallery' && d.via === 'link' && d.winId === ctx.state.win },
        {
          text: tr('Збережи ілюстрацію «Паперовий змій» у папку «Малюнки».'),
          tip: tr('Поки ти дивишся на малюнок у галереї, він є частиною сторінки. Кнопка «Зберегти малюнок» створює окремий файл у твоїй папці.'),
          hint: ['.file-picker .btn-primary', winOf('browser', '[data-hint="browser-save"]')],
          check: (t, d, ctx) => {
            if (t !== 'browser:save' || d.node.parent !== 'pics' || d.assetId !== 'paper-kite' || d.winId !== ctx.state.win) return false;
            ctx.state.file = d.node.id;
            return true;
          },
        },
        {
          text: tr('Натисни «Записати джерело», щоб відкрити підпис у Блокноті.'),
          hint: winOf('browser', '[data-hint="browser-source"]'),
          check: (t, d, ctx) => {
            if (t !== 'browser:cite' || d.assetId !== 'paper-kite' || d.winId !== ctx.state.win) return false;
            ctx.state.source = d.source;
            ctx.state.draft = d.draftWinId;
            return true;
          },
        },
        {
          text: tr('Збережи підпис у «Документах», щоб згодом знайти звідки взявся малюнок.'),
          hint: ['.file-picker .btn-primary', winOf('notepad', '[data-hint="np-savebtn"]')],
          check: (t, d, ctx) => t === 'notepad:save' && d.winId === ctx.state.draft && d.node.parent === 'docs' && d.node.content.includes(ctx.state.source) && fs().get(ctx.state.file)?.parent === 'pics',
        },
      ],
    },
  ];
})();
