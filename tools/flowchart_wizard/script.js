'use strict';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────
const SVG_W = 1700;
const CX = SVG_W / 2;
const NW = 164, NH = 58, DD = 72, IOW = 180;
const VG = 118, HO = 290;
// vertical gap between rows (centers are computed from row heights)
const ROW_GAP = 42;
// Manual vertical adjustment limits (default is small, hold Shift for more)
const DY_LIMIT = 70;
const DY_LIMIT_SHIFT = 160;

const TYPE_META = {
  start: { label: 'Початок', icon: 'fa-play', fill: '#22c55e', stroke: '#15803d', explain: null },
  process: {
    label: 'Дія', icon: 'fa-bolt', fill: '#0ea5e9', stroke: '#0369a1',
    explain: 'Одна конкретна дія: натиснути кнопку, прочитати книгу, приготувати їжу.'
  },
  decision: {
    label: 'Питання', icon: 'fa-question', fill: '#f59e0b', stroke: '#b45309',
    explain: 'Перевірка умови. Відповідь — тільки «Так» або «Ні». Схема розгалужується.'
  },
  'input-output': {
    label: 'Ввід/Вивід', icon: 'fa-right-left', fill: '#a855f7', stroke: '#7e22ce',
    explain: 'Отримати дані від користувача або показати результат на екрані.'
  },
  end: {
    label: 'Кінець', icon: 'fa-flag-checkered', fill: '#f43f5e', stroke: '#be123c',
    explain: 'Алгоритм завершено. Кожна гілка повинна мати свій блок «Кінець».'
  },
};

const PLACEHOLDER = {
  process: 'Наприклад: Взяти рюкзак',
  decision: 'Наприклад: Є домашнє завдання?',
  'input-output': 'Наприклад: Введіть своє ім\'я',
};

// ────────────────────────────────────────────────────────────────
// EXAMPLES DATA
// ────────────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    id: 'ex-linear', title: 'Ранок школяра',
    subtitle: 'Лінійний алгоритм — дії йдуть одна за одною',
    icon: 'fa-sun', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200',
    nodes: [
      { id: 'n1', type: 'start', text: 'Початок' },
      { id: 'n2', type: 'process', text: 'Прокинутися' },
      { id: 'n3', type: 'process', text: 'Вмитися та почистити зуби' },
      { id: 'n4', type: 'process', text: 'Поснідати' },
      { id: 'n5', type: 'process', text: 'Вдягнутися' },
      { id: 'n6', type: 'process', text: 'Вийти з дому' },
      { id: 'n7', type: 'end', text: 'Кінець' },
    ],
    edges: [
      { from: 'n1', to: 'n2', label: null }, { from: 'n2', to: 'n3', label: null },
      { from: 'n3', to: 'n4', label: null }, { from: 'n4', to: 'n5', label: null },
      { from: 'n5', to: 'n6', label: null }, { from: 'n6', to: 'n7', label: null },
    ],
    root: 'n1',
  },
  {
    id: 'ex-branch', title: 'Чи брати парасольку?',
    subtitle: 'Розгалуження — різні дії залежно від умови',
    icon: 'fa-umbrella', color: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-200',
    nodes: [
      { id: 'n1', type: 'start', text: 'Початок' },
      { id: 'n2', type: 'process', text: 'Подивитися у вікно' },
      { id: 'n3', type: 'decision', text: 'Іде дощ?' },
      { id: 'n4', type: 'process', text: 'Взяти парасольку' },
      { id: 'n5', type: 'process', text: 'Залишити парасольку вдома' },
      { id: 'n6', type: 'end', text: 'Кінець' },
      { id: 'n7', type: 'end', text: 'Кінець' },
    ],
    edges: [
      { from: 'n1', to: 'n2', label: null }, { from: 'n2', to: 'n3', label: null },
      { from: 'n3', to: 'n4', label: 'yes' }, { from: 'n3', to: 'n5', label: 'no' },
      { from: 'n4', to: 'n6', label: null }, { from: 'n5', to: 'n7', label: null },
    ],
    root: 'n1',
  },
  {
    id: 'ex-merge', title: 'Вибір транспорту',
    subtitle: 'Розгалуження зі сходженням — гілки об\'єднуються',
    icon: 'fa-bus', color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200',
    nodes: [
      { id: 'n1', type: 'start', text: 'Початок' },
      { id: 'n2', type: 'decision', text: 'Є квиток на автобус?' },
      { id: 'n3', type: 'process', text: 'Сісти в автобус' },
      { id: 'n4', type: 'process', text: 'Іти пішки' },
      { id: 'n5', type: 'process', text: 'Дістатися до школи' },
      { id: 'n6', type: 'end', text: 'Кінець' },
    ],
    edges: [
      { from: 'n1', to: 'n2', label: null }, { from: 'n2', to: 'n3', label: 'yes' },
      { from: 'n2', to: 'n4', label: 'no' }, { from: 'n3', to: 'n5', label: null },
      { from: 'n4', to: 'n5', label: null }, { from: 'n5', to: 'n6', label: null },
    ],
    root: 'n1',
  },
  {
    id: 'ex-complex', title: 'Купівля морозива',
    subtitle: 'Складніший алгоритм з кількома умовами',
    icon: 'fa-ice-cream', color: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200',
    nodes: [
      { id: 'n1', type: 'start', text: 'Початок' },
      { id: 'n2', type: 'input-output', text: 'Порахувати гроші' },
      { id: 'n3', type: 'decision', text: 'Вистачає грошей?' },
      { id: 'n4', type: 'process', text: 'Підійти до кіоску' },
      { id: 'n5', type: 'process', text: 'Повернутись додому' },
      { id: 'n6', type: 'decision', text: 'Є шоколадне?' },
      { id: 'n7', type: 'process', text: 'Купити шоколадне' },
      { id: 'n8', type: 'process', text: 'Купити ванільне' },
      { id: 'n9', type: 'process', text: 'З\'їсти морозиво' },
      { id: 'n10', type: 'end', text: 'Кінець' },
      { id: 'n11', type: 'end', text: 'Кінець' },
    ],
    edges: [
      { from: 'n1', to: 'n2', label: null }, { from: 'n2', to: 'n3', label: null },
      { from: 'n3', to: 'n4', label: 'yes' }, { from: 'n3', to: 'n5', label: 'no' },
      { from: 'n5', to: 'n11', label: null }, { from: 'n4', to: 'n6', label: null },
      { from: 'n6', to: 'n7', label: 'yes' }, { from: 'n6', to: 'n8', label: 'no' },
      { from: 'n7', to: 'n9', label: null }, { from: 'n8', to: 'n9', label: null },
      { from: 'n9', to: 'n10', label: null },
    ],
    root: 'n1',
  },
  {
    id: 'ex-io', title: 'Перевірка паролю',
    subtitle: 'Ввід, обробка та вивід результату',
    icon: 'fa-lock', color: '#a855f7', bg: 'bg-violet-50', border: 'border-violet-200',
    nodes: [
      { id: 'n1', type: 'start', text: 'Початок' },
      { id: 'n2', type: 'input-output', text: 'Ввести пароль' },
      { id: 'n3', type: 'decision', text: 'Пароль правильний?' },
      { id: 'n4', type: 'input-output', text: 'Показати: «Ласкаво просимо!»' },
      { id: 'n5', type: 'input-output', text: 'Показати: «Помилка! Спробуй ще раз»' },
      { id: 'n6', type: 'end', text: 'Кінець' },
      { id: 'n7', type: 'end', text: 'Кінець' },
    ],
    edges: [
      { from: 'n1', to: 'n2', label: null }, { from: 'n2', to: 'n3', label: null },
      { from: 'n3', to: 'n4', label: 'yes' }, { from: 'n3', to: 'n5', label: 'no' },
      { from: 'n4', to: 'n6', label: null }, { from: 'n5', to: 'n7', label: null },
    ],
    root: 'n1',
  },
];

// ────────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────────
const S = {
  nodes: {}, edges: [], root: null, cnt: 0,
  undo: [],
  ranks: {}, pos: {},
  title: '',
  // manual offsets (persist through auto-layout)
  manual: {}, baseX: {}, baseY: {}, rankY: {}, rankH: {},
  sel: null,
  wiz: { open: false, step: 'type', pid: null, plbl: null, type: null, editId: null },
};

// ────────────────────────────────────────────────────────────────
// DOM REFS
// ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const svg = $('fc');
const wrap = $('svg-wrap');
const area = $('canvas-area');
const L_TI = $('layer-title');
const L_ED = $('layer-edges');
const L_NO = $('layer-nodes');
const L_PL = $('layer-plus');

