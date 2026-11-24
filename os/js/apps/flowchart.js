/* Віконце — навчальний редактор блок-схем. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs } = VOS;
  const WIDTH = 920, HEIGHT = 620;
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
  const limitX = (x, block) => VOS.clamp(x, 10, WIDTH - dims(block).w - 10);
  const limitY = (y, block) => VOS.clamp(y, 30, HEIGHT - dims(block).h - 10);

  // ---------- розмір блока залежить від тексту ----------
  const FONT_PX = 15.4, LINE = 17.7, SKEW = 18;
  const CONFIG = {
    action: { minW: 150, minH: 62, padX: 32, padY: 12, inner: 210 },
    start: { minW: 150, minH: 58, padX: 58, padY: 12, inner: 190 },
    end: { minW: 150, minH: 58, padX: 58, padY: 12, inner: 190 },
    io: { minW: 164, minH: 64, padX: 2 * SKEW + 26, padY: 12, inner: 180 },
  };
  let measure = null, family = '';
  function textWidth(text) {
    if (!measure) {
      measure = document.createElement('canvas').getContext('2d');
      family = getComputedStyle(document.body).fontFamily;
    }
    measure.font = '800 ' + FONT_PX + 'px ' + family;
    return measure.measureText(text).width * 1.05;
  }
  function wrap(text, limit) {
    const lines = [];
    let row = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      let rest = word;
      while (textWidth(rest) > limit && rest.length > 1) {
        let n = rest.length;
        while (n > 1 && textWidth(rest.slice(0, n)) > limit) n--;
        if (row) { lines.push(row); row = ''; }
        lines.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      const next = row ? row + ' ' + rest : rest;
      if (row && textWidth(next) > limit) { lines.push(row); row = rest; } else row = next;
    }
    if (row || !lines.length) lines.push(row);
    return lines;
  }
  const dimCache = new Map();
  function dims(block) {
    const key = block.type + '|' + block.text;
    if (dimCache.has(key)) return dimCache.get(key);
    let result;
    const widest = (lines) => Math.max(...lines.map(textWidth));
    if (block.type === 'decision') {
      // У ромба корисна площа менша: потрібно tw / w + th / h <= 0.82.
      for (let w = 184; ; w += 8) {
        const lines = wrap(block.text, w * 0.55);
        const tw = widest(lines), th = lines.length * LINE;
        const room = 0.82 - tw / w;
        const h = Math.max(88, Math.ceil(room > 0.1 ? th / room : 1e4));
        if (h <= w * 0.62 || w >= 320) { result = { w, h: Math.min(h, 200), lines }; break; }
      }
    } else {
      const cfg = CONFIG[block.type];
      const lines = wrap(block.text, cfg.inner);
      result = {
        w: Math.max(cfg.minW, Math.ceil((widest(lines) + cfg.padX) / 2) * 2),
        h: Math.max(cfg.minH, Math.ceil(lines.length * LINE + cfg.padY * 2)),
        lines,
      };
    }
    dimCache.set(key, result);
    return result;
  }

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
      const probe = { type, text };
      blocks.set(id, { id, type, text, x: limitX(x, probe), y: limitY(y, probe) });
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
      blocks: blocks.map(([id, type, label, cx, y]) => {
        const text = label || TYPES[type];
        return { id, type, text, x: Math.max(10, Math.round(cx - dims({ type, text }).w / 2)), y };
      }),
      links: links.map(([from, to, branch]) => ({ from, to, branch })),
    };
  }

  const EXAMPLES = () => [
    [tr('Бібліотека'), () => build([
      [1, 'start', '', 300, 30], [2, 'decision', tr('Є книжка на полиці?'), 300, 130], [3, 'action', tr('Візьми книжку'), 520, 290],
      [4, 'io', tr('Запитай бібліотекаря'), 110, 290], [5, 'end', '', 300, 420],
    ], [[1, 2, 'next'], [2, 3, 'yes'], [2, 4, 'no'], [3, 5, 'next'], [4, 5, 'next']])],
    [tr('Чи іде дощ?'), () => build([
      [1, 'start', '', 300, 30], [2, 'decision', tr('Іде дощ?'), 300, 130], [3, 'action', tr('Візьми парасольку'), 520, 270],
      [4, 'action', tr('Одягни кепку'), 110, 270], [5, 'action', tr('Виходь з дому'), 300, 390], [6, 'end', '', 300, 500],
    ], [[1, 2, 'next'], [2, 3, 'yes'], [2, 4, 'no'], [3, 5, 'next'], [4, 5, 'next'], [5, 6, 'next']])],
    [tr('Число більше за 5?'), () => build([
      [1, 'start', '', 300, 30], [2, 'io', tr('Введи число'), 300, 130], [3, 'decision', tr('число > 5'), 300, 250],
      [4, 'io', tr('число більше за 5'), 540, 390], [5, 'io', tr('число не більше за 5'), 90, 390], [6, 'end', '', 300, 510],
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

  function outlet(node, branch) {
    const { w, h } = dims(node);
    if (branch === 'yes') return { x: node.x + w, y: node.y + h / 2, dx: 1 };
    if (branch === 'no') return { x: node.x, y: node.y + h / 2, dx: -1 };
    return { x: node.x + w / 2, y: node.y + h, dx: 0 };
  }

  // Прямокутні стрілки: від виходу вниз (або вбік для «Так»/«Ні»), горизонтальний відрізок, донизу в центр верху блока.
  // Усі стрілки до одного блока зливаються на спільній лінії над ним.
  function route(from, branch, to) {
    const a = outlet(from, branch), df = dims(from), dt = dims(to);
    const tx = to.x + dt.w / 2, ty = to.y, room = ty - a.y;
    const bus = room >= 12 ? ty - Math.min(22, room / 2) : ty - 22;
    const end = { x: tx, y: ty };
    const right = Math.max(from.x + df.w, to.x + dt.w) + 26, left = Math.min(from.x, to.x) - 26;
    if (branch === 'next') {
      if (a.y + 5 <= bus) return [a, { x: a.x, y: bus }, { x: tx, y: bus }, end];
      const side = tx >= a.x ? right : left, low = a.y + 16;
      return [a, { x: a.x, y: low }, { x: side, y: low }, { x: side, y: bus }, { x: tx, y: bus }, end];
    }
    if (a.dx * (tx - a.x) > 12 && a.y + 12 <= bus) return [a, { x: tx, y: a.y }, end];
    if (a.y + 5 <= bus) {
      const x = a.x + a.dx * 26;
      return [a, { x, y: a.y }, { x, y: bus }, { x: tx, y: bus }, end];
    }
    const side = a.dx > 0 ? right : left;
    return [a, { x: side, y: a.y }, { x: side, y: bus }, { x: tx, y: bus }, end];
  }

  function roundedLine(ctx, points, radius) {
    const pts = points.filter((pt, i) => !i || pt.x !== points[i - 1].x || pt.y !== points[i - 1].y)
      .filter((pt, i, all) => !i || i === all.length - 1
        || !((all[i - 1].x === pt.x && pt.x === all[i + 1].x) || (all[i - 1].y === pt.y && pt.y === all[i + 1].y)));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const r = Math.min(radius, Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) / 2,
        Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y) / 2);
      ctx.arcTo(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, r);
    }
    ctx.lineTo(pts.at(-1).x, pts.at(-1).y);
    ctx.stroke();
  }

  function drawLinks(ctx, graph, color, preview, look = {}) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const blocks = new Map(graph.blocks.map((block) => [block.id, block]));
    const heads = new Set(), labels = [];
    for (const link of graph.links) {
      const to = blocks.get(link.to);
      const path = route(blocks.get(link.from), link.branch, to);
      const lit = look.lit && look.lit.from === link.from && look.lit.branch === link.branch;
      ctx.lineWidth = lit ? 4 : 2.2;
      ctx.strokeStyle = lit ? look.mark : color;
      roundedLine(ctx, path, 9);
      heads.add(to);
      if (link.branch !== 'next') labels.push({ path, branch: link.branch });
    }
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = color;
    // Одна стрілка-вістря на блок, навіть якщо до нього веде кілька ліній.
    for (const to of heads) {
      const x = to.x + dims(to).w / 2, y = to.y;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 7, y - 12);
      ctx.lineTo(x + 7, y - 12);
      ctx.closePath();
      ctx.fill();
    }
    // «Так»/«Ні» — позначки просто на стрілці, тому видно завжди.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 12px ' + (family || 'sans-serif');
    for (const { path, branch } of labels) {
      const dx = Math.sign(path[1].x - path[0].x);
      const x = path[0].x + dx * Math.min(32, Math.max(Math.abs(path[1].x - path[0].x) / 2, 14)), y = path[0].y;
      const tone = branch === 'no' ? (look.no || '#a83e66') : (look.yes || '#047857');
      const w = ctx.measureText(LABELS[branch]).width + 14;
      ctx.fillStyle = look.bg || '#ffffff';
      ctx.strokeStyle = tone;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 9, w, 18, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = tone;
      ctx.fillText(LABELS[branch], x, y + 0.5);
    }
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    if (preview?.point) {
      ctx.setLineDash([5, 4]);
      const from = blocks.get(preview.from), to = blocks.get(preview.to);
      if (to) roundedLine(ctx, route(from, preview.branch, to), 9);
      else {
        const a = outlet(from, preview.branch);
        roundedLine(ctx, [a, preview.point], 0);
      }
      ctx.setLineDash([]);
    }
  }

  const NS = 'http://www.w3.org/2000/svg';
  // Фігура блока як SVG: контур видно з усіх боків, кути паралелограма гострі й цілі.
  function shapeSvg(type, w, h, skew = SKEW) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fc-shape');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    let shape;
    if (type === 'decision' || type === 'io') {
      shape = document.createElementNS(NS, 'polygon');
      shape.setAttribute('points', type === 'decision'
        ? [w / 2, 1, w - 1, h / 2, w / 2, h - 1, 1, h / 2].join(' ')
        : [skew, 1, w - 1, 1, w - skew, h - 1, 1, h - 1].join(' '));
    } else {
      shape = document.createElementNS(NS, 'rect');
      for (const [name, value] of Object.entries({ x: 1, y: 1, width: w - 2, height: h - 2, rx: type === 'action' ? 8 : (h - 2) / 2 })) shape.setAttribute(name, value);
    }
    svg.append(shape);
    return svg;
  }

  function shapePath(ctx, block) {
    const { x, y } = block, { w, h } = dims(block);
    ctx.beginPath();
    const poly = (points) => points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    if (block.type === 'decision') poly([[x + w / 2, y + 1], [x + w - 1, y + h / 2], [x + w / 2, y + h - 1], [x + 1, y + h / 2]]);
    else if (block.type === 'io') poly([[x + SKEW, y + 1], [x + w - 1, y + 1], [x + w - SKEW, y + h - 1], [x + 1, y + h - 1]]);
    else ctx.roundRect(x + 1, y + 1, w - 2, h - 2, block.type === 'action' ? 8 : (h - 2) / 2);
    ctx.closePath();
  }

  // Малює схему у PNG: білий фон, ті самі форми, розміри, кольори й стрілки, що на полі.
  function picture(graph) {
    const colors = { start: ['#d2f5e7', '#24755e'], end: ['#ede3ff', '#7756a8'], decision: ['#fff0c3', '#91600d'],
      io: ['#ecddf9', '#875498'], action: ['#dbeafe', '#4378bf'] };
    const pad = 24, side = 44;
    const boxes = graph.blocks.map((b) => ({ x: b.x, y: b.y, ...dims(b) }));
    const left = Math.min(...boxes.map((b) => b.x)) - side, top = Math.min(...boxes.map((b) => b.y)) - pad - 12;
    const right = Math.max(...boxes.map((b) => b.x + b.w)) + side, bottom = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
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
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 2;
    for (const block of graph.blocks) {
      const [fill, line] = colors[block.type];
      const { w, h, lines } = dims(block);
      shapePath(ctx, block);
      ctx.fillStyle = fill;
      ctx.strokeStyle = line;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#122943';
      ctx.font = '800 ' + FONT_PX + 'px ' + (family || 'sans-serif');
      lines.forEach((text, i) => ctx.fillText(text, block.x + w / 2, block.y + h / 2 + (i - (lines.length - 1) / 2) * LINE));
      for (const branch of branches(block.type)) {
        if (branch === 'next' || graph.links.some((link) => link.from === block.id && link.branch === branch)) continue;
        const o = outlet(block, branch);
        ctx.fillStyle = branch === 'no' ? '#a83e66' : '#047857';
        ctx.font = '800 12px ' + (family || 'sans-serif');
        ctx.fillText(LABELS[branch], o.x + o.dx * 22, o.y - 12);
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
    }, el('span.fc-mini.fc-' + type, { 'aria-hidden': 'true' }, shapeSvg(type, 50, 24, 8)), el('span.fc-tile-label', label)));
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
          r: Math.max(...list.map((b) => b.x + dims(b).w)) + 24, b: Math.max(...list.map((b) => b.y + dims(b).h)) + 24 }
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
      const fresh = { type, text: TYPES[type] }, size = dims(fresh);
      const clash = (x, y) => nodes().some((block) => {
        const d = dims(block);
        return x < block.x + d.w + 16 && block.x < x + size.w + 16 && y < block.y + d.h + 16 && block.y < y + size.h + 16;
      });
      const spot = Array.from({ length: 30 }, (_, j) => ({ x: 24 + ((i + j) % 4) * 220, y: 36 + (Math.floor((i + j) / 4) % 6) * 100 }))
        .find(({ x, y }) => !clash(x, y));
      // Клац по палітрі при вибраному блоці: новий блок стає під ним і одразу з’єднується стрілкою.
      const parent = !point && type !== 'start' ? getBlock(selected) : null;
      const branch = parent && branches(parent.type).find((name) => !linkFor(parent.id, name));
      let near = null;
      if (branch) {
        const pd = dims(parent), o = outlet(parent, branch);
        const cx = branch === 'next' ? parent.x + pd.w / 2 : o.x + o.dx * (28 + size.w / 2);
        near = { x: limitX(cx - size.w / 2, fresh), y: limitY(parent.y + pd.h + 46, fresh) };
      }
      const free = near && !clash(near.x, near.y);
      const x = point ? limitX(point.x - size.w / 2, fresh) : free ? near.x : spot?.x ?? 24;
      const y = point ? limitY(point.y - size.h / 2, fresh) : free ? near.y : spot?.y ?? 36;
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
          ghost = el('div.fc-ghost.fc-' + type, { 'aria-hidden': 'true' }, shapeSvg(type, 142, 56, 14), el('span', TYPES[type]));
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
      const here = getBlock(walking);
      const way = here && !run.waiting ? verdict(here, run.vars) : null;
      const dark = !!root.closest('.theme-dark');
      drawLinks(canvas.getContext('2d'), graph, css.getPropertyValue('--fc-ink'), linking, {
        bg: css.getPropertyValue('--fc-paper'), mark: css.getPropertyValue('--fc-mark'), yes: css.getPropertyValue('--fc-mark'),
        no: dark ? '#f4a6c2' : '#a83e66', lit: way ? { from: here.id, branch: way } : null,
      });
    }

    function positionBlock(element, block) {
      element.style.left = block.x + 'px';
      element.style.top = block.y + 'px';
    }

    function renderBlocks() {
      layer.replaceChildren(...nodes().map((block) => {
        const size = dims(block);
        const shell = el('div.fc-block.fc-' + block.type, { dataset: { block: block.id }, style: { width: size.w + 'px', height: size.h + 'px' } });
        const item = el('button.fc-node', {
          type: 'button',
          'aria-label': TYPES[block.type] + ': ' + block.text, 'aria-pressed': String(selected === block.id),
          on: {
            click: (event) => { if (!event.detail) choose(block.id); },
            pointerdown: (event) => beginDrag(event, block, shell),
          },
        }, shapeSvg(block.type, size.w, size.h), el('span', size.lines.join('\n')));
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
            }, branch === 'next' || linkFor(block.id, branch) ? null : el('span', LABELS[branch]));
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
        block.x = limitX(x + point.x - origin.x, block);
        block.y = limitY(y + point.y - origin.y, block);
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
          block.x = limitX(block.x, block);
          block.y = limitY(block.y, block);
          render();
          return;
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
        reveal(id);
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
    document.fonts?.ready.then(() => { dimCache.clear(); render(); });
    if (args.file) load(args.file);
    return win;
  }

  VOS.apps.register({ id: 'flowchart', name: 'Блок-схема', icon: 'layout', color: '#0f766e',
    category: 'think', desc: tr('Малюй алгоритми, додавай стрілки й перевіряй маршрути'), launch });
})();
