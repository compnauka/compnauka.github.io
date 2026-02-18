'use strict';

// ---- UI State ----
let selStart = { c: 0, r: 1 };
let selEnd = { c: 0, r: 1 };
let active = { c: 0, r: 1 };
let activeId = 'A1';

let isSelecting = false;
let isResizing = false;
let resizeCol = null;

let markedCells = [];

let chartObj = null;
let chartType = 'bar';

let confirmFn = null;

let gridWrap = null;
let insertColBtn = null;
let insertRowBtn = null;
let hoverInsertColAt = null; // 0..COL_COUNT
let hoverInsertRowAt = null; // 1..ROWS+1

let metrics = { rowHeaderW: 50, headerH: 40, rowH: 45 };

// Cache for fast access
let cellTd = [];  // [r][c]
let cellInp = []; // [r][c]
let colEls = [];  // colgroup <col> elements (0 = row header)

const MAX_HISTORY = 50;

// ---- Helpers ----
function getCellId(cIdx, r) {
  return `${COLS[cIdx]}${r}`;
}

function parseCellId(id) {
  const m = /^([A-Z]+)(\d+)$/.exec(String(id || '').toUpperCase());
  if (!m) return null;
  return { cIdx: colToIndex(m[1]), r: parseInt(m[2], 10), col: m[1] };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getBounds() {
  return {
    cMin: Math.min(selStart.c, selEnd.c),
    cMax: Math.max(selStart.c, selEnd.c),
    rMin: Math.min(selStart.r, selEnd.r),
    rMax: Math.max(selStart.r, selEnd.r)
  };
}

function ensureCellWithinBounds() {
  active.c = clamp(active.c, 0, COL_COUNT - 1);
  active.r = clamp(active.r, 1, ROWS);
  selStart.c = clamp(selStart.c, 0, COL_COUNT - 1);
  selEnd.c = clamp(selEnd.c, 0, COL_COUNT - 1);
  selStart.r = clamp(selStart.r, 1, ROWS);
  selEnd.r = clamp(selEnd.r, 1, ROWS);
  activeId = getCellId(active.c, active.r);
}

function styleStringToClassList(str) {
  const s = String(str || '').trim();
  if (!s) return [];
  return s
    .split(/\s+/)
    .map(x => x.trim())
    .filter(x => x.startsWith('style-'));
}

function extractStyleStringFromTd(td) {
  if (!td) return '';
  const styles = [];
  td.classList.forEach(cls => {
    if (cls.startsWith('style-')) styles.push(cls);
  });
  return styles.join(' ');
}

function setSaveBadge() {
  const badge = document.getElementById('saveBadge');
  if (!badge) return;
  badge.style.opacity = 1;
  setTimeout(() => { badge.style.opacity = 0; }, 900);
}

// ---- Aria announcer для скрінрідерів ----
function announce(msg) {
  const el = document.getElementById('ariaAnnouncer');
  if (!el) return;
  el.textContent = '';
  // Невелика затримка, щоб скрінрідер точно прочитав
  setTimeout(() => { el.textContent = msg; }, 50);
}

// ---- History ----
function snapshotState() {
  return {
    rows: ROWS,
    colCount: COL_COUNT,
    cellData: JSON.stringify(cellData),
    colWidths: JSON.stringify(colWidths),
    cellStyles: JSON.stringify(cellStyles)
  };
}

function statesEqual(a, b) {
  return !!a && !!b &&
    a.rows === b.rows &&
    a.colCount === b.colCount &&
    a.cellData === b.cellData &&
    a.colWidths === b.colWidths &&
    a.cellStyles === b.cellStyles;
}

function saveToHistory() {
  const state = snapshotState();

  // skip duplicates
  const last = history[history.length - 1];
  if (statesEqual(last, state)) {
    updateUndoRedoButtons();
    return;
  }

  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }

  history.push(state);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  historyIndex = history.length - 1;
  updateUndoRedoButtons();
}

function restoreState(state) {
  if (!state) return;

  cellData = safeParseJSON(state.cellData, {});
  colWidths = safeParseJSON(state.colWidths, {});
  cellStyles = safeParseJSON(state.cellStyles, {});

  setGridSize(state.rows, state.colCount);
  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(history[historyIndex]);
    updateUndoRedoButtons();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreState(history[historyIndex]);
    updateUndoRedoButtons();
  }
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (!undoBtn || !redoBtn) return;
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
}

