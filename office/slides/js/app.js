import { COLOR_PALETTE, DEFAULT_SHAPE_STYLE, DEFAULT_TEXT_STYLE, FONT_SIZES, STAGE_HEIGHT, STAGE_WIDTH } from './constants.js';
import { exportPresentationPdf, printPresentation, createSlideSnapshot, createThumbSnapshot } from './export.js';
import { pushHistory, redo, resetHistory, undo } from './history.js';
import { state, applyPresentationData, getCurrentSlide, getCurrentSlideIndex, getSelectedElement, serializePresentation } from './state.js';
import { clearDraft, loadDraft, saveDraft } from './storage.js';
import { createBasicSlideElements, createDefaultPresentation, createImageElement, createShapeElement, createSlide, createTemplateDefinition, createTextElement } from './templates.js';
import { $, $$, clamp, debounce, deepClone, downloadTextFile, getTextFromContentEditable, readFileAsDataURL, readFileAsText } from './utils.js';

const dom = {};
const elementDomMap = new Map();

let colorAnchorButton = null;
let draggedSlideId = null;
let modalHandlerAbort = null;

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
  const shape = ['rect', 'circle', 'triangle'].includes(element?.shape) ? element.shape : 'rect';
  const placeholder = typeof element?.placeholder === 'string' && element.placeholder.trim()
    ? element.placeholder
    : (type === 'text' ? 'Введіть текст…' : '');
  const hasTextContent = typeof element?.content === 'string' && element.content.length > 0;
  const isPlaceholder = type === 'text'
    ? (typeof element?.isPlaceholder === 'boolean' ? element.isPlaceholder : !hasTextContent)
    : false;
  const content = type === 'text'
    ? (hasTextContent ? element.content : placeholder)
    : (typeof element?.content === 'string' ? element.content : '');

  return {
    id: typeof element?.id === 'string' ? element.id : `el_${index}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    shape,
    x: Number.isFinite(element?.x) ? element.x : 120,
    y: Number.isFinite(element?.y) ? element.y : 120,
    w: Number.isFinite(element?.w) ? element.w : 240,
    h: Number.isFinite(element?.h) ? element.h : 120,
    z: Number.isFinite(element?.z) ? element.z : index + 1,
    rotation: Number.isFinite(element?.rotation) ? element.rotation : 0,
    content,
    placeholder,
    isPlaceholder,
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
  if (element.shape === 'circle') return 'коло';
  if (element.shape === 'triangle') return 'трикутник';
  return 'прямокутник';
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
    card.draggable = true;
    card.dataset.slideId = slide.id;

    card.addEventListener('click', () => {
      state.currentSlideId = slide.id;
      state.selectedElementId = null;
      closeColorPopover();
      renderAll();
      setStatusRight('Слайд вибрано');
    });

    const startDrag = event => {
      draggedSlideId = slide.id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', slide.id);
      requestAnimationFrame(() => card.classList.add('dragging-card'));
    };
    card.addEventListener('dragstart', startDrag);
    card.addEventListener('dragend', () => {
      draggedSlideId = null;
      card.classList.remove('dragging-card');
      $$('.slide-card.drag-over').forEach(node => node.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', event => {
      event.preventDefault();
      if (draggedSlideId && draggedSlideId !== slide.id) card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', event => {
      event.preventDefault();
      card.classList.remove('drag-over');
      const fromId = draggedSlideId || event.dataTransfer.getData('text/plain');
      if (fromId && fromId !== slide.id) reorderSlides(fromId, slide.id);
    });

    const head = document.createElement('div');
    head.className = 'slide-card-head';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'slide-card-title-wrap';

    const dragHandle = document.createElement('button');
    dragHandle.type = 'button';
    dragHandle.className = 'slide-drag-handle';
    dragHandle.title = 'Перетягни, щоб змінити порядок';
    dragHandle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
    dragHandle.draggable = true;
    dragHandle.addEventListener('dragstart', startDrag);
    dragHandle.addEventListener('click', event => event.stopPropagation());

    const title = document.createElement('div');
    title.className = 'slide-card-title';
    title.textContent = `Слайд ${index + 1}`;
    titleWrap.append(dragHandle, title);

    const cardActions = document.createElement('div');
    cardActions.className = 'slide-card-actions';
    cardActions.appendChild(makeMiniAction('fa-solid fa-arrow-up', 'Перемістити вгору', () => moveSlideById(slide.id, -1)));
    cardActions.appendChild(makeMiniAction('fa-solid fa-arrow-down', 'Перемістити вниз', () => moveSlideById(slide.id, 1)));
    cardActions.appendChild(makeMiniAction('fa-regular fa-copy', 'Дублювати слайд', () => duplicateSlide(slide.id)));
    cardActions.appendChild(makeMiniAction('fa-regular fa-trash-can', 'Видалити слайд', () => confirmDeleteSlide(slide.id)));

    head.append(titleWrap, cardActions);

    const thumbButton = document.createElement('button');
    thumbButton.type = 'button';
    thumbButton.className = 'slide-thumb-button';
    thumbButton.draggable = false;

    const thumb = document.createElement('div');
    thumb.className = 'slide-thumb';
    thumb.appendChild(createThumbSnapshot(slide));
    thumbButton.appendChild(thumb);

    card.append(head, thumbButton);
    dom.slideList.appendChild(card);
  });
}

function reorderSlides(fromId, toId) {
  const fromIndex = state.slides.findIndex(slide => slide.id === fromId);
  const toIndex = state.slides.findIndex(slide => slide.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
  pushHistory();
  const [slide] = state.slides.splice(fromIndex, 1);
  state.slides.splice(toIndex, 0, slide);
  state.currentSlideId = slide.id;
  renderAll();
  markDirty('Порядок слайдів змінено');
}

function moveSlideById(slideId, direction) {
  const index = state.slides.findIndex(slide => slide.id === slideId);
  if (index === -1) return;
  state.currentSlideId = slideId;
  moveSlide(direction);
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
  wrap.style.transform = `rotate(${element.rotation || 0}deg)`;

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
    textBox.addEventListener('focus', () => {
      selectElement(element.id);
      if (element.isPlaceholder) {
        element.content = '';
        element.isPlaceholder = false;
        textBox.textContent = '';
        applyTextStylesToNode(textBox, element);
      }
    });
    textBox.addEventListener('input', () => {
      const value = getTextFromContentEditable(textBox);
      element.content = value;
      element.isPlaceholder = false;
      markDirty('Текст змінено');
      renderSlideList();
    });
    textBox.addEventListener('blur', () => {
      const value = getTextFromContentEditable(textBox).trim();
      if (!value && element.placeholder) {
        element.content = element.placeholder;
        element.isPlaceholder = true;
        textBox.textContent = element.placeholder;
        applyTextStylesToNode(textBox, element);
        renderSlideList();
        markDirty('Поле очищено');
      }
    });
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
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'shape-element');
    let shape;
    if (element.shape === 'circle') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      shape.setAttribute('cx', '50%');
      shape.setAttribute('cy', '50%');
      shape.setAttribute('rx', '48%');
      shape.setAttribute('ry', '48%');
    } else if (element.shape === 'triangle') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      shape.setAttribute('points', '50,4 96,96 4,96');
    } else {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shape.setAttribute('x', '2%');
      shape.setAttribute('y', '2%');
      shape.setAttribute('width', '96%');
      shape.setAttribute('height', '96%');
      shape.setAttribute('rx', '12');
      shape.setAttribute('ry', '12');
    }
    shape.setAttribute('fill', element.style.fill || DEFAULT_SHAPE_STYLE.fill);
    shape.setAttribute('stroke', element.style.stroke || DEFAULT_SHAPE_STYLE.stroke);
    shape.setAttribute('stroke-width', '8');
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
  node.style.color = element.isPlaceholder ? (element.style.color || '#94a3b8') : (element.style.color || '#111827');
  node.style.fontWeight = element.style.bold ? '900' : '700';
  node.style.fontStyle = element.isPlaceholder ? 'normal' : (element.style.italic ? 'italic' : 'normal');
  node.style.textDecoration = element.isPlaceholder ? 'none' : (element.style.underline ? 'underline' : 'none');
  node.style.textAlign = element.style.align || 'left';
  node.classList.toggle('is-placeholder', !!element.isPlaceholder);
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
      dispatchAction(button.dataset.action, button);
      closeMenus();
    });
  });

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.menu-item-wrap')) closeMenus();
    if (!event.target.closest('.color-popover') && !event.target.closest('#colorPanelBtn')) closeColorPopover();
  });
}

function bindToolbar() {
  $$('[data-action]').forEach(button => {
    if (button.closest('.menu-dropdown')) return;
    button.addEventListener('click', event => dispatchAction(button.dataset.action, event.currentTarget));
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
  window.addEventListener('resize', () => { if (!dom.colorPopover.classList.contains('hidden')) positionColorPopover(); });
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

function getAvailableColorModes() {
  const selected = getSelectedElement();
  const modes = [];
  if (selected?.type === 'text') modes.push({ key: 'text', label: 'Текст' });
  if (selected?.type === 'shape') {
    modes.push({ key: 'fill', label: 'Заливка' });
    modes.push({ key: 'stroke', label: 'Контур' });
  }
  modes.push({ key: 'background', label: 'Фон слайда' });
  return modes;
}

function renderColorModeButtons() {
  dom.colorModeButtons.innerHTML = '';
  const modes = getAvailableColorModes();
  if (!modes.some(mode => mode.key === state.currentColorTarget)) {
    state.currentColorTarget = modes[0]?.key || 'background';
  }
  modes.forEach(mode => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `color-mode-btn${mode.key === state.currentColorTarget ? ' active' : ''}`;
    button.textContent = mode.label;
    button.addEventListener('click', () => {
      state.currentColorTarget = mode.key;
      renderColorModeButtons();
      const titles = {
        text: 'Колір тексту',
        fill: 'Заливка фігури',
        stroke: 'Контур фігури',
        background: 'Фон слайда'
      };
      dom.colorPopoverHint.textContent = titles[mode.key] || 'Виберіть колір';
    });
    dom.colorModeButtons.appendChild(button);
  });
}

function positionColorPopover() {
  if (!colorAnchorButton) return;
  const rect = colorAnchorButton.getBoundingClientRect();
  const popWidth = dom.colorPopover.offsetWidth || 290;
  const popHeight = dom.colorPopover.offsetHeight || 260;
  const left = Math.min(window.innerWidth - popWidth - 12, Math.max(12, rect.left));
  const top = Math.min(window.innerHeight - popHeight - 12, rect.bottom + 8);
  dom.colorPopover.style.left = `${left}px`;
  dom.colorPopover.style.top = `${top}px`;
}

function openColorPopover(target = null, anchorButton = null) {
  const selected = getSelectedElement();
  if (target) state.currentColorTarget = target;
  if (!target) {
    if (selected?.type === 'text') state.currentColorTarget = 'text';
    else if (selected?.type === 'shape') state.currentColorTarget = 'fill';
    else state.currentColorTarget = 'background';
  }
  colorAnchorButton = anchorButton || colorAnchorButton || dom.colorPanelBtn;
  renderColorModeButtons();
  const titles = {
    text: 'Колір тексту',
    fill: 'Заливка фігури',
    stroke: 'Контур фігури',
    background: 'Фон слайда'
  };
  dom.colorPopoverHint.textContent = titles[state.currentColorTarget] || 'Виберіть колір';
  dom.colorPopover.classList.remove('hidden');
  requestAnimationFrame(positionColorPopover);
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

function dispatchAction(action, trigger = null) {
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
    case 'color-panel': openColorPopover(null, trigger); break;
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
  showConfirmModal({
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
    showInfoModal('Не вдалося відкрити файл', 'Перевірте, чи це файл презентації ПЛЮС Слайди у форматі JSON.');
  }
}

function addSlide() {
  pushHistory();
  const slide = createSlide({ elements: createBasicSlideElements() });
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
    showInfoModal('Не можна видалити', 'У презентації має залишатися хоча б один слайд.');
    return;
  }
  showConfirmModal({
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
    showInfoModal('Не вдалося прочитати файл', 'Спробуйте інше зображення.');
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
  const count = slide.elements.filter(element => element.type === 'shape').length;
  const base = createShapeElement(kind, {
    x: kind === 'circle' ? 320 : (kind === 'triangle' ? 315 : 285),
    y: kind === 'circle' ? 160 : 150,
    z: slide.elements.length + 1
  });
  base.x = clamp(base.x + (count % 4) * 24, 24, STAGE_WIDTH - base.w - 24);
  base.y = clamp(base.y + (count % 4) * 18, 24, STAGE_HEIGHT - base.h - 24);
  slide.elements.push(base);
  state.selectedElementId = base.id;
  renderAll();
  markDirty(kind === 'triangle' ? 'Додано трикутник' : 'Додано фігуру');
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
    renderColorModeButtons();
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
  renderColorModeButtons();
  markDirty('Колір змінено');
}

function rotateSelected(delta) {
  const selected = getSelectedElement();
  if (!selected) return;
  pushHistory();
  selected.rotation = (((selected.rotation || 0) + delta) % 360 + 360) % 360;
  renderStage();
  renderSlideList();
  markDirty('Об’єкт повернуто');
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
    showInfoModal('Експорт не вдався', 'Не вдалося створити PDF. Спробуйте ще раз.');
  });
}

function handlePrint() {
  const ok = printPresentation(state.fileName, state.slides);
  if (!ok) showInfoModal('Друк заблоковано', 'Браузер не відкрив вікно друку. Дозвольте спливаючі вікна для цієї сторінки.');
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
  showInfoModal('Про ПЛЮС Слайди', 'ПЛЮС Слайди — простий редактор презентацій для шкільного офісного пакета. Є базові макети, текст, зображення, фігури, PDF і режим показу.');
}

function showShortcuts() {
  showInfoModal('Клавіатурні скорочення', 'Ctrl+N — нова презентація\nCtrl+O — відкрити\nCtrl+S — зберегти файл\nCtrl+Z / Ctrl+Y — скасувати / повернути\nCtrl+C / Ctrl+V — копіювати / вставити об’єкт\nCtrl+D — дублювати\nDelete — видалити\nСтрілки — рух об’єкта\nF5 — показ');
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

  modalHandlerAbort?.abort();
  modalHandlerAbort = new AbortController();
  dom.modalConfirm.addEventListener('click', confirmHandler, { signal: modalHandlerAbort.signal });
  dom.modalCancel.addEventListener('click', cancelHandler, { signal: modalHandlerAbort.signal });
  onMount?.();
}

function closeModal() {
  modalHandlerAbort?.abort();
  modalHandlerAbort = null;
  dom.modalOverlay.classList.add('hidden');
  dom.modalBody.innerHTML = '';
}

function showInfoModal(title, text) {
  showModal({
    title,
    text,
    confirmText: 'Гаразд',
    showCancel: false
  });
}

function showConfirmModal({ title, text, confirmText = 'Продовжити', onConfirm }) {
  showModal({
    title,
    text,
    confirmText,
    cancelText: 'Скасувати',
    onConfirm
  });
}

document.addEventListener('DOMContentLoaded', boot);

