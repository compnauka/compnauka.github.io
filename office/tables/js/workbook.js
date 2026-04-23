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
  a.download = `${normalizeFileName(workbookName)}_${stamp}.csv`;
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
  initFileNameUi();
  initMenusAndToolbar();
  restoreUiState();
  setSaveBadge();
  saveToHistory();
}

// ---- Insert rows/cols ----
function getWholeRowSelectionRange() {
  const b = getBounds();
  return (b.cMin === 0 && b.cMax === COL_COUNT - 1) ? { start: b.rMin, end: b.rMax } : null;
}

function getWholeColSelectionRange() {
  const b = getBounds();
  return (b.rMin === 1 && b.rMax === ROWS) ? { start: b.cMin, end: b.cMax } : null;
}

function finishStructureChange() {
  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  initFileNameUi();
  initMenusAndToolbar();
  restoreUiState();
  setSaveBadge();
  saveToHistory();
}

function insertRow(atRow, count = 1) {
  const rowAt = clamp(atRow, 1, ROWS + 1);
  const amount = Math.max(1, Number(count) || 1);

  const newData = {};
  const newStyles = {};

  for (const key of Object.keys(cellData)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newR = (p.r >= rowAt) ? (p.r + amount) : p.r;
    newData[`${p.col}${newR}`] = cellData[key];
  }

  for (const key of Object.keys(cellStyles)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newR = (p.r >= rowAt) ? (p.r + amount) : p.r;
    newStyles[`${p.col}${newR}`] = cellStyles[key];
  }

  for (const k of Object.keys(newData)) {
    const v = newData[k];
    if (String(v || '').startsWith('=')) newData[k] = shiftFormulaRefs(v, { rowAt, rowDelta: amount });
  }

  if (active.r >= rowAt) active.r += amount;
  if (selStart.r >= rowAt) selStart.r += amount;
  if (selEnd.r >= rowAt) selEnd.r += amount;

  cellData = newData;
  cellStyles = newStyles;
  setGridSize(ROWS + amount, COL_COUNT);
  finishStructureChange();
}

function deleteRow(atRow, count = 1) {
  if (ROWS <= 1) {
    alertModal('Не можна видалити останній рядок.');
    return;
  }

  const rowAt = clamp(atRow, 1, ROWS);
  const amount = Math.max(1, Math.min(Number(count) || 1, ROWS - rowAt + 1));
  if (amount >= ROWS) {
    alertModal('Не можна видалити всі рядки.');
    return;
  }

  const deleteFrom = rowAt;
  const deleteTo = rowAt + amount - 1;
  const newData = {};
  const newStyles = {};

  for (const key of Object.keys(cellData)) {
    const p = parseCellId(key);
    if (!p) continue;
    if (p.r >= deleteFrom && p.r <= deleteTo) continue;
    const newR = p.r > deleteTo ? (p.r - amount) : p.r;
    newData[`${p.col}${newR}`] = cellData[key];
  }

  for (const key of Object.keys(cellStyles)) {
    const p = parseCellId(key);
    if (!p) continue;
    if (p.r >= deleteFrom && p.r <= deleteTo) continue;
    const newR = p.r > deleteTo ? (p.r - amount) : p.r;
    newStyles[`${p.col}${newR}`] = cellStyles[key];
  }

  for (const k of Object.keys(newData)) {
    const v = newData[k];
    if (String(v || '').startsWith('=')) newData[k] = shiftFormulaRefs(v, { rowAt: deleteFrom, rowDelta: -amount });
  }

  active.r = clamp(active.r > deleteTo ? active.r - amount : active.r, 1, ROWS - amount);
  selStart.r = clamp(selStart.r > deleteTo ? selStart.r - amount : selStart.r, 1, ROWS - amount);
  selEnd.r = clamp(selEnd.r > deleteTo ? selEnd.r - amount : selEnd.r, 1, ROWS - amount);

  cellData = newData;
  cellStyles = newStyles;
  setGridSize(ROWS - amount, COL_COUNT);
  finishStructureChange();
}

function insertColumn(atCol, count = 1) {
  const colAt = clamp(atCol, 0, COL_COUNT);
  const amount = Math.max(1, Number(count) || 1);

  const newData = {};
  const newStyles = {};

  for (const key of Object.keys(cellData)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newC = (p.cIdx >= colAt) ? (p.cIdx + amount) : p.cIdx;
    newData[`${indexToCol(newC)}${p.r}`] = cellData[key];
  }

  for (const key of Object.keys(cellStyles)) {
    const p = parseCellId(key);
    if (!p) continue;
    const newC = (p.cIdx >= colAt) ? (p.cIdx + amount) : p.cIdx;
    newStyles[`${indexToCol(newC)}${p.r}`] = cellStyles[key];
  }

  const newWidths = {};
  for (const k of Object.keys(colWidths)) {
    const idx = parseInt(k, 10);
    if (!Number.isFinite(idx)) continue;
    const newIdx = (idx >= colAt) ? (idx + amount) : idx;
    newWidths[newIdx] = colWidths[k];
  }
  for (let i = 0; i < amount; i++) newWidths[colAt + i] = newWidths[colAt + i] || 80;
  colWidths = newWidths;

  for (const k of Object.keys(newData)) {
    const v = newData[k];
    if (String(v || '').startsWith('=')) newData[k] = shiftFormulaRefs(v, { colAt, colDelta: amount });
  }

  if (active.c >= colAt) active.c += amount;
  if (selStart.c >= colAt) selStart.c += amount;
  if (selEnd.c >= colAt) selEnd.c += amount;

  cellData = newData;
  cellStyles = newStyles;
  setGridSize(ROWS, COL_COUNT + amount);
  finishStructureChange();
}