// ---- Grid build / rebuild ----
function rebuildGrid() {
  ensureCellWithinBounds();

  const hRow = document.getElementById('headRow');
  const bRows = document.getElementById('bodyRows');
  const colgroup = document.getElementById('colgroup');

  if (!hRow || !bRows || !colgroup) {
    console.error('Grid elements not found');
    return;
  }

  // Recompute COLS (in case col count changed)
  COLS = buildCols(COL_COUNT);

  // Init missing widths
  for (let c = 0; c < COL_COUNT; c++) {
    if (!colWidths[c]) colWidths[c] = 80;
  }

  // Clear
  hRow.innerHTML = '';
  bRows.innerHTML = '';
  colgroup.innerHTML = '';

  // Colgroup (0 = row header)
  colEls = [];
  const colRowHeader = document.createElement('col');
  colRowHeader.style.width = '50px';
  colgroup.appendChild(colRowHeader);
  colEls.push(colRowHeader);

  for (let c = 0; c < COL_COUNT; c++) {
    const col = document.createElement('col');
    colgroup.appendChild(col);
    colEls.push(col);
  }

  // Header corner
  // ARIA — таблиця для скрінрідерів
  const table = document.getElementById('grid');
  if (table) {
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', 'Таблиця даних. Використовуй стрілки для навігації, Enter або F2 для редагування.');
  }

  const thCorner = document.createElement('th');
  thCorner.className = 'row-header';
  thCorner.textContent = '#';
  thCorner.title = 'Виділити все';
  thCorner.setAttribute('scope', 'col');
  thCorner.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    selStart = { c: 0, r: 1 };
    selEnd = { c: COL_COUNT - 1, r: ROWS };
    setActive(active.c, active.r, activeId, { keepSelection: true });
    renderSel();
  });
  hRow.appendChild(thCorner);

  // Column headers
  for (let c = 0; c < COL_COUNT; c++) {
    const th = document.createElement('th');
    th.classList.add('col-header');
    th.textContent = COLS[c];
    th.dataset.col = String(c);
    th.setAttribute('scope', 'col');
    th.setAttribute('aria-label', `Колонка ${COLS[c]}. Клацни, щоб виділити всю колонку.`);

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', (e) => startResize(e, c));
    th.appendChild(handle);

    th.addEventListener('mousedown', (e) => {
      const rect = th.getBoundingClientRect();
      const distanceFromRight = rect.right - e.clientX;
      if (distanceFromRight <= 10) return; // resize handle area
      if (e.button !== 0) return;
      // select column
      selStart = { c, r: 1 };
      selEnd = { c, r: ROWS };
      setActive(c, active.r, getCellId(c, active.r), { keepSelection: true });
      renderSel();
    });

    hRow.appendChild(th);
  }

  // Body
  cellTd = Array.from({ length: ROWS + 1 }, () => Array(COL_COUNT).fill(null));
  cellInp = Array.from({ length: ROWS + 1 }, () => Array(COL_COUNT).fill(null));

  for (let r = 1; r <= ROWS; r++) {
    const tr = document.createElement('tr');

    const rowTh = document.createElement('th');
    rowTh.textContent = String(r);
    rowTh.className = 'row-header';
    rowTh.title = `Виділити рядок ${r}`;
    rowTh.setAttribute('scope', 'row');
    rowTh.setAttribute('aria-label', `Рядок ${r}. Клацни, щоб виділити весь рядок.`);
    rowTh.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      selStart = { c: 0, r };
      selEnd = { c: COL_COUNT - 1, r };
      setActive(active.c, r, getCellId(active.c, r), { keepSelection: true });
      renderSel();
    });
    tr.appendChild(rowTh);

    for (let c = 0; c < COL_COUNT; c++) {
      const td = document.createElement('td');
      const id = getCellId(c, r);
      td.dataset.id = id;
      td.dataset.c = String(c);
      td.dataset.r = String(r);

      // apply saved styles
      const styleStr = cellStyles[id];
      if (styleStr) {
        styleStringToClassList(styleStr).forEach(cls => td.classList.add(cls));
      }

      const inp = document.createElement('input');
      inp.id = `inp_${id}`;
      inp.className = 'cell-input';
      inp.autocomplete = 'off';
      inp.setAttribute('role', 'gridcell');
      inp.setAttribute('aria-label', `Клітинка ${id}`);
      inp.setAttribute('aria-colindex', String(c + 2)); // +2: col1 = row-header
      inp.setAttribute('aria-rowindex', String(r + 1)); // +1: row1 = col-headers

      // Selection
      td.addEventListener('mousedown', (e) => {
        if (!isResizing) startSel(e, c, r, id);
      });
      td.addEventListener('mouseenter', () => {
        if (!isResizing) updateSel(c, r);
      });

      // Editing
      inp.addEventListener('focus', () => {
        if (!isSelecting && !isResizing) {
          setActive(c, r, id);
          // Cell always shows computed result; formula bar shows the raw formula.
          // User can press F2 or click formula bar to edit the formula directly.
        }
      });

      // F2 switches cell to formula-edit mode (shows raw formula in cell)
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'F2') {
          const raw = cellData[id];
          if (String(raw || '').startsWith('=')) {
            inp.value = raw;
            try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (_) { }
          }
        }
      });

      inp.addEventListener('input', (e) => {
        const v = String(e.target.value || '');
        if (v.length > 200) {
          e.target.value = v.substring(0, 200);
        }
        cellData[id] = e.target.value;

        if (activeId === id) {
          const fb = document.getElementById('formulaBar');
          if (fb) fb.value = e.target.value;
        }
      });

      inp.addEventListener('keydown', (e) => handleKey(e, c, r));
      inp.addEventListener('blur', () => {
        // commit on blur
        recalculateAll();
        persistStateToStorage();
        setSaveBadge();
        saveToHistory();
      });

      inp.addEventListener('paste', (e) => {
        // multi-cell paste (tabs/newlines) into grid
        const text = e.clipboardData?.getData('text/plain');
        if (!text) return;
        if (text.includes('\t') || text.includes('\n') || text.includes('\r')) {
          e.preventDefault();
          pasteToGrid(text, active.c, active.r);
        }
      });

      td.appendChild(inp);
      tr.appendChild(td);

      cellTd[r][c] = td;
      cellInp[r][c] = inp;
    }

    bRows.appendChild(tr);
  }

  // Apply widths via colgroup
  applyColWidths();

  // Metrics (for insert + hover)
  try {
    const cornerRect = thCorner.getBoundingClientRect();
    metrics.rowHeaderW = Math.round(cornerRect.width) || 50;
    metrics.headerH = Math.round(cornerRect.height) || 40;
    const td0 = cellTd[1]?.[0];
    if (td0) {
      const tdRect = td0.getBoundingClientRect();
      metrics.rowH = Math.round(tdRect.height) || 45;
    }
  } catch (_) { }

  // Restore selection visuals
  ensureCellWithinBounds();
  renderSel();

  // Populate raw values (computed will be shown after recalc)
  for (let r = 1; r <= ROWS; r++) {
    for (let c = 0; c < COL_COUNT; c++) {
      const id = getCellId(c, r);
      const inp = cellInp[r][c];
      if (!inp) continue;
      const raw = cellData[id];
      if (raw === undefined || raw === null || raw === '') {
        inp.value = '';
      } else {
        inp.value = raw;
      }
    }
  }
}

// ---- Resizing ----
function startResize(e, colIdx) {
  e.preventDefault();
  e.stopPropagation();
  isResizing = true;
  resizeCol = {
    idx: colIdx,
    startX: e.clientX,
    startWidth: colWidths[colIdx] || 80
  };
}

function resizeColumn(e) {
  if (!resizeCol) return;
  const diff = e.clientX - resizeCol.startX;
  const newWidth = Math.max(50, resizeCol.startWidth + diff);
  colWidths[resizeCol.idx] = newWidth;
  applyColWidths();
  persistStateToStorage();
  setSaveBadge();
}