function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }
function mkSvg(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// ────────────────────────────────────────────────────────────────
// GRAPH HELPERS
// ────────────────────────────────────────────────────────────────
const outEdges = id => S.edges.filter(e => e.from === id);
const inEdges = id => S.edges.filter(e => e.to === id);
const nodeH = id => S.nodes[id]?.type === 'decision' ? DD * 2 : NH;
const nodeW = id => {
  const t = S.nodes[id]?.type;
  return t === 'input-output' ? IOW : t === 'decision' ? DD * 2 : NW;
};

function ancestors(id) {
  const res = new Set([id]);
  const q = [id];
  while (q.length) {
    inEdges(q.shift()).forEach(e => {
      if (!res.has(e.from)) { res.add(e.from); q.push(e.from); }
    });
  }
  return res;
}

function openEnds() {
  return Object.keys(S.nodes).flatMap(id => {
    const n = S.nodes[id];
    const outValid = outEdges(id).filter(e => e.to && S.nodes[e.to]);
    if (n.type === 'end') return [];
    if (n.type === 'decision') {
      const res = [];
      if (!outValid.some(e => e.label === 'yes')) res.push({ pid: id, lbl: 'yes' });
      if (!outValid.some(e => e.label === 'no')) res.push({ pid: id, lbl: 'no' });
      return res;
    }
    return outValid.some(e => !e.label) ? [] : [{ pid: id, lbl: null }];
  });
}

function isDone() {
  return S.root && Object.keys(S.nodes).length > 1 && openEnds().length === 0;
}

function connectableNodes(pid, lbl) {
  const anc = ancestors(pid);
  return Object.values(S.nodes).filter(n => {
    if (anc.has(n.id)) return false;
    if (n.id === S.root) return false;
    if (n.type === 'start') return false;
    if (S.edges.some(e => e.from === pid && e.to === n.id && e.label === lbl)) return false;
    return true;
  });
}

function findSiblingOpenEnd(pid, lbl) {
  function decisionAncestorOf(id) {
    const visited = new Set();
    let q = inEdges(id).map(e => ({ nodeId: e.from }));
    while (q.length) {
      const { nodeId } = q.shift();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      if (S.nodes[nodeId]?.type === 'decision') return nodeId;
      inEdges(nodeId).forEach(e => q.push({ nodeId: e.from }));
    }
    return null;
  }
  const decAnc = decisionAncestorOf(pid);
  if (!decAnc) return null;
  const oe = openEnds();
  const oppLbl = lbl === 'yes' ? 'no' : lbl === 'no' ? 'yes' : null;
  if (!oppLbl) return null;
  const siblingFromDecAnc = oe.find(e => e.pid === decAnc && e.lbl === oppLbl);
  if (siblingFromDecAnc) return siblingFromDecAnc;
  const otherBranchEdge = outEdges(decAnc).find(e => e.label === oppLbl);
  if (!otherBranchEdge) return null;
  function descendants(startId) {
    const res = new Set([startId]);
    const q2 = [startId];
    while (q2.length) {
      outEdges(q2.shift()).forEach(e => {
        if (e.to && !res.has(e.to)) { res.add(e.to); q2.push(e.to); }
      });
    }
    return res;
  }
  const otherSubtree = descendants(otherBranchEdge.to);
  return oe.find(e => otherSubtree.has(e.pid)) || null;
}

// ────────────────────────────────────────────────────────────────
// UNDO
// ────────────────────────────────────────────────────────────────
function snap() {
  S.undo.push({
    nodes: JSON.parse(JSON.stringify(S.nodes)),
    edges: JSON.parse(JSON.stringify(S.edges)),
    pos: JSON.parse(JSON.stringify(S.pos)),
    manual: JSON.parse(JSON.stringify(S.manual || {})),
    root: S.root, cnt: S.cnt,
  });
  if (S.undo.length > 40) S.undo.shift();
  $('btn-undo').disabled = false;
}

function undo() {
  if (!S.undo.length) return;
  const s = S.undo.pop();
  Object.assign(S, { nodes: s.nodes, edges: s.edges, root: s.root, cnt: s.cnt, sel: null, pos: s.pos || {}, manual: s.manual || {} });
  $('btn-undo').disabled = S.undo.length === 0;
  closeWiz(); hideToolbar(); layout(); render(); mascot();
}

// ────────────────────────────────────────────────────────────────
// LAYOUT  (DAG longest-path ranks)
// ────────────────────────────────────────────────────────────────
function computeRanks() {
  const indeg = {};
  for (const id of Object.keys(S.nodes)) indeg[id] = 0;
  for (const e of S.edges) {
    if (e.to && S.nodes[e.to]) indeg[e.to] = (indeg[e.to] || 0) + 1;
  }
  const rank = {}, q = [];
  for (const id of Object.keys(S.nodes)) {
    if (!indeg[id]) { rank[id] = 0; q.push(id); }
  }
  while (q.length) {
    const id = q.shift();
    for (const e of outEdges(id)) {
      if (!e.to || !S.nodes[e.to]) continue;
      rank[e.to] = Math.max(rank[e.to] ?? 0, (rank[id] ?? 0) + 1);
      if (--indeg[e.to] === 0) q.push(e.to);
    }
  }
  return rank;
}

function layout() {
  S.ranks = {}; S.pos = {}; S.rankY = {}; S.rankH = {}; S.baseX = {}; S.baseY = {};
  if (!S.root) return;

  const rank = computeRanks();
  S.ranks = rank;

  const byRnk = {};
  for (const [id, r] of Object.entries(rank))
    (byRnk[r] = byRnk[r] || []).push(id);

  // ── X positioning (auto)
  const x = {};
  x[S.root] = CX;

  const rnks = Object.keys(byRnk).map(Number).sort((a, b) => a - b);
  for (const r of rnks) {
    for (const id of byRnk[r]) {
      if (x[id] === undefined) {
        const pxs = inEdges(id).map(e => x[e.from]).filter(v => v !== undefined);
        x[id] = pxs.length ? pxs.reduce((a, b) => a + b, 0) / pxs.length : CX;
      }
      const n = S.nodes[id];
      const out = outEdges(id);

      if (n.type === 'decision') {
        const ye = out.find(e => e.label === 'yes');
        const ne = out.find(e => e.label === 'no');
        if (ye?.to && x[ye.to] === undefined) x[ye.to] = x[id] - HO;
        if (ne?.to && x[ne.to] === undefined) x[ne.to] = x[id] + HO;
      } else {
        const ne = out.find(e => !e.label);
        if (ne?.to && x[ne.to] === undefined) x[ne.to] = x[id];
      }
    }
  }

  // Join nodes: center by ALL parents
  for (const id of Object.keys(S.nodes)) {
    if (inEdges(id).length > 1) {
      const pxs = inEdges(id).map(e => x[e.from]).filter(v => v !== undefined);
      if (pxs.length >= 2)
        x[id] = pxs.reduce((a, b) => a + b, 0) / pxs.length;
    }
  }

  // store baseX before applying manual offsets (needed to persist drag changes)
  S.baseX = { ...x };

  // apply manual horizontal offsets (persist across layout calls)
  if (!S.manual) S.manual = {};
  for (const id of Object.keys(x)) {
    const dx = S.manual[id]?.dx;
    if (typeof dx === 'number' && Number.isFinite(dx)) x[id] += dx;
  }

  // ── Y positioning (adaptive to row max height to avoid overlaps)
  // Leave extra room for the algorithm title so it never sticks to the Start block.
  const hasTitle = String(S.title ?? '').trim().length > 0;
  const TOP = hasTitle ? 190 : 88;
  const yByRank = {};
  const hByRank = {};
  const rowH = (r) => Math.max(...(byRnk[r] || []).map(id => nodeH(id)), NH);

  if (!rnks.length) return;

  yByRank[rnks[0]] = TOP;
  hByRank[rnks[0]] = rowH(rnks[0]);

  for (let i = 1; i < rnks.length; i++) {
    const prev = rnks[i - 1];
    const cur = rnks[i];
    const ph = hByRank[prev] ?? rowH(prev);
    const ch = rowH(cur);
    hByRank[cur] = ch;
    yByRank[cur] = (yByRank[prev] ?? TOP) + (ph / 2 + ROW_GAP + ch / 2);
  }

  S.rankY = yByRank;
  S.rankH = hByRank;

  for (const id of Object.keys(S.nodes)) {
    const r = rank[id];
    if (r === undefined) continue;

    const baseY = (yByRank[r] ?? (TOP + r * VG));
    S.baseY[id] = baseY;

    const rawDy = S.manual?.[id]?.dy;
    const dy = (typeof rawDy === 'number' && Number.isFinite(rawDy))
      ? Math.max(-DY_LIMIT, Math.min(DY_LIMIT, rawDy))
      : 0;

    S.pos[id] = { x: x[id] ?? CX, y: baseY + dy };
  }

  let maxY = 300;
  for (const [id, p] of Object.entries(S.pos)) {
    maxY = Math.max(maxY, p.y + nodeH(id) / 2);
  }
  svg.style.minHeight = (maxY + 220) + 'px';
  updateWrapSize();
}


// ────────────────────────────────────────────────────────────────
// RENDER
// ────────────────────────────────────────────────────────────────
function render() {
  clearEl(L_TI); clearEl(L_ED); clearEl(L_NO); clearEl(L_PL);
  renderTitle();
  for (const e of S.edges) renderEdge(e);
  for (const id of Object.keys(S.nodes)) renderNode(id);
  for (const e of openEnds()) renderPlus(e);
  scheduleToolbarUpdate();
  updateProgress();
}

// ── renderTitle ───────────────────────────────────────────────
function renderTitle() {
  const title = String(S.title ?? '').trim();
  if (!title) return;

  let minTop = Infinity;
  for (const id of Object.keys(S.nodes)) {
    const p = S.pos[id];
    if (!p) continue;
    minTop = Math.min(minTop, p.y - nodeH(id) / 2);
  }
  if (!Number.isFinite(minTop)) minTop = 88;

  const x = CX;
  // Put the title noticeably above the top-most block
  const y = Math.max(72, minTop - 92);

  const g = mkSvg('g', { id: 'alg-title' });
  const t = mkSvg('text', {
    x, y,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: '#0f172a',
    'font-size': '30',
    'font-weight': '900',
    'font-family': "'Nunito',sans-serif",
    'pointer-events': 'none',
  });
  t.textContent = title;
  g.appendChild(t);
  L_TI.appendChild(g);

  // background bubble sized from real text bbox (best effort)
  try {
    const bb = t.getBBox();
    const padX = 22, padY = 14;
    const r = mkSvg('rect', {
      x: bb.x - padX,
      y: bb.y - padY,
      width: bb.width + padX * 2,
      height: bb.height + padY * 2,
      rx: 18,
      fill: 'rgba(255,255,255,0.92)',
      stroke: '#c7d2fe',
      'stroke-width': 2,
      filter: 'url(#sh)'
    });
    g.insertBefore(r, t);
  } catch (e) { /* ignore */ }
}

// ── renderNode ────────────────────────────────────────────────
function renderNode(id) {
  const n = S.nodes[id], p = S.pos[id];
  if (!n || !p) return;
  const { x, y } = p;
  const m = TYPE_META[n.type] || TYPE_META.process;
  const sel = S.sel === id;

  const g = mkSvg('g', { 'data-nid': id, class: 'node-g' });

  if (sel) {
    const glow = buildShape(n.type, x, y, 'none', '#e879f9', 10);
    glow.setAttribute('opacity', '0.28');
    glow.removeAttribute('filter');
    g.appendChild(glow);
  }

  const shape = buildShape(n.type, x, y, m.fill, sel ? '#e879f9' : m.stroke, sel ? 3.5 : 2.5);
  shape.classList.add('node-shape');
  g.appendChild(shape);

  // Text (main) — with class for safe repositioning
  const lines = wrapText(n.text || '...', n.type === 'decision' ? 10 : 16, n.type === 'decision' ? 4 : 3);
  const lh = 18;
  const startY = y - (lines.length * lh) / 2 + lh / 2;
  for (let i = 0; i < lines.length; i++) {
    const t = mkSvg('text', {
      x, y: startY + i * lh,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: 'white', 'font-size': '14', 'font-weight': '800',
      'font-family': "'Nunito',sans-serif", 'pointer-events': 'none',
      class: 'node-main-text',
    });
    t.textContent = lines[i];
    g.appendChild(t);
  }

  // type label above (with class)
  if (n.type !== 'start') {
    const bx = n.type === 'decision' ? x + DD : x + nodeW(id) / 2;
    const by = n.type === 'decision' ? y - DD - 12 : y - NH / 2 - 10;
    const bl = mkSvg('text', {
      x: bx, y: by, 'text-anchor': 'end', fill: '#94a3b8',
      'font-size': '11', 'font-weight': '700',
      'font-family': "'Nunito',sans-serif", 'pointer-events': 'none',
      class: 'node-type-label',
    });
    bl.textContent = m.label;
    g.appendChild(bl);
  }

  L_NO.appendChild(g);
}


function buildShape(type, x, y, fill, stroke, sw) {
  const a = { fill, stroke, 'stroke-width': sw, filter: 'url(#sh)' };
  if (type === 'start' || type === 'end')
    return mkSvg('rect', { ...a, x: x - NW / 2, y: y - NH / 2, width: NW, height: NH, rx: NH / 2 });
  if (type === 'process')
    return mkSvg('rect', { ...a, x: x - NW / 2, y: y - NH / 2, width: NW, height: NH, rx: 10 });
  if (type === 'decision')
    return mkSvg('polygon', { ...a, points: `${x},${y - DD} ${x + DD},${y} ${x},${y + DD} ${x - DD},${y}` });
  const s = 20;
  return mkSvg('polygon', {
    ...a,
    points: `${x - IOW / 2 + s},${y - NH / 2} ${x + IOW / 2 + s},${y - NH / 2} ${x + IOW / 2 - s},${y + NH / 2} ${x - IOW / 2 - s},${y + NH / 2}`
  });
}

// ── renderEdge ────────────────────────────────────────────────
function renderEdge(e) {
  const fp = S.pos[e.from], tp = S.pos[e.to];
  if (!fp || !tp) return;

  const isY = e.label === 'yes', isN = e.label === 'no';
  const strk = isY ? '#16a34a' : isN ? '#dc2626' : '#475569';
  const mrk = isY ? 'url(#arr-yes)' : isN ? 'url(#arr-no)' : 'url(#arr)';
  const fn = S.nodes[e.from];
  const toTopY = tp.y - nodeH(e.to) / 2;

  let d;
  if (fn.type === 'decision') {
    const fromX = isY ? fp.x - DD : (isN ? fp.x + DD : fp.x);
    d = Math.abs(fromX - tp.x) < 2
      ? `M${fromX},${fp.y} L${tp.x},${toTopY}`
      : `M${fromX},${fp.y} L${tp.x},${fp.y} L${tp.x},${toTopY}`;
  } else {
    const fromBotY = fp.y + nodeH(e.from) / 2;
    if (Math.abs(fp.x - tp.x) < 2) {
      d = `M${fp.x},${fromBotY} L${tp.x},${toTopY}`;
    } else {
      const midY = (fromBotY + toTopY) / 2;
      d = `M${fp.x},${fromBotY} L${fp.x},${midY} L${tp.x},${midY} L${tp.x},${toTopY}`;
    }
  }

  L_ED.appendChild(mkSvg('path', {
    d, stroke: strk, 'stroke-width': 2.8, fill: 'none',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'marker-end': mrk,
  }));

  if (e.label) {
    const lx = isY ? fp.x - DD - 52 : fp.x + DD + 52;
    const lg = mkSvg('g');
    lg.appendChild(mkSvg('rect', {
      x: lx - 25, y: fp.y - 15, width: 50, height: 30, rx: 15,
      fill: 'white', stroke: strk, 'stroke-width': 2,
    }));
    const lt = mkSvg('text', {
      x: lx, y: fp.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: isY ? '#15803d' : '#b91c1c',
      'font-size': '13', 'font-weight': '800', 'font-family': "'Nunito',sans-serif",
    });
    lt.textContent = isY ? 'Так' : 'Ні';
    lg.appendChild(lt);
    L_ED.appendChild(lg);
  }
}

// ── renderPlus ────────────────────────────────────────────────
function renderPlus({ pid, lbl }) {
  const pp = S.pos[pid];
  if (!pp) return;
  const pn = S.nodes[pid];
  const rnk = S.ranks[pid] ?? 0;

  // place the "+" below the node (follows small vertical moves)
  const nextRowH = S.rankH?.[rnk + 1] ?? NH;
  const py = pp.y + nodeH(pid) / 2 + ROW_GAP + nextRowH / 2;

  let px;

  const isYesNo = (lbl === 'yes' || lbl === 'no');
  if (pn.type === 'decision' && isYesNo) {
    px = lbl === 'yes' ? pp.x - HO : pp.x + HO;
    L_PL.appendChild(mkSvg('path', {
      d: `M${lbl === 'yes' ? pp.x - DD : pp.x + DD},${pp.y} L${px},${pp.y} L${px},${py - 38}`,
      stroke: lbl === 'yes' ? '#86efac' : '#fca5a5',
      'stroke-width': 2.5, fill: 'none', 'stroke-dasharray': '7 4', 'stroke-linecap': 'round',
    }));
  } else {
    px = pp.x;
    L_PL.appendChild(mkSvg('path', {
      d: `M${px},${pp.y + nodeH(pid) / 2} L${px},${py - 38}`,
      stroke: '#a5b4fc', 'stroke-width': 2.5, fill: 'none',
      'stroke-dasharray': '7 4', 'stroke-linecap': 'round',
    }));
  }

  const need = py + 130;
  const cur = parseInt(svg.style.minHeight) || 0;
  if (cur < need) { svg.style.minHeight = need + 'px'; updateWrapSize(); }

  const clr = lbl === 'yes' ? '#16a34a' : lbl === 'no' ? '#dc2626' : '#6366f1';
  const bg2 = lbl === 'yes' ? '#dcfce7' : lbl === 'no' ? '#fee2e2' : '#eef2ff';

  const g = mkSvg('g', { style: 'cursor:pointer', 'data-plus': '1' });

  g.appendChild(mkSvg('circle', { cx: px, cy: py, r: 28, fill: 'none', stroke: clr, 'stroke-width': 2, class: 'plus-ring' }));
  g.appendChild(mkSvg('circle', { cx: px, cy: py, r: 22, fill: bg2, stroke: clr, 'stroke-width': 2 }));
  g.appendChild(mkSvg('text', {
    x: px, y: py, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: clr, 'font-size': '28', 'font-weight': '900', 'pointer-events': 'none',
    'font-family': "'Nunito',sans-serif",
  })).textContent = '+';

  if (lbl === 'yes' || lbl === 'no') {
    const hint = mkSvg('text', {
      x: px, y: py + 44, 'text-anchor': 'middle',
      fill: lbl === 'yes' ? '#15803d' : '#b91c1c',
      'font-size': '12', 'font-weight': '900', 'pointer-events': 'none',
      'font-family': "'Nunito',sans-serif",
    });
    hint.textContent = lbl === 'yes' ? '+ Так' : '+ Ні';
    g.appendChild(hint);
  }

  g.addEventListener('pointerdown', ev => {
    ev.stopPropagation();
    if (_nodeDrag) return;
    hideToolbar();
    openWiz(pid, lbl);
  });
  L_PL.appendChild(g);
}

// ────────────────────────────────────────────────────────────────
// NODE DRAG (SVG-level pointer capture)
// ────────────────────────────────────────────────────────────────
let _nodeDrag = null;
let _ignoreClickUntil = 0;

function svgClientToLocal(clientX, clientY) {
  const r = area.getBoundingClientRect();
  return {
    x: (clientX - r.left + area.scrollLeft) / _scale,
    y: (clientY - r.top + area.scrollTop) / _scale,
  };
}

svg.addEventListener('pointerdown', ev => {
  // Only start drag from node elements (not plus buttons)
  const g = ev.target.closest('[data-nid]');
  if (!g) return;
  if (S.wiz.open) return;
  ev.stopPropagation();

  const id = g.dataset.nid;
  const loc = svgClientToLocal(ev.clientX, ev.clientY);

  const baseY = (S.baseY?.[id] ?? S.rankY?.[S.ranks?.[id] ?? 0] ?? (S.pos[id]?.y ?? 0));

  _nodeDrag = {
    id,
    startLx: loc.x,
    startLy: loc.y,
    startPx: S.pos[id]?.x ?? 0,
    startPy: S.pos[id]?.y ?? 0,
    baseY,
    moved: false,
    snapTaken: false,
    pointerId: ev.pointerId,
  };

  svg.setPointerCapture(ev.pointerId);
  area.classList.add('node-dragging');
});

svg.addEventListener('pointermove', ev => {
  if (!_nodeDrag) return;
  const loc = svgClientToLocal(ev.clientX, ev.clientY);

  const dx = loc.x - _nodeDrag.startLx;
  const dyRaw = loc.y - _nodeDrag.startLy;

  // Kids can nudge blocks up/down a little to avoid line overlaps.
  // Hold Shift to move more vertically.
  const lim = ev.shiftKey ? DY_LIMIT_SHIFT : DY_LIMIT;
  const baseY = _nodeDrag.baseY;
  const desiredY = _nodeDrag.startPy + dyRaw;
  const clampedY = Math.max(baseY - lim, Math.min(baseY + lim, desiredY));

  if (!_nodeDrag.moved && (Math.abs(dx) > 6 || Math.abs(dyRaw) > 6)) {
    _nodeDrag.moved = true;
    if (!_nodeDrag.snapTaken) { snap(); _nodeDrag.snapTaken = true; }
    hideToolbar();
    // Mark node in layer as dragging
    const g = L_NO.querySelector(`[data-nid="${_nodeDrag.id}"]`);
    if (g) g.classList.add('dragging');
  }

  if (_nodeDrag.moved) {
    S.pos[_nodeDrag.id] = {
      x: Math.round(_nodeDrag.startPx + dx),
      y: Math.round(clampedY),
    };
    renderEdgesAndPlus(); // lightweight partial re-render
    updateNodePosition(_nodeDrag.id);
  }
});
svg.addEventListener('pointerup', ev => {
  if (!_nodeDrag) return;
  const wasMoved = _nodeDrag.moved;
  const id = _nodeDrag.id;
  _nodeDrag = null;
  area.classList.remove('node-dragging');

  if (!wasMoved) {
    selectNode(id);
    return;
  }

  // prevent "click" after drag from triggering edit/double-tap logic
  _ignoreClickUntil = Date.now() + 450;
  _lastTap = { id: null, t: 0 };

  const gg = L_NO.querySelector(`[data-nid="${id}"]`);
  if (gg) gg.classList.remove('dragging');

  // persist offsets so future auto-layout doesn't reset the user's adjustments
  const baseX = S.baseX?.[id];
  const baseY = S.baseY?.[id];
  const curX = S.pos[id]?.x ?? 0;
  const curY = S.pos[id]?.y ?? 0;
  const dx = (typeof baseX === 'number' && Number.isFinite(baseX)) ? (curX - baseX) : 0;
  const dy = (typeof baseY === 'number' && Number.isFinite(baseY)) ? (curY - baseY) : 0;

  if (!S.manual) S.manual = {};
  const ndx = Math.abs(dx) < 1 ? 0 : Math.round(dx);
  const ndy = Math.abs(dy) < 1 ? 0 : Math.round(Math.max(-DY_LIMIT, Math.min(DY_LIMIT, dy)));

  if (!ndx && !ndy) delete S.manual[id];
  else S.manual[id] = { dx: ndx, dy: ndy };

  // Fix SVG height after drag
  let maxY = 300;
  for (const [nid, p] of Object.entries(S.pos)) maxY = Math.max(maxY, p.y + nodeH(nid) / 2);
  svg.style.minHeight = (maxY + 220) + 'px';
  updateWrapSize();
});
svg.addEventListener('pointercancel', () => {
  if (_nodeDrag) {
    const gg = L_NO.querySelector(`[data-nid="${_nodeDrag.id}"]`);
    if (gg) gg.classList.remove('dragging');
  }
  _nodeDrag = null;
  area.classList.remove('node-dragging');
});

// Lightweight: update only the dragged node's position without full clear/rebuild
function updateNodePosition(id) {
  const g = L_NO.querySelector(`[data-nid="${id}"]`);
  if (!g || !S.pos[id]) return;
  const { x, y } = S.pos[id];
  const n = S.nodes[id];
  if (!n) return;

  // Update shape position
  const shape = g.querySelector('.node-shape');
  if (shape) {
    if (n.type === 'start' || n.type === 'end' || n.type === 'process') {
      shape.setAttribute('x', x - NW / 2);
      shape.setAttribute('y', y - NH / 2);
    } else if (n.type === 'decision') {
      shape.setAttribute('points', `${x},${y - DD} ${x + DD},${y} ${x},${y + DD} ${x - DD},${y}`);
    } else { // input-output
      const s = 20;
      shape.setAttribute('points',
        `${x - IOW / 2 + s},${y - NH / 2} ${x + IOW / 2 + s},${y - NH / 2} ${x + IOW / 2 - s},${y + NH / 2} ${x - IOW / 2 - s},${y + NH / 2}`);
    }
  }

  // Update main text positions only (avoid touching type label)
  const mainTexts = [...g.querySelectorAll('.node-main-text')];
  const lines = wrapText(n.text || '...', n.type === 'decision' ? 10 : 16, n.type === 'decision' ? 4 : 3);
  const lh = 18;
  const startY = y - (lines.length * lh) / 2 + lh / 2;

  for (let i = 0; i < lines.length; i++) {
    const t = mainTexts[i];
    if (!t) continue;
    t.setAttribute('x', x);
    t.setAttribute('y', startY + i * lh);
    // Keep text in sync (safe if wrapText changes)
    if (t.textContent !== lines[i]) t.textContent = lines[i];
  }

  // Update type label position
  const typeLabel = g.querySelector('.node-type-label');
  if (typeLabel && n.type !== 'start') {
    const bx = n.type === 'decision' ? x + DD : x + nodeW(id) / 2;
    const by = n.type === 'decision' ? y - DD - 12 : y - NH / 2 - 10;
    typeLabel.setAttribute('x', bx);
    typeLabel.setAttribute('y', by);
  }
}


// Partial re-render: edges + plus only (faster during drag)
function renderEdgesAndPlus() {
  clearEl(L_TI); clearEl(L_ED); clearEl(L_PL);
  renderTitle();
  for (const e of S.edges) renderEdge(e);
  for (const e of openEnds()) renderPlus(e);
}

// ────────────────────────────────────────────────────────────────
// CANVAS PAN (drag on empty canvas)
// ────────────────────────────────────────────────────────────────
let _canvasDrag = null;

area.addEventListener('pointerdown', ev => {
  const isLeft = ev.button === 0;
  const isMid = ev.button === 1;
  if (!isLeft && !isMid) return;

  // If left click: don't start pan if clicking a node or plus button
  if (isLeft && (ev.target.closest('[data-nid]') || ev.target.closest('[data-plus]'))) return;

  if (isMid) ev.preventDefault(); // Prevent browser's auto-scroll on middle click

  _canvasDrag = {
    startX: ev.clientX + area.scrollLeft,
    startY: ev.clientY + area.scrollTop,
  };
  area.setPointerCapture(ev.pointerId);
  area.classList.add('grabbing');
});

area.addEventListener('pointermove', ev => {
  if (!_canvasDrag) return;
  area.scrollLeft = _canvasDrag.startX - ev.clientX;
  area.scrollTop = _canvasDrag.startY - ev.clientY;
});

area.addEventListener('pointerup', () => {
  _canvasDrag = null;
  area.classList.remove('grabbing');
});
area.addEventListener('pointercancel', () => {
  _canvasDrag = null;
  area.classList.remove('grabbing');
});

// ────────────────────────────────────────────────────────────────
// NODE SELECTION & TOOLBAR
// ────────────────────────────────────────────────────────────────
function selectNode(id) {
  if (S.wiz.open) return;
  S.sel = id;
  render();
  positionToolbar(id);
}

function positionToolbar(id) {
  const tb = $('node-tb');

  // Use DOM rects instead of getScreenCTM() to be stable under CSS zoom (transform: scale)
  const g = L_NO.querySelector(`[data-nid="${id}"]`);
  if (!g) return;
  const shape = g.querySelector('.node-shape') || g;

  const rect = shape.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const top = rect.top;

  tb.classList.remove('hidden');
  tb.style.display = 'flex';

  requestAnimationFrame(() => {
    const w = tb.offsetWidth;
    const h = tb.offsetHeight || 54;

    tb.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, cx - w / 2)) + 'px';
    tb.style.top = Math.max(56, top - h - 10) + 'px';
  });
}

