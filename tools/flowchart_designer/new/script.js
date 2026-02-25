/* ===== РОЗШИРЕНИЙ РЕДАКТОР БЛОК-СХЕМ — script.js (повна виправлена версія) ===== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ================= DOM =================
  const canvas          = document.getElementById('flowchart-canvas');
  const canvasContainer = document.getElementById('canvas-container');
  const svgLayer        = document.getElementById('connectors-layer');

  const deleteButton = document.getElementById('delete-button');
  const clearButton  = document.getElementById('clear-button');
  const saveButton   = document.getElementById('save-button');
  const undoButton   = document.getElementById('undo-button');

  const textModal     = document.getElementById('text-modal');
  const shapeTextArea = document.getElementById('shape-text');
  const cancelText    = document.getElementById('cancel-text');
  const saveText      = document.getElementById('save-text');

  const helpButton = document.getElementById('help-button');
  const helpPanel  = document.getElementById('help-panel');
  const helpClose  = document.getElementById('help-close');

  // topUndoBtn / topSaveBtn are now the main undo/save buttons — no delegation needed

  const zoomInBtn     = document.getElementById('zoom-in');
  const zoomOutBtn    = document.getElementById('zoom-out');
  const zoomResetBtn  = document.getElementById('zoom-reset');
  const zoomLevelText = document.getElementById('zoom-level');

  const connectionModal  = document.getElementById('connection-modal');
  const connectionYesBtn = document.getElementById('connection-yes');
  const connectionNoBtn  = document.getElementById('connection-no');
  const cancelConnBtn    = document.getElementById('cancel-connection');

  const connectionBar = document.getElementById('connection-bar');
  const deleteConnBtn = document.getElementById('delete-conn-btn');

  const titleInput   = document.getElementById('diagram-title-input');
  const titleDisplay = document.getElementById('diagram-title-display');

  if (!canvas || !canvasContainer || !svgLayer) {
    console.error('Flowchart editor: required DOM nodes are missing.');
    return;
  }

  // ================= STATE =================
  const DEFAULT_BASE_COLORS = {
    'start-end':    '#4caf50',
    'process':      '#03a9f4',
    'decision':     '#ff9800',
    'input-output': '#3f51b5',
  };

  const state = {
    shapes: [],           // {id,type,color,textRaw}
    connections: [],      // {id,from,to,type}
    selectedShape: null,
    selectedConnId: null,

    baseColors: { ...DEFAULT_BASE_COLORS },
    currentColor: '#3f51b5',
    lastShapeType: 'process',

    diagramTitle: '',

    shapeCounter: 0,

    // Zoom
    scale: 1,
    minScale: 0.2,
    maxScale: 3.5,
    scaleStep: 0.1,

    // Drag states
    activeShape: null,
    dragState: null,
    connDrag: null,
    pendingConn: null,

    // Undo
    undoStack: [],
    MAX_UNDO: 30,

    // schedulers
    _titleRaf: 0,
    _refreshRaf: 0,
  };

  // ================= UNDO SNAPSHOTS =================
  function saveSnapshot() {
    const shapeSnap = state.shapes.map(s => {
      const el = document.getElementById(s.id);
      return {
        id: s.id,
        type: s.type,
        color: s.color,
        textRaw: s.textRaw,
        left: el ? el.offsetLeft : 0,
        top:  el ? el.offsetTop  : 0,
      };
    });
    const connSnap = state.connections.map(c => ({ ...c }));

    state.undoStack.push({
      shapes: shapeSnap,
      connections: connSnap,
      baseColors: { ...state.baseColors },
      diagramTitle: state.diagramTitle,
      shapeCounter: state.shapeCounter,
      lastShapeType: state.lastShapeType,
    });
    if (state.undoStack.length > state.MAX_UNDO) state.undoStack.shift();
    if (undoButton) undoButton.disabled = false;
  }

  function restoreSnapshot(snap) {
    // remove shapes
    state.shapes.forEach(s => {
      document.getElementById(s.id)?.remove();
      removeHandleGroup(s.id);
    });
    // remove connections
    state.connections.forEach(c => removeConnectionDom(c.id));

    state.shapes = [];
    state.connections = [];
    state.selectedShape = null;
    state.selectedConnId = null;

    state.baseColors = { ...DEFAULT_BASE_COLORS, ...(snap.baseColors || {}) };
    state.diagramTitle = snap.diagramTitle || '';
    state.shapeCounter = snap.shapeCounter || 0;
    state.lastShapeType = snap.lastShapeType || 'process';

    if (titleInput) titleInput.value = state.diagramTitle;
    renderTitle();

    (snap.shapes || []).forEach(s => {
      createShape(s.type, s.color, s.textRaw, s.left, s.top, s.id, true);
      const num = parseInt((s.id || '').split('-')[1], 10);
      if (!Number.isNaN(num)) state.shapeCounter = Math.max(state.shapeCounter, num);
    });

    setTimeout(() => {
      (snap.connections || []).forEach(c => {
        const fromEl = document.getElementById(c.from);
        const toEl   = document.getElementById(c.to);
        if (fromEl && toEl) connectShapes(fromEl, toEl, c.type || null, c.id, true);
      });
      scheduleRefresh();
      updateConnectionBar();
      syncColorPickerToCurrent();
    }, 20);

    if (undoButton) undoButton.disabled = state.undoStack.length === 0;
  }

  function undo() {
    if (state.undoStack.length === 0) return;
    const snap = state.undoStack.pop();
    restoreSnapshot(snap);
  }

  if (undoButton) {
    undoButton.disabled = true;
    undoButton.addEventListener('click', undo);
  }


  function openModal(modal)  { modal?.classList.add('active'); }
  function closeModal(modal) { modal?.classList.remove('active'); }

  function showMessageModal(text) {
    const modal = document.getElementById('message-modal');
    const textEl = document.getElementById('message-modal-text');
    const btns = document.getElementById('message-modal-buttons');
    if (!modal || !textEl || !btns) return;

    textEl.textContent = text;
    btns.innerHTML = '';
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.className = 'modal-btn ok-btn';
    ok.onclick = () => closeModal(modal);
    btns.appendChild(ok);
    openModal(modal);
    setTimeout(() => ok.focus(), 30);
  }

  function showConfirmModal(text, onOk) {
    const modal = document.getElementById('message-modal');
    const textEl = document.getElementById('message-modal-text');
    const btns = document.getElementById('message-modal-buttons');
    if (!modal || !textEl || !btns) return;

    textEl.textContent = text;
    btns.innerHTML = '';

    const cancel = document.createElement('button');
    cancel.textContent = 'Скасувати';
    cancel.className = 'modal-btn cancel-btn';
    cancel.onclick = () => closeModal(modal);

    const ok = document.createElement('button');
    ok.textContent = 'Так';
    ok.className = 'modal-btn';
    ok.style.cssText = 'background:#f44336;color:white;';
    ok.onclick = () => { closeModal(modal); onOk?.(); };

    btns.appendChild(cancel);
    btns.appendChild(ok);
    openModal(modal);
    setTimeout(() => cancel.focus(), 30);
  }

  // Close modals by click on backdrop
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('pointerdown', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#ffffff';
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/\d+/g);
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2,'0')).join('');
    }
    return '#ffffff';
  }

  function sanitizeFilename(name) {
    const base = (name || '').trim() || 'блок-схема';
    const safe = base
      .replace(/[\\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    return safe || 'блок-схема';
  }

  // ================= TITLE =================
  function findStartElement() {
    const startShape = state.shapes.find(s => s.type === 'start-end' && (s.textRaw || '').trim().toLowerCase() === 'початок');
    return startShape ? document.getElementById(startShape.id) : null;
  }

  function renderTitle() {
    if (!titleDisplay) return;
    const t = (state.diagramTitle || '').trim();
    if (!t) {
      titleDisplay.style.display = 'none';
      titleDisplay.textContent = '';
      return;
    }
    titleDisplay.textContent = t;
    scheduleTitleUpdate();
  }

  function updateTitlePosition() {
    state._titleRaf = 0;
    if (!titleDisplay) return;
    const startEl = findStartElement();
    const titleText = (state.diagramTitle || '').trim();
    if (!startEl || !titleText) {
      titleDisplay.style.display = 'none';
      return;
    }
    const left = startEl.offsetLeft + startEl.offsetWidth / 2;
    const top = startEl.offsetTop - 20 - (titleDisplay.offsetHeight || 48);
    titleDisplay.style.left = left + 'px';
    titleDisplay.style.top = top + 'px';
    titleDisplay.style.display = '';
  }

  function scheduleTitleUpdate() {
    if (state._titleRaf) return;
    state._titleRaf = requestAnimationFrame(updateTitlePosition);
  }

  titleInput?.addEventListener('input', () => {
    state.diagramTitle = titleInput.value;
    renderTitle();
  });

  // ================= TEXT WRAP =================
  function smartWrapText(raw, type) {
    const text = (raw || '').trim();
    if (!text) return '';
    const maxChars = (type === 'decision') ? 12 : (type === 'start-end') ? 16 : (type === 'input-output') ? 18 : 18;
    const maxLines = (type === 'decision') ? 4 : 4;

    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';

    function pushLine(l) { if (l) lines.push(l); }

    function splitLongWord(word) {
      const parts = [];
      let w = word;
      while (w.length > maxChars) {
        let cut = maxChars - 1; // reserve for hyphen
        if (w.length - cut < 3) cut = w.length - 3;
        if (cut < 3) break;
        parts.push(w.slice(0, cut) + '-');
        w = w.slice(cut);
      }
      parts.push(w);
      return parts;
    }

    for (const w of words) {
      const chunks = (w.length > maxChars) ? splitLongWord(w) : [w];
      for (const chunk of chunks) {
        if (!line) line = chunk;
        else if ((line.length + 1 + chunk.length) <= maxChars) line += ' ' + chunk;
        else { pushLine(line); line = chunk; }
        if (lines.length >= maxLines) break;
      }
      if (lines.length >= maxLines) break;
    }
    pushLine(line);

    if (lines.length > maxLines) lines.length = maxLines;
    const used = lines.join(' ').replace(/-/g, '');
    if (used.length < text.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*…?$/, '') + '…';
    return lines.join('\n');
  }

  function hasStartBlock() {
    return state.shapes.some(s => s.type === 'start-end' && (s.textRaw || '').trim().toLowerCase() === 'початок');
  }

  function getDefaultText(type) {
    switch (type) {
      case 'start-end':    return hasStartBlock() ? 'Кінець' : 'Початок';
      case 'process':      return 'Дія';
      case 'decision':     return 'Умова?';
      case 'input-output': return 'Ввід / Вивід';
      default:             return '';
    }
  }

  function getBaseColor(type) {
    return state.baseColors[type] || DEFAULT_BASE_COLORS[type] || '#3f51b5';
  }

  function setShapeText(shapeEl, raw) {
    const s = state.shapes.find(x => x.id === shapeEl.id);
    const rawText = (raw || '').trim();
    if (s) s.textRaw = rawText;
    const type = s?.type || (shapeEl.classList.contains('decision') ? 'decision' : 'process');
    const content = shapeEl.querySelector('.content');
    const defaultText = getDefaultText(type);
    if (content) content.textContent = smartWrapText(rawText || defaultText, type);
    shapeEl.setAttribute('aria-label', `Фігура: ${rawText || defaultText}`);
  }

  // ================= COORDINATES =================
  function clientToCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / state.scale, y: (clientY - r.top) / state.scale };
  }

  // ================= HANDLES (SVG) =================
  const shapeHandleGroups = {};

  const DECISION_HANDLE_OUTSET = 8; // px: handles sit slightly outside the diamond
  const DECISION_CONN_OUTSET   = 2; // px: arrow endpoint slightly outside the diamond border

  function decisionVertexDistance(shapeEl) {
    // .decision uses transform: rotate(45deg); offsetWidth is pre-transform.
    // For a rotated square, vertex distance along axis is width / sqrt(2).
    return (shapeEl.offsetWidth || 0) / Math.SQRT2;
  }

  function getHandlePositions(shapeEl) {
    const cx = shapeEl.offsetLeft + shapeEl.offsetWidth / 2;
    const cy = shapeEl.offsetTop + shapeEl.offsetHeight / 2;

    if (shapeEl.classList.contains('decision')) {
      const d = decisionVertexDistance(shapeEl);
      const o = DECISION_HANDLE_OUTSET;
      return {
        top:    { x: cx,         y: cy - d - o },
        right:  { x: cx + d + o, y: cy         },
        bottom: { x: cx,         y: cy + d + o },
        left:   { x: cx - d - o, y: cy         },
      };
    }

    const hw = shapeEl.offsetWidth / 2;
    const hh = shapeEl.offsetHeight / 2;
    return {
      top:    { x: cx,      y: cy - hh },
      right:  { x: cx + hw, y: cy      },
      bottom: { x: cx,      y: cy + hh },
      left:   { x: cx - hw, y: cy      },
    };
  }

  function getConnectionPoint(shapeEl, toX, toY) {
    const cx = shapeEl.offsetLeft + shapeEl.offsetWidth / 2;
    const cy = shapeEl.offsetTop + shapeEl.offsetHeight / 2;
    const dx = toX - cx;
    const dy = toY - cy;

    if (shapeEl.classList.contains('decision')) {
      // Intersection of ray (center -> target) with diamond boundary |x| + |y| = d
      const d = decisionVertexDistance(shapeEl) + DECISION_CONN_OUTSET;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      const denom = (adx + ady) || 1;
      const t = d / denom;
      return { x: cx + dx * t, y: cy + dy * t };
    }

    const hw = shapeEl.offsetWidth / 2;
    const hh = shapeEl.offsetHeight / 2;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };

    const sx = hw / (Math.abs(dx) || 0.001);
    const sy = hh / (Math.abs(dy) || 0.001);
    const s  = Math.min(sx, sy);
    return { x: cx + dx * s, y: cy + dy * s };
  }

  function findShapeAt(x, y, excludeId) {
    for (let i = state.shapes.length - 1; i >= 0; i--) {
      const s = state.shapes[i];
      if (s.id === excludeId) continue;
      const el = document.getElementById(s.id);
      if (!el) continue;
      const cx = el.offsetLeft + el.offsetWidth / 2;
      const cy = el.offsetTop + el.offsetHeight / 2;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      if (s.type === 'decision') {
        const d = decisionVertexDistance(el);
        // Diamond hit test: |dx| + |dy| <= d (with small margin)
        if ((dx + dy) <= (d + 14)) return el;
      } else {
        if (dx <= el.offsetWidth / 2 + 10 && dy <= el.offsetHeight / 2 + 10) return el;
      }
    }
    return null;
  }

  function createHandleGroup(shapeEl) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.dataset.shapeId = shapeEl.id;
    ['top','right','bottom','left'].forEach(pos => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '10');
      c.setAttribute('fill', 'white');
      c.setAttribute('stroke', '#4361ee');
      c.setAttribute('stroke-width', '3');
      c.classList.add('conn-handle');
      c.dataset.shapeId = shapeEl.id;
      c.dataset.pos = pos;
      g.appendChild(c);
    });
    svgLayer.appendChild(g);
    shapeHandleGroups[shapeEl.id] = g;
    updateHandleGroup(shapeEl.id);
    attachHandleListeners(shapeEl.id);
    return g;
  }

  function updateHandleGroup(shapeId) {
    const el = document.getElementById(shapeId);
    const g  = shapeHandleGroups[shapeId];
    if (!el || !g) return;
    const pts = getHandlePositions(el);
    const circles = g.querySelectorAll('circle');
    ['top','right','bottom','left'].forEach((pos, i) => {
      circles[i].setAttribute('cx', pts[pos].x);
      circles[i].setAttribute('cy', pts[pos].y);
    });
  }

  function showHandlesForShape(shapeId) {
    Object.values(shapeHandleGroups).forEach(g => g.querySelectorAll('circle').forEach(c => c.classList.remove('visible')));
    const g = shapeHandleGroups[shapeId];
    if (g) g.querySelectorAll('circle').forEach(c => c.classList.add('visible'));
  }

  function hideAllHandles() {
    Object.values(shapeHandleGroups).forEach(g => g.querySelectorAll('circle').forEach(c => c.classList.remove('visible')));
  }

  function removeHandleGroup(shapeId) {
    const g = shapeHandleGroups[shapeId];
    if (g) { g.remove(); delete shapeHandleGroups[shapeId]; }
  }

  // ================= TEMP LINE (during connect drag) =================
  const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  tempLine.setAttribute('stroke', '#4361ee');
  tempLine.setAttribute('stroke-width', '2.5');
  tempLine.setAttribute('stroke-dasharray', '8 5');
  tempLine.setAttribute('marker-end', 'url(#arrowhead)');
  tempLine.style.display = 'none';
  tempLine.style.pointerEvents = 'none';
  svgLayer.appendChild(tempLine);

  function onHandlePointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    const shapeId = this.dataset.shapeId;
    const pos = this.dataset.pos;
    const shapeEl = document.getElementById(shapeId);
    if (!shapeEl) return;

    const pts = getHandlePositions(shapeEl);
    const startPt = pts[pos];

    tempLine.setAttribute('x1', startPt.x);
    tempLine.setAttribute('y1', startPt.y);
    tempLine.setAttribute('x2', startPt.x);
    tempLine.setAttribute('y2', startPt.y);
    tempLine.style.display = '';
    state.connDrag = { fromShapeId: shapeId };

    this.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      const pt = clientToCanvas(ev.clientX, ev.clientY);
      tempLine.setAttribute('x2', pt.x);
      tempLine.setAttribute('y2', pt.y);
    };

    const onUp = (ev) => {
      this.removeEventListener('pointermove', onMove);
      this.removeEventListener('pointerup', onUp);
      this.removeEventListener('pointercancel', onUp);
      tempLine.style.display = 'none';

      if (!state.connDrag) return;
      const fromId = state.connDrag.fromShapeId;
      state.connDrag = null;

      const pt = clientToCanvas(ev.clientX, ev.clientY);
      const targetEl = findShapeAt(pt.x, pt.y, fromId);
      if (!targetEl) return;
      if (targetEl.id === fromId) return;

      const fromEl = document.getElementById(fromId);
      const fromData = state.shapes.find(s => s.id === fromId);

      if (fromData?.type === 'decision') {
        state.pendingConn = { fromEl, toEl: targetEl };
        openModal(connectionModal);
      } else {
        saveSnapshot();
        connectShapes(fromEl, targetEl, null);
      }
    };

    this.addEventListener('pointermove', onMove);
    this.addEventListener('pointerup', onUp);
    this.addEventListener('pointercancel', onUp);
  }

  function attachHandleListeners(shapeId) {
    const g = shapeHandleGroups[shapeId];
    if (!g) return;
    g.querySelectorAll('circle').forEach(c => c.addEventListener('pointerdown', onHandlePointerDown));
  }

  // ================= CONNECTIONS (orthogonal) =================
  function polylineLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      len += Math.hypot(dx, dy);
    }
    return len;
  }

  function pointAlongPolyline(points, t) {
    const total = polylineLength(points);
    if (total <= 0) return points[0] || {x:0,y:0};
    const target = total * t;
    let acc = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i-1], b = points[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (acc + seg >= target) {
        const r = (target - acc) / (seg || 1);
        return { x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r };
      }
      acc += seg;
    }
    return points[points.length - 1];
  }

  // Returns the 4 cardinal connector points for a shape (center of each edge)
  function getEdgePoints(el) {
    const cx = el.offsetLeft + el.offsetWidth  / 2;
    const cy = el.offsetTop  + el.offsetHeight / 2;
    const hw = el.offsetWidth  / 2;
    const hh = el.offsetHeight / 2;
    return {
      top:    { x: cx,      y: cy - hh, side: 'top'    },
      bottom: { x: cx,      y: cy + hh, side: 'bottom' },
      left:   { x: cx - hw, y: cy,      side: 'left'   },
      right:  { x: cx + hw, y: cy,      side: 'right'  },
    };
  }

  // Build a clean 2-turn orthogonal path from one edge-midpoint to another.
  // exitSide / entrySide tell us the direction so we know how to bridge them.
  function orthogonalPath(fromPt, toPt, exitSide, entrySide) {
    const pts = [fromPt];
    const dx = toPt.x - fromPt.x;
    const dy = toPt.y - fromPt.y;

    // Same side exits/entries that form an L naturally:
    // bottom→top or top→bottom: vertical first then horizontal if needed
    if ((exitSide === 'bottom' && entrySide === 'top') ||
        (exitSide === 'top'    && entrySide === 'bottom')) {
      if (Math.abs(dx) < 2) {
        // Already aligned — straight vertical
        pts.push(toPt);
      } else {
        const yMid = fromPt.y + dy / 2;
        pts.push({ x: fromPt.x, y: yMid });
        pts.push({ x: toPt.x,   y: yMid });
        pts.push(toPt);
      }
      return pts;
    }

    if ((exitSide === 'right' && entrySide === 'left') ||
        (exitSide === 'left'  && entrySide === 'right')) {
      if (Math.abs(dy) < 2) {
        pts.push(toPt);
      } else {
        const xMid = fromPt.x + dx / 2;
        pts.push({ x: xMid, y: fromPt.y });
        pts.push({ x: xMid, y: toPt.y   });
        pts.push(toPt);
      }
      return pts;
    }

    // L-shaped connections (e.g. bottom→left, right→top, etc.)
    // Determine the bend corner based on exit direction
    if (exitSide === 'bottom' || exitSide === 'top') {
      // Go vertical first, then horizontal
      pts.push({ x: fromPt.x, y: toPt.y });
    } else {
      // Go horizontal first, then vertical
      pts.push({ x: toPt.x, y: fromPt.y });
    }
    pts.push(toPt);
    return pts;
  }

  // Choose the best exit/entry side pair given two shapes.
  // Rules: prefer bottom→top for vertical flow, left/right for horizontal.
  function chooseSides(fromEl, toEl) {
    const fcx = fromEl.offsetLeft + fromEl.offsetWidth  / 2;
    const fcy = fromEl.offsetTop  + fromEl.offsetHeight / 2;
    const tcx = toEl.offsetLeft   + toEl.offsetWidth    / 2;
    const tcy = toEl.offsetTop    + toEl.offsetHeight   / 2;
    const dx  = tcx - fcx;
    const dy  = tcy - fcy;

    const fhw = fromEl.offsetWidth  / 2;
    const fhh = fromEl.offsetHeight / 2;
    const thw = toEl.offsetWidth    / 2;
    const thh = toEl.offsetHeight   / 2;

    // Gaps between edges (negative = overlapping)
    const gapRight  = dx - fhw - thw;   // from.right → to.left
    const gapLeft   = -dx - fhw - thw;  // from.left  → to.right
    const gapBottom = dy - fhh - thh;   // from.bottom→ to.top
    const gapTop    = -dy - fhh - thh;  // from.top   → to.bottom

    // Primary axis: whichever has the bigger gap wins
    const hGap = Math.max(gapRight,  gapLeft);
    const vGap = Math.max(gapBottom, gapTop);

    if (vGap >= hGap) {
      // Vertical primary
      if (dy >= 0) return { exit: 'bottom', entry: 'top'    };
      else         return { exit: 'top',    entry: 'bottom' };
    } else {
      // Horizontal primary
      if (dx >= 0) return { exit: 'right', entry: 'left'  };
      else         return { exit: 'left',  entry: 'right' };
    }
  }

  function elbowPoints(fromEl_or_pt, toEl_or_pt_or_ignored) {
    // Legacy fallback — now replaced by computeConnectionGeometry calling routeOrthogonal
    // Only used if called with raw points (shouldn't happen after refactor)
    const fromPt = fromEl_or_pt;
    const toPt   = toEl_or_pt_or_ignored;
    const pts = [{ ...fromPt }];
    const dx = toPt.x - fromPt.x;
    const dy = toPt.y - fromPt.y;
    if (Math.abs(dy) < 2) { pts.push({ ...toPt }); return pts; }
    const yMid = fromPt.y + dy / 2;
    pts.push({ x: fromPt.x, y: yMid });
    pts.push({ x: toPt.x,   y: yMid });
    pts.push({ ...toPt });
    return pts;
  }

  function routeOrthogonal(fromEl, toEl) {
    const { exit, entry } = chooseSides(fromEl, toEl);
    const fromEdges = getEdgePoints(fromEl);
    const toEdges   = getEdgePoints(toEl);
    const fromPt = fromEdges[exit];
    const toPt   = toEdges[entry];
    return orthogonalPath(fromPt, toPt, exit, entry);
  }

  function pointsToPathD(points) {
    if (!points.length) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
    return d;
  }

  function computeDecisionConnection(fromEl, toEl, side) {
    // Clean orthogonal routing for Yes (LEFT exit) / No (RIGHT exit) from decision block
    const d = decisionVertexDistance(fromEl) + DECISION_CONN_OUTSET;
    const cx = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const cy = fromEl.offsetTop  + fromEl.offsetHeight / 2;
    const toCx = toEl.offsetLeft   + toEl.offsetWidth  / 2;
    const toCy = toEl.offsetTop    + toEl.offsetHeight / 2;

    // Exit point: exact left or right diamond vertex
    const fromPt = side === 'right'
      ? { x: cx + d, y: cy }
      : { x: cx - d, y: cy };

    const hwTo = toEl.offsetWidth  / 2;
    const hhTo = toEl.offsetHeight / 2;

    const hDist = side === 'right' ? toCx - cx : cx - toCx;
    const vDist = toCy - cy; // positive = below

    // Entry point logic:
    // If target is at nearly the same vertical level (±30px) AND in the correct horizontal direction → enter from side
    // Otherwise always enter from top-center (standard flowchart convention)
    let toPt;
    if (Math.abs(vDist) < 30 && hDist > 20) {
      // Same row: enter from the near horizontal edge
      toPt = side === 'right'
        ? { x: toCx - hwTo, y: toCy }
        : { x: toCx + hwTo, y: toCy };
    } else {
      // Any vertical offset → always enter from top-center
      toPt = { x: toCx, y: toCy - hhTo };
    }

    const MARGIN = 40;
    let pts;

    if (Math.abs(toPt.y - fromPt.y) < 4) {
      // Perfectly horizontal — straight line
      pts = [fromPt, toPt];
    } else if (
      (side === 'right' && toPt.x > fromPt.x + 4) ||
      (side === 'left'  && toPt.x < fromPt.x - 4)
    ) {
      // Target is in the correct side direction — simple L: horizontal then vertical
      pts = [fromPt, { x: toPt.x, y: fromPt.y }, toPt];
    } else {
      // Target is behind the exit direction (e.g. looping back) — Z-shape with margin
      const xOut = side === 'right' ? fromPt.x + MARGIN : fromPt.x - MARGIN;
      pts = [fromPt, { x: xOut, y: fromPt.y }, { x: xOut, y: toPt.y }, toPt];
    }

    return { d: pointsToPathD(pts), pts };
  }

  function computeConnectionGeometry(fromEl, toEl, connType) {
    const fromData = state.shapes.find(s => s.id === fromEl.id);

    // Special clean routing for decision Yes/No
    // Standard convention: Так (Yes) exits LEFT, Ні (No) exits RIGHT
    if (fromData?.type === 'decision') {
      if (connType === 'yes') return computeDecisionConnection(fromEl, toEl, 'left');
      if (connType === 'no')  return computeDecisionConnection(fromEl, toEl, 'right');
    }

    const pts = routeOrthogonal(fromEl, toEl);
    const d = pointsToPathD(pts);
    return { d, pts };
  }

  function removeConnectionDom(connId) {
    document.getElementById(connId)?.remove();
    document.getElementById(`label-${connId}`)?.remove();
    document.getElementById(`hit-${connId}`)?.remove();
  }

  function updateConnection(connId) {
    const conn = state.connections.find(c => c.id === connId);
    const path = document.getElementById(connId);
    const hit  = document.getElementById(`hit-${connId}`);
    if (!conn || !path) return;
    const fromEl = document.getElementById(conn.from);
    const toEl   = document.getElementById(conn.to);
    if (!fromEl || !toEl) return;
    const geo = computeConnectionGeometry(fromEl, toEl, conn.type);
    path.setAttribute('d', geo.d);
    hit?.setAttribute('d', geo.d);
    if (conn.type) updateConnectionLabel(connId, geo.pts);
  }

  function updateConnectionsForShape(shapeId) {
    state.connections.forEach(conn => {
      if (conn.from === shapeId || conn.to === shapeId) updateConnection(conn.id);
    });
  }

  function connectShapes(fromEl, toEl, connType, forcedId, isRestore = false) {
    connType = connType || null;
    if (!fromEl || !toEl) return null;
    if (fromEl.id === toEl.id) return null;

    const connId = forcedId || (connType
      ? `conn-${fromEl.id}-${toEl.id}-${connType}`
      : `conn-${fromEl.id}-${toEl.id}`);

    if (!isRestore && state.connections.some(c => c.id === connId)) {
      showMessageModal('Ці фігури вже з\'єднані!');
      return null;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = connId;
    path.classList.add('conn-line');
    path.setAttribute('fill', 'none');

    if (connType === 'yes') {
      path.setAttribute('stroke', '#4caf50');
      path.setAttribute('stroke-width', '2.8');
      path.setAttribute('marker-end', 'url(#arrowhead-yes)');
    } else if (connType === 'no') {
      path.setAttribute('stroke', '#f44336');
      path.setAttribute('stroke-width', '2.8');
      path.setAttribute('marker-end', 'url(#arrowhead-no)');
    } else {
      path.setAttribute('stroke', '#555');
      path.setAttribute('stroke-width', '2.8');
      path.setAttribute('marker-end', 'url(#arrowhead)');
    }
    path.style.pointerEvents = 'none';

    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.id = `hit-${connId}`;
    hitPath.classList.add('conn-hit');
    hitPath.dataset.connId = connId;

    const firstG = svgLayer.querySelector('g[data-shape-id]') || svgLayer.lastChild;
    svgLayer.insertBefore(path, firstG);
    svgLayer.insertBefore(hitPath, firstG);

    hitPath.addEventListener('pointerdown', (e) => {
      if (state.connDrag) return;
      e.stopPropagation();
      selectConnection(connId);
    });

    if (!state.connections.find(c => c.id === connId)) {
      state.connections.push({ id: connId, from: fromEl.id, to: toEl.id, type: connType });
    }

    updateConnection(connId);
    if (connType && !document.getElementById(`label-${connId}`)) addConnectionLabel(connId, connType);
    return path;
  }

  function addConnectionLabel(connId, labelType) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = `label-${connId}`;
    g.style.pointerEvents = 'none';

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('rx', '11');
    bg.setAttribute('ry', '11');
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', labelType === 'yes' ? '#4caf50' : '#f44336');
    bg.setAttribute('stroke-width', '2');

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('fill', labelType === 'yes' ? '#2e7d32' : '#c62828');
    txt.setAttribute('font-family', "'Nunito', Arial, sans-serif");
    txt.setAttribute('font-size', '14px');
    txt.setAttribute('font-weight', '900');
    txt.textContent = labelType === 'yes' ? 'Так' : 'Ні';

    g.appendChild(bg);
    g.appendChild(txt);

    const firstHandleG = svgLayer.querySelector('g[data-shape-id]');
    svgLayer.insertBefore(g, firstHandleG);
    updateConnectionLabel(connId);
  }

  function updateConnectionLabel(connId, ptsOverride) {
    const labelGroup = document.getElementById(`label-${connId}`);
    const conn = state.connections.find(c => c.id === connId);
    const path = document.getElementById(connId);
    if (!labelGroup || !conn || !path) return;

    let pts = ptsOverride;
    if (!pts) {
      const fromEl = document.getElementById(conn.from);
      const toEl   = document.getElementById(conn.to);
      if (!fromEl || !toEl) return;
      pts = computeConnectionGeometry(fromEl, toEl, conn.type).pts;
    }

    const t = (conn.type === 'yes' || conn.type === 'no') ? 0.28 : 0.5;
    const p = pointAlongPolyline(pts, t);
    const txt = labelGroup.querySelector('text');
    const bg  = labelGroup.querySelector('rect');
    txt.setAttribute('x', p.x);
    txt.setAttribute('y', p.y);
    try {
      const bbox = txt.getBBox();
      const pad = 7;
      bg.setAttribute('x', bbox.x - pad);
      bg.setAttribute('y', bbox.y - pad);
      bg.setAttribute('width', bbox.width + pad * 2);
      bg.setAttribute('height', bbox.height + pad * 2);
    } catch (_) {}
  }

  // ================= SELECT CONNECTION =================
  function clearConnectionSelection(updateBar = true) {
    if (state.selectedConnId) {
      const path = document.getElementById(state.selectedConnId);
      if (path) {
        path.setAttribute('stroke', path._origStroke || '#555');
        path.setAttribute('stroke-width', '2.8');
        path.removeAttribute('stroke-dasharray');
        path.setAttribute('marker-end', path._origMarker || 'url(#arrowhead)');
      }
    }
    state.selectedConnId = null;
    if (updateBar) updateConnectionBar();
  }

  function selectConnection(connId) {
    deselectAll(false);
    hideAllHandles();
    if (state.selectedConnId === connId) {
      clearConnectionSelection();
      return;
    }
    clearConnectionSelection(false);
    state.selectedConnId = connId;
    const path = document.getElementById(connId);
    if (path) {
      path._origStroke = path.getAttribute('stroke');
      path._origMarker = path.getAttribute('marker-end');
      path.setAttribute('stroke', '#e91e63');
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('stroke-dasharray', '9 4');
      path.setAttribute('marker-end', 'url(#arrowhead-selected)');
    }
    updateConnectionBar();
  }

  function updateConnectionBar() {
    if (!connectionBar) return;
    if (state.selectedConnId) connectionBar.classList.remove('hidden');
    else connectionBar.classList.add('hidden');
  }

  function deleteConnection(connId) {
    const conn = state.connections.find(c => c.id === connId);
    if (!conn) return;
    saveSnapshot();
    removeConnectionDom(connId);
    state.connections = state.connections.filter(c => c.id !== connId);
    clearConnectionSelection();
  }

  deleteConnBtn?.addEventListener('click', () => {
    if (state.selectedConnId) deleteConnection(state.selectedConnId);
  });

  // ================= SHAPES =================
  function createShape(type, color, textRaw, posLeft, posTop, forcedId, isRestore = false) {
    if (!forcedId) state.shapeCounter++;
    const shapeId = forcedId || `shape-${state.shapeCounter}`;
    if (forcedId && document.getElementById(forcedId)) return document.getElementById(forcedId);

    const usedColor = color || getBaseColor(type);
    const raw = (textRaw !== undefined && textRaw !== null) ? String(textRaw) : getDefaultText(type);

    const shape = document.createElement('div');
    shape.id = shapeId;
    shape.className = `shape ${type}`;
    shape.setAttribute('role', 'button');
    shape.setAttribute('tabindex', '0');
    shape.style.backgroundColor = usedColor;

    const containerRect = canvasContainer.getBoundingClientRect();
    const defaultLeft = (canvasContainer.scrollLeft + containerRect.width / 2) / state.scale - 75;
    const defaultTop  = (canvasContainer.scrollTop  + containerRect.height / 3) / state.scale - 30;

    shape.style.left = (posLeft !== undefined ? posLeft : Math.max(20, defaultLeft)) + 'px';
    shape.style.top  = (posTop  !== undefined ? posTop  : Math.max(20, defaultTop))  + 'px';

    const content = document.createElement('div');
    content.className = 'content';
    shape.appendChild(content);
    canvas.appendChild(shape);

    if (!state.shapes.find(s => s.id === shapeId)) {
      state.shapes.push({ id: shapeId, type, color: usedColor, textRaw: raw });
    }

    setShapeText(shape, raw);

    if (!isRestore) {
      shape.classList.add('new-pop');
      setTimeout(() => shape.classList.remove('new-pop'), 350);
    }

    shape.addEventListener('pointerdown', onShapePointerDown);

    shape.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openTextModal(shape);
    });

    // long-press edit (touch)
    let longPressTimer = null;
    shape.addEventListener('pointerdown', () => {
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        openTextModal(shape);
      }, 650);
    });
    const cancelLP = () => { if (longPressTimer) clearTimeout(longPressTimer); longPressTimer = null; };
    shape.addEventListener('pointerup', cancelLP);
    shape.addEventListener('pointercancel', cancelLP);
    shape.addEventListener('pointermove', cancelLP);

    shape.addEventListener('click', (e) => {
      e.stopPropagation();
      clearConnectionSelection();
      selectShape(shape);
    });

    shape.addEventListener('pointerenter', () => {
      if (!state.connDrag) showHandlesForShape(shape.id);
    });
    shape.addEventListener('pointerleave', () => {
      if (!state.connDrag) {
        if (state.selectedShape && state.selectedShape !== shape) showHandlesForShape(state.selectedShape.id);
        else if (!state.selectedShape) hideAllHandles();
      }
    });

    shape.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTextModal(shape); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
    });

    createHandleGroup(shape);
    scheduleRefresh();
    return shape;
  }

  function openTextModal(shapeEl) {
    state.activeShape = shapeEl;
    const s = state.shapes.find(x => x.id === shapeEl.id);
    if (shapeTextArea) shapeTextArea.value = (s?.textRaw || '').trim();
    openModal(textModal);
    setTimeout(() => shapeTextArea?.focus(), 50);
  }

  function selectShape(el) {
    clearConnectionSelection(false);
    if (state.selectedShape && state.selectedShape !== el) state.selectedShape.classList.remove('selected');
    state.selectedShape = el;
    el.classList.add('selected');
    el.setAttribute('aria-selected', 'true');
    showHandlesForShape(el.id);

    const hex = rgbToHex(el.style.backgroundColor);
    state.currentColor = hex;
    syncColorPickerToCurrent(hex);
    updateConnectionBar();
  }

  function deselectAll(updateBar = true) {
    if (state.selectedShape) {
      state.selectedShape.classList.remove('selected');
      state.selectedShape.setAttribute('aria-selected', 'false');
      state.selectedShape = null;
    }
    hideAllHandles();
    if (updateBar) updateConnectionBar();
  }

  // ================= DRAG SHAPES =================
  function onShapePointerDown(e) {
    if (e.target.classList.contains('conn-handle')) return;
    if (e.button === 2) return;
    e.stopPropagation();

    clearConnectionSelection();
    selectShape(this);

    if (e.detail >= 2) return;

    const el = this;
    const pt = clientToCanvas(e.clientX, e.clientY);
    let moved = false;

    state.dragState = { el, offsetX: pt.x - el.offsetLeft, offsetY: pt.y - el.offsetTop };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';

    const onMove = (ev) => {
      if (!state.dragState) return;
      moved = true;
      const pt2 = clientToCanvas(ev.clientX, ev.clientY);
      const newX = Math.max(0, pt2.x - state.dragState.offsetX);
      const newY = Math.max(0, pt2.y - state.dragState.offsetY);
      el.style.left = newX + 'px';
      el.style.top  = newY + 'px';
      updateConnectionsForShape(el.id);
      updateHandleGroup(el.id);
      scheduleTitleUpdate();
    };

    const onUp = () => {
      el.style.cursor = 'move';
      if (moved) saveSnapshot();
      state.dragState = null;
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      scheduleRefresh();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }

  // ================= ZOOM =================
  function setZoom(newScale) {
    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
    const cr  = canvasContainer.getBoundingClientRect();
    const scx = (canvasContainer.scrollLeft + cr.width / 2) / state.scale;
    const scy = (canvasContainer.scrollTop  + cr.height / 2) / state.scale;

    state.scale = newScale;
    canvas.style.transform = `scale(${newScale})`;
    if (zoomLevelText) zoomLevelText.textContent = `${Math.round(newScale * 100)}%`;

    canvasContainer.scrollLeft = scx * newScale - cr.width / 2;
    canvasContainer.scrollTop  = scy * newScale - cr.height / 2;

    scheduleRefresh();
  }

  zoomInBtn?.addEventListener('click', () => setZoom(state.scale + state.scaleStep));
  zoomOutBtn?.addEventListener('click', () => setZoom(state.scale - state.scaleStep));
  zoomResetBtn?.addEventListener('click', () => setZoom(1));

  canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(state.scale + Math.sign(e.deltaY) * -0.1);
  }, { passive:false });

  // ================= PAN (drag background) =================
  let isPanning = false;
  let panStart = {x:0,y:0};
  let panScroll = {left:0,top:0};

  function isOnBackground(target) {
    return target === canvas || target === canvasContainer || target === svgLayer;
  }

  canvasContainer.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;
    if (!isOnBackground(e.target)) return;

    // deselect
    deselectAll(false);
    clearConnectionSelection(false);
    updateConnectionBar();

    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panScroll = { left: canvasContainer.scrollLeft, top: canvasContainer.scrollTop };
    canvasContainer.setPointerCapture(e.pointerId);
    canvasContainer.style.cursor = 'grabbing';
  });

  canvasContainer.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    canvasContainer.scrollLeft = panScroll.left - dx;
    canvasContainer.scrollTop  = panScroll.top  - dy;
  });

  function stopPanning() {
    if (!isPanning) return;
    isPanning = false;
    canvasContainer.style.cursor = 'default';
  }
  canvasContainer.addEventListener('pointerup', stopPanning);
  canvasContainer.addEventListener('pointercancel', stopPanning);

  // ================= COLOR PICKER =================
  const colorButtons = Array.from(document.querySelectorAll('.color-option'));
  function syncColorPickerToCurrent(forcedHex) {
    const hex = (forcedHex || state.currentColor || '').toLowerCase();
    colorButtons.forEach(btn => {
      const c = (btn.dataset.color || '').toLowerCase();
      if (c === hex) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
  }

  function applyColor(hex) {
    if (!hex) return;
    state.currentColor = hex;
    syncColorPickerToCurrent(hex);

    if (state.selectedShape) {
      saveSnapshot();
      state.selectedShape.style.backgroundColor = hex;
      const s = state.shapes.find(x => x.id === state.selectedShape.id);
      if (s) {
        s.color = hex;
        state.baseColors[s.type] = hex;
      }
      scheduleRefresh();
      return;
    }

    state.baseColors[state.lastShapeType] = hex;
  }

  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => applyColor(btn.dataset.color));
  });

  // ================= SHAPE BUTTONS (ADD) =================
  document.querySelectorAll('.shape-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.shape;
      if (!type) return;
      state.lastShapeType = type;
      saveSnapshot();
      const newEl = createShape(type);
      if (newEl) {
        const base = getBaseColor(type);
        newEl.style.backgroundColor = base;
        const s = state.shapes.find(x => x.id === newEl.id);
        if (s) s.color = base;
        selectShape(newEl);
      }
    });
  });

  // ================= TEXT MODAL =================
  cancelText?.addEventListener('click', () => {
    state.activeShape = null;
    closeModal(textModal);
  });
  saveText?.addEventListener('click', () => {
    if (!state.activeShape) { closeModal(textModal); return; }
    saveSnapshot();
    setShapeText(state.activeShape, shapeTextArea?.value || '');
    closeModal(textModal);
    state.activeShape = null;
    scheduleRefresh();
  });

  // ================= CONNECTION MODAL =================
  function finishDecisionConnection(kind) {
    if (!state.pendingConn) return;
    const { fromEl, toEl } = state.pendingConn;
    state.pendingConn = null;
    closeModal(connectionModal);
    saveSnapshot();
    connectShapes(fromEl, toEl, kind);
    scheduleRefresh();
  }
  connectionYesBtn?.addEventListener('click', () => finishDecisionConnection('yes'));
  connectionNoBtn?.addEventListener('click', () => finishDecisionConnection('no'));
  cancelConnBtn?.addEventListener('click', () => {
    state.pendingConn = null;
    closeModal(connectionModal);
  });

  // ================= DELETE / CLEAR =================
  function deleteSelected() {
    if (state.selectedConnId) {
      deleteConnection(state.selectedConnId);
      return;
    }
    if (!state.selectedShape) return;

    const shapeId = state.selectedShape.id;
    saveSnapshot();

    const toRemove = state.connections.filter(c => c.from === shapeId || c.to === shapeId).map(c => c.id);
    toRemove.forEach(id => removeConnectionDom(id));
    state.connections = state.connections.filter(c => c.from !== shapeId && c.to !== shapeId);

    document.getElementById(shapeId)?.remove();
    removeHandleGroup(shapeId);
    state.shapes = state.shapes.filter(s => s.id !== shapeId);

    deselectAll(false);
    clearConnectionSelection(false);
    updateConnectionBar();
    scheduleRefresh();
  }

  deleteButton?.addEventListener('click', deleteSelected);

  clearButton?.addEventListener('click', () => {
    showConfirmModal('Очистити все полотно?', () => {
      saveSnapshot();
      state.shapes.forEach(s => {
        document.getElementById(s.id)?.remove();
        removeHandleGroup(s.id);
      });
      state.connections.forEach(c => removeConnectionDom(c.id));

      state.shapes = [];
      state.connections = [];
      state.selectedShape = null;
      state.selectedConnId = null;
      state.shapeCounter = 0;
      hideAllHandles();
      updateConnectionBar();
      scheduleRefresh();
    });
  });

  // ================= SAVE AS IMAGE =================
  function computeShapesBounds() {
    if (state.shapes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, empty: true };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    state.shapes.forEach(s => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const left = el.offsetLeft;
      const top  = el.offsetTop;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const cx = left + w/2;
      const cy = top + h/2;

      if (s.type === 'decision') {
        const d = w/2;
        minX = Math.min(minX, cx - d);
        minY = Math.min(minY, cy - d);
        maxX = Math.max(maxX, cx + d);
        maxY = Math.max(maxY, cy + d);
      } else if (s.type === 'input-output') {
        const skewOffset = Math.abs(Math.tan(20 * Math.PI / 180) * h / 2);
        minX = Math.min(minX, left - skewOffset);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + w + skewOffset);
        maxY = Math.max(maxY, top + h);
      } else {
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + w);
        maxY = Math.max(maxY, top + h);
      }
    });

    if (titleDisplay && titleDisplay.style.display !== 'none' && titleDisplay.textContent.trim()) {
      const tLeft = titleDisplay.offsetLeft - titleDisplay.offsetWidth / 2;
      const tTop  = titleDisplay.offsetTop;
      minX = Math.min(minX, tLeft);
      minY = Math.min(minY, tTop);
      maxX = Math.max(maxX, tLeft + titleDisplay.offsetWidth);
      maxY = Math.max(maxY, tTop + titleDisplay.offsetHeight);
    }

    return { minX, minY, maxX, maxY, empty: false };
  }

  async function exportPng() {
    if (!window.html2canvas) {
      showMessageModal('html2canvas не завантажився. Перевір інтернет або скрипт.');
      return;
    }
    if (state.shapes.length === 0) {
      showMessageModal('Спочатку додай хоча б один блок.');
      return;
    }

    const prevScale = state.scale;
    const prevScroll = { left: canvasContainer.scrollLeft, top: canvasContainer.scrollTop };
    setZoom(1);
    await new Promise(r => setTimeout(r, 60));

    const b = computeShapesBounds();
    const pad = 90;
    const x = Math.max(0, b.minX - pad);
    const y = Math.max(0, b.minY - pad);
    const w = Math.min(canvas.offsetWidth, (b.maxX - b.minX) + pad * 2);
    const h = Math.min(canvas.offsetHeight, (b.maxY - b.minY) + pad * 2);

    const prevSel = state.selectedShape;
    prevSel?.classList.remove('selected');
    clearConnectionSelection(false);
    hideAllHandles();
    updateConnectionBar();

    try {
      const c = await window.html2canvas(canvas, {
        backgroundColor: '#fafbff',
        x, y, width: w, height: h,
        scale: 2,
        useCORS: true,
      });
      const filename = sanitizeFilename(state.diagramTitle || 'блок-схема');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = c.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      showMessageModal('Не вдалося зберегти картинку. Спробуй інший браузер або зменши масштаб.');
    } finally {
      if (prevSel) prevSel.classList.add('selected');
      setZoom(prevScale);
      canvasContainer.scrollLeft = prevScroll.left;
      canvasContainer.scrollTop  = prevScroll.top;
      scheduleRefresh();
    }
  }

  saveButton?.addEventListener('click', exportPng);

  // ================= HELP PANEL =================
  function toggleHelp(show) {
    if (!helpPanel) return;
    if (typeof show === 'boolean') {
      helpPanel.hidden = !show;
      return;
    }
    helpPanel.hidden = !helpPanel.hidden;
  }
  helpButton?.addEventListener('click', () => toggleHelp());
  helpClose?.addEventListener('click', () => toggleHelp(false));

  // ================= GLOBAL SHORTCUTS =================
  document.addEventListener('keydown', (e) => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      exportPng();
      return;
    }

    if (e.key === 'Escape') {
      if (helpPanel && !helpPanel.hidden) toggleHelp(false);
      closeModal(textModal);
      closeModal(connectionModal);
      closeModal(document.getElementById('message-modal'));
      state.pendingConn = null;
      state.activeShape = null;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      deleteSelected();
    }
  });

  // ================= CANVAS CLICK (deselect) =================
  svgLayer.addEventListener('pointerdown', (e) => {
    if ((e.target instanceof SVGElement) && e.target.classList.contains('conn-hit')) return;
    if (!isOnBackground(e.target)) return;
    deselectAll(false);
    clearConnectionSelection(false);
    updateConnectionBar();
  });

  // ================= REFRESH LAYOUT =================
  function refreshAll() {
    state._refreshRaf = 0;
    state.connections.forEach(c => updateConnection(c.id));
    Object.keys(shapeHandleGroups).forEach(updateHandleGroup);
    scheduleTitleUpdate();
  }
  function scheduleRefresh() {
    if (state._refreshRaf) return;
    state._refreshRaf = requestAnimationFrame(refreshAll);
  }
  window.addEventListener('resize', scheduleRefresh);

  // ================= INIT UI =================
  syncColorPickerToCurrent(state.currentColor);
  renderTitle();

  connectionModal?.addEventListener('pointerdown', (e) => {
    if (e.target === connectionModal) {
      state.pendingConn = null;
      closeModal(connectionModal);
    }
  });

});
