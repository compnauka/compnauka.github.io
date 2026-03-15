'use strict';

import { EXAMPLES as EXAMPLES_DATA } from './modules/examples.mjs';
import { createExampleState, getExampleCardHtml } from './modules/example-utils.mjs';
import { applyExampleState, getExampleLoadedToastText } from './modules/example-loader.mjs';
import { createExampleCardButton, isBackdropClick } from './modules/examples-modal-ui.mjs';
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
import { renderMascotMessage, toggleMascotVisibility } from './modules/mascot-ui.mjs';
import { getWizardBadge, getWizardLiveText, getExplainContentHtml, getMergeHintText, getDecisionEdgeLabelPosition } from './modules/wizard.mjs';
import { createClosedWizardState, createInsertWizardState, createEditWizardState } from './modules/wizard-state.mjs';
import { buildShape as buildSvgShape, pathSegments, createWrapText } from './modules/render-utils.mjs';
import { computeRanks as computeGraphRanks, applyLayout } from './modules/layout.mjs';
import { computeEdgeRoute } from './modules/edge-routing.mjs';
import { getCommentLayout, normalizeCommentText, normalizeCommentOffset } from './modules/comments.mjs';
import { createStateSnapshot, restoreStateSnapshot, pushUndoSnapshot, popUndoSnapshot } from './modules/history.mjs';
import { computeToolbarPlacement, getDeleteNodeMessage } from './modules/node-ui.mjs';
import { getDeleteModalState, bindDeleteModalButtons } from './modules/delete-modal-ui.mjs';
import { showToolbarElement, hideToolbarElement, shouldHideToolbarOnCanvasPointer } from './modules/toolbar-ui.mjs';
import { getCheckSummaryText, getCheckSuccessHtml, getCheckIssueMeta } from './modules/check-ui.mjs';
import { bindCheckModalControls } from './modules/check-modal-ui.mjs';
import { bindCheckIssueRow, hasCheckIssueTarget } from './modules/check-list-ui.mjs';
import { bindResetModalControls } from './modules/reset-modal-ui.mjs';
import { bindWizardControls } from './modules/wizard-controls-ui.mjs';
import { renderWizardBadge, showWizardStepUi, openWizardPanelUi, closeWizardPanelUi } from './modules/wizard-panel-ui.mjs';
import { createEmptyWorkspaceState } from './modules/workspace-state.mjs';
import { validateSaveTitle, makeDownloadFileName } from './modules/save-ui.mjs';
import { bindSaveModalControls } from './modules/save-modal-ui.mjs';
import { showModalElement, hideModalElement } from './modules/modal-ui.mjs';
import { getNodeFocusScroll } from './modules/focus-ui.mjs';
import { buildExistingConnectionView, renderExistingConnectionView } from './modules/existing-link-ui.mjs';
import { getProgressPercent, showToastElement, hideToastElement, getRuntimeErrorMascotHtml, getRuntimeErrorToastText } from './modules/feedback-ui.mjs';
import { shouldIgnoreGlobalKeydown, shouldTriggerDeleteShortcut, closeAllEditorOverlays } from './modules/keyboard-ui.mjs';

// ----------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------
const SVG_W = 1700;
const CX = SVG_W / 2;
const NODE_W = 164;        // width of a rectangular node
const NODE_H = 58;         // height of a rectangular node
const DIAMOND_HALF = 72;   // half of the decision diamond diagonal
const IO_W = 180;          // width of the input/output parallelogram
const VG = 118, HO = 290;
// vertical gap between rows (centers are computed from row heights)
const ROW_GAP = 42;
// Manual vertical adjustment limits (default is small, hold Shift for more)
const DY_LIMIT = 70;
const DY_LIMIT_SHIFT = 160;

