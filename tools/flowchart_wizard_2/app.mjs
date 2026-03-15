'use strict';

import { EXAMPLES as EXAMPLES_DATA } from './modules/examples.mjs';
import {
  createEdgeCacheState,
  invalidateEdgeCache as markEdgeCacheDirty,
  outEdges as getOutEdges,
  inEdges as getInEdges,
  ancestors as getAncestors,
  descendants as getDescendants,
  openEnds as getOpenEnds,
  isDone as getIsDone,
  hasIncompleteIf as detectIncompleteIf,
  findBackEdges as getBackEdges,
} from './modules/graph.mjs';
import { collectIssues as collectIssueList } from './modules/validation.mjs';
import { getMascotHtml } from './modules/mascot.mjs';
import { getWizardBadge, getWizardLiveText, getExplainContentHtml, getMergeHintText, getCycleConnectionHintHtml } from './modules/wizard.mjs';
import { buildShape as buildSvgShape, pathSegments, createWrapText } from './modules/render-utils.mjs';
import { computeRanks as computeGraphRanks, applyLayout } from './modules/layout.mjs';
import { computeEdgeRoute } from './modules/edge-routing.mjs';
import { getCommentLayout, normalizeCommentText } from './modules/comments.mjs';
import { createStateSnapshot, restoreStateSnapshot, pushUndoSnapshot, popUndoSnapshot } from './modules/history.mjs';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────
const SVG_W = 1700;
const CX = SVG_W / 2;
const NODE_W = 164;        // ширина прямокутного блоку
const NODE_H = 58;         // висота прямокутного блоку
const DIAMOND_HALF = 72;   // половина діагоналі ромба (Питання)
const IO_W = 180;          // ширина паралелограма (Ввід/Вивід)
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
  subroutine: {
    label: '\u041f\u0456\u0434\u043f\u0440\u043e\u0433\u0440\u0430\u043c\u0430', icon: 'fa-code', fill: '#0f766e', stroke: '#0d5f58',
    explain: '\u0412\u0438\u043a\u043b\u0438\u043a \u0434\u043e\u043f\u043e\u043c\u0456\u0436\u043d\u043e\u0433\u043e \u0430\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0443 (\u043f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0438 \u0430\u0431\u043e \u0444\u0443\u043d\u043a\u0446\u0456\u0457). '
      + '\u0411\u043b\u043e\u043a \u043f\u043e\u0437\u043d\u0430\u0447\u0430\u0454\u0442\u044c\u0441\u044f \u043f\u0440\u044f\u043c\u043e\u043a\u0443\u0442\u043d\u0438\u043a\u043e\u043c \u0437 \u0434\u0432\u043e\u043c\u0430 \u0431\u0456\u0447\u043d\u0438\u043c\u0438 \u0441\u043c\u0443\u0433\u0430\u043c\u0438.'
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
  subroutine: '\u041d\u0430\u043f\u0440\u0438\u043a\u043b\u0430\u0434: \u041e\u0431\u0447\u0438\u0441\u043b\u0438\u0442\u0438 \u0441\u0443\u043c\u0443(a, b)',
};

// ────────────────────────────────────────────────────────────────
// EXAMPLES DATA
// ────────────────────────────────────────────────────────────────
const EXAMPLES = EXAMPLES_DATA;

const S = {
  nodes: {}, edges: [], root: null, cnt: 0,
  undo: [],
  ranks: {}, pos: {},
  title: '',
  // manual offsets (persist through auto-layout)
  manual: {}, baseX: {}, baseY: {}, rankY: {}, rankH: {},
  sel: null,
  issues: [],
  issuesByNode: {},
  comments: {},
  wiz: { open: false, step: 'type', pid: null, plbl: null, type: null, editId: null },
};

// ────────────────────────────────────────────────────────────────
// DOM REFS
// ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const svg = $('fc');
const wrap = $('svg-wrap');
const area = $('canvas-area');
const layerTitle = $('layer-title');
const layerEdges = $('layer-edges');
const layerNodes = $('layer-nodes');
const layerPlus = $('layer-plus');
const titleInput = $('header-title-input');
let _edgeOccupancy = [];
const TITLE_MAX_LEN = 80;
let _titleRenderTimer = 0;
const FOCUSABLE_SEL = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let _activeDialog = null;
let _focusReturnEl = null;

function getFocusable(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE_SEL)]
    .filter(el => el.offsetParent !== null || el === document.activeElement);
}

function activateDialogFocus(el, preferredEl = null) {
  if (!el) return;
  if (_activeDialog && _activeDialog !== el) deactivateDialogFocus(_activeDialog, { restore: false });
  _activeDialog = el;
  _focusReturnEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  el.setAttribute('aria-hidden', 'false');
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  const target = preferredEl || getFocusable(el)[0] || el;
  requestAnimationFrame(() => { target?.focus?.({ preventScroll: true }); });
}