function deleteColumn(atCol, count = 1) {
  if (COL_COUNT <= 1) {
    alertModal('Не можна видалити останню колонку.');
    return;
  }

  const colAt = clamp(atCol, 0, COL_COUNT - 1);
  const amount = Math.max(1, Math.min(Number(count) || 1, COL_COUNT - colAt));
  if (amount >= COL_COUNT) {
    alertModal('Не можна видалити всі колонки.');
    return;
  }

  const deleteFrom = colAt;
  const deleteTo = colAt + amount - 1;
  const newData = {};
  const newStyles = {};

  for (const key of Object.keys(cellData)) {
    const p = parseCellId(key);
    if (!p) continue;
    if (p.cIdx >= deleteFrom && p.cIdx <= deleteTo) continue;
    const newC = p.cIdx > deleteTo ? (p.cIdx - amount) : p.cIdx;
    newData[`${indexToCol(newC)}${p.r}`] = cellData[key];
  }

  for (const key of Object.keys(cellStyles)) {
    const p = parseCellId(key);
    if (!p) continue;
    if (p.cIdx >= deleteFrom && p.cIdx <= deleteTo) continue;
    const newC = p.cIdx > deleteTo ? (p.cIdx - amount) : p.cIdx;
    newStyles[`${indexToCol(newC)}${p.r}`] = cellStyles[key];
  }

  const newWidths = {};
  for (const k of Object.keys(colWidths)) {
    const idx = parseInt(k, 10);
    if (!Number.isFinite(idx)) continue;
    if (idx >= deleteFrom && idx <= deleteTo) continue;
    const newIdx = idx > deleteTo ? (idx - amount) : idx;
    newWidths[newIdx] = colWidths[k];
  }
  colWidths = newWidths;

  for (const k of Object.keys(newData)) {
    const v = newData[k];
    if (String(v || '').startsWith('=')) newData[k] = shiftFormulaRefs(v, { colAt: deleteFrom, colDelta: -amount });
  }

  active.c = clamp(active.c > deleteTo ? active.c - amount : active.c, 0, COL_COUNT - amount - 1);
  selStart.c = clamp(selStart.c > deleteTo ? selStart.c - amount : selStart.c, 0, COL_COUNT - amount - 1);
  selEnd.c = clamp(selEnd.c > deleteTo ? selEnd.c - amount : selEnd.c, 0, COL_COUNT - amount - 1);

  cellData = newData;
  cellStyles = newStyles;
  setGridSize(ROWS, COL_COUNT - amount);
  finishStructureChange();
}

function updateInsertHover(e) {
  if (!gridWrap || !insertColBtn || !insertRowBtn) return;
  if (isResizing || isSelecting) return hideInsertButtons();

  const wrapRect = gridWrap.getBoundingClientRect();
  const x = e.clientX - wrapRect.left;
  const y = e.clientY - wrapRect.top;
  const contentX = x + gridWrap.scrollLeft;
  const contentY = y + gridWrap.scrollTop;
  const tol = 6;
  const btnSize = 24;

  let sumX = metrics.rowHeaderW;
  const colBounds = [sumX];
  for (let c = 0; c < COL_COUNT; c++) {
    sumX += (colWidths[c] || 80);
    colBounds.push(sumX);
  }

  let sumY = metrics.headerH;
  const rowBounds = [sumY];
  for (let r = 1; r <= ROWS; r++) {
    sumY += metrics.rowH;
    rowBounds.push(sumY);
  }

  hoverInsertColAt = null;
  hoverInsertRowAt = null;

  if (contentY <= metrics.headerH + 2 && contentX > metrics.rowHeaderW + 6) {
    let bestIdx = null;
    let bestDist = 1e9;
    for (let i = 0; i < colBounds.length; i++) {
      const d = Math.abs(contentX - colBounds[i]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx !== null && bestDist <= tol) {
      hoverInsertColAt = bestIdx;
      insertColBtn.style.left = `${colBounds[bestIdx] - gridWrap.scrollLeft - btnSize / 2}px`;
      insertColBtn.style.top = `${Math.max(4, Math.round((metrics.headerH - btnSize) / 2))}px`;
      insertColBtn.classList.remove('hidden');
    } else {
      insertColBtn.classList.add('hidden');
    }
  } else {
    insertColBtn.classList.add('hidden');
  }

  if (contentX <= metrics.rowHeaderW + 8 && contentY > metrics.headerH + 2) {
    let bestIdx = null;
    let bestDist = 1e9;
    for (let i = 0; i < rowBounds.length; i++) {
      const d = Math.abs(contentY - rowBounds[i]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx !== null && bestDist <= tol) {
      hoverInsertRowAt = bestIdx + 1;
      insertRowBtn.style.left = `${Math.max(4, Math.round((metrics.rowHeaderW - btnSize) / 2))}px`;
      insertRowBtn.style.top = `${rowBounds[bestIdx] - gridWrap.scrollTop - btnSize / 2}px`;
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
  initFileNameUi();
  initMenusAndToolbar();
  restoreUiState();
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

