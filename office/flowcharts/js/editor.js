/* ===== РОЗШИРЕНИЙ РЕДАКТОР БЛОК-СХЕМ — script.js (повна виправлена версія) ===== */

window.initFlowchartsEditor = function initFlowchartsEditor() {
  'use strict';

  const UI = window.ArtSchemesUI || {};
  const editorUtils = window.FlowchartsEditorUtils || {};
  const autosaveApi = window.FlowchartsAutosave || {};
  const modalsApi = window.FlowchartsModals || {};
  const titleApi = window.FlowchartsTitle || {};
  const routingApi = window.FlowchartsRouting || {};
  const connectionsDomApi = window.FlowchartsConnectionsDom || {};
  const shapeGeometryApi = window.FlowchartsShapeGeometry || {};
  const handlesApi = window.FlowchartsHandles || {};
  const shapePlacementApi = window.FlowchartsShapePlacement || {};
  const statusApi = window.FlowchartsStatus || {};
  const connectionSelectionApi = window.FlowchartsConnectionSelection || {};
  const shapeDeletionApi = window.FlowchartsShapeDeletion || {};

  const core = window.FlowchartCore || null;
  const projectIo = window.FlowchartsProjectIO || null;

  // ================= DOM =================
  const canvas = document.getElementById('flowchart-canvas');
  const canvasContainer = document.getElementById('canvas-container');
  const svgLayer = document.getElementById('connectors-layer');
  const headerEl = document.querySelector('header');

  const clearButton = document.getElementById('clear-button');
  const saveButton = document.getElementById('save-button');
  const newProjectButton = document.getElementById('new-project-button');
  const openProjectButton = document.getElementById('open-project-button');
  const saveProjectButton = document.getElementById('save-project-button');
  const snapToggleButton = document.getElementById('snap-toggle-button');
  const undoButton = document.getElementById('undo-button');
  let redoButton = document.getElementById('redo-button');

  const textModal = document.getElementById('text-modal');
  const shapeTextArea = document.getElementById('shape-text');
  const cancelText = document.getElementById('cancel-text');
  const saveText = document.getElementById('save-text');

  const helpButton = document.getElementById('help-button');
  const selectionStateEl = document.getElementById('selection-state');
  const toolbarEditBtn = document.getElementById('toolbar-edit-button');
  const toolbarRouteBtn = document.getElementById('toolbar-route-button');
  const toolbarLabelBtn = document.getElementById('toolbar-label-button');
  const toolbarDeleteBtn = document.getElementById('toolbar-delete-button');
  const helpPanel = document.getElementById('help-panel');
  const helpClose = document.getElementById('help-close');

  // topUndoBtn / topSaveBtn are now the main undo/save buttons — no delegation needed

  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const zoomLevelText = document.getElementById('zoom-level');

  const connectionModal = document.getElementById('connection-modal');
  const connectionYesBtn = document.getElementById('connection-yes');
  const connectionNoBtn = document.getElementById('connection-no');
  const cancelConnBtn = document.getElementById('cancel-connection');

  const connectionBar = null;
  let shapeBar = null;
  const deleteConnBtn = null;
  const routeConnBtn = toolbarRouteBtn;
  let editShapeBtn = toolbarEditBtn;
  let deleteShapeBtn = toolbarDeleteBtn;
  let editConnLabelBtn = toolbarLabelBtn;
  const saveTitleModal = document.getElementById('save-title-modal');
  const saveTitleInput = document.getElementById('save-title-input');
  const saveWithTitleBtn = document.getElementById('save-with-title');
  const saveWithoutTitleBtn = document.getElementById('save-without-title');
  const closeSaveTitleBtn = document.getElementById('close-save-title');

  const titleInput = document.getElementById('diagram-title-input');
  const titleDisplay = document.getElementById('diagram-title-display');
  const fileNameEl = document.getElementById('fileName');
  const dirtyDotEl = document.getElementById('dirtyDot');
  const savedBadgeEl = document.getElementById('savedBadge');

  if (!canvas || !canvasContainer || !svgLayer) {
    console.error('Flowchart editor: required DOM nodes are missing.');
    return;
  }

  function updateFloatingBarOffset() {
    /* floating bars removed in toolbar refactor */
  }

  const legacyDeleteButton = document.getElementById('delete-button');
  legacyDeleteButton?.remove();

  if (undoButton) {
    undoButton.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
    undoButton.setAttribute('aria-label', 'Скасувати');
    undoButton.title = 'Скасувати (Ctrl+Z)';
  }

  if (saveButton) {
    saveButton.setAttribute('aria-label', 'Зберегти зображення');
    saveButton.title = 'Зберегти зображення (Ctrl+S)';
  }

  function updateSnapButton() {
    const active = state.snapEnabled;
    snapToggleButton?.setAttribute('aria-pressed', String(active));
    snapToggleButton?.classList.toggle('is-active', active);
    if (snapToggleButton) {
      snapToggleButton.title = active
        ? 'Прив\'язка до сітки увімкнена (G)'
        : 'Прив\'язка до сітки вимкнена (G)';
    }
    document.querySelector('.menu-item[data-action="toggle-grid"]')?.classList.toggle('checked', active);
  }

  snapToggleButton?.addEventListener('click', () => {
    state.snapEnabled = !state.snapEnabled;
    updateSnapButton();
  });

  const projectFileInput = document.createElement('input');
  projectFileInput.id = 'project-file-input';
  projectFileInput.type = 'file';
  projectFileInput.accept = '.json,application/json';
  projectFileInput.hidden = true;
  document.body.appendChild(projectFileInput);

  document.querySelectorAll('.title-hint, .color-hint').forEach((el) => el.remove());

  // ================= STATE =================
  const DEFAULT_BASE_COLORS = core?.DEFAULT_BASE_COLORS
    ? { ...core.DEFAULT_BASE_COLORS }
    : {
      'start-end': '#4caf50',
      'process': '#03a9f4',
      'decision': '#ff9800',
      'input-output': '#3f51b5',
    };

  const state = {
    shapes: [],           // {id,type,color,textRaw}
    connections: [],      // {id,from,to,type,routeMode}
    selectedShape: null,
    selectedConnId: null,

    baseColors: { ...DEFAULT_BASE_COLORS },
    currentColor: '#3f51b5',
    lastShapeType: 'process',
    snapEnabled: true,

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
    redoStack: [],
    MAX_UNDO: 30,

    // schedulers
    _refreshRaf: 0,
  };

  const ROUTE_MODES = core?.ROUTE_MODES ? [...core.ROUTE_MODES] : ['auto', 'vertical', 'horizontal'];
  const ROUTE_MODE_LABELS = {
    auto: 'Авто',
    vertical: 'Вертикально',
    horizontal: 'Горизонтально',
  };
  ROUTE_MODE_LABELS['bypass-left'] = ROUTE_MODE_LABELS['bypass-left'] || 'Обхід ліворуч';
  ROUTE_MODE_LABELS['bypass-right'] = ROUTE_MODE_LABELS['bypass-right'] || 'Обхід праворуч';
  const MERGE_LEAD = 34;
  const GRID_SIZE = 20;
  const AUTOSAVE_STORAGE_KEY = 'flowchart-designer-2-autosave';

  // ================= UNDO SNAPSHOTS =================
  function captureSnapshot() {
    const shapeSnap = state.shapes.map(s => {
      const el = document.getElementById(s.id);
      return {
        id: s.id,
        type: s.type,
        color: s.color,
        textRaw: s.textRaw,
        left: el ? el.offsetLeft : 0,
        top: el ? el.offsetTop : 0,
      };
    });
    const connSnap = state.connections.map(c => ({ ...c }));

    return {
      shapes: shapeSnap,
      connections: connSnap,
      baseColors: { ...state.baseColors },
      diagramTitle: state.diagramTitle,
      shapeCounter: state.shapeCounter,
      lastShapeType: state.lastShapeType,
      snapEnabled: state.snapEnabled,
    };
  }

  function updateHistoryButtons() {
    if (undoButton) undoButton.disabled = state.undoStack.length === 0;
    if (redoButton) redoButton.disabled = state.redoStack.length === 0;
  }

  const statusController = statusApi.createStatusController?.({ dirtyDotEl, savedBadgeEl }) || {};
  const setDirty = statusController.setDirty || (() => {});
  const flashSavedBadge = statusController.flashSavedBadge || (() => {});

  function saveSnapshot() {
    state.undoStack.push(captureSnapshot());

    if (state.undoStack.length > state.MAX_UNDO) state.undoStack.shift();
    state.redoStack = [];
    updateHistoryButtons();
    setDirty(true);
    scheduleAutosave();
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
    state.activeShape = null;
    state.dragState = null;
    state.connDrag = null;
    state.pendingConn = null;
    titleController.cancel?.();
    if (state._refreshRaf) cancelAnimationFrame(state._refreshRaf);
    state._refreshRaf = 0;

    state.baseColors = { ...DEFAULT_BASE_COLORS, ...(snap.baseColors || {}) };
    state.diagramTitle = snap.diagramTitle || '';
    state.shapeCounter = snap.shapeCounter || 0;
    state.lastShapeType = snap.lastShapeType || 'process';
    state.snapEnabled = snap.snapEnabled !== undefined ? !!snap.snapEnabled : true;

    titleController.syncInput?.();
    renderTitle();
    updateSnapButton();

    (snap.shapes || []).forEach(s => {
      createShape(s.type, s.color, s.textRaw, s.left, s.top, s.id, true);
      const num = parseInt((s.id || '').split('-')[1], 10);
      if (!Number.isNaN(num)) state.shapeCounter = Math.max(state.shapeCounter, num);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        (snap.connections || []).forEach(c => {
          const fromEl = document.getElementById(c.from);
          const toEl = document.getElementById(c.to);
          if (fromEl && toEl) {
            connectShapes(fromEl, toEl, c.type || null, c.id, true, c.routeMode || 'auto');
            const restoredConn = state.connections.find(conn => conn.id === c.id);
            if (restoredConn) restoredConn.label = c.label ?? null;
          }
        });
        scheduleRefresh();
        updateConnectionBar();
        syncColorPickerToCurrent();
      });
    });

    updateHistoryButtons();
    scheduleAutosave();
  }

  function undo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push(captureSnapshot());
    if (state.redoStack.length > state.MAX_UNDO) state.redoStack.shift();
    const snap = state.undoStack.pop();
    restoreSnapshot(snap);
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push(captureSnapshot());
    if (state.undoStack.length > state.MAX_UNDO) state.undoStack.shift();
    const snap = state.redoStack.pop();
    restoreSnapshot(snap);
  }

  updateHistoryButtons();
  undoButton?.addEventListener('click', undo);
  redoButton?.addEventListener('click', redo);


  const openModal = UI.openModal || ((modal) => modal?.classList.add('active'));
  const closeModal = UI.closeModal || ((modal) => modal?.classList.remove('active'));

  const modalHelpers = modalsApi.createModalHelpers?.({ openModal, closeModal }) || {};
  const showMessageModal = modalHelpers.showMessageModal || (() => {});
  const showConfirmModal = modalHelpers.showConfirmModal || (() => {});
  const showRestoreDraftModal = modalHelpers.showRestoreDraftModal || (() => {});
  modalHelpers.bindBackdropClose?.();

  const rgbToHex = editorUtils.rgbToHex || (() => '#ffffff');
  const sanitizeFilename = editorUtils.sanitizeFilename || ((name) => (name || 'блок-схема').trim() || 'блок-схема');

  // ================= TITLE =================
  function findStartElement() {
    const startShape = state.shapes.find(s => s.type === 'start-end' && (s.textRaw || '').trim().toLowerCase() === 'початок');
    return startShape ? document.getElementById(startShape.id) : null;
  }

  const titleController = titleApi.createTitleController?.({
    titleInput,
    titleDisplay,
    fileNameEl,
    getTitle: () => state.diagramTitle,
    setTitle: (value) => { state.diagramTitle = value; },
    onChange: () => scheduleAutosave(),
  }) || {};
  const renderTitle = titleController.render || (() => {});
  const scheduleTitleUpdate = titleController.schedule || (() => {});
  titleController.bindInput?.();

  const autosave = autosaveApi.createAutosaveController?.({
    storageKey: AUTOSAVE_STORAGE_KEY,
    collectProjectData,
    parseProject: core?.parseProject,
    showRestoreDraftModal,
    onRestoreDraft: (project) => {
      restoreSnapshot(project);
      setDirty(false);
      showMessageModal('Чернетку відкрито.');
    },
    onDiscardDraft: () => setDirty(false),
  }) || {};
  const persistAutosave = autosave.persist || (() => {});
  const scheduleAutosave = autosave.schedule || (() => {});
  const promptRestoreAutosave = autosave.promptRestore || (() => {});

  // ================= TEXT WRAP =================
  const smartWrapText = (raw, type) => editorUtils.smartWrapText?.(raw, type, core) || '';

  function hasStartBlock() {
    return state.shapes.some(s => s.type === 'start-end' && (s.textRaw || '').trim().toLowerCase() === 'початок');
  }

  function getDefaultText(type) {
    if (core?.getDefaultText) return core.getDefaultText(type, state.shapes);
    switch (type) {
      case 'start-end': return hasStartBlock() ? 'Кінець' : 'Початок';
      case 'process': return 'Дія';
      case 'decision': return 'Умова?';
      case 'input-output': return 'Ввід / Вивід';
      default: return '';
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

  function snapToGrid(value) {
    if (!state.snapEnabled) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  // ================= HANDLES (SVG) =================
  const DECISION_HANDLE_OUTSET = 8; // px: handles sit slightly outside the diamond
  const DECISION_CONN_OUTSET = 2; // px: keep endpoints close to diamond border

  const shapeGeometry = shapeGeometryApi.createShapeGeometry?.({
    core,
    state,
    decisionHandleOutset: DECISION_HANDLE_OUTSET,
    decisionConnOutset: DECISION_CONN_OUTSET,
  }) || {};
  const decisionVertexDistance = shapeGeometry.decisionVertexDistance || (() => 0);
  const domShapeToBox = shapeGeometry.domShapeToBox || (() => ({ left: 0, top: 0, width: 0, height: 0, type: 'process' }));
  const findShapeAt = shapeGeometry.findShapeAt || (() => null);
  const getHandlePositions = shapeGeometry.getHandlePositions || (() => ({}));

  const handles = handlesApi.createHandlesController?.({
    svgLayer,
    state,
    getHandlePositions,
    clientToCanvas,
    findShapeAt,
    getShapeData: (shapeId) => state.shapes.find(shape => shape.id === shapeId),
    onDecisionConnect: ({ fromEl, toEl }) => {
      state.pendingConn = { fromEl, toEl };
      openModal(connectionModal);
    },
    onDirectConnect: ({ fromEl, toEl }) => {
      saveSnapshot();
      connectShapes(fromEl, toEl, null);
    },
  }) || {};
  const createHandleGroup = handles.createHandleGroup || (() => null);
  const hideAllHandles = handles.hideAllHandles || (() => {});
  const removeHandleGroup = handles.removeHandleGroup || (() => {});
  const showHandlesForShape = handles.showHandlesForShape || (() => {});
  const updateAllHandleGroups = handles.updateAllHandleGroups || (() => {});
  const updateHandleGroup = handles.updateHandleGroup || (() => {});

  // ================= CONNECTIONS (orthogonal) =================
  const routing = routingApi.createRouting?.({
    core,
    state,
    routeModes: ROUTE_MODES,
    mergeLead: MERGE_LEAD,
    decisionConnOutset: DECISION_CONN_OUTSET,
    domShapeToBox,
    decisionVertexDistance,
  }) || {};
  const buildMergeContext = routing.buildMergeContext || (() => ({}));
  const computeConnectionGeometry = routing.computeConnectionGeometry || (() => ({ d: '', pts: [] }));
  const pointAlongPolyline = routing.pointAlongPolyline || ((points) => points?.[0] || { x: 0, y: 0 });

  const connectionsDom = connectionsDomApi.createConnectionsDom?.({
    core,
    state,
    svgLayer,
    routeModes: ROUTE_MODES,
    buildMergeContext,
    computeConnectionGeometry,
    pointAlongPolyline,
    onSelectConnection: (connId) => selectConnection(connId),
    onDuplicateConnection: () => showMessageModal('Ці фігури вже з\'єднані!'),
  }) || {};
  const removeConnectionDom = connectionsDom.removeConnectionDom || (() => {});
  const updateConnection = connectionsDom.updateConnection || (() => {});
  const updateConnectionsForShape = connectionsDom.updateConnectionsForShape || (() => {});
  const connectShapes = connectionsDom.connectShapes || (() => null);

  // ================= SELECT CONNECTION =================
  const connectionSelection = connectionSelectionApi.createConnectionSelectionController?.({
    state,
    routeModes: ROUTE_MODES,
    routeModeLabels: ROUTE_MODE_LABELS,
    selectionStateEl,
    routeButton: routeConnBtn,
    labelButton: editConnLabelBtn,
    editShapeButton: editShapeBtn,
    deleteButton: toolbarDeleteBtn,
    saveSnapshot,
    updateConnection,
    deselectAll,
    hideAllHandles,
    openModal,
    closeModal,
  }) || {};
  const clearConnectionSelection = connectionSelection.clearConnectionSelection || ((updateBar = true) => {
    state.selectedConnId = null;
    if (updateBar) updateConnectionBar();
  });
  const selectConnection = connectionSelection.selectConnection || (() => {});
  const updateConnectionBar = connectionSelection.updateConnectionBar || (() => {});
  const cycleSelectedConnectionRouteMode = connectionSelection.cycleSelectedConnectionRouteMode || (() => {});

  function deleteConnection(connId) {
    const conn = state.connections.find(c => c.id === connId);
    if (!conn) return;
    saveSnapshot();
    removeConnectionDom(connId);
    state.connections = state.connections.filter(c => c.id !== connId);
    clearConnectionSelection();
  }

  // ================= SHAPES =================
  const shapePlacement = shapePlacementApi.createShapePlacement?.({ state, snapToGrid }) || {};
  const getShapeSizeHint = shapePlacement.getShapeSizeHint || (() => ({ w: 150, h: 84 }));
  const resolveShapePosition = shapePlacement.resolveShapePosition || (() => ({ left: 20, top: 20 }));

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
    const defaultTop = (canvasContainer.scrollTop + containerRect.height / 3) / state.scale - 30;
    const position = resolveShapePosition(type, { posLeft, posTop, defaultLeft, defaultTop });
    shape.style.left = position.left + 'px';
    shape.style.top = position.top + 'px';

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
    let longPressPointerId = null;
    shape.addEventListener('pointerdown', (ev) => {
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressPointerId = ev.pointerId;
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        longPressPointerId = null;
        openTextModal(shape);
      }, 650);
    });
    const cancelLP = (ev) => {
      if (longPressPointerId !== null && ev?.pointerId !== undefined && ev.pointerId !== longPressPointerId) return;
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressPointerId = null;
    };
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
    let snapshotTaken = false;

    state.dragState = { el, offsetX: pt.x - el.offsetLeft, offsetY: pt.y - el.offsetTop };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';

    const onMove = (ev) => {
      if (!state.dragState) return;
      const pt2 = clientToCanvas(ev.clientX, ev.clientY);
      if (!moved) {
        const delta = Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY);
        if (delta < 3) return;
        moved = true;
      }
      if (!snapshotTaken) {
        saveSnapshot();
        snapshotTaken = true;
      }
      const rawX = Math.max(0, pt2.x - state.dragState.offsetX);
      const rawY = Math.max(0, pt2.y - state.dragState.offsetY);
      const newX = snapToGrid(rawX);
      const newY = snapToGrid(rawY);
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      updateConnectionsForShape(el.id);
      updateHandleGroup(el.id);
      scheduleTitleUpdate();
    };

    const onUp = () => {
      el.style.cursor = 'move';
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
    const cr = canvasContainer.getBoundingClientRect();
    const scx = (canvasContainer.scrollLeft + cr.width / 2) / state.scale;
    const scy = (canvasContainer.scrollTop + cr.height / 2) / state.scale;

    state.scale = newScale;
    canvas.style.transform = `scale(${newScale})`;
    if (zoomLevelText) zoomLevelText.textContent = `${Math.round(newScale * 100)}%`;

    canvasContainer.scrollLeft = scx * newScale - cr.width / 2;
    canvasContainer.scrollTop = scy * newScale - cr.height / 2;

    scheduleRefresh();
  }

  zoomInBtn?.addEventListener('click', () => setZoom(state.scale + state.scaleStep));
  zoomOutBtn?.addEventListener('click', () => setZoom(state.scale - state.scaleStep));
  zoomResetBtn?.addEventListener('click', () => setZoom(1));

  canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(state.scale + Math.sign(e.deltaY) * -0.1);
  }, { passive: false });

  // ================= PAN (drag background) =================
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let panScroll = { left: 0, top: 0 };

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
    canvasContainer.scrollTop = panScroll.top - dy;
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

    if (state.baseColors[state.lastShapeType] !== hex) saveSnapshot();
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
  const shapeDeletion = shapeDeletionApi.createShapeDeletionController?.({
    state,
    clearButton,
    saveSnapshot,
    removeConnectionDom,
    removeHandleGroup,
    deselectAll,
    clearConnectionSelection,
    updateConnectionBar,
    scheduleRefresh,
    getDefaultText,
    showConfirmModal,
    hideAllHandles,
    updateHistoryButtons,
    deleteConnection,
  }) || {};
  const deleteSelected = shapeDeletion.deleteSelected || (() => {});

  editShapeBtn?.addEventListener('click', () => {
    if (state.selectedShape) openTextModal(state.selectedShape);
  });
  toolbarDeleteBtn?.addEventListener('click', deleteSelected);

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
      const top = el.offsetTop;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const cx = left + w / 2;
      const cy = top + h / 2;

      if (s.type === 'decision') {
        const d = decisionVertexDistance(el);
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
      const tTop = titleDisplay.offsetTop;
      minX = Math.min(minX, tLeft);
      minY = Math.min(minY, tTop);
      maxX = Math.max(maxX, tLeft + titleDisplay.offsetWidth);
      maxY = Math.max(maxY, tTop + titleDisplay.offsetHeight);
    }

    return { minX, minY, maxX, maxY, empty: false };
  }

  function collectProjectData() {
    const positionsById = {};
    state.shapes.forEach((shape) => {
      const el = document.getElementById(shape.id);
      positionsById[shape.id] = {
        left: el ? el.offsetLeft : 0,
        top: el ? el.offsetTop : 0,
      };
    });

    if (core?.serializeProject) {
      return core.serializeProject(state, positionsById);
    }

    return {
      version: 2,
      diagramTitle: state.diagramTitle,
      shapeCounter: state.shapeCounter,
      lastShapeType: state.lastShapeType,
      baseColors: { ...state.baseColors },
      shapes: state.shapes.map((shape) => ({ ...shape, ...positionsById[shape.id] })),
      connections: state.connections.map((conn) => ({ ...conn, label: conn.label ?? null })),
    };
  }

  const projectBridge = projectIo?.createProjectBridge?.({
    core,
    state,
    projectFileInput,
    canvas,
    canvasContainer,
    titleDisplay,
    saveTitleModal,
    saveTitleInput,
    saveWithTitleBtn,
    saveWithoutTitleBtn,
    closeSaveTitleBtn,
    titleInput,
    saveButton,
    newProjectButton,
    saveProjectButton,
    openProjectButton,
    clearButton,
    collectProjectData,
    saveSnapshot,
    restoreSnapshot,
    setDirty,
    flashSavedBadge,
    showMessageModal,
    sanitizeFilename,
    computeShapesBounds,
    clearConnectionSelection,
    hideAllHandles,
    updateConnectionBar,
    setZoom,
    scheduleRefresh,
    openModal,
    closeModal,
    renderTitle,
  });

  const downloadProjectJson = projectBridge?.downloadProjectJson || function noopDownloadProjectJson() {};
  const getImportErrorMessage = projectBridge?.getImportErrorMessage || function defaultGetImportErrorMessage() {
    return 'Не вдалося відкрити проєкт. Перевір JSON-файл.';
  };
  const importProjectData = projectBridge?.importProjectData || function noopImportProjectData() {};
  const openProjectFilePicker = projectBridge?.openProjectFilePicker || function fallbackOpenProjectFilePicker() {
    if (window.OfficeShell?.openFilePicker?.(projectFileInput)) return;
    projectFileInput.value = '';
    projectFileInput.click();
  };
  const runOfficeCommand = projectBridge?.runOfficeCommand || function fallbackRunOfficeCommand(command) {
    return window.OfficeShell?.runCommand?.(command) || false;
  };
  const registerShellCommands = projectBridge?.registerShellCommands || function fallbackRegisterShellCommands(commandMap) {
    return window.OfficeShell?.registerCommands?.('flowcharts', commandMap) ||
      window.OfficeUI?.registerCommands?.(commandMap, { source: 'flowcharts' });
  };
  const exportPng = projectBridge?.exportPng || (async function noopExportPng() {});
  const openSaveTitlePrompt = projectBridge?.openSaveTitlePrompt || function fallbackOpenSaveTitlePrompt() {
    exportPng();
  };

  projectBridge?.bindProjectControls?.();

  // ================= MENUS =================
  function triggerShapeButton(type) {
    document.querySelector(`.shape-button[data-shape="${type}"]`)?.click();
  }

  function dispatchMenuAction(action) {
    switch (action) {
      case 'new-project':
        runOfficeCommand('new') || clearButton?.click();
        break;
      case 'open-project':
        runOfficeCommand('open') || openProjectButton?.click();
        break;
      case 'save-project':
        runOfficeCommand('save') || saveProjectButton?.click();
        break;
      case 'export-png':
        saveButton?.click();
        break;
      case 'print':
        window.print();
        break;
      case 'undo':
        runOfficeCommand('undo') || undo();
        break;
      case 'redo':
        runOfficeCommand('redo') || redo();
        break;
      case 'delete-selected':
        deleteSelected();
        break;
      case 'clear-canvas':
        clearButton?.click();
        break;
      case 'insert-start-end':
        triggerShapeButton('start-end');
        break;
      case 'insert-process':
        triggerShapeButton('process');
        break;
      case 'insert-decision':
        triggerShapeButton('decision');
        break;
      case 'insert-input-output':
        triggerShapeButton('input-output');
        break;
      case 'insert-subroutine':
        triggerShapeButton('subroutine');
        break;
      case 'insert-connector':
        triggerShapeButton('connector');
        break;
      case 'zoom-75':
        setZoom(0.75);
        break;
      case 'zoom-100':
        setZoom(1);
        break;
      case 'zoom-125':
        setZoom(1.25);
        break;
      case 'zoom-150':
        setZoom(1.5);
        break;
      case 'zoom-reset':
        setZoom(1);
        break;
      case 'toggle-grid':
        snapToggleButton?.click();
        break;
      case 'help-panel':
        toggleHelp(true);
        break;
      case 'open-manual':
        window.open('manual.html', '_blank', 'noopener');
        break;
      case 'about':
        showMessageModal('ПЛЮС Схеми — редактор блок-схем для шкільного офісного пакета ПЛЮС. Він зберігає проєкти у JSON, експортує схеми у PNG та допомагає учням вивчати алгоритми на практиці.');
        break;
    }
  }

  const menuApi = UI.initMenus ? UI.initMenus(dispatchMenuAction) : null;


  // ================= HELP PANEL =================
  UI.renderHelpPanelContent?.(helpPanel);
  updateSnapButton();
  updateFloatingBarOffset();
  titleController.bindHeaderFocus?.();


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
  function detectMacPlatform() {
    const uad = navigator.userAgentData;
    if (uad && typeof uad.platform === 'string') return /mac/i.test(uad.platform);
    return /mac|iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }
  const isMacPlatform = detectMacPlatform();

  document.addEventListener('keydown', (e) => {
    const mod = isMacPlatform ? e.metaKey : e.ctrlKey;

    if (mod && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        runOfficeCommand('redo') || redo();
        return;
      }
      e.preventDefault();
      runOfficeCommand('undo') || undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      runOfficeCommand('redo') || redo();
      return;
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      runOfficeCommand('save') || downloadProjectJson();
      return;
    }
    if (mod && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      runOfficeCommand('open') || openProjectFilePicker();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      openSaveTitlePrompt();
      return;
    }
    if (!mod && e.key.toLowerCase() === 'r' && state.selectedConnId) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        cycleSelectedConnectionRouteMode();
      }
      return;
    }
    if (!mod && e.key.toLowerCase() === 'g') {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        snapToggleButton?.click();
      }
      return;
    }

    if (e.key === 'Escape') {
      closeMenus();
      if (helpPanel && !helpPanel.hidden) toggleHelp(false);
      closeModal(textModal);
      closeModal(connectionModal);
      closeModal(document.getElementById('message-modal'));
      closeModal(saveTitleModal);
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
    updateAllHandleGroups();
    scheduleTitleUpdate();
  }
  function scheduleRefresh() {
    if (state._refreshRaf) return;
    state._refreshRaf = requestAnimationFrame(refreshAll);
  }
  window.addEventListener('resize', () => {
    updateFloatingBarOffset();
    scheduleRefresh();
  });

  // ================= INIT UI =================
  syncColorPickerToCurrent(state.currentColor);
  renderTitle();
  setDirty(false);
  window.addEventListener('beforeunload', persistAutosave);
  registerShellCommands({
    new: () => clearButton?.click(),
    open: openProjectFilePicker,
    save: downloadProjectJson,
    undo: undo,
    redo: redo
  });
  promptRestoreAutosave();

  connectionModal?.addEventListener('pointerdown', (e) => {
    if (e.target === connectionModal) {
      state.pendingConn = null;
      closeModal(connectionModal);
    }
  });


};