const TYPE_META = {
  start: { label: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a', icon: 'fa-play', fill: '#22c55e', stroke: '#15803d', explain: null },
  process: {
    label: '\u0414\u0456\u044f', icon: 'fa-bolt', fill: '#0ea5e9', stroke: '#0369a1',
    explain: '\u041e\u0434\u043d\u0430 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u0430 \u0434\u0456\u044f: \u043d\u0430\u0442\u0438\u0441\u043d\u0443\u0442\u0438 \u043a\u043d\u043e\u043f\u043a\u0443, \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u0442\u0438 \u043a\u043d\u0438\u0433\u0443, \u043f\u0440\u0438\u0433\u043e\u0442\u0443\u0432\u0430\u0442\u0438 \u0457\u0436\u0443.'
  },
  decision: {
    label: '\u041f\u0438\u0442\u0430\u043d\u043d\u044f', icon: 'fa-question', fill: '#f59e0b', stroke: '#b45309',
    explain: '\u041f\u0435\u0440\u0435\u0432\u0456\u0440\u043a\u0430 \u0443\u043c\u043e\u0432\u0438. \u0412\u0456\u0434\u043f\u043e\u0432\u0456\u0434\u044c \u2014 \u0442\u0456\u043b\u044c\u043a\u0438 \u00ab\u0422\u0430\u043a\u00bb \u0430\u0431\u043e \u00ab\u041d\u0456\u00bb. \u0421\u0445\u0435\u043c\u0430 \u0440\u043e\u0437\u0433\u0430\u043b\u0443\u0436\u0443\u0454\u0442\u044c\u0441\u044f.'
  },
  'input-output': {
    label: '\u0412\u0432\u0456\u0434/\u0412\u0438\u0432\u0456\u0434', icon: 'fa-right-left', fill: '#a855f7', stroke: '#7e22ce',
    explain: '\u041e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u0434\u0430\u043d\u0456 \u0432\u0456\u0434 \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u0430\u0431\u043e \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043d\u0430 \u0435\u043a\u0440\u0430\u043d\u0456.'
  },
  subroutine: {
    label: '\u041f\u0456\u0434\u043f\u0440\u043e\u0433\u0440\u0430\u043c\u0430', icon: 'fa-code', fill: '#0f766e', stroke: '#0d5f58',
    explain: '\u0412\u0438\u043a\u043b\u0438\u043a \u0434\u043e\u043f\u043e\u043c\u0456\u0436\u043d\u043e\u0433\u043e \u0430\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0443 (\u043f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0438 \u0430\u0431\u043e \u0444\u0443\u043d\u043a\u0446\u0456\u0457). '
      + '\u0411\u043b\u043e\u043a \u043f\u043e\u0437\u043d\u0430\u0447\u0430\u0454\u0442\u044c\u0441\u044f \u043f\u0440\u044f\u043c\u043e\u043a\u0443\u0442\u043d\u0438\u043a\u043e\u043c \u0437 \u0434\u0432\u043e\u043c\u0430 \u0431\u0456\u0447\u043d\u0438\u043c\u0438 \u0441\u043c\u0443\u0433\u0430\u043c\u0438.'
  },
  end: {
    label: '\u041a\u0456\u043d\u0435\u0446\u044c', icon: 'fa-flag-checkered', fill: '#f43f5e', stroke: '#be123c',
    explain: '\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e. \u041a\u043e\u0436\u043d\u0430 \u0433\u0456\u043b\u043a\u0430 \u043f\u043e\u0432\u0438\u043d\u043d\u0430 \u043c\u0430\u0442\u0438 \u0441\u0432\u0456\u0439 \u0431\u043b\u043e\u043a \u00ab\u041a\u0456\u043d\u0435\u0446\u044c\u00bb.'
  },
};

const PLACEHOLDER = {
  process: '\u041d\u0430\u043f\u0440\u0438\u043a\u043b\u0430\u0434: \u0412\u0437\u044f\u0442\u0438 \u0440\u044e\u043a\u0437\u0430\u043a',
  decision: '\u041d\u0430\u043f\u0440\u0438\u043a\u043b\u0430\u0434: \u0404 \u0434\u043e\u043c\u0430\u0448\u043d\u0454 \u0437\u0430\u0432\u0434\u0430\u043d\u043d\u044f?',
  'input-output': "\u041d\u0430\u043f\u0440\u0438\u043a\u043b\u0430\u0434: \u0412\u0432\u0435\u0434\u0456\u0442\u044c \u0441\u0432\u043e\u0454 \u0456\u043c'\u044f",
  subroutine: '\u041d\u0430\u043f\u0440\u0438\u043a\u043b\u0430\u0434: \u041e\u0431\u0447\u0438\u0441\u043b\u0438\u0442\u0438 \u0441\u0443\u043c\u0443(a, b)',
};

// ----------------------------------------------------------------
// EXAMPLES DATA
// ----------------------------------------------------------------
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
  commentPos: {},
  wiz: createClosedWizardState(),
};

// ----------------------------------------------------------------
// DOM REFS
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
// EDGE CACHE (O(1) instead of O(n) per lookup)
// ----------------------------------------------------------------
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


// ----------------------------------------------------------------
// RENDER
// ----------------------------------------------------------------
function render(skipIssues = false) {
  clearEl(layerTitle); clearEl(layerEdges); clearEl(layerNodes); clearEl(layerPlus);
  _edgeOccupancy = [];
  // During drag we keep existing issues because graph structure does not change.
  if (!skipIssues) {
    const v = collectIssues();
    S.issues = v.issues;
    S.issuesByNode = v.byNode;
  }
  renderTitle();
  for (const id of Object.keys(S.nodes)) renderComment(id);
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

// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
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

  // Text (main) - with class for safe repositioning
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
}

function removeRenderedComment(id) {
  layerNodes.querySelector('[data-comment-for="' + id + '"]')?.remove();
  layerEdges.querySelector('[data-comment-for="' + id + '"]')?.remove();
}

function getCommentText(id) {
  return String(S.comments?.[id] || '').trim();
}