function applyColWidths() {
  for (let c = 0; c < COL_COUNT; c++) {
    const width = colWidths[c] || 80;
    const colEl = colEls[c + 1];
    if (colEl) colEl.style.width = width + 'px';
  }
}

// ---- Calculation ----
function recalculateAll() {
  for (let r = 1; r <= ROWS; r++) {
    for (let c = 0; c < COL_COUNT; c++) {
      const id = getCellId(c, r);
      const raw = cellData[id];
      const input = cellInp[r][c];
      const td = cellTd[r][c];
      if (!input || !td) continue;

      td.classList.remove('error-cell');

      // keep user editing value as-is
      const isEditingThisCell = (document.activeElement === input);

      if (raw === undefined || raw === null || raw === '') {
        if (!isEditingThisCell) input.value = '';
        continue;
      }

      if (String(raw).startsWith('=')) {
        if (isEditingThisCell) {
          // show raw while editing
          continue;
        }
        try {
          calcDepth = 0;
          const val = evaluateFormula(String(raw).substring(1));
          input.value = val;
          input.removeAttribute('aria-invalid');
          td.removeAttribute('title');
        } catch (e) {
          const msg = e?.message || '❌ Помилка у формулі';
          input.value = msg;
          td.classList.add('error-cell');
          announce(`Помилка у клітинці ${id}: ${msg}`);
          input.setAttribute('aria-invalid', 'true');
          td.title = msg + '\nПриклад формули: =A1+B1 або =SUM(A1:A5)';
        }
      } else {
        if (!isEditingThisCell) input.value = raw;
      }
    }
  }

  // Keep formula bar in sync
  const fb = document.getElementById('formulaBar');
  if (fb && activeId) fb.value = cellData[activeId] || '';
}

// ---- Selection ----
function startSel(e, c, r, id) {
  if (e.button !== 0) return;

  const bar = document.getElementById('formulaBar');
  if (bar && document.activeElement === bar && String(bar.value || '').startsWith('=')) {
    // Insert cell ref into formula bar
    e.preventDefault();
    e.stopPropagation();
    insertChar(id);
    return;
  }

  isSelecting = true;
  selStart = { c, r };
  selEnd = { c, r };
  setActive(c, r, id);
  renderSel();
}

function updateSel(c, r) {
  if (!isSelecting) return;
  selEnd = { c, r };
  renderSel();
}

function setActive(c, r, id, opts = {}) {
  active = { c, r };
  activeId = id;

  const ref = document.getElementById('activeCellRef');
  if (ref) ref.innerText = id;
  // Повідомляємо скрінрідер про активну клітинку
  const cellVal = cellData[id] || '';
  announce(`Клітинка ${id}. ${cellVal ? 'Значення: ' + cellVal : 'Порожня'}`);

  const fb = document.getElementById('formulaBar');
  if (fb) fb.value = cellData[id] || '';

  if (!opts.keepSelection && !isSelecting) {
    selStart = selEnd = { c, r };
  }
  renderSel();
}

function renderSel() {
  // clear previous marks
  for (const td of markedCells) {
    td.classList.remove('selected-cell', 'in-range');
  }
  markedCells = [];

  const b = getBounds();

  for (let r = b.rMin; r <= b.rMax; r++) {
    const row = cellTd[r];
    if (!row) continue;
    for (let c = b.cMin; c <= b.cMax; c++) {
      const td = row[c];
      if (!td) continue;
      td.classList.add('in-range');
      markedCells.push(td);
    }
  }

  const aTd = cellTd[active.r]?.[active.c];
  if (aTd) {
    aTd.classList.add('selected-cell');
    if (!markedCells.includes(aTd)) markedCells.push(aTd);
  }
}

// ---- Keyboard / clipboard ----
function commitCell() {
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function handleKey(e, c, r) {
  const inp = cellInp[r]?.[c];

  // Escape — скасувати редагування, відновити попереднє значення
  if (e.key === 'Escape') {
    e.preventDefault();
    const saved = history[historyIndex];
    if (saved) {
      const prevData = safeParseJSON(saved.cellData, {});
      const id = getCellId(c, r);
      const prev = prevData[id] ?? '';
      cellData[id] = prev;
      if (inp) inp.value = prev;
      const fb = document.getElementById('formulaBar');
      if (fb && activeId === id) fb.value = prev;
    }
    inp?.blur();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    commitCell();
    const nextInp = cellInp[Math.min(r + 1, ROWS)]?.[c];
    if (nextInp) nextInp.focus();
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    commitCell();
    const nextC = e.shiftKey ? Math.max(c - 1, 0) : Math.min(c + 1, COL_COUNT - 1);
    const nextInp = cellInp[r]?.[nextC];
    if (nextInp) nextInp.focus();
    return;
  }

  // Навігація стрілками (тільки якщо клітинка не редагується або курсор на краю)
  const isAtStart = !inp || inp.selectionStart === 0;
  const isAtEnd   = !inp || inp.selectionStart === inp.value.length;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    commitCell();
    cellInp[Math.min(r + 1, ROWS)]?.[c]?.focus();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    commitCell();
    cellInp[Math.max(r - 1, 1)]?.[c]?.focus();
    return;
  }
  if (e.key === 'ArrowRight' && isAtEnd) {
    e.preventDefault();
    commitCell();
    cellInp[r]?.[Math.min(c + 1, COL_COUNT - 1)]?.focus();
    return;
  }
  if (e.key === 'ArrowLeft' && isAtStart) {
    e.preventDefault();
    commitCell();
    cellInp[r]?.[Math.max(c - 1, 0)]?.focus();
    return;
  }
}

function copySelectionToClipboard() {
  const b = getBounds();
  const rows = [];
  for (let r = b.rMin; r <= b.rMax; r++) {
    const cols = [];
    for (let c = b.cMin; c <= b.cMax; c++) {
      const id = getCellId(c, r);
      const raw = cellData[id] ?? '';
      // Копіюємо обчислений результат, а не сиру формулу
      let val;
      if (String(raw).startsWith('=')) {
        const inp = cellInp[r]?.[c];
        val = inp ? inp.value : raw;
      } else {
        val = raw;
      }
      cols.push(String(val));
    }
    rows.push(cols.join('\t'));
  }
  const tsv = rows.join('\n');

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(tsv).catch(() => fallbackCopyText(tsv));
  } else {
    fallbackCopyText(tsv);
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (_) { }
  ta.remove();
}

