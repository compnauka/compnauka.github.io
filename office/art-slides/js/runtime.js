;(function(){
'use strict';

/* utils.js */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function downloadTextFile(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getTextFromContentEditable(node) {
  return (node?.textContent || '').replace(/\r/g, '');
}


/* constants.js */
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
  fontSize: 28,
  color: '#111827',
  bold: false,
  italic: false,
  underline: false,
  align: 'left'
};

const DEFAULT_SHAPE_STYLE = {
  fill: '#dbeafe',
  stroke: '#1d4ed8'
};


/* state.js */

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
  currentColorTarget: 'text',
  presentationIndex: 0
};

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
  return state.slides.find(slide => slide.id === state.currentSlideId) || state.slides[0] || null;
}

function getCurrentSlideIndex() {
  return state.slides.findIndex(slide => slide.id === state.currentSlideId);
}

function getSelectedElement() {
  const slide = getCurrentSlide();
  if (!slide) return null;
  return slide.elements.find(element => element.id === state.selectedElementId) || null;
}


/* storage.js */

function saveDraft(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}


/* history.js */

function resetHistory() {
  state.undoStack = [deepClone(serializePresentation())];
  state.redoStack = [];
}

function pushHistory() {
  if (state.suppressHistory) return;
  const snapshot = deepClone(serializePresentation());
  const last = state.undoStack[state.undoStack.length - 1];
  if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return;
  state.undoStack.push(snapshot);
  if (state.undoStack.length > MAX_HISTORY) state.undoStack.shift();
  state.redoStack = [];
}

function undo() {
  if (state.undoStack.length <= 1) return false;
  const current = state.undoStack.pop();
  state.redoStack.push(current);
  const prev = deepClone(state.undoStack[state.undoStack.length - 1]);
  applyPresentationData(prev);
  return true;
}

function redo() {
  if (!state.redoStack.length) return false;
  const next = deepClone(state.redoStack.pop());
  state.undoStack.push(deepClone(next));
  applyPresentationData(next);
  return true;
}


/* templates.js */

function createTextElement(overrides = {}) {
  return {
    id: uid(),
    type: 'text',
    x: 180,
    y: 150,
    w: 600,
    h: 120,
    z: 1,
    content: 'Введіть текст…',
    style: { ...DEFAULT_TEXT_STYLE },
    ...overrides,
    style: { ...DEFAULT_TEXT_STYLE, ...(overrides.style || {}) }
  };
}

function createShapeElement(kind = 'rect', overrides = {}) {
  return {
    id: uid(),
    type: 'shape',
    shape: kind,
    x: 260,
    y: 160,
    w: 420,
    h: 220,
    z: 1,
    content: '',
    style: { ...DEFAULT_TEXT_STYLE, ...DEFAULT_SHAPE_STYLE },
    ...overrides,
    style: { ...DEFAULT_TEXT_STYLE, ...DEFAULT_SHAPE_STYLE, ...(overrides.style || {}) }
  };
}

function createImageElement(src, overrides = {}) {
  return {
    id: uid(),
    type: 'image',
    x: 240,
    y: 130,
    w: 480,
    h: 280,
    z: 1,
    content: src,
    style: { ...DEFAULT_TEXT_STYLE },
    ...overrides,
    style: { ...DEFAULT_TEXT_STYLE, ...(overrides.style || {}) }
  };
}

function createSlide(overrides = {}) {
  return {
    id: uid(),
    background: '#ffffff',
    elements: [],
    ...overrides,
    elements: Array.isArray(overrides.elements) ? overrides.elements : []
  };
}

function createDefaultPresentation() {
  const slide = createSlide({
    elements: [
      createTextElement({
        x: 150,
        y: 110,
        w: 660,
        h: 160,
        z: 1,
        content: 'Привіт!\nСтвори свою презентацію',
        style: { fontSize: 56, align: 'center', bold: true, color: '#111827' }
      }),
      createTextElement({
        x: 240,
        y: 320,
        w: 480,
        h: 80,
        z: 2,
        content: 'Додай текст, фото та фігури',
        style: { fontSize: 28, align: 'center', color: '#475569' }
      })
    ]
  });

  return {
    fileName: 'моя презентація',
    slides: [slide],
    currentSlideId: slide.id,
    selectedElementId: null
  };
}