function hideToolbar() {
  const tb = $('node-tb');
  tb.classList.add('hidden'); tb.style.display = '';
  if (S.sel) { S.sel = null; render(); }
}

let _rafTb = 0;
function scheduleToolbarUpdate() {
  if (!S.sel) return;
  if ($('node-tb').classList.contains('hidden')) return;
  if (_rafTb) return;
  _rafTb = requestAnimationFrame(() => {
    _rafTb = 0;
    if (S.sel && !$('node-tb').classList.contains('hidden')) positionToolbar(S.sel);
  });
}
area.addEventListener('scroll', scheduleToolbarUpdate, { passive: true });
window.addEventListener('resize', scheduleToolbarUpdate, { passive: true });

svg.addEventListener('pointerdown', ev => {
  // Click on empty SVG area (not a node, not a plus)
  const onNode = ev.target.closest('[data-nid]');
  const onPlus = ev.target.closest('[data-plus]');
  if (!onNode && !onPlus && S.sel) hideToolbar();
});

// Double-click / double-tap → edit
let _lastTap = { id: null, t: 0 };
svg.addEventListener('click', ev => {
  const g = ev.target.closest('[data-nid]'); if (!g) return;
  if (_nodeDrag) return;
  if (Date.now() < _ignoreClickUntil) return;
  const id = g.dataset.nid;
  const now = Date.now();
  if (_lastTap.id === id && now - _lastTap.t < 380) {
    _lastTap = { id: null, t: 0 };
    startEditNode(id);
  } else {
    _lastTap = { id, t: now };
  }
});
svg.addEventListener('dblclick', ev => {
  const g = ev.target.closest('[data-nid]'); if (!g) return;
  if (Date.now() < _ignoreClickUntil) return;
  ev.preventDefault();
  startEditNode(g.dataset.nid);
});