function renderComment(id) {
  try {
    removeRenderedComment(id);
    const layout = getCommentLayout({
      text: S.comments?.[id],
      position: S.pos[id],
      nodeWidth: nodeW(id),
      wrapText,
      offset: S.commentPos?.[id],
    });
    if (!layout) return;

    const g = mkSvg('g', { 'data-comment-for': id, class: 'node-comment', style: 'cursor:grab' });
    const title = mkSvg('title');
    title.textContent = layout.text;
    g.appendChild(title);

    const connectorPath = layout.connector.points
      .map((point, index) => (index ? 'L' : 'M') + point.x + ',' + point.y)
      .join(' ');
    g.appendChild(mkSvg('path', {
      d: connectorPath,
      stroke: '#94a3b8',
      'stroke-width': 1.5,
      fill: 'none',
      'stroke-dasharray': '6 3',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
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

    layerEdges.appendChild(g);
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
    offset: S.commentPos?.[id],
  });
  if (!layout) return null;
  return {
    l: layout.box.x,
    t: layout.box.y,
    r: layout.box.x + layout.box.width,
    b: layout.box.y + layout.box.height,
  };
}

function expandBounds(bounds, left, top, right, bottom) {
  bounds.minX = Math.min(bounds.minX, left);
  bounds.minY = Math.min(bounds.minY, top);
  bounds.maxX = Math.max(bounds.maxX, right);
  bounds.maxY = Math.max(bounds.maxY, bottom);
}

function getRenderedFlowBounds() {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const layers = [layerTitle, layerEdges, layerNodes];

  for (const layer of layers) {
    if (!layer || !(layer.children?.length || layer.childNodes?.length)) continue;
    try {
      const bb = layer.getBBox();
      if (
        Number.isFinite(bb.x) &&
        Number.isFinite(bb.y) &&
        Number.isFinite(bb.width) &&
        Number.isFinite(bb.height) &&
        bb.width >= 0 &&
        bb.height >= 0
      ) {
        expandBounds(bounds, bb.x, bb.y, bb.x + bb.width, bb.y + bb.height);
      }
    } catch (_error) {
      // Some browsers can throw on empty/unrendered groups; fallback handles it below.
    }
  }

  if (Number.isFinite(bounds.minX) && Number.isFinite(bounds.minY)) return bounds;

  for (const id of Object.keys(S.nodes)) {
    const p = S.pos[id];
    if (!p) continue;
    expandBounds(
      bounds,
      p.x - nodeW(id) / 2 - 20,
      p.y - nodeH(id) / 2 - 20,
      p.x + nodeW(id) / 2 + 20,
      p.y + nodeH(id) / 2 + 20
    );
    const commentBounds = getCommentBounds(id);
    if (commentBounds) {
      expandBounds(bounds, commentBounds.l - 12, commentBounds.t - 12, commentBounds.r + 12, commentBounds.b + 12);
    }
  }

  const titleG = $('alg-title');
  if (titleG) {
    try {
      const bb = titleG.getBBox();
      const extra = 56;
      expandBounds(bounds, bb.x - extra, bb.y - extra, bb.x + bb.width + extra, bb.y + bb.height + extra);
    } catch (_error) {
      if (String(S.title ?? '').trim()) bounds.minY = Math.min(bounds.minY, -220);
    }
  } else if (String(S.title ?? '').trim()) {
    bounds.minY = Math.min(bounds.minY, -220);
  }

  return bounds;
}

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawNodeShapeToCanvas(ctx, id, offsetX, offsetY) {
  const node = S.nodes[id];
  const pos = S.pos[id];
  if (!node || !pos) return;
  const meta = TYPE_META[node.type] || TYPE_META.process;
  const x = pos.x + offsetX;
  const y = pos.y + offsetY;
  const w = nodeW(id);
  const h = nodeH(id);

  ctx.save();
  ctx.fillStyle = meta.fill;
  ctx.strokeStyle = meta.stroke;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  if (node.type === 'start' || node.type === 'end') {
    drawRoundedRectPath(ctx, x - NODE_W / 2, y - NODE_H / 2, NODE_W, NODE_H, NODE_H / 2);
    ctx.fill();
    ctx.stroke();
  } else if (node.type === 'process') {
    drawRoundedRectPath(ctx, x - NODE_W / 2, y - NODE_H / 2, NODE_W, NODE_H, 10);
    ctx.fill();
    ctx.stroke();
  } else if (node.type === 'subroutine') {
    drawRoundedRectPath(ctx, x - NODE_W / 2, y - NODE_H / 2, NODE_W, NODE_H, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.moveTo(x - NODE_W / 2 + 14, y - NODE_H / 2);
    ctx.lineTo(x - NODE_W / 2 + 14, y + NODE_H / 2);
    ctx.moveTo(x + NODE_W / 2 - 14, y - NODE_H / 2);
    ctx.lineTo(x + NODE_W / 2 - 14, y + NODE_H / 2);
    ctx.stroke();
  } else if (node.type === 'decision') {
    ctx.beginPath();
    ctx.moveTo(x, y - DIAMOND_HALF);
    ctx.lineTo(x + DIAMOND_HALF, y);
    ctx.lineTo(x, y + DIAMOND_HALF);
    ctx.lineTo(x - DIAMOND_HALF, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const skew = 20;
    ctx.beginPath();
    ctx.moveTo(x - IO_W / 2 + skew, y - NODE_H / 2);
    ctx.lineTo(x + IO_W / 2 + skew, y - NODE_H / 2);
    ctx.lineTo(x + IO_W / 2 - skew, y + NODE_H / 2);
    ctx.lineTo(x - IO_W / 2 - skew, y + NODE_H / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawCenteredLines(ctx, lines, x, y, lineHeight, color, font) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const startY = y - (lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
  ctx.restore();
}

function drawArrowhead(ctx, from, to, color) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (!len) return;
  const ux = dx / len;
  const uy = dy / len;
  const size = 14;
  const wing = 8;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - ux * size - uy * wing, to.y - uy * size + ux * wing);
  ctx.lineTo(to.x - ux * size + uy * wing, to.y - uy * size - ux * wing);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEdgeToCanvas(ctx, edge, offsetX, offsetY) {
  const isYes = edge.label === 'yes';
  const isNo = edge.label === 'no';
  const color = isYes ? '#16a34a' : isNo ? '#dc2626' : '#475569';
  const route = edgeRoute(edge);
  if (!route || !route.pts?.length) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  route.pts.forEach((pt, index) => {
    const x = pt.x + offsetX;
    const y = pt.y + offsetY;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const last = route.pts[route.pts.length - 1];
  const prev = route.pts[route.pts.length - 2] || last;
  drawArrowhead(ctx, { x: prev.x + offsetX, y: prev.y + offsetY }, { x: last.x + offsetX, y: last.y + offsetY }, color);
  ctx.restore();

  if (!edge.label) return;
  const labelPos = getDecisionEdgeLabelPosition(route, edge.label);
  if (!labelPos) return;
  const x = labelPos.x + offsetX;
  const y = labelPos.y + offsetY;

  ctx.save();
  drawRoundedRectPath(ctx, x - 25, y - 15, 50, 30, 15);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = isYes ? '#15803d' : '#b91c1c';
  ctx.font = '800 13px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isYes ? 'Так' : 'Ні', x, y);
  ctx.restore();
}

function drawCommentToCanvas(ctx, id, offsetX, offsetY) {
  const layout = getCommentLayout({
    text: S.comments?.[id],
    position: S.pos[id],
    nodeWidth: nodeW(id),
    wrapText,
    offset: S.commentPos?.[id],
  });
  if (!layout) return;

  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 3]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  layout.connector.forEach((pt, index) => {
    const x = pt.x + offsetX;
    const y = pt.y + offsetY;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  drawRoundedRectPath(
    ctx,
    layout.box.x + offsetX,
    layout.box.y + offsetY,
    layout.box.width,
    layout.box.height,
    layout.box.rx
  );
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#64748b';
  ctx.font = '700 12px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  layout.lines.forEach(line => {
    ctx.fillText(line.text, line.x + offsetX, line.y + offsetY);
  });
  ctx.restore();
}

function getExportBounds() {
  const rendered = getRenderedFlowBounds();
  const hasRenderedBounds =
    Number.isFinite(rendered.minX) &&
    Number.isFinite(rendered.minY) &&
    Number.isFinite(rendered.maxX) &&
    Number.isFinite(rendered.maxY);

  const bounds = hasRenderedBounds
    ? { ...rendered }
    : { minX: 0, minY: 0, maxX: SVG_W, maxY: 600 };

  const PAD_X = 96;
  const PAD_TOP = 96;
  const PAD_BOTTOM = 156;
  bounds.minX -= PAD_X;
  bounds.minY -= PAD_TOP;
  bounds.maxX += PAD_X;
  bounds.maxY += PAD_BOTTOM;
  return bounds;
}

async function downloadCanvasAsPng(canvas, title) {
  await new Promise((res, rej) => {
    canvas.toBlob(blob => {
      if (!blob) {
        rej(new Error('toBlob returned null'));
        return;
      }
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = makeDownloadFileName(title);
      a.click();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 1500);
      res();
    }, 'image/png');
  });
}

function buildShape(type, x, y, fill, stroke, sw) {
  return buildSvgShape(mkSvg, { NODE_W, NODE_H, DIAMOND_HALF, IO_W }, type, x, y, fill, stroke, sw);
}

// renderEdge ------------------------------------------------
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
    const labelPos = getDecisionEdgeLabelPosition(route, e.label);
    if (!labelPos) return;

    const lg = mkSvg('g');
    lg.appendChild(mkSvg('rect', {
      x: labelPos.x - 25, y: labelPos.y - 15, width: 50, height: 30, rx: 15,
      fill: 'white', stroke: strk, 'stroke-width': 2,
    }));
    const lt = mkSvg('text', {
      x: labelPos.x, y: labelPos.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: isY ? '#15803d' : '#b91c1c',
      'font-size': '13', 'font-weight': '800', 'font-family': "'Nunito',sans-serif",
    });
    lt.textContent = isY ? '\u0422\u0430\u043a' : '\u041d\u0456';
    lg.appendChild(lt);
    layerEdges.appendChild(lg);
  }
}

// ----------------------------------------------------------------
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
    hint.textContent = lbl === 'yes' ? '+ \u0422\u0430\u043a' : '+ \u041d\u0456';
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

// ----------------------------------------------------------------
// NODE DRAG (SVG-level pointer capture)
// ----------------------------------------------------------------
let _commentDrag = null;
let _nodeDrag = null;
let _ignoreClickUntil = 0;
let _ignoreCommentClickUntil = 0;

function svgClientToLocal(clientX, clientY) {
  const r = area.getBoundingClientRect();
  return {
    x: (clientX - r.left + area.scrollLeft) / _scale,
    y: (clientY - r.top + area.scrollTop) / _scale,
  };
}

svg.addEventListener('pointerdown', ev => {
  const comment = ev.target.closest('[data-comment-for]');
  if (!comment) return;
  if (S.wiz.open) return;
  ev.stopPropagation();

  const id = comment.getAttribute('data-comment-for') || comment.dataset.commentFor;
  const loc = svgClientToLocal(ev.clientX, ev.clientY);
  const offset = normalizeCommentOffset(S.commentPos?.[id]);

  _commentDrag = {
    id,
    startLx: loc.x,
    startLy: loc.y,
    startOx: offset.x,
    startOy: offset.y,
    moved: false,
    snapTaken: false,
    pointerId: ev.pointerId,
  };

  svg.setPointerCapture(ev.pointerId);
  area.classList.add('comment-dragging');
});

svg.addEventListener('pointerdown', ev => {
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
  if (_commentDrag) {
    const loc = svgClientToLocal(ev.clientX, ev.clientY);
    const dx = loc.x - _commentDrag.startLx;
    const dy = loc.y - _commentDrag.startLy;

    if (!_commentDrag.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      _commentDrag.moved = true;
      if (!_commentDrag.snapTaken) { snap(); _commentDrag.snapTaken = true; }
      hideToolbar();
    }

    if (_commentDrag.moved) {
      if (!S.commentPos) S.commentPos = {};
      S.commentPos[_commentDrag.id] = {
        x: Math.round(_commentDrag.startOx + dx),
        y: Math.round(_commentDrag.startOy + dy),
      };
      renderComment(_commentDrag.id);
    }
    return;
  }

  if (!_nodeDrag) return;
  const loc = svgClientToLocal(ev.clientX, ev.clientY);

  const dx = loc.x - _nodeDrag.startLx;
  const dyRaw = loc.y - _nodeDrag.startLy;

  const lim = ev.shiftKey ? DY_LIMIT_SHIFT : DY_LIMIT;
  const baseY = _nodeDrag.baseY;
  const desiredY = _nodeDrag.startPy + dyRaw;
  const clampedY = Math.max(baseY - lim, Math.min(baseY + lim, desiredY));

  if (!_nodeDrag.moved && (Math.abs(dx) > 6 || Math.abs(dyRaw) > 6)) {
    _nodeDrag.moved = true;
    if (!_nodeDrag.snapTaken) { snap(); _nodeDrag.snapTaken = true; }
    hideToolbar();
    const g = layerNodes.querySelector(`[data-nid="${_nodeDrag.id}"]`);
    if (g) g.classList.add('dragging');
  }

  if (_nodeDrag.moved) {
    S.pos[_nodeDrag.id] = {
      x: Math.round(_nodeDrag.startPx + dx),
      y: Math.round(clampedY),
    };
    renderEdgesAndPlus();
    updateNodePosition(_nodeDrag.id);
  }
});
svg.addEventListener('pointerup', ev => {
  if (_commentDrag) {
    const wasMoved = _commentDrag.moved;
    const id = _commentDrag.id;
    _commentDrag = null;
    area.classList.remove('comment-dragging');

    if (!wasMoved) {
      const fullText = getCommentText(id);
      if (fullText && Date.now() >= _ignoreCommentClickUntil) showToast(fullText, 5200);
      return;
    }

    _ignoreCommentClickUntil = Date.now() + 350;
    return;
  }

  if (!_nodeDrag) return;
  const wasMoved = _nodeDrag.moved;
  const id = _nodeDrag.id;
  _nodeDrag = null;
  area.classList.remove('node-dragging');

  if (!wasMoved) {
    selectNode(id);
    return;
  }

  _ignoreClickUntil = Date.now() + 450;
  _lastTap = { id: null, t: 0 };

  const gg = layerNodes.querySelector(`[data-nid="${id}"]`);
  if (gg) gg.classList.remove('dragging');

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

  let maxY = 300;
  for (const [nid, p] of Object.entries(S.pos)) maxY = Math.max(maxY, p.y + nodeH(nid) / 2);
  svg.style.minHeight = (maxY + 220) + 'px';
  updateWrapSize();
});
svg.addEventListener('pointercancel', () => {
  _commentDrag = null;
  area.classList.remove('comment-dragging');
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
  for (const id of Object.keys(S.nodes)) renderComment(id);
  for (const e of openEnds()) renderPlus(e);
}

// ----------------------------------------------------------------
// CANVAS PAN (drag on empty canvas)
// ----------------------------------------------------------------
let _canvasDrag = null;

area.addEventListener('pointerdown', ev => {
  const isLeft = ev.button === 0;
  const isMid = ev.button === 1;
  if (!isLeft && !isMid) return;

  // If left click: don't start pan if clicking a node or plus button
  if (isLeft && (ev.target.closest('[data-nid]') || ev.target.closest('[data-plus]') || ev.target.closest('[data-comment-for]'))) return;

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

// ----------------------------------------------------------------
// NODE SELECTION & TOOLBAR
// ----------------------------------------------------------------
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

  showToolbarElement(tb);

  requestAnimationFrame(() => {
    const w = tb.offsetWidth;
    const h = tb.offsetHeight || 54;
    const placement = computeToolbarPlacement({
      rect,
      toolbarWidth: w,
      toolbarHeight: h,
      viewportWidth: window.innerWidth,
    });
    tb.style.left = placement.left + 'px';
    tb.style.top = placement.top + 'px';
  });
}

function hideToolbar() {
  const tb = $('node-tb');
  hideToolbarElement(tb);
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
  if (shouldHideToolbarOnCanvasPointer({ onNode, onPlus, hasSelection: Boolean(S.sel) })) hideToolbar();
});

// Double-click / double-tap -> edit
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
  S.wiz = createEditWizardState(S.nodes[id].type, id);
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
  const raw = window.prompt('\u0414\u043e\u0434\u0430\u0439\u0442\u0435 \u043a\u043e\u043c\u0435\u043d\u0442\u0430\u0440 \u0434\u043e \u0431\u043b\u043e\u043a\u0443:', current);
  if (raw === null) return;

  const next = normalizeCommentText(raw);
  if (next === current) return;

  snap();
  if (!S.comments) S.comments = {};
  if (!S.commentPos) S.commentPos = {};
  if (next) S.comments[id] = next;
  else { delete S.comments[id]; delete S.commentPos[id]; }

  hideToolbar();
  rerenderFlow(false);
  showToast(next ? '\u041a\u043e\u043c\u0435\u043d\u0442\u0430\u0440 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e.' : '\u041a\u043e\u043c\u0435\u043d\u0442\u0430\u0440 \u0432\u0438\u0434\u0430\u043b\u0435\u043d\u043e.');
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
  if (id === S.root) { showToast('\u0411\u043b\u043e\u043a \u00ab\u041f\u043e\u0447\u0430\u0442\u043e\u043a\u00bb \u043d\u0435 \u043c\u043e\u0436\u043d\u0430 \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438!'); return; }

  const n = S.nodes[id];
  $('del-msg').textContent = getDeleteNodeMessage(n?.type);

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
  const current = S.nodes[pid];
  const branchRoot = current.type === 'decision' && (lbl === 'yes' || lbl === 'no')
    ? outEdges(pid).find(edge => edge.label === lbl && edge.to && S.nodes[edge.to])?.to
    : outEdges(pid).find(edge => !edge.label && edge.to && S.nodes[edge.to])?.to;

  if (branchRoot) {
    descendants(branchRoot).forEach(id => banned.add(id));
  }
  outEdges(pid)
    .filter(edge => edge.label === lbl && edge.to)
    .forEach(edge => banned.add(edge.to));

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
    if (S.commentPos) delete S.commentPos[id];
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

  // Rewire incoming edges to the next block. Create new edge objects instead of mutating old ones,
  // so the undo stack keeps the correct historical state.
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

  // Add rewired edges (new objects).
  S.edges.push(...rewiredEdges);
  invalidateEdgeCache();

  // Remove node
  delete S.nodes[id];
  if (S.manual) delete S.manual[id];
  if (S.comments) delete S.comments[id];
  if (S.commentPos) delete S.commentPos[id];

  // If some blocks became unreachable (e.g., after deleting a decision), remove them
  pruneUnreachable();
}


// ----------------------------------------------------------------
// WIZARD
// ----------------------------------------------------------------
function openWiz(pid, lbl) {
  S.wiz = createInsertWizardState(pid, lbl);

  renderWizardBadge($('step-type-badge'), getWizardBadge(lbl));

  const sibling = findSiblingOpenEnd(pid, lbl);
  const ms = $('merge-suggestion');
  if (sibling) {
    const sibNode = S.nodes[sibling.pid];
    $('merge-hint-text').textContent = getMergeHintText(sibNode?.text, sibling.lbl);
    ms.classList.remove('hidden');
    $('btn-merge-sibling').onclick = () => {
      snap();
      const mid = 'n' + (++S.cnt);
      S.nodes[mid] = { id: mid, type: 'process', text: '\u041f\u0440\u043e\u0434\u043e\u0432\u0436\u0435\u043d\u043d\u044f' };
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
  openWizardPanelUi({
    panel: $('wizard-panel'),
    mascotEl: $('mascot'),
    mascotToggleEl: $('mascot-toggle'),
    focusTarget: S.wiz.step === 'explain' ? $('text-inp') : null,
    activateFocus: activateDialogFocus,
    measure: fn => requestAnimationFrame(fn),
  });
}

function closeWiz() {
  S.wiz = createClosedWizardState();
  closeWizardPanelUi({
    panel: $('wizard-panel'),
    mascotEl: $('mascot'),
    mascotToggleEl: $('mascot-toggle'),
    deactivateFocus: deactivateDialogFocus,
  });
  mascot();
}

function showWizStep(step) {
  showWizardStepUi({
    stepIds: ['step-type', 'step-explain', 'step-existing'],
    currentStep: step,
    getElement: $,
    liveEl: $('wizard-live'),
    liveText: getWizardLiveText(step),
  });
  S.wiz.step = step;
}

function setExplainContent(type) {
  const content = getExplainContentHtml(type, TYPE_META, escHtml);
  $('explain-content').className = content.className;
  $('explain-content').innerHTML = content.html;
}

bindWizardControls({
  typeCards: document.querySelectorAll('.type-card[data-type]'),
  connectExistingButton: $('btn-connect-exist'),
  cancelButton: $('btn-cancel-wiz'),
  backTextButton: $('btn-back-text'),
  backExistingButton: $('btn-back-exist'),
  okButton: $('btn-ok'),
  textInput: $('text-inp'),
  onChooseType: type => {
    S.wiz.type = type;
    if (type === 'end') {
      if (!S.wiz.editId) { snap(); commitNode('\u041a\u0456\u043d\u0435\u0446\u044c'); }
      return;
    }
    const inp = $('text-inp');
    inp.placeholder = PLACEHOLDER[type] || '\u0412\u0432\u0435\u0434\u0456\u0442\u044c \u0442\u0435\u043a\u0441\u0442...' ;
    inp.value = '';
    setExplainContent(type);
    showWizStep('explain');
    setTimeout(() => inp.focus(), 300);
  },
  onOpenExisting: () => {
    const view = buildExistingConnectionView({
      candidates: connectableNodes(S.wiz.pid, S.wiz.plbl),
      ancestorIds: ancestors(S.wiz.pid),
      typeMeta: TYPE_META,
      escHtml,
    });
    renderExistingConnectionView({
      listEl: $('existing-list'),
      emptyEl: $('no-exist-msg'),
      view,
      createElement: tagName => document.createElement(tagName),
      onSelect: id => {
        snap();
        S.edges.push({ from: S.wiz.pid, to: id, label: S.wiz.plbl });
        invalidateEdgeCache();
        closeWiz();
        rerenderFlow(true);
        if (isDone()) setTimeout(confetti, 400);
      },
    });
    showWizStep('existing');
  },
  onCancel: () => closeWiz(),
  onBackText: () => {
    if (S.wiz.editId) {
      closeWiz();
      return;
    }
    showWizStep('type');
  },
  onBackExisting: () => showWizStep('type'),
  onConfirm: () => {
    const raw = $('text-inp').value.trim();
    const textValue = raw || (TYPE_META[S.wiz.type]?.label || '\u0411\u043b\u043e\u043a');
    if (S.wiz.editId) {
      snap();
      S.nodes[S.wiz.editId].text = textValue;
      closeWiz();
      rerenderFlow(false);
    } else {
      snap();
      commitNode(textValue);
    }
  },
  onInputCancel: () => closeWiz(),
});
function commitNode(text) {
  const id = 'n' + (++S.cnt);
  S.nodes[id] = { id, type: S.wiz.type, text };
  S.edges.push({ from: S.wiz.pid, to: id, label: S.wiz.plbl });
  invalidateEdgeCache();
  closeWiz(); rerenderFlow(true);
  const p = S.pos[id];
  if (p) {
    setTimeout(() => area.scrollTo(getNodeFocusScroll({
      position: p,
      scale: _scale,
      viewportWidth: area.clientWidth,
      viewportHeight: area.clientHeight,
    })), 80);
  }
  if (isDone()) setTimeout(confetti, 400);
}

// ----------------------------------------------------------------
// RESET & MODALS
// ----------------------------------------------------------------
bindResetModalControls({
  openButton: $('btn-reset'),
  cancelButton: $('reset-cancel'),
  confirmButton: $('reset-confirm'),
  onOpen: () => openModal('reset-modal'),
  onCancel: () => closeModal('reset-modal'),
  onConfirm: () => {
    closeModal('reset-modal');
    Object.assign(S, createEmptyWorkspaceState());
    invalidateEdgeCache();
    $('btn-undo').disabled = true;
    closeWiz(); hideToolbar(); init();
  },
});
['del-modal', 'reset-modal', 'check-modal'].forEach(id => {
  const modal = $(id);
  if (!modal) return;
  modal.addEventListener('pointerdown', e => { if (e.target === modal) closeModal(id); });
});

function openModal(id) {
  const el = $(id);
  showModalElement(el, activateDialogFocus);
}
function closeModal(id) {
  const el = $(id);
  hideModalElement(el, deactivateDialogFocus);
}

function focusNode(id) {
  const p = S.pos[id];
  if (!p) return;
  hideToolbar();
  area.scrollTo(getNodeFocusScroll({
    position: p,
    scale: _scale,
    viewportWidth: area.clientWidth,
    viewportHeight: area.clientHeight,
  }));
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
    summary.textContent = getCheckSummaryText({ issueCount: 0, errors: errs, warnings: warns });
    const ok = document.createElement('div');
    ok.className = 'check-item ok';
    ok.innerHTML = getCheckSuccessHtml();
    list.appendChild(ok);
    return;
  }

  summary.textContent = getCheckSummaryText({ issueCount: issues.length, errors: errs, warnings: warns });
  for (const it of issues) {
    const row = document.createElement('button');
    const meta = getCheckIssueMeta(it.level);
    row.className = `check-item ${meta.rowClass}` + (it.nodeId ? '' : ' no-node');
    row.type = 'button';
    row.innerHTML = `
      <div class="check-ico">${meta.iconHtml}</div>
      <div class="check-msg">${escHtml(it.msg)}</div>
      ${hasCheckIssueTarget(it) ? '<div class="check-go"><i class="fa-solid fa-location-crosshairs"></i></div>' : ''}
    `;
    bindCheckIssueRow(row, it, {
      onFocusIssue: (nodeId) => {
        closeModal('check-modal');
        focusNode(nodeId);
      },
    });
  }
}

bindCheckModalControls({
  openButton: $('btn-check'),
  closeButton: $('btn-check-close'),
  onOpen: () => {
    render(); // refresh validation state before showing list
    renderCheckModal();
    openModal('check-modal');
  },
  onClose: () => closeModal('check-modal'),
});

// ----------------------------------------------------------------
// EXAMPLES
// ----------------------------------------------------------------
(function buildExamplesUI() {
  const container = $('ex-list');
  EXAMPLES.forEach(ex => {
    const card = createExampleCardButton(document, ex, getExampleCardHtml(ex), () => {
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
  const exampleState = createExampleState(ex);
  applyExampleState(S, exampleState);
  invalidateEdgeCache();
  setTitle(ex.title || '');
  $('btn-undo').disabled = true;
  closeWiz(); hideToolbar();
  rerenderFlow(true);
  if (isDone()) setTimeout(confetti, 400);
  setTimeout(fitToScreen, 100);
  showToast(getExampleLoadedToastText(ex.title));
}

$('btn-examples').addEventListener('click', () => openModal('ex-modal'));
$('btn-ex-close').addEventListener('click', () => closeModal('ex-modal'));
$('ex-modal').addEventListener('pointerdown', e => {
  const modal = $('ex-modal');
  if (isBackdropClick(e.target, modal)) closeModal('ex-modal');
});

// ----------------------------------------------------------------
// SAVE (SVG -> PNG)
// ----------------------------------------------------------------
$('btn-save').addEventListener('click', () => {
  if (!S.root || !Object.keys(S.nodes).length) {
    showToast('\u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u0441\u0442\u0432\u043e\u0440\u0438 \u0431\u043b\u043e\u043a-\u0441\u0445\u0435\u043c\u0443!');
    return;
  }

  // Ask for a title before saving (helps kids not to confuse files)
  $('save-title-inp').value = String(S.title ?? '').trim();
  openModal('save-modal');

  const inp = $('save-title-inp');
  setTimeout(() => { inp.focus(); inp.select(); }, 60);

  const runSave = async () => {
    const titleCheck = validateSaveTitle(inp.value);
    if (!titleCheck.ok) { showToast(titleCheck.message); inp.focus(); return; }
    setTitle(titleCheck.value);
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

  bindSaveModalControls({
    confirmButton: $('save-confirm'),
    cancelButton: $('save-cancel'),
    input: inp,
    onConfirm: runSave,
    onClose: () => closeModal('save-modal'),
  });
});

$('save-modal').addEventListener('pointerdown', e => {
  if (e.target === $('save-modal')) closeModal('save-modal');
});

async function savePng() {
  const title = String(S.title ?? '').trim();
  const bounds = getExportBounds();
  const W = Math.ceil(bounds.maxX - bounds.minX);
  const H = Math.ceil(bounds.maxY - bounds.minY);
  const offsetX = -bounds.minX;
  const offsetY = -bounds.minY;

  try {
    const SCALE = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(W * SCALE));
    canvas.height = Math.max(1, Math.round(H * SCALE));
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(0, 0, W, H);

    const cleanTitle = String(S.title ?? '').trim();
    if (cleanTitle) {
      const topMost = Math.min(...Object.keys(S.nodes).map(id => S.pos[id]?.y - nodeH(id) / 2).filter(Number.isFinite), 88);
      const titleY = Math.max(108, topMost - 132) + offsetY;
      const titleX = CX + offsetX;
      ctx.save();
      ctx.font = '900 30px Nunito, sans-serif';
      const textWidth = ctx.measureText(cleanTitle).width;
      const boxW = Math.max(260, textWidth + 80);
      const boxH = 68;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.18)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      drawRoundedRectPath(ctx, titleX - boxW / 2, titleY - boxH / 2, boxW, boxH, 18);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 30px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cleanTitle, titleX, titleY);
    }

    for (const id of Object.keys(S.nodes)) drawCommentToCanvas(ctx, id, offsetX, offsetY);
    for (const edge of S.edges) drawEdgeToCanvas(ctx, edge, offsetX, offsetY);
    for (const id of Object.keys(S.nodes)) {
      drawNodeShapeToCanvas(ctx, id, offsetX, offsetY);
      const node = S.nodes[id];
      const pos = S.pos[id];
      if (!node || !pos) continue;
      const x = pos.x + offsetX;
      const y = pos.y + offsetY;
      const lines = wrapText(node.text || '...', node.type === 'decision' ? 10 : 16, node.type === 'decision' ? 4 : 3);
      drawCenteredLines(ctx, lines, x, y, 18, '#ffffff', '800 14px Nunito, sans-serif');
      if (node.type !== 'start') {
        const meta = TYPE_META[node.type] || TYPE_META.process;
        const labelX = node.type === 'decision' ? x + DIAMOND_HALF : x + nodeW(id) / 2;
        const labelY = node.type === 'decision' ? y - DIAMOND_HALF - 12 : y - NODE_H / 2 - 10;
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 11px Nunito, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.label, labelX, labelY);
        ctx.restore();
      }
    }

    await downloadCanvasAsPng(canvas, title);
    confetti();
    showToast('\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u0443\u0441\u043f\u0456\u0448\u043d\u043e!');
  } catch (err) {
    console.error(err);
    showToast('\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438. \u0421\u043f\u0440\u043e\u0431\u0443\u0439 \u0437\u043d\u043e\u0432\u0443!');
  }
}

// ----------------------------------------------------------------
// ZOOM  (CSS transform on wrapper)
// ----------------------------------------------------------------
// ----------------------------------------------------------------
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
  const PAD_TOP = 72;
  const PAD_RIGHT = 72;
  const PAD_BOTTOM = 220;
  const PAD_LEFT = 280;
  const cW = area.clientWidth, cH = area.clientHeight;
  const fitW = mxX - mnX + PAD_LEFT + PAD_RIGHT;
  const fitH = mxY - mnY + PAD_TOP + PAD_BOTTOM;
  const sc = Math.min(cW / fitW, cH / fitH, S_MAX);
  _scale = sc;
  wrap.style.transform = `scale(${sc})`;
  wrap.style.transformOrigin = '0 0';
  updateWrapSize();
  area.scrollLeft = (mnX - PAD_LEFT) * sc - (cW - fitW * sc) / 2;
  area.scrollTop = (mnY - PAD_TOP) * sc - (cH - fitH * sc) / 2;
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
  if (shouldIgnoreGlobalKeydown({ textInput: $('text-inp'), activeElement: document.activeElement, activeDialog: _activeDialog })) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); applyZoom(_scale + S_STEP); }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); applyZoom(_scale - S_STEP); }
  if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); fitToScreen(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  if (e.key === 'Escape') {
    closeAllEditorOverlays({ closeWizard: closeWiz, hideToolbar, closeModal });
  }
  if (shouldTriggerDeleteShortcut({ key: e.key, selectionId: S.sel, wizardOpen: S.wiz.open })) $('btn-del-node').click();
});
$('btn-undo').addEventListener('click', undo);

// ----------------------------------------------------------------
// MASCOT
// ----------------------------------------------------------------
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
  if (typeof renderMascotMessage === 'function') renderMascotMessage(el, html);
  else el.innerHTML = html;
}
$('mascot-toggle').addEventListener('click', () => {
  toggleMascotVisibility($('mascot'));
});

