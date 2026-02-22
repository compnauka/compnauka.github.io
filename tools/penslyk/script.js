/* Penzlyk v3.0 — neo-brutal UI + fullscreen canvas + toggle teal panel under purple */

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const Config = {
  colors: [
    { hex: '#000000', name: 'Чорний' },
    { hex: '#FF4D4D', name: 'Червоний' },
    { hex: '#FF7A00', name: 'Оранжевий' },
    { hex: '#FFDE00', name: 'Жовтий' },
    { hex: '#00E055', name: 'Зелений' },
    { hex: '#00D4FF', name: 'Блакитний' },
    { hex: '#3B82F6', name: 'Синій' },
    { hex: '#A855F7', name: 'Фіолетовий' },
    { hex: '#FF4DD8', name: 'Рожевий' },
    { hex: '#7B4A12', name: 'Коричневий' },
    { hex: '#FFFFFF', name: 'Білий' },
  ],
  stamps: [
    '🦄', '🐱', '🐶', '🦖', '🌈', '🌟', '🍕', '🚀', '🎮', '🏀',
    '🌸', '🌞', '👑', '🐸', '🐙', '🤖', '🦊', '🐻', '🧁', '🍓',
    '⚽', '💎', '🎁', '🎈', '🛸', '🧠',
  ],
  toastLimit: 2,
  historyLimit: 25,
  autosaveKey: 'penzlyk_autosave_v2',
  themeKey: 'penzlyk_theme_v1',
  fillTolerance: 32, // flood-fill color tolerance (0–255)
};

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────
const Utils = {
  debounce(fn, delay) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },
  clamp(n, a, b) { return Math.max(a, Math.min(b, n)); },
  now() { return Date.now(); },

  /** Parse #rrggbb hex string → { r, g, b } or null */
  hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  },
};

