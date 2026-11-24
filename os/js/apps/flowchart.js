/* Віконце — навчальний редактор блок-схем. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs } = VOS;
  const WIDTH = 920, HEIGHT = 620, BLOCK_W = 164, BLOCK_H = 68;
  const MAX_BLOCKS = 30, MAX_TEXT = 64;
  const TYPES = {
    start: tr('Початок'), action: tr('Дія'), decision: tr('Умова'), io: tr('Ввід / вивід'), end: tr('Кінець'),
  };
  const LABELS = { next: tr('Далі'), yes: tr('Так'), no: tr('Ні') };
  const OUTLETS = { next: [.5, 1, 0, 1], yes: [1, .5, 1, 0], no: [0, .5, -1, 0] };
  const branches = (type) => type === 'decision' ? ['yes', 'no'] : type === 'end' ? [] : ['next'];
  const portLabel = (block, branch) => tr('З’єднати') + ': ' + block.text
    + (branch === 'next' ? '' : ' · ' + LABELS[branch]);
  const empty = () => ({ version: 1, blocks: [], links: [] });
  const limitX = (x) => VOS.clamp(x, 10, WIDTH - BLOCK_W - 10);
  const limitY = (y) => VOS.clamp(y, 10, HEIGHT - BLOCK_H - 10);

  function read(content) {
    const graph = JSON.parse(content);
    if (graph?.version !== 1 || !Array.isArray(graph.blocks) || !Array.isArray(graph.links)
      || graph.blocks.length > MAX_BLOCKS || graph.links.length > MAX_BLOCKS * 2) throw Error();
    const blocks = new Map();
    let starts = 0;
    for (const { id, type, text, x, y } of graph.blocks) {
      if (!Number.isSafeInteger(id) || id < 1 || id > 1e9 || blocks.has(id) || !Object.hasOwn(TYPES, type)
        || typeof text !== 'string' || text.length > MAX_TEXT || !Number.isFinite(x) || !Number.isFinite(y)) throw Error();
      if (type === 'start' && ++starts > 1) throw Error();
      blocks.set(id, { id, type, text, x: limitX(x), y: limitY(y) });
    }
    const outlets = new Set();
    const links = graph.links.map(({ from, to, branch }) => {
      const key = from + '/' + branch;
      if (!blocks.has(from) || !blocks.has(to) || from === to || outlets.has(key)
        || !branches(blocks.get(from).type).includes(branch)) throw Error();
      outlets.add(key);
      return { from, to, branch };
    });
    return { version: 1, blocks: [...blocks.values()], links };
  }

  function build(blocks, links) {
    return {
      version: 1,
      blocks: blocks.map(([id, type, text, x, y]) => ({ id, type, text: text || TYPES[type], x, y })),
      links: links.map(([from, to, branch]) => ({ from, to, branch })),
    };
  }

  const EXAMPLES = () => [
    [tr('Бібліотека'), () => build([
      [1, 'start', '', 110, 22], [2, 'decision', tr('Є книжка на полиці?'), 110, 132], [3, 'action', tr('Візьми книжку'), 220, 252],
      [4, 'io', tr('Запитай бібліотекаря'), 18, 252], [5, 'end', '', 110, 378],
    ], [[1, 2, 'next'], [2, 3, 'yes'], [2, 4, 'no'], [3, 5, 'next'], [4, 5, 'next']])],
    [tr('Чи іде дощ?'), () => build([
      [1, 'start', '', 110, 22], [2, 'decision', tr('Іде дощ?'), 110, 122], [3, 'action', tr('Візьми парасольку'), 220, 242],
      [4, 'action', tr('Одягни кепку'), 18, 242], [5, 'action', tr('Виходь з дому'), 110, 360], [6, 'end', '', 110, 460],
    ], [[1, 2, 'next'], [2, 3, 'yes'], [2, 4, 'no'], [3, 5, 'next'], [4, 5, 'next'], [5, 6, 'next']])],
    [tr('Число більше за 5?'), () => build([
      [1, 'start', '', 110, 22], [2, 'io', tr('Введи число'), 110, 112], [3, 'decision', tr('число > 5'), 110, 212],
      [4, 'io', tr('число більше за 5'), 220, 332], [5, 'io', tr('число не більше за 5'), 18, 332], [6, 'end', '', 110, 450],
    ], [[1, 2, 'next'], [2, 3, 'next'], [3, 4, 'yes'], [3, 5, 'no'], [4, 6, 'next'], [5, 6, 'next']])],
  ];

  // Запуск схеми: блок «Введи число» питає значення, інший блок вводу/виводу показує свій текст,
  // умова на кшталт «число > 5» перевіряється сама.
  const WORD = /[\p{L}\p{N}_]+/gu;
  const inputName = (block) => block.type === 'io' && /^(введи|запитай|ввід)/i.test(block.text.trim())
    ? (block.text.match(WORD) || []).at(-1).toLowerCase() : null;
  const asValue = (token, vars) => {
    const word = token.trim().toLowerCase();
    if (word in vars) return vars[word];
    const number = Number(word.replace(',', '.'));
    return word !== '' && Number.isFinite(number) ? number : undefined;
  };
  function verdict(block, vars) {
    const match = block.type === 'decision' && block.text.match(/^(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+?)[?\s]*$/);
    if (!match) return null;
    const [a, b] = [asValue(match[1], vars), asValue(match[3], vars)];
    if (a === undefined || b === undefined || (typeof a !== typeof b && match[2] !== '!=')) return null;
    return { '>': a > b, '<': a < b, '>=': a >= b, '<=': a <= b, '=': a === b, '!=': a !== b }[match[2]] ? 'yes' : 'no';
  }
  const shown = (text, vars) => text.replace(WORD, (word) => (word.toLowerCase() in vars ? vars[word.toLowerCase()] : word));

  function problems(graph) {
    const found = [];
    const used = new Set(graph.links.map((link) => link.from + '/' + link.branch));
    if (!graph.blocks.some((block) => block.type === 'start')) found.push(tr('Немає блока «Початок».'));
    if (!graph.blocks.some((block) => block.type === 'end')) found.push(tr('Немає блока «Кінець».'));
    for (const block of graph.blocks) {
      for (const branch of branches(block.type)) {
        if (!used.has(block.id + '/' + branch)) {
          found.push(tr('Із блока «') + block.text + tr('» не йде стрілка') + (branch === 'next' ? '.' : ' «' + LABELS[branch] + '».'));
        }
      }
    }
    return found;
  }

  function anchor(node, dx, dy) {
    const halfW = BLOCK_W / 2, halfH = BLOCK_H / 2;
    const x = Math.abs(dx) / halfW, y = Math.abs(dy) / halfH;
    const scale = node.type === 'decision' ? x + y : Math.max(x, y);
    let factor = 1 / (scale || 1);
    const flat = halfW - halfH;
    if ((node.type === 'start' || node.type === 'end') && Math.abs(dx * factor) > flat) {
      // У заокругленого блока стрілка має торкатися дуги, а не кута прямокутника.
      const length = dx * dx + dy * dy;
      factor = (flat * Math.abs(dx) + Math.sqrt(halfH * halfH * length - flat * flat * dy * dy)) / length;
    }
    return { x: node.x + halfW + dx * factor, y: node.y + halfH + dy * factor };
  }

  function outlet(node, branch) {
    const [x, y, dx, dy] = OUTLETS[branch];
    return { x: node.x + BLOCK_W * x, y: node.y + BLOCK_H * y, dx, dy };
  }

  function arrow(ctx, from, branch, to, pointer) {
    const a = outlet(from, branch);
    const b = to ? anchor(to, a.x - to.x - BLOCK_W / 2, a.y - to.y - BLOCK_H / 2) : pointer;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance < 8) return;
    const bend = Math.min(44, distance / 2);
    const x1 = a.x + a.dx * bend, y1 = a.y + a.dy * bend;
    const dx = to ? b.x - to.x - BLOCK_W / 2 : a.x - b.x;
    const dy = to ? b.y - to.y - BLOCK_H / 2 : a.y - b.y;
    const norm = Math.hypot(dx, dy) || 1;
    const x2 = b.x + dx * bend / norm, y2 = b.y + dy * bend / norm;
    const angle = Math.atan2(b.y - y2, b.x - x2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(x1, y1, x2, y2, b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    for (const side of [-1, 1]) ctx.lineTo(b.x - 11 * Math.cos(angle + side * .48), b.y - 11 * Math.sin(angle + side * .48));
    ctx.fill();
  }

  function drawLinks(ctx, graph, color, preview) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    const blocks = new Map(graph.blocks.map((block) => [block.id, block]));
    for (const link of graph.links) {
      arrow(ctx, blocks.get(link.from), link.branch, blocks.get(link.to));
    }
    if (preview?.point) {
      ctx.setLineDash([5, 4]);
      arrow(ctx, blocks.get(preview.from), preview.branch, blocks.get(preview.to), preview.point);
      ctx.setLineDash([]);
    }
  }

  function shapePath(ctx, block) {
    const { x, y } = block, w = BLOCK_W, h = BLOCK_H;
    ctx.beginPath();
    const poly = (points) => points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    if (block.type === 'decision') poly([[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]]);
    else if (block.type === 'io') poly([[x + w * .12, y], [x + w, y], [x + w * .88, y + h], [x, y + h]]);
    else ctx.roundRect(x, y, w, h, block.type === 'action' ? 8 : h / 2);
    ctx.closePath();
  }

  // Малює схему у PNG: білий фон, ті самі форми й кольори, що на полі.
  function picture(graph) {
    const colors = { start: ['#d2f5e7', '#24755e'], end: ['#ede3ff', '#7756a8'], decision: ['#fff0c3', '#91600d'],
      io: ['#ecddf9', '#875498'], action: ['#dbeafe', '#4378bf'] };
    const pad = 24, side = 44;
    const left = Math.min(...graph.blocks.map((b) => b.x)) - side, top = Math.min(...graph.blocks.map((b) => b.y)) - pad;
    const right = Math.max(...graph.blocks.map((b) => b.x + BLOCK_W)) + side, bottom = Math.max(...graph.blocks.map((b) => b.y + BLOCK_H)) + pad;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(right - left);
    canvas.height = Math.round(bottom - top);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const arrows = document.createElement('canvas');
    arrows.width = WIDTH;
    arrows.height = HEIGHT;
    drawLinks(arrows.getContext('2d'), graph, '#176455');
    ctx.drawImage(arrows, -left, -top);
    ctx.translate(-left, -top);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    for (const block of graph.blocks) {
      const [fill, line] = colors[block.type];
      shapePath(ctx, block);
      ctx.fillStyle = fill;
      ctx.strokeStyle = line;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#122943';
      ctx.font = '800 14px sans-serif';
      const inner = BLOCK_W - (block.type === 'action' ? 26 : 56);
      const lines = [];
      let row = '';
      for (const word of block.text.split(/\s+/)) {
        const next = row ? row + ' ' + word : word;
        if (row && ctx.measureText(next).width > inner) { lines.push(row); row = word; } else row = next;
      }
      lines.push(row);
      const shown = lines.slice(0, block.type === 'decision' ? 2 : 3);
      shown.forEach((text, i) => ctx.fillText(text, block.x + BLOCK_W / 2, block.y + BLOCK_H / 2 + (i - (shown.length - 1) / 2) * 17, inner));
      for (const branch of branches(block.type)) {
        if (branch === 'next') continue;
        const o = outlet(block, branch);
        ctx.fillStyle = branch === 'no' ? '#a83e66' : '#047857';
        ctx.font = '800 12px sans-serif';
        ctx.fillText(LABELS[branch], o.x + (branch === 'yes' ? 20 : -20), o.y - 10);
      }
    }
    return canvas.toDataURL('image/png');
  }

  function launch(args) {
    let graph = empty(), fileId = null, saved = JSON.stringify(graph);
    let selected = null, linking = null, walking = null, gesture = null, saving = null, lastTap = null, scale = 1;
    let run = { vars: {}, out: [], waiting: null };
    const history = [];
    const nodes = () => graph.blocks;
    const getBlock = (id) => nodes().find((block) => block.id === id);
    const linkFor = (id, branch) => graph.links.find((link) => link.from === id && link.branch === branch);
    const dirty = () => saved !== JSON.stringify(graph);
    const canvas = el('canvas.fc-arrows', { width: WIDTH, height: HEIGHT, 'aria-hidden': 'true' });
    const layer = el('div.fc-blocks');
    const paper = el('div.fc-paper', { style: { width: WIDTH + 'px', height: HEIGHT + 'px' } }, canvas, layer);
    const sizer = el('div.fc-sizer', paper);
    const viewport = el('div.fc-view', { tabindex: '0', 'aria-label': tr('Поле блок-схеми') }, sizer);
    const trace = el('div.fc-trace');
    const status = el('div.fc-status', { role: 'status' });
    const button = (label, action, primary = false) => el('button.btn.fc-button' + (primary ? '.btn-primary' : ''),
      { type: 'button', on: { click: action } }, label);
    const saveBtn = button(tr('Зберегти'), () => save(), true);
    const undoBtn = button(tr('Скасувати дію'), () => {
      const previous = history.pop();
      if (previous) replace(previous);
    });
    const walkBtn = button(tr('Пройти схему'), async () => {
      linking = null;
      const first = nodes().find((block) => block.type === 'start');
      const found = problems(graph);
      if (!first) { await VOS.dialog.alert(found.slice(0, 4).join(' '), { icon: 'alert' }); return; }
      if (found.length && !await VOS.dialog.confirm(found.slice(0, 4).join(' ') + ' ' + tr('Усе одно пройти схему?'),
        { okText: tr('Усе одно пройти'), cancelText: tr('Виправлю') })) return;
      run = { vars: {}, out: [], waiting: null };
      enter(first.id);
    });
    const exampleBtn = button(tr('Приклад'), () => {
      const { left, bottom } = exampleBtn.getBoundingClientRect();
      VOS.ui.menu(left, bottom + 4, EXAMPLES().map(([label, make]) => ({ label, icon: 'layout', action: () => changeDocument(make()) })));
    });
    const helpBtn = button(tr('Підказки'), () => VOS.dialog.modal((d) => {
      d.content.append(el('ul.fc-tips', [
        tr('Торкнись блока в палітрі — він з’явиться на полі. Якщо на полі вибрано блок, новий стане під ним і з’єднається стрілкою.'),
        tr('Щоб з’єднати блоки, потягни кружечок біля блока до іншого блока.'),
        tr('Умова має два виходи: «Так» і «Ні».'),
        tr('Двічі торкнись блока, щоб написати текст.'),
        tr('Блок «Введи число» запитає число. Умова «число > 5» перевіриться сама.'),
        tr('Натисни «Пройти схему», щоб перевірити, чи план працює.'),
      ].map((line) => el('li', line))));
      d.foot.append(el('button.btn.btn-primary', { type: 'button', on: { click: () => d.close(true) } }, tr('Зрозуміло')));
      d.onEnter = () => d.close(true);
    }, { title: tr('Підказки'), icon: 'help' }));
    const tools = el('div.fc-tools',
      el('div.fc-tool-group', button(tr('Створити'), () => changeDocument(empty())),
        button(tr('Відкрити'), open), saveBtn, undoBtn),
      el('div.fc-tool-group', exampleBtn, button(tr('Малюнок'), exportPicture), helpBtn, walkBtn));
    const paletteItems = Object.entries(TYPES).map(([type, label]) => el('button.fc-tile', {
      type: 'button', dataset: { shape: type }, title: label, 'aria-label': label,
      on: {
        pointerdown: (event) => dragFromPalette(event, type),
        click: (event) => { if (!event.detail) add(type); },
      },
    }, el('span.fc-mini.fc-' + type, { 'aria-hidden': 'true' }), el('span.fc-tile-label', label)));
    const palette = el('div.fc-palette', { role: 'group', 'aria-label': tr('Додати блок') },
      el('span.fc-palette-title', tr('Блоки')), paletteItems);
    const zoomLabel = el('span.fc-zoom-label');
    const zoomBtn = (label, name, action) => el('button.fc-zoom-btn', { type: 'button', title: name, 'aria-label': name, on: { click: action } }, label);
    const zoomBox = el('div.fc-zoom', { role: 'group', 'aria-label': tr('Масштаб') },
      zoomBtn('−', tr('Менше'), () => setScale(scale - .15)), zoomLabel,
      zoomBtn('+', tr('Більше'), () => setScale(scale + .15)), zoomBtn('⤢', tr('Вмістити схему'), () => fit()));
    const root = el('div.app-flowchart', tools, el('div.fc-work', palette, el('div.fc-stage', viewport, zoomBox)), trace, status);

    function setScale(value) {
      scale = VOS.clamp(Math.round(value * 100) / 100, .4, 1.6);
      paper.style.transform = 'scale(' + scale + ')';
      sizer.style.width = WIDTH * scale + 'px';
      sizer.style.height = HEIGHT * scale + 'px';
      zoomLabel.textContent = Math.round(scale * 100) + '%';
    }

    function fit() {
      const list = nodes();
      const box = list.length
        ? { l: Math.min(...list.map((b) => b.x)) - 24, t: Math.min(...list.map((b) => b.y)) - 24,
          r: Math.max(...list.map((b) => b.x + BLOCK_W)) + 24, b: Math.max(...list.map((b) => b.y + BLOCK_H)) + 24 }
        : { l: 0, t: 0, r: WIDTH, b: HEIGHT };
      setScale(Math.min(viewport.clientWidth / (box.r - box.l), viewport.clientHeight / (box.b - box.t), 1.3));
      viewport.scrollTo(box.l * scale, box.t * scale);
    }
    // На вузькому екрані (телефон, планшет) схема одразу вміщається у вікно.
    const autoFit = () => { if (viewport.clientWidth && viewport.clientWidth < 640 && nodes().length) fit(); };
    setScale(1);

    function snapshot() {
      history.push(structuredClone(graph));
      if (history.length > 40) history.shift();
    }

    function replace(next) {
      graph = next;
      selected = linking = walking = lastTap = null;
      run = { vars: {}, out: [], waiting: null };
      render();
    }

    function updateTitle() {
      win.setTitle((dirty() ? '• ' : '') + (fs.get(fileId)?.name || tr('Блок-схема')));
    }

    function save() {
      if (saving) return saving;
      const content = JSON.stringify(graph);
      const pending = (async () => {
        try {
          const current = fs.get(fileId);
          if (current && !fs.isInTrash(fileId)) fs.write(fileId, content);
          else {
            const choice = await VOS.dialog.saveAs({ ext: 'flow', name: current?.name || tr('Моя схема.flow'), folder: 'docs' });
            if (!choice) return false;
            fileId = choice.replaceId || fs.createFile(choice.folder, choice.name, content).id;
            if (choice.replaceId) fs.write(fileId, content);
          }
          await fs.flush();
          saved = content;
          updateTitle();
          VOS.toast(tr('Збережено: ') + fs.get(fileId).name, 'save');
          return true;
        } catch (error) {
          VOS.dialog.error(error.message || tr('Не вдалося зберегти файл.'));
          return false;
        }
      })();
      saving = pending;
      return pending.finally(() => { if (saving === pending) saving = null; });
    }

    async function exportPicture() {
      if (!nodes().length) { VOS.toast(tr('Спочатку намалюй схему.')); return; }
      try {
        const base = (fs.get(fileId)?.name || tr('Моя схема.flow')).replace(/\.flow$/i, '');
        const choice = await VOS.dialog.saveAs({ ext: 'png', name: base + '.png', folder: 'pics', defaultFolder: 'pics', title: tr('Зберегти малюнок') });
        if (!choice) return;
        const data = picture(graph);
        const id = choice.replaceId || fs.createFile(choice.folder, choice.name, data).id;
        if (choice.replaceId) fs.write(id, data);
        await fs.flush();
        VOS.toast(tr('Збережено: ') + fs.get(id).name, 'save');
      } catch (error) {
        VOS.dialog.error(error.message || tr('Не вдалося зберегти файл.'));
      }
    }

    async function canLeave() {
      if (saving) await saving;
      if (!dirty()) return true;
      const answer = await VOS.dialog.choice(tr('Зберегти зміни у схемі?'), [
        { label: tr('Зберегти'), value: 'save', primary: true },
        { label: tr('Не зберігати'), value: 'discard' },
        { label: tr('Скасувати'), value: 'cancel' },
      ]);
      return answer === 'discard' || (answer === 'save' && await save() && !dirty());
    }

    function load(id) {
      const file = fs.get(id);
      if (!file || fs.isInTrash(id)) return;
      let next;
      try { next = read(file.content); }
      catch { VOS.dialog.error(tr('Не вдалося відкрити цю блок-схему.')); return; }
      fileId = id;
      saved = JSON.stringify(next);
      history.length = 0;
      replace(next);
      autoFit();
    }

    async function open() {
      if (!await canLeave()) return;
      const id = await VOS.dialog.openFile({ exts: ['flow'], folder: fs.get(fileId)?.parent || 'docs' });
      if (id) load(id);
    }

    async function changeDocument(next) {
      if (!await canLeave()) return;
      fileId = null;
      saved = JSON.stringify(empty());
      history.length = 0;
      viewport.scrollTo(0, 0);
      replace(next);
      autoFit();
    }

    function reveal(id) {
      const element = layer.querySelector('[data-block="' + id + '"] .fc-node');
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    const canAdd = (type) => !walking && nodes().length < MAX_BLOCKS
      && (type !== 'start' || !nodes().some((block) => block.type === 'start'));

    function add(type, point) {
      if (!canAdd(type)) return;
      snapshot();
      const id = Array.from({ length: MAX_BLOCKS }, (_, index) => index + 1).find((candidate) => !getBlock(candidate));
      const i = nodes().length;
      const spot = Array.from({ length: 30 }, (_, j) => ({ x: 24 + ((i + j) % 4) * 212, y: 25 + (Math.floor((i + j) / 4) % 6) * 100 }))
        .find(({ x, y }) => !nodes().some((block) => Math.abs(block.x - x) < BLOCK_W && Math.abs(block.y - y) < BLOCK_H));
      // Клац по палітрі при вибраному блоці: новий блок стає під ним і одразу з’єднується стрілкою.
      const parent = !point && type !== 'start' ? getBlock(selected) : null;
      const branch = parent && branches(parent.type).find((name) => !linkFor(parent.id, name));
      const [sx, sy] = { next: [0, 1], yes: [1, 1], no: [-1, 1] }[branch] || [];
      const near = branch && { x: limitX(parent.x + sx * 110), y: limitY(parent.y + sy * 106) };
      const free = near && !nodes().some((block) => Math.abs(block.x - near.x) < BLOCK_W && Math.abs(block.y - near.y) < BLOCK_H);
      const x = point ? limitX(point.x - BLOCK_W / 2) : free ? near.x : spot?.x ?? 24;
      const y = point ? limitY(point.y - BLOCK_H / 2) : free ? near.y : spot?.y ?? 25;
      nodes().push({ id, type, text: TYPES[type], x, y });
      if (free) graph.links.push({ from: parent.id, branch, to: id });
      linking = null;
      selected = id;
      render();
      reveal(id);
    }

    function connect(to) {
      if (!linking || linking.from === to || !getBlock(to)) return false;
      const { from, branch } = linking;
      const previous = linkFor(from, branch);
      const other = branch === 'yes' ? 'no' : branch === 'no' ? 'yes' : null;
      if (other && linkFor(from, other)?.to === to) {
        VOS.toast(tr('«Так» і «Ні» мають вести в різні блоки, бо інакше умова нічого не вирішує.'));
        linking = null;
        return false;
      }
      if (previous?.to !== to) {
        snapshot();
        graph.links = graph.links.filter((link) => link !== previous);
        graph.links.push({ from, branch, to });
      }
      linking = null;
      selected = to;
      return true;
    }

    function choose(id) {
      if (walking) return;
      if (linking && !connect(id)) return;
      selected = id;
      render();
      reveal(id);
    }

    function trackPointer(event, move, finish) {
      if (event.button !== 0 || !event.isPrimary || gesture) return;
      if (document.activeElement?.matches('.fc-inline')) document.activeElement.blur();
      event.preventDefault();
      const { pointerId, clientX, clientY } = event;
      let moved = false;
      const update = (next) => {
        if (next.pointerId !== pointerId) return;
        if (!moved && Math.hypot(next.clientX - clientX, next.clientY - clientY) < 5) return;
        moved = true;
        move(next);
      };
      const end = (next) => {
        if (next.pointerId !== pointerId) return;
        if (next.type === 'pointerup') update(next);
        stop(next, next.type !== 'pointerup');
      };
      const stop = (next, cancelled) => {
        document.removeEventListener('pointermove', update, true);
        document.removeEventListener('pointerup', end, true);
        document.removeEventListener('pointercancel', end, true);
        window.removeEventListener('blur', cancel);
        gesture = null;
        finish(next, moved, cancelled);
      };
      const cancel = () => stop(event, true);
      gesture = cancel;
      document.addEventListener('pointermove', update, true);
      document.addEventListener('pointerup', end, true);
      document.addEventListener('pointercancel', end, true);
      window.addEventListener('blur', cancel);
    }

    function onBoard(event) {
      return viewport.contains(document.elementFromPoint(event.clientX, event.clientY));
    }

    function boardPoint(event) {
      const bounds = paper.getBoundingClientRect();
      return { x: (event.clientX - bounds.left) / scale, y: (event.clientY - bounds.top) / scale };
    }

    function dragFromPalette(event, type) {
      if (!canAdd(type)) return;
      let ghost;
      trackPointer(event, (next) => {
        if (!ghost) {
          ghost = el('div.fc-ghost.fc-' + type, { 'aria-hidden': 'true' }, el('span', TYPES[type]));
          document.body.append(ghost);
        }
        ghost.style.left = next.clientX + 'px';
        ghost.style.top = next.clientY + 'px';
        viewport.classList.toggle('fc-placing', onBoard(next));
      }, (next, moved, cancelled) => {
        ghost?.remove();
        viewport.classList.remove('fc-placing');
        if (cancelled) return;
        if (!moved) add(type);
        else if (onBoard(next)) add(type, boardPoint(next));
      });
    }

    function updatePreview(event) {
      if (!linking) return;
      linking.point = onBoard(event) ? boardPoint(event) : null;
      const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('.fc-block');
      const target = hit && layer.contains(hit) ? Number(hit.dataset.block) : null;
      const to = target !== linking.from ? target : null;
      if (to !== linking.to) {
        layer.querySelector('.fc-drop-target')?.classList.remove('fc-drop-target');
        linking.to = to;
        if (to) layer.querySelector('[data-block="' + to + '"]')?.classList.add('fc-drop-target');
      }
      repaint();
    }

    function armPort(block, branch) {
      const active = linking?.from === block.id && linking.branch === branch;
      lastTap = null;
      linking = active ? null : { from: block.id, branch, point: outlet(block, branch) };
      selected = block.id;
      render();
      layer.querySelector('[data-block="' + block.id + '"] [data-port="' + branch + '"]')?.focus();
    }

    function dragPort(event, block, branch) {
      if (walking) return;
      trackPointer(event, (next) => {
        if (linking?.from !== block.id || linking.branch !== branch) {
          linking = { from: block.id, branch };
          paper.classList.add('fc-connecting');
          status.textContent = tr('Вибери блок, до якого має вести стрілка.');
        }
        updatePreview(next);
      }, (next, moved, cancelled) => {
        if (!moved && !cancelled) { armPort(block, branch); return; }
        if (!cancelled) {
          updatePreview(next);
          connect(linking?.to);
        }
        linking = null;
        render();
      });
    }

    function removeLink(block, branch) {
      const edge = linkFor(block.id, branch);
      if (!edge || walking) return;
      snapshot();
      graph.links = graph.links.filter((link) => link !== edge);
      linking = null;
      render();
      layer.querySelector('[data-block="' + block.id + '"] [data-port="' + branch + '"]')?.focus();
    }

    function repaint() {
      const css = getComputedStyle(root);
      drawLinks(canvas.getContext('2d'), graph, css.getPropertyValue('--fc-ink'), linking);
    }

    function positionBlock(element, block) {
      element.style.left = block.x + 'px';
      element.style.top = block.y + 'px';
    }

    function renderBlocks() {
      layer.replaceChildren(...nodes().map((block) => {
        const shell = el('div.fc-block.fc-' + block.type, { dataset: { block: block.id } });
        const item = el('button.fc-node', {
          type: 'button',
          'aria-label': TYPES[block.type] + ': ' + block.text, 'aria-pressed': String(selected === block.id),
          on: {
            click: (event) => { if (!event.detail) choose(block.id); },
            pointerdown: (event) => beginDrag(event, block, shell),
          },
        }, el('span', block.text));
        item.classList.toggle('fc-current', walking === block.id);
        shell.append(item);
        if (!walking) {
          if (selected === block.id && !linking) {
            const iconButton = (name, icon, action) => el('button.fc-quick', {
              type: 'button', title: name, 'aria-label': name, on: { click: action },
            }, VOS.icon(icon));
            shell.append(el('div.fc-quick-tools',
              iconButton(tr('Змінити текст'), 'pencil', () => editText(block.id)),
              iconButton(tr('Видалити блок'), 'trash', removeBlock)));
          }
          for (const branch of branches(block.type)) {
            const port = el('button.fc-port.fc-port-' + branch, {
              type: 'button', 'aria-label': portLabel(block, branch), title: tr('Потягни кружечок до іншого блока'),
              'aria-pressed': String(linking?.from === block.id && linking.branch === branch),
              dataset: { port: branch, linked: String(!!linkFor(block.id, branch)) },
              on: {
                pointerdown: (event) => dragPort(event, block, branch),
                click: (event) => { if (!event.detail) armPort(block, branch); },
                keydown: (event) => {
                  if (event.key !== 'Delete' && event.key !== 'Backspace') return;
                  event.preventDefault();
                  event.stopPropagation();
                  removeLink(block, branch);
                },
                contextmenu: (event) => {
                  event.preventDefault();
                  if (linkFor(block.id, branch)) VOS.ui.menu(event.clientX, event.clientY, [
                    { label: tr('Видалити стрілку'), icon: 'trash', action: () => removeLink(block, branch) },
                  ]);
                },
              },
            }, branch === 'next' ? null : el('span', LABELS[branch]));
            shell.append(port);
          }
        }
        positionBlock(shell, block);
        return shell;
      }));
      repaint();
    }

    function beginDrag(event, block, shell) {
      if (walking) return;
      const { x, y } = block;
      const origin = boardPoint(event);
      trackPointer(event, (next) => {
        if (linking) { updatePreview(next); return; }
        const point = boardPoint(next);
        block.x = limitX(x + point.x - origin.x);
        block.y = limitY(y + point.y - origin.y);
        shell.classList.add('fc-moving');
        positionBlock(shell, block);
        repaint();
      }, (next, moved, cancelled) => {
        if (linking) {
          lastTap = null;
          if (!cancelled) choose(block.id);
          return;
        }
        if (cancelled) {
          lastTap = null;
          Object.assign(block, { x, y });
          render();
          return;
        }
        if (moved && (x !== block.x || y !== block.y)) {
          const position = { x: block.x, y: block.y };
          Object.assign(block, { x, y });
          snapshot();
          Object.assign(block, position);
        }
        const doubleTap = !moved && lastTap?.id === block.id && next.timeStamp - lastTap.time < 350;
        lastTap = moved || doubleTap ? null : { id: block.id, time: next.timeStamp };
        if (moved || selected !== block.id) choose(block.id);
        if (doubleTap) editText(block.id);
      });
    }

    function editText(id) {
      const block = getBlock(id);
      const shell = layer.querySelector('[data-block="' + id + '"]');
      if (!block || !shell || shell.querySelector('.fc-inline')) return;
      const item = shell.querySelector('.fc-node');
      const field = el('input.input.fc-inline', { maxlength: MAX_TEXT, value: block.text, 'aria-label': tr('Текст блока') });
      let done = false;
      const finish = (commit) => {
        if (done || !field.isConnected) return;
        done = true;
        const text = field.value.trim() || TYPES[block.type];
        if (commit && text !== block.text) {
          snapshot();
          block.text = text;
          item.firstChild.textContent = text;
          item.setAttribute('aria-label', TYPES[block.type] + ': ' + text);
          shell.querySelectorAll('[data-port]').forEach((port) => port.setAttribute('aria-label', portLabel(block, port.dataset.port)));
          updateTitle();
          undoBtn.disabled = false;
        }
        field.remove();
        item.removeAttribute('aria-hidden');
      };
      field.addEventListener('blur', () => finish(true));
      field.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' && event.key !== 'Enter') return;
        event.preventDefault();
        event.stopPropagation();
        finish(event.key === 'Enter');
        item.focus();
      });
      item.setAttribute('aria-hidden', 'true');
      shell.append(field);
      field.focus();
      field.select();
    }

    function enter(id) {
      const block = getBlock(id);
      selected = walking = id;
      run.waiting = inputName(block);
      if (block.type === 'io' && !run.waiting) run.out.push(shown(block.text, run.vars));
      render();
      reveal(id);
    }

    function renderTrace() {
      const block = getBlock(walking);
      trace.replaceChildren();
      trace.hidden = !block;
      if (!block) return;
      trace.append(el('strong', block.type === 'io' && !inputName(block) ? shown(block.text, run.vars) : block.text));
      let chosen = null;
      if (run.waiting) {
        const field = el('input.input.fc-answer', { type: 'text', maxlength: 20, 'aria-label': tr('Твоя відповідь'), placeholder: tr('Впиши значення') });
        const submit = () => {
          const raw = field.value.trim().replace(',', '.');
          if (!raw) { field.focus(); return; }
          run.vars[run.waiting] = Number.isFinite(Number(raw)) ? Number(raw) : raw;
          run.waiting = null;
          render();
        };
        field.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); submit(); } });
        trace.append(field, button(tr('Готово'), submit, true));
        setTimeout(() => field.focus(), 0);
      } else {
        chosen = verdict(block, run.vars);
        if (chosen) trace.append(el('em', tr('Перевіряю: ') + shown(block.text, run.vars) + ' → ' + LABELS[chosen]));
        for (const branch of branches(block.type)) {
          const step = linkFor(block.id, branch);
          const next = button(LABELS[branch], () => enter(step.to), branch === chosen);
          next.disabled = !step || (!!chosen && branch !== chosen);
          trace.append(next);
        }
      }
      if (block.type === 'end') trace.append(el('p', tr('Ти дійшов до кінця схеми.')));
      else if (!run.waiting && branches(block.type).some((branch) => !linkFor(block.id, branch) && (!chosen || branch === chosen))) {
        trace.append(el('p', tr('У цьому блоці бракує стрілки.')));
      }
      if (Object.keys(run.vars).length) trace.append(el('p.fc-vars', tr('Пам’ять: ') + Object.entries(run.vars).map(([k, v]) => k + ' = ' + v).join(', ')));
      if (run.out.length) trace.append(el('p.fc-out', tr('Результат: ') + run.out.join(' · ')));
      trace.append(button(tr('Завершити перевірку'), () => { walking = null; run.waiting = null; render(); }));
    }

    function removeBlock() {
      if (!selected || walking) return;
      snapshot();
      graph.blocks = nodes().filter((block) => block.id !== selected);
      graph.links = graph.links.filter((link) => link.from !== selected && link.to !== selected);
      selected = linking = null;
      render();
    }

    function render() {
      renderBlocks();
      renderTrace();
      paper.classList.toggle('fc-connecting', !!linking);
      paletteItems.forEach((control) => { control.disabled = !canAdd(control.dataset.shape); });
      undoBtn.disabled = !history.length || !!walking;
      walkBtn.disabled = !!walking || !nodes().length;
      status.textContent = linking ? tr('Вибери блок, до якого має вести стрілка.')
        : nodes().length ? tr('Потягни кружечок до іншого блока') : tr('Перетягни блок із палітри на поле.');
      updateTitle();
    }

    root.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
        event.preventDefault();
        if (event.target.matches('input')) event.target.blur();
        save();
      } else if (event.key === 'Escape' && gesture) {
        event.preventDefault();
        gesture();
      } else if (event.key === 'Escape' && linking) {
        linking = null;
        render();
      } else if (event.key === 'F2' && selected && !walking && !linking) {
        event.preventDefault();
        editText(selected);
      } else if (event.key === 'Delete' && !event.target.matches('input')) removeBlock();
    });
    paper.addEventListener('pointermove', (event) => { if (linking && !gesture) updatePreview(event); });
    paper.addEventListener('pointerleave', () => {
      if (linking && !gesture) {
        layer.querySelector('.fc-drop-target')?.classList.remove('fc-drop-target');
        linking.point = linking.to = null;
        repaint();
      }
    });
    paper.addEventListener('click', (event) => {
      if (event.target === layer && !walking) { selected = linking = lastTap = null; render(); }
    });

    const offTheme = VOS.bus.on('settings:change', ({ key }) => { if (key === 'theme') repaint(); });
    const win = VOS.wm.open({
      app: 'flowchart', title: tr('Блок-схема'), icon: 'layout', content: root, width: 860, height: 640,
      minWidth: 320, minHeight: 310, beforeClose: canLeave,
      onClose: () => { gesture?.(); offTheme(); },
    });
    render();
    if (args.file) load(args.file);
    return win;
  }

  VOS.apps.register({ id: 'flowchart', name: 'Блок-схема', icon: 'layout', color: '#0f766e',
    category: 'creative', desc: tr('Малюй алгоритми, додавай стрілки й перевіряй маршрути'), launch });
})();
