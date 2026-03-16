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

  const helpButton = document.getElementById('help-button');
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

  const connectionBar = document.getElementById('connection-bar');
  let shapeBar = document.getElementById('shape-bar');
  const deleteConnBtn = document.getElementById('delete-conn-btn');
  const routeConnBtn = document.getElementById('route-conn-btn');
  let editShapeBtn = document.getElementById('edit-shape-btn');
  let deleteShapeBtn = document.getElementById('delete-shape-btn');
  let editConnLabelBtn = null;
  const saveTitleModal = document.getElementById('save-title-modal');
  const saveTitleInput = document.getElementById('save-title-input');
  const saveWithTitleBtn = document.getElementById('save-with-title');
  const saveWithoutTitleBtn = document.getElementById('save-without-title');
  const closeSaveTitleBtn = document.getElementById('close-save-title');

  const titleInput = document.getElementById('diagram-title-input');
  const titleDisplay = document.getElementById('diagram-title-display');

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

  const legacyDeleteButton = document.getElementById('delete-button');
  legacyDeleteButton?.remove();

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

  const openProjectButton = createActionButton('open-project-button', 'Відкрити проєкт JSON', 'fa-solid fa-folder-open', 'Відкрити проєкт');
  const saveProjectButton = createActionButton('save-project-button', 'Зберегти проєкт JSON', 'fa-solid fa-file-arrow-down', 'Зберегти проєкт');
  if (quickActions && saveButton) {
    quickActions.insertBefore(openProjectButton, saveButton);
    quickActions.insertBefore(saveProjectButton, saveButton);
  }

  if (!shapeBar && connectionBar?.parentElement) {
    shapeBar = document.createElement('div');
    shapeBar.id = 'shape-bar';
    shapeBar.className = 'connection-bar shape-bar hidden';
    shapeBar.setAttribute('role', 'status');
    shapeBar.setAttribute('aria-label', 'Вибраний блок');
    shapeBar.innerHTML = `
      <span><i class="fa-solid fa-vector-square"></i> Вибраний блок</span>
      <button id="edit-shape-btn" class="conn-route-btn" aria-label="Змінити текст блока"><i class="fa-solid fa-pen"></i> Текст</button>
      <button id="delete-shape-btn" class="conn-delete-btn" aria-label="Видалити блок"><i class="fa-solid fa-trash"></i> Видалити блок</button>
    `;
    connectionBar.parentElement.insertBefore(shapeBar, connectionBar.nextSibling);
    editShapeBtn = shapeBar.querySelector('#edit-shape-btn');
    deleteShapeBtn = shapeBar.querySelector('#delete-shape-btn');
  }

  const projectFileInput = document.createElement('input');
  projectFileInput.id = 'project-file-input';
  projectFileInput.type = 'file';
  projectFileInput.accept = '.json,application/json';
  projectFileInput.hidden = true;
  document.body.appendChild(projectFileInput);

  document.querySelectorAll('.title-hint, .color-hint').forEach((el) => el.remove());

  const connectionLabelModal = document.createElement('div');
  connectionLabelModal.id = 'connection-label-modal';
  connectionLabelModal.className = 'modal';
  connectionLabelModal.setAttribute('role', 'dialog');
  connectionLabelModal.setAttribute('aria-modal', 'true');
  connectionLabelModal.setAttribute('aria-labelledby', 'connection-label-modal-title');
  connectionLabelModal.innerHTML = `
    <div class="modal-content">
      <h2 id="connection-label-modal-title"><i class="fa-solid fa-tag"></i> Підпис стрілки</h2>
      <p>Введи довільний підпис для стрілки або залиш поле порожнім, щоб прибрати власний підпис.</p>
      <input id="connection-label-input" type="text" maxlength="40"
        aria-label="Підпис стрілки"
        style="width:100%;padding:12px;border:2px solid var(--light-border);border-radius:10px;font-size:16px;font-family:var(--font);font-weight:800;margin-bottom:14px;display:block;">
      <div class="modal-buttons">
        <button class="modal-btn cancel-btn" id="cancel-connection-label">Скасувати</button>
        <button class="modal-btn ok-btn" id="save-connection-label"><i class="fa-solid fa-check"></i> Зберегти</button>
      </div>
    </div>
  `;
  document.body.appendChild(connectionLabelModal);
  const connectionLabelInput = connectionLabelModal.querySelector('#connection-label-input');
  const cancelConnectionLabelBtn = connectionLabelModal.querySelector('#cancel-connection-label');
  const saveConnectionLabelBtn = connectionLabelModal.querySelector('#save-connection-label');
  let pendingConnectionLabelId = null;

  if (connectionBar && deleteConnBtn) {
    editConnLabelBtn = document.createElement('button');
    editConnLabelBtn.id = 'edit-conn-label-btn';
    editConnLabelBtn.className = 'conn-route-btn';
    editConnLabelBtn.type = 'button';
    editConnLabelBtn.disabled = true;
    editConnLabelBtn.textContent = 'Підпис';
    editConnLabelBtn.setAttribute('aria-label', 'Редагувати підпис стрілки');
    connectionBar.insertBefore(editConnLabelBtn, deleteConnBtn);
  }

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
    discard.textContent = 'Почати спочатку';
    discard.className = 'modal-btn cancel-btn';
    discard.onclick = () => {
      closeModal(modal);
      onDiscard?.();
    };

    const restore = document.createElement('button');
    restore.textContent = 'Відновити';
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

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#ffffff';
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/\d+/g);
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
    }
    return '#ffffff';
  }

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
    if (!draft) return;
    const when = draft.savedAt
      ? new Date(draft.savedAt).toLocaleString('uk-UA')
      : 'невідомий час';
    showRestoreDraftModal(
      `Знайдено автоматично збережену схему від ${when}. Відновити її?`,
      () => {
        restoreSnapshot(draft.project);
        showMessageModal('Автозбережену схему відновлено.');
      },
      clearAutosave,
    );
  }

  // ================= TEXT WRAP =================
  function smartWrapText(raw, type) {
    if (core?.smartWrapText) return core.smartWrapText(raw, type);
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

  function createHandleGroup(shapeEl) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.dataset.shapeId = shapeEl.id;
    ['top', 'right', 'bottom', 'left'].forEach(pos => {
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
    const g = shapeHandleGroups[shapeId];
    if (!el || !g) return;
    const pts = getHandlePositions(el);
    const circles = g.querySelectorAll('circle');
    ['top', 'right', 'bottom', 'left'].forEach((pos, i) => {
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

  function getFanInOffset(conn, entrySide, toEl) {
    const incoming = state.connections
      .filter(c => c.to === conn.to && getConnectionEntrySide(c) === entrySide);
    const sortedIncoming = sortConnsBySourcePosition(incoming, entrySide);

    if (sortedIncoming.length <= 1) return 0;
    const idx = sortedIncoming.findIndex(c => c.id === conn.id);
    if (idx < 0) return 0;

    const slot = idx - (sortedIncoming.length - 1) / 2;
    const spacing = 16;
    const rawOffset = slot * spacing;

    if (entrySide === 'top' || entrySide === 'bottom') {
      const max = Math.max(14, toEl.offsetWidth / 2 - 16);
      return Math.max(-max, Math.min(max, rawOffset));
    }
    const max = Math.max(12, toEl.offsetHeight / 2 - 14);
    return Math.max(-max, Math.min(max, rawOffset));
  }

  function applyEntryOffset(points, entrySide, offset, toEl) {
    if (!offset || !points || points.length < 2) return points;
    const out = points.map(p => ({ ...p }));
    const last = out.length - 1;

    if (entrySide === 'top' || entrySide === 'bottom') {
      const cx = toEl.offsetLeft + toEl.offsetWidth / 2;
      const max = Math.max(14, toEl.offsetWidth / 2 - 16);
      const shiftedX = Math.max(cx - max, Math.min(cx + max, out[last].x + offset));
      out[last].x = shiftedX;
      out[last - 1].x = shiftedX;
    } else {
      const cy = toEl.offsetTop + toEl.offsetHeight / 2;
      const max = Math.max(12, toEl.offsetHeight / 2 - 14);
      const shiftedY = Math.max(cy - max, Math.min(cy + max, out[last].y + offset));
      out[last].y = shiftedY;
      out[last - 1].y = shiftedY;
    }
    return out;
  }

  function buildMergeContext() {
    const groups = new Map();

    state.connections.forEach(conn => {
      if (conn.type) return; // keep Yes/No branches independent
      const fromEl = document.getElementById(conn.from);
      const toEl = document.getElementById(conn.to);
      if (!fromEl || !toEl) return;
      const entrySide = getConnectionEntrySide(conn);
      const key = `${conn.to}|${entrySide}`;
      if (!groups.has(key)) groups.set(key, { toEl, entrySide, conns: [] });
      groups.get(key).conns.push(conn);
    });

    const byConnId = {};
    groups.forEach(group => {
      if (group.conns.length < 2) return;
      const targetEdges = getEdgePoints(group.toEl);
      const targetPt = targetEdges[group.entrySide];
      const junction = { x: targetPt.x, y: targetPt.y };
      if (group.entrySide === 'top') junction.y -= MERGE_LEAD;
      if (group.entrySide === 'bottom') junction.y += MERGE_LEAD;
      if (group.entrySide === 'left') junction.x -= MERGE_LEAD;
      if (group.entrySide === 'right') junction.x += MERGE_LEAD;

      const sorted = sortConnsBySourcePosition(group.conns, group.entrySide);

      const primaryIdx = Math.floor((sorted.length - 1) / 2);
      sorted.forEach((conn, idx) => {
        byConnId[conn.id] = {
          isMerged: true,
          isPrimary: idx === primaryIdx,
          entrySide: group.entrySide,
          junction,
          targetPt,
        };
      });
    });

    return byConnId;
  }

  function computeConnectionGeometry(fromEl, toEl, conn, mergeContext) {
    const connType = conn?.type || null;
    const fromData = state.shapes.find(s => s.id === fromEl.id);

    // Special clean routing for decision Yes/No.
    // Standard convention: Так (Yes) exits LEFT, Ні (No) exits RIGHT.
    if (fromData?.type === 'decision') {
      if (connType === 'yes') return computeDecisionConnection(fromEl, toEl, 'left');
      if (connType === 'no') return computeDecisionConnection(fromEl, toEl, 'right');
    }

    const mergeMeta = mergeContext?.[conn.id];
    if (mergeMeta?.isMerged) {
      const routeMode = ROUTE_MODES.includes(conn?.routeMode) ? conn.routeMode : 'auto';
      let pts = routeToPoint(fromEl, mergeMeta.junction, routeMode, mergeMeta.entrySide).pts;
      if (mergeMeta.isPrimary) {
        const last = pts[pts.length - 1];
        if (!last || last.x !== mergeMeta.targetPt.x || last.y !== mergeMeta.targetPt.y) {
          pts = pts.concat([{ x: mergeMeta.targetPt.x, y: mergeMeta.targetPt.y }]);
        }
      }
      return { d: pointsToPathD(pts), pts };
    }

    const routeMode = ROUTE_MODES.includes(conn?.routeMode) ? conn.routeMode : 'auto';
    const routed = routeOrthogonal(fromEl, toEl, routeMode);
    const offset = conn ? getFanInOffset(conn, routed.entry, toEl) : 0;
    const pts = applyEntryOffset(routed.pts, routed.entry, offset, toEl);
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
    return FlowchartCore.resolveConnectionLabel(conn);
  }

  function updateConnection(connId) {
    const conn = state.connections.find(c => c.id === connId);
    const path = document.getElementById(connId);
    const hit = document.getElementById(`hit-${connId}`);
    if (!conn || !path) return;
    const fromEl = document.getElementById(conn.from);
    const toEl = document.getElementById(conn.to);
    if (!fromEl || !toEl) return;
    const mergeContext = buildMergeContext();
    const mergeMeta = mergeContext[conn.id];
    const geo = computeConnectionGeometry(fromEl, toEl, conn, mergeContext);
    path.setAttribute('d', geo.d);
    hit?.setAttribute('d', geo.d);
    if (state.selectedConnId !== connId) {
      path.setAttribute('marker-end', mergeMeta?.isMerged && !mergeMeta.isPrimary ? 'none' : markerForConnection(conn));
    }
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
      const routeMode = ROUTE_MODES.includes(forcedRouteMode) ? forcedRouteMode : 'auto';
      state.connections.push({ id: connId, from: fromEl.id, to: toEl.id, type: connType, routeMode, label: null });
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
    const hasSelected = !!state.selectedConnId;
    const hasShapeSelected = !!state.selectedShape;
    if (connectionBar) {
      if (hasSelected) connectionBar.classList.remove('hidden');
      else connectionBar.classList.add('hidden');
    }
    if (shapeBar) {
      if (!hasSelected && hasShapeSelected) shapeBar.classList.remove('hidden');
      else shapeBar.classList.add('hidden');
    }

    if (!routeConnBtn) return;
    if (!hasSelected) {
      routeConnBtn.disabled = true;
      routeConnBtn.textContent = 'Маршрут: Авто';
    } else {
      routeConnBtn.disabled = false;
      if (editConnLabelBtn) editConnLabelBtn.disabled = false;
      const conn = state.connections.find(c => c.id === state.selectedConnId);
      const mode = ROUTE_MODES.includes(conn?.routeMode) ? conn.routeMode : 'auto';
      if (editConnLabelBtn) editConnLabelBtn.textContent = conn?.label ? 'Підпис: змінити' : 'Підпис';
      routeConnBtn.textContent = `Маршрут: ${ROUTE_MODE_LABELS[mode]}`;
    }

    if (editShapeBtn) editShapeBtn.disabled = !hasShapeSelected || hasSelected;
    if (deleteShapeBtn) deleteShapeBtn.disabled = !hasShapeSelected || hasSelected;
  }

  function cycleSelectedConnectionRouteMode() {
    if (!state.selectedConnId) return;
    const conn = state.connections.find(c => c.id === state.selectedConnId);
    if (!conn) return;

    const current = ROUTE_MODES.includes(conn.routeMode) ? conn.routeMode : 'auto';
    const next = ROUTE_MODES[(ROUTE_MODES.indexOf(current) + 1) % ROUTE_MODES.length];
    saveSnapshot();
    conn.routeMode = next;
    updateConnection(conn.id);
    updateConnectionBar();
  }

  function deleteConnection(connId) {
    const conn = state.connections.find(c => c.id === connId);
    if (!conn) return;
    saveSnapshot();
    removeConnectionDom(connId);
    state.connections = state.connections.filter(c => c.id !== connId);
    clearConnectionSelection();
  }

  function editSelectedConnectionLabel() {
    if (!state.selectedConnId) return;
    const conn = state.connections.find(c => c.id === state.selectedConnId);
    if (!conn) return;
    pendingConnectionLabelId = conn.id;
    if (connectionLabelInput) connectionLabelInput.value = conn.label ?? '';
    openModal(connectionLabelModal);
    setTimeout(() => connectionLabelInput?.focus(), 40);
  }

  function saveConnectionLabel() {
    if (!pendingConnectionLabelId) {
      closeModal(connectionLabelModal);
      return;
    }
    const conn = state.connections.find(c => c.id === pendingConnectionLabelId);
    pendingConnectionLabelId = null;
    if (!conn) {
      closeModal(connectionLabelModal);
      return;
    }
    const normalized = (connectionLabelInput?.value || '').trim();
    saveSnapshot();
    conn.label = normalized || null;
    updateConnection(conn.id);
    updateConnectionBar();
    closeModal(connectionLabelModal);
  }

  deleteConnBtn?.addEventListener('click', () => {
    if (state.selectedConnId) deleteConnection(state.selectedConnId);
  });
  routeConnBtn?.addEventListener('click', cycleSelectedConnectionRouteMode);
  editConnLabelBtn?.addEventListener('click', editSelectedConnectionLabel);
  cancelConnectionLabelBtn?.addEventListener('click', () => {
    pendingConnectionLabelId = null;
    closeModal(connectionLabelModal);
  });
  saveConnectionLabelBtn?.addEventListener('click', saveConnectionLabel);
  connectionLabelInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveConnectionLabel();
    }
  });

  // ================= SHAPES =================
  function getShapeSizeHint(type) {
    if (type === 'connector') return { w: 60, h: 60 };
    if (type === 'decision') return { w: 140, h: 140 };
    if (type === 'start-end') return { w: 170, h: 78 };
    if (type === 'input-output') return { w: 170, h: 84 };
    if (type === 'subroutine') return { w: 190, h: 84 };
    return { w: 150, h: 84 };
  }

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
    const minLeft = 20;
    const minTop = 20;
    const x0 = Math.max(minLeft, Math.round(startLeft));
    const y0 = Math.max(minTop, Math.round(startTop));
    if (!hasShapeCollision(x0, y0, hint.w, hint.h)) return { left: x0, top: y0 };

    const stepX = 56;
    const stepY = 48;
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

    const containerRect = canvasContainer.getBoundingClientRect();
    const defaultLeft = (canvasContainer.scrollLeft + containerRect.width / 2) / state.scale - 75;
    const defaultTop = (canvasContainer.scrollTop + containerRect.height / 3) / state.scale - 30;
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

  editShapeBtn?.addEventListener('click', () => {
    if (state.selectedShape) openTextModal(state.selectedShape);
  });
  deleteShapeBtn?.addEventListener('click', deleteSelected);

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
      state.redoStack = [];
      hideAllHandles();
      updateHistoryButtons();
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
    if (suppressTitle && titleDisplay) titleDisplay.style.display = 'none';
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
      if (suppressTitle && titleDisplay) titleDisplay.style.display = prevTitleDisplay;
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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProjectData(String(reader.result || ''));
      } catch (error) {
        console.error(error);
        showMessageModal('Не вдалося відкрити проєкт. Перевір JSON-файл.');
      }
    };
    reader.onerror = () => {
      showMessageModal('Не вдалося прочитати файл проєкту.');
    };
    reader.readAsText(file, 'utf-8');
  });

  // ================= HELP PANEL =================
  function renderHelpPanelContent() {
    const stepsWrap = helpPanel?.querySelector('.help-steps');
    if (!stepsWrap) return;
    stepsWrap.innerHTML = `
      <div class="help-step"><span class="step-num">1</span><span><strong>Додати фігуру</strong> — обери тип у лівій панелі: базові блоки, <strong>Підпрограма</strong> або <strong>З'єднувач</strong>.</span></div>
      <div class="help-step"><span class="step-num">2</span><span><strong>Змінити текст</strong> — двічі натисни на фігуру. Для з'єднувача краще використовувати коротку позначку: <strong>A</strong>, <strong>1</strong>, <strong>B2</strong>.</span></div>
      <div class="help-step"><span class="step-num">3</span><span><strong>З'єднати стрілкою</strong> — наведи курсор на фігуру й потягни від білого кружечка до іншої фігури.</span></div>
      <div class="help-step"><span class="step-num">4</span><span><strong>Підписати стрілку</strong> — виділи стрілку й натисни кнопку <strong>Підпис</strong>. Так можна задати довільний текст, наприклад <strong>i ≤ N</strong> або <strong>варіант 2</strong>.</span></div>
      <div class="help-step"><span class="step-num">5</span><span><strong>Змінити маршрут</strong> — для виділеної стрілки натискай <strong>Маршрут</strong> або клавішу <strong>R</strong>. Для циклів використовуй обходи ліворуч або праворуч.</span></div>
      <div class="help-step"><span class="step-num">6</span><span><strong>Зберегти проєкт</strong> — кнопка <strong>Зберегти проєкт</strong> або <strong>Ctrl+Shift+S</strong> створює JSON-файл, який можна потім відкрити знову.</span></div>
      <div class="help-step"><span class="step-num">7</span><span><strong>Відкрити проєкт</strong> — кнопка <strong>Відкрити проєкт</strong> або <strong>Ctrl+O</strong> завантажує збережений JSON.</span></div>
      <div class="help-step"><span class="step-num">8</span><span><strong>Зберегти картинку</strong> — кнопка <strong>Зберегти</strong> або <strong>Ctrl+S</strong> експортує схему в PNG.</span></div>
      <div class="help-step"><span class="step-num">9</span><span><strong>Автовідновлення</strong> — редактор зберігає чернетку в браузері й після повторного відкриття пропонує її відновити.</span></div>
      <div class="help-step"><span class="step-num">10</span><span><strong>Скасувати</strong> — кнопка <strong>Скасувати</strong> або <strong>Ctrl+Z</strong>.</span></div>
      <div class="help-step"><span class="step-num">11</span><span><strong>Цикл while</strong> — спочатку перевіряємо умову, і лише якщо відповідь <strong>Так</strong>, виконуємо дію та повертаємось до умови.</span></div>
      <div class="help-step"><span class="step-num">12</span><span><strong>Цикл repeat-until</strong> — спочатку виконуємо дію, а перевірку ставимо після неї. Якщо відповідь <strong>Ні</strong>, повторюємо кроки ще раз.</span></div>
      <div class="help-step"><span class="step-num">13</span><span><strong>Назва схеми</strong> — поле зверху ліворуч показує назву над блоком <strong>Початок</strong> і використовується в імені файлів.</span></div>
    `;
  }

  renderHelpPanelContent();

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
    if (!mod && e.key.toLowerCase() === 'r' && state.selectedConnId) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        cycleSelectedConnectionRouteMode();
      }
      return;
    }

    if (e.key === 'Escape') {
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
  window.addEventListener('beforeunload', persistAutosave);
  promptRestoreAutosave();

  connectionModal?.addEventListener('pointerdown', (e) => {
    if (e.target === connectionModal) {
      state.pendingConn = null;
      closeModal(connectionModal);
    }
  });

});