function startEditNode(id) {
  if (S.wiz.open) return;
  hideToolbar();
  S.wiz = { open: true, step: 'explain', pid: null, plbl: null, type: S.nodes[id].type, editId: id };
  const inp = $('text-inp');
  inp.value = S.nodes[id].text || '';
  inp.placeholder = PLACEHOLDER[S.nodes[id].type] || '';
  setExplainContent(S.nodes[id].type);
  showWizStep('explain');
  openWizPanel();
  setTimeout(() => { inp.focus(); inp.select(); }, 320);
}

$('btn-edit-node').addEventListener('click', () => {
  if (!S.sel) return;
  startEditNode(S.sel);
});

$('btn-del-node').addEventListener('click', () => {
  if (!S.sel) return;
  const id = S.sel;
  if (id === S.root) { showToast('Блок «Початок» не можна видалити!'); return; }

  const n = S.nodes[id];
  $('del-msg').textContent = (n?.type === 'decision')
    ? 'Це «Питання» буде видалено. Ми спробуємо з’єднати схему так, щоб алгоритм продовжився далі.'
    : 'Блок буде видалено, а наступні блоки залишаться — ми під’єднаємо схему автоматично.';

  openModal('del-modal');
  $('del-confirm').onclick = () => {
    closeModal('del-modal');
    snap();
    deleteNodeSplice(id);
    hideToolbar();
    layout(); render(); mascot();
  };
});

