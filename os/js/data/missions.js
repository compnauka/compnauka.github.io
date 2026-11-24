/* Віконце — перелік навчальних завдань.
   Кожен крок: text і touchText — інструкції, tip — порада, hint — що підсвітити (селектор, масив або функція),
   check(type, data, ctx) — чи виконано крок за подією шини, skipCompact — пропускати на телефоні. */
(function () {
  'use strict';
  const VOS = window.VOS;
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
  const openImages = { text: 'Відкрий «Комп\'ютер», тоді вибери «Малюнки».', hint: place('pics'), check: openedFolder('pics') };
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
      id: 'start', icon: 'menu', title: 'Привіт, «Меню»!', desc: 'Відкриваємо програму через «Меню».',
      steps: [
        { text: 'Натисни кнопку «Меню» у лівому нижньому куті екрана.', hint: '#start-btn', check: (t) => t === 'start:open' },
        { text: 'Знайди в меню «Калькулятор» і натисни на нього.', tip: 'Він є серед «Закріплених» програм.', hint: startApp('calculator'), check: opened('calculator') },
        { text: 'Порахуй щось: натисни 2, потім +, потім 3 і =.', hint: '.win[data-app="calculator"] .calc-key.eq', check: (t) => t === 'calc:result' },
        { text: 'Закрий вікно кнопкою з хрестиком у правому верхньому куті вікна.', hint: '.win[data-app="calculator"] .win-close', check: closed('calculator') },
      ],
    },
    {
      id: 'buttons', icon: 'window', title: 'Чарівні кнопки вікна', desc: 'Згортаємо, розгортаємо й закриваємо вікно.',
      steps: [
        { text: 'Відкрий «Блокнот» зі значка на робочому столі.', hint: [deskLink('notepad'), '#start-btn'], check: (t, d) => t === 'win:open' && d.app === 'notepad' },
        { text: 'Згорни вікно кнопкою з рисочкою. Воно сховається на панель задач.', hint: winOf('notepad', '.win-min'), check: (t, d) => t === 'win:minimize' && d.app === 'notepad' },
        { text: 'Поверни вікно: натисни на його кнопку на панелі задач унизу.', hint: '.task-btn.min[data-app="notepad"]', check: (t, d) => t === 'win:unminimize' && d.app === 'notepad' },
        { text: 'Розгорни вікно на весь екран кнопкою з квадратиком.', hint: winOf('notepad', '.win-max'), skipCompact: true, check: (t, d) => t === 'win:maximize' && d.app === 'notepad' },
        { text: 'Поверни звичайний розмір кнопкою з двома квадратиками.', hint: winOf('notepad', '.win-max'), skipCompact: true, check: (t, d) => t === 'win:restore' && d.app === 'notepad' },
        { text: 'Закрий вікно кнопкою з хрестиком.', hint: '.win[data-app="notepad"] .win-close', check: closed('notepad') },
      ],
    },
    {
      id: 'drag', icon: 'hand', title: 'Вікна-мандрівники', desc: 'Пересуваємо вікно й змінюємо його розмір.', desktopOnly: true,
      steps: [
        { text: 'Відкрий «Калькулятор» (через «Меню» або робочий стіл).', hint: [deskLink('calculator'), '#start-btn'], check: opened('calculator') },
        { text: 'Перетягни Калькулятор за заголовок в інше місце.', hint: winOf('calculator', '.win-titlebar'), check: (t, d) => t === 'win:move' && d.app === 'calculator' },
        { text: 'Зміни розмір вікна: потягни за його правий нижній кут.', hint: winOf('calculator', '.rs-se'), check: (t, d) => t === 'win:resize' && d.app === 'calculator' },
        { text: 'Перетягни вікно за заголовок до самого лівого краю екрана — воно займе половину екрана.', hint: winOf('calculator', '.win-titlebar'), check: (t, d) => t === 'win:snap' && d.app === 'calculator' && d.side === 'left' },
        { text: 'Закрий вікно.', hint: '.win[data-app="calculator"] .win-close', check: closed('calculator') },
      ],
    },
    {
      id: 'folder', icon: 'folder', title: 'Моя перша папка', desc: 'Створюємо й перейменовуємо папку.',
      setup: (ctx) => { ctx.state.folderName = fs().uniqueName('desktop', 'Мої роботи'); },
      steps: [
        {
          text: 'Клацни правою кнопкою на робочому столі. Обери «Створити», а потім «Папку».',
          touchText: 'На робочому столі натисни «Дії», потім «Створити» й «Папку».',
          hint: ['[data-hint="create-folder"]', '[data-hint="create"]', '[data-hint="desktop-actions"]', '#desk-icons'],
          check: (t, d, ctx) => {
            if (t !== 'fs:create' || d.node.type !== 'folder' || d.node.parent !== 'desktop') return false;
            ctx.state.folder = d.node.id;
            return true;
          },
        },
        {
          text: (ctx) => 'Напиши назву «' + ctx.state.folderName + '» і натисни Enter.',
          touchText: (ctx) => 'Напиши назву «' + ctx.state.folderName + '» і торкнися будь-де поруч (або натисни Enter).',
          tip: 'Якщо поле назви закрилося, відкрий дії папки й обери «Перейменувати».',
          hint: ['[data-hint="rename"]', itemHint('folder')],
          check: (t, d, ctx) => t === 'fs:rename' && d.node.id === ctx.state.folder && d.node.parent === 'desktop' && nameIs(d.node, ctx.state.folderName),
        },
        {
          text: (ctx) => 'Відкрий папку «' + ctx.state.folderName + '».',
          hint: itemHint('folder'),
          check: (t, d, ctx) => {
            if (t !== 'explorer:open' || d.folder !== ctx.state.folder) return false;
            ctx.state.win = d.winId;
            return true;
          },
        },
        { text: 'Закрий вікно папки.', hint: winOf('explorer', '.win-close'), check: closedWindow },
      ],
    },
    {
      id: 'notepad', icon: 'notebook', title: 'Пишемо в Блокноті', desc: 'Пишемо текст і зберігаємо його у файл.',
      steps: [
        { text: 'Відкрий «Блокнот».', hint: [deskLink('notepad'), '#start-btn'], check: newWindow('notepad') },
        { text: 'Напиши, що тобі подобається робити.', hint: winOf('notepad', '.np-text'), check: (t, d, ctx) => t === 'notepad:input' && d.winId === ctx.state.win && d.length >= 5 },
        { text: 'Натисни «Зберегти». Напиши нову назву й збережи файл у «Документах».', tip: 'Якщо зберіг не туди, відкрий «Файл» → «Зберегти як…».', hint: ['.file-picker [data-id="docs"]', winOf('notepad', '[data-hint="np-savebtn"]')], check: savedIn('notepad', 'docs') },
        { text: 'Закрий Блокнот.', hint: winOf('notepad', '.win-close'), check: closedWindow },
        { text: 'Відкрий «Комп\'ютер», а тоді папку «Документи».', hint: ['.win[data-app="explorer"] [data-hint="place-docs"]', deskLink('explorer')], check: openedFolder('docs') },
        { text: (ctx) => 'Відкрий свій файл «' + nameOf(ctx, 'file') + '».', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'paint', icon: 'palette', title: 'Маленький художник', desc: 'Малюємо й зберігаємо малюнок.',
      steps: [
        { text: 'Відкрий програму «Малюнок».', hint: [deskLink('paint'), '#start-btn'], check: newWindow('paint') },
        { text: 'Зроби щонайменше три штрихи. Можеш змінювати колір і інструмент.', hint: winOf('paint', '.pt-palette'), check: (t, d, ctx) => t === 'paint:draw' && d.winId === ctx.state.win && (ctx.state.draws = (ctx.state.draws || 0) + 1) >= 3 },
        { text: 'Натисни «Зберегти». Напиши нову назву й збережи файл у «Малюнках».', hint: ['.file-picker .btn-primary', winOf('paint', '[data-hint="pt-savebtn"]')], check: savedIn('paint', 'pics') },
        { text: 'Закрий «Малюнок».', hint: winOf('paint', '.win-close'), check: closedWindow },
        { text: 'Відкрий «Комп\'ютер», а тоді папку «Малюнки».', hint: ['.win[data-app="explorer"] [data-hint="place-pics"]', deskLink('explorer')], check: openedFolder('pics') },
        { text: (ctx) => 'Відкрий свій малюнок «' + nameOf(ctx, 'file') + '».', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'trash', icon: 'trash', title: 'Кошик', desc: 'Відновлюємо файл із кошика й видаляємо його назавжди.',
      setup: (ctx) => practiceFile(ctx, 'Тренування — Кошик.txt', 'Цей навчальний файл можна видалити.'),
      steps: [
        {
          text: (ctx) => 'Перетягни файл «' + nameOf(ctx, 'file') + '» на «Кошик».',
          touchText: (ctx) => 'Біля файла «' + nameOf(ctx, 'file') + '» натисни «Дії» → «Видалити».',
          hint: ['[data-hint="delete"]', itemActions(itemHint('file')), itemHint('file')],
          check: fileAction('fs:trash'),
        },
        { text: 'Відкрий «Кошик» на робочому столі.', hint: deskItem((n) => n.id === 'link-trash'), check: openedFolder('trash') },
        {
          text: (ctx) => 'Відкрий «Дії» біля «' + nameOf(ctx, 'file') + '» і натисни «Відновити».',
          hint: ['[data-hint="restore"]', itemActions(fileInFiles), fileInFiles],
          check: fileAction('fs:restore'),
        },
        {
          text: (ctx) => 'Знову видали зі столу файл «' + nameOf(ctx, 'file') + '».',
          tip: 'Скористайся кнопкою «Дії» біля файла або перетягни його на «Кошик».',
          hint: ['[data-hint="delete"]', itemActions(itemHint('file')), itemHint('file')],
          check: fileAction('fs:trash'),
        },
        {
          text: (ctx) => 'У «Кошику» відкрий «Дії» біля «' + nameOf(ctx, 'file') + '» й обери «Видалити назавжди».',
          tip: 'Підтвердь видалення лише цього тренувального файла.',
          hint: ['[data-hint="delete-forever"]', itemActions(fileInFiles), fileInFiles, deskItem((n) => n.id === 'link-trash')],
          check: fileAction('fs:delete'),
        },
      ],
    },
    {
      id: 'order', icon: 'folder-open', title: 'Порядок на столі', desc: 'Перекладаємо файл у папку.',
      setup: (ctx) => {
        const folder = fs().createFolder('desktop', 'Тренування — Навчання');
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
        practiceFile(ctx, 'Тренування — Казка.txt', 'Жили-були дід та баба, і була в них курочка Ряба…');
      },
      steps: [
        {
          text: (ctx) => 'Перетягни «' + nameOf(ctx, 'file') + '» на папку «' + nameOf(ctx, 'folder') + '».',
          touchText: (ctx) => 'Перемісти «' + nameOf(ctx, 'file') + '» у «' + nameOf(ctx, 'folder') + '». У діях файла обери «Вирізати», у діях папки — «Вставити сюди».',
          hint: (ctx) => {
            const item = VOS.ui.clipboard?.op === 'cut' && VOS.ui.clipboard.id === ctx.state.file ? itemHint('folder') : itemHint('file');
            return itemActions(item)(ctx);
          },
          check: (t, d, ctx) => t === 'fs:move' && d.node.id === ctx.state.file && d.to === ctx.state.folder,
        },
        { text: (ctx) => 'Відкрий папку «' + nameOf(ctx, 'folder') + '».', hint: itemHint('folder'), check: (t, d, ctx) => openedFolder(ctx.state.folder)(t, d) },
        { text: 'Відкрий казку і прочитай її.', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'copy', icon: 'copy', title: 'Копіюємо файл', desc: 'Робимо копію файлу в іншій папці.',
      setup: (ctx) => practiceFile(ctx, 'Тренування — Розклад.txt', 'Понеділок: читання, математика, малювання\nВівторок: письмо, природа, фізкультура'),
      steps: [
        { text: (ctx) => 'Відкрий «Дії» біля «' + nameOf(ctx, 'file') + '» і натисни «Копіювати».', hint: ['[data-hint="copy"]', itemActions(itemHint('file')), itemHint('file')], check: fileAction('clipboard:copy') },
        { text: 'Відкрий «Комп\'ютер», а в ньому — папку «Документи».', hint: ['.win[data-app="explorer"] [data-hint="place-docs"]', deskLink('explorer')], check: (t, d) => t === 'explorer:open' && d.folder === 'docs' },
        { text: 'Угорі у «Документах» натисни «Дії» → «Вставити».', hint: ['[data-hint="paste"]', winOf('explorer', '[data-hint="explorer-actions"]')], check: (t, d, ctx) => t === 'fs:copy' && d.source.id === ctx.state.file && d.node.parent === 'docs' },
      ],
    },
    {
      id: 'multi', icon: 'windows', title: 'Багато вікон', desc: 'Перемикаємося між програмами.',
      steps: [
        { text: 'Відкрий «Калькулятор».', hint: [deskLink('calculator'), '#start-btn'], check: opened('calculator') },
        { text: 'Тепер відкрий «Блокнот». Калькулятор сховається позаду.', hint: [deskLink('notepad'), '#start-btn'], check: (t, d) => t === 'win:open' && d.app === 'notepad' },
        { text: 'Перейди до Калькулятора: натисни його кнопку на панелі задач.', hint: '.task-btn[data-app="calculator"]', check: (t, d) => t === 'taskbar:switch' && d.app === 'calculator' },
        { text: 'Сховай усі вікна кнопкою «Згорнути все» в правому нижньому куті.', hint: '#show-desktop', check: (t) => t === 'desktop:show' },
      ],
    },
    {
      id: 'search', icon: 'search', title: 'Шукаємо програму', desc: 'Знаходимо програму пошуком.',
      steps: [
        { text: 'Відкрий «Меню».', hint: '#start-btn', check: (t) => t === 'start:open' },
        { text: 'Почни писати в полі пошуку слово «Пензлик».', hint: '[data-hint="start-search"]', check: (t, d) => t === 'start:search' && d.q.toLocaleLowerCase('uk').includes('пенз') },
        { text: 'Запусти знайдену програму «Пензлик».', hint: startApp('penslyk'), check: opened('penslyk') },
        { text: 'Помалюй трішки, а потім закрий вікно.', hint: '.win[data-app="penslyk"] .win-close', check: closed('penslyk') },
      ],
    },
    {
      id: 'look', icon: 'palette', title: 'Мій робочий стіл', desc: 'Налаштовуємо шпалери й значки.',
      steps: [
        { text: 'На робочому столі натисни «Дії» → «Змінити шпалери…».', tip: 'Або відкрий «Меню» → «Налаштування».', hint: ['[data-hint="bg-wallpaper"]', '[data-hint="desktop-actions"]'], check: opened('settings') },
        { text: 'Вибери шпалери, які тобі подобаються.', hint: '.win[data-app="settings"] .wp-grid', check: (t) => t === 'settings:wallpaper' },
        { text: 'Відкрий розділ «Значки й мишка».', hint: '[data-hint="set-mouse"]', check: (t, d) => t === 'settings:page' && d.page === 'mouse' },
        { text: 'Зміни розмір значків на робочому столі.', hint: '.win[data-app="settings"] [data-hint="icons-l"]', check: (t) => t === 'settings:iconSize' },
      ],
    },
    {
      id: 'shutdown', icon: 'power', title: 'Правильне вимкнення', desc: 'Вимикаємо комп\'ютер через «Меню».',
      steps: [
        { text: 'Відкрий «Меню».', hint: '#start-btn', check: (t) => t === 'start:open' },
        { text: 'Натисни круглу кнопку вимкнення вгорі меню.', hint: '[data-hint="power"]', check: (t, d) => t === 'ui:menu' && d.target === 'power' },
        { text: 'Вибери «Вимкнути».', hint: '[data-hint="power-off"]', check: (t) => t === 'power:off' },
      ],
    },
    {
      id: 'find-file', icon: 'search', title: 'Де мій малюнок?', desc: 'Знаходимо файл за назвою й відкриваємо його папку.',
      setup: (ctx) => {
        const folder = fs().createFolder('pics', 'Тренування — Небо');
        const file = fs().createFile(folder.id, 'Нічна зірка.png', practicePicture());
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
        ctx.state.file = file.id;
        ctx.state.fileName = file.name;
      },
      steps: [
        openImages,
        { text: 'У полі пошуку файлів напиши «зірка».', hint: searchBox, check: searchImages },
        { text: (ctx) => 'Біля «Нічна зірка.png» з папки «' + nameOf(ctx, 'folder') + '» натисни «Відкрити папку».', hint: revealFileHint, check: foundFile },
        { text: 'Відкрий виділений малюнок.', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'shortcut', icon: 'link', title: 'Швидка стежка до папки', desc: 'Створюємо ярлик і перевіряємо, де лишився оригінал.',
      setup: (ctx) => {
        const folder = fs().createFolder('docs', 'Тренування — Екскурсія');
        fs().createFile(folder.id, 'Маршрут.txt', 'Стартуємо біля школи, ідемо до бібліотеки й повертаємося через парк.');
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
      },
      steps: [
        { text: 'Відкрий «Комп\'ютер», тоді вибери «Документи».', hint: place('docs'), check: openedFolder('docs') },
        {
          text: (ctx) => 'Відкрий «Дії» біля «' + nameOf(ctx, 'folder') + '» й створи ярлик на робочому столі.',
          hint: ['[data-hint="create-shortcut"]', itemActions(itemHint('folder', '.win[data-app="explorer"]'))],
          check: (t, d, ctx) => {
            if (t !== 'fs:shortcut' || d.targetId !== ctx.state.folder) return false;
            ctx.state.shortcut = d.node.id;
            return true;
          },
        },
        { text: 'Покажи робочий стіл кнопкою «Згорнути все». Відкрий новий значок зі стрілочкою.', hint: [itemHint('shortcut'), '#show-desktop'], check: (t, d, ctx) => t === 'file:shortcut-open' && d.id === ctx.state.shortcut && d.targetId === ctx.state.folder },
        { text: 'Знову покажи робочий стіл. У «Діях» ярлика обери «Видалити».', hint: ['[data-hint="delete"]', itemActions(itemHint('shortcut')), '#show-desktop'], check: (t, d, ctx) => t === 'fs:trash' && d.node.id === ctx.state.shortcut },
        { text: (ctx) => 'Повернися в «Документи» й відкрий папку «' + nameOf(ctx, 'folder') + '». Оригінал на місці!', hint: [itemHint('folder', '.win.active[data-app="explorer"]'), ...place('docs')], check: (t, d, ctx) => t === 'explorer:open' && d.folder === ctx.state.folder && fs().isInTrash(ctx.state.shortcut) },
      ],
    },
    {
      id: 'unzip', icon: 'archive', title: 'Що в архіві?', desc: 'Розпаковуємо ZIP і відкриваємо малюнок із набору.',
      setup: (ctx) => {
        const picture = practicePicture().split(',')[1];
        const archive = VOS.transfer.createPracticeZip('desktop', 'Тренування — Небо.zip', [
          { path: 'Підказка.txt', content: 'У папці «Зображення» є нічна зірка.' },
          { path: 'Зображення/Нічна зірка.png', bytes: Uint8Array.from(atob(picture), (ch) => ch.charCodeAt(0)) },
        ]);
        ctx.state.archive = archive.id;
        ctx.state.archiveName = archive.name;
        ctx.state.folderName = fs().baseName(archive.name);
      },
      steps: [
        {
          text: (ctx) => 'На робочому столі відкрий «Дії» біля «' + nameOf(ctx, 'archive') + '» й обери «Розпакувати».',
          hint: ['[data-hint="extract-zip"]', itemActions(itemHint('archive')), '#show-desktop'],
          check: (t, d, ctx) => {
            if (t !== 'fs:extract' || d.fileId !== ctx.state.archive) return false;
            ctx.state.folder = d.folderId;
            return true;
          },
        },
        {
          text: (ctx) => 'У розпакованій папці «' + nameOf(ctx, 'folder') + '» відкрий «Зображення».',
          hint: [itemHint('folder'), winOf('explorer', '.ex-items')],
          check: (t, d, ctx) => {
            if (t !== 'explorer:open' || fs().get(d.folder)?.parent !== ctx.state.folder) return false;
            const file = fs().findByName(d.folder, 'Нічна зірка.png');
            if (!file) return false;
            ctx.state.file = file.id;
            return true;
          },
        },
        { text: 'Відкрий «Нічна зірка.png».', hint: fileInFiles, check: openedFile },
      ],
    },
    {
      id: 'exhibition', icon: 'palette', title: 'Готуємо виставку', desc: 'Створюємо листівку, знаходимо файл і додаємо копію до виставки.',
      setup: (ctx) => {
        const folder = fs().createFolder('docs', 'Виставка');
        ctx.state.folder = folder.id;
        ctx.state.folderName = folder.name;
        ctx.state.cardName = fs().baseName(fs().uniqueName('pics', 'Листівка.png'));
        ctx.state.fileName = ctx.state.cardName + '.png';
      },
      steps: [
        { text: 'Відкрий «Малюнок».', hint: [deskLink('paint'), ...startApp('paint')], check: newWindow('paint') },
        { text: 'Намалюй листівку для шкільної виставки.', hint: winOf('paint', 'canvas'), check: (t, d, ctx) => t === 'paint:draw' && d.winId === ctx.state.win },
        { text: (ctx) => 'Збережи малюнок у «Малюнках». Назви його «' + ctx.state.cardName + '».', hint: ['.file-picker .btn-primary', winOf('paint', '[data-hint="pt-savebtn"]')], check: savedIn('paint', 'pics') },
        { text: 'Закрий «Малюнок».', hint: winOf('paint', '.win-close'), check: closedWindow },
        openImages,
        { text: (ctx) => 'Знайди листівку через пошук. Введи «' + fileStem(ctx) + '» або частину назви.', hint: searchBox, check: searchImages },
        { text: 'Біля своєї листівки в результатах натисни «Відкрити папку».', hint: revealFileHint, check: foundFile },
        { text: (ctx) => 'У «Діях» файла «' + nameOf(ctx, 'file') + '» обери «Копіювати».', hint: ['[data-hint="copy"]', itemActions(fileInFiles)], check: fileAction('clipboard:copy') },
        { text: (ctx) => 'У «Документах» відкрий папку «' + nameOf(ctx, 'folder') + '».', hint: [itemHint('folder', '.win.active[data-app="explorer"]'), ...place('docs')], check: (t, d, ctx) => t === 'explorer:open' && d.folder === ctx.state.folder },
        {
          text: 'Угорі натисни «Дії» → «Вставити». У папці виставки має з’явитися копія.',
          hint: ['[data-hint="paste"]', winOf('explorer', '[data-hint="explorer-actions"]')],
          check: (t, d, ctx) => t === 'fs:copy' && d.source.id === ctx.state.file && d.source.parent === 'pics' && d.node.parent === ctx.state.folder,
        },
      ],
    },
    {
      id: 'web-source', icon: 'books', title: 'Малюнок із бібліотеки', desc: 'Переходимо за посиланням, зберігаємо ілюстрацію та підписуємо джерело.',
      steps: [
        { text: 'Через «Меню» відкрий «Навчальний браузер».', hint: startApp('browser'), check: newWindow('browser') },
        { text: 'На початковій сторінці знайди школу «Стежинка» і відкрий «Шкільна бібліотека».', hint: winOf('browser', '[data-hint="browser-library"]'), check: (t, d, ctx) => t === 'browser:navigate' && d.fromPageId === 'home' && d.pageId === 'library' && d.via === 'link' && d.winId === ctx.state.win },
        { text: 'У бібліотеці перейди за посиланням до галереї.', hint: winOf('browser', '[data-hint="browser-gallery"]'), check: (t, d, ctx) => t === 'browser:navigate' && d.fromPageId === 'library' && d.pageId === 'gallery' && d.via === 'link' && d.winId === ctx.state.win },
        {
          text: 'Збережи ілюстрацію «Паперовий змій» у папку «Малюнки».',
          tip: 'Поки ти дивишся на малюнок у галереї, він є частиною сторінки. Кнопка «Зберегти малюнок» створює окремий файл у твоїй папці.',
          hint: ['.file-picker .btn-primary', winOf('browser', '[data-hint="browser-save"]')],
          check: (t, d, ctx) => {
            if (t !== 'browser:save' || d.node.parent !== 'pics' || d.assetId !== 'paper-kite' || d.winId !== ctx.state.win) return false;
            ctx.state.file = d.node.id;
            return true;
          },
        },
        {
          text: 'Натисни «Записати джерело», щоб відкрити підпис у Блокноті.',
          hint: winOf('browser', '[data-hint="browser-source"]'),
          check: (t, d, ctx) => {
            if (t !== 'browser:cite' || d.assetId !== 'paper-kite' || d.winId !== ctx.state.win) return false;
            ctx.state.source = d.source;
            ctx.state.draft = d.draftWinId;
            return true;
          },
        },
        {
          text: 'Збережи підпис у «Документах», щоб згодом знайти звідки взявся малюнок.',
          hint: ['.file-picker .btn-primary', winOf('notepad', '[data-hint="np-savebtn"]')],
          check: (t, d, ctx) => t === 'notepad:save' && d.winId === ctx.state.draft && d.node.parent === 'docs' && d.node.content.includes(ctx.state.source) && fs().get(ctx.state.file)?.parent === 'pics',
        },
      ],
    },
  ];
})();
