/* ===== РОЗШИРЕНИЙ РЕДАКТОР БЛОК-СХЕМ — script.js (повна виправлена версія) ===== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const core = window.FlowchartCore || null;

  // ================= DOM =================
  const canvas = document.getElementById('flowchart-canvas');
  const canvasContainer = document.getElementById('canvas-container');
  const svgLayer = document.getElementById('connectors-layer');

  const clearButton = document.getElementById('clear-button');
  const saveButton = document.getElementById('save-button');
  const undoButton = document.getElementById('undo-button');
  let redoButton = document.getElementById('redo-button');
  const quickActions = document.querySelector('.quick-actions');

  const textModal = document.getElementById('text-modal');
  const shapeTextArea = document.getElementById('shape-text');
  const cancelText = document.getElementById('cancel-text');
  const saveText = document.getElementById('save-text');

  const examplesButton = document.getElementById('examples-button');
  const examplesPanel = document.getElementById('examples-panel');
  const examplesClose = document.getElementById('examples-close');
  const examplesList = document.getElementById('examples-list');
  const LAYOUT = {
    viewportTopOffset: 150,
    editorTitleTop: 20,
    editorTitleGap: 60,
    editorStartMinTop: 170,
    quickAdd: {
      buttonSize: 58,
      buttonHalf: 29,
      placementGap: 128,
      linearButtonGap: 56,
      branchButtonGap: 72,
      yesOffsetX: 352,
      noOffsetX: 294,
    },
    autoPlace: {
      minLeft: 20,
      minTop: 20,
      stepX: 56,
      stepY: 48,
    },
    exportPad: 90,
  };

  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const zoomLevelText = document.getElementById('zoom-level');
  let shapeBar = document.getElementById('shape-bar');
  let editShapeBtn = document.getElementById('edit-shape-btn');
  let deleteShapeBtn = document.getElementById('delete-shape-btn');
  const saveTitleModal = document.getElementById('save-title-modal');
  const saveTitleInput = document.getElementById('save-title-input');
  const saveWithTitleBtn = document.getElementById('save-with-title');
  const saveWithoutTitleBtn = document.getElementById('save-without-title');
  const closeSaveTitleBtn = document.getElementById('close-save-title');

  const titleInput = document.getElementById('diagram-title-input');
  const titleDisplay = document.getElementById('diagram-title-display');
  const quickAddLayer = document.getElementById('quick-add-layer');
  const builderWizard = document.getElementById('builder-wizard');
  const wizardStepType = document.getElementById('wizard-step-type');
  const wizardStepText = document.getElementById('wizard-step-text');
  const wizardStepExisting = document.getElementById('wizard-step-existing');
  const wizardCloseBtn = document.getElementById('wizard-close');
  const wizardBranchBadge = document.getElementById('wizard-branch-badge');
  const wizardTypePreview = document.getElementById('wizard-type-preview');
  const wizardTextInput = document.getElementById('wizard-text-input');
  const wizardSaveShape = document.getElementById('wizard-save-shape');
  const wizardBackText = document.getElementById('wizard-back-text');
  const wizardBackExisting = document.getElementById('wizard-back-existing');
  const wizardConnectExisting = document.getElementById('wizard-connect-existing');
  const wizardExistingList = document.getElementById('wizard-existing-list');
  const wizardNoExisting = document.getElementById('wizard-no-existing');

  if (!canvas || !canvasContainer || !svgLayer) {
    console.error('Flowchart editor: required DOM nodes are missing.');
    return;
  }

  function createActionButton(id, title, iconClass, text, extraClass = '') {
    const btn = document.createElement('button');
    btn.id = id;
    btn.className = `icon-btn ${extraClass}`.trim();
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.innerHTML = `<i class="${iconClass}"></i><span>${text}</span>`;
    return btn;
  }

  if (undoButton) {
    undoButton.classList.add('icon-btn-compact');
    undoButton.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
    undoButton.setAttribute('aria-label', 'Скасувати');
    undoButton.title = 'Скасувати (Ctrl+Z)';
  }

  if (!redoButton && quickActions && undoButton) {
    redoButton = createActionButton('redo-button', 'Повернути скасовану дію (Ctrl+Y)', 'fa-solid fa-rotate-right', '', 'icon-btn-compact');
    redoButton.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
    quickActions.insertBefore(redoButton, undoButton.nextSibling);
  }

  if (saveButton) {
    saveButton.setAttribute('aria-label', 'Зберегти зображення');
    saveButton.title = 'Зберегти зображення (Ctrl+S)';
    saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i><span>Зберегти зображення</span>';
  }

  if (clearButton) {
    clearButton.setAttribute('aria-label', 'Очистити полотно');
    clearButton.title = 'Очистити';
    clearButton.innerHTML = '<i class="fa-solid fa-broom"></i><span>Очистити</span>';
  }

  const openProjectButton = createActionButton('open-project-button', 'Відкрити проєкт JSON', 'fa-solid fa-folder-open', 'Відкрити');
  const saveProjectButton = createActionButton('save-project-button', 'Зберегти проєкт JSON', 'fa-solid fa-file-arrow-down', 'Зберегти');
  if (quickActions && saveButton) {
    quickActions.insertBefore(openProjectButton, saveButton);
    quickActions.insertBefore(saveProjectButton, saveButton);
  }

  const projectFileInput = document.createElement('input');
  projectFileInput.id = 'project-file-input';
  projectFileInput.type = 'file';
  projectFileInput.accept = '.json,application/json';
  projectFileInput.hidden = true;
  document.body.appendChild(projectFileInput);

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
    quickAdd: {
      open: false,
      step: 'type',
      sourceId: null,
      branch: null,
      type: null,
    },

    // Undo
    undoStack: [],
    redoStack: [],
    MAX_UNDO: 30,

    // schedulers
    _titleRaf: 0,
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
  const AUTOSAVE_STORAGE_KEY = 'flowchart-designer-2-autosave';
  let autosaveRaf = 0;

  const SHAPE_LIBRARY = core?.getShapeLibrary
    ? core.getShapeLibrary()
    : [
      { type: 'start-end', label: 'Початок / Кінець', description: 'Старт або завершення алгоритму.', exampleText: 'Початок' },
      { type: 'process', label: 'Дія', description: 'Один простий крок, який треба виконати.', exampleText: 'Взяти олівець' },
      { type: 'decision', label: 'Умова', description: 'Перевірка: так чи ні?', exampleText: 'Є зошит?' },
      { type: 'input-output', label: 'Ввід / Вивід', description: 'Отримати дані або показати результат.', exampleText: 'Ввести ім’я' },
      { type: 'subroutine', label: 'Підпрограма', description: 'Окрема маленька команда, яку можна викликати.', exampleText: 'Намалювати будиночок' },
      { type: 'connector', label: 'З’єднувач', description: 'Мітка для переходу в інше місце схеми.', exampleText: 'A' },
    ];
  const SHAPE_INFO_BY_TYPE = new Map(SHAPE_LIBRARY.map((item) => [item.type, item]));
  const EXAMPLE_PROJECTS = Array.isArray(window.FlowchartExamples?.EXAMPLE_PROJECTS)
    ? window.FlowchartExamples.EXAMPLE_PROJECTS
    : [];

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
    };
  }

  function updateHistoryButtons() {
    if (undoButton) undoButton.disabled = state.undoStack.length === 0;
    if (redoButton) redoButton.disabled = state.redoStack.length === 0;
  }

  function saveSnapshot() {
    state.undoStack.push(captureSnapshot());

    if (state.undoStack.length > state.MAX_UNDO) state.undoStack.shift();
    state.redoStack = [];
    updateHistoryButtons();
    scheduleAutosave();
  }

  function restoreSnapshot(snap, options = {}) {
    const focusMode = options.focusMode || null;
    closeBuilderWizard();
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
    state.activeShape = null;
    state.dragState = null;
    state.connDrag = null;
    if (state._titleRaf) cancelAnimationFrame(state._titleRaf);
    if (state._refreshRaf) cancelAnimationFrame(state._refreshRaf);
    state._titleRaf = 0;
    state._refreshRaf = 0;

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

    alignSimpleFlowCenters(snap.connections || []);
    ensureDecisionClearance(snap.connections || []);
    ensureTitleClearance();

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
        if (focusMode === 'content') {
          requestAnimationFrame(() => centerViewportOnBounds(computeShapesBounds(false), LAYOUT.viewportTopOffset));
        }
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


  function openModal(modal) { modal?.classList.add('active'); }
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

  function showRestoreDraftModal(text, onRestore, onDiscard) {
    const modal = document.getElementById('message-modal');
    const textEl = document.getElementById('message-modal-text');
    const btns = document.getElementById('message-modal-buttons');
    if (!modal || !textEl || !btns) return;

    textEl.textContent = text;
    btns.innerHTML = '';

    const discard = document.createElement('button');
    discard.textContent = 'Нова схема';
    discard.className = 'modal-btn cancel-btn';
    discard.onclick = () => {
      closeModal(modal);
      onDiscard?.();
    };

    const restore = document.createElement('button');
    restore.textContent = 'Відкрити чернетку';
    restore.className = 'modal-btn ok-btn';
    restore.onclick = () => {
      closeModal(modal);
      onRestore?.();
    };

    btns.appendChild(discard);
    btns.appendChild(restore);
    openModal(modal);
    setTimeout(() => restore.focus(), 30);
  }

  // Close modals by click on backdrop
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('pointerdown', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  function sanitizeFilename(name) {
    const fallback = 'блок-схема';
    const base = (name || '').trim() || fallback;
    const safe = base
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/[().,]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    return safe || fallback;
  }

  // ================= TITLE =================
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

  function getStartShapeElement() {
    const startShape = state.shapes.find((shape) =>
      shape.type === 'start-end' && String(shape.textRaw || '').trim().toLowerCase() === 'початок');
    return startShape ? document.getElementById(startShape.id) : null;
  }

  function updateTitlePosition() {
    state._titleRaf = 0;
    if (!titleDisplay) return;
    const bounds = computeShapesBounds(false);
    const titleText = (state.diagramTitle || '').trim();
    if (bounds.empty || !titleText) {
      titleDisplay.style.display = 'none';
      return;
    }
    titleDisplay.style.display = '';
    titleDisplay.style.visibility = 'hidden';
    const measuredHeight = titleDisplay.getBoundingClientRect().height || titleDisplay.offsetHeight || 48;
    const startEl = getStartShapeElement();
    const left = startEl
      ? startEl.offsetLeft + startEl.offsetWidth / 2
      : (bounds.minX + bounds.maxX) / 2;
    const anchorTop = startEl ? startEl.offsetTop : bounds.minY;
    const top = Math.max(LAYOUT.editorTitleTop, anchorTop - measuredHeight - LAYOUT.editorTitleGap);
    titleDisplay.style.left = left + 'px';
    titleDisplay.style.top = top + 'px';
    titleDisplay.style.visibility = '';
    titleDisplay.style.display = '';
  }

  function scheduleTitleUpdate() {
    if (state._titleRaf) return;
    state._titleRaf = requestAnimationFrame(updateTitlePosition);
  }

  function ensureTitleClearance() {
    if (!titleDisplay) return;
    const titleText = (state.diagramTitle || '').trim();
    if (!titleText || !state.shapes.length) return;

    titleDisplay.textContent = titleText;
    titleDisplay.style.display = '';
    titleDisplay.style.visibility = 'hidden';
    const measuredHeight = titleDisplay.getBoundingClientRect().height || titleDisplay.offsetHeight || 48;
    titleDisplay.style.visibility = '';

    const bounds = computeShapesBounds(false);
    if (bounds.empty) return;

    const startEl = getStartShapeElement();
    const anchorTop = startEl ? startEl.offsetTop : bounds.minY;
    const desiredAnchorTop = Math.max(
      LAYOUT.editorStartMinTop,
      LAYOUT.editorTitleTop + measuredHeight + LAYOUT.editorTitleGap
    );
    const shiftY = Math.ceil(desiredAnchorTop - anchorTop);
    if (shiftY <= 0) return;

    state.shapes.forEach((shape) => {
      const el = document.getElementById(shape.id);
      if (!el) return;
      el.style.top = `${el.offsetTop + shiftY}px`;
    });
  }

  function ensureDecisionClearance(connections = state.connections) {
    const safeConnections = Array.isArray(connections) ? connections : [];
    safeConnections.forEach((conn) => {
      if (conn?.type) return;
      const fromEl = document.getElementById(conn.from);
      const toEl = document.getElementById(conn.to);
      if (!fromEl || !toEl) return;

      const fromShape = getShapeData(conn.from);
      const toShape = getShapeData(conn.to);
      if (!fromShape || !toShape) return;
      if (toShape.type !== 'decision' || fromShape.type === 'decision') return;

      const lift = core?.getDecisionVisualLift
        ? core.getDecisionVisualLift({ type: 'decision', width: toEl.offsetWidth, height: toEl.offsetHeight })
        : Math.max(0, decisionVertexDistance(toEl) - (toEl.offsetHeight / 2));
      const visualTop = toEl.offsetTop - lift;
      const desiredTop = fromEl.offsetTop + fromEl.offsetHeight + 18;
      const shiftY = Math.ceil(desiredTop - visualTop);
      if (shiftY <= 0) return;

      toEl.style.top = `${toEl.offsetTop + shiftY}px`;
    });
  }

  function alignSimpleFlowCenters(connections = state.connections) {
    const safeConnections = Array.isArray(connections) ? connections : [];
    if (!safeConnections.length) return;

    const incoming = new Map();
    const outgoing = new Map();
    safeConnections.forEach((conn) => {
      if (!incoming.has(conn.to)) incoming.set(conn.to, []);
      if (!outgoing.has(conn.from)) outgoing.set(conn.from, []);
      incoming.get(conn.to).push(conn);
      outgoing.get(conn.from).push(conn);
    });

    const sortable = safeConnections
      .filter((conn) => !conn.type)
      .map((conn) => {
        const fromEl = document.getElementById(conn.from);
        return { conn, sortTop: fromEl?.offsetTop ?? 0 };
      })
      .sort((a, b) => a.sortTop - b.sortTop);

    sortable.forEach(({ conn }) => {
      const fromEl = document.getElementById(conn.from);
      const toEl = document.getElementById(conn.to);
      if (!fromEl || !toEl) return;

      const parentShape = getShapeData(conn.from);
      const childShape = getShapeData(conn.to);
      if (!parentShape || !childShape) return;
      if (parentShape.type === 'decision' || childShape.type === 'decision') return;

      const parentOutgoing = outgoing.get(conn.from) || [];
      const childIncoming = incoming.get(conn.to) || [];
      if (parentOutgoing.length !== 1 || childIncoming.length !== 1) return;
      if (parentOutgoing.some((item) => item.type) || childIncoming.some((item) => item.type)) return;

      const parentCenter = fromEl.offsetLeft + fromEl.offsetWidth / 2;
      const alignedLeft = Math.round(parentCenter - toEl.offsetWidth / 2);
      if (Math.abs(alignedLeft - toEl.offsetLeft) < 1) return;

      toEl.style.left = `${Math.max(0, alignedLeft)}px`;
    });
  }

  titleInput?.addEventListener('input', () => {
    state.diagramTitle = titleInput.value;
    renderTitle();
    ensureTitleClearance();
    scheduleTitleUpdate();
    scheduleAutosave();
  });

  function persistAutosave() {
    try {
      const project = collectProjectData();
      const hasContent = (project.shapes?.length || 0) > 0
        || (project.connections?.length || 0) > 0
        || !!String(project.diagramTitle || '').trim();

      if (!hasContent) {
        localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
        return;
      }

      localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        project,
      }));
    } catch (error) {
      console.warn('Flowchart editor: autosave failed.', error);
    }
  }

  function scheduleAutosave() {
    if (autosaveRaf) return;
    autosaveRaf = requestAnimationFrame(() => {
      autosaveRaf = 0;
      persistAutosave();
    });
  }

  function clearAutosave() {
    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    } catch (error) {
      console.warn('Flowchart editor: failed to clear autosave.', error);
    }
  }

  function readAutosaveDraft() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== 'object' || !draft.project) return null;
      const parsedProject = core?.parseProject ? core.parseProject(draft.project) : draft.project;
      const hasContent = (parsedProject.shapes?.length || 0) > 0
        || (parsedProject.connections?.length || 0) > 0
        || !!String(parsedProject.diagramTitle || '').trim();
      if (!hasContent) return null;
      return {
        savedAt: draft.savedAt || null,
        project: parsedProject,
      };
    } catch (error) {
      console.warn('Flowchart editor: failed to read autosave.', error);
      clearAutosave();
      return null;
    }
  }

  function promptRestoreAutosave() {
    const draft = readAutosaveDraft();
    if (!draft) return false;
    const when = draft.savedAt
      ? new Date(draft.savedAt).toLocaleString('uk-UA')
      : 'невідомий час';
    showRestoreDraftModal(
      `Знайдено незбережену чернетку від ${when}. Хочеш продовжити роботу з нею або почати нову схему?`,
      () => {
        restoreSnapshot(draft.project);
        showMessageModal('Чернетку відкрито.');
      },
      () => {
        clearAutosave();
        resetToInitialStart();
      },
    );
    return true;
  }

  // ================= TEXT WRAP =================
  function smartWrapText(raw, type, widthHint) {
    const text = (raw || '').trim();
    if (!text) return '';
    const width = Number(widthHint) || getShapeSizeHint(type).w;
    let maxChars = 18;
    let maxLines = 3;

    if (type === 'decision') {
      maxChars = 12;
      maxLines = 4;
    } else if (type === 'connector') {
      maxChars = 3;
      maxLines = 1;
    } else if (type === 'start-end') {
      maxChars = width >= 188 ? 18 : 16;
    } else if (type === 'input-output') {
      maxChars = width >= 224 ? 24 : width >= 196 ? 20 : 18;
    } else if (type === 'subroutine') {
      maxChars = width >= 238 ? 24 : width >= 210 ? 21 : 18;
    } else {
      maxChars = width >= 212 ? 21 : width >= 184 ? 18 : 16;
    }

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

  function getShapeSizeForText(type, rawText) {
    const base = getShapeSizeHint(type);
    const text = String(rawText || '').trim();
    const length = text.length;

    if (type === 'decision' || type === 'connector') return base;

    return {
      w: base.w,
      h: base.h,
    };
  }

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

  function getShapeInfo(type) {
    if (core?.getShapeInfo) return core.getShapeInfo(type);
    return SHAPE_INFO_BY_TYPE.get(type) || SHAPE_INFO_BY_TYPE.get('process');
  }

  function getTextPlaceholder(type) {
    if (core?.getTextPlaceholder) return core.getTextPlaceholder(type);
    return getShapeInfo(type)?.exampleText || '';
  }

  function updateShapeHelper() {}

  function hydrateWizardCards() {
    document.querySelectorAll('.wizard-type-card').forEach((btn) => {
      const info = getShapeInfo(btn.dataset.wizardType);
      if (!info) return;
      const label = btn.querySelector('.wizard-card-label');
      const desc = btn.querySelector('.wizard-card-desc');
      const isEndVariant = btn.dataset.wizardVariant === 'end';
      const resolvedLabel = isEndVariant ? 'Кінець' : info.label;
      const resolvedDesc = isEndVariant ? 'Завершити гілку алгоритму.' : info.description;
      if (label) label.textContent = resolvedLabel;
      if (desc) desc.textContent = resolvedDesc;
      btn.title = `${resolvedLabel}. ${resolvedDesc}`;
    });
  }

  function getShapeSizeHint(type) {
    if (core?.getShapeSize) {
      const size = core.getShapeSize(type);
      return { w: size.width, h: size.height };
    }
    if (type === 'connector') return { w: 60, h: 60 };
    if (type === 'decision') return { w: 144, h: 144 };
    if (type === 'start-end') return { w: 164, h: 58 };
    if (type === 'input-output') return { w: 180, h: 58 };
    if (type === 'subroutine') return { w: 180, h: 58 };
    return { w: 164, h: 58 };
  }

  function getShapeData(id) {
    return state.shapes.find((shape) => shape.id === id) || null;
  }

  function isEndTerminator(shape) {
    if (core?.isEndTerminator) return core.isEndTerminator(shape);
    return shape?.type === 'start-end' && String(shape?.textRaw || '').trim().toLowerCase() === 'кінець';
  }

  function getQuickAddTargets() {
    if (core?.getQuickAddTargets) return core.getQuickAddTargets(state.shapes, state.connections);
    if (!state.shapes.length) return [{ sourceId: null, branch: null, type: 'root' }];
    return state.shapes.flatMap((shape) => {
      const outgoing = state.connections.filter((conn) => conn.from === shape.id);
      if (isEndTerminator(shape)) return [];
      if (shape.type === 'decision') {
        const hasYes = outgoing.some((conn) => conn.type === 'yes');
        const hasNo = outgoing.some((conn) => conn.type === 'no');
        const targets = [];
        if (!hasYes) targets.push({ sourceId: shape.id, branch: 'yes', type: 'branch' });
        if (!hasNo) targets.push({ sourceId: shape.id, branch: 'no', type: 'branch' });
        return targets;
      }
      if (outgoing.length > 0) return [];
      return [{ sourceId: shape.id, branch: null, type: 'linear' }];
    });
  }

  function getQuickAddPlacement(parentShape, branch, childType) {
    if (core?.getQuickAddPlacement) {
      return core.getQuickAddPlacement(parentShape, branch, childType);
    }
    const childSize = getShapeSizeHint(childType);
    return {
      left: Math.round(parentShape.left + ((parentShape.width || 0) - childSize.w) / 2),
      top: Math.round(parentShape.top + (parentShape.height || 0) + LAYOUT.quickAdd.placementGap),
    };
  }

  function getQuickAddButtonPosition(parentShape, branch) {
    const centerX = parentShape.left + parentShape.width / 2;
    const belowY = parentShape.top + parentShape.height + LAYOUT.quickAdd.linearButtonGap;
    if (branch === 'yes') {
      return {
        left: centerX - LAYOUT.quickAdd.yesOffsetX,
        top: parentShape.top + parentShape.height + LAYOUT.quickAdd.branchButtonGap,
      };
    }
    if (branch === 'no') {
      return {
        left: centerX + LAYOUT.quickAdd.noOffsetX,
        top: parentShape.top + parentShape.height + LAYOUT.quickAdd.branchButtonGap,
      };
    }
    return { left: centerX - LAYOUT.quickAdd.buttonHalf, top: belowY };
  }

  function centerViewportOnShape(shapeEl, topOffset = LAYOUT.viewportTopOffset) {
    if (!shapeEl) return;
    const centerX = shapeEl.offsetLeft + shapeEl.offsetWidth / 2;
    const desiredLeft = Math.max(0, centerX * state.scale - canvasContainer.clientWidth / 2);
    const desiredTop = Math.max(0, shapeEl.offsetTop * state.scale - topOffset);
    canvasContainer.scrollTo({ left: desiredLeft, top: desiredTop, behavior: 'auto' });
  }

  function centerViewportOnBounds(bounds, topOffset = LAYOUT.viewportTopOffset) {
    if (!bounds || bounds.empty) return;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const desiredLeft = Math.max(0, centerX * state.scale - canvasContainer.clientWidth / 2);
    const desiredTop = Math.max(0, bounds.minY * state.scale - topOffset);
    canvasContainer.scrollTo({ left: desiredLeft, top: desiredTop, behavior: 'auto' });
  }

  function createInitialStartBlock() {
    if (state.shapes.length) return null;
    const size = getShapeSizeHint('start-end');
    const startLeft = Math.round(canvas.offsetWidth / 2 - size.w / 2);
    const startTop = LAYOUT.editorStartMinTop;
    const startEl = createShape('start-end', getBaseColor('start-end'), 'Початок', startLeft, startTop);
    if (startEl) {
      state.lastShapeType = 'process';
      deselectAll(false);
      clearConnectionSelection(false);
      requestAnimationFrame(() => {
        centerViewportOnShape(startEl);
        scheduleRefresh();
      });
    }
    return startEl;
  }

  function resetToInitialStart() {
    state.shapes.forEach((shape) => {
      document.getElementById(shape.id)?.remove();
      removeHandleGroup(shape.id);
    });
    state.connections.forEach((conn) => removeConnectionDom(conn.id));
    state.shapes = [];
    state.connections = [];
    state.selectedShape = null;
    state.shapeCounter = 0;
    hideAllHandles();
    const startEl = createInitialStartBlock();
    updateHistoryButtons();
    updateConnectionBar();
    scheduleRefresh();
    return startEl;
  }

  function appendQuickAddGuide(parentEl, branch, btnPos) {
    if (!quickAddLayer || !parentEl) return;
    const parentType = getShapeType(parentEl);
    const btnCenterX = btnPos.left + LAYOUT.quickAdd.buttonHalf;
    const btnTopY = btnPos.top;
    const guideColor = branch === 'yes' ? '#86efac' : branch === 'no' ? '#fca5a5' : '#a5b4fc';

    const makeSeg = (left, top, width, height, borderSide) => {
      const seg = document.createElement('div');
      seg.className = `quick-add-guide ${branch ? `branch-${branch}` : 'branch-linear'}`;
      seg.style.left = `${Math.round(left)}px`;
      seg.style.top = `${Math.round(top)}px`;
      seg.style.width = `${Math.max(0, Math.round(width))}px`;
      seg.style.height = `${Math.max(0, Math.round(height))}px`;
      seg.style.setProperty('--guide-color', guideColor);
      seg.dataset.border = borderSide;
      quickAddLayer.appendChild(seg);
    };

    if (!branch) {
      const startX = parentEl.offsetLeft + parentEl.offsetWidth / 2;
      const startY = parentEl.offsetTop + parentEl.offsetHeight;
      makeSeg(startX - 1, startY, 0, Math.max(0, btnTopY - startY), 'left');
      return;
    }

    const centerX = parentEl.offsetLeft + parentEl.offsetWidth / 2;
    const centerY = parentEl.offsetTop + parentEl.offsetHeight / 2;
    const decisionOutset = parentType === 'decision' ? decisionVertexDistance(parentEl) + 10 : 0;
    const anchorX = branch === 'yes'
      ? (parentType === 'decision' ? centerX - decisionOutset : parentEl.offsetLeft)
      : (parentType === 'decision' ? centerX + decisionOutset : parentEl.offsetLeft + parentEl.offsetWidth);
    const anchorY = parentType === 'decision'
      ? centerY
      : parentEl.offsetTop + parentEl.offsetHeight;
    const verticalTop = anchorY;
    const verticalHeight = Math.max(0, btnTopY - anchorY);

    if (branch === 'yes') {
      makeSeg(btnCenterX, anchorY - 1, Math.max(0, anchorX - btnCenterX), 0, 'top');
      makeSeg(btnCenterX - 1, verticalTop, 0, verticalHeight, 'left');
      return;
    }

    makeSeg(anchorX, anchorY - 1, Math.max(0, btnCenterX - anchorX), 0, 'top');
    makeSeg(btnCenterX - 1, verticalTop, 0, verticalHeight, 'left');
  }

  function branchLabel(branch) {
    if (branch === 'yes') return 'Гілка "Так"';
    if (branch === 'no') return 'Гілка "Ні"';
    return '';
  }

  function getWizardDefaultText(type) {
    return getDefaultText(type);
  }

  function getWizardCardLabel(type) {
    if (type === 'start-end') return getWizardDefaultText(type);
    return getShapeInfo(type)?.label || 'Блок';
  }

  function isWizardEndVariant(type) {
    return type === 'start-end' && getWizardDefaultText(type) === 'Кінець';
  }

  function getWizardDescription(type) {
    if (isWizardEndVariant(type)) return 'Завершити гілку алгоритму.';
    return getShapeInfo(type)?.description || '';
  }

  function getConnectableTargets(sourceId) {
    if (!sourceId) return [];
    return state.shapes.filter((shape) => {
      if (shape.id === sourceId) return false;
      const branch = state.quickAdd.branch || null;
      const connId = branch
        ? `conn-${sourceId}-${shape.id}-${branch}`
        : `conn-${sourceId}-${shape.id}`;
      return !state.connections.some((conn) => conn.id === connId);
    });
  }

  function showWizardStep(step) {
    state.quickAdd.step = step;
    wizardStepType.hidden = step !== 'type';
    wizardStepText.hidden = step !== 'text';
    wizardStepExisting.hidden = step !== 'existing';
  }

  function closeBuilderWizard() {
    state.quickAdd = { open: false, step: 'type', sourceId: null, branch: null, type: null };
    builderWizard?.classList.remove('active');
    builderWizard?.setAttribute('aria-hidden', 'true');
    showWizardStep('type');
  }

  function refreshWizardCards() {
    document.querySelectorAll('.wizard-type-card').forEach((btn) => {
      const type = btn.dataset.wizardType;
      const label = btn.querySelector('.wizard-card-label');
      const desc = btn.querySelector('.wizard-card-desc');
      const isEndVariant = isWizardEndVariant(type);
      if (label) label.textContent = getWizardCardLabel(type);
      if (desc) desc.textContent = getWizardDescription(type);
      btn.dataset.wizardVariant = isEndVariant ? 'end' : '';
      btn.hidden = false;
    });
  }

  function renderWizardPreview(type) {
    const label = getWizardCardLabel(type);
    const description = getWizardDescription(type);
    const isEndVariant = isWizardEndVariant(type);
    if (!wizardTypePreview) return;
    wizardTypePreview.innerHTML = `
      <div class="wizard-preview-title${isEndVariant ? ' end-variant' : ''}">
        <span class="shape-icon ${type === 'start-end' ? 'se-icon' : type === 'process' ? 'proc-icon' : type === 'decision' ? 'dec-icon' : type === 'input-output' ? 'io-icon' : type === 'subroutine' ? 'sub-icon' : 'conn-icon'}"></span>
        <span>${label}</span>
      </div>
      <div class="wizard-preview-text${isEndVariant ? ' end-variant' : ''}">${description}</div>
    `;
    wizardTypePreview.classList.toggle('end-variant', isEndVariant);
  }

  function openBuilderWizard(sourceId, branch) {
    state.quickAdd = { open: true, step: 'type', sourceId: sourceId || null, branch: branch || null, type: null };
    refreshWizardCards();
    updateShapeHelper(branch ? 'decision' : 'process');
    if (wizardBranchBadge) {
      const label = branchLabel(branch);
      wizardBranchBadge.hidden = !label;
      wizardBranchBadge.textContent = label;
    }
    if (wizardConnectExisting) wizardConnectExisting.hidden = !sourceId;
    builderWizard?.classList.add('active');
    builderWizard?.setAttribute('aria-hidden', 'false');
    showWizardStep('type');
  }

  function openWizardTextStep(type) {
    state.quickAdd.type = type;
    renderWizardPreview(type);
    if (wizardTextInput) {
      wizardTextInput.value = '';
      wizardTextInput.placeholder = isWizardEndVariant(type) ? 'Кінець' : getTextPlaceholder(type);
    }
    showWizardStep('text');
    setTimeout(() => wizardTextInput?.focus(), 40);
  }

  function renderExistingTargets() {
    if (!wizardExistingList || !wizardNoExisting) return;
    const sourceId = state.quickAdd.sourceId;
    const targets = getConnectableTargets(sourceId);
    wizardExistingList.innerHTML = '';
    wizardNoExisting.hidden = targets.length > 0;

    targets.forEach((shape) => {
      const info = getShapeInfo(shape.type);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wizard-existing-item';
      btn.innerHTML = `
        <span class="shape-icon ${shape.type === 'start-end' ? 'se-icon' : shape.type === 'process' ? 'proc-icon' : shape.type === 'decision' ? 'dec-icon' : shape.type === 'input-output' ? 'io-icon' : shape.type === 'subroutine' ? 'sub-icon' : 'conn-icon'}"></span>
        <span class="wizard-existing-copy">
          <strong>${shape.textRaw || getWizardCardLabel(shape.type)}</strong>
          <span>${info?.label || shape.type}</span>
        </span>
        <i class="fa-solid fa-arrow-right"></i>
      `;
      btn.addEventListener('click', () => {
        const fromEl = document.getElementById(sourceId);
        const toEl = document.getElementById(shape.id);
        if (!fromEl || !toEl) return;
        saveSnapshot();
        deselectAll(false);
        clearConnectionSelection(false);
        connectShapes(fromEl, toEl, state.quickAdd.branch || null);
        closeBuilderWizard();
        updateConnectionBar();
        scheduleRefresh();
      });
      wizardExistingList.appendChild(btn);
    });
  }

  function createShapeFromWizard() {
    const type = state.quickAdd.type;
    if (!type) return;
    const sourceId = state.quickAdd.sourceId;
    const branch = state.quickAdd.branch || null;
    const text = (wizardTextInput?.value || '').trim() || getWizardDefaultText(type);
    saveSnapshot();

    let newEl = null;
    if (!sourceId) {
      newEl = createShape(type, getBaseColor(type), text);
    } else {
      const parentEl = document.getElementById(sourceId);
      if (!parentEl) return;
      const suggestion = getQuickAddPlacement({
        type: getShapeType(parentEl),
        left: parentEl.offsetLeft,
        top: parentEl.offsetTop,
        width: parentEl.offsetWidth,
        height: parentEl.offsetHeight,
      }, branch, type);
      const resolved = findAutoShapePosition(type, suggestion.left, suggestion.top);
      newEl = createShape(type, getBaseColor(type), text, resolved.left, resolved.top);
      if (newEl) connectShapes(parentEl, newEl, branch);
    }

    if (newEl) {
      ensureDecisionClearance();
      selectShape(newEl);
      closeBuilderWizard();
      scheduleRefresh();
    }
  }

  function renderQuickAddButtons() {
    if (!quickAddLayer) return;
    quickAddLayer.innerHTML = '';
    const targets = getQuickAddTargets();
    const hasShapes = state.shapes.length > 0;
    if (!hasShapes) return;

    targets.forEach((target) => {
      if (!target.sourceId) return;
      const parentEl = document.getElementById(target.sourceId);
      if (!parentEl) return;
      const pos = getQuickAddButtonPosition({
        left: parentEl.offsetLeft,
        top: parentEl.offsetTop,
        width: parentEl.offsetWidth,
        height: parentEl.offsetHeight,
      }, target.branch);
      appendQuickAddGuide(parentEl, target.branch, pos);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `quick-add-btn${target.branch ? ` branch-${target.branch}` : ''}`;
      btn.style.left = `${pos.left}px`;
      btn.style.top = `${pos.top}px`;
      btn.setAttribute('aria-label', branchLabel(target.branch) || 'Додати наступний блок');
      btn.innerHTML = '<span aria-hidden="true">+</span>';
      if (target.branch) {
        const tag = document.createElement('span');
        tag.className = 'quick-add-tag';
        tag.textContent = target.branch === 'yes' ? '+ Так' : '+ Ні';
        btn.appendChild(tag);
      }
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        openBuilderWizard(target.sourceId, target.branch);
      });
      quickAddLayer.appendChild(btn);
    });
  }

  function setShapeText(shapeEl, raw) {
    const s = state.shapes.find(x => x.id === shapeEl.id);
    const rawText = (raw || '').trim();
    if (s) s.textRaw = rawText;
    const type = s?.type || (shapeEl.classList.contains('decision') ? 'decision' : 'process');
    const content = shapeEl.querySelector('.content');
    const defaultText = getDefaultText(type);
    const isEndTerminatorShape = type === 'start-end' && String(rawText || defaultText).trim().toLowerCase() === 'кінець';
    shapeEl.classList.toggle('end-terminator', isEndTerminatorShape);
    if (content) {
      const widthHint = shapeEl.offsetWidth || getShapeSizeForText(type, rawText || defaultText).w;
      content.textContent = smartWrapText(rawText || defaultText, type, widthHint);
    }
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
  const DECISION_CONN_OUTSET = 2; // px: keep endpoints close to diamond border

  function getShapeType(shapeEl) {
    if (!shapeEl) return 'process';
    if (shapeEl.classList.contains('start-end')) return 'start-end';
    if (shapeEl.classList.contains('decision')) return 'decision';
    if (shapeEl.classList.contains('input-output')) return 'input-output';
    if (shapeEl.classList.contains('subroutine')) return 'subroutine';
    if (shapeEl.classList.contains('connector')) return 'connector';
    return 'process';
  }

  function domShapeToBox(shapeEl) {
    return {
      left: shapeEl.offsetLeft,
      top: shapeEl.offsetTop,
      width: shapeEl.offsetWidth,
      height: shapeEl.offsetHeight,
      type: getShapeType(shapeEl),
    };
  }

  function decisionVertexDistance(shapeEl) {
    if (core?.decisionVertexDistance) return core.decisionVertexDistance(domShapeToBox(shapeEl));
    // .decision uses transform: rotate(45deg); offsetWidth is pre-transform.
    // For a rotated square, vertex distance along axis is width / sqrt(2).
    return (shapeEl.offsetWidth || 0) / Math.SQRT2;
  }

  function getHandlePositions(shapeEl) {
    const cx = shapeEl.offsetLeft + shapeEl.offsetWidth / 2;
    const cy = shapeEl.offsetTop + shapeEl.offsetHeight / 2;

    if (shapeEl.classList.contains('connector')) {
      const r = Math.min(shapeEl.offsetWidth, shapeEl.offsetHeight) / 2;
      return {
        top: { x: cx, y: cy - r },
        right: { x: cx + r, y: cy },
        bottom: { x: cx, y: cy + r },
        left: { x: cx - r, y: cy },
      };
    }

    if (shapeEl.classList.contains('decision')) {
      const d = decisionVertexDistance(shapeEl);
      const o = DECISION_HANDLE_OUTSET;
      return {
        top: { x: cx, y: cy - d - o },
        right: { x: cx + d + o, y: cy },
        bottom: { x: cx, y: cy + d + o },
        left: { x: cx - d - o, y: cy },
      };
    }

    const hw = shapeEl.offsetWidth / 2;
    const hh = shapeEl.offsetHeight / 2;
    return {
      top: { x: cx, y: cy - hh },
      right: { x: cx + hw, y: cy },
      bottom: { x: cx, y: cy + hh },
      left: { x: cx - hw, y: cy },
    };
  }

  function getConnectionPoint(shapeEl, toX, toY) {
    const cx = shapeEl.offsetLeft + shapeEl.offsetWidth / 2;
    const cy = shapeEl.offsetTop + shapeEl.offsetHeight / 2;
    const dx = toX - cx;
    const dy = toY - cy;

    if (shapeEl.classList.contains('connector')) {
      const r = Math.min(shapeEl.offsetWidth, shapeEl.offsetHeight) / 2;
      const len = Math.hypot(dx, dy) || 1;
      return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
    }

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
    const s = Math.min(sx, sy);
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

      if (s.type === 'connector') {
        const r = Math.min(el.offsetWidth, el.offsetHeight) / 2 + 10;
        if ((dx * dx + dy * dy) <= (r * r)) return el;
      } else
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

  function createHandleGroup() { return null; }

  function updateHandleGroup() {}

  function showHandlesForShape() {}

  function hideAllHandles() {}

  function removeHandleGroup(shapeId) {
    const g = shapeHandleGroups[shapeId];
    if (g) { g.remove(); delete shapeHandleGroups[shapeId]; }
  }

  // ================= TEMP LINE (during connect drag) =================
  function attachHandleListeners() {}

  // ================= CONNECTIONS (orthogonal) =================
  function polylineLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      len += Math.hypot(dx, dy);
    }
    return len;
  }

  function pointAlongPolyline(points, t) {
    if (core?.pointAlongPolyline) return core.pointAlongPolyline(points, t);
    const total = polylineLength(points);
    if (total <= 0) return points[0] || { x: 0, y: 0 };
    const target = total * t;
    let acc = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
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
    if (core?.getEdgePoints) return core.getEdgePoints(domShapeToBox(el), DECISION_CONN_OUTSET);
    const cx = el.offsetLeft + el.offsetWidth / 2;
    const cy = el.offsetTop + el.offsetHeight / 2;
    if (el.classList.contains('decision')) {
      const d = decisionVertexDistance(el) + DECISION_CONN_OUTSET;
      return {
        top: { x: cx, y: cy - d, side: 'top' },
        bottom: { x: cx, y: cy + d, side: 'bottom' },
        left: { x: cx - d, y: cy, side: 'left' },
        right: { x: cx + d, y: cy, side: 'right' },
      };
    }

    const hw = el.offsetWidth / 2;
    const hh = el.offsetHeight / 2;
    return {
      top: { x: cx, y: cy - hh, side: 'top' },
      bottom: { x: cx, y: cy + hh, side: 'bottom' },
      left: { x: cx - hw, y: cy, side: 'left' },
      right: { x: cx + hw, y: cy, side: 'right' },
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
      (exitSide === 'top' && entrySide === 'bottom')) {
      if (Math.abs(dx) < 2) {
        // Already aligned — straight vertical
        pts.push(toPt);
      } else {
        const yMid = fromPt.y + dy / 2;
        pts.push({ x: fromPt.x, y: yMid });
        pts.push({ x: toPt.x, y: yMid });
        pts.push(toPt);
      }
      return pts;
    }

    if ((exitSide === 'right' && entrySide === 'left') ||
      (exitSide === 'left' && entrySide === 'right')) {
      if (Math.abs(dy) < 2) {
        pts.push(toPt);
      } else {
        const xMid = fromPt.x + dx / 2;
        pts.push({ x: xMid, y: fromPt.y });
        pts.push({ x: xMid, y: toPt.y });
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
  function chooseSides(fromEl, toEl, routeMode = 'auto') {
    if (core?.chooseSides) return core.chooseSides(domShapeToBox(fromEl), domShapeToBox(toEl), routeMode);
    const fcx = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const fcy = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const tcx = toEl.offsetLeft + toEl.offsetWidth / 2;
    const tcy = toEl.offsetTop + toEl.offsetHeight / 2;
    const dx = tcx - fcx;
    const dy = tcy - fcy;

    if (routeMode === 'vertical') {
      return dy >= 0 ? { exit: 'bottom', entry: 'top' } : { exit: 'top', entry: 'bottom' };
    }
    if (routeMode === 'horizontal') {
      return dx >= 0 ? { exit: 'right', entry: 'left' } : { exit: 'left', entry: 'right' };
    }

    const fhw = fromEl.offsetWidth / 2;
    const fhh = fromEl.offsetHeight / 2;
    const thw = toEl.offsetWidth / 2;
    const thh = toEl.offsetHeight / 2;

    // Gaps between edges (negative = overlapping)
    const gapRight = dx - fhw - thw;   // from.right → to.left
    const gapLeft = -dx - fhw - thw;  // from.left  → to.right
    const gapBottom = dy - fhh - thh;   // from.bottom→ to.top
    const gapTop = -dy - fhh - thh;  // from.top   → to.bottom

    // Primary axis: whichever has the bigger gap wins
    const hGap = Math.max(gapRight, gapLeft);
    const vGap = Math.max(gapBottom, gapTop);

    if (vGap >= hGap) {
      // Vertical primary
      if (dy >= 0) return { exit: 'bottom', entry: 'top' };
      else return { exit: 'top', entry: 'bottom' };
    } else {
      // Horizontal primary
      if (dx >= 0) return { exit: 'right', entry: 'left' };
      else return { exit: 'left', entry: 'right' };
    }
  }

  function routeOrthogonal(fromEl, toEl, routeMode = 'auto') {
    if (core?.routeOrthogonal) return core.routeOrthogonal(domShapeToBox(fromEl), domShapeToBox(toEl), routeMode);
    const { exit, entry } = chooseSides(fromEl, toEl, routeMode);
    const fromEdges = getEdgePoints(fromEl);
    const toEdges = getEdgePoints(toEl);
    const fromPt = fromEdges[exit];
    const toPt = toEdges[entry];
    const pts = orthogonalPath(fromPt, toPt, exit, entry);
    return { pts, exit, entry };
  }

  function chooseExitSideToPoint(fromEl, toPt, routeMode = 'auto') {
    if (core?.chooseExitSideToPoint) return core.chooseExitSideToPoint(domShapeToBox(fromEl), toPt, routeMode);
    const cx = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const cy = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const dx = toPt.x - cx;
    const dy = toPt.y - cy;
    if (routeMode === 'vertical') return dy >= 0 ? 'bottom' : 'top';
    if (routeMode === 'horizontal') return dx >= 0 ? 'right' : 'left';
    return Math.abs(dy) >= Math.abs(dx)
      ? (dy >= 0 ? 'bottom' : 'top')
      : (dx >= 0 ? 'right' : 'left');
  }

  function routeToPoint(fromEl, toPt, routeMode = 'auto', entrySide = 'top') {
    if (core?.routeToPoint) return core.routeToPoint(domShapeToBox(fromEl), toPt, routeMode, entrySide);
    const fromEdges = getEdgePoints(fromEl);
    const exit = chooseExitSideToPoint(fromEl, toPt, routeMode);
    const fromPt = fromEdges[exit];
    const pts = orthogonalPath(fromPt, { x: toPt.x, y: toPt.y, side: entrySide }, exit, entrySide);
    return { pts, exit, entry: entrySide };
  }

  function pointsToPathD(points) {
    if (!points.length) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
    return d;
  }

  function computeDecisionConnection(fromEl, toEl, side) {
    if (core?.getDecisionBranchRoute) {
      const routed = core.getDecisionBranchRoute(domShapeToBox(fromEl), domShapeToBox(toEl), side, DECISION_CONN_OUTSET);
      return { d: pointsToPathD(routed.pts), pts: routed.pts };
    }

    const fromEdges = getEdgePoints(fromEl);
    const toEdges = getEdgePoints(toEl);
    const fromPt = side === 'right' ? fromEdges.right : fromEdges.left;
    const cx = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const cy = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const toCx = toEl.offsetLeft + toEl.offsetWidth / 2;
    const toCy = toEl.offsetTop + toEl.offsetHeight / 2;
    const hDist = side === 'right' ? toCx - cx : cx - toCx;
    const vDist = toCy - cy;
    const entry = vDist < -30 ? side : (Math.abs(vDist) < 30 && hDist > 20 ? (side === 'right' ? 'left' : 'right') : 'top');
    const toPt = toEdges[entry];
    const margin = 40;
    let pts;

    if (entry === side) {
      const corridor = side === 'right'
        ? Math.max(fromPt.x, toPt.x) + margin
        : Math.min(fromPt.x, toPt.x) - margin;
      pts = [fromPt, { x: corridor, y: fromPt.y }, { x: corridor, y: toPt.y }, toPt];
    } else if (Math.abs(toPt.y - fromPt.y) < 4) {
      pts = [fromPt, toPt];
    } else if (
      (side === 'right' && toPt.x > fromPt.x + 4) ||
      (side === 'left' && toPt.x < fromPt.x - 4)
    ) {
      pts = [fromPt, { x: toPt.x, y: fromPt.y }, toPt];
    } else {
      const xOut = side === 'right' ? fromPt.x + margin : fromPt.x - margin;
      pts = [fromPt, { x: xOut, y: fromPt.y }, { x: xOut, y: toPt.y }, toPt];
    }

    return { d: pointsToPathD(pts), pts };
  }

  function getDecisionEntrySide(fromEl, toEl, side) {
    if (core?.getDecisionBranchRoute) {
      return core.getDecisionBranchRoute(domShapeToBox(fromEl), domShapeToBox(toEl), side, DECISION_CONN_OUTSET).entry;
    }
    const cx = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const cy = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const toCx = toEl.offsetLeft + toEl.offsetWidth / 2;
    const toCy = toEl.offsetTop + toEl.offsetHeight / 2;
    const hDist = side === 'right' ? toCx - cx : cx - toCx;
    const vDist = toCy - cy;
    if (vDist < -30) return side;
    if (Math.abs(vDist) < 30 && hDist > 20) return side === 'right' ? 'left' : 'right';
    return 'top';
  }

  function getConnectionEntrySide(conn) {
    const fromEl = document.getElementById(conn.from);
    const toEl = document.getElementById(conn.to);
    if (!fromEl || !toEl) return 'top';

    const fromData = state.shapes.find(s => s.id === conn.from);
    if (fromData?.type === 'decision' && (conn.type === 'yes' || conn.type === 'no')) {
      const side = conn.type === 'yes' ? 'left' : 'right';
      return getDecisionEntrySide(fromEl, toEl, side);
    }

    const routeMode = ROUTE_MODES.includes(conn.routeMode) ? conn.routeMode : 'auto';
    return chooseSides(fromEl, toEl, routeMode).entry;
  }

  function sortConnsBySourcePosition(conns, entrySide) {
    return conns.slice().sort((a, b) => {
      const aFrom = document.getElementById(a.from);
      const bFrom = document.getElementById(b.from);
      if (!aFrom || !bFrom) return a.id.localeCompare(b.id);
      const aCx = aFrom.offsetLeft + aFrom.offsetWidth / 2;
      const bCx = bFrom.offsetLeft + bFrom.offsetWidth / 2;
      const aCy = aFrom.offsetTop + aFrom.offsetHeight / 2;
      const bCy = bFrom.offsetTop + bFrom.offsetHeight / 2;
      if (entrySide === 'left' || entrySide === 'right') return aCy - bCy || aCx - bCx;
      return aCx - bCx || aCy - bCy;
    });
  }

  function computeConnectionGeometry(fromEl, toEl, conn) {
    const connType = conn?.type || null;
    const fromData = state.shapes.find(s => s.id === fromEl.id);

    // Special clean routing for decision Yes/No.
    // Standard convention: Так (Yes) exits LEFT, Ні (No) exits RIGHT.
    if (fromData?.type === 'decision') {
      if (connType === 'yes') return computeDecisionConnection(fromEl, toEl, 'left');
      if (connType === 'no') return computeDecisionConnection(fromEl, toEl, 'right');
    }

    // Kid mode keeps arrows fully automatic and predictable.
    // We intentionally ignore custom route modes and fan-in spreading.
    const routed = routeOrthogonal(fromEl, toEl, 'auto');
    const pts = routed.pts;
    const d = pointsToPathD(pts);
    return { d, pts };
  }

  function removeConnectionDom(connId) {
    document.getElementById(connId)?.remove();
    document.getElementById(`label-${connId}`)?.remove();
    document.getElementById(`hit-${connId}`)?.remove();
  }

  function markerForConnection(conn) {
    if (conn?.type === 'yes') return 'url(#arrowhead-yes)';
    if (conn?.type === 'no') return 'url(#arrowhead-no)';
    return 'url(#arrowhead)';
  }

  function getConnectionLabelText(conn) {
    if (conn?.type === 'yes' || conn?.type === 'no') {
      return FlowchartCore.resolveConnectionLabel(conn);
    }
    return '';
  }

  function updateConnection(connId) {
    const conn = state.connections.find(c => c.id === connId);
    const path = document.getElementById(connId);
    const hit = document.getElementById(`hit-${connId}`);
    if (!conn || !path) return;
    const fromEl = document.getElementById(conn.from);
    const toEl = document.getElementById(conn.to);
    if (!fromEl || !toEl) return;
    const geo = computeConnectionGeometry(fromEl, toEl, conn);
    path.setAttribute('d', geo.d);
    hit?.setAttribute('d', geo.d);
    path.setAttribute('marker-end', markerForConnection(conn));
    const labelText = getConnectionLabelText(conn);
    if (labelText) {
      if (!document.getElementById(`label-${connId}`)) addConnectionLabel(connId);
      updateConnectionLabel(connId, geo.pts);
    } else {
      document.getElementById(`label-${connId}`)?.remove();
    }
  }

  function updateConnectionsForShape(shapeId) {
    state.connections.forEach(conn => {
      if (conn.from === shapeId || conn.to === shapeId) updateConnection(conn.id);
    });
  }

  function connectShapes(fromEl, toEl, connType, forcedId, isRestore = false, forcedRouteMode = 'auto') {
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
      path.setAttribute('stroke', '#28a745');
      path.setAttribute('stroke-width', '3.2');
      path.setAttribute('marker-end', 'url(#arrowhead-yes)');
    } else if (connType === 'no') {
      path.setAttribute('stroke', '#ef4444');
      path.setAttribute('stroke-width', '3.2');
      path.setAttribute('marker-end', 'url(#arrowhead-no)');
    } else {
      path.setAttribute('stroke', '#4b5563');
      path.setAttribute('stroke-width', '3.2');
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

    if (!state.connections.find(c => c.id === connId)) {
      state.connections.push({ id: connId, from: fromEl.id, to: toEl.id, type: connType, routeMode: 'auto', label: null });
    }

    updateConnection(connId);
    return path;
  }

  function addConnectionLabel(connId) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = `label-${connId}`;
    g.style.pointerEvents = 'none';

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('rx', '11');
    bg.setAttribute('ry', '11');
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', '#607d8b');
    bg.setAttribute('stroke-width', '2');

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('fill', '#37474f');
    txt.setAttribute('font-family', "'Nunito', Arial, sans-serif");
    txt.setAttribute('font-size', '14px');
    txt.setAttribute('font-weight', '900');
    txt.textContent = '';

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
      const toEl = document.getElementById(conn.to);
      if (!fromEl || !toEl) return;
      pts = computeConnectionGeometry(fromEl, toEl, conn).pts;
    }

    let p = core?.getConnectionLabelPosition
      ? core.getConnectionLabelPosition(pts, conn.type)
      : pointAlongPolyline(pts, (conn.type === 'yes' || conn.type === 'no') ? 0.28 : 0.5);
    if (core?.resolveConnectionLabelOverlap) {
      const occupied = Array.from(svgLayer.querySelectorAll('g[id^="label-"]'))
        .filter((group) => group.id !== `label-${connId}`)
        .map((group) => {
          const textNode = group.querySelector('text');
          if (!textNode) return null;
          const x = Number(textNode.getAttribute('x'));
          const y = Number(textNode.getAttribute('y'));
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
          return { x, y };
        })
        .filter(Boolean);
      p = core.resolveConnectionLabelOverlap(p, conn.type, occupied);
    }
    const txt = labelGroup.querySelector('text');
    const bg = labelGroup.querySelector('rect');
    const labelText = getConnectionLabelText(conn);
    if (!labelText) {
      labelGroup.remove();
      return;
    }
    txt.textContent = labelText;
    bg.setAttribute('stroke', conn.type === 'yes' ? '#4caf50' : conn.type === 'no' ? '#f44336' : '#607d8b');
    txt.setAttribute('fill', conn.type === 'yes' ? '#2e7d32' : conn.type === 'no' ? '#c62828' : '#37474f');
    txt.setAttribute('x', p.x);
    txt.setAttribute('y', p.y);
    try {
      const bbox = txt.getBBox();
      const pad = 7;
      bg.setAttribute('x', bbox.x - pad);
      bg.setAttribute('y', bbox.y - pad);
      bg.setAttribute('width', bbox.width + pad * 2);
      bg.setAttribute('height', bbox.height + pad * 2);
    } catch (_) { }
  }

  // ================= SELECT CONNECTION =================
  function clearConnectionSelection(updateBar = true) {
    if (updateBar) updateConnectionBar();
  }

  function updateConnectionBar() {
    const hasShapeSelected = !!state.selectedShape;
    if (shapeBar) {
      if (hasShapeSelected) shapeBar.classList.remove('hidden');
      else shapeBar.classList.add('hidden');
    }

    if (editShapeBtn) editShapeBtn.disabled = !hasShapeSelected;
    if (deleteShapeBtn) deleteShapeBtn.disabled = !hasShapeSelected;
  }


  // ================= SHAPES =================
  function rectsOverlap(a, b, gap = 14) {
    return !(
      (a.left + a.w + gap) < b.left ||
      (b.left + b.w + gap) < a.left ||
      (a.top + a.h + gap) < b.top ||
      (b.top + b.h + gap) < a.top
    );
  }

  function hasShapeCollision(left, top, w, h) {
    const nextRect = { left, top, w, h };
    return state.shapes.some(s => {
      const el = document.getElementById(s.id);
      if (!el) return false;
      const rect = {
        left: el.offsetLeft,
        top: el.offsetTop,
        w: el.offsetWidth || getShapeSizeHint(s.type).w,
        h: el.offsetHeight || getShapeSizeHint(s.type).h,
      };
      return rectsOverlap(nextRect, rect);
    });
  }

  function findAutoShapePosition(type, startLeft, startTop) {
    const hint = getShapeSizeHint(type);
    const minLeft = LAYOUT.autoPlace.minLeft;
    const minTop = LAYOUT.autoPlace.minTop;
    const x0 = Math.max(minLeft, Math.round(startLeft));
    const y0 = Math.max(minTop, Math.round(startTop));
    if (!hasShapeCollision(x0, y0, hint.w, hint.h)) return { left: x0, top: y0 };

    const stepX = LAYOUT.autoPlace.stepX;
    const stepY = LAYOUT.autoPlace.stepY;
    const maxRing = 14;

    for (let ring = 1; ring <= maxRing; ring++) {
      for (let dx = -ring; dx <= ring; dx++) {
        for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const left = Math.max(minLeft, x0 + dx * stepX);
          const top = Math.max(minTop, y0 + dy * stepY);
          if (!hasShapeCollision(left, top, hint.w, hint.h)) return { left, top };
        }
      }
    }
    return { left: x0 + stepX, top: y0 + stepY };
  }

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
    const sizeHint = getShapeSizeForText(type, raw);
    shape.style.width = `${sizeHint.w}px`;
    shape.style.height = `${sizeHint.h}px`;

    const containerRect = canvasContainer.getBoundingClientRect();
    const defaultLeft = (canvasContainer.scrollLeft + containerRect.width / 2) / state.scale - sizeHint.w / 2;
    const defaultTop = (canvasContainer.scrollTop + containerRect.height / 3) / state.scale - sizeHint.h / 2;
    const autoPos = (posLeft === undefined || posTop === undefined)
      ? findAutoShapePosition(type, defaultLeft, defaultTop)
      : null;
    const finalLeft = posLeft !== undefined ? posLeft : autoPos.left;
    const finalTop = posTop !== undefined ? posTop : autoPos.top;
    shape.style.left = finalLeft + 'px';
    shape.style.top = finalTop + 'px';

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
    if (shapeTextArea) {
      shapeTextArea.value = (s?.textRaw || '').trim();
      shapeTextArea.placeholder = getTextPlaceholder(s?.type || getShapeType(shapeEl));
    }
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
      el.style.top = newY + 'px';
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
    closeBuilderWizard();
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

  // ================= QUICK ADD WIZARD =================
  document.querySelectorAll('.wizard-type-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.wizardType;
      if (!type) return;
      state.lastShapeType = type;
      updateShapeHelper(type);
      openWizardTextStep(type);
    });
  });
  wizardCloseBtn?.addEventListener('click', closeBuilderWizard);
  wizardBackText?.addEventListener('click', () => showWizardStep('type'));
  wizardBackExisting?.addEventListener('click', () => showWizardStep('type'));
  wizardSaveShape?.addEventListener('click', createShapeFromWizard);
  wizardTextInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createShapeFromWizard();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeBuilderWizard();
    }
  });
  wizardConnectExisting?.addEventListener('click', () => {
    renderExistingTargets();
    showWizardStep('existing');
  });
  builderWizard?.addEventListener('pointerdown', (e) => {
    if (e.target === builderWizard) closeBuilderWizard();
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
    alignSimpleFlowCenters();
    ensureDecisionClearance();
    closeModal(textModal);
    state.activeShape = null;
    scheduleRefresh();
  });

  // ================= DELETE / CLEAR =================
  function shouldCascadeDeleteTarget(fromId, toId) {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    if (!fromEl || !toEl) return true;

    const fromCenterY = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const toCenterY = toEl.offsetTop + toEl.offsetHeight / 2;

    // If a connection goes upward/back into an earlier step, keep that block
    // and remove only the connection. Cascade deletion should continue only
    // into blocks that are visually below the deleted step.
    return toCenterY >= fromCenterY - 4;
  }

  function collectCascadeShapeIds(rootShapeId) {
    const toVisit = [rootShapeId];
    const collected = new Set();

    while (toVisit.length) {
      const currentId = toVisit.pop();
      if (!currentId || collected.has(currentId)) continue;
      collected.add(currentId);

      state.connections.forEach((conn) => {
        if (conn.from === currentId
          && !collected.has(conn.to)
          && shouldCascadeDeleteTarget(currentId, conn.to)) {
          toVisit.push(conn.to);
        }
      });
    }

    return collected;
  }

  function getDeleteCascadeMessage(shapeEl, cascadeIds) {
    const selectedText = (shapeEl?.querySelector('.content')?.textContent || '').trim() || 'цей блок';
    const totalBlocks = cascadeIds.size;
    const downstreamCount = Math.max(0, totalBlocks - 1);
    const isStartBlock = getShapeType(shapeEl) === 'start-end'
      && selectedText.trim().toLowerCase() === 'початок';

    if (isStartBlock) {
      return 'Якщо видалити блок "Початок", уся схема нижче теж буде видалена. Після цього редактор одразу створить новий блок "Початок". Продовжити?';
    }
    if (downstreamCount === 0) {
      return `Видалити блок «${selectedText}»?`;
    }
    return `Якщо видалити блок «${selectedText}», разом із ним буде видалено всі блоки після нього. Разом зникне ${totalBlocks} блоків. Продовжити?`;
  }

  function deleteShapeCascade(shapeEl) {
    if (!shapeEl) return;
    const cascadeIds = collectCascadeShapeIds(shapeEl.id);
    if (!cascadeIds.size) return;

    saveSnapshot();

    const connectionIds = state.connections
      .filter((conn) => cascadeIds.has(conn.from) || cascadeIds.has(conn.to))
      .map((conn) => conn.id);
    connectionIds.forEach((id) => removeConnectionDom(id));
    state.connections = state.connections
      .filter((conn) => !cascadeIds.has(conn.from) && !cascadeIds.has(conn.to));

    cascadeIds.forEach((shapeId) => {
      document.getElementById(shapeId)?.remove();
      removeHandleGroup(shapeId);
    });
    state.shapes = state.shapes.filter((shape) => !cascadeIds.has(shape.id));

    deselectAll(false);
    clearConnectionSelection(false);

    if (!state.shapes.length) {
      resetToInitialStart();
      return;
    }

    updateConnectionBar();
    scheduleRefresh();
  }

  function deleteSelected() {
    if (!state.selectedShape) return;
    const shapeEl = state.selectedShape;
    const cascadeIds = collectCascadeShapeIds(shapeEl.id);
    const confirmText = getDeleteCascadeMessage(shapeEl, cascadeIds);
    showConfirmModal(confirmText, () => deleteShapeCascade(shapeEl));
  }

  editShapeBtn?.addEventListener('click', () => {
    if (state.selectedShape) openTextModal(state.selectedShape);
  });
  deleteShapeBtn?.addEventListener('click', deleteSelected);

  clearButton?.addEventListener('click', () => {
    showConfirmModal('Очистити все полотно?', () => {
      saveSnapshot();
      closeBuilderWizard();
      state.diagramTitle = '';
      if (titleInput) titleInput.value = '';
      renderTitle();
      state.shapeCounter = 0;
      state.redoStack = [];
      resetToInitialStart();
    });
  });

  // ================= SAVE AS IMAGE =================
  function computeShapesBounds(includeTitle = true) {
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

    if (includeTitle && titleDisplay && titleDisplay.style.display !== 'none' && titleDisplay.textContent.trim()) {
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

  function downloadProjectJson() {
    const project = collectProjectData();
    const filename = sanitizeFilename(state.diagramTitle || 'блок-схема');
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function getImportErrorMessage(error) {
    if (error instanceof SyntaxError) {
      return 'Файл має помилку в JSON-форматі й не може бути відкритий.';
    }

    const message = String(error?.message || '');
    if (message.includes('Too many shapes')) {
      return 'У файлі занадто багато блоків. Максимум 500.';
    }
    if (message.includes('Too many connections')) {
      return 'У файлі занадто багато стрілок. Максимум 1000.';
    }
    if (message.includes('Invalid project data')) {
      return 'Це не схоже на JSON-проєкт із цього редактора.';
    }

    return 'Не вдалося відкрити проєкт. Перевір JSON-файл.';
  }

  function importProjectData(rawProject) {
    const parsed = core?.parseProject ? core.parseProject(rawProject) : (typeof rawProject === 'string' ? JSON.parse(rawProject) : rawProject);
    saveSnapshot();
    restoreSnapshot(parsed);
    showMessageModal('Проєкт завантажено.');
  }

  function openProjectFilePicker() {
    projectFileInput.value = '';
    projectFileInput.click();
  }

  async function exportPng(options = {}) {
    const suppressTitle = !!options.suppressTitle;
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
    const prevTitleDisplay = titleDisplay ? titleDisplay.style.display : null;
    const prevTitleLeft = titleDisplay ? titleDisplay.style.left : '';
    const prevTitleTop = titleDisplay ? titleDisplay.style.top : '';
    const prevTitleTransform = titleDisplay ? titleDisplay.style.transform : '';
    const prevCanvasWidth = canvas.style.width;
    const prevCanvasHeight = canvas.style.height;
    if (suppressTitle && titleDisplay) titleDisplay.style.display = 'none';
    setZoom(1);
    await new Promise(r => setTimeout(r, 60));

    let b = computeShapesBounds();
    const pad = LAYOUT.exportPad;
    if (!suppressTitle && titleDisplay && (state.diagramTitle || '').trim()) {
      titleDisplay.style.display = '';
      titleDisplay.style.visibility = 'hidden';
      const measuredHeight = titleDisplay.getBoundingClientRect().height || titleDisplay.offsetHeight || 48;
      titleDisplay.style.left = `${(b.minX + b.maxX) / 2}px`;
      titleDisplay.style.top = `${Math.max(24, b.minY - measuredHeight - 36)}px`;
      titleDisplay.style.transform = 'translateX(-50%)';
      titleDisplay.style.visibility = '';
      titleDisplay.style.display = '';
      await new Promise(r => requestAnimationFrame(r));
      b = computeShapesBounds();
    }

    const exportRight = Math.max(canvas.offsetWidth, b.maxX + pad);
    const exportBottom = Math.max(canvas.offsetHeight, b.maxY + pad);
    canvas.style.width = `${Math.ceil(exportRight)}px`;
    canvas.style.height = `${Math.ceil(exportBottom)}px`;
    await new Promise(r => requestAnimationFrame(r));

    const x = Math.max(0, b.minX - pad);
    const y = Math.max(0, b.minY - pad);
    const w = Math.max(1, Math.ceil((b.maxX - b.minX) + pad * 2));
    const h = Math.max(1, Math.ceil((b.maxY - b.minY) + pad * 2));

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
      if (suppressTitle && titleDisplay) titleDisplay.style.display = prevTitleDisplay;
      if (!suppressTitle && titleDisplay) {
        titleDisplay.style.left = prevTitleLeft;
        titleDisplay.style.top = prevTitleTop;
        titleDisplay.style.transform = prevTitleTransform;
        titleDisplay.style.display = prevTitleDisplay;
      }
      canvas.style.width = prevCanvasWidth;
      canvas.style.height = prevCanvasHeight;
      if (prevSel) prevSel.classList.add('selected');
      setZoom(prevScale);
      canvasContainer.scrollLeft = prevScroll.left;
      canvasContainer.scrollTop = prevScroll.top;
      scheduleRefresh();
    }
  }

  function openSaveTitlePrompt() {
    if (!saveTitleModal) {
      exportPng();
      return;
    }
    if (saveTitleInput) {
      const current = (state.diagramTitle || titleInput?.value || '').trim();
      saveTitleInput.value = current;
    }
    openModal(saveTitleModal);
    setTimeout(() => saveTitleInput?.focus(), 40);
  }

  saveWithTitleBtn?.addEventListener('click', () => {
    const title = (saveTitleInput?.value || '').trim();
    if (!title) {
      showMessageModal('Введи назву або натисни "Зберегти без назви".');
      return;
    }
    state.diagramTitle = title;
    if (titleInput) titleInput.value = title;
    renderTitle();
    closeModal(saveTitleModal);
    exportPng();
  });

  saveWithoutTitleBtn?.addEventListener('click', () => {
    closeModal(saveTitleModal);
    exportPng({ suppressTitle: true });
  });

  closeSaveTitleBtn?.addEventListener('click', () => closeModal(saveTitleModal));

  saveButton?.addEventListener('click', openSaveTitlePrompt);
  saveProjectButton?.addEventListener('click', downloadProjectJson);
  openProjectButton?.addEventListener('click', openProjectFilePicker);
  projectFileInput.addEventListener('change', () => {
    const file = projectFileInput.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showMessageModal('Файл занадто великий. Максимум 2 МБ.');
      projectFileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProjectData(String(reader.result || ''));
      } catch (error) {
        console.error(error);
        showMessageModal(getImportErrorMessage(error));
      }
    };
    reader.onerror = () => {
      showMessageModal('Не вдалося прочитати файл проєкту.');
    };
    reader.readAsText(file, 'utf-8');
  });

  // ================= EXAMPLES PANEL =================
  function renderExamplesPanelContent() {
    if (!examplesList) return;
    examplesList.innerHTML = '';

    EXAMPLE_PROJECTS.forEach((example) => {
      const card = document.createElement('article');
      card.className = 'example-card';
      card.innerHTML = `
        <div class="example-icon" aria-hidden="true"><i class="fa-solid ${example.icon || 'fa-star'}"></i></div>
        <div class="example-copy">
          <h4 class="example-title">${example.title}</h4>
          <p class="example-subtitle">${example.subtitle}</p>
        </div>
        <button class="example-open-btn" type="button">Відкрити</button>
      `;
      card.querySelector('.example-open-btn')?.addEventListener('click', () => {
        try {
          saveSnapshot();
          restoreSnapshot(example.project, { focusMode: 'content' });
          toggleExamplesPanel(false);
        } catch (error) {
          console.error(error);
          showMessageModal('Не вдалося відкрити приклад.');
        }
      });
      examplesList.appendChild(card);
    });
  }

  renderExamplesPanelContent();
  hydrateWizardCards();

  function toggleExamplesPanel(show) {
    if (!examplesPanel) return;
    if (typeof show === 'boolean') {
      examplesPanel.hidden = !show;
      return;
    }
    examplesPanel.hidden = !examplesPanel.hidden;
  }
  examplesButton?.addEventListener('click', () => toggleExamplesPanel());
  examplesClose?.addEventListener('click', () => toggleExamplesPanel(false));

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
        redo();
        return;
      }
      e.preventDefault();
      undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      downloadProjectJson();
      return;
    }
    if (mod && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      openProjectFilePicker();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      openSaveTitlePrompt();
      return;
    }
    if (e.key === 'Escape') {
      if (examplesPanel && !examplesPanel.hidden) toggleExamplesPanel(false);
      closeModal(textModal);
      closeModal(document.getElementById('message-modal'));
      closeModal(saveTitleModal);
      closeBuilderWizard();
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
    closeBuilderWizard();
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
    renderQuickAddButtons();
  }
  function scheduleRefresh() {
    if (state._refreshRaf) return;
    state._refreshRaf = requestAnimationFrame(refreshAll);
  }
  window.addEventListener('resize', scheduleRefresh);

  // ================= INIT UI =================
  renderTitle();
  window.addEventListener('beforeunload', persistAutosave);
  const hasDraft = promptRestoreAutosave();
  if (!hasDraft) createInitialStartBlock();
  renderQuickAddButtons();

});