function createTemplateDefinition(type) {
  if (type === 'title') {
    return {
      background: '#ffffff',
      elements: [
        createShapeElement('rect', {
          x: 60,
          y: 60,
          w: 840,
          h: 420,
          z: 1,
          style: { fill: '#fee2e2', stroke: '#dc2626' }
        }),
        createTextElement({
          x: 110,
          y: 150,
          w: 740,
          h: 160,
          z: 2,
          content: 'НАЗВА ПРЕЗЕНТАЦІЇ',
          style: { fontSize: 56, align: 'center', bold: true, color: '#111827' }
        }),
        createTextElement({
          x: 220,
          y: 330,
          w: 520,
          h: 90,
          z: 3,
          content: 'Автор: …',
          style: { fontSize: 28, align: 'center', color: '#475569' }
        })
      ]
    };
  }

  if (type === 'text-image') {
    return {
      background: '#ffffff',
      elements: [
        createTextElement({
          x: 60,
          y: 50,
          w: 840,
          h: 70,
          z: 1,
          content: 'ЗАГОЛОВОК',
          style: { fontSize: 48, bold: true, color: '#111827' }
        }),
        createTextElement({
          x: 60,
          y: 145,
          w: 410,
          h: 320,
          z: 2,
          content: '• Пункт 1\n• Пункт 2\n• Пункт 3',
          style: { fontSize: 28, color: '#111827' }
        }),
        createShapeElement('rect', {
          x: 500,
          y: 145,
          w: 360,
          h: 300,
          z: 3,
          style: { fill: '#dbeafe', stroke: '#2563eb' }
        }),
        createTextElement({
          x: 540,
          y: 260,
          w: 280,
          h: 80,
          z: 4,
          content: 'Додай фото сюди',
          style: { fontSize: 28, align: 'center', bold: true, color: '#1d4ed8' }
        })
      ]
    };
  }

  return {
    background: '#ffffff',
    elements: [
      createTextElement({
        x: 60,
        y: 44,
        w: 840,
        h: 70,
        z: 1,
        content: 'МІЙ СЛАЙД',
        style: { fontSize: 48, bold: true, align: 'center', color: '#111827' }
      }),
      createShapeElement('rect', {
        x: 55,
        y: 150,
        w: 250,
        h: 320,
        z: 2,
        style: { fill: '#dcfce7', stroke: '#16a34a' }
      }),
      createShapeElement('rect', {
        x: 355,
        y: 150,
        w: 250,
        h: 320,
        z: 3,
        style: { fill: '#dbeafe', stroke: '#2563eb' }
      }),
      createShapeElement('rect', {
        x: 655,
        y: 150,
        w: 250,
        h: 320,
        z: 4,
        style: { fill: '#fae8ff', stroke: '#a21caf' }
      }),
      createTextElement({ x: 80, y: 175, w: 200, h: 70, z: 10, content: 'Ідея 1', style: { fontSize: 32, bold: true, align: 'center' } }),
      createTextElement({ x: 380, y: 175, w: 200, h: 70, z: 11, content: 'Ідея 2', style: { fontSize: 32, bold: true, align: 'center' } }),
      createTextElement({ x: 680, y: 175, w: 200, h: 70, z: 12, content: 'Ідея 3', style: { fontSize: 32, bold: true, align: 'center' } }),
      createTextElement({ x: 80, y: 250, w: 200, h: 170, z: 13, content: 'Напиши тут…', style: { fontSize: 24 } }),
      createTextElement({ x: 380, y: 250, w: 200, h: 170, z: 14, content: 'Напиши тут…', style: { fontSize: 24 } }),
      createTextElement({ x: 680, y: 250, w: 200, h: 170, z: 15, content: 'Напиши тут…', style: { fontSize: 24 } })
    ]
  };
}


/* export.js */

function buildElementNode(element, forThumb = false) {
  const node = document.createElement('div');
  node.style.position = 'absolute';
  node.style.left = `${element.x}px`;
  node.style.top = `${element.y}px`;
  node.style.width = `${element.w}px`;
  node.style.height = `${element.h}px`;
  node.style.zIndex = String(element.z || 1);
  node.style.overflow = 'hidden';

  if (element.type === 'text') {
    node.style.padding = '8px';
    node.style.whiteSpace = 'pre-wrap';
    node.style.wordBreak = 'break-word';
    node.style.lineHeight = '1.15';
    node.style.fontSize = `${element.style.fontSize || 28}px`;
    node.style.fontWeight = element.style.bold ? '900' : '700';
    node.style.fontStyle = element.style.italic ? 'italic' : 'normal';
    node.style.textDecoration = element.style.underline ? 'underline' : 'none';
    node.style.textAlign = element.style.align || 'left';
    node.style.color = element.style.color || '#111827';
    node.textContent = element.content || '';
  }

  if (element.type === 'image') {
    const img = document.createElement('img');
    img.src = element.content;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    node.appendChild(img);
  }

  if (element.type === 'shape') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', element.shape === 'circle' ? 'ellipse' : 'rect');
    if (element.shape === 'circle') {
      shape.setAttribute('cx', '50%');
      shape.setAttribute('cy', '50%');
      shape.setAttribute('rx', '48%');
      shape.setAttribute('ry', '48%');
    } else {
      shape.setAttribute('x', '2%');
      shape.setAttribute('y', '2%');
      shape.setAttribute('width', '96%');
      shape.setAttribute('height', '96%');
      shape.setAttribute('rx', forThumb ? '6' : '12');
      shape.setAttribute('ry', forThumb ? '6' : '12');
    }
    shape.setAttribute('fill', element.style.fill || '#dbeafe');
    shape.setAttribute('stroke', element.style.stroke || '#1d4ed8');
    shape.setAttribute('stroke-width', forThumb ? '8' : '10');
    svg.appendChild(shape);
    node.appendChild(svg);
  }

  return node;
}

function createSlideSnapshot(slide) {
  const wrap = document.createElement('div');
  wrap.style.width = `${STAGE_WIDTH}px`;
  wrap.style.height = `${STAGE_HEIGHT}px`;
  wrap.style.position = 'relative';
  wrap.style.background = slide.background || '#ffffff';
  wrap.style.overflow = 'hidden';
  const elements = [...slide.elements].sort((a, b) => (a.z || 1) - (b.z || 1));
  elements.forEach(element => wrap.appendChild(buildElementNode(element, false)));
  return wrap;
}

function createThumbSnapshot(slide) {
  const mini = document.createElement('div');
  mini.className = 'slide-thumb-mini';
  mini.style.background = slide.background || '#ffffff';
  const elements = [...slide.elements].sort((a, b) => (a.z || 1) - (b.z || 1));
  elements.forEach(element => {
    const node = buildElementNode(element, true);
    node.classList.add('slide-thumb-element');
    mini.appendChild(node);
  });
  return mini;
}