function bfsDist(startId) {
  const dist = {};
  if (!startId || !S.nodes[startId]) return dist;
  const q = [startId];
  dist[startId] = 0;
  while (q.length) {
    const cur = q.shift();
    for (const e of outEdges(cur)) {
      if (!e.to || !S.nodes[e.to]) continue;
      if (dist[e.to] === undefined) {
        dist[e.to] = dist[cur] + 1;
        q.push(e.to);
      }
    }
  }
  return dist;
}

function findCommonSuccessor(a, b) {
  if (!a || !b) return null;
  if (a === b) return a;
  const da = bfsDist(a);
  const db = bfsDist(b);
  let best = null;
  let bestScore = Infinity;
  for (const [id, d1] of Object.entries(da)) {
    const d2 = db[id];
    if (d2 === undefined) continue;
    const score = d1 + d2;
    if (score < bestScore) { best = id; bestScore = score; }
  }
  return best;
}

function pruneUnreachable() {
  if (!S.root || !S.nodes[S.root]) return;
  const reachable = new Set([S.root]);
  const q = [S.root];
  while (q.length) {
    const cur = q.shift();
    for (const e of outEdges(cur)) {
      if (!e.to || !S.nodes[e.to]) continue;
      if (!reachable.has(e.to)) {
        reachable.add(e.to);
        q.push(e.to);
      }
    }
  }
  const rm = Object.keys(S.nodes).filter(id => !reachable.has(id));
  if (!rm.length) return;
  const rmSet = new Set(rm);
  S.edges = S.edges.filter(e => !rmSet.has(e.from) && !rmSet.has(e.to));
  for (const id of rmSet) {
    delete S.nodes[id];
    if (S.manual) delete S.manual[id];
  }
}

function deleteNodeSplice(id) {
  const n = S.nodes[id];
  if (!n) return;

  const inc = inEdges(id);
  const out = outEdges(id);

  let target = null;

  if (n.type === 'decision') {
    const yes = out.find(e => e.label === 'yes')?.to;
    const no = out.find(e => e.label === 'no')?.to;
    const merge = findCommonSuccessor(yes, no);
    target = merge || yes || no || null;
  } else {
    target = out.find(e => !e.label)?.to || null;
  }

  const edgesToDrop = new Set();

  // Rewire incoming edges to the next block (or drop them if nothing to connect to)
  for (const e of inc) {
    if (target && S.nodes[target] && target !== id) {
      e.to = target;
    } else {
      edgesToDrop.add(e);
    }
  }

  // Remove edges going from the deleted node + any dropped incoming edges + broken edges
  S.edges = S.edges.filter(e =>
    e.from !== id &&
    e.to !== id &&
    !edgesToDrop.has(e) &&
    e.to && S.nodes[e.to] &&
    e.from && S.nodes[e.from]
  );

  // Remove node
  delete S.nodes[id];
  if (S.manual) delete S.manual[id];

  // If some blocks became unreachable (e.g., after deleting a decision), remove them
  pruneUnreachable();
}