function pasteToGrid(text, startC, startR) {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  // remove trailing empty line
  if (lines.length && lines[lines.length - 1] === '') lines.pop();

  const data = lines.map(line => line.split('\t'));
  const rowCount = data.length;
  const colCount = Math.max(...data.map(r => r.length));

  ensureGridSize(startR + rowCount - 1, startC + colCount);

  for (let rr = 0; rr < rowCount; rr++) {
    for (let cc = 0; cc < data[rr].length; cc++) {
      const r = startR + rr;
      const c = startC + cc;
      if (r < 1 || r > ROWS || c < 0 || c >= COL_COUNT) continue;
      const id = getCellId(c, r);
      cellData[id] = data[rr][cc];
    }
  }

  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function ensureGridSize(minRows, minCols) {
  const needRows = Math.max(ROWS, Number(minRows) || ROWS);
  const needCols = Math.max(COL_COUNT, Number(minCols) || COL_COUNT);

  if (needRows === ROWS && needCols === COL_COUNT) return;

  setGridSize(needRows, needCols);
  rebuildGrid();
}

// ---- Formula bar helpers ----
function insertChar(char) {
  const bar = document.getElementById('formulaBar');
  if (!bar) return;

  let start = bar.selectionStart ?? bar.value.length;
  let end = bar.selectionEnd ?? bar.value.length;
  let val = bar.value;

  if (!val.startsWith('=')) {
    val = '=' + val;
    start++; end++;
  }

  const newVal = val.slice(0, start) + char + val.slice(end);
  if (newVal.length > 200) return;

  bar.value = newVal;
  cellData[activeId] = newVal;

  // If cell is focused, mirror value
  const inp = cellInp[active.r]?.[active.c];
  if (inp && document.activeElement === inp) inp.value = newVal;

  bar.focus();
  const newPos = start + String(char).length;
  bar.setSelectionRange(newPos, newPos);
}

function deleteSelection() {
  const b = getBounds();
  for (let c = b.cMin; c <= b.cMax; c++) {
    for (let r = b.rMin; r <= b.rMax; r++) {
      const id = getCellId(c, r);
      delete cellData[id];
      // keep styles
      const inp = cellInp[r]?.[c];
      if (inp) inp.value = '';
    }
  }

  const fb = document.getElementById('formulaBar');
  if (fb) fb.value = '';

  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function applyFunc(name) {
  recalculateAll();

  const b = getBounds();
  if (b.cMin === b.cMax && b.rMin === b.rMax) {
    alertModal('Виділіть більше однієї клітинки!');
    return;
  }

  let tC = b.cMin;
  let tR = b.rMax + 1;
  if (b.rMin === b.rMax && b.cMax > b.cMin) {
    tC = b.cMax + 1;
    tR = b.rMin;
  }

  // Auto expand if needed
  ensureGridSize(Math.max(ROWS, tR), Math.max(COL_COUNT, tC + 1));

  if (tC >= COL_COUNT || tR > ROWS) {
    alertModal('Немає місця для результату.');
    return;
  }

  const range = `${COLS[b.cMin]}${b.rMin}:${COLS[b.cMax]}${b.rMax}`;
  const targetId = getCellId(tC, tR);

  cellData[targetId] = `=${name}(${range})`;

  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();

  const inp = cellInp[tR]?.[tC];
  if (inp) inp.focus();
}

// ---- Styling ----
function applyStyleToSelection(fn) {
  const b = getBounds();
  for (let r = b.rMin; r <= b.rMax; r++) {
    for (let c = b.cMin; c <= b.cMax; c++) {
      const td = cellTd[r]?.[c];
      if (td) {
        fn(td);
        const id = getCellId(c, r);
        const styleStr = extractStyleStringFromTd(td);
        if (styleStr) cellStyles[id] = styleStr;
        else delete cellStyles[id];
      }
    }
  }

  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function toggleStyle(cls) {
  applyStyleToSelection(td => td.classList.toggle(cls));
}

function cycleColor() {
  const colors = ['style-bg-yellow', 'style-bg-green', 'style-bg-red', ''];
  applyStyleToSelection(td => {
    let curr = -1;
    colors.forEach((c, i) => { if (c && td.classList.contains(c)) curr = i; });
    colors.forEach(c => { if (c) td.classList.remove(c); });
    const next = colors[(curr + 1) % colors.length];
    if (next) td.classList.add(next);
  });
}



function autoFitColumns() {
  const b = getBounds();
  const colsToFit = [];
  for (let c = b.cMin; c <= b.cMax; c++) colsToFit.push(c);
  if (colsToFit.length === 0) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const sampleInput = document.querySelector('.cell-input');
  let font = '700 16px Nunito';
  if (sampleInput) {
    const cs = getComputedStyle(sampleInput);
    font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  }
  ctx.font = font;

  colsToFit.forEach(cIdx => {
    let maxWidth = 0;

    const th = document.querySelector(`th[data-col="${cIdx}"]`);
    if (th) maxWidth = Math.max(maxWidth, ctx.measureText(th.innerText || '').width);

    for (let r = 1; r <= ROWS; r++) {
      const inp = cellInp[r]?.[cIdx];
      if (!inp) continue;
      const text = String(inp.value || '');
      if (!text) continue;
      maxWidth = Math.max(maxWidth, ctx.measureText(text).width);
    }

    const padding = 32;
    const finalWidth = Math.min(Math.max(80, Math.ceil(maxWidth + padding)), 420);
    colWidths[cIdx] = finalWidth;
  });

  applyColWidths();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

// ---- CSV ----
function exportCSV() {
  const b = getBounds();
  const multi = (b.cMin !== b.cMax) || (b.rMin !== b.rMax);

  // used range
  let cMax = 0;
  let rMax = 1;

  if (!multi) {
    for (const key of Object.keys(cellData)) {
      const p = parseCellId(key);
      if (!p) continue;
      if (cellData[key] === undefined || cellData[key] === null || cellData[key] === '') continue;
      cMax = Math.max(cMax, p.cIdx);
      rMax = Math.max(rMax, p.r);
    }
    cMax = Math.max(cMax, 0);
    rMax = Math.max(rMax, 1);
  }

  const out = [];
  const delim = ';'; // зручно для Excel (UA)

  const fromC = multi ? b.cMin : 0;
  const toC   = multi ? b.cMax : Math.min(cMax, COL_COUNT - 1);
  const fromR = multi ? b.rMin : 1;
  const toR   = multi ? b.rMax : Math.min(rMax, ROWS);

  for (let r = fromR; r <= toR; r++) {
    const row = [];
    for (let c = fromC; c <= toC; c++) {
      const id = getCellId(c, r);
      const raw = cellData[id] ?? '';
      // Експортуємо обчислене значення, а не формулу
      let val;
      if (String(raw).startsWith('=')) {
        const inp = cellInp[r]?.[c];
        val = inp ? inp.value : raw; // обчислений результат з DOM
      } else {
        val = raw;
      }
      row.push(escapeCSV(String(val ?? ''), delim));
    }
    out.push(row.join(delim));
  }

  const csv = out.join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM для Excel
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const dt = new Date();
  const stamp = dt.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `komirnyk_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function escapeCSV(val, delim) {
  const s = String(val ?? '');
  if (s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  if (s.includes(delim) || s.includes('\n') || s.includes('\r')) {
    return '"' + s + '"';
  }
  return s;
}

function triggerCSVImport() {
  const inp = document.getElementById('csvFileInput');
  if (!inp) return;
  inp.value = '';
  inp.click();
}

function parseCSV(text) {
  const src = String(text || '');
  const firstLine = src.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delim = semiCount > commaCount ? ';' : ',';

  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === delim) {
      row.push(cur);
      cur = '';
      continue;
    }

    if (ch === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
      continue;
    }

    if (ch === '\r') {
      // handle CRLF
      if (src[i + 1] === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
      continue;
    }

    cur += ch;
  }

  row.push(cur);
  rows.push(row);

  // trim trailing empty rows
  while (rows.length && rows[rows.length - 1].every(v => v === '')) rows.pop();
  return rows;
}

function importCSVText(text) {
  // Зберігаємо поточний стан ДО перезапису — щоб undo міг відновити
  saveToHistory();

  const rows = parseCSV(text);
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const needRows = rows.length;

  ensureGridSize(Math.max(ROWS, needRows), Math.max(COL_COUNT, maxCols));

  // overwrite
  cellData = {};
  cellStyles = {};

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const id = getCellId(c, r + 1);
      const v = rows[r][c];
      if (v !== '') cellData[id] = v;
    }
  }

  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

// ---- Insert rows/cols ----
function insertRow(atRow) {
  const rowAt = clamp(atRow, 1, ROWS + 1);

  const newData = {};
  const newStyles = {};

  for (const key of Object.keys(cellData)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newR = (p.r >= rowAt) ? (p.r + 1) : p.r;
    const newKey = `${p.col}${newR}`;
    newData[newKey] = cellData[key];
  }

  for (const key of Object.keys(cellStyles)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newR = (p.r >= rowAt) ? (p.r + 1) : p.r;
    const newKey = `${p.col}${newR}`;
    newStyles[newKey] = cellStyles[key];
  }

  // Shift formula refs across entire sheet
  for (const k of Object.keys(newData)) {
    const v = newData[k];
    if (String(v || '').startsWith('=')) {
      newData[k] = shiftFormulaRefs(v, { rowAt: rowAt, rowDelta: 1 });
    }
  }

  // Update selection/active
  if (active.r >= rowAt) active.r++;
  if (selStart.r >= rowAt) selStart.r++;
  if (selEnd.r >= rowAt) selEnd.r++;

  cellData = newData;
  cellStyles = newStyles;

  setGridSize(ROWS + 1, COL_COUNT);
  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function insertColumn(atCol) {
  const colAt = clamp(atCol, 0, COL_COUNT);

  const newData = {};
  const newStyles = {};

  for (const key of Object.keys(cellData)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newC = (p.cIdx >= colAt) ? (p.cIdx + 1) : p.cIdx;
    const newKey = `${indexToCol(newC)}${p.r}`;
    newData[newKey] = cellData[key];
  }

  for (const key of Object.keys(cellStyles)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newC = (p.cIdx >= colAt) ? (p.cIdx + 1) : p.cIdx;
    const newKey = `${indexToCol(newC)}${p.r}`;
    newStyles[newKey] = cellStyles[key];
  }

  // Shift column widths
  const newWidths = {};
  for (const k of Object.keys(colWidths)) {
    const idx = parseInt(k, 10);
    if (!Number.isFinite(idx)) continue;
    const newIdx = (idx >= colAt) ? (idx + 1) : idx;
    newWidths[newIdx] = colWidths[k];
  }
  newWidths[colAt] = newWidths[colAt] || 80;
  colWidths = newWidths;

  // Shift formula refs across entire sheet
  for (const k of Object.keys(newData)) {
    const v = newData[k];
    if (String(v || '').startsWith('=')) {
      newData[k] = shiftFormulaRefs(v, { colAt: colAt, colDelta: 1 });
    }
  }

  // Update selection/active
  if (active.c >= colAt) active.c++;
  if (selStart.c >= colAt) selStart.c++;
  if (selEnd.c >= colAt) selEnd.c++;

  cellData = newData;
  cellStyles = newStyles;

  setGridSize(ROWS, COL_COUNT + 1);
  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function updateInsertHover(e) {
  if (!gridWrap || !insertColBtn || !insertRowBtn) return;
  if (isResizing || isSelecting) return hideInsertButtons();

  const wrapRect = gridWrap.getBoundingClientRect();
  const x = e.clientX - wrapRect.left;
  const y = e.clientY - wrapRect.top;

  const contentX = x + gridWrap.scrollLeft;
  const contentY = y + gridWrap.scrollTop;

  const tol = 5;

  // Column boundaries (in content coords)
  let sumX = metrics.rowHeaderW;
  const colBounds = [sumX];
  for (let c = 0; c < COL_COUNT; c++) {
    sumX += (colWidths[c] || 80);
    colBounds.push(sumX);
  }

  // Row boundaries
  let sumY = metrics.headerH;
  const rowBounds = [sumY];
  for (let r = 1; r <= ROWS; r++) {
    sumY += metrics.rowH;
    rowBounds.push(sumY);
  }

  hoverInsertColAt = null;
  hoverInsertRowAt = null;

  // Column insert: show only below header to avoid conflict with resize
  if (contentY > metrics.headerH + 8 && contentX > metrics.rowHeaderW + 6) {
    let bestIdx = null;
    let bestDist = 1e9;
    for (let i = 0; i < colBounds.length; i++) {
      const d = Math.abs(contentX - colBounds[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestIdx !== null && bestDist <= tol) {
      hoverInsertColAt = bestIdx; // 0..COL_COUNT
      const btnSize = 26;
      const left = colBounds[bestIdx] - gridWrap.scrollLeft - btnSize / 2;
      const top = clamp(y - btnSize / 2, metrics.headerH + 2, wrapRect.height - btnSize - 2);
      insertColBtn.style.left = `${left}px`;
      insertColBtn.style.top = `${top}px`;
      insertColBtn.classList.remove('hidden');
    } else {
      insertColBtn.classList.add('hidden');
    }
  } else {
    insertColBtn.classList.add('hidden');
  }

  // Row insert: show near row header area
  if (contentX < metrics.rowHeaderW + 10 && contentY > metrics.headerH + 2) {
    let bestIdx = null;
    let bestDist = 1e9;
    for (let i = 0; i < rowBounds.length; i++) {
      const d = Math.abs(contentY - rowBounds[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestIdx !== null && bestDist <= tol) {
      hoverInsertRowAt = bestIdx + 1; // boundaries start before row1 -> insert at row1
      const btnSize = 26;
      const left = clamp(metrics.rowHeaderW / 2 - btnSize / 2, 2, wrapRect.width - btnSize - 2);
      const top = rowBounds[bestIdx] - gridWrap.scrollTop - btnSize / 2;
      insertRowBtn.style.left = `${left}px`;
      insertRowBtn.style.top = `${top}px`;
      insertRowBtn.classList.remove('hidden');
    } else {
      insertRowBtn.classList.add('hidden');
    }
  } else {
    insertRowBtn.classList.add('hidden');
  }

  if (insertColBtn.classList.contains('hidden') && insertRowBtn.classList.contains('hidden')) {
    hoverInsertColAt = null;
    hoverInsertRowAt = null;
  }
}

function hideInsertButtons() {
  hoverInsertColAt = null;
  hoverInsertRowAt = null;
  if (insertColBtn) insertColBtn.classList.add('hidden');
  if (insertRowBtn) insertRowBtn.classList.add('hidden');
}

// ---- Charts ----
function makeChart() {
  recalculateAll();
  const b = getBounds();
  const labels = [];
  const data = [];

  // Determine column layout:
  // 1 col selected  → values only, labels = row numbers
  // 2 cols selected → first col = labels, second col = values
  // 3+ cols selected → all cols treated as separate datasets (use first col as labels if text)
  const colSpan = b.cMax - b.cMin;
  const isTwoCols = colSpan === 1;
  const isMultiDataset = colSpan >= 2;

  if (isMultiDataset) {
    // First column: check if it's text (labels) or numeric (data)
    const firstCellInp = cellInp[b.rMin]?.[b.cMin];
    const firstVal = parseFloat(firstCellInp?.value ?? '');
    const firstColIsLabels = isNaN(firstVal) && firstCellInp?.value.trim() !== '';

    const dataStartCol = firstColIsLabels ? b.cMin + 1 : b.cMin;
    const datasets = [];

    for (let c = dataStartCol; c <= b.cMax; c++) {
      const dsLabels = [];
      const dsData = [];
      // Use header row as dataset label if it looks like text
      const headerInp = cellInp[b.rMin]?.[c];
      const headerVal = parseFloat(headerInp?.value ?? '');
      const colLabel = (!isNaN(headerVal) || !headerInp?.value.trim())
        ? COLS[c]
        : headerInp.value.trim();

      const startRow = (!isNaN(headerVal)) ? b.rMin : b.rMin + 1;

      for (let r = startRow; r <= b.rMax; r++) {
        const inp = cellInp[r]?.[c];
        if (!inp) continue;
        const val = parseFloat(inp.value);
        if (!isNaN(val)) {
          dsData.push(val);
          let lbl = `R${r}`;
          if (firstColIsLabels) {
            const lblInp = cellInp[r]?.[b.cMin];
            if (lblInp?.value.trim()) lbl = lblInp.value.trim();
          }
          dsLabels.push(lbl);
        }
      }
      if (dsData.length > 0) datasets.push({ label: colLabel, data: dsData, labels: dsLabels });
    }

    if (datasets.length === 0) { alertModal('Виділіть клітинки з числами!'); return; }
    openModal('chartModal');
    renderChartMulti(datasets);
    return;
  }

  // 1 or 2 columns
  for (let r = b.rMin; r <= b.rMax; r++) {
    const valColIdx = isTwoCols ? b.cMax : b.cMin;
    const valInp = cellInp[r]?.[valColIdx];
    if (!valInp) continue;
    const val = parseFloat(valInp.value);

    if (!isNaN(val)) {
      data.push(val);
      let lbl = `R${r}`;
      if (isTwoCols) {
        const lblInp = cellInp[r]?.[b.cMin];
        if (lblInp?.value.trim()) lbl = lblInp.value.trim();
      }
      labels.push(lbl);
    }
  }

  if (data.length === 0) {
    alertModal('Виділіть клітинки з числами!');
    return;
  }

  openModal('chartModal');
  renderChart(labels, data);
}

function renderChart(lbls, dats) {
  if (chartObj) chartObj.destroy();
  const canvas = document.getElementById('theChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const isPie = chartType === 'pie';

  chartObj = new Chart(ctx, {
    type: chartType,
    data: {
      labels: lbls,
      datasets: [{
        label: 'Значення',
        data: dats,
        backgroundColor: isPie
          ? ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6']
          : '#3b82f6',
        borderColor: chartType === 'line' ? '#3b82f6' : undefined,
        borderWidth: 1,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: isPie ? {} : { y: { beginAtZero: true } }
    }
  });
}

function renderChartMulti(datasets) {
  if (chartObj) chartObj.destroy();
  const canvas = document.getElementById('theChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6'];
  const isPie = chartType === 'pie';

  // Use labels from first dataset; merge all labels
  const allLabels = datasets.reduce((acc, ds) => {
    ds.labels.forEach(l => { if (!acc.includes(l)) acc.push(l); });
    return acc;
  }, []);

  const chartDatasets = datasets.map((ds, i) => ({
    label: ds.label,
    data: ds.data,
    backgroundColor: isPie ? palette : palette[i % palette.length],
    borderColor: chartType === 'line' ? palette[i % palette.length] : undefined,
    borderWidth: 1,
    tension: 0.4
  }));

  chartObj = new Chart(ctx, {
    type: chartType,
    data: {
      labels: allLabels,
      datasets: chartDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: isPie ? {} : { y: { beginAtZero: true } }
    }
  });
}

function setChartType(t) {
  chartType = t;
  if (chartObj) {
    if (chartObj.data.datasets.length > 1) {
      renderChartMulti(chartObj.data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        labels: chartObj.data.labels
      })));
    } else {
      renderChart(chartObj.data.labels, chartObj.data.datasets[0].data);
    }
  }
}

// ---- Data utilities ----
function loadExample() {
  cellData = {
    'A1': 'Товар', 'B1': 'Ціна', 'C1': 'Кількість', 'D1': 'Разом',
    'A2': 'Ручка', 'B2': '15', 'C2': '2', 'D2': '=B2*C2',
    'A3': 'Зошит', 'B3': '10', 'C3': '5', 'D3': '=B3*C3',
    'A4': 'Гумка', 'B4': '5', 'C4': '1', 'D4': '=B4*C4',
    'A5': 'Олівець', 'B5': '8', 'C5': '3', 'D5': '=B5*C5',
    'C6': 'СУМА:', 'D6': '=SUM(D2:D5)',
    'C7': 'СЕРЕДНЄ:', 'D7': '=AVG(D2:D5)'
  };

  cellStyles = {};
  ensureGridSize(60, 30);
  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
  alertModal('Приклад завантажено! Спробуйте змінити кількість або додати нові товари.');
}

function clearAll() {
  cellData = {};
  cellStyles = {};
  colWidths = {};
  persistStateToStorage();
  rebuildGrid();
  recalculateAll();
  setSaveBadge();
  saveToHistory();
}

// ---- Modals ----
function alertModal(txt) {
  const msgEl = document.getElementById('msgText');
  if (msgEl) msgEl.innerText = txt;
  openModal('msgModal');
}

function askConfirm(txt, cb) {
  const el = document.getElementById('confirmText');
  if (el) el.innerText = txt;
  confirmFn = cb;
  openModal('confirmModal');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ---- Themes ----
const themes = {
  blue:  { headerCls: 'bg-blue-600',  th: '#e2e8f0', text: '#334155' },
  green: { headerCls: 'bg-green-600', th: '#dcfce7', text: '#14532d' },
  pink:  { headerCls: 'bg-pink-500',  th: '#fce7f3', text: '#831843' }
};
let currentTheme = 'blue';

function changeTheme(name) {
  const t = themes[name];
  if (!t) return;

  const h = document.getElementById('header');
  if (h) {
    // Видаляємо клас поточної теми і ставимо новий
    const prev = themes[currentTheme]?.headerCls;
    if (prev) h.classList.remove(prev);
    h.classList.add(t.headerCls);
  }
  currentTheme = name;
  document.documentElement.style.setProperty('--th-bg', t.th);
  document.documentElement.style.setProperty('--th-text', t.text);
}

// ---- Init ----
function init() {
  // Стан завантажується в logic.js при старті з localStorage (зберігається між сесіями)

  // bigger default grid (але без втрати даних)
  if (ROWS < 60 || COL_COUNT < 30) {
    setGridSize(Math.max(ROWS, 60), Math.max(COL_COUNT, 30));
  }


  gridWrap = document.getElementById('gridWrap');
  insertColBtn = document.getElementById('insertColBtn');
  insertRowBtn = document.getElementById('insertRowBtn');

  rebuildGrid();
  recalculateAll();
  persistStateToStorage();

  // formula bar
  const fb = document.getElementById('formulaBar');
  if (fb) {
    fb.addEventListener('input', (e) => {
      const v = String(e.target.value || '');
      if (v.length > 200) e.target.value = v.substring(0, 200);
      cellData[activeId] = e.target.value;
      // mirror to cell if currently editing
      const inp = cellInp[active.r]?.[active.c];
      if (inp && document.activeElement === inp) inp.value = e.target.value;
    });

    fb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        recalculateAll();
        persistStateToStorage();
        setSaveBadge();
        saveToHistory();
        const inp = cellInp[active.r]?.[active.c];
        if (inp) inp.focus();
      }
    });
  }

  // global mouse
  document.addEventListener('mouseup', () => {
    isSelecting = false;
    if (isResizing) {
      isResizing = false;
      resizeCol = null;
      saveToHistory();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing && resizeCol !== null) resizeColumn(e);
  });

  // insert hover
  if (gridWrap) {
    gridWrap.addEventListener('mousemove', updateInsertHover);
    gridWrap.addEventListener('mouseleave', hideInsertButtons);
    gridWrap.addEventListener('scroll', hideInsertButtons);
  }

  if (insertColBtn) {
    insertColBtn.addEventListener('mousedown', (e) => e.preventDefault());
    insertColBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (hoverInsertColAt === null) return;
      insertColumn(hoverInsertColAt);
      hideInsertButtons();
    });
  }

  if (insertRowBtn) {
    insertRowBtn.addEventListener('mousedown', (e) => e.preventDefault());
    insertRowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (hoverInsertRowAt === null) return;
      insertRow(hoverInsertRowAt);
      hideInsertButtons();
    });
  }

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Undo/redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return; // allow normal copy in input fields
        }
        e.preventDefault();
        copySelectionToClipboard();
        return;
      }
      // Ctrl+V — вставити в активну клітинку якщо жодна не у фокусі
      if (e.key.toLowerCase() === 'v') {
        const activeEl = document.activeElement;
        if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          navigator.clipboard?.readText().then(text => {
            if (text) pasteToGrid(text, active.c, active.r);
          }).catch(() => {}); // тихо ігноруємо якщо немає дозволу
        }
        return;
      }
    }

    // Delete (avoid when formula bar active)
    if (e.key === 'Delete') {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.id === 'formulaBar') return;
      e.preventDefault();
      deleteSelection();
    }
  });

  // CSV import
  const csvInput = document.getElementById('csvFileInput');
  if (csvInput) {
    csvInput.addEventListener('change', () => {
      const file = csvInput.files?.[0];
      if (!file) return;

      // Обмеження розміру файлу: 2 МБ
      if (file.size > 2 * 1024 * 1024) {
        alertModal('❌ Файл CSV завеликий (максимум 2 МБ). Будь ласка, оберіть менший файл.');
        csvInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const rows = parseCSV(text);

        // Обмеження рядків/колонок
        if (rows.length > 500) {
          alertModal(`❌ Файл CSV має ${rows.length} рядків — це забагато (максимум 500).`);
          csvInput.value = '';
          return;
        }
        const cCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
        if (cCount > 200) {
          alertModal(`❌ Файл CSV має ${cCount} колонок — це забагато (максимум 200).`);
          csvInput.value = '';
          return;
        }

        askConfirm(`Імпортувати CSV і перезаписати таблицю?\nРозмір: ${rows.length}×${cCount}`, () => {
          importCSVText(text);
        });
      };
      reader.readAsText(file);
    });
  }

  // Confirm modal YES
  const yesBtn = document.getElementById('confirmBtnYes');
  if (yesBtn) {
    yesBtn.onclick = () => {
      if (typeof confirmFn === 'function') confirmFn();
      closeModal('confirmModal');
    };
  }

  // Initial selection
  ensureCellWithinBounds();
  setActive(active.c, active.r, activeId);

  // Initial history
  saveToHistory();

  // ---- Storage overflow/warning events ----
  window.addEventListener('storage-overflow', (e) => {
    const mb = (e.detail.bytes / 1024 / 1024).toFixed(1);
    alertModal(`⚠️ Таблиця завелика (${mb} МБ) — автозбереження заблоковано!
Збережи дані вручну через кнопку "Зберегти CSV".`);
  });

  window.addEventListener('storage-warning', (e) => {
    const mb = (e.detail.bytes / 1024 / 1024).toFixed(1);
    const badge = document.getElementById('saveBadge');
    if (badge) {
      badge.textContent = `⚠️ Багато даних (${mb} МБ)`;
      badge.style.color = '#f59e0b';
      badge.style.opacity = 1;
      setTimeout(() => {
        badge.style.opacity = 0;
        badge.textContent = 'Збережено';
        badge.style.color = '';
      }, 3000);
    }
  });

  // ---- Touch support (планшети / телефони) ----
  initTouchSupport();
}

function initTouchSupport() {
  const tableEl = document.getElementById('grid');
  if (!tableEl) return;

  let touchStartC = null;
  let touchStartR = null;
  let lastTouchC   = null;
  let lastTouchR   = null;
  let isDragging   = false;
  let tapTimer     = null;
  let lastTapId    = null;
  const DRAG_THRESHOLD_PX = 10;
  let touchStartX  = 0;
  let touchStartY  = 0;

  // Визначаємо TD під пальцем за координатами
  function tdFromPoint(x, y) {
    // Ховаємо верхній шар, щоб elementFromPoint знайшов TD під ним
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return el.closest('td[data-id]');
  }

  tableEl.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isDragging  = false;

    const td = tdFromPoint(touch.clientX, touch.clientY);
    if (!td) return;

    touchStartC = parseInt(td.dataset.c, 10);
    touchStartR = parseInt(td.dataset.r, 10);
    lastTouchC  = touchStartC;
    lastTouchR  = touchStartR;

    // Починаємо виділення одразу
    selStart = { c: touchStartC, r: touchStartR };
    selEnd   = { c: touchStartC, r: touchStartR };
    setActive(touchStartC, touchStartR, td.dataset.id, { keepSelection: true });
    renderSel();
  }, { passive: true });

  tableEl.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (!isDragging && (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)) {
      isDragging = true;
    }

    if (!isDragging) return;

    const td = tdFromPoint(touch.clientX, touch.clientY);
    if (!td) return;

    const c = parseInt(td.dataset.c, 10);
    const r = parseInt(td.dataset.r, 10);

    // Оновлюємо виділення тільки якщо клітинка змінилась
    if (c === lastTouchC && r === lastTouchR) return;
    lastTouchC = c;
    lastTouchR = r;

    // Розтягуємо виділення від startCell до поточної
    selStart = { c: touchStartC, r: touchStartR };
    selEnd   = { c, r };
    renderSel();

    // Не дозволяємо скролити сторінку під час виділення
    e.preventDefault();
  }, { passive: false });

  tableEl.addEventListener('touchend', (e) => {
    if (isDragging) {
      // Завершили drag-виділення
      isDragging = false;
      return;
    }

    // Простий tap — фокус на клітинку + відкрити клавіатуру
    const touch = e.changedTouches[0];
    const td = tdFromPoint(touch.clientX, touch.clientY);
    if (!td) return;

    const c   = parseInt(td.dataset.c, 10);
    const r   = parseInt(td.dataset.r, 10);
    const id  = td.dataset.id;

    // Подвійний tap — редагування (якщо та сама клітинка)
    if (lastTapId === id) {
      clearTimeout(tapTimer);
      lastTapId = null;
      const inp = cellInp[r]?.[c];
      if (inp) {
        e.preventDefault();
        inp.focus();
        // Показуємо сиру формулу в режимі редагування
        const raw = cellData[id];
        if (raw !== undefined) inp.value = raw;
      }
      return;
    }

    lastTapId = id;
    tapTimer = setTimeout(() => { lastTapId = null; }, 400);

    selStart = { c, r };
    selEnd   = { c, r };
    setActive(c, r, id);
    renderSel();

    // На мобільному одним tapом відкриваємо клавіатуру
    const inp = cellInp[r]?.[c];
    if (inp) {
      e.preventDefault();
      inp.focus();
    }
  }, { passive: false });

  // Pinch-zoom — блокуємо тільки на таблиці
  tableEl.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
}

// ---- Start ----
init();