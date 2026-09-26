'use strict';

// ══════════════════════════════════════════════════
//  ПЕНЗЛИК v3 — script.js
//  Key fixes:
//  ✓ Image import: fit with aspect-ratio (no stretch)
//  ✓ Binary color in mixer
//  ✓ 16 stamps (4×4), shuffle from big pool
//  ✓ Custom modal dialogs (no alert/confirm)
//  ✓ Scanline flood fill (instant, no rAF splitting)
//  ✓ Color mixer inline in colors section
//  ✓ Spray, opacity, keyboard shortcuts
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── ALL STAMPS (pool) ─────────────────────────────
  const STAMP_POOL = [
    '🦄', '🐱', '🐶', '🦁', '🐯', '🐻', '🐼', '🦊',
    '🐸', '🐧', '🦋', '🐝', '🐬', '🦕', '🦖', '🦒',
    '🐘', '🐙', '🦑', '🦀', '🐠', '🐢', '🦜', '🦩',
    '🐿️', '🦔', '🌈', '🌟', '⭐', '🌸', '🌺', '🌻',
    '🌹', '🍀', '🌵', '🌴', '🍁', '🍄', '🌊', '🔥',
    '❄️', '☀️', '🌙', '🍕', '🍦', '🍩', '🎂', '🍓',
    '🍉', '🍭', '🍎', '🥑', '🍪', '🧁', '🍇', '🍑',
    '🚀', '🎮', '🏀', '🎸', '✈️', '🎈', '🎁', '💎',
    '🏆', '🎯', '🎨', '🪄', '🎵', '⚡', '💫', '🌀',
    '🧩', '🎲', '🎆', '🎠', '🛸', '🎡', '🪁', '🎳',
  ];

  // ── CANVAS ────────────────────────────────────────
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) { canvas.replaceWith(document.createTextNode('Ваш браузер не підтримує canvas.')); return; }

  // ── STATE ─────────────────────────────────────────
  const state = {
    isDrawing: false,
    pointerId: null,
    lastX: 0, lastY: 0,
    startX: 0, startY: 0,
    currentTool: 'pencil',
    currentColor: '#1a1a1a',
    currentSize: 5,
    currentOpacity: 1.0,
    currentShape: 'line',
    currentStamp: null,
    canvasSnapshot: null,
    unsavedChanges: false,
  };

  const undoStack = [];
  const redoStack = [];
  const MAX_UNDO = 50;

  // ── TOOL METADATA ─────────────────────────────────
  const TOOL_INFO = {
    pencil: { icon: 'fa-paintbrush', label: 'Пензлик' },
    eraser: { icon: 'fa-eraser', label: 'Гумка' },
    fill: { icon: 'fa-fill-drip', label: 'Заливка' },
    spray: { icon: 'fa-spray-can-sparkles', label: 'Аерозоль' },
    shapes: { icon: 'fa-shapes', label: 'Фігури' },
    stamps: { icon: 'fa-stamp', label: 'Штампи' },
  };
  const CURSORS = { pencil: 'crosshair', eraser: 'cell', fill: 'cell', spray: 'crosshair', shapes: 'crosshair', stamps: 'copy' };

  // ── DOM REFS ──────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const el = {
    pencilBtn: $('pencil'),
    eraserBtn: $('eraser'),
    fillBtn: $('fill'),
    sprayBtn: $('spray'),
    shapesBtn: $('shapes'),
    stampsBtn: $('stamps'),
    shapesSection: document.querySelector('.shapes-section'),
    stampsSection: document.querySelector('.stamps-section'),
    shapeButtons: $$('.shape-btn'),
    stampsGrid: $('stamps-grid'),
    shuffleBtn: $('shuffle-stamps'),
    clearBtn: $('clear'),
    saveBtn: $('save'),
    undoBtn: $('undo'),
    redoBtn: $('redo'),
    importFile: $('import-file'),
    colors: $$('.color'),
    sizeSlider: $('size-slider'),
    sizeValue: $('size-value'),
    opacitySlider: $('opacity-slider'),
    opacityValue: $('opacity-value'),
    nativePicker: $('native-color-picker'),
    toggleMixer: $('toggle-mixer'),
    colorMixer: $('color-mixer'),
    redSlider: $('red'),
    greenSlider: $('green'),
    blueSlider: $('blue'),
    redVal: $('red-value'),
    greenVal: $('green-value'),
    blueVal: $('blue-value'),
    hexVal: $('hex-value'),
    rgbVal: $('rgb-value'),
    binVal: $('binary-value'),
    colorPreview: $('color-preview'),
    useColorBtn: $('use-color'),
    toolIndicator: $('tool-indicator'),
    canvasContainer: $('canvas-container'),
    // Modal
    modalOverlay: $('modal-overlay'),
    modalIcon: $('modal-icon'),
    modalTitle: $('modal-title'),
    modalText: $('modal-text'),
    modalCancel: $('modal-cancel'),
    modalConfirm: $('modal-confirm'),
  };

  // ══════════════════════════════════════════════════
  //  MODAL SYSTEM
  // ══════════════════════════════════════════════════
  function showAlert(title, text, icon = 'ℹ️') {
    return new Promise(resolve => {
      el.modalIcon.textContent = icon;
      el.modalTitle.textContent = title;
      el.modalText.textContent = text;
      el.modalCancel.style.display = 'none';
      el.modalConfirm.textContent = 'Зрозуміло';
      el.modalConfirm.className = 'modal-btn confirm';
      el.modalOverlay.style.display = 'flex';
      const cleanup = () => { el.modalOverlay.style.display = 'none'; resolve(true); };
      el.modalConfirm.onclick = cleanup;
    });
  }

  function showConfirm(title, text, icon = '❓', confirmLabel = 'Так', danger = false) {
    return new Promise(resolve => {
      el.modalIcon.textContent = icon;
      el.modalTitle.textContent = title;
      el.modalText.textContent = text;
      el.modalCancel.style.display = 'inline-block';
      el.modalCancel.textContent = 'Скасувати';
      el.modalConfirm.textContent = confirmLabel;
      el.modalConfirm.className = 'modal-btn confirm' + (danger ? ' danger-btn' : '');
      el.modalOverlay.style.display = 'flex';

      const cleanup = (result) => {
        el.modalOverlay.style.display = 'none';
        el.modalConfirm.onclick = null;
        el.modalCancel.onclick = null;
        resolve(result);
      };
      el.modalConfirm.onclick = () => cleanup(true);
      el.modalCancel.onclick = () => cleanup(false);
    });
  }

  // ══════════════════════════════════════════════════
  //  CANVAS INIT & RESIZE
  // ══════════════════════════════════════════════════
  function resizeCanvas() {
    const width = Math.max(1, el.canvasContainer.clientWidth);
    const height = Math.max(1, el.canvasContainer.clientHeight);
    if (canvas.width === width && canvas.height === height) return;
    finishStroke();
    const snapshot = copyCanvas();
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(snapshot, 0, 0, width, height);
    state.canvasSnapshot = null;
  }
  // Canvas copies restore synchronously, so rapid undo cannot erase newer strokes.
  function copyCanvas() {
    const copy = document.createElement('canvas');
    copy.width = canvas.width; copy.height = canvas.height;
    copy.getContext('2d').drawImage(canvas, 0, 0);
    return copy;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeCanvas).observe(el.canvasContainer);

  // ══════════════════════════════════════════════════
  //  UNDO / REDO
  // ══════════════════════════════════════════════════
  function pushUndo() {
    finishStroke();
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    undoStack.push(copyCanvas());
    redoStack.length = 0;
    state.unsavedChanges = true;
    syncHistoryBtns();
  }

  function undo() {
    finishStroke();
    if (!undoStack.length) return;
    redoStack.push(copyCanvas());
    restoreCanvas(undoStack.pop());
    syncHistoryBtns();
  }

  function redo() {
    finishStroke();
    if (!redoStack.length) return;
    undoStack.push(copyCanvas());
    restoreCanvas(redoStack.pop());
    syncHistoryBtns();
  }

  function restoreCanvas(snapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
    state.unsavedChanges = true;
  }

  function syncHistoryBtns() {
    el.undoBtn.disabled = undoStack.length === 0;
    el.redoBtn.disabled = redoStack.length === 0;
  }

  // ══════════════════════════════════════════════════
  //  POINTER EVENTS
  // ══════════════════════════════════════════════════
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (state.pointerId !== null || e.isPrimary === false || e.button !== 0) return;
    if (state.currentTool === 'stamps' && !state.currentStamp) return;
    e.preventDefault();
    const p = getPos(e);
    pushUndo();
    canvas.setPointerCapture(e.pointerId);
    state.pointerId = e.pointerId;
    state.lastX = p.x; state.lastY = p.y;
    state.startX = p.x; state.startY = p.y;
    state.isDrawing = true;

    const t = state.currentTool;
    if (t === 'stamps') {
      if (!state.currentStamp) return;
      placeStamp(p.x, p.y); finishStroke();
    } else if (t === 'fill') {
      if (inBounds(p.x, p.y)) floodFill(Math.floor(p.x), Math.floor(p.y));
      finishStroke();
    } else if (t === 'shapes') {
      state.canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      if (t === 'spray') spray(p.x, p.y);
      else {
        ctx.save();
        setCtxStyle();
        if (t === 'eraser') { ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; }
        ctx.beginPath(); ctx.arc(p.x, p.y, state.currentSize / 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  });

  function moveStroke(e) {
    if (!state.isDrawing || e.pointerId !== state.pointerId) return;
    const p = getPos(e);
    const t = state.currentTool;
    if (t === 'pencil') drawFreehand(p.x, p.y);
    else if (t === 'eraser') erase(p.x, p.y);
    else if (t === 'spray') spray(p.x, p.y);
    else if (t === 'shapes') {
      if (state.canvasSnapshot) ctx.putImageData(state.canvasSnapshot, 0, 0);
      drawShape(p.x, p.y);
    }
    state.lastX = p.x; state.lastY = p.y;
  }
  canvas.addEventListener('pointermove', moveStroke);

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerId !== state.pointerId) return;
    moveStroke(e);
    finishStroke();
  });

  function finishStroke() {
    const id = state.pointerId;
    state.isDrawing = false;
    state.pointerId = null;
    state.canvasSnapshot = null;
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
  for (const type of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, e => { if (e.pointerId === state.pointerId) finishStroke(); });
  }
  window.addEventListener('blur', finishStroke);

  // ══════════════════════════════════════════════════
  //  DRAWING FUNCTIONS
  // ══════════════════════════════════════════════════
  function setCtxStyle() {
    ctx.globalAlpha = state.currentOpacity;
    ctx.strokeStyle = state.currentColor;
    ctx.fillStyle = state.currentColor;
    ctx.lineWidth = state.currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function drawFreehand(x, y) {
    setCtxStyle();
    ctx.beginPath();
    ctx.moveTo(state.lastX, state.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function erase(x, y) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = state.currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(state.lastX, state.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function spray(x, y) {
    setCtxStyle();
    const radius = state.currentSize * 3;
    const density = Math.ceil(state.currentSize * 2.5);
    ctx.fillStyle = state.currentColor;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      ctx.beginPath();
      ctx.arc(x + r * Math.cos(angle), y + r * Math.sin(angle), .9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Shapes ────────────────────────────────────────
  function drawShape(x, y) {
    setCtxStyle();
    switch (state.currentShape) {
      case 'line': drawLine(state.startX, state.startY, x, y); break;
      case 'rect': drawRect(state.startX, state.startY, x, y, false); break;
      case 'rect-filled': drawRect(state.startX, state.startY, x, y, true); break;
      case 'circle': drawCircle(state.startX, state.startY, x, y, false); break;
      case 'circle-filled': drawCircle(state.startX, state.startY, x, y, true); break;
      case 'triangle': drawTriangle(state.startX, state.startY, x, y); break;
      case 'star': drawStar(state.startX, state.startY, x, y); break;
      case 'heart': drawHeart(state.startX, state.startY, x, y); break;
      case 'arrow': drawArrow(state.startX, state.startY, x, y); break;
    }
    ctx.globalAlpha = 1;
  }

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function drawRect(x1, y1, x2, y2, filled) {
    ctx.beginPath(); ctx.rect(x1, y1, x2 - x1, y2 - y1);
    filled ? ctx.fill() : ctx.stroke();
  }
  function drawCircle(x1, y1, x2, y2, filled) {
    const r = Math.hypot(x2 - x1, y2 - y1);
    if (r < 3) return;
    ctx.beginPath(); ctx.arc(x1, y1, r, 0, Math.PI * 2);
    filled ? ctx.fill() : ctx.stroke();
  }
  function drawTriangle(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo((x1 + x2) / 2, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
    ctx.closePath(); ctx.stroke();
  }
  function drawStar(x1, y1, x2, y2) {
    const outerR = Math.hypot(x2 - x1, y2 - y1);
    if (outerR < 5) return;
    const innerR = outerR / 2.2;
    const spikes = 5;
    let angle = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      ctx.lineTo(x1 + r * Math.cos(angle), y1 + r * Math.sin(angle));
      angle += step;
    }
    ctx.closePath(); ctx.stroke();
  }
  function drawHeart(x1, y1, x2, y2) {
    const left = Math.min(x1, x2), right = Math.max(x1, x2);
    const top = Math.min(y1, y2), bottom = Math.max(y1, y2);
    const w = right - left, h = bottom - top;
    if (w < 5 || h < 5) return;
    const cx = left + w / 2, topH = h * .3;
    ctx.beginPath();
    ctx.moveTo(cx, bottom);
    ctx.bezierCurveTo(cx - w / 2, bottom - topH, left, top + topH * 1.5, cx, top + topH);
    ctx.bezierCurveTo(right, top + topH * 1.5, cx + w / 2, bottom - topH, cx, bottom);
    ctx.closePath(); ctx.stroke();
  }
  function drawArrow(x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = Math.max(state.currentSize * 3, 14);
    const ha = Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - ha), y2 - headLen * Math.sin(angle - ha));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + ha), y2 - headLen * Math.sin(angle + ha));
    ctx.stroke();
  }

  // ══════════════════════════════════════════════════
  //  FLOOD FILL — Scanline algorithm (fast, synchronous)
  // ══════════════════════════════════════════════════
  function floodFill(startX, startY) {
    if (!inBounds(startX, startY)) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const W = canvas.width;
      const H = canvas.height;

      // Target color at click point
      const ti = (startY * W + startX) * 4;
      const tR = data[ti], tG = data[ti + 1], tB = data[ti + 2], tA = data[ti + 3];

      // Fill color
      const [fR, fG, fB] = hexToRgba(state.currentColor);

      // If already same color → stop
      if (tR === fR && tG === fG && tB === fB && tA === 255) return;

      // Visited flag (avoids revisiting)
      const visited = new Uint8Array(W * H);

      const stack = [[startX, startY]];

      while (stack.length) {
        let [x, y] = stack.pop();

        // Skip if visited or color changed
        let idx = (y * W + x) * 4;
        if (visited[y * W + x]) continue;
        if (!colorMatch(data, idx, tR, tG, tB, tA)) continue;

        // Scan left
        let lx = x;
        while (lx > 0) {
          const ni = (y * W + (lx - 1)) * 4;
          if (visited[y * W + lx - 1] || !colorMatch(data, ni, tR, tG, tB, tA)) break;
          lx--;
        }
        // Scan right
        let rx = x;
        while (rx < W - 1) {
          const ni = (y * W + (rx + 1)) * 4;
          if (visited[y * W + rx + 1] || !colorMatch(data, ni, tR, tG, tB, tA)) break;
          rx++;
        }

        // Fill scanline & check rows above/below
        for (let fx = lx; fx <= rx; fx++) {
          const fi = (y * W + fx) * 4;
          const alpha = state.currentOpacity;
          const originalAlpha = data[fi + 3] / 255;
          const resultAlpha = alpha + originalAlpha * (1 - alpha);
          data[fi] = Math.round((fR * alpha + data[fi] * originalAlpha * (1 - alpha)) / resultAlpha);
          data[fi + 1] = Math.round((fG * alpha + data[fi + 1] * originalAlpha * (1 - alpha)) / resultAlpha);
          data[fi + 2] = Math.round((fB * alpha + data[fi + 2] * originalAlpha * (1 - alpha)) / resultAlpha);
          data[fi + 3] = Math.round(resultAlpha * 255);
          visited[y * W + fx] = 1;

          // Above
          if (y > 0 && !visited[(y - 1) * W + fx]) {
            const ai = ((y - 1) * W + fx) * 4;
            if (colorMatch(data, ai, tR, tG, tB, tA)) stack.push([fx, y - 1]);
          }
          // Below
          if (y < H - 1 && !visited[(y + 1) * W + fx]) {
            const bi = ((y + 1) * W + fx) * 4;
            if (colorMatch(data, bi, tR, tG, tB, tA)) stack.push([fx, y + 1]);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.error('Flood fill error:', e);
    }
  }

  function colorMatch(data, i, tR, tG, tB, tA, tol = 10) {
    return Math.abs(data[i] - tR) <= tol &&
      Math.abs(data[i + 1] - tG) <= tol &&
      Math.abs(data[i + 2] - tB) <= tol &&
      Math.abs(data[i + 3] - tA) <= tol;
  }

  function hexToRgba(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  function inBounds(x, y) {
    return x >= 0 && x < canvas.width && y >= 0 && y < canvas.height;
  }

  // ── STAMP ─────────────────────────────────────────
  function placeStamp(x, y) {
    if (!state.currentStamp) return;
    const sz = Math.max(state.currentSize * 5, 20);
    ctx.save();
    ctx.globalAlpha = state.currentOpacity;
    ctx.font = `${sz}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.currentStamp, x, y);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════
  //  STAMPS RENDERING (16 = 4×4)
  // ══════════════════════════════════════════════════
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderStamps() {
    const pool = shuffle(STAMP_POOL);
    const unique = [...new Set(pool)].slice(0, 16); // 4×4 grid

    el.stampsGrid.innerHTML = '';
    unique.forEach(emoji => {
      const d = document.createElement('div');
      d.className = 'stamp';
      d.dataset.emoji = emoji;
      d.textContent = emoji;
      d.title = emoji;
      d.addEventListener('click', function () {
        $$('.stamp').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        state.currentStamp = this.dataset.emoji;
      });
      el.stampsGrid.appendChild(d);
    });

    // Restore active state
    if (state.currentStamp) {
      const m = el.stampsGrid.querySelector(`[data-emoji="${state.currentStamp}"]`);
      if (m) m.classList.add('active');
    }
  }

  el.shuffleBtn.addEventListener('click', renderStamps);

  // ══════════════════════════════════════════════════
  //  TOOL SWITCHING
  // ══════════════════════════════════════════════════
  const toolBtns = {
    pencil: el.pencilBtn, eraser: el.eraserBtn,
    fill: el.fillBtn, spray: el.sprayBtn,
    shapes: el.shapesBtn, stamps: el.stampsBtn,
  };

  function setTool(tool) {
    finishStroke();
    state.currentTool = tool;
    // Close panels
    el.shapesSection.style.display = 'none';
    el.stampsSection.style.display = 'none';
    // Clear active
    Object.values(toolBtns).forEach(b => b.classList.remove('active'));
    if (toolBtns[tool]) toolBtns[tool].classList.add('active');
    canvas.style.cursor = CURSORS[tool] || 'crosshair';
    updateIndicator();
  }

  function togglePanel(section, btn, tool) {
    const open = section.style.display === 'block';
    setTool(open ? 'pencil' : tool);
    if (!open) section.style.display = 'block';
  }

  function updateIndicator() {
    const info = TOOL_INFO[state.currentTool];
    if (!info) return;
    el.toolIndicator.innerHTML = `<i class="fa-solid ${info.icon}"></i> ${info.label}`;
  }

  el.pencilBtn.addEventListener('click', () => setTool('pencil'));
  el.eraserBtn.addEventListener('click', () => setTool('eraser'));
  el.fillBtn.addEventListener('click', () => setTool('fill'));
  el.sprayBtn.addEventListener('click', () => setTool('spray'));
  el.shapesBtn.addEventListener('click', () => togglePanel(el.shapesSection, el.shapesBtn, 'shapes'));
  el.stampsBtn.addEventListener('click', () => togglePanel(el.stampsSection, el.stampsBtn, 'stamps'));

  el.shapeButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      el.shapeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.currentShape = this.dataset.shape;
    });
  });

  // ══════════════════════════════════════════════════
  //  CANVAS ACTIONS
  // ══════════════════════════════════════════════════
  el.clearBtn.addEventListener('click', async () => {
    const ok = await showConfirm(
      'Очистити полотно?',
      'Полотно буде очищено. Малюнок можна повернути кнопкою «Назад».',
      '🗑️', 'Очистити', true
    );
    if (!ok) return;
    pushUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  el.saveBtn.addEventListener('click', () => {
    finishStroke();
    try {
      const link = document.createElement('a');
      link.download = 'my-drawing.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      state.unsavedChanges = false;
    } catch (e) {
      showAlert('Помилка збереження', 'Не вдалося зберегти файл. Перевірте налаштування браузера.', '⚠️');
    }
  });

  el.undoBtn.addEventListener('click', undo);
  el.redoBtn.addEventListener('click', redo);

  // ── Image Import: fit with aspect ratio ───────────
  el.importFile.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => showAlert('Помилка імпорту', 'Не вдалося прочитати файл.', '⚠️');
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => showAlert('Помилка імпорту', 'Не вдалося прочитати зображення.', '⚠️');
      img.onload = () => {
        pushUndo();
        // Fill white background first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Calculate "contain" scale (fit without stretching)
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = (canvas.width - drawW) / 2;
        const drawY = (canvas.height - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    this.value = ''; // allow re-upload same file
  });

  // ══════════════════════════════════════════════════
  //  COLORS
  // ══════════════════════════════════════════════════
  function applyColor(hex) {
    state.currentColor = hex;
    el.nativePicker.value = hex;
    // Update active dot
    el.colors.forEach(c => c.classList.toggle('active', c.dataset.hex === hex));
    // Sync mixer sliders if mixer is open
    if (el.colorMixer.style.display !== 'none') {
      syncMixerToColor(hex);
    }
  }

  el.colors.forEach(c => c.addEventListener('click', function () {
    applyColor(this.dataset.hex);
  }));

  el.nativePicker.addEventListener('input', function () {
    state.currentColor = this.value;
    el.colors.forEach(c => c.classList.remove('active'));
    if (el.colorMixer.style.display !== 'none') syncMixerToColor(this.value);
  });

  // ── Color Mixer toggle ────────────────────────────
  el.toggleMixer.addEventListener('click', () => {
    const open = el.colorMixer.style.display !== 'none';
    el.colorMixer.style.display = open ? 'none' : 'block';
    el.toggleMixer.classList.toggle('active', !open);
    if (!open) syncMixerToColor(state.currentColor);
  });

  function syncMixerToColor(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    el.redSlider.value = r;
    el.greenSlider.value = g;
    el.blueSlider.value = b;
    updateMixerDisplay(r, g, b);
  }

  function toBin8(n) { return parseInt(n).toString(2).padStart(8, '0'); }
  function toHex2(n) { return parseInt(n).toString(16).padStart(2, '0'); }

  function updateMixerDisplay(r, g, b) {
    r = +r; g = +g; b = +b;
    el.redVal.textContent = r;
    el.greenVal.textContent = g;
    el.blueVal.textContent = b;
    const hex = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
    el.hexVal.textContent = hex;
    el.rgbVal.textContent = `${r}, ${g}, ${b}`;
    el.colorPreview.style.backgroundColor = hex;
    // Binary with colored spans
    el.binVal.innerHTML =
      `<span class="bin-r">${toBin8(r)}</span>` +
      `<span class="bin-g">${toBin8(g)}</span>` +
      `<span class="bin-b">${toBin8(b)}</span>`;
  }

  function onSliderInput() {
    updateMixerDisplay(el.redSlider.value, el.greenSlider.value, el.blueSlider.value);
  }

  el.redSlider.addEventListener('input', onSliderInput);
  el.greenSlider.addEventListener('input', onSliderInput);
  el.blueSlider.addEventListener('input', onSliderInput);

  el.useColorBtn.addEventListener('click', () => {
    const hex = el.hexVal.textContent;
    applyColor(hex);
    // Close mixer
    el.colorMixer.style.display = 'none';
    el.toggleMixer.classList.remove('active');
  });

  // ── Size & Opacity ────────────────────────────────
  el.sizeSlider.addEventListener('input', function () {
    state.currentSize = +this.value;
    el.sizeValue.textContent = this.value;
  });
  el.opacitySlider.addEventListener('input', function () {
    state.currentOpacity = +this.value / 100;
    el.opacityValue.textContent = this.value + '%';
  });

  // ══════════════════════════════════════════════════
  //  KEYBOARD SHORTCUTS
  // ══════════════════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    // Skip if modal is open or typing in input
    if (el.modalOverlay.style.display !== 'none') return;
    if (e.target.tagName === 'INPUT') return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
        case 'y': e.preventDefault(); redo(); break;
        case 's': e.preventDefault(); el.saveBtn.click(); break;
      }
      return;
    }
    switch (e.key.toLowerCase()) {
      case 'p': setTool('pencil'); break;
      case 'e': setTool('eraser'); break;
      case 'f': setTool('fill'); break;
      case 's': setTool('spray'); break;
      case 'escape': setTool('pencil'); break;
      case '[':
        state.currentSize = Math.max(1, state.currentSize - 2);
        el.sizeSlider.value = state.currentSize;
        el.sizeValue.textContent = state.currentSize;
        break;
      case ']':
        state.currentSize = Math.min(50, state.currentSize + 2);
        el.sizeSlider.value = state.currentSize;
        el.sizeValue.textContent = state.currentSize;
        break;
    }
  });

  // ── Unsaved warning ───────────────────────────────
  window.addEventListener('beforeunload', (e) => {
    if (state.unsavedChanges) { e.preventDefault(); e.returnValue = ''; }
  });

  // ══════════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════════
  renderStamps();
  syncHistoryBtns();
  // Mixer is open by default — sync initial color
  syncMixerToColor(state.currentColor);
});