// ────────────────────────────────────────────────────────────────
// WIZARD
// ────────────────────────────────────────────────────────────────
function openWiz(pid, lbl) {
  S.wiz = { open: true, step: 'type', pid, plbl: lbl, type: null, editId: null };

  const badge = $('step-type-badge');
  if (lbl === 'yes' || lbl === 'no') {
    badge.textContent = lbl === 'yes' ? 'Гілка «Так»' : 'Гілка «Ні»';
    badge.className = `text-xs font-black px-2 py-0.5 rounded-full ${lbl === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const sibling = findSiblingOpenEnd(pid, lbl);
  const ms = $('merge-suggestion');
  if (sibling) {
    const sibNode = S.nodes[sibling.pid];
    $('merge-hint-text').textContent =
      `З'єднати з гілкою "${sibNode?.text || '...'}" (${sibling.lbl === 'yes' ? 'Так' : sibling.lbl === 'no' ? 'Ні' : 'основна'})`;
    ms.classList.remove('hidden');
    $('btn-merge-sibling').onclick = () => {
      snap();
      const mid = 'n' + (++S.cnt);
      S.nodes[mid] = { id: mid, type: 'process', text: 'Продовження' };
      S.edges.push({ from: pid, to: mid, label: lbl });
      S.edges.push({ from: sibling.pid, to: mid, label: sibling.lbl });
      closeWiz(); layout(); render(); mascot();
      setTimeout(() => openWiz(mid, null), 200);
    };
  } else {
    ms.classList.add('hidden');
  }

  showWizStep('type');
  openWizPanel();
  mascot();
}

function openWizPanel() {
  $('wizard-panel').style.transform = 'translateY(0)';
  // Hide mascot when wizard opens
  $('mascot').classList.add('wiz-open');
  $('mascot-toggle').style.opacity = '0';
  $('mascot-toggle').style.pointerEvents = 'none';
  requestAnimationFrame(() => {
    const wh = $('wizard-panel').offsetHeight || 0;
    $('mascot').style.bottom = (wh + 10) + 'px';
    $('mascot-toggle').style.bottom = (wh + 10) + 'px';
  });
}

function closeWiz() {
  S.wiz = { open: false, step: 'type', pid: null, plbl: null, type: null, editId: null };
  $('wizard-panel').style.transform = 'translateY(110%)';
  // Show mascot again
  $('mascot').classList.remove('wiz-open');
  $('mascot').style.bottom = '18px';
  $('mascot-toggle').style.opacity = '';
  $('mascot-toggle').style.pointerEvents = '';
  $('mascot-toggle').style.bottom = '16px';
  mascot();
}

function showWizStep(step) {
  ['step-type', 'step-explain', 'step-existing'].forEach(id => {
    $(id).classList.toggle('hidden', id !== 'step-' + step);
  });
  S.wiz.step = step;
}

function setExplainContent(type) {
  const m = TYPE_META[type] || TYPE_META.process;
  const explain = m.explain || '';
  const borderCls = {
    process: 'border-sky-200 bg-sky-50',
    decision: 'border-amber-200 bg-amber-50',
    'input-output': 'border-violet-200 bg-violet-50',
    end: 'border-rose-200 bg-rose-50',
    start: 'border-green-200 bg-green-50',
  }[type] || 'border-gray-200 bg-gray-50';

  $('explain-content').className = `flex items-start gap-3 p-4 rounded-2xl border-2 mb-4 ${borderCls}`;
  $('explain-content').innerHTML = `
    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
         style="background:${m.fill}">
      <i class="fa-solid ${m.icon} text-white text-sm"></i>
    </div>
    <div class="flex-1 min-w-0">
      <div class="font-black text-gray-800 mb-0.5">${m.label}</div>
      ${explain ? `<div class="text-sm text-gray-500 font-semibold leading-snug">${explain}</div>` : ''}
    </div>`;
}

// Type card buttons
document.querySelectorAll('.type-card[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    S.wiz.type = type;
    if (type === 'end') {
      if (!S.wiz.editId) { snap(); commitNode('Кінець'); }
      return;
    }
    const inp = $('text-inp');
    inp.placeholder = PLACEHOLDER[type] || 'Введіть текст...';
    inp.value = '';
    setExplainContent(type);
    showWizStep('explain');
    setTimeout(() => inp.focus(), 300);
  });
});

$('btn-connect-exist').addEventListener('click', () => {
  const cands = connectableNodes(S.wiz.pid, S.wiz.plbl);
  const list = $('existing-list');
  list.innerHTML = '';
  const noMsg = $('no-exist-msg');
  if (!cands.length) {
    noMsg.classList.remove('hidden'); list.classList.add('hidden');
  } else {
    noMsg.classList.add('hidden'); list.classList.remove('hidden');
    cands.forEach(n => {
      const m = TYPE_META[n.type] || TYPE_META.process;
      const btn = document.createElement('button');
      btn.className = 'exist-item w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 text-left';
      btn.innerHTML = `
        <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
             style="background:${m.fill}">
          <i class="fa-solid ${m.icon} text-white text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-black text-gray-800 text-sm truncate">${escHtml(n.text || '...')}</div>
          <div class="text-xs text-gray-400 font-bold">${m.label}</div>
        </div>
        <i class="fa-solid fa-link text-indigo-300 flex-shrink-0 text-sm"></i>`;
      btn.addEventListener('click', () => {
        snap();
        S.edges.push({ from: S.wiz.pid, to: n.id, label: S.wiz.plbl });
        closeWiz(); layout(); render(); mascot();
        if (isDone()) setTimeout(confetti, 400);
      });
      list.appendChild(btn);
    });
  }
  showWizStep('existing');
});

$('btn-cancel-wiz').addEventListener('click', closeWiz);
$('btn-back-text').addEventListener('click', () => {
  if (S.wiz.editId) { closeWiz(); return; }
  showWizStep('type');
});
$('btn-back-exist').addEventListener('click', () => showWizStep('type'));

$('btn-ok').addEventListener('click', () => {
  const raw = $('text-inp').value.trim();
  const text = raw || (TYPE_META[S.wiz.type]?.label || 'Блок');
  if (S.wiz.editId) {
    snap();
    S.nodes[S.wiz.editId].text = text;
    closeWiz(); render(); mascot();
  } else {
    snap(); commitNode(text);
  }
});

$('text-inp').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btn-ok').click();
  if (e.key === 'Escape') closeWiz();
});

function commitNode(text) {
  const id = 'n' + (++S.cnt);
  S.nodes[id] = { id, type: S.wiz.type, text };
  S.edges.push({ from: S.wiz.pid, to: id, label: S.wiz.plbl });
  closeWiz(); layout(); render(); mascot();
  const p = S.pos[id];
  if (p) {
    setTimeout(() => area.scrollTo({
      top: Math.max(0, p.y * _scale - area.clientHeight * 0.42),
      left: Math.max(0, p.x * _scale - area.clientWidth * 0.5),
      behavior: 'smooth',
    }), 80);
  }
  if (isDone()) setTimeout(confetti, 400);
}

// ────────────────────────────────────────────────────────────────
// RESET & MODALS
// ────────────────────────────────────────────────────────────────
$('btn-reset').addEventListener('click', () => openModal('reset-modal'));
$('reset-cancel').addEventListener('click', () => closeModal('reset-modal'));
$('reset-confirm').addEventListener('click', () => {
  closeModal('reset-modal');
  Object.assign(S, { nodes: {}, edges: [], root: null, cnt: 0, undo: [], sel: null, ranks: {}, pos: {}, manual: {}, baseX: {}, baseY: {}, rankY: {}, rankH: {}, title: '' });
  $('btn-undo').disabled = true;
  closeWiz(); hideToolbar(); init();
});
$('del-cancel').addEventListener('click', () => closeModal('del-modal'));
['del-modal', 'reset-modal'].forEach(id => {
  $(id).addEventListener('pointerdown', e => { if (e.target === $(id)) closeModal(id); });
});

function openModal(id) {
  $(id).classList.remove('hidden'); $(id).classList.add('flex');
}
function closeModal(id) {
  $(id).classList.add('hidden'); $(id).classList.remove('flex');
}

// ────────────────────────────────────────────────────────────────
// EXAMPLES
// ────────────────────────────────────────────────────────────────
(function buildExamplesUI() {
  const container = $('ex-list');
  EXAMPLES.forEach(ex => {
    const card = document.createElement('button');
    card.className = `ex-card w-full flex items-center gap-4 p-4 ${ex.bg} border-2 ${ex.border} rounded-2xl text-left transition`;
    card.innerHTML = `
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow"
           style="background:${ex.color}">
        <i class="fa-solid ${ex.icon} text-white text-xl"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-black text-gray-800 text-base">${ex.title}</div>
        <div class="text-xs text-gray-500 font-semibold mt-0.5">${ex.subtitle}</div>
      </div>
      <i class="fa-solid fa-arrow-right text-gray-300 flex-shrink-0"></i>`;
    card.addEventListener('click', () => {
      loadExample(ex);
      closeModal('ex-modal');
    });
    container.appendChild(card);
  });
})();