function deactivateDialogFocus(el, { restore = true } = {}) {
  if (!el) return;
  el.setAttribute('aria-hidden', 'true');
  if (_activeDialog !== el) return;
  _activeDialog = null;
  const back = _focusReturnEl;
  _focusReturnEl = null;
  if (restore && back && document.contains(back)) {
    requestAnimationFrame(() => { back.focus?.({ preventScroll: true }); });
  }
}

document.addEventListener('keydown', e => {
  if (!_activeDialog) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (_activeDialog.id === 'wizard-panel') closeWiz();
    else closeModal(_activeDialog.id);
    return;
  }
  if (e.key !== 'Tab') return;
  const focusable = getFocusable(_activeDialog);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const cur = document.activeElement;
  if (!e.shiftKey && cur === last) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && cur === first) {
    e.preventDefault();
    last.focus();
  }
}, true);

function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }
function mkSvg(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function normalizeTitle(raw) {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TITLE_MAX_LEN);
}

function syncTitleInput() {
  if (!titleInput) return;
  const next = String(S.title ?? '');
  if (titleInput.value !== next) titleInput.value = next;
}

function setTitle(raw, { rerender = false } = {}) {
  const next = normalizeTitle(raw);
  const changed = S.title !== next;
  S.title = next;
  syncTitleInput();
  if (rerender && changed) render();
  return changed;
}

function scheduleTitleRender() {
  if (_titleRenderTimer) clearTimeout(_titleRenderTimer);
  _titleRenderTimer = setTimeout(() => {
    _titleRenderTimer = 0;
    render();
  }, 90);
}

function rerenderFlow(withLayout = true) {
  try {
    if (withLayout) layout();
    render();
    mascot();
  } catch (error) {
    reportRuntimeError('rerender-flow', error);
    throw error;
  }
}

function snap() {
  pushUndoSnapshot(S, createStateSnapshot(S));
  $('btn-undo').disabled = false;
}

function undo() {
  const snapshot = popUndoSnapshot(S);
  if (!snapshot) return;

  closeWiz();
  const tb = $('node-tb');
  tb.classList.add('hidden');
  tb.style.display = '';
  restoreStateSnapshot(S, snapshot);
  invalidateEdgeCache();
  $('btn-undo').disabled = S.undo.length === 0;
  rerenderFlow(true);
}

// ────────────────────────────────────────────────────────────────
// EDGE CACHE  (O(1) замість O(n) при кожному виклику)
// ────────────────────────────────────────────────────────────────
const EDGE_CACHE = createEdgeCacheState();

function invalidateEdgeCache() { markEdgeCacheDirty(EDGE_CACHE); }
function outEdges(id) { return getOutEdges(S, EDGE_CACHE, id); }
function inEdges(id)  { return getInEdges(S, EDGE_CACHE, id); }
function findBackEdges() { return getBackEdges(S, EDGE_CACHE); }
function collectIssues() {
  return collectIssueList(S, { inEdges, outEdges, findBackEdges });
}
function issueColor(level) {
  return level === 'error' ? '#ef4444' : level === 'warn' ? '#f59e0b' : '#64748b';
}
function issueHint(issue) {
  if (!issue) return '';
  const msgs = Array.isArray(issue.msgs) ? issue.msgs : [];
  return msgs.join('\n');
}

// GRAPH HELPERS
const nodeH = id => S.nodes[id]?.type === 'decision' ? DIAMOND_HALF * 2 : NODE_H;
const nodeW = id => {
  const t = S.nodes[id]?.type;
  return t === 'input-output' ? IO_W : t === 'decision' ? DIAMOND_HALF * 2 : NODE_W;
};

function ancestors(id) { return getAncestors(S, EDGE_CACHE, id); }
function descendants(startId) { return getDescendants(S, EDGE_CACHE, startId); }
function openEnds() { return getOpenEnds(S, EDGE_CACHE); }
function isDone() { return getIsDone(S, EDGE_CACHE); }
function hasIncompleteIf() { return detectIncompleteIf(S, EDGE_CACHE); }
function computeRanks() {
  return computeGraphRanks(S, { outEdges, findBackEdges });
}

function layout() {
  applyLayout(S, {
    inEdges,
    outEdges,
    findBackEdges,
    nodeH,
    updateWrapSize,
    svg,
    constants: { CX, HO, ROW_GAP, NODE_H, VG, DY_LIMIT },
  });
}


// ────────────────────────────────────────────────────────────────
// RENDER
// ────────────────────────────────────────────────────────────────
function render(skipIssues = false) {
  clearEl(layerTitle); clearEl(layerEdges); clearEl(layerNodes); clearEl(layerPlus);
  _edgeOccupancy = [];
  // Під час drag не перераховуємо issues — структура не змінилась, а CPU економимо
  if (!skipIssues) {
    const v = collectIssues();
    S.issues = v.issues;
    S.issuesByNode = v.byNode;
  }
  renderTitle();
  for (const e of S.edges) renderEdge(e);
  for (const id of Object.keys(S.nodes)) renderNode(id);
  for (const e of openEnds()) renderPlus(e);
  scheduleToolbarUpdate();
  updateProgress();
}