// ─────────────────────────────────────────────
//  CANVAS ENGINE
// ─────────────────────────────────────────────
const CanvasEngine = {
  canvas: null,
  ctx: null,
  dpr: 1,

  tool: 'pencil',   // pencil | eraser | bucket | shapes | stamps
  color: '#000000',
  size: 6,
  shape: 'line',    // line | rect | circle | triangle | star
  fill: true,
  stamp: null,

  isDown: false,
  last: { x: 0, y: 0 },
  start: { x: 0, y: 0 },
  snapshot: null,
  _shiftDown: false,

  undoStack: [],
  redoStack: [],
  _restoring: false,
  _resizeToken: 0,

  // ── init ──────────────────────────────────

  init() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true, alpha: false });

    this.resizeToContainer(false);
    this.fillWhite();

    this.restoreAutosave().then(() => {
      this.pushHistory('init');
      App.setStatusTool(this.tool);
    });

    this.bindPointerEvents();

    // track Shift key for shape constraining (Shift = square / perfect circle)
    window.addEventListener('keydown', e => { if (e.key === 'Shift') this._shiftDown = true; });
    window.addEventListener('keyup', e => { if (e.key === 'Shift') this._shiftDown = false; });
  },

  // ── pointer events ────────────────────────

  bindPointerEvents() {
    const c = this.canvas;
    c.addEventListener('pointerdown', e => this.onDown(e));
    c.addEventListener('pointermove', e => this.onMove(e));
    c.addEventListener('pointerup', e => this.onUp(e));
    c.addEventListener('pointercancel', e => this.onUp(e));
    c.addEventListener('contextmenu', e => e.preventDefault());
  },

  pointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  },

  setStyleForStroke() {
    const ctx = this.ctx;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  },

  onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.canvas.setPointerCapture?.(e.pointerId);

    this.isDown = true;
    const p = this.pointFromEvent(e);
    this.last = { ...p };
    this.start = { ...p };

    // ── bucket flood fill (instant, no drag needed) ──
    if (this.tool === 'bucket') {
      this.isDown = false;
      this.floodFill(p.x, p.y, this.color);
      this.pushHistory('fill');
      App.autosaveDebounced();
      return;
    }

    // ── stamps ──
    if (this.tool === 'stamps') {
      if (!this.stamp) { App.toast('Обери штамп 😊', 'info'); this.isDown = false; return; }
      this.placeStamp(p.x, p.y);
      this.isDown = false;
      this.pushHistory('stamp');
      App.autosaveDebounced();
      return;
    }

    // ── shapes — snapshot for live drag preview ──
    if (this.tool === 'shapes') {
      try { this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); }
      catch (_) { this.snapshot = null; }
    }
  },

  onMove(e) {
    if (!this.isDown) return;
    const p = this.pointFromEvent(e);

    if (this.tool === 'pencil') this.drawFreehand(p.x, p.y, false);
    if (this.tool === 'eraser') this.drawFreehand(p.x, p.y, true);
    if (this.tool === 'shapes') {
      this.restoreSnapshot();
      this.drawShapePreview(p.x, p.y);
    }
  },

  onUp(_e) {
    if (!this.isDown) return;
    this.isDown = false;

    if (this.tool === 'shapes') {
      this.snapshot = null;
      this.pushHistory('shape');
    } else if (this.tool === 'pencil' || this.tool === 'eraser') {
      this.pushHistory('stroke');
    }

    App.autosaveDebounced();
    App.setStatusTool(this.tool);
  },

  // ── drawing primitives ────────────────────

  drawFreehand(x, y, isEraser) {
    const ctx = this.ctx;
    this.setStyleForStroke();

    if (isEraser) {
      // Canvas is created with alpha:false, so destination-out paints black instead of erasing.
      // Correct approach: simply draw with white color using normal composite operation.
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.last.x, this.last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(this.last.x, this.last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    this.last = { x, y };
  },

  restoreSnapshot() {
    if (!this.snapshot) return;
    try { this.ctx.putImageData(this.snapshot, 0, 0); } catch (_) { }
  },

  /**
   * Draw shape preview while dragging.
   * Shift key constrains rect/circle to square/circle.
   */
  drawShapePreview(x, y) {
    this.setStyleForStroke();

    let sx = this.start.x;
    let sy = this.start.y;

    // Shift = constrained aspect ratio for rect and circle
    if (this._shiftDown && (this.shape === 'rect' || this.shape === 'circle')) {
      const dx = x - sx;
      const dy = y - sy;
      const side = Math.min(Math.abs(dx), Math.abs(dy));
      x = sx + Math.sign(dx) * side;
      y = sy + Math.sign(dy) * side;
    }

    switch (this.shape) {
      case 'line': this._shapeLine(sx, sy, x, y); break;
      case 'rect': this._shapeRect(sx, sy, x, y); break;
      case 'circle': this._shapeCircle(sx, sy, x, y); break;
      case 'triangle': this._shapeTriangle(sx, sy, x, y); break;
      case 'star': this._shapeStar(sx, sy, x, y); break;
    }
  },

  _shapeLine(x1, y1, x2, y2) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  },

  _shapeRect(x1, y1, x2, y2) {
    const ctx = this.ctx;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    if (this.fill) ctx.fill();
    ctx.stroke();
  },

  /**
   * FIX: Ellipse/circle via bounding-box (drag corner-to-corner).
   * Much more intuitive — you see exactly where the shape will land.
   * Shift (handled in drawShapePreview) constrains it to a perfect circle.
   */
  _shapeCircle(x1, y1, x2, y2) {
    const ctx = this.ctx;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
    if (this.fill) ctx.fill();
    ctx.stroke();
  },

  /**
   * FIX: Symmetric isosceles triangle.
   * Apex at top-center of the drag box, base at the bottom edge.
   * Works naturally regardless of drag direction.
   */
  _shapeTriangle(x1, y1, x2, y2) {
    const ctx = this.ctx;
    const midX = (x1 + x2) / 2;

    ctx.beginPath();
    ctx.moveTo(midX, y1);   // apex (top-center)
    ctx.lineTo(x2, y2);   // bottom-right
    ctx.lineTo(x1, y2);   // bottom-left
    ctx.closePath();
    if (this.fill) ctx.fill();
    ctx.stroke();
  },

  _shapeStar(x1, y1, x2, y2) {
    // Bounding-box approach (same as rect/circle):
    // center = midpoint of drag rectangle, outerR = half of smaller side.
    const ctx = this.ctx;
    const spikes = 5;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const outerR = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
    const innerR = outerR / 2.4;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    if (this.fill) ctx.fill();
    ctx.stroke();
  },

  // ── flood fill ────────────────────────────

  /**
   * Scanline BFS flood-fill.
   * cssX/cssY are CSS pixels; internally scaled to actual canvas pixels via DPR.
   */
  floodFill(cssX, cssY, fillHex) {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const w = canvas.width;
    const h = canvas.height;

    // CSS px → canvas px (account for DPR scaling)
    const px = Utils.clamp(Math.round(cssX * this.dpr), 0, w - 1);
    const py = Utils.clamp(Math.round(cssY * this.dpr), 0, h - 1);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const tol = Config.fillTolerance;
    const base = (px + py * w) * 4;
    const tR = d[base];
    const tG = d[base + 1];
    const tB = d[base + 2];
    const tA = d[base + 3];

    const fill = Utils.hexToRgb(fillHex);
    if (!fill) return;
    const { r: fR, g: fG, b: fB } = fill;

    // Already the target color — nothing to do
    if (Math.abs(tR - fR) <= tol && Math.abs(tG - fG) <= tol &&
      Math.abs(tB - fB) <= tol && tA === 255) return;

    const matches = i =>
      Math.abs(d[i] - tR) <= tol &&
      Math.abs(d[i + 1] - tG) <= tol &&
      Math.abs(d[i + 2] - tB) <= tol &&
      Math.abs(d[i + 3] - tA) <= tol;

    const setColor = i => {
      d[i] = fR;
      d[i + 1] = fG;
      d[i + 2] = fB;
      d[i + 3] = 255;
    };

    const visited = new Uint8Array(w * h);
    const stack = [py * w + px];
    visited[py * w + px] = 1;

    while (stack.length) {
      const pos = stack.pop();
      const row = Math.floor(pos / w);
      const col = pos % w;
      const i = pos * 4;

      if (!matches(i)) continue;
      setColor(i);

      const up = row - 1;
      const down = row + 1;
      const left = col - 1;
      const right = col + 1;

      if (up >= 0 && !visited[up * w + col]) { visited[up * w + col] = 1; stack.push(up * w + col); }
      if (down < h && !visited[down * w + col]) { visited[down * w + col] = 1; stack.push(down * w + col); }
      if (left >= 0 && !visited[row * w + left]) { visited[row * w + left] = 1; stack.push(row * w + left); }
      if (right < w && !visited[row * w + right]) { visited[row * w + right] = 1; stack.push(row * w + right); }
    }

    ctx.putImageData(imgData, 0, 0);
  },

  // ── stamps ────────────────────────────────

  placeStamp(x, y) {
    const ctx = this.ctx;
    const px = this.size * 5;
    ctx.save();
    ctx.font = `${px}px Nunito, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.fillText(this.stamp, x, y);
    ctx.restore();
  },

  // ── canvas management ─────────────────────

  fillWhite() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  },

  async resizeToContainer(preserve = true) {
    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) return;

    const token = ++this._resizeToken;
    const rect = wrap.getBoundingClientRect();
    const cssW = Math.floor(rect.width);
    const cssH = Math.floor(rect.height);

    if (cssW < 50 || cssH < 50) {
      requestAnimationFrame(() => this.resizeToContainer(preserve));
      return;
    }

    let dataURL = null;
    if (preserve) {
      try { dataURL = this.canvas.toDataURL('image/png'); } catch (_) { dataURL = null; }
    }

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.floor(cssW * this.dpr);
    this.canvas.height = Math.floor(cssH * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.fillWhite();
    if (dataURL) await this._drawImageURL(dataURL, token);
  },

  async _drawImageURL(url, token = 0) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;

    await new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });

    if (token && token !== this._resizeToken) return;

    const rect = this.canvas.getBoundingClientRect();
    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
    this.ctx.restore();
  },

  // ── history ───────────────────────────────

  pushHistory(_reason = '') {
    if (this._restoring) return;
    let url;
    try { url = this.canvas.toDataURL('image/png'); } catch (_) { return; }

    const last = this.undoStack[this.undoStack.length - 1];
    if (last === url) return;

    this.undoStack.push(url);
    if (this.undoStack.length > Config.historyLimit) this.undoStack.shift();
    this.redoStack.length = 0;
    App.updateUndoRedoButtons();
  },

  async undo() {
    if (this.undoStack.length <= 1) return App.toast('Нема що скасувати 😊', 'info');
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    await this.restoreFromDataURL(this.undoStack[this.undoStack.length - 1], true);
    App.updateUndoRedoButtons();
  },

  async redo() {
    if (!this.redoStack.length) return App.toast('Нема що повторити 😊', 'info');
    const next = this.redoStack.pop();
    this.undoStack.push(next);
    await this.restoreFromDataURL(next, true);
    App.updateUndoRedoButtons();
  },

  async restoreFromDataURL(url, keepHistory = false) {
    this._restoring = true;
    this.fillWhite();
    await this._drawImageURL(url);
    this._restoring = false;
    if (!keepHistory) this.pushHistory('restore');
  },

  // ── autosave ──────────────────────────────

  autosave() {
    try {
      const dataURL = this.canvas.toDataURL('image/jpeg', 0.75);
      localStorage.setItem(Config.autosaveKey, dataURL);
    } catch (e) {
      if (e?.name === 'QuotaExceededError') {
        try { localStorage.removeItem(Config.autosaveKey); } catch (_) { }
      }
      App.toast('Не вдалось автозберегти', 'warning');
    }
  },

  async restoreAutosave() {
    let url = null;
    try { url = localStorage.getItem(Config.autosaveKey); } catch (_) { }
    if (!url) return;
    try {
      await this.restoreFromDataURL(url, true);
      App.toast('Відновив малюнок ✅', 'success');
    } catch (_) { }
  },

  clearAll() {
    this.fillWhite();
    try { localStorage.removeItem(Config.autosaveKey); } catch (_) { }
    this.pushHistory('clear');
  },

  async loadImageFile(file) {
    const reader = new FileReader();
    const url = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read error'));
      reader.readAsDataURL(file);
    });
    await this.restoreFromDataURL(url, true);
    this.pushHistory('open');
    App.autosaveDebounced();
  },
};

// ─────────────────────────────────────────────
//  APP
// ─────────────────────────────────────────────
const App = {
  _toastLock: 0,
  extraMode: null,           // null | 'shapes' | 'stamps'
  lastPrimaryTool: 'pencil', // remember last pencil / eraser / bucket

  init() {
    this.updateViewport();
    this.initTheme();
    this.bindUI();
    this.bindShortcuts();
    this.updateExtraVars();
    CanvasEngine.init();
    this.selectTool('pencil');
    this.updateExtraVars();

    const onResize = Utils.debounce(() => {
      this.updateViewport();
      this.updateExtraVars();
      CanvasEngine.resizeToContainer(true);
    }, 150);

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
  },

  // ── UI binding ────────────────────────────

  bindUI() {
    this.renderColors();

    // size slider
    const size = document.getElementById('size');
    const badge = document.getElementById('size-badge');
    size.addEventListener('input', () => {
      const v = Number(size.value || 1);
      CanvasEngine.size = Utils.clamp(v, 1, 40);
      badge.textContent = String(CanvasEngine.size);
    });

    // file open
    const input = document.getElementById('file-input');
    input.addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      input.value = '';
      if (!file) return;
      if (file.size > 3_000_000) return App.toast('Файл надто великий (макс. 3 МБ)', 'error');
      App.showModal('Відкрити зображення?', 'Це замінить твій поточний малюнок. Продовжити?', [
        {
          text: 'ТАК, ВІДКРИТИ', class: 'bg-neo-blue text-white py-4',
          action: async () => { await CanvasEngine.loadImageFile(file); App.toast('Відкрито!', 'success'); }
        },
        { text: 'НІ, СКАСУВАТИ', class: 'bg-gray-200 py-4', action: () => { } },
      ]);
    });

    // shape buttons
    document.querySelectorAll('#panel-shapes [data-shape]').forEach(btn => {
      btn.onmousedown = e => e.preventDefault();
      btn.addEventListener('click', () => {
        document.querySelectorAll('#panel-shapes [data-shape]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        CanvasEngine.shape = btn.dataset.shape;
      });
    });
    document.querySelector('#panel-shapes [data-shape="line"]')?.classList.add('active');

    // fill toggle (for shapes)
    const fillToggle = document.getElementById('fill-toggle');
    fillToggle?.addEventListener('change', () => {
      CanvasEngine.fill = !!fillToggle.checked;
      App.toast(CanvasEngine.fill ? 'Заливка фігур: ON' : 'Заливка фігур: OFF', 'info');
    });

    // custom color picker
    const customColor = document.getElementById('custom-color');
    customColor?.addEventListener('input', () => {
      document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
      CanvasEngine.color = customColor.value;
    });
  },

  bindShortcuts() {
    window.addEventListener('keydown', e => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'Escape') { this.hideModal(); return; }
      if (!ctrl) return;

      const key = (e.key || '').toLowerCase();
      if (key === 's') { e.preventDefault(); this.save(); }
      if (key === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      if (key === 'y') { e.preventDefault(); this.redo(); }
    });
  },

  // ── tool management ───────────────────────

  /**
   * Primary tools (pencil, eraser, bucket) close the extra panel.
   * Shapes / stamps are toggles handled by toggleExtra().
   */
  selectTool(tool) {
    if (tool === 'pencil' || tool === 'eraser' || tool === 'bucket') {
      this.lastPrimaryTool = tool;
      this.hideExtra();
      this.applyTool(tool);
      this.setStatusTool(tool);
      return;
    }
    this.applyTool(tool);
    this.setStatusTool(tool);
  },

  toggleExtra(mode) {
    if (this.extraMode === mode) {
      // clicking the same button closes the panel
      this.hideExtra();
      this.applyTool(this.lastPrimaryTool);
      this.setStatusTool(this.lastPrimaryTool);
      return;
    }

    if (['pencil', 'eraser', 'bucket'].includes(CanvasEngine.tool)) {
      this.lastPrimaryTool = CanvasEngine.tool;
    }

    this.extraMode = mode;
    this.showExtra(mode);
    this.applyTool(mode);
    this.setStatusTool(mode);
  },

  applyTool(tool) {
    CanvasEngine.tool = tool;

    const bP = document.getElementById('tool-pencil');
    const bE = document.getElementById('tool-eraser');
    const bB = document.getElementById('tool-bucket');
    const bS = document.getElementById('tool-shapes');
    const bT = document.getElementById('tool-stamps');

    if (bP) bP.classList.toggle('active', tool === 'pencil');
    if (bE) bE.classList.toggle('active', tool === 'eraser');
    if (bB) bB.classList.toggle('active', tool === 'bucket');
    if (bS) bS.classList.toggle('active', this.extraMode === 'shapes');
    if (bT) bT.classList.toggle('active', this.extraMode === 'stamps');
  },

  showExtra(mode) {
    const extra = document.getElementById('extra-toolbar');
    const pShapes = document.getElementById('panel-shapes');
    const pStamps = document.getElementById('panel-stamps');

    extra.classList.remove('hidden');

    pShapes.classList.toggle('hidden', mode !== 'shapes');
    pShapes.classList.toggle('flex', mode === 'shapes');
    pStamps.classList.toggle('hidden', mode !== 'stamps');
    pStamps.classList.toggle('flex', mode === 'stamps');

    if (mode === 'stamps') this.ensureStamps();

    requestAnimationFrame(() => this.updateExtraVars());
  },

  hideExtra() {
    if (!this.extraMode) { this.updateExtraVars(); return; }
    this.extraMode = null;

    const extra = document.getElementById('extra-toolbar');
    const pShapes = document.getElementById('panel-shapes');
    const pStamps = document.getElementById('panel-stamps');

    pShapes.classList.add('hidden'); pShapes.classList.remove('flex');
    pStamps.classList.add('hidden'); pStamps.classList.remove('flex');
    extra.classList.add('hidden');

    this.updateExtraVars();
  },

  // reserve teal height and place it exactly under the purple toolbar
  updateExtraVars() {
    const tools = document.getElementById('tools-toolbar');
    if (!tools) return;
    const top = Math.round(tools.getBoundingClientRect().bottom);
    document.body.style.setProperty('--extra-top', `${top}px`);
  },

  // ── colors ────────────────────────────────

  renderColors() {
    const palette = document.getElementById('palette');
    palette.innerHTML = '';

    Config.colors.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `color-swatch ${idx === 0 ? 'active' : ''}`;
      btn.style.backgroundColor = c.hex;
      btn.dataset.hex = c.hex;
      btn.title = c.name;
      btn.setAttribute('aria-label', `Колір: ${c.name}`);
      btn.onmousedown = e => e.preventDefault();
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        CanvasEngine.color = c.hex;
      });
      palette.appendChild(btn);
    });

    CanvasEngine.color = Config.colors[0].hex;
  },

  // ── stamps ────────────────────────────────

  ensureStamps() {
    const container = document.getElementById('stamps');
    if (container.children.length) return;
    this.shuffleStamps();
  },

  shuffleStamps() {
    const container = document.getElementById('stamps');
    container.innerHTML = '';

    const arr = [...Config.stamps];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    arr.slice(0, 10).forEach((emoji, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-3xl sm:text-4xl hover:scale-125 transition active:scale-90 select-none';
      btn.textContent = emoji;
      btn.setAttribute('aria-label', `Штамп ${emoji}`);
      btn.onmousedown = e => e.preventDefault();
      btn.addEventListener('click', () => {
        [...container.children].forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        CanvasEngine.stamp = emoji;
        App.toast('Штамп обрано! 🎨', 'success');
      });
      container.appendChild(btn);

      // Pre-select the first stamp silently (no toast) so user can draw immediately
      if (idx === 0) {
        btn.classList.add('active');
        CanvasEngine.stamp = emoji;
      }
    });
  },

  // ── actions ───────────────────────────────

  autosaveDebounced: Utils.debounce(() => CanvasEngine.autosave(), 900),

  askClear() {
    this.showModal('Очистити полотно?', 'Твій малюнок зникне назавжди. Ти впевнений?', [
      {
        text: 'ТАК, ОЧИСТИТИ', class: 'bg-neo-red text-white py-4',
        action: () => { CanvasEngine.clearAll(); App.toast('Очищено!', 'success'); }
      },
      { text: 'НІ, ЗАЛИШИТИ', class: 'bg-gray-200 py-4', action: () => { } },
    ]);
  },

  async undo() { await CanvasEngine.undo(); this.autosaveDebounced(); },
  async redo() { await CanvasEngine.redo(); this.autosaveDebounced(); },

  save() {
    try {
      const url = CanvasEngine.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const date = new Date().toLocaleDateString('uk-UA').replace(/\./g, '-');
      a.download = `мій-малюнок-${date}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      this.toast('Збережено!', 'success');
    } catch (_) {
      this.toast('Не вдалось зберегти', 'error');
    }
  },

  updateUndoRedoButtons() {
    const undoBtn = document.querySelector('[onclick="App.undo()"]');
    const redoBtn = document.querySelector('[onclick="App.redo()"]');
    if (undoBtn) undoBtn.disabled = CanvasEngine.undoStack.length <= 1;
    if (redoBtn) redoBtn.disabled = CanvasEngine.redoStack.length === 0;
  },

  setStatusTool(tool) {
    const el = document.getElementById('status');
    if (!el) return;
    const map = {
      pencil: 'ОЛІВЕЦЬ',
      eraser: 'ГУМКА',
      bucket: 'ЗАЛИВКА',
      shapes: 'ФІГУРИ',
      stamps: 'ШТАМПИ',
    };
    el.textContent = map[tool] || 'ІНСТРУМЕНТ';
  },

  updateViewport() {
    const vh = (window.innerHeight || 800) * 0.01;
    document.documentElement.style.setProperty('--app-vh', `${vh}px`);
  },

  // ── theme ─────────────────────────────────

  initTheme() {
    let isDark = false;
    try { isDark = localStorage.getItem(Config.themeKey) === 'dark'; } catch (_) { }
    document.documentElement.classList.toggle('dark', isDark);
    const icon = document.getElementById('theme-icon');
    icon.className = isDark ? 'fas fa-sun text-lg sm:text-xl' : 'fas fa-moon text-lg sm:text-xl';
  },

  toggleTheme() {
    const isDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem(Config.themeKey, isDark ? 'dark' : 'light'); } catch (_) { }
    document.getElementById('theme-icon').className =
      isDark ? 'fas fa-sun text-lg sm:text-xl' : 'fas fa-moon text-lg sm:text-xl';
  },

  // ── modal ─────────────────────────────────

  showModal(title, msg, actions) {
    const m = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent = msg;

    const container = document.getElementById('modal-actions');
    container.innerHTML = '';

    actions.forEach(a => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `neo-btn uppercase font-black text-base sm:text-lg ${a.class}`;
      b.textContent = a.text;
      b.onclick = async () => {
        try { await a.action?.(); } finally { this.hideModal(); }
      };
      container.appendChild(b);
    });

    m.classList.remove('hidden');
    m.classList.add('flex');
    m.setAttribute('aria-hidden', 'false');
    m.onmousedown = e => { if (e.target === m) this.hideModal(); };

    // focus first button for keyboard accessibility
    const firstBtn = container.querySelector('button');
    if (firstBtn) firstBtn.focus();
  },

  hideModal() {
    const m = document.getElementById('modal');
    m.classList.add('hidden');
    m.classList.remove('flex');
    m.setAttribute('aria-hidden', 'true');
  },

  // ── toasts ────────────────────────────────

  toast(text, type = 'info') {
    const now = Utils.now();
    if (now - this._toastLock < 600) return;
    this._toastLock = now;

    const container = document.getElementById('toasts');
    while (container.children.length >= Config.toastLimit) container.removeChild(container.firstChild);

    const t = document.createElement('div');
    const colors = {
      info: 'bg-neo-dark text-white',
      success: 'bg-neo-green text-black',
      warning: 'bg-neo-yellow text-black',
      error: 'bg-neo-red text-white',
    };
    t.className = `${colors[type] || colors.info} border-4 border-black px-8 py-3 rounded-full font-black text-lg shadow-neo toast-anim`;
    t.setAttribute('role', 'status');
    t.textContent = text;
    container.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  },
};

// ─────────────────────────────────────────────
//  GLOBAL EXPOSURE
// ─────────────────────────────────────────────
window.Config = Config;
window.Utils = Utils;
window.CanvasEngine = CanvasEngine;
window.App = App;

window.addEventListener('DOMContentLoaded', () => App.init());