function loadExample(ex) {
  const maxId = ex.nodes.reduce((m, n) => {
    const num = parseInt(n.id.replace('n', '')) || 0;
    return Math.max(m, num);
  }, 0);
  S.nodes = {};
  ex.nodes.forEach(n => { S.nodes[n.id] = { ...n }; });
  S.edges = ex.edges.map(e => ({ ...e }));
  S.root = ex.root;
  S.cnt = maxId;
  S.undo = []; S.sel = null;
  S.manual = {}; S.baseX = {}; S.baseY = {}; S.rankY = {}; S.rankH = {};
  S.title = ex.title || '';
  $('btn-undo').disabled = true;
  closeWiz(); hideToolbar();
  layout(); render(); mascot();
  setTimeout(fitToScreen, 100);
  showToast(`Приклад «${ex.title}» завантажено!`);
}

$('btn-examples').addEventListener('click', () => openModal('ex-modal'));
$('btn-ex-close').addEventListener('click', () => closeModal('ex-modal'));
$('ex-modal').addEventListener('pointerdown', e => {
  if (e.target === $('ex-modal')) closeModal('ex-modal');
});

// ────────────────────────────────────────────────────────────────
// SAVE (SVG → PNG)
// ────────────────────────────────────────────────────────────────
$('btn-save').addEventListener('click', () => {
  if (!S.root || !Object.keys(S.nodes).length) {
    showToast('Спочатку створи блок-схему!');
    return;
  }

  // Ask for a title before saving (helps kids not to confuse files)
  $('save-title-inp').value = String(S.title ?? '').trim();
  openModal('save-modal');

  const inp = $('save-title-inp');
  setTimeout(() => { inp.focus(); inp.select(); }, 60);

  const runSave = async () => {
    const raw = inp.value.trim();
    if (raw.length < 2) { showToast('Напиши назву (хоч 2 літери) 🙂'); inp.focus(); return; }
    S.title = raw;
    closeModal('save-modal');
    layout();
    render(); // show title on canvas

    const btn = $('save-confirm');
    btn.disabled = true;
    btn.classList.add('opacity-70');
    try {
      await savePng();
    } finally {
      btn.disabled = false;
      btn.classList.remove('opacity-70');
    }
  };

  $('save-confirm').onclick = runSave;
  $('save-cancel').onclick = () => closeModal('save-modal');

  inp.onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runSave(); }
    if (e.key === 'Escape') { e.preventDefault(); closeModal('save-modal'); }
  };
});

$('save-modal').addEventListener('pointerdown', e => {
  if (e.target === $('save-modal')) closeModal('save-modal');
});

async function savePng() {
  const title = String(S.title ?? '').trim();

  const PAD = 80;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of Object.keys(S.nodes)) {
    const p = S.pos[id]; if (!p) continue;
    minX = Math.min(minX, p.x - nodeW(id) / 2 - 20);
    minY = Math.min(minY, p.y - nodeH(id) / 2 - 20);
    maxX = Math.max(maxX, p.x + nodeW(id) / 2 + 20);
    maxY = Math.max(maxY, p.y + nodeH(id) / 2 + 20);
  }

  // Include title bounds (so it won't be clipped in the saved PNG)
  const titleG = document.getElementById('alg-title');
  if (titleG) {
    try {
      const bb = titleG.getBBox();
      const EXTRA = 56; // also covers drop-shadow filter
      minX = Math.min(minX, bb.x - EXTRA);
      minY = Math.min(minY, bb.y - EXTRA);
      maxX = Math.max(maxX, bb.x + bb.width + EXTRA);
      maxY = Math.max(maxY, bb.y + bb.height + EXTRA);
    } catch (e) {
      if (title) minY -= 220;
    }
  } else {
    if (title) minY -= 220;
  }

  minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
  const W = maxX - minX, H = maxY - minY;

  const prevSel = S.sel;
  S.sel = null; render();
  const prevVis = L_PL.getAttribute('visibility');
  L_PL.setAttribute('visibility', 'hidden');

  const prevVB = svg.getAttribute('viewBox');
  const prevW = svg.getAttribute('width');
  const prevH = svg.getAttribute('height');
  svg.setAttribute('viewBox', `${minX} ${minY} ${W} ${H}`);
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));

  const bgRect = mkSvg('rect', { x: minX, y: minY, width: W, height: H, fill: '#eef2ff' });
  // put background under ALL layers
  svg.insertBefore(bgRect, L_TI || L_ED);

  try {
    const SCALE = 2;
    const blob2 = new Blob(
      [new XMLSerializer().serializeToString(svg)],
      { type: 'image/svg+xml;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob2);
    await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement('canvas');
        cvs.width = Math.round(W * SCALE); cvs.height = Math.round(H * SCALE);
        const ctx = cvs.getContext('2d');
        ctx.scale(SCALE, SCALE);
        ctx.fillStyle = '#eef2ff'; ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        cvs.toBlob(b => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b || new Blob());
          const safe = (title || 'блок-схема').replace(/[\\/:*?"<>|]+/g, '_').trim();
          a.download = (safe ? safe : 'блок-схема') + '.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1500);
          confetti(); showToast('Збережено успішно! 🎉');
          res();
        }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('fail')); };
      img.src = url;
    });
  } catch (err) {
    console.error(err);
    showToast('Не вдалося зберегти. Спробуй знову!');
  } finally {
    if (bgRect.parentNode) bgRect.parentNode.removeChild(bgRect);
    if (prevVB) svg.setAttribute('viewBox', prevVB); else svg.removeAttribute('viewBox');
    if (prevW) svg.setAttribute('width', prevW); else svg.removeAttribute('width');
    if (prevH) svg.setAttribute('height', prevH); else svg.removeAttribute('height');
    if (prevVis) L_PL.setAttribute('visibility', prevVis); else L_PL.removeAttribute('visibility');
    S.sel = prevSel; render();
  }
}

// ────────────────────────────────────────────────────────────────
// ZOOM  (CSS transform on wrapper)
// ────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────
let _scale = 1;
const S_MIN = 0.3, S_MAX = 2.5, S_STEP = 0.15;

function applyZoom(ns, pivX, pivY) {
  ns = Math.max(S_MIN, Math.min(S_MAX, ns));
  if (Math.abs(ns - _scale) < 0.001) return;
  const px = pivX ?? area.clientWidth / 2;
  const py = pivY ?? area.clientHeight / 2;
  const rat = ns / _scale;
  _scale = ns;
  wrap.style.transform = `scale(${_scale})`;
  wrap.style.transformOrigin = '0 0';
  updateWrapSize();
  area.scrollLeft = (area.scrollLeft + px) * rat - px;
  area.scrollTop = (area.scrollTop + py) * rat - py;
  scheduleToolbarUpdate();
}

function updateWrapSize() {
  const sw = parseFloat(svg.style.width || '1700') * _scale;
  const sh = parseFloat(svg.style.minHeight || '600') * _scale;
  wrap.style.width = sw + 'px';
  wrap.style.height = sh + 'px';
}

function fitToScreen() {
  const ids = Object.keys(S.nodes);
  if (!ids.length) return;
  let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
  for (const id of ids) {
    const p = S.pos[id]; if (!p) continue;
    mnX = Math.min(mnX, p.x - nodeW(id) / 2);
    mnY = Math.min(mnY, p.y - nodeH(id) / 2);
    mxX = Math.max(mxX, p.x + nodeW(id) / 2);
    mxY = Math.max(mxY, p.y + nodeH(id) / 2);
  }

  // include the title bubble in "fit" bounds
  const titleG = document.getElementById('alg-title');
  if (titleG) {
    try {
      const bb = titleG.getBBox();
      const EXTRA = 40;
      mnX = Math.min(mnX, bb.x - EXTRA);
      mnY = Math.min(mnY, bb.y - EXTRA);
      mxX = Math.max(mxX, bb.x + bb.width + EXTRA);
      mxY = Math.max(mxY, bb.y + bb.height + EXTRA);
    } catch (e) { /* ignore */ }
  }
  const PAD = 64, cW = area.clientWidth, cH = area.clientHeight;
  const sc = Math.min(cW / (mxX - mnX + PAD * 2), cH / (mxY - mnY + PAD * 2), S_MAX);
  _scale = sc;
  wrap.style.transform = `scale(${sc})`;
  wrap.style.transformOrigin = '0 0';
  updateWrapSize();
  area.scrollLeft = (mnX - PAD) * sc - (cW - (mxX - mnX + PAD * 2) * sc) / 2;
  area.scrollTop = (mnY - PAD) * sc - (cH - (mxY - mnY + PAD * 2) * sc) / 2;
  scheduleToolbarUpdate();
}