async function exportPresentationPdf(fileName, slides) {
  const container = document.createElement('div');
  container.style.width = `${STAGE_WIDTH}px`;
  slides.forEach((slide, index) => {
    const page = createSlideSnapshot(slide);
    page.style.pageBreakAfter = index === slides.length - 1 ? 'auto' : 'always';
    container.appendChild(page);
  });

  await html2pdf()
    .from(container)
    .set({
      margin: 0,
      filename: `${fileName || 'presentation'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'px', format: [STAGE_WIDTH, STAGE_HEIGHT], orientation: 'landscape' }
    })
    .save();
}

function printPresentation(fileName, slides) {
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) return false;

  const style = `
    <style>
      body { margin: 0; padding: 24px; background: #e5e7eb; font-family: Arial, sans-serif; }
      .page { width: ${STAGE_WIDTH}px; height: ${STAGE_HEIGHT}px; background: #fff; position: relative; overflow: hidden; margin: 0 auto 24px; box-shadow: 0 8px 24px rgba(0,0,0,.12); page-break-after: always; }
    </style>
  `;

  const pages = slides.map(slide => {
    const page = createSlideSnapshot(slide);
    page.className = 'page';
    return page.outerHTML;
  }).join('');

  printWindow.document.write(`<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>${fileName}</title>${style}</head><body>${pages}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}


/* app.js */

const dom = {};
const elementDomMap = new Map();

const pointer = {
  mode: 'none',
  elementId: null,
  handle: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  dragOffsetX: 0,
  dragOffsetY: 0,
  startBox: null
};

const autosave = debounce(() => {
  saveDraft(serializePresentation());
  state.unsavedChanges = false;
  updateDirtyUi();
  setStatusRight(`Автозбережено • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
}, 260);

function setStatusRight(text) {
  dom.statusRight.textContent = text;
}

function updateDirtyUi() {
  dom.dirtyDot.style.display = state.unsavedChanges ? 'inline-block' : 'none';
  dom.saveBadge.textContent = state.unsavedChanges ? 'Є зміни' : 'Збережено ✓';
}

function markDirty(statusText = 'Є незбережені зміни') {
  state.unsavedChanges = true;
  updateDirtyUi();
  setStatusRight(statusText);
  autosave();
}

function normalizePresentation(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.slides) || raw.slides.length === 0) return null;

  const slides = raw.slides.map((slide, slideIndex) => ({
    id: typeof slide.id === 'string' ? slide.id : `slide_${slideIndex}`,
    background: typeof slide.background === 'string' ? slide.background : '#ffffff',
    elements: Array.isArray(slide.elements)
      ? slide.elements.map((element, elementIndex) => normalizeElement(element, elementIndex))
      : []
  }));

  return {
    fileName: typeof raw.fileName === 'string' && raw.fileName.trim() ? raw.fileName.trim() : 'моя презентація',
    slides,
    currentSlideId: slides.some(slide => slide.id === raw.currentSlideId) ? raw.currentSlideId : slides[0].id,
    selectedElementId: null
  };
}

function normalizeElement(element, index) {
  const type = ['text', 'image', 'shape'].includes(element?.type) ? element.type : 'text';
  return {
    id: typeof element?.id === 'string' ? element.id : `el_${index}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    shape: ['rect', 'circle'].includes(element?.shape) ? element.shape : 'rect',
    x: Number.isFinite(element?.x) ? element.x : 120,
    y: Number.isFinite(element?.y) ? element.y : 120,
    w: Number.isFinite(element?.w) ? element.w : 240,
    h: Number.isFinite(element?.h) ? element.h : 120,
    z: Number.isFinite(element?.z) ? element.z : index + 1,
    content: typeof element?.content === 'string' ? element.content : '',
    style: {
      ...DEFAULT_TEXT_STYLE,
      ...DEFAULT_SHAPE_STYLE,
      ...(element?.style || {})
    }
  };
}

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
  const data = saved || createDefaultPresentation();
  applyPresentationData(data);
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

function renderFileName() {
  dom.fileName.textContent = state.fileName;
}

function renderStatus() {
  const index = getCurrentSlideIndex();
  const selected = getSelectedElement();
  dom.statusLeft.textContent = `Слайд ${index + 1} з ${state.slides.length}${selected ? ` • Об’єкт: ${describeElement(selected)}` : ''}`;
}

function describeElement(element) {
  if (element.type === 'text') return 'текст';
  if (element.type === 'image') return 'зображення';
  return element.shape === 'circle' ? 'коло' : 'прямокутник';
}

function renderColorPalette() {
  dom.colorPalette.innerHTML = '';
  COLOR_PALETTE.forEach(color => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-swatch';
    button.title = color.toUpperCase();
    button.style.background = color;
    if (color.toLowerCase() === '#ffffff') button.style.borderColor = '#cbd5e1';
    button.addEventListener('click', () => {
      applyColor(color);
      closeColorPopover();
    });
    dom.colorPalette.appendChild(button);
  });
}

function renderSlideList() {
  dom.slideList.innerHTML = '';
  state.slides.forEach((slide, index) => {
    const card = document.createElement('div');
    card.className = `slide-card${slide.id === state.currentSlideId ? ' active' : ''}`;

    const head = document.createElement('div');
    head.className = 'slide-card-head';
    const title = document.createElement('div');
    title.className = 'slide-card-title';
    title.textContent = `Слайд ${index + 1}`;

    const actions = document.createElement('div');
    actions.className = 'sidebar-actions';
    actions.appendChild(makeMiniAction('fa-regular fa-copy', 'Дублювати', () => duplicateSlide(slide.id)));
    actions.appendChild(makeMiniAction('fa-regular fa-trash-can', 'Видалити', () => confirmDeleteSlide(slide.id)));

    head.append(title, actions);

    const thumbButton = document.createElement('button');
    thumbButton.type = 'button';
    thumbButton.className = 'slide-thumb-button';
    thumbButton.addEventListener('click', () => {
      state.currentSlideId = slide.id;
      state.selectedElementId = null;
      closeColorPopover();
      renderAll();
      setStatusRight('Слайд вибрано');
    });

    const thumb = document.createElement('div');
    thumb.className = 'slide-thumb';
    thumb.appendChild(createThumbSnapshot(slide));
    thumbButton.appendChild(thumb);

    card.append(head, thumbButton);
    dom.slideList.appendChild(card);
  });
}

function makeMiniAction(iconClass, title, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mini-btn';
  button.title = title;
  button.innerHTML = `<i class="${iconClass}"></i>`;
  button.addEventListener('click', event => {
    event.stopPropagation();
    handler();
  });
  return button;
}

function renderStage() {
  dom.stage.innerHTML = '';
  elementDomMap.clear();
  const slide = getCurrentSlide();
  if (!slide) return;

  dom.stage.style.background = slide.background || '#ffffff';
  dom.stage.dataset.baseWidth = String(STAGE_WIDTH);
  dom.stage.dataset.baseHeight = String(STAGE_HEIGHT);

  const sorted = [...slide.elements].sort((a, b) => (a.z || 1) - (b.z || 1));
  sorted.forEach(element => {
    const node = renderElementNode(element);
    elementDomMap.set(element.id, node);
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

  const content = document.createElement('div');
  content.className = 'element-content';

  if (element.type === 'text') {
    const textBox = document.createElement('div');
    textBox.className = 'text-element';
    textBox.contentEditable = 'true';
    textBox.spellcheck = false;
    textBox.textContent = element.content || '';
    applyTextStylesToNode(textBox, element);
    textBox.addEventListener('pointerdown', event => {
      event.stopPropagation();
      selectElement(element.id);
    });
    textBox.addEventListener('input', () => {
      element.content = getTextFromContentEditable(textBox);
      markDirty('Текст змінено');
      renderSlideList();
    });
    textBox.addEventListener('focus', () => selectElement(element.id));
    content.appendChild(textBox);
  }

  if (element.type === 'image') {
    const img = document.createElement('img');
    img.className = 'image-element';
    img.src = element.content;
    img.alt = '';
    img.draggable = false;
    content.appendChild(img);
  }

  if (element.type === 'shape') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'shape-element');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', element.shape === 'circle' ? 'ellipse' : 'rect');
    if (element.shape === 'circle') {
      shape.setAttribute('cx', '50%');
      shape.setAttribute('cy', '50%');
      shape.setAttribute('rx', '48%');
      shape.setAttribute('ry', '48%');
    } else {
      shape.setAttribute('x', '2%');
      shape.setAttribute('y', '2%');
      shape.setAttribute('width', '96%');
      shape.setAttribute('height', '96%');
      shape.setAttribute('rx', '12');
      shape.setAttribute('ry', '12');
    }
    shape.setAttribute('fill', element.style.fill || DEFAULT_SHAPE_STYLE.fill);
    shape.setAttribute('stroke', element.style.stroke || DEFAULT_SHAPE_STYLE.stroke);
    shape.setAttribute('stroke-width', '10');
    svg.appendChild(shape);
    content.appendChild(svg);
  }

  wrap.appendChild(content);
  wrap.appendChild(createHandles(element.id));
  wrap.addEventListener('pointerdown', event => onElementPointerDown(event, element.id));
  return wrap;
}

function createHandles(elementId) {
  const handles = document.createElement('div');
  handles.className = 'resize-handles';
  ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(handleName => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${handleName}`;
    handle.dataset.handle = handleName;
    handle.addEventListener('pointerdown', event => onHandlePointerDown(event, elementId, handleName));
    handles.appendChild(handle);
  });
  return handles;
}

function applyTextStylesToNode(node, element) {
  node.style.fontSize = `${element.style.fontSize || 28}px`;
  node.style.color = element.style.color || '#111827';
  node.style.fontWeight = element.style.bold ? '900' : '700';
  node.style.fontStyle = element.style.italic ? 'italic' : 'normal';
  node.style.textDecoration = element.style.underline ? 'underline' : 'none';
  node.style.textAlign = element.style.align || 'left';
}

function renderToolbarState() {
  const selected = getSelectedElement();
  dom.fontSizeSelect.value = String(selected?.style?.fontSize || FONT_SIZES[1]);
  $$('[data-action="bold"], [data-action="italic"], [data-action="underline"], [data-action="align-left"], [data-action="align-center"], [data-action="align-right"]').forEach(button => {
    button.classList.remove('active');
  });

  if (selected?.type === 'text') {
    if (selected.style.bold) $$('[data-action="bold"]').forEach(btn => btn.classList.add('active'));
    if (selected.style.italic) $$('[data-action="italic"]').forEach(btn => btn.classList.add('active'));
    if (selected.style.underline) $$('[data-action="underline"]').forEach(btn => btn.classList.add('active'));
    $$(`[data-action="align-${selected.style.align || 'left'}"]`).forEach(btn => btn.classList.add('active'));
  }
}

function syncSelectionUi() {
  elementDomMap.forEach((node, id) => {
    node.classList.toggle('selected', id === state.selectedElementId);
  });
}

function selectElement(id) {
  state.selectedElementId = id;
  syncSelectionUi();
  renderToolbarState();
  renderStatus();
}

function clearSelection() {
  state.selectedElementId = null;
  syncSelectionUi();
  renderToolbarState();
  renderStatus();
}

function getStagePoint(clientX, clientY) {
  const rect = dom.stage.getBoundingClientRect();
  const scaleX = STAGE_WIDTH / rect.width;
  const scaleY = STAGE_HEIGHT / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function onElementPointerDown(event, elementId) {
  if (event.target.closest('.text-element')) return;
  event.preventDefault();
  event.stopPropagation();

  const element = findElementById(elementId);
  const node = elementDomMap.get(elementId);
  if (!element || !node) return;

  pushHistory();
  selectElement(elementId);

  const point = getStagePoint(event.clientX, event.clientY);
  pointer.mode = 'drag';
  pointer.elementId = elementId;
  pointer.pointerId = event.pointerId;
  pointer.dragOffsetX = point.x - element.x;
  pointer.dragOffsetY = point.y - element.y;
  node.classList.add('dragging');
  node.setPointerCapture(event.pointerId);
}

function onHandlePointerDown(event, elementId, handle) {
  event.preventDefault();
  event.stopPropagation();

  const element = findElementById(elementId);
  if (!element) return;

  pushHistory();
  selectElement(elementId);

  const point = getStagePoint(event.clientX, event.clientY);
  pointer.mode = 'resize';
  pointer.elementId = elementId;
  pointer.handle = handle;
  pointer.pointerId = event.pointerId;
  pointer.startX = point.x;
  pointer.startY = point.y;
  pointer.startBox = { x: element.x, y: element.y, w: element.w, h: element.h };

  const node = elementDomMap.get(elementId);
  node?.setPointerCapture(event.pointerId);
}

function bindStage() {
  dom.stage.addEventListener('pointerdown', event => {
    if (event.target === dom.stage) clearSelection();
  });

  dom.stage.addEventListener('pointermove', onStagePointerMove);
  dom.stage.addEventListener('pointerup', onStagePointerUp);
  dom.stage.addEventListener('pointercancel', onStagePointerUp);
}

function onStagePointerMove(event) {
  if (pointer.mode === 'none' || pointer.pointerId !== event.pointerId) return;
  const element = findElementById(pointer.elementId);
  const node = elementDomMap.get(pointer.elementId);
  if (!element || !node) return;

  const point = getStagePoint(event.clientX, event.clientY);

  if (pointer.mode === 'drag') {
    element.x = clamp(point.x - pointer.dragOffsetX, 0, STAGE_WIDTH - element.w);
    element.y = clamp(point.y - pointer.dragOffsetY, 0, STAGE_HEIGHT - element.h);
    node.style.left = `${element.x}px`;
    node.style.top = `${element.y}px`;
    return;
  }

  if (pointer.mode === 'resize' && pointer.startBox) {
    const dx = point.x - pointer.startX;
    const dy = point.y - pointer.startY;
    let { x, y, w, h } = pointer.startBox;
    const handle = pointer.handle;
    const has = symbol => handle.includes(symbol);

    if (has('e')) w += dx;
    if (has('s')) h += dy;
    if (has('w')) { x += dx; w -= dx; }
    if (has('n')) { y += dy; h -= dy; }

    w = Math.max(40, w);
    h = Math.max(30, h);
    x = clamp(x, 0, STAGE_WIDTH - w);
    y = clamp(y, 0, STAGE_HEIGHT - h);

    element.x = x;
    element.y = y;
    element.w = w;
    element.h = h;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.width = `${w}px`;
    node.style.height = `${h}px`;
  }
}

function onStagePointerUp(event) {
  if (pointer.mode === 'none' || pointer.pointerId !== event.pointerId) return;
  const node = elementDomMap.get(pointer.elementId);
  node?.classList.remove('dragging');
  pointer.mode = 'none';
  pointer.elementId = null;
  pointer.handle = null;
  pointer.pointerId = null;
  pointer.startBox = null;
  normalizeZIndexes();
  renderSlideList();
  markDirty('Положення змінено');
}

function normalizeZIndexes() {
  const slide = getCurrentSlide();
  if (!slide) return;
  slide.elements
    .sort((a, b) => (a.z || 1) - (b.z || 1))
    .forEach((element, index) => { element.z = index + 1; });
}

function bindMenus() {
  $$('.menu-title').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      toggleMenu(button.dataset.menu);
    });
  });

  $$('.menu-item').forEach(button => {
    button.addEventListener('click', () => {
      dispatchAction(button.dataset.action);
      closeMenus();
    });
  });

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.menu-item-wrap')) closeMenus();
    if (!event.target.closest('.color-popover') && !event.target.closest('[data-color-target]')) closeColorPopover();
  });
}

function bindToolbar() {
  $$('[data-action]').forEach(button => {
    if (button.closest('.menu-dropdown')) return;
    button.addEventListener('click', () => dispatchAction(button.dataset.action));
  });

  $$('[data-color-target]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      openColorPopover(button.dataset.colorTarget);
    });
  });
}

function bindInputs() {
  dom.fontSizeSelect.addEventListener('change', event => setSelectedTextStyle({ fontSize: Number(event.target.value) }));
  dom.projectFileInput.addEventListener('change', onProjectFileSelected);
  dom.imageFileInput.addEventListener('change', onImageFileSelected);

  $('#closeColorPopover').addEventListener('click', closeColorPopover);
  $('#applyCustomColor').addEventListener('click', () => {
    applyColor(dom.customColorInput.value);
    closeColorPopover();
  });

  dom.fileName.addEventListener('click', beginRenameFile);
  dom.fileName.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      beginRenameFile();
    }
  });

  dom.modalOverlay.addEventListener('pointerdown', event => {
    if (event.target === dom.modalOverlay) closeModal();
  });

  document.addEventListener('keydown', handleKeyboardShortcuts);
}

function bindPresentation() {
  dom.presentClose.addEventListener('click', stopPresentation);
  dom.presentPrev.addEventListener('click', showPreviousPresentationSlide);
  dom.presentNext.addEventListener('click', showNextPresentationSlide);
}

function toggleMenu(name) {
  const current = $(`.menu-dropdown[data-menu="${name}"]`);
  const willOpen = !current.classList.contains('open');
  closeMenus();
  if (!willOpen) return;
  current.classList.add('open');
  $(`.menu-title[data-menu="${name}"]`)?.setAttribute('aria-expanded', 'true');
}

function closeMenus() {
  $$('.menu-dropdown.open').forEach(menu => menu.classList.remove('open'));
  $$('.menu-title').forEach(button => button.setAttribute('aria-expanded', 'false'));
}

function openColorPopover(target) {
  state.currentColorTarget = target;
  const titles = {
    text: 'Колір тексту',
    fill: 'Заливка фігури',
    stroke: 'Контур фігури',
    background: 'Фон слайда'
  };
  dom.colorPopoverHint.textContent = titles[target] || 'Виберіть колір';
  dom.colorPopover.classList.remove('hidden');
}

function closeColorPopover() {
  dom.colorPopover.classList.add('hidden');
}

function beginRenameFile() {
  const input = document.createElement('input');
  input.className = 'filename-input';
  input.value = state.fileName;
  dom.fileName.replaceWith(input);
  input.focus();
  input.select();

  const finish = commit => {
    if (commit) {
      const nextName = input.value.trim() || 'моя презентація';
      if (nextName !== state.fileName) {
        pushHistory();
        state.fileName = nextName;
        markDirty('Назву змінено');
      }
    }
    input.replaceWith(dom.fileName);
    renderFileName();
  };

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true), { once: true });
}

function handleKeyboardShortcuts(event) {
  const activeElement = document.activeElement;
  const isTypingInText = activeElement?.classList?.contains('text-element');
  const isTypingInInput = activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName);
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  if (event.key === 'F5') {
    event.preventDefault();
    startPresentation();
    return;
  }

  if (dom.presentOverlay.classList.contains('hidden') === false) {
    if (event.key === 'Escape') stopPresentation();
    if (event.key === 'ArrowLeft') showPreviousPresentationSlide();
    if (event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      showNextPresentationSlide();
    }
    return;
  }

  if (ctrlOrMeta) {
    const key = event.key.toLowerCase();
    if (key === 'z') {
      event.preventDefault();
      if (event.shiftKey) handleRedo(); else handleUndo();
      return;
    }
    if (key === 'y') {
      event.preventDefault();
      handleRedo();
      return;
    }
    if (key === 's') {
      event.preventDefault();
      saveProjectFile();
      return;
    }
    if (key === 'o') {
      event.preventDefault();
      dom.projectFileInput.click();
      return;
    }
    if (key === 'n') {
      event.preventDefault();
      confirmNewProject();
      return;
    }
    if (key === 'p') {
      event.preventDefault();
      handlePrint();
      return;
    }

    if (!isTypingInText && !isTypingInInput) {
      if (key === 'c') {
        event.preventDefault();
        copySelectedElement();
      }
      if (key === 'v') {
        event.preventDefault();
        pasteElement();
      }
      if (key === 'd') {
        event.preventDefault();
        duplicateSelectedElement();
      }
    }
  }

  if (!isTypingInText && !isTypingInInput) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      deleteSelectedElement();
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const selected = getSelectedElement();
      if (!selected) return;
      event.preventDefault();
      pushHistory();
      const step = event.shiftKey ? 10 : 2;
      if (event.key === 'ArrowUp') selected.y = clamp(selected.y - step, 0, STAGE_HEIGHT - selected.h);
      if (event.key === 'ArrowDown') selected.y = clamp(selected.y + step, 0, STAGE_HEIGHT - selected.h);
      if (event.key === 'ArrowLeft') selected.x = clamp(selected.x - step, 0, STAGE_WIDTH - selected.w);
      if (event.key === 'ArrowRight') selected.x = clamp(selected.x + step, 0, STAGE_WIDTH - selected.w);
      renderStage();
      renderSlideList();
      renderStatus();
      markDirty('Об’єкт переміщено');
    }
  }
}

function dispatchAction(action) {
  switch (action) {
    case 'new-project': confirmNewProject(); break;
    case 'open-project': dom.projectFileInput.click(); break;
    case 'save-project': saveProjectFile(); break;
    case 'export-pdf': handleExportPdf(); break;
    case 'print': handlePrint(); break;
    case 'undo': handleUndo(); break;
    case 'redo': handleRedo(); break;
    case 'copy': copySelectedElement(); break;
    case 'paste': pasteElement(); break;
    case 'duplicate-element': duplicateSelectedElement(); break;
    case 'delete-element': deleteSelectedElement(); break;
    case 'insert-text': addTextElement(); break;
    case 'insert-image': promptImageInsert(); break;
    case 'insert-rect': addShape('rect'); break;
    case 'insert-circle': addShape('circle'); break;
    case 'new-slide': addSlide(); break;
    case 'duplicate-slide': duplicateSlide(); break;
    case 'delete-slide': confirmDeleteSlide(); break;
    case 'move-slide-up': moveSlide(-1); break;
    case 'move-slide-down': moveSlide(1); break;
    case 'show-templates': showTemplatesPicker(); break;
    case 'template-title': applyTemplate('title'); break;
    case 'template-text-image': applyTemplate('text-image'); break;
    case 'template-three-blocks': applyTemplate('three-blocks'); break;
    case 'slide-background': openColorPopover('background'); break;
    case 'present': startPresentation(); break;
    case 'bold': toggleTextStyle('bold'); break;
    case 'italic': toggleTextStyle('italic'); break;
    case 'underline': toggleTextStyle('underline'); break;
    case 'align-left': setSelectedTextStyle({ align: 'left' }); break;
    case 'align-center': setSelectedTextStyle({ align: 'center' }); break;
    case 'align-right': setSelectedTextStyle({ align: 'right' }); break;
    case 'bring-front': bringSelectedToFront(); break;
    case 'send-back': sendSelectedToBack(); break;
    case 'about': showAbout(); break;
    case 'shortcuts': showShortcuts(); break;
    default: break;
  }
}

function handleUndo() {
  if (!undo()) return;
  state.unsavedChanges = false;
  updateDirtyUi();
  renderAll();
  setStatusRight('Скасовано');
}

function handleRedo() {
  if (!redo()) return;
  state.unsavedChanges = false;
  updateDirtyUi();
  renderAll();
  setStatusRight('Повернуто');
}

function confirmNewProject() {
  showConfirm({
    title: 'Нова презентація',
    text: 'Поточна презентація буде очищена. Продовжити?',
    confirmText: 'Створити',
    onConfirm: () => {
      clearDraft();
      applyPresentationData(createDefaultPresentation());
      resetHistory();
      state.unsavedChanges = false;
      updateDirtyUi();
      renderAll();
      setStatusRight('Створено нову презентацію');
    }
  });
}

function saveProjectFile() {
  const fileName = `${slugify(state.fileName)}.artslides.json`;
  downloadTextFile(fileName, JSON.stringify(serializePresentation(), null, 2));
  state.unsavedChanges = false;
  updateDirtyUi();
  setStatusRight('Файл збережено');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'presentation';
}

async function onProjectFileSelected() {
  const file = dom.projectFileInput.files?.[0];
  dom.projectFileInput.value = '';
  if (!file) return;
  try {
    const text = await readFileAsText(file);
    const parsed = normalizePresentation(JSON.parse(text));
    if (!parsed) throw new Error('invalid');
    applyPresentationData(parsed);
    resetHistory();
    state.unsavedChanges = false;
    updateDirtyUi();
    renderAll();
    setStatusRight('Файл відкрито');
  } catch {
    showAlert('Не вдалося відкрити файл', 'Перевірте, чи це файл презентації АРТ Слайди у форматі JSON.');
  }
}

function addSlide() {
  pushHistory();
  const slide = createSlide();
  state.slides.push(slide);
  state.currentSlideId = slide.id;
  state.selectedElementId = null;
  renderAll();
  markDirty('Додано новий слайд');
}

function duplicateSlide(slideId = state.currentSlideId) {
  const index = state.slides.findIndex(slide => slide.id === slideId);
  if (index === -1) return;
  pushHistory();
  const original = state.slides[index];
  const clone = deepClone(original);
  clone.id = createSlide().id;
  clone.elements = clone.elements.map((element, elementIndex) => normalizeElement({ ...element, id: null }, elementIndex));
  state.slides.splice(index + 1, 0, clone);
  state.currentSlideId = clone.id;
  state.selectedElementId = null;
  renderAll();
  markDirty('Слайд дубльовано');
}

function confirmDeleteSlide(slideId = state.currentSlideId) {
  if (state.slides.length === 1) {
    showAlert('Не можна видалити', 'У презентації має залишатися хоча б один слайд.');
    return;
  }
  showConfirm({
    title: 'Видалити слайд',
    text: 'Слайд буде видалено без можливості швидкого повернення, якщо ви закриєте сторінку.',
    confirmText: 'Видалити',
    onConfirm: () => deleteSlide(slideId)
  });
}

function deleteSlide(slideId) {
  pushHistory();
  const index = state.slides.findIndex(slide => slide.id === slideId);
  if (index === -1) return;
  state.slides.splice(index, 1);
  const nextIndex = clamp(index, 0, state.slides.length - 1);
  state.currentSlideId = state.slides[nextIndex].id;
  state.selectedElementId = null;
  renderAll();
  markDirty('Слайд видалено');
}

function moveSlide(direction) {
  const currentIndex = getCurrentSlideIndex();
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.slides.length) return;
  pushHistory();
  const [slide] = state.slides.splice(currentIndex, 1);
  state.slides.splice(nextIndex, 0, slide);
  state.currentSlideId = slide.id;
  renderAll();
  markDirty('Слайд переставлено');
}

function addTextElement() {
  pushHistory();
  const slide = getCurrentSlide();
  const element = createTextElement({ z: slide.elements.length + 1 });
  slide.elements.push(element);
  state.selectedElementId = element.id;
  renderAll();
  markDirty('Додано текст');
  requestAnimationFrame(() => {
    const node = elementDomMap.get(element.id)?.querySelector('.text-element');
    node?.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
}

function promptImageInsert() {
  showModal({
    title: 'Додати зображення',
    text: 'Оберіть файл із пристрою або вставте посилання на зображення.',
    body: `
      <div class="form-stack">
        <button id="pickImageFile" class="link-button" type="button"><i class="fa-solid fa-image"></i> Обрати файл</button>
        <input id="imageUrlField" class="input-like" type="text" placeholder="https://...">
        <div class="helper-text">Для учнів і вчителів найнадійніше працює завантаження файлу з комп’ютера.</div>
      </div>
    `,
    confirmText: 'Додати',
    cancelText: 'Скасувати',
    onMount: () => {
      $('#pickImageFile').addEventListener('click', () => dom.imageFileInput.click());
    },
    onConfirm: () => {
      const url = $('#imageUrlField').value.trim();
      if (url) insertImage(url);
    }
  });
}

async function onImageFileSelected() {
  const file = dom.imageFileInput.files?.[0];
  dom.imageFileInput.value = '';
  if (!file) return;
  try {
    const dataUrl = await readFileAsDataURL(file);
    insertImage(dataUrl);
    closeModal();
  } catch {
    showAlert('Не вдалося прочитати файл', 'Спробуйте інше зображення.');
  }
}

function insertImage(src) {
  pushHistory();
  const slide = getCurrentSlide();
  const element = createImageElement(src, { z: slide.elements.length + 1 });
  slide.elements.push(element);
  state.selectedElementId = element.id;
  renderAll();
  markDirty('Додано зображення');
}

function addShape(kind) {
  pushHistory();
  const slide = getCurrentSlide();
  const element = createShapeElement(kind, { z: slide.elements.length + 1 });
  slide.elements.push(element);
  state.selectedElementId = element.id;
  renderAll();
  markDirty('Додано фігуру');
}

function applyTemplate(type) {
  pushHistory();
  const slide = getCurrentSlide();
  const template = createTemplateDefinition(type);
  slide.background = template.background;
  slide.elements = template.elements.map((element, index) => normalizeElement({ ...element, z: index + 1 }, index));
  state.selectedElementId = null;
  renderAll();
  markDirty('Застосовано макет');
}

function findElementById(elementId) {
  const slide = getCurrentSlide();
  if (!slide) return null;
  return slide.elements.find(element => element.id === elementId) || null;
}

function setSelectedTextStyle(partial) {
  const selected = getSelectedElement();
  if (!selected || selected.type !== 'text') return;
  pushHistory();
  Object.assign(selected.style, partial);
  renderStage();
  renderToolbarState();
  renderSlideList();
  markDirty('Формат тексту змінено');
}

function toggleTextStyle(key) {
  const selected = getSelectedElement();
  if (!selected || selected.type !== 'text') return;
  setSelectedTextStyle({ [key]: !selected.style[key] });
}

function applyColor(color) {
  if (state.currentColorTarget === 'background') {
    pushHistory();
    const slide = getCurrentSlide();
    slide.background = color;
    renderStage();
    renderSlideList();
    markDirty('Фон змінено');
    return;
  }

  const selected = getSelectedElement();
  if (!selected) return;
  pushHistory();
  if (state.currentColorTarget === 'text' && selected.type === 'text') selected.style.color = color;
  if (state.currentColorTarget === 'fill' && selected.type === 'shape') selected.style.fill = color;
  if (state.currentColorTarget === 'stroke' && selected.type === 'shape') selected.style.stroke = color;
  renderStage();
  renderSlideList();
  renderToolbarState();
  markDirty('Колір змінено');
}

function bringSelectedToFront() {
  const selected = getSelectedElement();
  if (!selected) return;
  pushHistory();
  const slide = getCurrentSlide();
  selected.z = slide.elements.length + 1;
  normalizeZIndexes();
  renderAll();
  markDirty('Змінено шар');
}

function sendSelectedToBack() {
  const selected = getSelectedElement();
  if (!selected) return;
  pushHistory();
  selected.z = 0;
  normalizeZIndexes();
  renderAll();
  markDirty('Змінено шар');
}

function copySelectedElement() {
  const selected = getSelectedElement();
  if (!selected) return;
  state.clipboard = deepClone(selected);
  setStatusRight('Об’єкт скопійовано');
}

function pasteElement() {
  if (!state.clipboard) return;
  pushHistory();
  const slide = getCurrentSlide();
  const copy = normalizeElement({
    ...deepClone(state.clipboard),
    id: null,
    x: clamp(state.clipboard.x + 24, 0, STAGE_WIDTH - state.clipboard.w),
    y: clamp(state.clipboard.y + 24, 0, STAGE_HEIGHT - state.clipboard.h),
    z: slide.elements.length + 1
  }, slide.elements.length);
  slide.elements.push(copy);
  state.selectedElementId = copy.id;
  renderAll();
  markDirty('Об’єкт вставлено');
}

function duplicateSelectedElement() {
  copySelectedElement();
  pasteElement();
}

function deleteSelectedElement() {
  const selected = getSelectedElement();
  if (!selected) return;
  pushHistory();
  const slide = getCurrentSlide();
  slide.elements = slide.elements.filter(element => element.id !== selected.id);
  state.selectedElementId = null;
  normalizeZIndexes();
  renderAll();
  markDirty('Об’єкт видалено');
}

function handleExportPdf() {
  exportPresentationPdf(state.fileName, state.slides).catch(() => {
    showAlert('Експорт не вдався', 'Не вдалося створити PDF. Спробуйте ще раз.');
  });
}

function handlePrint() {
  const ok = printPresentation(state.fileName, state.slides);
  if (!ok) showAlert('Друк заблоковано', 'Браузер не відкрив вікно друку. Дозвольте спливаючі вікна для цієї сторінки.');
}

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
  if (state.presentationIndex > 0) {
    state.presentationIndex -= 1;
    renderPresentationSlide();
  }
}

function showNextPresentationSlide() {
  if (state.presentationIndex < state.slides.length - 1) {
    state.presentationIndex += 1;
    renderPresentationSlide();
  } else {
    stopPresentation();
  }
}

function renderPresentationSlide() {
  dom.presentStageWrap.innerHTML = '';
  const slide = state.slides[state.presentationIndex];
  if (!slide) return;
  const snapshot = createSlideSnapshot(slide);
  snapshot.classList.add('present-stage');
  dom.presentStageWrap.appendChild(snapshot);
}


function showTemplatesPicker() {
  showModal({
    title: 'Макети слайдів',
    text: 'Оберіть базовий шкільний макет і відразу редагуйте його.',
    body: `
      <div class="template-list">
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
      </div>
    `,
    confirmText: 'Закрити',
    showCancel: false,
    onMount: () => {
      $$('.template-btn', dom.modalBody).forEach(button => {
        button.addEventListener('click', () => {
          applyTemplate(button.dataset.template);
          closeModal();
        });
      });
    }
  });
}

function showAbout() {
  showAlert('Про АРТ Слайди', 'АРТ Слайди — простий редактор презентацій для шкільного офісного пакета. Є базові макети, текст, зображення, фігури, PDF і режим показу.');
}

function showShortcuts() {
  showAlert('Клавіатурні скорочення', 'Ctrl+N — нова презентація\nCtrl+O — відкрити\nCtrl+S — зберегти файл\nCtrl+Z / Ctrl+Y — скасувати / повернути\nCtrl+C / Ctrl+V — копіювати / вставити об’єкт\nCtrl+D — дублювати\nDelete — видалити\nСтрілки — рух об’єкта\nF5 — показ');
}

function showModal({ title, text = '', body = '', confirmText = 'Гаразд', cancelText = 'Скасувати', icon = 'fa-solid fa-circle-info', onConfirm = null, onMount = null, showCancel = true }) {
  dom.modalTitle.textContent = title;
  dom.modalText.textContent = text;
  dom.modalBody.innerHTML = body;
  dom.modalIcon.innerHTML = `<i class="${icon}"></i>`;
  dom.modalConfirm.textContent = confirmText;
  dom.modalCancel.textContent = cancelText;
  dom.modalCancel.classList.toggle('hidden', !showCancel);
  dom.modalOverlay.classList.remove('hidden');

  const confirmHandler = () => {
    onConfirm?.();
    closeModal();
  };
  const cancelHandler = () => closeModal();

  dom.modalConfirm.onclick = confirmHandler;
  dom.modalCancel.onclick = cancelHandler;
  onMount?.();
}

function closeModal() {
  dom.modalOverlay.classList.add('hidden');
  dom.modalBody.innerHTML = '';
  dom.modalConfirm.onclick = null;
  dom.modalCancel.onclick = null;
}

function showAlert(title, text) {
  showModal({
    title,
    text,
    confirmText: 'Гаразд',
    showCancel: false
  });
}

function showConfirm({ title, text, confirmText = 'Так', onConfirm }) {
  showModal({
    title,
    text,
    confirmText,
    cancelText: 'Скасувати',
    onConfirm
  });
}

document.addEventListener('DOMContentLoaded', boot);


})();
