/* Віконце — Малюнок (простий графічний редактор, .png). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs, bus } = VOS;

  const W = 800, H = 520;
  const COLORS = ['#000000', '#868e96', '#ffffff', '#e03131', '#f76707', '#ffd43b', '#2f9e44', '#94d82d', '#1971c2', '#4dabf7', '#7048e8', '#e64980', '#8d5524', '#ffc9a8'];
  const TOOLS = [
    { id: 'pen', icon: 'pencil', name: tr('Олівець') },
    { id: 'brush', icon: 'brush', name: tr('Пензель') },
    { id: 'eraser', icon: 'eraser', name: tr('Гумка') },
    { id: 'fill', icon: 'bucket', name: tr('Заливка') },
    { id: 'line', icon: 'line', name: tr('Лінія') },
    { id: 'rect', icon: 'rect', name: tr('Прямокутник') },
    { id: 'ellipse', icon: 'circle', name: tr('Овал') },
    { id: 'stamp', icon: 'star', name: tr('Наліпка') },
  ];
  // Наліпки — власні SVG-малюнки (однакові на всіх пристроях), на полотно ставляться як зображення
  const STAMPS = ['st-star', 'st-heart', 'st-flower', 'st-sun', 'st-rainbow', 'av-cat', 'av-dog', 'st-butterfly', 'st-apple', 'st-car', 'st-house', 'st-balloon'];
  const stampImgs = {};
  function stampImage(name) {
    if (!stampImgs[name]) { const img = new Image(); img.src = VOS.icons.dataUrl(name, 128); stampImgs[name] = img; }
    return stampImgs[name];
  }
  const SIZES = [3, 8, 16, 28];

  function hexToRgba(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 255];
  }

  function floodFill(ctx, x, y, hex) {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const idx = (x, y) => (y * W + x) * 4;
    const start = idx(x, y);
    const target = [d[start], d[start + 1], d[start + 2], d[start + 3]];
    const fill = hexToRgba(hex);
    const tol = 40;
    const same = (i) => Math.abs(d[i] - target[0]) <= tol && Math.abs(d[i + 1] - target[1]) <= tol && Math.abs(d[i + 2] - target[2]) <= tol && Math.abs(d[i + 3] - target[3]) <= tol;
    if (fill.every((v, i) => Math.abs(v - target[i]) <= 2)) return;
    const seen = new Uint8Array(W * H);
    const stack = [[x, y]];
    while (stack.length) {
      let [cx, cy] = stack.pop();
      while (cx >= 0 && same(idx(cx, cy)) && !seen[cy * W + cx]) cx--;
      cx++;
      let up = false, down = false;
      while (cx < W && same(idx(cx, cy)) && !seen[cy * W + cx]) {
        const i = idx(cx, cy);
        d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = 255;
        seen[cy * W + cx] = 1;
        if (cy > 0) {
          const u = same(idx(cx, cy - 1)) && !seen[(cy - 1) * W + cx];
          if (u && !up) { stack.push([cx, cy - 1]); up = true; } else if (!u) up = false;
        }
        if (cy < H - 1) {
          const dn = same(idx(cx, cy + 1)) && !seen[(cy + 1) * W + cx];
          if (dn && !down) { stack.push([cx, cy + 1]); down = true; } else if (!dn) down = false;
        }
        cx++;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function launch(args) {
    let fileId = null, dirty = false, revision = 0;
    let tool = 'brush', color = '#e03131', size = SIZES[1], stamp = STAMPS[0];
    const undo = [], redo = [];

    const canvas = el('canvas.pt-canvas', { width: W, height: H, 'aria-label': tr('Полотно для малювання') });
    const overlay = el('canvas.pt-overlay', { width: W, height: H, 'aria-hidden': 'true' });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const octx = overlay.getContext('2d');
    const clear = () => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); };
    clear();

    const snapshot = () => { undo.push(ctx.getImageData(0, 0, W, H)); if (undo.length > 25) undo.shift(); redo.length = 0; };
    const markDirty = () => { revision++; dirty = true; refreshTitle(); };

    // Панель інструментів
    const toolsBox = el('div.pt-tools', { role: 'toolbar', 'aria-label': tr('Інструменти') });
    TOOLS.forEach((t) => toolsBox.append(el('button.pt-tool', { type: 'button', title: t.name, 'aria-label': t.name, dataset: { tool: t.id, hint: 'pt-' + t.id } }, VOS.icon(t.icon))));
    const sizesBox = el('div.pt-sizes', { role: 'toolbar', 'aria-label': tr('Товщина') });
    SIZES.forEach((s) => sizesBox.append(el('button.pt-size', { type: 'button', title: tr('Товщина ') + s, dataset: { size: s } }, el('span', { style: { width: Math.min(s, 22) + 'px', height: Math.min(s, 22) + 'px' } }))));
    const palette = el('div.pt-palette', { role: 'toolbar', 'aria-label': tr('Кольори') });
    COLORS.forEach((c) => palette.append(el('button.pt-color', { type: 'button', title: c, 'aria-label': tr('Колір ') + c, style: { background: c }, dataset: { color: c } })));
    const custom = el('input.pt-custom', { type: 'color', value: color, title: tr('Свій колір'), 'aria-label': tr('Свій колір') });
    palette.append(custom);
    STAMPS.forEach(stampImage);
    const stampsBox = el('div.pt-stamps', { hidden: true });
    STAMPS.forEach((s) => stampsBox.append(el('button.pt-stamp', { type: 'button', dataset: { stamp: s } }, VOS.icon(s))));

    function syncUI() {
      toolsBox.querySelectorAll('.pt-tool').forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
      sizesBox.querySelectorAll('.pt-size').forEach((b) => b.classList.toggle('active', +b.dataset.size === size));
      palette.querySelectorAll('.pt-color').forEach((b) => b.classList.toggle('active', b.dataset.color === color));
      stampsBox.querySelectorAll('.pt-stamp').forEach((b) => b.classList.toggle('active', b.dataset.stamp === stamp));
      stampsBox.hidden = tool !== 'stamp';
      canvasWrap.dataset.tool = tool;
    }
    toolsBox.addEventListener('click', (e) => { const b = e.target.closest('.pt-tool'); if (b) { tool = b.dataset.tool; syncUI(); } });
    sizesBox.addEventListener('click', (e) => { const b = e.target.closest('.pt-size'); if (b) { size = +b.dataset.size; syncUI(); } });
    palette.addEventListener('click', (e) => { const b = e.target.closest('.pt-color'); if (b) { color = b.dataset.color; custom.value = color; if (tool === 'eraser') tool = 'brush'; syncUI(); } });
    custom.addEventListener('input', () => { color = custom.value; syncUI(); });
    stampsBox.addEventListener('click', (e) => { const b = e.target.closest('.pt-stamp'); if (b) { stamp = b.dataset.stamp; syncUI(); } });

    const canvasWrap = el('div.pt-canvas-wrap', el('div.pt-stage', canvas, overlay));

    // Малювання
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [Math.round(((e.clientX - r.left) / r.width) * W), Math.round(((e.clientY - r.top) / r.height) * H)];
    };
    let drawing = null;
    function stroke(c, from, to, col, w) {
      c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(from[0], from[1]); c.lineTo(to[0], to[1]); c.stroke();
    }
    function shape(c, a, b) {
      c.strokeStyle = color; c.lineWidth = Math.max(2, size / 2); c.lineCap = 'round';
      c.beginPath();
      if (tool === 'line') { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      else if (tool === 'rect') c.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      else if (tool === 'ellipse') c.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2, Math.abs(b[1] - a[1]) / 2, 0, 0, Math.PI * 2);
      c.stroke();
    }
    overlay.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      try { overlay.setPointerCapture(e.pointerId); } catch (er) { /* синтетичні події */ }
      const p = pos(e);
      snapshot();
      if (tool === 'fill') {
        floodFill(ctx, VOS.clamp(p[0], 0, W - 1), VOS.clamp(p[1], 0, H - 1), color);
        markDirty();
        bus.emit('paint:draw', { tool, winId: win.id });
        return;
      }
      if (tool === 'stamp') {
        const img = stampImage(stamp);
        const d = size * 3.5 + 30;
        const put = () => { ctx.drawImage(img, p[0] - d / 2, p[1] - d / 2, d, d); };
        if (img.complete && img.naturalWidth) put(); else img.addEventListener('load', put, { once: true });
        markDirty();
        bus.emit('paint:draw', { tool, winId: win.id });
        return;
      }
      drawing = { start: p, last: p, moved: false };
      if (tool === 'pen' || tool === 'brush' || tool === 'eraser') {
        const w = tool === 'pen' ? Math.max(1, size / 3) : tool === 'eraser' ? size * 1.6 : size;
        stroke(ctx, p, [p[0] + 0.1, p[1]], tool === 'eraser' ? '#ffffff' : color, w);
      }
    });
    overlay.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      drawing.moved = true;
      if (tool === 'pen' || tool === 'brush' || tool === 'eraser') {
        const w = tool === 'pen' ? Math.max(1, size / 3) : tool === 'eraser' ? size * 1.6 : size;
        stroke(ctx, drawing.last, p, tool === 'eraser' ? '#ffffff' : color, w);
        drawing.last = p;
      } else {
        octx.clearRect(0, 0, W, H);
        shape(octx, drawing.start, p);
        drawing.last = p;
      }
    });
    const end = () => {
      if (!drawing) return;
      if (['line', 'rect', 'ellipse'].includes(tool)) {
        octx.clearRect(0, 0, W, H);
        if (drawing.moved) shape(ctx, drawing.start, drawing.last);
        else { undo.pop(); drawing = null; return; }
      }
      drawing = null;
      markDirty();
      bus.emit('paint:draw', { tool, winId: win.id });
    };
    overlay.addEventListener('pointerup', end);
    overlay.addEventListener('pointercancel', end);

    function doUndo() { if (!undo.length) return; redo.push(ctx.getImageData(0, 0, W, H)); ctx.putImageData(undo.pop(), 0, 0); markDirty(); }
    function doRedo() { if (!redo.length) return; undo.push(ctx.getImageData(0, 0, W, H)); ctx.putImageData(redo.pop(), 0, 0); markDirty(); }

    // Файли
    const refreshTitle = () => {
      const n = fileId && fs.get(fileId);
      win.setTitle((dirty ? '• ' : '') + (n ? n.name : tr('Безіменний')) + tr(' — Малюнок'));
    };
    function loadImage(id) {
      const n = fs.get(id);
      if (!n || !n.content) return;
      const img = new Image();
      img.onload = () => {
        clear();
        const k = Math.min(W / img.width, H / img.height, 1);
        const w = img.width * k, h = img.height * k;
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        fileId = id; dirty = false; undo.length = 0; refreshTitle();
      };
      img.src = n.content;
    }
    let savePromise = null;
    function save(as) {
      if (savePromise) return savePromise;
      const pending = saveNow(as);
      savePromise = pending;
      return pending.finally(() => { if (savePromise === pending) savePromise = null; });
    }

    async function saveNow(as) {
      const saveVersion = revision;
      const data = canvas.toDataURL('image/png');
      const n = fileId && fs.get(fileId);
      if (!as && n && !fs.isInTrash(fileId)) {
        try { fs.write(fileId, data); }
        catch (e) { VOS.dialog.error(e.message); return false; }
      }
      else {
        const r = await VOS.dialog.saveAs({ ext: 'png', name: n ? n.name : tr('Мій малюнок.png'), folder: n ? n.parent : 'pics', defaultFolder: 'pics', title: tr('Зберегти малюнок') });
        if (!r) return false;
        try {
          if (r.replaceId) { fs.write(r.replaceId, data); fileId = r.replaceId; }
          else fileId = fs.createFile(r.folder, r.name, data).id;
        } catch (e) { VOS.dialog.error(e.message); return false; }
      }
      try { await fs.flush(); }
      catch (e) { dirty = true; refreshTitle(); VOS.dialog.error(tr('Не вдалося зберегти малюнок. Перевір вільне місце й спробуй ще раз.')); return false; }
      const savedNode = fs.get(fileId);
      if (!savedNode) { dirty = true; refreshTitle(); VOS.dialog.error(tr('Файл зник під час збереження. Збережи малюнок як новий файл.')); return false; }
      dirty = revision !== saveVersion;
      refreshTitle();
      VOS.toast(tr('Малюнок збережено: ') + savedNode.name, 'save');
      bus.emit('paint:save', { node: savedNode, winId: win.id });
      return true;
    }
    async function confirmDiscard() {
      while (true) {
        if (savePromise) await savePromise;
        if (!dirty) return true;
        const r = await VOS.dialog.choice(tr('Зберегти зміни в малюнку?'), [
          { label: tr('Зберегти'), value: 'save', primary: true }, { label: tr('Не зберігати'), value: 'no', danger: true }, { label: tr('Скасувати'), value: 'cancel' },
        ], { title: tr('Малюнок'), icon: 'palette' });
        if (r === 'save') { if (!(await save(false))) return false; continue; }
        return r === 'no';
      }
    }

    const bar = VOS.menubar([
      { label: tr('Файл'), hint: 'pt-file', items: () => [
        { label: tr('Створити'), icon: 'file-text', action: async () => { if (await confirmDiscard()) { snapshot(); clear(); fileId = null; dirty = false; refreshTitle(); } } },
        { label: tr('Відкрити…'), icon: 'folder-open', action: async () => { if (!(await confirmDiscard())) return; const id = await VOS.dialog.openFile({ exts: ['png', 'jpg', 'jpeg'], folder: 'pics', title: tr('Відкрити малюнок') }); if (id) loadImage(id); } },
        { label: tr('Зберегти'), icon: 'save', hint: 'pt-save', action: () => save(false) },
        { label: tr('Зберегти як…'), icon: 'save', action: () => save(true) },
        { sep: true },
        { label: tr('Закрити'), icon: 'x', action: () => win.close() },
      ] },
      { label: tr('Правка'), items: [
        { label: tr('Скасувати'), icon: 'undo', action: doUndo },
        { label: tr('Повторити'), icon: 'redo', action: doRedo },
        { sep: true },
        { label: tr('Очистити все'), icon: 'trash-x', danger: true, action: () => { snapshot(); clear(); markDirty(); } },
      ] },
    ]);
    const quick = el('div.np-quick',
      el('button.tb-btn.wide', { type: 'button', title: tr('Зберегти (Ctrl+S)'), dataset: { hint: 'pt-savebtn' }, on: { click: () => save(false) } }, VOS.icon('save'), el('span.tb-label', tr(' Зберегти'))),
      el('button.tb-btn', { type: 'button', title: tr('Скасувати (Ctrl+Z)'), 'aria-label': tr('Скасувати'), on: { click: doUndo } }, VOS.icon('undo')),
      el('button.tb-btn', { type: 'button', title: tr('Повторити (Ctrl+Y)'), 'aria-label': tr('Повторити'), on: { click: doRedo } }, VOS.icon('redo')));

    const root = el('div.app-paint', { tabindex: '0' },
      el('div.np-bars', bar, quick),
      el('div.pt-toolbar', toolsBox, sizesBox, palette),
      stampsBox,
      canvasWrap);
    root.addEventListener('keydown', (e) => {
      const c = e.ctrlKey || e.metaKey;
      if (c && e.code === 'KeyZ') { e.preventDefault(); doUndo(); }
      if (c && e.code === 'KeyY') { e.preventDefault(); doRedo(); }
      if (c && e.code === 'KeyS') { e.preventDefault(); save(e.shiftKey); }
    });

    const win = VOS.wm.open({ app: 'paint', title: tr('Безіменний — Малюнок'), icon: 'palette', content: root, width: 860, height: 620, minWidth: 340, minHeight: 300, beforeClose: () => confirmDiscard() });
    syncUI();
    if (args.file) loadImage(args.file); else refreshTitle();
    return win;
  }

  VOS.apps.register({ id: 'paint', name: 'Малюнок', icon: 'palette', color: '#f06595', category: 'standard', desc: tr('Малюй і зберігай малюнки'), exts: ['png'], launch });
})();