$('btn-zi').addEventListener('click', () => applyZoom(_scale + S_STEP));
$('btn-zo').addEventListener('click', () => applyZoom(_scale - S_STEP));
$('btn-fit').addEventListener('click', fitToScreen);

// Mouse wheel zoom (no modifier needed)
area.addEventListener('wheel', e => {
  e.preventDefault();
  // Faster zoom with Ctrl/Meta, slower without
  const factor = (e.ctrlKey || e.metaKey) ? 0.0015 : 0.001;
  const r = area.getBoundingClientRect();
  applyZoom(_scale * (1 - e.deltaY * factor), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

// Pinch-to-zoom
let _pinch = null;
area.addEventListener('touchstart', e => {
  if (e.touches.length !== 2) return;
  e.preventDefault();
  const [a, b] = e.touches;
  const r = area.getBoundingClientRect();
  _pinch = {
    dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    scale: _scale,
    cx: (a.clientX + b.clientX) / 2 - r.left,
    cy: (a.clientY + b.clientY) / 2 - r.top,
  };
}, { passive: false });

area.addEventListener('touchmove', e => {
  if (!_pinch || e.touches.length !== 2) return;
  e.preventDefault();
  const [a, b] = e.touches;
  const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  applyZoom(_pinch.scale * (dist / _pinch.dist), _pinch.cx, _pinch.cy);
}, { passive: false });

area.addEventListener('touchend', () => { _pinch = null; });

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if ($('text-inp') === document.activeElement) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); applyZoom(_scale + S_STEP); }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); applyZoom(_scale - S_STEP); }
  if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); fitToScreen(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  if (e.key === 'Escape') {
    closeWiz(); hideToolbar();
    closeModal('del-modal'); closeModal('reset-modal'); closeModal('ex-modal'); closeModal('save-modal');
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel && !S.wiz.open) $('btn-del-node').click();
});
$('btn-undo').addEventListener('click', undo);

// ────────────────────────────────────────────────────────────────
// MASCOT
// ────────────────────────────────────────────────────────────────
function mascot() {
  const el = $('mascot-msg');
  const cnt = Object.keys(S.nodes).length;
  const oe = openEnds();

  if (cnt <= 1) {
    el.innerHTML = '<i class="fa-solid fa-hand-wave mr-1 text-yellow-500"></i>Привіт! Натисни <strong>+</strong>, щоб почати!';
    return;
  }
  if (S.wiz.open && S.wiz.step === 'existing') {
    el.innerHTML = '<i class="fa-solid fa-link mr-1 text-slate-400"></i>Вибери блок для з\'єднання!';
    return;
  }
  if (S.wiz.open && S.wiz.step === 'explain') {
    el.innerHTML = '<i class="fa-solid fa-pen mr-1 text-indigo-400"></i>Напиши, що тут відбувається!';
    return;
  }
  if (S.wiz.open) {
    el.innerHTML = '<i class="fa-solid fa-lightbulb mr-1 text-yellow-400"></i>Вибери тип блоку!';
    return;
  }
  if (isDone()) {
    el.innerHTML = '<i class="fa-solid fa-trophy mr-1 text-yellow-500"></i>Схема готова! Збережи <i class="fa-solid fa-download text-indigo-400"></i>';
    return;
  }
  if (oe.some(e => e.lbl)) {
    el.innerHTML = '<i class="fa-solid fa-code-branch mr-1 text-amber-500"></i>Підключи обидві гілки <strong>Так</strong> і <strong>Ні</strong>!';
    return;
  }
  el.innerHTML = cnt <= 3
    ? '<i class="fa-solid fa-fire mr-1 text-orange-500"></i>Чудово! Натисни <strong>+</strong>, щоб продовжити!'
    : '<i class="fa-solid fa-thumbs-up mr-1 text-green-500"></i>Так тримати! Продовжуй будувати!';
}

$('mascot-toggle').addEventListener('click', () => {
  $('mascot').classList.toggle('visible');
});

// ────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ────────────────────────────────────────────────────────────────
function updateProgress() {
  const total = Object.keys(S.nodes).length;
  const pct = !S.root ? 5
    : total <= 1 ? 5
      : isDone() ? 100
        : Math.min(92, total * 11);
  $('prog-fill').style.width = pct + '%';
}

// ────────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────────
let _toastT;
function showToast(msg, dur = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => t.classList.remove('show'), dur);
}

// ────────────────────────────────────────────────────────────────
// VIRTUAL KEYBOARD
// ────────────────────────────────────────────────────────────────
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    if (!S.wiz.open) return;
    const availH = window.visualViewport.height;
    $('wizard-panel').style.maxHeight = Math.max(200, availH * 0.82) + 'px';
  });
}

// ────────────────────────────────────────────────────────────────
// CONFETTI
// ────────────────────────────────────────────────────────────────
function confetti() {
  const cvs = $('cfc');
  cvs.width = innerWidth; cvs.height = innerHeight;
  const ctx = cvs.getContext('2d');
  if (!ctx) return;
  const C = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#22c55e'];
  const P = Array.from({ length: 150 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * -innerHeight * .5,
    w: 7 + Math.random() * 10, h: 4 + Math.random() * 6,
    c: C[0 | (Math.random() * C.length)],
    vx: (Math.random() - .5) * 6, vy: 3 + Math.random() * 6,
    r: Math.random() * 360, vr: (Math.random() - .5) * 9,
  }));
  let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach(p => {
      ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.rotate(p.r * Math.PI / 180);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
    });
    if (++f < 200) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

// ────────────────────────────────────────────────────────────────
// UTILS
// ────────────────────────────────────────────────────────────────
function wrapText(str, maxCPL, maxLines = 3) {
  const s = String(str ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return ['...'];

  const splitLongWord = (w) => {
    // Keep trailing punctuation with the last part so we don't end up with a lonely "й?" etc.
    const m = String(w).match(/([!?.,:;]+)$/);
    const suffix = m ? m[1] : '';
    const core = suffix ? String(w).slice(0, -suffix.length) : String(w);

    const coreMax = Math.max(4, maxCPL - suffix.length);
    if (core.length <= coreMax) return [core + suffix];

    const parts = [];
    // leave room for hyphen at the end of broken parts
    const maxChunk = Math.max(4, coreMax - 1);
    let rest = core;

    while (rest.length > coreMax) {
      let chunkLen = maxChunk;

      // avoid leaving 1–3 letters in the last part
      const remaining = rest.length - chunkLen;
      if (remaining > 0 && remaining < 4) chunkLen = Math.max(4, chunkLen - (4 - remaining));

      // safety: ensure the last part stays >= 4 chars
      if (rest.length - chunkLen < 4) chunkLen = Math.max(4, rest.length - 4);
      chunkLen = Math.max(4, Math.min(maxChunk, chunkLen));

      parts.push(rest.slice(0, chunkLen) + '‑'); // non-breaking hyphen
      rest = rest.slice(chunkLen);
    }

    parts.push(rest + suffix);
    return parts;
  };

  const words = s.split(' ');
  const lines = [];
  let cur = '';

  const push = (line) => { if (line) lines.push(line); };

  for (let w of words) {
    // break very long words so text can't escape the shape
    if (w.length > maxCPL) {
      const parts = splitLongWord(w);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!isLast) {
          if (cur) { push(cur); cur = ''; }
          push(part);
          if (lines.length >= maxLines) break;
        } else {
          w = part; // last piece can be combined with other words
        }
      }
      if (lines.length >= maxLines) break;
    }

    if (cur && (cur + ' ' + w).length > maxCPL) {
      push(cur);
      cur = w;
    } else {
      cur = cur ? (cur + ' ' + w) : w;
    }

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && cur) push(cur);

  // clamp & ellipsis
  if (lines.length > maxLines) lines.length = maxLines;
  if (lines.length === maxLines) {
    const joined = lines.join(' ').replace(/‑/g, '');
    if (joined !== s) {
      const last = lines[maxLines - 1] || '';
      const cleanLast = last.replace(/‑/g, '');
      const base = cleanLast.length >= maxCPL ? cleanLast.slice(0, Math.max(1, maxCPL - 1)) : cleanLast;
      lines[maxLines - 1] = base + '…';
    }
  }

  return lines;
}
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ────────────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────────────
function init() {
  const id = 'n' + (++S.cnt);
  S.nodes[id] = { id, type: 'start', text: 'Початок' };
  S.root = id;
  S.title = '';
  layout(); render(); mascot(); updateProgress();
  setTimeout(() => {
    area.scrollLeft = Math.max(0, CX - area.clientWidth / 2);
  }, 60);
}

init();