// ----------------------------------------------------------------
// PROGRESS BAR
// ----------------------------------------------------------------
function updateProgress() {
  const total = Object.keys(S.nodes).length;
  const pct = getProgressPercent({
    hasRoot: Boolean(S.root),
    nodeCount: total,
    isComplete: isDone(),
  });
  $('prog-fill').style.width = pct + '%';
}

// ----------------------------------------------------------------
// TOAST
// ----------------------------------------------------------------
let _toastT;
function showToast(msg, dur = 2600) {
  const t = $('toast');
  showToastElement(t, msg);
  clearTimeout(_toastT);
  _toastT = setTimeout(() => hideToastElement(t), dur);
}

function reportRuntimeError(context, error) {
  const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(context, error);
  const mascotEl = $('mascot-msg');
  if (mascotEl) {
    mascotEl.innerHTML = getRuntimeErrorMascotHtml(details, escHtml);
  }
  const toastEl = $('toast');
  if (toastEl) showToast(getRuntimeErrorToastText(details), 4200);
}

window.addEventListener('error', event => {
  reportRuntimeError('window-error', event.error || event.message);
});
window.addEventListener('unhandledrejection', event => {
  reportRuntimeError('unhandled-rejection', event.reason);
});

// ----------------------------------------------------------------
// VIRTUAL KEYBOARD
// ----------------------------------------------------------------
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    if (!S.wiz.open) return;
    const availH = window.visualViewport.height;
    $('wizard-panel').style.maxHeight = Math.max(200, availH * 0.82) + 'px';
  });
}

// ----------------------------------------------------------------
// CONFETTI
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
// UTILS
// ----------------------------------------------------------------
const wrapText = createWrapText();


function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ----------------------------------------------------------------
// INIT
// ----------------------------------------------------------------
function init() {
  const id = 'n' + (++S.cnt);
  S.nodes[id] = { id, type: 'start', text: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a' };
  S.root = id;
  setTitle('');
  rerenderFlow(true);
  setTimeout(() => {
    area.scrollLeft = Math.max(0, CX - area.clientWidth / 2);
  }, 60);
}

init();