if (titleInput) {
  titleInput.addEventListener('input', () => {
    const hadTitle = String(S.title ?? '').trim().length > 0;
    const next = normalizeTitle(titleInput.value);
    if (S.title === next) return;
    S.title = next;
    const hasTitle = next.length > 0;
    if (hadTitle !== hasTitle) {
      rerenderFlow(true);
      return;
    }
    scheduleTitleRender();
  });
  titleInput.addEventListener('blur', () => {
    const changed = setTitle(titleInput.value);
    if (changed) rerenderFlow(true);
  });
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
  // Keep title below header area and above the top-most block.
  const TITLE_SAFE_TOP = 108;
  const y = Math.max(TITLE_SAFE_TOP, minTop - 132);

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
  layerTitle.appendChild(g);

  // background bubble sized from real text bbox (best effort)
  try {
    const bb = t.getBBox();
    const padX = 22, padY = 14;
    let ry = bb.y - padY;
    // Guarantee a visible gap between title bubble and the top block
    const bubbleBottom = bb.y + bb.height + padY;
    const maxBottom = minTop - 28;
    if (bubbleBottom > maxBottom) ry -= (bubbleBottom - maxBottom);
    ry = Math.max(TITLE_SAFE_TOP - 36, ry);
    const r = mkSvg('rect', {
      x: bb.x - padX,
      y: ry,
      width: bb.width + padX * 2,
      height: bb.height + padY * 2,
      rx: 18,
      fill: 'rgba(255,255,255,0.92)',
      stroke: '#c7d2fe',
      'stroke-width': 2,
      filter: 'url(#sh)'
    });
    if (ry !== bb.y - padY) {
      const tdy = ry - (bb.y - padY);
      t.setAttribute('y', String(y + tdy));
    }
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
  const issue = S.issuesByNode?.[id];

  const g = mkSvg('g', { 'data-nid': id, class: 'node-g' });

  if (issue) {
    const clr = issueColor(issue.level);
    const ring = buildShape(n.type, x, y, 'none', clr, 8);
    ring.classList.add('node-issue-ring');
    ring.setAttribute('opacity', issue.level === 'error' ? '0.34' : '0.26');
    ring.removeAttribute('filter');
    g.appendChild(ring);
  }

  if (sel) {
    const glow = buildShape(n.type, x, y, 'none', '#e879f9', 10);
    glow.classList.add('node-sel-glow');
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
    const bx = n.type === 'decision' ? x + DIAMOND_HALF : x + nodeW(id) / 2;
    const by = n.type === 'decision' ? y - DIAMOND_HALF - 12 : y - NODE_H / 2 - 10;
    const bl = mkSvg('text', {
      x: bx, y: by, 'text-anchor': 'end', fill: '#94a3b8',
      'font-size': '11', 'font-weight': '700',
      'font-family': "'Nunito',sans-serif", 'pointer-events': 'none',
      class: 'node-type-label',
    });
    bl.textContent = m.label;
    g.appendChild(bl);
  }

  if (issue) {
    const r = 12;
    const bx = n.type === 'decision' ? x + DIAMOND_HALF - 8 : x + nodeW(id) / 2 - 8;
    const by = n.type === 'decision' ? y - DIAMOND_HALF + 8 : y - nodeH(id) / 2 + 8;
    const clr = issueColor(issue.level);
    const badge = mkSvg('g', { class: 'node-issue-badge' });
    const hint = mkSvg('title');
    hint.textContent = issueHint(issue);
    badge.appendChild(hint);
    badge.appendChild(mkSvg('circle', {
      cx: bx, cy: by, r, fill: 'white', stroke: clr, 'stroke-width': 2.5,
      class: 'node-issue-badge-circle'
    }));
    const t = mkSvg('text', {
      x: bx, y: by + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: clr, 'font-size': '13', 'font-weight': '900', 'font-family': "'Nunito',sans-serif",
      'pointer-events': 'none', class: 'node-issue-badge-mark'
    });
    t.textContent = '!';
    badge.appendChild(t);
    g.appendChild(badge);
  }

  layerNodes.appendChild(g);
  renderComment(id);
}

function removeRenderedComment(id) {
  layerNodes.querySelector('[data-comment-for="' + id + '"]')?.remove();
}

function renderComment(id) {
  try {
    removeRenderedComment(id);
    const layout = getCommentLayout({
      text: S.comments?.[id],
      position: S.pos[id],
      nodeWidth: nodeW(id),
      wrapText,
    });
    if (!layout) return;

    const g = mkSvg('g', { 'data-comment-for': id, class: 'node-comment' });
    g.appendChild(mkSvg('line', {
      x1: layout.connector.x1,
      y1: layout.connector.y1,
      x2: layout.connector.x2,
      y2: layout.connector.y2,
      stroke: '#94a3b8',
      'stroke-width': 1.5,
      'stroke-dasharray': '6 3',
    }));
    g.appendChild(mkSvg('rect', {
      x: layout.box.x,
      y: layout.box.y,
      width: layout.box.width,
      height: layout.box.height,
      rx: layout.box.rx,
      fill: '#f8fafc',
      stroke: '#94a3b8',
      'stroke-width': 1.5,
      'stroke-dasharray': '6 3',
    }));

    layout.lines.forEach(line => {
      const t = mkSvg('text', {
        x: line.x,
        y: line.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#64748b',
        'font-size': '12',
        'font-weight': '700',
        'font-family': "'Nunito',sans-serif",
        'pointer-events': 'none',
      });
      t.textContent = line.text;
      g.appendChild(t);
    });

    layerNodes.appendChild(g);
  } catch (error) {
    console.error('comment-render-failed', error);
  }
}

function getCommentBounds(id) {
  const layout = getCommentLayout({
    text: S.comments?.[id],
    position: S.pos[id],
    nodeWidth: nodeW(id),
    wrapText,
  });
  if (!layout) return null;
  return {
    l: layout.box.x,
    t: layout.box.y,
    r: layout.box.x + layout.box.width,
    b: layout.box.y + layout.box.height,
  };
}

function buildShape(type, x, y, fill, stroke, sw) {
  return buildSvgShape(mkSvg, { NODE_W, NODE_H, DIAMOND_HALF, IO_W }, type, x, y, fill, stroke, sw);
}

// renderEdge ────────────────────────────────────────────────
const EDGE_STUB = 28;
const EDGE_END_STUB = 36;
const EDGE_LANE_GAP = 92;
const EDGE_HIT_PAD = 18;

function edgeRoute(e) {
  return computeEdgeRoute({
    S,
    e,
    edgeOccupancy: _edgeOccupancy,
    nodeW,
    nodeH,
    constants: { CX, DIAMOND_HALF, EDGE_STUB, EDGE_END_STUB, EDGE_LANE_GAP, EDGE_HIT_PAD },
  });
}

function renderEdge(e) {
  const fp = S.pos[e.from], tp = S.pos[e.to];
  if (!fp || !tp) return;

  const isY = e.label === 'yes', isN = e.label === 'no';
  const strk = isY ? '#16a34a' : isN ? '#dc2626' : '#475569';
  const mrk = isY ? 'url(#arr-yes)' : isN ? 'url(#arr-no)' : 'url(#arr)';
  const route = edgeRoute(e);
  if (!route || !route.pts?.length) return;

  const d = route.pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  layerEdges.appendChild(mkSvg('path', {
    d, stroke: strk, 'stroke-width': 2.8, fill: 'none',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'marker-end': mrk,
  }));
  _edgeOccupancy.push(...pathSegments(route.pts));

  if (e.label) {
    const s = route.fromAnchor || fp;
    const fs = route.fromSide || (isY ? 'left' : isN ? 'right' : 'bottom');
    const lx = s.x + (fs === 'left' ? -52 : fs === 'right' ? 52 : 0);
    const ly = s.y + (fs === 'top' ? -32 : fs === 'bottom' ? 32 : 0);

    const lg = mkSvg('g');
    lg.appendChild(mkSvg('rect', {
      x: lx - 25, y: ly - 15, width: 50, height: 30, rx: 15,
      fill: 'white', stroke: strk, 'stroke-width': 2,
    }));
    const lt = mkSvg('text', {
      x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: isY ? '#15803d' : '#b91c1c',
      'font-size': '13', 'font-weight': '800', 'font-family': "'Nunito',sans-serif",
    });
    lt.textContent = isY ? 'Так' : 'Ні';
    lg.appendChild(lt);
    layerEdges.appendChild(lg);
  }
}

// ── renderPlus ────────────────────────────────────────────────
function renderPlus({ pid, lbl }) {
  const pp = S.pos[pid];
  if (!pp) return;
  const pn = S.nodes[pid];
  const rnk = S.ranks[pid] ?? 0;

  // place the "+" below the node (follows small vertical moves)
  const nextRowH = S.rankH?.[rnk + 1] ?? NODE_H;
  const py = pp.y + nodeH(pid) / 2 + ROW_GAP + nextRowH / 2;

  let px;

  const isYesNo = (lbl === 'yes' || lbl === 'no');
  if (pn.type === 'decision' && isYesNo) {
    px = lbl === 'yes' ? pp.x - HO : pp.x + HO;
    layerPlus.appendChild(mkSvg('path', {
      d: `M${lbl === 'yes' ? pp.x - DIAMOND_HALF : pp.x + DIAMOND_HALF},${pp.y} L${px},${pp.y} L${px},${py - 38}`,
      stroke: lbl === 'yes' ? '#86efac' : '#fca5a5',
      'stroke-width': 2.5, fill: 'none', 'stroke-dasharray': '7 4', 'stroke-linecap': 'round',
    }));
  } else {
    px = pp.x;
    layerPlus.appendChild(mkSvg('path', {
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
    try {
      openWiz(pid, lbl);
    } catch (error) {
      reportRuntimeError('open-plus-wizard', error);
    }
  });
  layerPlus.appendChild(g);
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
    const g = layerNodes.querySelector(`[data-nid="${_nodeDrag.id}"]`);
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

  const gg = layerNodes.querySelector(`[data-nid="${id}"]`);
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
    const gg = layerNodes.querySelector(`[data-nid="${_nodeDrag.id}"]`);
    if (gg) gg.classList.remove('dragging');
  }
  _nodeDrag = null;
  area.classList.remove('node-dragging');
});

// Lightweight: update only the dragged node's position without full clear/rebuild
function updateNodePosition(id) {
  const g = layerNodes.querySelector(`[data-nid="${id}"]`);
  if (!g || !S.pos[id]) return;
  const { x, y } = S.pos[id];
  const n = S.nodes[id];
  if (!n) return;

  function setShapePosition(el) {
    if (!el) return;
    if (n.type === 'start' || n.type === 'end' || n.type === 'process') {
      el.setAttribute('x', x - NODE_W / 2);
      el.setAttribute('y', y - NODE_H / 2);
    } else if (n.type === 'subroutine') {
      const rect = el.querySelector('rect');
      const rails = el.querySelectorAll('line');
      rect?.setAttribute('x', x - NODE_W / 2);
      rect?.setAttribute('y', y - NODE_H / 2);
      rails[0]?.setAttribute('x1', x - NODE_W / 2 + 14);
      rails[0]?.setAttribute('y1', y - NODE_H / 2);
      rails[0]?.setAttribute('x2', x - NODE_W / 2 + 14);
      rails[0]?.setAttribute('y2', y + NODE_H / 2);
      rails[1]?.setAttribute('x1', x + NODE_W / 2 - 14);
      rails[1]?.setAttribute('y1', y - NODE_H / 2);
      rails[1]?.setAttribute('x2', x + NODE_W / 2 - 14);
      rails[1]?.setAttribute('y2', y + NODE_H / 2);
    } else if (n.type === 'decision') {
      el.setAttribute('points', `${x},${y - DIAMOND_HALF} ${x + DIAMOND_HALF},${y} ${x},${y + DIAMOND_HALF} ${x - DIAMOND_HALF},${y}`);
    } else { // input-output
      const s = 20;
      el.setAttribute('points',
        `${x - IO_W / 2 + s},${y - NODE_H / 2} ${x + IO_W / 2 + s},${y - NODE_H / 2} ${x + IO_W / 2 - s},${y + NODE_H / 2} ${x - IO_W / 2 - s},${y + NODE_H / 2}`);
    }
  }

  // Update all same-shape overlays (base, warning ring, selected glow)
  setShapePosition(g.querySelector('.node-shape'));
  setShapePosition(g.querySelector('.node-issue-ring'));
  setShapePosition(g.querySelector('.node-sel-glow'));

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
    const bx = n.type === 'decision' ? x + DIAMOND_HALF : x + nodeW(id) / 2;
    const by = n.type === 'decision' ? y - DIAMOND_HALF - 12 : y - NODE_H / 2 - 10;
    typeLabel.setAttribute('x', bx);
    typeLabel.setAttribute('y', by);
  }

  // Update issue badge position (icon + hit area + tooltip anchor)
  const issueCircle = g.querySelector('.node-issue-badge-circle');
  const issueMark = g.querySelector('.node-issue-badge-mark');
  if (issueCircle || issueMark) {
    const bx = n.type === 'decision' ? x + DIAMOND_HALF - 8 : x + nodeW(id) / 2 - 8;
    const by = n.type === 'decision' ? y - DIAMOND_HALF + 8 : y - nodeH(id) / 2 + 8;
    if (issueCircle) {
      issueCircle.setAttribute('cx', bx);
      issueCircle.setAttribute('cy', by);
    }
    if (issueMark) {
      issueMark.setAttribute('x', bx);
      issueMark.setAttribute('y', by + 0.5);
    }
  }

  renderComment(id);
}


