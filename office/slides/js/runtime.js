; (function () {
  'use strict';

  /* ── utils ───────────────────────────────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function uid() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function deepClone(v) { return JSON.parse(JSON.stringify(v)); }
  function debounce(fn, delay = 200) {
    let t = null;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
  }
  function downloadTextFile(filename, text, mime = 'application/json') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function readFileAsText(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ''));
      r.onerror = () => rej(r.error);
      r.readAsText(file);
    });
  }
  function readFileAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ''));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  }
  function getTextFromContentEditable(node) {
    return (node?.textContent || '').replace(/\r/g, '');
  }

  /* ── constants ───────────────────────────────────────────── */
  const STORAGE_KEY = 'art_slides_v1';
  const MAX_HISTORY = 80;
  const STAGE_WIDTH = 960;
  const STAGE_HEIGHT = 540;

  const COLOR_PALETTE = [
    '#000000', '#ffffff', '#dc2626', '#f97316', '#f59e0b', '#eab308',
    '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#ec4899', '#64748b', '#1e293b', '#fecaca', '#fde68a', '#bfdbfe'
  ];

  const FONT_SIZES = [20, 28, 40, 56, 72];

  const DEFAULT_TEXT_STYLE = {
    fontSize: 28, color: '#111827',
    bold: false, italic: false, underline: false, align: 'left'
  };
  const DEFAULT_SHAPE_STYLE = { fill: '#dbeafe', stroke: '#1d4ed8' };

  /* ── state ───────────────────────────────────────────────── */
  const state = {
    fileName: 'моя презентація',
    slides: [],
    currentSlideId: null,
    selectedElementId: null,
    clipboard: null,
    undoStack: [],
    redoStack: [],
    unsavedChanges: false,
    suppressHistory: false,
    currentColorTarget: 'background',
    presentationIndex: 0
  };

  let modalHandlerAbort = null;

  function applyPresentationData(data) {
    state.fileName = data.fileName || 'моя презентація';
    state.slides = Array.isArray(data.slides) ? data.slides : [];
    state.currentSlideId = data.currentSlideId || state.slides[0]?.id || null;
    state.selectedElementId = data.selectedElementId || null;
  }
  function serializePresentation() {
    return {
      fileName: state.fileName,
      slides: deepClone(state.slides),
      currentSlideId: state.currentSlideId,
      selectedElementId: state.selectedElementId
    };
  }
  function getCurrentSlide() {
    return state.slides.find(s => s.id === state.currentSlideId) || state.slides[0] || null;
  }
  function getCurrentSlideIndex() {
    return state.slides.findIndex(s => s.id === state.currentSlideId);
  }
  function getSelectedElement() {
    const slide = getCurrentSlide();
    if (!slide) return null;
    return slide.elements.find(el => el.id === state.selectedElementId) || null;
  }

  /* ── storage ─────────────────────────────────────────────── */
  function saveDraft(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { } }
  function loadDraft() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
  function clearDraft() { try { localStorage.removeItem(STORAGE_KEY); } catch { } }

  /* ── history ─────────────────────────────────────────────── */
  function resetHistory() {
    state.undoStack = [deepClone(serializePresentation())];
    state.redoStack = [];
  }
  function pushHistory() {
    if (state.suppressHistory) return;
    const snap = deepClone(serializePresentation());
    const last = state.undoStack[state.undoStack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snap)) return;
    state.undoStack.push(snap);
    if (state.undoStack.length > MAX_HISTORY) state.undoStack.shift();
    state.redoStack = [];
  }
  function undo() {
    if (state.undoStack.length <= 1) return false;
    state.redoStack.push(state.undoStack.pop());
    applyPresentationData(deepClone(state.undoStack[state.undoStack.length - 1]));
    return true;
  }
  function redo() {
    if (!state.redoStack.length) return false;
    const next = deepClone(state.redoStack.pop());
    state.undoStack.push(deepClone(next));
    applyPresentationData(next);
    return true;
  }

  /* ── templates ───────────────────────────────────────────── */
  function mkTextStyle(s = {}) { return { ...DEFAULT_TEXT_STYLE, ...s }; }
  function mkShapeStyle(s = {}) { return { ...DEFAULT_TEXT_STYLE, ...DEFAULT_SHAPE_STYLE, ...s }; }

  function createTextElement(ov = {}) {
    const placeholder = ov.placeholder ?? 'Введіть текст…';
    const isPlaceholder = ov.isPlaceholder ?? (ov.content == null);
    const content = ov.content ?? placeholder;
    return {
      id: uid(), type: 'text', shape: null,
      x: 180, y: 150, w: 600, h: 120, z: 1, rotation: 0,
      content, placeholder, isPlaceholder,
      style: mkTextStyle(),
      ...ov,
      content, placeholder, isPlaceholder,
      style: mkTextStyle(ov.style || {})
    };
  }

  function createShapeElement(kind = 'rect', ov = {}) {
    // FIX #6: proper per-kind sizes so shapes are not squished
    const sizes = {
      rect: { x: 285, y: 160, w: 280, h: 190 },
      circle: { x: 330, y: 170, w: 200, h: 200 },
      triangle: { x: 320, y: 160, w: 200, h: 180 }
    };
    const s = sizes[kind] || sizes.rect;
    return {
      id: uid(), type: 'shape', shape: kind,
      x: s.x, y: s.y, w: s.w, h: s.h, z: 1, rotation: 0, content: '',
      style: mkShapeStyle(),
      ...ov,
      style: mkShapeStyle(ov.style || {})
    };
  }

  function createImageElement(src, ov = {}) {
    return {
      id: uid(), type: 'image', shape: null,
      x: 260, y: 150, w: 420, h: 240, z: 1, rotation: 0, content: src,
      style: mkTextStyle(),
      ...ov,
      style: mkTextStyle(ov.style || {})
    };
  }

  // FIX #2: createBasicSlideElements — called for every new slide
  function createBasicSlideElements() {
    return [
      createTextElement({
        x: 70, y: 52, w: 820, h: 86, z: 1,
        placeholder: 'Заголовок слайда',
        content: 'Заголовок слайда',
        isPlaceholder: true,
        style: { fontSize: 40, bold: true, color: '#94a3b8' }
      }),
      createTextElement({
        x: 84, y: 166, w: 792, h: 250, z: 2,
        placeholder: 'Додай основний текст або короткі пункти',
        content: 'Додай основний текст або короткі пункти',
        isPlaceholder: true,
        style: { fontSize: 28, color: '#64748b' }
      })
    ];
  }

  function createSlide(ov = {}) {
    // FIX #2: use createBasicSlideElements when no elements provided
    const els = Array.isArray(ov.elements) && ov.elements.length ? ov.elements : createBasicSlideElements();
    return { id: uid(), background: '#ffffff', elements: els, ...ov, elements: els };
  }

  function createDefaultPresentation() {
    const slide = createSlide({
      elements: [
        createTextElement({
          x: 150, y: 110, w: 660, h: 160, z: 1,
          content: 'Привіт!\nСтвори свою презентацію',
          placeholder: 'Заголовок', isPlaceholder: false,
          style: { fontSize: 56, align: 'center', bold: true, color: '#111827' }
        }),
        createTextElement({
          x: 240, y: 320, w: 480, h: 80, z: 2,
          content: 'Додай текст, фото та фігури',
          placeholder: 'Підзаголовок', isPlaceholder: false,
          style: { fontSize: 28, align: 'center', color: '#475569' }
        })
      ]
    });
    return { fileName: 'моя презентація', slides: [slide], currentSlideId: slide.id, selectedElementId: null };
  }

  function createTemplateDefinition(type) {
    if (type === 'title') {
      return {
        background: '#ffffff',
        elements: [
          createShapeElement('rect', { x: 60, y: 60, w: 840, h: 420, z: 1, style: { fill: '#fee2e2', stroke: '#dc2626' } }),
          createTextElement({ x: 110, y: 150, w: 740, h: 160, z: 2, content: 'НАЗВА ПРЕЗЕНТАЦІЇ', isPlaceholder: false, style: { fontSize: 56, align: 'center', bold: true, color: '#111827' } }),
          createTextElement({ x: 220, y: 330, w: 520, h: 90, z: 3, content: 'Автор: …', isPlaceholder: false, style: { fontSize: 28, align: 'center', color: '#475569' } })
        ]
      };
    }
    if (type === 'text-image') {
      return {
        background: '#ffffff',
        elements: [
          createTextElement({ x: 60, y: 50, w: 840, h: 70, z: 1, content: 'ЗАГОЛОВОК', isPlaceholder: false, style: { fontSize: 48, bold: true, color: '#111827' } }),
          createTextElement({ x: 60, y: 145, w: 410, h: 320, z: 2, content: '• Пункт 1\n• Пункт 2\n• Пункт 3', isPlaceholder: false, style: { fontSize: 28, color: '#111827' } }),
          createShapeElement('rect', { x: 500, y: 145, w: 360, h: 300, z: 3, style: { fill: '#dbeafe', stroke: '#2563eb' } }),
          createTextElement({ x: 540, y: 260, w: 280, h: 80, z: 4, content: 'Додай фото сюди', isPlaceholder: false, style: { fontSize: 28, align: 'center', bold: true, color: '#1d4ed8' } })
        ]
      };
    }
    // three-blocks
    return {
      background: '#ffffff',
      elements: [
        createTextElement({ x: 60, y: 44, w: 840, h: 70, z: 1, content: 'МІЙ СЛАЙД', isPlaceholder: false, style: { fontSize: 48, bold: true, align: 'center', color: '#111827' } }),
        createShapeElement('rect', { x: 55, y: 150, w: 250, h: 320, z: 2, style: { fill: '#dcfce7', stroke: '#16a34a' } }),
        createShapeElement('rect', { x: 355, y: 150, w: 250, h: 320, z: 3, style: { fill: '#dbeafe', stroke: '#2563eb' } }),
        createShapeElement('rect', { x: 655, y: 150, w: 250, h: 320, z: 4, style: { fill: '#fae8ff', stroke: '#a21caf' } }),
        createTextElement({ x: 80, y: 175, w: 200, h: 70, z: 10, content: 'Ідея 1', isPlaceholder: false, style: { fontSize: 32, bold: true, align: 'center' } }),
        createTextElement({ x: 380, y: 175, w: 200, h: 70, z: 11, content: 'Ідея 2', isPlaceholder: false, style: { fontSize: 32, bold: true, align: 'center' } }),
        createTextElement({ x: 680, y: 175, w: 200, h: 70, z: 12, content: 'Ідея 3', isPlaceholder: false, style: { fontSize: 32, bold: true, align: 'center' } }),
        createTextElement({ x: 80, y: 250, w: 200, h: 170, z: 13, content: 'Напиши тут…', isPlaceholder: false, style: { fontSize: 24 } }),
        createTextElement({ x: 380, y: 250, w: 200, h: 170, z: 14, content: 'Напиши тут…', isPlaceholder: false, style: { fontSize: 24 } }),
        createTextElement({ x: 680, y: 250, w: 200, h: 170, z: 15, content: 'Напиши тут…', isPlaceholder: false, style: { fontSize: 24 } })
      ]
    };
  }

  /* ── export / snapshot ───────────────────────────────────── */

  // FIX #6: shared helper that handles rect, circle AND triangle
  function appendShapeSvg(svg, element) {
    let shape;
    if (element.shape === 'circle') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      shape.setAttribute('cx', '50%'); shape.setAttribute('cy', '50%');
      shape.setAttribute('rx', '48%'); shape.setAttribute('ry', '48%');
    } else if (element.shape === 'triangle') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      shape.setAttribute('points', '50,4 96,96 4,96');
    } else {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shape.setAttribute('x', '2%'); shape.setAttribute('y', '2%');
      shape.setAttribute('width', '96%'); shape.setAttribute('height', '96%');
      shape.setAttribute('rx', '10'); shape.setAttribute('ry', '10');
    }
    shape.setAttribute('fill', element.style.fill || '#dbeafe');
    shape.setAttribute('stroke', element.style.stroke || '#1d4ed8');
    shape.setAttribute('stroke-width', '8');
    svg.appendChild(shape);
  }

  function buildElementNode(element) {
    const node = document.createElement('div');
    node.style.cssText = `
    position:absolute;
    left:${element.x}px; top:${element.y}px;
    width:${element.w}px; height:${element.h}px;
    z-index:${element.z || 1};
    overflow:visible;
    transform:rotate(${element.rotation || 0}deg);
    transform-origin:center center;
  `;

    if (element.type === 'text') {
      Object.assign(node.style, {
        padding: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        lineHeight: '1.15',
        fontSize: `${element.style.fontSize || 28}px`,
        fontWeight: element.style.bold ? '900' : '700',
        fontStyle: element.style.italic ? 'italic' : 'normal',
        textDecoration: element.style.underline ? 'underline' : 'none',
        textAlign: element.style.align || 'left',
        color: element.isPlaceholder
          ? (element.style.color || '#94a3b8')
          : (element.style.color || '#111827')
      });
      node.textContent = element.content || '';
    }

    if (element.type === 'image') {
      const img = document.createElement('img');
      img.src = element.content;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      node.appendChild(img);
    }

    if (element.type === 'shape') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '0 0 100 100');
      appendShapeSvg(svg, element);
      node.appendChild(svg);
    }

    return node;
  }

  function createSlideSnapshot(slide) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `width:${STAGE_WIDTH}px;height:${STAGE_HEIGHT}px;position:relative;background:${slide.background || '#fff'};overflow:hidden;`;
    [...slide.elements].sort((a, b) => (a.z || 1) - (b.z || 1)).forEach(el => wrap.appendChild(buildElementNode(el)));
    return wrap;
  }

  function createThumbSnapshot(slide) {
    const mini = document.createElement('div');
    mini.className = 'slide-thumb-mini';
    mini.style.background = slide.background || '#ffffff';
    [...slide.elements].sort((a, b) => (a.z || 1) - (b.z || 1)).forEach(el => {
      const n = buildElementNode(el);
      n.classList.add('slide-thumb-element');
      mini.appendChild(n);
    });
    return mini;
  }

  async function exportPresentationPdf(fileName, slides) {
    const container = document.createElement('div');
    container.style.width = `${STAGE_WIDTH}px`;
    slides.forEach((slide, i) => {
      const page = createSlideSnapshot(slide);
      page.style.pageBreakAfter = i === slides.length - 1 ? 'auto' : 'always';
      container.appendChild(page);
    });
    await html2pdf().from(container).set({
      margin: 0,
      filename: `${fileName || 'presentation'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'px', format: [STAGE_WIDTH, STAGE_HEIGHT], orientation: 'landscape' }
    }).save();
  }

  function printPresentation(fileName, slides) {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return false;
    const css = `<style>body{margin:0;padding:24px;background:#e5e7eb;font-family:Arial,sans-serif}.page{width:${STAGE_WIDTH}px;height:${STAGE_HEIGHT}px;background:#fff;position:relative;overflow:hidden;margin:0 auto 24px;box-shadow:0 8px 24px rgba(0,0,0,.12);page-break-after:always}</style>`;
    const pages = slides.map(s => { const p = createSlideSnapshot(s); p.className = 'page'; return p.outerHTML; }).join('');
    win.document.write(`<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>${fileName}</title>${css}</head><body>${pages}</body></html>`);
    win.document.close(); win.focus(); win.print();
    return true;
  }

  /* ── app ─────────────────────────────────────────────────── */
  const dom = {};
  const elementDomMap = new Map();

  // FIX #3 / #7: global vars for drag and color popover anchor
  let draggedSlideId = null;
  let colorAnchorButton = null;

  const pointer = {
    mode: 'none', elementId: null, handle: null, pointerId: null,
    startX: 0, startY: 0, dragOffsetX: 0, dragOffsetY: 0, startBox: null
  };

  const autosave = debounce(() => {
    saveDraft(serializePresentation());
    state.unsavedChanges = false;
    updateDirtyUi();
    setStatusRight(`Автозбережено • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }, 260);

  function setStatusRight(t) { dom.statusRight.textContent = t; }

  function updateDirtyUi() {
    dom.dirtyDot.style.display = state.unsavedChanges ? 'inline-block' : 'none';
    dom.saveBadge.textContent = state.unsavedChanges ? 'Є зміни' : 'Збережено ✓';
  }

  function markDirty(txt = 'Є незбережені зміни') {
    state.unsavedChanges = true;
    updateDirtyUi();
    setStatusRight(txt);
    autosave();
  }

  /* normalizePresentation / normalizeElement */
  function normalizePresentation(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Array.isArray(raw.slides) || raw.slides.length === 0) return null;
    const slides = raw.slides.map((sl, si) => ({
      id: typeof sl.id === 'string' ? sl.id : `slide_${si}`,
      background: typeof sl.background === 'string' ? sl.background : '#ffffff',
      elements: Array.isArray(sl.elements) ? sl.elements.map((el, ei) => normalizeElement(el, ei)) : []
    }));
    return {
      fileName: (typeof raw.fileName === 'string' && raw.fileName.trim()) ? raw.fileName.trim() : 'моя презентація',
      slides,
      currentSlideId: slides.some(s => s.id === raw.currentSlideId) ? raw.currentSlideId : slides[0].id,
      selectedElementId: null
    };
  }

  function normalizeElement(el, idx) {
    const type = ['text', 'image', 'shape'].includes(el?.type) ? el.type : 'text';
    // FIX #6: triangle is now an allowed shape
    const shape = ['rect', 'circle', 'triangle'].includes(el?.shape) ? el.shape : 'rect';

    // FIX #1: preserve placeholder/isPlaceholder
    const placeholder = (typeof el?.placeholder === 'string' && el.placeholder.trim()) ? el.placeholder : (type === 'text' ? 'Введіть текст…' : '');
    const hasContent = typeof el?.content === 'string' && el.content.length > 0;
    const isPlaceholder = type === 'text'
      ? (typeof el?.isPlaceholder === 'boolean' ? el.isPlaceholder : !hasContent)
      : false;
    const content = type === 'text'
      ? (hasContent ? el.content : placeholder)
      : (typeof el?.content === 'string' ? el.content : '');

    return {
      id: typeof el?.id === 'string' ? el.id : `el_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      type, shape,
      x: Number.isFinite(el?.x) ? el.x : 120,
      y: Number.isFinite(el?.y) ? el.y : 120,
      w: Number.isFinite(el?.w) ? el.w : 240,
      h: Number.isFinite(el?.h) ? el.h : 120,
      z: Number.isFinite(el?.z) ? el.z : idx + 1,
      rotation: Number.isFinite(el?.rotation) ? el.rotation : 0,
      content, placeholder, isPlaceholder,
      style: { ...DEFAULT_TEXT_STYLE, ...DEFAULT_SHAPE_STYLE, ...(el?.style || {}) }
    };
  }

  /* initDom */
  function initDom() {
    dom.fileName = $('#fileName');
    dom.dirtyDot = $('#dirtyDot');
    dom.saveBadge = $('#saveBadge');
    dom.projectFileInput = $('#projectFileInput');
    dom.imageFileInput = $('#imageFileInput');
    dom.stage = $('#stage');
    dom.slideList = $('#slideList');
    dom.workspace = $('#workspace');
    dom.statusLeft = $('#statusLeft');
    dom.statusRight = $('#statusRight');
    dom.fontSizeSelect = $('#fontSizeSelect');
    dom.colorPanelBtn = $('#colorPanelBtn');
    dom.modalOverlay = $('#modalOverlay');
    dom.modalIcon = $('#modalIcon');
    dom.modalTitle = $('#modalTitle');
    dom.modalText = $('#modalText');
    dom.modalBody = $('#modalBody');
    dom.modalCancel = $('#modalCancel');
    dom.modalConfirm = $('#modalConfirm');
    dom.colorPopover = $('#colorPopover');
    dom.colorPalette = $('#colorPalette');
    dom.colorPopoverHint = $('#colorPopoverHint');
    // FIX #7: was missing
    dom.colorModeButtons = $('#colorModeButtons');
    dom.customColorInput = $('#customColorInput');
    dom.presentOverlay = $('#presentOverlay');
    dom.presentStageWrap = $('#presentStageWrap');
    dom.presentClose = $('#presentClose');
    dom.presentPrev = $('#presentPrev');
    dom.presentNext = $('#presentNext');
  }

  function boot() {
    initDom();
    renderColorPalette();
    window.OfficeUI?.registerCommands?.({
      new: confirmNewProject,
      open: () => window.OfficeUI?.openFilePicker?.(dom.projectFileInput) || dom.projectFileInput.click(),
      save: saveProjectFile,
      undo: handleUndo,
      redo: handleRedo
    }, { source: 'slides' });
    loadInitialState();
    bindMenus();
    bindToolbar();
    bindInputs();
    bindStage();
    bindPresentation();
    renderAll();
  }

  function loadInitialState() {
    const saved = normalizePresentation(loadDraft());
    applyPresentationData(saved || createDefaultPresentation());
    resetHistory();
    state.unsavedChanges = false;
    updateDirtyUi();
    setStatusRight('Готово');
  }

  function renderAll() {
    renderFileName();
    renderStage();
    renderSlideList();
    renderToolbarState();
    renderStatus();
  }

  function renderFileName() { dom.fileName.textContent = state.fileName; }

  function renderStatus() {
    const sel = getSelectedElement();
    dom.statusLeft.textContent =
      `Слайд ${getCurrentSlideIndex() + 1} з ${state.slides.length}` +
      (sel ? ` • Об'єкт: ${describeElement(sel)}` : '');
  }

  function describeElement(el) {
    if (el.type === 'text') return 'текст';
    if (el.type === 'image') return 'зображення';
    if (el.shape === 'circle') return 'коло';
    if (el.shape === 'triangle') return 'трикутник';
    return 'прямокутник';
  }

  /* ── Color palette & popover ─────────────────────────────── */
  function renderColorPalette() {
    dom.colorPalette.innerHTML = '';
    COLOR_PALETTE.forEach(color => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'color-swatch';
      btn.title = color.toUpperCase(); btn.style.background = color;
      if (color.toLowerCase() === '#ffffff') btn.style.borderColor = '#cbd5e1';
      btn.addEventListener('click', () => { applyColor(color); closeColorPopover(); });
      dom.colorPalette.appendChild(btn);
    });
  }

  // FIX #7: render mode tabs (Текст / Заливка / Контур / Фон)
  function renderColorModeButtons() {
    if (!dom.colorModeButtons) return;
    dom.colorModeButtons.innerHTML = '';
    const sel = getSelectedElement();
    const modes = [];
    if (sel?.type === 'text') modes.push({ key: 'text', label: 'Текст' });
    if (sel?.type === 'shape') modes.push({ key: 'fill', label: 'Заливка' });
    if (sel?.type === 'shape') modes.push({ key: 'stroke', label: 'Контур' });
    modes.push({ key: 'background', label: 'Фон' });

    if (!modes.some(m => m.key === state.currentColorTarget)) {
      state.currentColorTarget = modes[0]?.key || 'background';
    }

    modes.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-mode-btn' + (m.key === state.currentColorTarget ? ' active' : '');
      btn.textContent = m.label;
      btn.addEventListener('click', () => {
        state.currentColorTarget = m.key;
        renderColorModeButtons();
      });
      dom.colorModeButtons.appendChild(btn);
    });

    updateColorHint();
  }

  function updateColorHint() {
    const labels = { text: 'Колір тексту', fill: 'Заливка фігури', stroke: 'Контур фігури', background: 'Фон слайда' };
    if (dom.colorPopoverHint) dom.colorPopoverHint.textContent = labels[state.currentColorTarget] || 'Виберіть колір';
  }

  function positionColorPopover() {
    if (!colorAnchorButton) return;
    const rect = colorAnchorButton.getBoundingClientRect();
    const popW = dom.colorPopover.offsetWidth || 290;
    const popH = dom.colorPopover.offsetHeight || 290;
    const left = clamp(rect.left, 8, window.innerWidth - popW - 8);
    const top = Math.min(window.innerHeight - popH - 8, rect.bottom + 6);
    dom.colorPopover.style.left = `${left}px`;
    dom.colorPopover.style.top = `${top < 8 ? rect.top - popH - 6 : top}px`;
  }

  // FIX #7: openColorPopover now accepts target + anchor button
  function openColorPopover(target = null, anchorButton = null) {
    const sel = getSelectedElement();
    if (target) {
      state.currentColorTarget = target;
    } else {
      if (sel?.type === 'text') state.currentColorTarget = 'text';
      else if (sel?.type === 'shape') state.currentColorTarget = 'fill';
      else state.currentColorTarget = 'background';
    }
    colorAnchorButton = anchorButton || dom.colorPanelBtn;
    renderColorModeButtons();
    dom.colorPopover.classList.remove('hidden');
    requestAnimationFrame(positionColorPopover);
  }

  function closeColorPopover() { dom.colorPopover.classList.add('hidden'); }

  /* ── Slide list ──────────────────────────────────────────── */
  // FIX #3 (drag-and-drop) + FIX #4 (up/down buttons) + FIX #5 (compact view)
  function renderSlideList() {
    dom.slideList.innerHTML = '';
    state.slides.forEach((slide, idx) => {
      const card = document.createElement('div');
      card.className = `slide-card${slide.id === state.currentSlideId ? ' active' : ''}`;
      card.draggable = true;
      card.dataset.slideId = slide.id;

      /* ── drag-and-drop ── */
      const startDrag = e => {
        draggedSlideId = slide.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', slide.id);
        requestAnimationFrame(() => card.classList.add('dragging-card'));
      };
      card.addEventListener('dragstart', startDrag);
      card.addEventListener('dragend', () => {
        draggedSlideId = null;
        card.classList.remove('dragging-card');
        $$('.slide-card.drag-over').forEach(n => n.classList.remove('drag-over'));
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        if (draggedSlideId && draggedSlideId !== slide.id) card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const fromId = draggedSlideId || e.dataTransfer.getData('text/plain');
        if (fromId && fromId !== slide.id) reorderSlides(fromId, slide.id);
      });

      /* ── header ── */
      const head = document.createElement('div');
      head.className = 'slide-card-head';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'slide-card-title-wrap';

      const dragHandle = document.createElement('button');
      dragHandle.type = 'button';
      dragHandle.className = 'slide-drag-handle';
      dragHandle.title = 'Перетягни для зміни порядку';
      dragHandle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
      dragHandle.draggable = true;
      dragHandle.addEventListener('dragstart', startDrag);
      dragHandle.addEventListener('click', e => e.stopPropagation());

      const titleEl = document.createElement('span');
      titleEl.className = 'slide-card-title';
      titleEl.textContent = String(idx + 1);
      titleWrap.append(dragHandle, titleEl);

      /* FIX #4: up / down / duplicate / delete */
      const actions = document.createElement('div');
      actions.className = 'slide-card-actions';
      actions.appendChild(makeMiniAction('fa-solid fa-arrow-up', 'Вгору', () => moveSlideById(slide.id, -1)));
      actions.appendChild(makeMiniAction('fa-solid fa-arrow-down', 'Вниз', () => moveSlideById(slide.id, 1)));
      actions.appendChild(makeMiniAction('fa-regular fa-copy', 'Дублювати', () => duplicateSlide(slide.id)));
      actions.appendChild(makeMiniAction('fa-regular fa-trash-can', 'Видалити', () => confirmDeleteSlide(slide.id)));

      head.append(titleWrap, actions);

      /* ── thumbnail ── */
      const thumbBtn = document.createElement('button');
      thumbBtn.type = 'button';
      thumbBtn.className = 'slide-thumb-button';
      thumbBtn.draggable = false;
      thumbBtn.addEventListener('click', () => {
        state.currentSlideId = slide.id;
        state.selectedElementId = null;
        closeColorPopover();
        renderAll();
        setStatusRight('Слайд вибрано');
      });

      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb';
      thumb.appendChild(createThumbSnapshot(slide));
      thumbBtn.appendChild(thumb);

      card.append(head, thumbBtn);
      dom.slideList.appendChild(card);
    });
  }

  function reorderSlides(fromId, toId) {
    const fi = state.slides.findIndex(s => s.id === fromId);
    const ti = state.slides.findIndex(s => s.id === toId);
    if (fi === -1 || ti === -1 || fi === ti) return;
    pushHistory();
    const [slide] = state.slides.splice(fi, 1);
    state.slides.splice(ti, 0, slide);
    state.currentSlideId = slide.id;
    renderAll();
    markDirty('Порядок слайдів змінено');
  }

  function moveSlideById(slideId, dir) {
    state.currentSlideId = slideId;
    moveSlide(dir);
  }

  function makeMiniAction(iconCls, title, handler) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'mini-btn'; btn.title = title;
    btn.innerHTML = `<i class="${iconCls}"></i>`;
    btn.addEventListener('click', e => { e.stopPropagation(); handler(); });
    return btn;
  }

  /* ── Stage rendering ─────────────────────────────────────── */
  function renderStage() {
    dom.stage.innerHTML = '';
    elementDomMap.clear();
    const slide = getCurrentSlide();
    if (!slide) return;
    dom.stage.style.background = slide.background || '#ffffff';
    [...slide.elements].sort((a, b) => (a.z || 1) - (b.z || 1)).forEach(el => {
      const node = renderElementNode(el);
      elementDomMap.set(el.id, node);
      dom.stage.appendChild(node);
    });
    syncSelectionUi();
  }

  function renderElementNode(element) {
    const wrap = document.createElement('div');
    wrap.className = `stage-element${element.id === state.selectedElementId ? ' selected' : ''}`;
    wrap.dataset.id = element.id;
    wrap.style.left = `${element.x}px`;
    wrap.style.top = `${element.y}px`;
    wrap.style.width = `${element.w}px`;
    wrap.style.height = `${element.h}px`;
    wrap.style.zIndex = String(element.z || 1);
    wrap.style.transform = `rotate(${element.rotation || 0}deg)`;

    const content = document.createElement('div');
    content.className = 'element-content';

    /* ── text: FIX #1 placeholder logic ── */
    if (element.type === 'text') {
      const tb = document.createElement('div');
      tb.className = 'text-element' + (element.isPlaceholder ? ' is-placeholder' : '');
      tb.contentEditable = 'true';
      tb.spellcheck = false;
      tb.textContent = element.content || '';
      applyTextStylesToNode(tb, element);

      tb.addEventListener('pointerdown', e => { e.stopPropagation(); selectElement(element.id); });

      // FIX #1: clear placeholder on focus
      tb.addEventListener('focus', () => {
        selectElement(element.id);
        if (element.isPlaceholder) {
          element.isPlaceholder = false;
          element.content = '';
          tb.textContent = '';
          tb.classList.remove('is-placeholder');
          applyTextStylesToNode(tb, element);
        }
      });

      tb.addEventListener('input', () => {
        element.content = getTextFromContentEditable(tb);
        element.isPlaceholder = false;
        markDirty('Текст змінено');
        renderSlideList();
      });

      // FIX #1: restore placeholder on blur if empty
      tb.addEventListener('blur', () => {
        const val = getTextFromContentEditable(tb).trim();
        if (!val && element.placeholder) {
          element.isPlaceholder = true;
          element.content = element.placeholder;
          tb.textContent = element.placeholder;
          tb.classList.add('is-placeholder');
          applyTextStylesToNode(tb, element);
          renderSlideList();
          markDirty('Поле очищено');
        }
      });

      content.appendChild(tb);
    }

    /* ── image ── */
    if (element.type === 'image') {
      const img = document.createElement('img');
      img.className = 'image-element';
      img.src = element.content; img.alt = ''; img.draggable = false;
      content.appendChild(img);
    }

    /* ── shape: FIX #6 triangle support ── */
    if (element.type === 'shape') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'shape-element');
      appendShapeSvg(svg, element);
      content.appendChild(svg);
    }

    wrap.appendChild(content);
    wrap.appendChild(createHandles(element.id));
    wrap.addEventListener('pointerdown', e => onElementPointerDown(e, element.id));
    return wrap;
  }

  function createHandles(elementId) {
    const handles = document.createElement('div');
    handles.className = 'resize-handles';
    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(h => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${h}`;
      handle.dataset.handle = h;
      handle.addEventListener('pointerdown', e => onHandlePointerDown(e, elementId, h));
      handles.appendChild(handle);
    });
    return handles;
  }

  function applyTextStylesToNode(node, element) {
    node.style.fontSize = `${element.style.fontSize || 28}px`;
    node.style.color = element.isPlaceholder
      ? (element.style.color || '#94a3b8')
      : (element.style.color || '#111827');
    node.style.fontWeight = element.style.bold ? '900' : '700';
    node.style.fontStyle = element.style.italic ? 'italic' : 'normal';
    node.style.textDecoration = element.style.underline ? 'underline' : 'none';
    node.style.textAlign = element.style.align || 'left';
  }

  function renderToolbarState() {
    const sel = getSelectedElement();
    dom.fontSizeSelect.value = String(sel?.style?.fontSize || FONT_SIZES[1]);
    $$('[data-action="bold"],[data-action="italic"],[data-action="underline"],[data-action="align-left"],[data-action="align-center"],[data-action="align-right"]')
      .forEach(b => b.classList.remove('active'));
    if (sel?.type === 'text') {
      if (sel.style.bold) $$('[data-action="bold"]').forEach(b => b.classList.add('active'));
      if (sel.style.italic) $$('[data-action="italic"]').forEach(b => b.classList.add('active'));
      if (sel.style.underline) $$('[data-action="underline"]').forEach(b => b.classList.add('active'));
      $$(`[data-action="align-${sel.style.align || 'left'}"]`).forEach(b => b.classList.add('active'));
    }
  }

  function syncSelectionUi() {
    elementDomMap.forEach((node, id) => node.classList.toggle('selected', id === state.selectedElementId));
  }
  function selectElement(id) { state.selectedElementId = id; syncSelectionUi(); renderToolbarState(); renderStatus(); }
  function clearSelection() { state.selectedElementId = null; syncSelectionUi(); renderToolbarState(); renderStatus(); }

  function getStagePoint(cx, cy) {
    const r = dom.stage.getBoundingClientRect();
    return { x: (cx - r.left) * (STAGE_WIDTH / r.width), y: (cy - r.top) * (STAGE_HEIGHT / r.height) };
  }

  function onElementPointerDown(e, elementId) {
    if (e.target.closest('.text-element')) return;
    e.preventDefault(); e.stopPropagation();
    const el = findElementById(elementId);
    const node = elementDomMap.get(elementId);
    if (!el || !node) return;
    pushHistory(); selectElement(elementId);
    const pt = getStagePoint(e.clientX, e.clientY);
    pointer.mode = 'drag'; pointer.elementId = elementId; pointer.pointerId = e.pointerId;
    pointer.dragOffsetX = pt.x - el.x; pointer.dragOffsetY = pt.y - el.y;
    node.classList.add('dragging');
    node.setPointerCapture(e.pointerId);
  }

  function onHandlePointerDown(e, elementId, handle) {
    e.preventDefault(); e.stopPropagation();
    const el = findElementById(elementId);
    if (!el) return;
    pushHistory(); selectElement(elementId);
    const pt = getStagePoint(e.clientX, e.clientY);
    pointer.mode = 'resize'; pointer.elementId = elementId; pointer.handle = handle;
    pointer.pointerId = e.pointerId; pointer.startX = pt.x; pointer.startY = pt.y;
    pointer.startBox = { x: el.x, y: el.y, w: el.w, h: el.h };
    elementDomMap.get(elementId)?.setPointerCapture(e.pointerId);
  }

  function bindStage() {
    dom.stage.addEventListener('pointerdown', e => { if (e.target === dom.stage) clearSelection(); });
    dom.stage.addEventListener('pointermove', onStagePointerMove);
    dom.stage.addEventListener('pointerup', onStagePointerUp);
    dom.stage.addEventListener('pointercancel', onStagePointerUp);
  }

  function onStagePointerMove(e) {
    if (pointer.mode === 'none' || pointer.pointerId !== e.pointerId) return;
    const el = findElementById(pointer.elementId);
    const node = elementDomMap.get(pointer.elementId);
    if (!el || !node) return;
    const pt = getStagePoint(e.clientX, e.clientY);

    if (pointer.mode === 'drag') {
      el.x = clamp(pt.x - pointer.dragOffsetX, 0, STAGE_WIDTH - el.w);
      el.y = clamp(pt.y - pointer.dragOffsetY, 0, STAGE_HEIGHT - el.h);
      node.style.left = `${el.x}px`; node.style.top = `${el.y}px`;
      return;
    }
    if (pointer.mode === 'resize' && pointer.startBox) {
      const dx = pt.x - pointer.startX, dy = pt.y - pointer.startY;
      let { x, y, w, h } = pointer.startBox;
      const has = s => pointer.handle.includes(s);
      if (has('e')) w += dx; if (has('s')) h += dy;
      if (has('w')) { x += dx; w -= dx; }
      if (has('n')) { y += dy; h -= dy; }
      w = Math.max(40, w); h = Math.max(30, h);
      x = clamp(x, 0, STAGE_WIDTH - w); y = clamp(y, 0, STAGE_HEIGHT - h);
      el.x = x; el.y = y; el.w = w; el.h = h;
      node.style.left = `${x}px`; node.style.top = `${y}px`;
      node.style.width = `${w}px`; node.style.height = `${h}px`;
    }
  }

  function onStagePointerUp(e) {
    if (pointer.mode === 'none' || pointer.pointerId !== e.pointerId) return;
    elementDomMap.get(pointer.elementId)?.classList.remove('dragging');
    pointer.mode = 'none'; pointer.elementId = null; pointer.handle = null;
    pointer.pointerId = null; pointer.startBox = null;
    normalizeZIndexes(); renderSlideList();
    markDirty('Положення змінено');
  }

  function normalizeZIndexes() {
    const slide = getCurrentSlide();
    if (!slide) return;
    slide.elements.sort((a, b) => (a.z || 1) - (b.z || 1)).forEach((el, i) => { el.z = i + 1; });
  }

  /* ── Menu / toolbar binding ──────────────────────────────── */
  function bindMenus() {
    $$('.menu-title').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); toggleMenu(btn.dataset.menu); });
    });
    $$('.menu-item').forEach(btn => {
      btn.addEventListener('click', () => { dispatchAction(btn.dataset.action, btn); closeMenus(); });
    });
    document.addEventListener('pointerdown', e => {
      if (!e.target.closest('.menu-item-wrap')) closeMenus();
      if (!e.target.closest('.color-popover') && !e.target.closest('#colorPanelBtn')) closeColorPopover();
    });
  }

  function bindToolbar() {
    $$('[data-action]').forEach(btn => {
      if (btn.closest('.menu-dropdown')) return;
      btn.addEventListener('click', e => dispatchAction(btn.dataset.action, e.currentTarget));
    });
  }

  function bindInputs() {
    dom.fontSizeSelect.addEventListener('change', e => setSelectedTextStyle({ fontSize: Number(e.target.value) }));
    dom.projectFileInput.addEventListener('change', onProjectFileSelected);
    dom.imageFileInput.addEventListener('change', onImageFileSelected);
    $('#closeColorPopover').addEventListener('click', closeColorPopover);
    $('#applyCustomColor').addEventListener('click', () => { applyColor(dom.customColorInput.value); closeColorPopover(); });
    dom.fileName.addEventListener('click', beginRenameFile);
    dom.fileName.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginRenameFile(); } });
    dom.modalOverlay.addEventListener('pointerdown', e => { if (e.target === dom.modalOverlay) closeModal(); });
    document.addEventListener('keydown', handleKeyboardShortcuts);
    window.addEventListener('resize', () => { if (!dom.colorPopover.classList.contains('hidden')) positionColorPopover(); });
  }

  function bindPresentation() {
    dom.presentClose.addEventListener('click', stopPresentation);
    dom.presentPrev.addEventListener('click', showPreviousPresentationSlide);
    dom.presentNext.addEventListener('click', showNextPresentationSlide);
  }

  function toggleMenu(name) {
    const cur = $(`.menu-dropdown[data-menu="${name}"]`);
    const willOpen = !cur.classList.contains('open');
    closeMenus();
    if (!willOpen) return;
    cur.classList.add('open');
    $(`.menu-title[data-menu="${name}"]`)?.setAttribute('aria-expanded', 'true');
  }
  function closeMenus() {
    $$('.menu-dropdown.open').forEach(m => m.classList.remove('open'));
    $$('.menu-title').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function beginRenameFile() {
    const input = document.createElement('input');
    input.className = 'filename-input'; input.value = state.fileName;
    dom.fileName.replaceWith(input); input.focus(); input.select();
    const finish = commit => {
      if (commit) {
        const next = input.value.trim() || 'моя презентація';
        if (next !== state.fileName) { pushHistory(); state.fileName = next; markDirty('Назву змінено'); }
      }
      input.replaceWith(dom.fileName); renderFileName();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true), { once: true });
  }

  function handleKeyboardShortcuts(e) {
    const active = document.activeElement;
    const isText = active?.classList?.contains('text-element');
    const isInput = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
    const ctrl = e.ctrlKey || e.metaKey;

    if (e.key === 'F5') { e.preventDefault(); startPresentation(); return; }

    if (!dom.presentOverlay.classList.contains('hidden')) {
      if (e.key === 'Escape') stopPresentation();
      if (e.key === 'ArrowLeft') showPreviousPresentationSlide();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); showNextPresentationSlide(); }
      return;
    }

    if (ctrl) {
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); window.OfficeUI?.runCommand?.(e.shiftKey ? 'redo' : 'undo') || (e.shiftKey ? handleRedo() : handleUndo()); return; }
      if (k === 'y') { e.preventDefault(); window.OfficeUI?.runCommand?.('redo') || handleRedo(); return; }
      if (k === 's') { e.preventDefault(); window.OfficeUI?.runCommand?.('save') || saveProjectFile(); return; }
      if (k === 'o') { e.preventDefault(); window.OfficeUI?.runCommand?.('open') || window.OfficeUI?.openFilePicker?.(dom.projectFileInput) || dom.projectFileInput.click(); return; }
      if (k === 'n') { e.preventDefault(); window.OfficeUI?.runCommand?.('new') || confirmNewProject(); return; }
      if (k === 'p') { e.preventDefault(); handlePrint(); return; }
      if (!isText && !isInput) {
        if (k === 'c') { e.preventDefault(); copySelectedElement(); }
        if (k === 'v') { e.preventDefault(); pasteElement(); }
        if (k === 'd') { e.preventDefault(); duplicateSelectedElement(); }
      }
    }

    if (!isText && !isInput) {
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelectedElement(); return; }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const sel = getSelectedElement(); if (!sel) return;
        e.preventDefault(); pushHistory();
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowUp') sel.y = clamp(sel.y - step, 0, STAGE_HEIGHT - sel.h);
        if (e.key === 'ArrowDown') sel.y = clamp(sel.y + step, 0, STAGE_HEIGHT - sel.h);
        if (e.key === 'ArrowLeft') sel.x = clamp(sel.x - step, 0, STAGE_WIDTH - sel.w);
        if (e.key === 'ArrowRight') sel.x = clamp(sel.x + step, 0, STAGE_WIDTH - sel.w);
        renderStage(); renderSlideList(); renderStatus();
        markDirty("Об'єкт переміщено");
      }
    }
  }

  /* ── dispatchAction ──────────────────────────────────────── */
  // FIX #7: color-panel now properly opens popover with anchor
  // FIX #6: insert-triangle handled
  function dispatchAction(action, trigger = null) {
    const runOfficeCommand = command => window.OfficeUI?.runCommand?.(command);
    switch (action) {
      case 'new-project': runOfficeCommand('new') || confirmNewProject(); break;
      case 'open-project': runOfficeCommand('open') || window.OfficeUI?.openFilePicker?.(dom.projectFileInput) || dom.projectFileInput.click(); break;
      case 'save-project': runOfficeCommand('save') || saveProjectFile(); break;
      case 'export-pdf': handleExportPdf(); break;
      case 'print': handlePrint(); break;
      case 'undo': runOfficeCommand('undo') || handleUndo(); break;
      case 'redo': runOfficeCommand('redo') || handleRedo(); break;
      case 'copy': copySelectedElement(); break;
      case 'paste': pasteElement(); break;
      case 'duplicate-element': duplicateSelectedElement(); break;
      case 'delete-element': deleteSelectedElement(); break;
      case 'insert-text': addTextElement(); break;
      case 'insert-image': promptImageInsert(); break;
      case 'insert-rect': addShape('rect'); break;
      case 'insert-circle': addShape('circle'); break;
      case 'insert-triangle': addShape('triangle'); break;
      case 'new-slide': addSlide(); break;
      case 'duplicate-slide': duplicateSlide(); break;
      case 'delete-slide': confirmDeleteSlide(); break;
      case 'move-slide-up': moveSlide(-1); break;
      case 'move-slide-down': moveSlide(1); break;
      case 'show-templates': showTemplatesPicker(); break;
      case 'template-title': applyTemplate('title'); break;
      case 'template-text-image': applyTemplate('text-image'); break;
      case 'template-three-blocks': applyTemplate('three-blocks'); break;
      // FIX #7: color-panel now opens the popover with anchor button
      case 'color-panel': openColorPopover(null, trigger || dom.colorPanelBtn); break;
      case 'slide-background': openColorPopover('background', trigger || dom.colorPanelBtn); break;
      case 'present': startPresentation(); break;
      case 'bold': toggleTextStyle('bold'); break;
      case 'italic': toggleTextStyle('italic'); break;
      case 'underline': toggleTextStyle('underline'); break;
      case 'align-left': setSelectedTextStyle({ align: 'left' }); break;
      case 'align-center': setSelectedTextStyle({ align: 'center' }); break;
      case 'align-right': setSelectedTextStyle({ align: 'right' }); break;
      case 'rotate-left': rotateSelected(-15); break;
      case 'rotate-right': rotateSelected(15); break;
      case 'bring-front': bringSelectedToFront(); break;
      case 'send-back': sendSelectedToBack(); break;
      case 'about': showAbout(); break;
      case 'shortcuts': showShortcuts(); break;
    }
  }

  function handleUndo() { if (!undo()) return; state.unsavedChanges = false; updateDirtyUi(); renderAll(); setStatusRight('Скасовано'); }
  function handleRedo() { if (!redo()) return; state.unsavedChanges = false; updateDirtyUi(); renderAll(); setStatusRight('Повернуто'); }

  function confirmNewProject() {
    showConfirmModal({
      title: 'Нова презентація', text: 'Поточну презентацію буде очищено. Продовжити?', confirmText: 'Створити',
      onConfirm: () => {
        clearDraft(); applyPresentationData(createDefaultPresentation()); resetHistory();
        state.unsavedChanges = false; updateDirtyUi(); renderAll(); setStatusRight('Нова презентація');
      }
    });
  }

  function saveProjectFile() {
    downloadTextFile(`${slugify(state.fileName)}.artslides.json`, JSON.stringify(serializePresentation(), null, 2));
    state.unsavedChanges = false; updateDirtyUi(); setStatusRight('Файл збережено');
  }

  function slugify(v) {
    return v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'presentation';
  }

  async function onProjectFileSelected() {
    const file = dom.projectFileInput.files?.[0]; dom.projectFileInput.value = '';
    if (!file) return;
    try {
      const parsed = normalizePresentation(JSON.parse(await readFileAsText(file)));
      if (!parsed) throw new Error('invalid');
      applyPresentationData(parsed); resetHistory();
      state.unsavedChanges = false; updateDirtyUi(); renderAll(); setStatusRight('Файл відкрито');
    } catch { showInfoModal('Не вдалося відкрити файл', 'Перевірте, чи це файл ПЛЮС Слайди (JSON).'); }
  }

  // FIX #2: addSlide now adds a slide with placeholder title + body elements
  function addSlide() {
    pushHistory();
    const slide = createSlide(); // createSlide() now calls createBasicSlideElements()
    state.slides.push(slide);
    state.currentSlideId = slide.id;
    state.selectedElementId = slide.elements[0]?.id || null;
    renderAll();
    markDirty('Додано новий слайд');
    requestAnimationFrame(() => {
      const titleNode = slide.elements[0] ? elementDomMap.get(slide.elements[0].id)?.querySelector('.text-element') : null;
      titleNode?.focus();
    });
  }

  function duplicateSlide(slideId = state.currentSlideId) {
    const idx = state.slides.findIndex(s => s.id === slideId);
    if (idx === -1) return;
    pushHistory();
    const clone = deepClone(state.slides[idx]);
    clone.id = uid();
    clone.elements = clone.elements.map((el, ei) => normalizeElement({ ...el, id: null }, ei));
    state.slides.splice(idx + 1, 0, clone);
    state.currentSlideId = clone.id; state.selectedElementId = null;
    renderAll(); markDirty('Слайд дубльовано');
  }

  function confirmDeleteSlide(slideId = state.currentSlideId) {
    if (state.slides.length === 1) { showInfoModal('Не можна видалити', 'У презентації має бути хоча б один слайд.'); return; }
    showConfirmModal({ title: 'Видалити слайд', text: 'Слайд буде видалено.', confirmText: 'Видалити', onConfirm: () => deleteSlide(slideId) });
  }

  function deleteSlide(slideId) {
    pushHistory();
    const idx = state.slides.findIndex(s => s.id === slideId);
    if (idx === -1) return;
    state.slides.splice(idx, 1);
    state.currentSlideId = state.slides[clamp(idx, 0, state.slides.length - 1)].id;
    state.selectedElementId = null;
    renderAll(); markDirty('Слайд видалено');
  }

  function moveSlide(dir) {
    const ci = getCurrentSlideIndex(), ni = ci + dir;
    if (ni < 0 || ni >= state.slides.length) return;
    pushHistory();
    const [slide] = state.slides.splice(ci, 1);
    state.slides.splice(ni, 0, slide);
    state.currentSlideId = slide.id;
    renderAll(); markDirty('Слайд переставлено');
  }

  function addTextElement() {
    pushHistory();
    const slide = getCurrentSlide();
    const el = createTextElement({ z: slide.elements.length + 1 });
    slide.elements.push(el); state.selectedElementId = el.id;
    renderAll(); markDirty('Додано текст');
    requestAnimationFrame(() => elementDomMap.get(el.id)?.querySelector('.text-element')?.focus());
  }

  function promptImageInsert() {
    showModal({
      title: 'Додати зображення', text: 'Оберіть файл або вставте посилання.',
      body: `<div class="form-stack">
      <button id="pickImageFile" class="link-button" type="button"><i class="fa-solid fa-image"></i> Обрати файл</button>
      <input id="imageUrlField" class="input-like" type="text" placeholder="https://...">
      <div class="helper-text">Для шкільних комп'ютерів найнадійніше — завантаження файлу.</div>
    </div>`,
      confirmText: 'Додати', cancelText: 'Скасувати',
      onMount: () => { $('#pickImageFile').addEventListener('click', () => window.OfficeUI?.openFilePicker?.(dom.imageFileInput) || dom.imageFileInput.click()); },
      onConfirm: () => { const url = $('#imageUrlField').value.trim(); if (url) insertImage(url); }
    });
  }

  async function onImageFileSelected() {
    const file = dom.imageFileInput.files?.[0]; dom.imageFileInput.value = '';
    if (!file) return;
    try { insertImage(await readFileAsDataURL(file)); closeModal(); }
    catch { showInfoModal('Не вдалося прочитати файл', 'Спробуйте інше зображення.'); }
  }

  function insertImage(src) {
    pushHistory();
    const slide = getCurrentSlide();
    const el = createImageElement(src, { z: slide.elements.length + 1 });
    slide.elements.push(el); state.selectedElementId = el.id;
    renderAll(); markDirty('Додано зображення');
  }

  // FIX #6: triangle shape properly added, with scatter offset so shapes don't stack
  function addShape(kind) {
    pushHistory();
    const slide = getCurrentSlide();
    const count = slide.elements.filter(el => el.type === 'shape').length;
    const base = createShapeElement(kind, { z: slide.elements.length + 1 });
    base.x = clamp(base.x + (count % 5) * 20, 20, STAGE_WIDTH - base.w - 20);
    base.y = clamp(base.y + (count % 5) * 16, 20, STAGE_HEIGHT - base.h - 20);
    slide.elements.push(base); state.selectedElementId = base.id;
    renderAll();
    markDirty(`Додано ${kind === 'circle' ? 'коло' : kind === 'triangle' ? 'трикутник' : 'прямокутник'}`);
  }

  function applyTemplate(type) {
    pushHistory();
    const slide = getCurrentSlide();
    const tmpl = createTemplateDefinition(type);
    slide.background = tmpl.background;
    slide.elements = tmpl.elements.map((el, i) => normalizeElement({ ...el, z: i + 1 }, i));
    state.selectedElementId = null;
    renderAll(); markDirty('Застосовано макет');
  }

  function findElementById(id) {
    return getCurrentSlide()?.elements.find(el => el.id === id) || null;
  }

  function setSelectedTextStyle(partial) {
    const sel = getSelectedElement();
    if (!sel || sel.type !== 'text') return;
    pushHistory(); Object.assign(sel.style, partial);
    renderStage(); renderToolbarState(); renderSlideList();
    markDirty('Формат тексту змінено');
  }

  function toggleTextStyle(key) {
    const sel = getSelectedElement();
    if (!sel || sel.type !== 'text') return;
    setSelectedTextStyle({ [key]: !sel.style[key] });
  }

  function applyColor(color) {
    if (state.currentColorTarget === 'background') {
      pushHistory();
      getCurrentSlide().background = color;
      renderStage(); renderSlideList(); renderColorModeButtons();
      markDirty('Фон змінено'); return;
    }
    const sel = getSelectedElement(); if (!sel) return;
    pushHistory();
    if (state.currentColorTarget === 'text' && sel.type === 'text') sel.style.color = color;
    if (state.currentColorTarget === 'fill' && sel.type === 'shape') sel.style.fill = color;
    if (state.currentColorTarget === 'stroke' && sel.type === 'shape') sel.style.stroke = color;
    renderStage(); renderSlideList(); renderToolbarState(); renderColorModeButtons();
    markDirty('Колір змінено');
  }

  function rotateSelected(delta) {
    const sel = getSelectedElement(); if (!sel) return;
    pushHistory();
    sel.rotation = (((sel.rotation || 0) + delta) % 360 + 360) % 360;
    renderStage(); renderSlideList();
    markDirty("Об'єкт повернуто");
  }

  function bringSelectedToFront() {
    const sel = getSelectedElement(); if (!sel) return;
    pushHistory(); sel.z = getCurrentSlide().elements.length + 1;
    normalizeZIndexes(); renderAll(); markDirty('Змінено шар');
  }

  function sendSelectedToBack() {
    const sel = getSelectedElement(); if (!sel) return;
    pushHistory(); sel.z = 0;
    normalizeZIndexes(); renderAll(); markDirty('Змінено шар');
  }

  function copySelectedElement() {
    const sel = getSelectedElement(); if (!sel) return;
    state.clipboard = deepClone(sel);
    setStatusRight("Об'єкт скопійовано");
  }

  function pasteElement() {
    if (!state.clipboard) return;
    pushHistory();
    const slide = getCurrentSlide();
    const copy = normalizeElement({
      ...deepClone(state.clipboard), id: null,
      x: clamp(state.clipboard.x + 24, 0, STAGE_WIDTH - state.clipboard.w),
      y: clamp(state.clipboard.y + 24, 0, STAGE_HEIGHT - state.clipboard.h),
      z: slide.elements.length + 1
    }, slide.elements.length);
    slide.elements.push(copy); state.selectedElementId = copy.id;
    renderAll(); markDirty("Об'єкт вставлено");
  }

  function duplicateSelectedElement() { copySelectedElement(); pasteElement(); }

  function deleteSelectedElement() {
    const sel = getSelectedElement(); if (!sel) return;
    pushHistory();
    const slide = getCurrentSlide();
    slide.elements = slide.elements.filter(el => el.id !== sel.id);
    state.selectedElementId = null;
    normalizeZIndexes(); renderAll(); markDirty("Об'єкт видалено");
  }

  function handleExportPdf() {
    exportPresentationPdf(state.fileName, state.slides)
      .catch(() => showInfoModal('Експорт не вдався', 'Не вдалося створити PDF. Спробуйте ще раз.'));
  }

  function handlePrint() {
    if (!printPresentation(state.fileName, state.slides))
      showInfoModal('Друк заблоковано', 'Дозвольте спливаючі вікна для цієї сторінки.');
  }

  /* ── Presentation mode ───────────────────────────────────── */
  function startPresentation() {
    state.presentationIndex = getCurrentSlideIndex();
    dom.presentOverlay.classList.remove('hidden');
    renderPresentationSlide();
  }
  function stopPresentation() {
    dom.presentOverlay.classList.add('hidden');
    dom.presentStageWrap.innerHTML = '';
  }
  function showPreviousPresentationSlide() {
    if (state.presentationIndex > 0) { state.presentationIndex--; renderPresentationSlide(); }
  }
  function showNextPresentationSlide() {
    if (state.presentationIndex < state.slides.length - 1) { state.presentationIndex++; renderPresentationSlide(); }
    else stopPresentation();
  }
  function renderPresentationSlide() {
    dom.presentStageWrap.innerHTML = '';
    const slide = state.slides[state.presentationIndex]; if (!slide) return;
    const snap = createSlideSnapshot(slide);
    snap.classList.add('present-stage');
    dom.presentStageWrap.appendChild(snap);
  }

  /* ── Templates picker ────────────────────────────────────── */
  function showTemplatesPicker() {
    showModal({
      title: 'Макети слайдів', text: 'Оберіть базовий макет і відразу редагуйте його.',
      body: `<div class="template-list">
      <button class="template-btn" data-template="title" type="button">
        <span class="template-title">Титульний слайд</span>
        <span class="template-text">Великий заголовок і підпис автора</span>
      </button>
      <button class="template-btn" data-template="text-image" type="button">
        <span class="template-title">Текст + фото</span>
        <span class="template-text">Заголовок, список і місце для ілюстрації</span>
      </button>
      <button class="template-btn" data-template="three-blocks" type="button">
        <span class="template-title">3 блоки</span>
        <span class="template-text">Порівняння трьох ідей або понять</span>
      </button>
    </div>`,
      confirmText: 'Закрити', showCancel: false,
      onMount: () => {
        $$('.template-btn', dom.modalBody).forEach(btn => {
          btn.addEventListener('click', () => { applyTemplate(btn.dataset.template); closeModal(); });
        });
      }
    });
  }

  function showAbout() {
    showInfoModal('Про ПЛЮС Слайди', 'ПЛЮС Слайди — редактор презентацій для шкільного офісного пакета. Текст, зображення, фігури (прямокутник, коло, трикутник), PDF та режим показу.');
  }

  function showShortcuts() {
    showInfoModal('Клавіатурні скорочення',
      'Ctrl+N — нова презентація\nCtrl+O — відкрити\nCtrl+S — зберегти файл\n' +
      'Ctrl+Z / Ctrl+Y — скасувати / повернути\nCtrl+C / Ctrl+V — копіювати / вставити\n' +
      'Ctrl+D — дублювати\nDelete — видалити\nСтрілки — рух об\'єкта\nF5 — показ');
  }

  /* ── Modal helpers ───────────────────────────────────────── */
  function showModal({ title, text = '', body = '', confirmText = 'Гаразд', cancelText = 'Скасувати',
    icon = 'fa-solid fa-circle-info', onConfirm = null, onMount = null, showCancel = true }) {
    dom.modalTitle.textContent = title;
    dom.modalText.textContent = text;
    dom.modalBody.innerHTML = body;
    dom.modalIcon.innerHTML = `<i class="${icon}"></i>`;
    dom.modalConfirm.textContent = confirmText;
    dom.modalCancel.textContent = cancelText;
    dom.modalCancel.classList.toggle('hidden', !showCancel);
    dom.modalOverlay.classList.remove('hidden');
    dom.modalOverlay.classList.add('active');
    dom.modalOverlay.setAttribute('aria-hidden', 'false');
    modalHandlerAbort?.abort();
    modalHandlerAbort = new AbortController();
    dom.modalConfirm.addEventListener('click', () => { onConfirm?.(); closeModal(); }, { signal: modalHandlerAbort.signal });
    dom.modalCancel.addEventListener('click', () => closeModal(), { signal: modalHandlerAbort.signal });
    onMount?.();
  }

  function closeModal() {
    modalHandlerAbort?.abort();
    modalHandlerAbort = null;
    dom.modalOverlay.classList.add('hidden');
    dom.modalOverlay.classList.remove('active');
    dom.modalOverlay.setAttribute('aria-hidden', 'true');
    dom.modalBody.innerHTML = '';
  }

  function showInfoModal(title, text) { showModal({ title, text, confirmText: 'Гаразд', showCancel: false }); }
  function showConfirmModal({ title, text, confirmText = 'Продовжити', onConfirm }) {
    showModal({ title, text, confirmText, cancelText: 'Скасувати', onConfirm });
  }

  document.addEventListener('DOMContentLoaded', boot);

})();