// Partial re-render: edges + plus only (faster during drag)
function renderEdgesAndPlus() {
  clearEl(layerTitle); clearEl(layerEdges); clearEl(layerPlus);
  _edgeOccupancy = [];
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
  const g = layerNodes.querySelector(`[data-nid="${id}"]`);
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

function editNodeComment(id) {
  if (!id || !S.nodes[id]) return;
  const current = S.comments?.[id] || '';
  const raw = window.prompt('Додайте коментар до блоку:', current);
  if (raw === null) return;

  const next = normalizeCommentText(raw);
  if (next === current) return;

  snap();
  if (!S.comments) S.comments = {};
  if (next) S.comments[id] = next;
  else delete S.comments[id];

  hideToolbar();
  rerenderFlow(false);
  showToast(next ? 'Коментар збережено.' : 'Коментар видалено.');
}

$('btn-edit-node').addEventListener('click', () => {
  if (!S.sel) return;
  startEditNode(S.sel);
});

$('btn-comment-node').addEventListener('click', () => {
  if (!S.sel) return;
  editNodeComment(S.sel);
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
    rerenderFlow(true);
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

function findSiblingOpenEnd(pid, lbl) {
  const blocked = new Set([pid]);
  ancestors(pid).forEach(id => blocked.add(id));
  descendants(pid).forEach(id => blocked.add(id));

  const candidates = openEnds().filter(end => {
    if (!end || end.pid === pid) return false;
    if (blocked.has(end.pid)) return false;
    const otherBlocked = new Set();
    ancestors(end.pid).forEach(id => otherBlocked.add(id));
    descendants(end.pid).forEach(id => otherBlocked.add(id));
    if (otherBlocked.has(pid)) return false;
    return true;
  });

  const myRank = S.ranks?.[pid] ?? 0;
  candidates.sort((a, b) => {
    const rankDelta = Math.abs((S.ranks?.[a.pid] ?? 0) - myRank) - Math.abs((S.ranks?.[b.pid] ?? 0) - myRank);
    if (rankDelta) return rankDelta;
    if ((a.lbl === lbl) !== (b.lbl === lbl)) return (a.lbl === lbl) ? -1 : 1;
    return String(a.pid).localeCompare(String(b.pid));
  });

  return candidates[0] || null;
}

function connectableNodes(pid, lbl) {
  if (!pid || !S.nodes[pid]) return [];

  const banned = new Set([pid]);
  descendants(pid).forEach(id => banned.add(id));
  outEdges(pid).forEach(edge => { if (edge.to) banned.add(edge.to); });

  return Object.values(S.nodes)
    .filter(node => node && !banned.has(node.id))
    .filter(node => node.type !== 'start')
    .filter(node => !(node.type === 'decision' && lbl == null))
    .sort((a, b) => {
      const rankDelta = (S.ranks?.[a.id] ?? 0) - (S.ranks?.[b.id] ?? 0);
      if (rankDelta) return rankDelta;
      return String(a.id).localeCompare(String(b.id));
    });
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
  invalidateEdgeCache();
  for (const id of rmSet) {
    delete S.nodes[id];
    if (S.manual) delete S.manual[id];
    if (S.comments) delete S.comments[id];
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

  // Rewire incoming edges to the next block — create NEW edge objects (не мутуємо оригінали,
  // щоб undo-стек зберігав коректний стан)
  const rewiredEdges = [];
  for (const e of inc) {
    if (target && S.nodes[target] && target !== id) {
      rewiredEdges.push({ ...e, to: target });
    } else {
      edgesToDrop.add(e);
    }
  }

  // Remove edges going from the deleted node + dropped incoming edges + broken edges
  S.edges = S.edges.filter(e =>
    e.from !== id &&
    e.to !== id &&
    !edgesToDrop.has(e) &&
    e.to && S.nodes[e.to] &&
    e.from && S.nodes[e.from]
  );

  // Add rewired edges (нові об'єкти)
  S.edges.push(...rewiredEdges);
  invalidateEdgeCache();

  // Remove node
  delete S.nodes[id];
  if (S.manual) delete S.manual[id];
  if (S.comments) delete S.comments[id];

  // If some blocks became unreachable (e.g., after deleting a decision), remove them
  pruneUnreachable();
}


// ────────────────────────────────────────────────────────────────
// WIZARD
// ────────────────────────────────────────────────────────────────
function openWiz(pid, lbl) {
  S.wiz = { open: true, step: 'type', pid, plbl: lbl, type: null, editId: null };

  const badge = $('step-type-badge');
  const badgeData = getWizardBadge(lbl);
  if (badgeData) {
    badge.textContent = badgeData.text;
    badge.className = badgeData.className;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const sibling = findSiblingOpenEnd(pid, lbl);
  const ms = $('merge-suggestion');
  if (sibling) {
    const sibNode = S.nodes[sibling.pid];
    $('merge-hint-text').textContent = getMergeHintText(sibNode?.text, sibling.lbl);
    ms.classList.remove('hidden');
    $('btn-merge-sibling').onclick = () => {
      snap();
      const mid = 'n' + (++S.cnt);
      S.nodes[mid] = { id: mid, type: 'process', text: 'Продовження' };
      S.edges.push({ from: pid, to: mid, label: lbl });
      S.edges.push({ from: sibling.pid, to: mid, label: sibling.lbl });
      invalidateEdgeCache();
      closeWiz(); rerenderFlow(true);
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
  const panel = $('wizard-panel');
  panel.style.transform = 'translateY(0)';
  panel.setAttribute('aria-hidden', 'false');
  activateDialogFocus(panel, S.wiz.step === 'explain' ? $('text-inp') : null);
  // Hide mascot when wizard opens
  $('mascot').classList.add('wiz-open');
  $('mascot-toggle').style.opacity = '0';
  $('mascot-toggle').style.pointerEvents = 'none';
  requestAnimationFrame(() => {
    const wh = panel.offsetHeight || 0;
    $('mascot').style.bottom = (wh + 10) + 'px';
    $('mascot-toggle').style.bottom = (wh + 10) + 'px';
  });
}

function closeWiz() {
  S.wiz = { open: false, step: 'type', pid: null, plbl: null, type: null, editId: null };
  const panel = $('wizard-panel');
  panel.style.transform = 'translateY(110%)';
  deactivateDialogFocus(panel);
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
    const el = $(id);
    const visible = id === 'step-' + step;
    el.classList.toggle('hidden', !visible);
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  });
  S.wiz.step = step;
  const live = $('wizard-live');
  if (live) {
    live.textContent = getWizardLiveText(step);
  }
}

function setExplainContent(type) {
  const content = getExplainContentHtml(type, TYPE_META, escHtml);
  $('explain-content').className = content.className;
  $('explain-content').innerHTML = content.html;
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
    const anc = ancestors(S.wiz.pid);
    const backCands = cands.filter(n => anc.has(n.id));
    if (backCands.length > 0) {
      const hint = document.createElement('p');
      hint.className = 'text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 mb-2';
      hint.innerHTML = getCycleConnectionHintHtml();
      list.appendChild(hint);
    }
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
        invalidateEdgeCache();
        closeWiz(); rerenderFlow(true);
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
    closeWiz(); rerenderFlow(false);
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
  invalidateEdgeCache();
  closeWiz(); rerenderFlow(true);
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
  Object.assign(S, { nodes: {}, edges: [], root: null, cnt: 0, undo: [], sel: null, ranks: {}, pos: {}, manual: {}, baseX: {}, baseY: {}, rankY: {}, rankH: {}, title: '', issues: [], issuesByNode: {}, comments: {} });
  invalidateEdgeCache();
  $('btn-undo').disabled = true;
  closeWiz(); hideToolbar(); init();
});
$('del-cancel').addEventListener('click', () => closeModal('del-modal'));
['del-modal', 'reset-modal', 'check-modal'].forEach(id => {
  const modal = $(id);
  if (!modal) return;
  modal.addEventListener('pointerdown', e => { if (e.target === modal) closeModal(id); });
});

function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.setAttribute('aria-hidden', 'false');
  el.classList.remove('hidden');
  el.classList.add('flex');
  activateDialogFocus(el);
}
function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add('hidden');
  el.classList.remove('flex');
  deactivateDialogFocus(el);
}

function focusNode(id) {
  const p = S.pos[id];
  if (!p) return;
  hideToolbar();
  area.scrollTo({
    top: Math.max(0, p.y * _scale - area.clientHeight * 0.42),
    left: Math.max(0, p.x * _scale - area.clientWidth * 0.5),
    behavior: 'smooth',
  });
  setTimeout(() => selectNode(id), 120);
}

function renderCheckModal() {
  const list = $('check-list');
  const summary = $('check-summary');
  if (!list || !summary) return;
  const issues = S.issues || [];
  list.innerHTML = '';

  const errs = issues.filter(i => i.level === 'error').length;
  const warns = issues.filter(i => i.level === 'warn').length;
  if (!issues.length) {
    summary.textContent = 'Помилок не знайдено. Схема виглядає добре.';
    const ok = document.createElement('div');
    ok.className = 'check-item ok';
    ok.innerHTML = `<i class="fa-solid fa-circle-check text-green-500"></i><div class="font-bold">Чудово! Можна продовжувати або зберігати схему.</div>`;
    list.appendChild(ok);
    return;
  }

  summary.textContent = `Знайдено: ${errs} критичних, ${warns} підказок.`;
  for (const it of issues) {
    const row = document.createElement('button');
    const lvl = it.level === 'error' ? 'error' : 'warn';
    row.className = `check-item ${lvl}` + (it.nodeId ? '' : ' no-node');
    row.type = 'button';
    row.innerHTML = `
      <div class="check-ico">${it.level === 'error' ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-lightbulb"></i>'}</div>
      <div class="check-msg">${escHtml(it.msg)}</div>
      ${it.nodeId ? '<div class="check-go"><i class="fa-solid fa-location-crosshairs"></i></div>' : ''}
    `;
    if (it.nodeId) {
      row.addEventListener('click', () => {
        closeModal('check-modal');
        focusNode(it.nodeId);
      });
    } else {
      row.disabled = true;
    }
    list.appendChild(row);
  }
}

$('btn-check')?.addEventListener('click', () => {
  render(); // refresh validation state before showing list
  renderCheckModal();
  openModal('check-modal');
});
$('btn-check-close')?.addEventListener('click', () => closeModal('check-modal'));

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
      try {
        loadExample(ex);
        closeModal('ex-modal');
      } catch (error) {
        reportRuntimeError(`load-example:${ex.id}`, error);
      }
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
  invalidateEdgeCache();
  S.root = ex.root;
  S.cnt = maxId;
  S.undo = []; S.sel = null; S.pos = {}; S.ranks = {};
  S.manual = {}; S.baseX = {}; S.baseY = {}; S.rankY = {}; S.rankH = {}; S.comments = {};
  setTitle(ex.title || '');
  $('btn-undo').disabled = true;
  closeWiz(); hideToolbar();
  rerenderFlow(true);
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
    setTitle(raw);
    closeModal('save-modal');
    rerenderFlow(true); // show title on canvas

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

  const saveBtnConfirm = $('save-confirm');
  const saveBtnCancel  = $('save-cancel');

  // Use direct handlers so reopening modal never accumulates listeners.
  saveBtnConfirm.onclick = runSave;
  saveBtnCancel.onclick = () => closeModal('save-modal');

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
    const commentBounds = getCommentBounds(id);
    if (commentBounds) {
      minX = Math.min(minX, commentBounds.l - 12);
      minY = Math.min(minY, commentBounds.t - 12);
      maxX = Math.max(maxX, commentBounds.r + 12);
      maxY = Math.max(maxY, commentBounds.b + 12);
    }
  }

  // Include title bounds (so it won't be clipped in the saved PNG)
  const titleG = $('alg-title');
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
  const prevVis = layerPlus.getAttribute('visibility');
  layerPlus.setAttribute('visibility', 'hidden');

  const prevVB = svg.getAttribute('viewBox');
  const prevW = svg.getAttribute('width');
  const prevH = svg.getAttribute('height');
  svg.setAttribute('viewBox', `${minX} ${minY} ${W} ${H}`);
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));

  const bgRect = mkSvg('rect', { x: minX, y: minY, width: W, height: H, fill: '#eef2ff' });
  // put background under ALL layers
  svg.insertBefore(bgRect, layerTitle || layerEdges);

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
          if (!b) { rej(new Error('toBlob повернув null')); return; }
          const pngUrl = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = pngUrl;
          const safe = (title || 'блок-схема').replace(/[\\/:*?"<>|]+/g, '_').trim();
          a.download = (safe || 'блок-схема') + '.png';
          a.click();
          // Гарантовано звільняємо URL після завантаження
          setTimeout(() => URL.revokeObjectURL(pngUrl), 1500);
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
    if (prevVis) layerPlus.setAttribute('visibility', prevVis); else layerPlus.removeAttribute('visibility');
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
    const commentBounds = getCommentBounds(id);
    if (commentBounds) {
      mnX = Math.min(mnX, commentBounds.l - 12);
      mnY = Math.min(mnY, commentBounds.t - 12);
      mxX = Math.max(mxX, commentBounds.r + 12);
      mxY = Math.max(mxY, commentBounds.b + 12);
    }
  }

  // include the title bubble in "fit" bounds
  const titleG = $('alg-title');
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
  if (_activeDialog) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); applyZoom(_scale + S_STEP); }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); applyZoom(_scale - S_STEP); }
  if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); fitToScreen(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  if (e.key === 'Escape') {
    closeWiz(); hideToolbar();
    closeModal('del-modal'); closeModal('reset-modal'); closeModal('ex-modal'); closeModal('save-modal'); closeModal('check-modal');
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
  const html = getMascotHtml({
    nodeCount: cnt,
    wizardOpen: S.wiz.open,
    wizardStep: S.wiz.step,
    isComplete: isDone(),
    hasLoop: findBackEdges().size > 0,
    hasIncompleteBranch: hasIncompleteIf(),
    openEnds: oe,
  });
  el.innerHTML = html;
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

function reportRuntimeError(context, error) {
  const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(context, error);
  const mascotEl = $('mascot-msg');
  if (mascotEl) {
    mascotEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-500 mr-2"></i>Сталася помилка: ${escHtml(details)}`;
  }
  const toastEl = $('toast');
  if (toastEl) showToast(`Помилка: ${details}`, 4200);
}

window.addEventListener('error', event => {
  reportRuntimeError('window-error', event.error || event.message);
});
window.addEventListener('unhandledrejection', event => {
  reportRuntimeError('unhandled-rejection', event.reason);
});

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
const wrapText = createWrapText();


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
  setTitle('');
  rerenderFlow(true);
  setTimeout(() => {
    area.scrollLeft = Math.max(0, CX - area.clientWidth / 2);
  }, 60);
}

init();
