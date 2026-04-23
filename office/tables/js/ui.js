// ---- Modals ----
function showInfoModal(titleOrText, maybeText) {
  const titleEl = document.getElementById('msgTitle');
  const msgEl = document.getElementById('msgText');
  if (typeof maybeText === 'string') {
    if (titleEl) titleEl.innerText = titleOrText;
    if (msgEl) msgEl.innerText = maybeText;
  } else {
    if (titleEl) titleEl.innerText = 'Інформація';
    if (msgEl) msgEl.innerText = titleOrText;
  }
  openModal('msgModal');
}

function askConfirm(txt, cb, confirmText = 'Продовжити') {
  const el = document.getElementById('confirmText');
  const yesBtn = document.getElementById('confirmBtnYes');
  if (el) el.innerText = txt;
  if (yesBtn) yesBtn.innerText = confirmText;
  confirmFn = cb;
  openModal('confirmModal');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.OfficeUI?.openModal?.(el)) return;
  el.classList.remove('hidden');
  el.classList.add('active');
  el.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.OfficeUI?.closeModal?.(el)) return;
  el.classList.remove('active');
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'true');
}

function openHeaderContextMenu(type, index, clientX, clientY) {
  closeHeaderContextMenu();
  const menu = document.getElementById(type === 'row' ? 'rowHeaderMenu' : 'colHeaderMenu');
  if (!menu) return;
  headerMenuState = { type, index };
  menu.classList.remove('hidden');
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(clientX, window.innerWidth - rect.width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(clientY, window.innerHeight - rect.height - 8))}px`;
}

function closeHeaderContextMenu() {
  headerMenuState = null;
  document.querySelectorAll('.header-context-menu').forEach(menu => menu.classList.add('hidden'));
}

// ---- Themes ----
const themes = {
  blue: { headerCls: 'bg-blue-600', th: '#e2e8f0', text: '#334155' },
  green: { headerCls: 'bg-green-600', th: '#dcfce7', text: '#14532d' },
  pink: { headerCls: 'bg-pink-500', th: '#fce7f3', text: '#831843' }
};
let currentTheme = 'blue';


function normalizeFileName(value) {
  return String(value || DEFAULT_WORKBOOK_NAME).trim().replace(/[\/:*?"<>|]+/g, '_').slice(0, 80) || DEFAULT_WORKBOOK_NAME;
}

function updateFileNameUi() {
  const el = document.getElementById('fileName');
  if (el) el.textContent = workbookName;
}

function persistUiState() {
  safeSetItem(WORKBOOK_STORAGE_KEY, workbookName);
  safeSetItem(UI_STORAGE_KEY, JSON.stringify({ zoom: currentZoom }));
}

function restoreUiState() {
  const storedName = safeGetItem(WORKBOOK_STORAGE_KEY);
  if (storedName) workbookName = normalizeFileName(storedName);
  updateFileNameUi();

  const ui = safeParseJSON(safeGetItem(UI_STORAGE_KEY), {});
  if (ui && ui.zoom) setZoom(Number(ui.zoom));
  else setZoom(100);
}

function initFileNameUi() {
  const el = document.getElementById('fileName');
  if (!el) return;
  el.addEventListener('click', editWorkbookName);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      editWorkbookName();
    }
  });
}

function editWorkbookName() {
  const next = window.prompt('Назва файлу:', workbookName);
  if (next === null) return;
  workbookName = normalizeFileName(next);
  updateFileNameUi();
  persistUiState();
  setDirty(true, 'Назву змінено');
}

function initMenusAndToolbar() {
  if (!menusInitialized) {
    document.querySelectorAll('.menu-title').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuName = btn.dataset.menu;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        closeAllMenus();
        if (!expanded) openMenu(menuName);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-item-wrap')) closeAllMenus();
      if (!e.target.closest('.palette-wrap')) closeAllPalettes();
      if (!e.target.closest('.header-context-menu')) closeHeaderContextMenu();
    });

    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.header-context-menu')) closeHeaderContextMenu();
    }, true);

    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.header-context-menu')) closeHeaderContextMenu();
    }, true);

    window.addEventListener('resize', closeHeaderContextMenu);
    document.addEventListener('scroll', closeHeaderContextMenu, true);

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        if (!action) return;
        if (!btn.closest('.statusbar')) closeAllMenus();
        dispatchUiAction(action);
      });
    });

    document.querySelectorAll('.palette-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePalette(btn.dataset.palette);
      });
    });

    buildPalettes();
    document.getElementById('textNoColor')?.addEventListener('click', clearTextColorStyles);
    document.getElementById('fillNoColor')?.addEventListener('click', clearFillStyles);
    document.getElementById('numberFormatSelect')?.addEventListener('change', (e) => applyNumberFormat(String(e.target.value || '')));
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll('[data-chart-type]').forEach(btn => {
      btn.addEventListener('click', () => setChartType(btn.dataset.chartType));
    });

    menusInitialized = true;
  }
  updateToolbarState();
}

function openMenu(name) {
  document.querySelector(`.menu-dropdown[data-menu="${name}"]`)?.classList.add('open');
  document.querySelector(`.menu-title[data-menu="${name}"]`)?.setAttribute('aria-expanded', 'true');
}

function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.menu-title').forEach(el => el.setAttribute('aria-expanded', 'false'));
}

function togglePalette(name) {
  document.querySelectorAll('.palette-popover').forEach(pop => {
    const isTarget = pop.id === `${name}Palette`;
    if (isTarget) pop.toggleAttribute('hidden', !pop.hasAttribute('hidden') ? true : false);
    else pop.setAttribute('hidden', '');
  });
  document.querySelectorAll('.palette-toggle').forEach(btn => {
    const expanded = btn.dataset.palette === name && !document.getElementById(`${name}Palette`)?.hasAttribute('hidden');
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
}

function closeAllPalettes() {
  document.querySelectorAll('.palette-popover').forEach(pop => pop.setAttribute('hidden', ''));
  document.querySelectorAll('.palette-toggle').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
}

function buildPalettes() {
  mountPalette('textSwatches', [
    ['style-text-slate', '#334155'], ['style-text-red', '#dc2626'], ['style-text-orange', '#ea580c'], ['style-text-amber', '#d97706'],
    ['style-text-green', '#16a34a'], ['style-text-teal', '#0f766e'], ['style-text-blue', '#2563eb'], ['style-text-indigo', '#4f46e5'],
    ['style-text-purple', '#7c3aed'], ['style-text-pink', '#db2777'], ['style-text-brown', '#92400e']
  ], applyTextColorClass);

  mountPalette('fillSwatches', [
    ['style-bg-yellow', '#fef9c3'], ['style-bg-green', '#dcfce7'], ['style-bg-red', '#fee2e2'], ['style-bg-blue', '#dbeafe'],
    ['style-bg-indigo', '#e0e7ff'], ['style-bg-purple', '#ede9fe'], ['style-bg-pink', '#fce7f3'], ['style-bg-orange', '#ffedd5'],
    ['style-bg-gray', '#f1f5f9'], ['style-bg-teal', '#ccfbf1']
  ], applyFillColorClass);
}

function mountPalette(id, items, handler) {
  const host = document.getElementById(id);
  if (!host) return;
  host.innerHTML = '';
  items.forEach(([cls, color]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-swatch';
    btn.style.setProperty('--swatch', color);
    btn.setAttribute('aria-label', color);
    btn.addEventListener('click', () => handler(cls));
    host.appendChild(btn);
  });
}

function replaceStyleGroup(classes, nextClass = '') {
  applyStyleToSelection(td => {
    classes.forEach(cls => td.classList.remove(cls));
    if (nextClass) td.classList.add(nextClass);
  });
  closeAllPalettes();
  updateToolbarState();
}

function applyTextColorClass(cls) { replaceStyleGroup(TEXT_COLOR_CLASSES.concat(['style-text-default']), cls); }
function clearTextColorStyles() { replaceStyleGroup(TEXT_COLOR_CLASSES.concat(['style-text-default']), ''); }
function applyFillColorClass(cls) { replaceStyleGroup(FILL_COLOR_CLASSES, cls); }
function clearFillStyles() { replaceStyleGroup(FILL_COLOR_CLASSES, ''); }
function applyAlignmentClass(cls) { replaceStyleGroup(ALIGN_CLASSES, cls); }
function applyNumberFormat(cls) { replaceStyleGroup(NUMBER_FORMAT_CLASSES, cls); recalculateAll(); }

function applyToggleClass(cls) {
  applyStyleToSelection(td => td.classList.toggle(cls));
  updateToolbarState();
}

function formatDisplayValue(value, td) {
  const raw = String(value ?? '');
  if (raw.trim() === '') return '';

  const classes = td?.classList;
  const normalized = raw.replace(',', '.');
  const num = Number(normalized);
  const isNumeric = Number.isFinite(num) && normalized !== '';
  if (!isNumeric) return raw;

  if (classes?.contains('style-num-int')) return String(Math.round(num));
  if (classes?.contains('style-num-fixed2')) return num.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (classes?.contains('style-num-percent')) return `${(num * 100).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  if (classes?.contains('style-num-currency-uah')) return num.toLocaleString('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 2 });
  return raw;
}

function getSelectionStats() {
  const b = getBounds();
  let count = 0;
  let countNumbers = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let r = b.rMin; r <= b.rMax; r++) {
    for (let c = b.cMin; c <= b.cMax; c++) {
      const id = getCellId(c, r);
      const raw = cellData[id] ?? '';
      if (String(raw).trim() !== '') count++;

      let num = NaN;
      if (String(raw).startsWith('=')) {
        try {
          num = Number(evaluateFormula(String(raw).substring(1)));
        } catch (_) {
          num = NaN;
        }
      } else {
        num = Number(String(raw).replace(',', '.'));
      }

      if (Number.isFinite(num)) {
        countNumbers++;
        sum += num;
        min = Math.min(min, num);
        max = Math.max(max, num);
      }
    }
  }

  return {
    count,
    countNumbers,
    sum,
    avg: countNumbers ? sum / countNumbers : 0,
    min: countNumbers ? min : 0,
    max: countNumbers ? max : 0
  };
}

function updateSelectionStats() {
  const b = getBounds();
  const selectionInfo = document.getElementById('selectionInfo');
  const statsInfo = document.getElementById('statsInfo');
  if (selectionInfo) {
    const from = `${COLS[b.cMin]}${b.rMin}`;
    const to = `${COLS[b.cMax]}${b.rMax}`;
    selectionInfo.textContent = from === to ? `Виділення: ${from}` : `Виділення: ${from}:${to}`;
  }
  if (statsInfo) {
    const s = getSelectionStats();
    statsInfo.textContent = `Кількість: ${s.count} · Чисел: ${s.countNumbers} · Сума: ${Number(s.sum.toFixed(2)).toLocaleString('uk-UA')} · Середнє: ${Number(s.avg.toFixed(2)).toLocaleString('uk-UA')}`;
  }
}

function updateToolbarState() {
  const td = cellTd[active.r]?.[active.c];
  if (!td) return;
  const setPressed = (action, pressed) => {
    const selector = `[data-action="${action}"]`;
    if (window.OfficeUI?.setPressed) {
      window.OfficeUI.setPressed(selector, pressed);
      return;
    }
    document.querySelectorAll(selector).forEach(btn => {
      btn.classList.toggle('active', pressed);
      btn.setAttribute('aria-pressed', String(pressed));
    });
  };
  setPressed('style-bold', td.classList.contains('style-text-bold'));
  setPressed('style-italic', td.classList.contains('style-text-italic'));
  setPressed('style-underline', td.classList.contains('style-text-underline'));
  setPressed('style-strike', td.classList.contains('style-text-strike'));
  setPressed('align-left', td.classList.contains('style-align-left'));
  setPressed('align-center', !td.classList.contains('style-align-left') && !td.classList.contains('style-align-right') || td.classList.contains('style-align-center'));
  setPressed('align-right', td.classList.contains('style-align-right'));
  const fmt = document.getElementById('numberFormatSelect');
  if (fmt) {
    const found = NUMBER_FORMAT_CLASSES.find(cls => td.classList.contains(cls)) || '';
    fmt.value = found;
  }
  updateUndoRedoButtons();
}

function compareSortValues(a, b, desc = false) {
  const na = Number(String(a).replace(',', '.'));
  const nb = Number(String(b).replace(',', '.'));
  let result;
  if (Number.isFinite(na) && Number.isFinite(nb)) result = na - nb;
  else result = String(a).localeCompare(String(b), 'uk', { numeric: true, sensitivity: 'base' });
  return desc ? -result : result;
}

function sortSelection(desc = false) {
  const b = getBounds();
  if (b.rMin === b.rMax) {
    showInfoModal('Для сортування виділи кілька рядків.');
    return;
  }

  const rows = [];
  for (let r = b.rMin; r <= b.rMax; r++) {
    const rowData = [];
    const rowStyles = [];
    for (let c = b.cMin; c <= b.cMax; c++) {
      const id = getCellId(c, r);
      rowData.push(cellData[id] ?? '');
      rowStyles.push(cellStyles[id] ?? '');
    }
    const keyValue = cellInp[r]?.[b.cMin]?.value ?? rowData[0] ?? '';
    rows.push({ keyValue, rowData, rowStyles });
  }

  rows.sort((a, b2) => compareSortValues(a.keyValue, b2.keyValue, desc));

  rows.forEach((row, rowOffset) => {
    const r = b.rMin + rowOffset;
    for (let c = b.cMin; c <= b.cMax; c++) {
      const id = getCellId(c, r);
      const idx = c - b.cMin;
      const value = row.rowData[idx];
      const style = row.rowStyles[idx];
      if (value === '') delete cellData[id];
      else cellData[id] = value;
      if (style) cellStyles[id] = style;
      else delete cellStyles[id];
    }
  });

  rebuildGrid();
  recalculateAll();
  persistStateToStorage();
  setSaveBadge();
  saveToHistory();
}

function exportWorkbook() {
  const payload = {
    type: 'art-tables-workbook',
    version: 1,
    name: workbookName,
    rows: ROWS,
    cols: COL_COUNT,
    cellData,
    cellStyles,
    colWidths
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${normalizeFileName(workbookName)}.arttab`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setSaveBadge();
}

function triggerWorkbookImport() {
  const input = document.getElementById('workbookFileInput');
  if (!input) return;
  if (window.OfficeUI?.openFilePicker?.(input)) return;
  input.value = '';
  input.click();
}

function importWorkbookText(text) {
  try {
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object') throw new Error('Некоректний файл');

    saveToHistory();

    workbookName = normalizeFileName(payload.name || DEFAULT_WORKBOOK_NAME);
    updateFileNameUi();
    setGridSize(payload.rows || DEFAULT_ROWS, payload.cols || DEFAULT_COL_COUNT);
    cellData = payload.cellData && typeof payload.cellData === 'object' ? payload.cellData : {};
    cellStyles = payload.cellStyles && typeof payload.cellStyles === 'object' ? payload.cellStyles : {};
    colWidths = payload.colWidths && typeof payload.colWidths === 'object' ? payload.colWidths : {};

    rebuildGrid();
    recalculateAll();
    persistStateToStorage();
    persistUiState();
    setSaveBadge();
    saveToHistory();
  } catch (e) {
    showInfoModal(`Не вдалося відкрити файл: ${e?.message || 'помилка читання'}`);
  }
}

function dispatchUiAction(action) {
  const runOfficeCommand = command => window.OfficeUI?.runCommand?.(command);
  if (action === 'new' && runOfficeCommand('new')) return;
  switch (action) {
    case 'new': askConfirm('Створити нову таблицю? Поточні дані буде очищено.', clearAll, 'Створити'); break;
    case 'open-workbook': runOfficeCommand('open') || triggerWorkbookImport(); break;
    case 'save-workbook': runOfficeCommand('save') || exportWorkbook(); break;
    case 'import-csv': triggerCSVImport(); break;
    case 'export-csv': exportCSV(); break;
    case 'print': window.print(); break;
    case 'undo': runOfficeCommand('undo') || undo(); break;
    case 'redo': runOfficeCommand('redo') || redo(); break;
    case 'copy': copySelectionToClipboard(); break;
    case 'paste': navigator.clipboard?.readText().then(text => { if (text) pasteToGrid(text, active.c, active.r); }).catch(() => showInfoModal('Браузер не дозволив вставлення з буфера обміну.')); break;
    case 'clear-selection': deleteSelection(); break;
    case 'insert-row-above': {
      const target = headerMenuState?.type === 'row' ? headerMenuState.index : (getWholeRowSelectionRange()?.start || active.r);
      insertRow(target);
      closeHeaderContextMenu();
      break;
    }
    case 'insert-row-below': {
      const range = getWholeRowSelectionRange();
      const target = headerMenuState?.type === 'row' ? headerMenuState.index + 1 : ((range?.end || active.r) + 1);
      insertRow(target);
      closeHeaderContextMenu();
      break;
    }
    case 'delete-row': {
      const range = headerMenuState?.type === 'row' ? { start: headerMenuState.index, end: headerMenuState.index } : (getWholeRowSelectionRange() || { start: active.r, end: active.r });
      deleteRow(range.start, range.end - range.start + 1);
      closeHeaderContextMenu();
      break;
    }
    case 'insert-col-left': {
      const target = headerMenuState?.type === 'col' ? headerMenuState.index : (getWholeColSelectionRange()?.start ?? active.c);
      insertColumn(target);
      closeHeaderContextMenu();
      break;
    }
    case 'insert-col-right': {
      const range = getWholeColSelectionRange();
      const target = headerMenuState?.type === 'col' ? headerMenuState.index + 1 : ((range?.end ?? active.c) + 1);
      insertColumn(target);
      closeHeaderContextMenu();
      break;
    }
    case 'delete-col': {
      const range = headerMenuState?.type === 'col' ? { start: headerMenuState.index, end: headerMenuState.index } : (getWholeColSelectionRange() || { start: active.c, end: active.c });
      deleteColumn(range.start, range.end - range.start + 1);
      closeHeaderContextMenu();
      break;
    }
    case 'chart': makeChart(); break;
    case 'style-bold': applyToggleClass('style-text-bold'); break;
    case 'style-italic': applyToggleClass('style-text-italic'); break;
    case 'style-underline': applyToggleClass('style-text-underline'); break;
    case 'style-strike': applyToggleClass('style-text-strike'); break;
    case 'align-left': applyAlignmentClass('style-align-left'); break;
    case 'align-center': applyAlignmentClass('style-align-center'); break;
    case 'align-right': applyAlignmentClass('style-align-right'); break;
    case 'toggle-border': toggleStyle('style-border-all'); break;
    case 'clear-fill': clearFillStyles(); break;
    case 'clear-text-color': clearTextColorStyles(); break;
    case 'func-sum': applyFunc('SUM'); break;
    case 'func-avg': applyFunc('AVG'); break;
    case 'func-max': applyFunc('MAX'); break;
    case 'func-min': applyFunc('MIN'); break;
    case 'func-count': applyFunc('COUNT'); break;
    case 'sort-asc': sortSelection(false); break;
    case 'sort-desc': sortSelection(true); break;
    case 'autofit': autoFitColumns(); break;
    case 'zoom-90': setZoom(90); break;
    case 'zoom-100': setZoom(100); break;
    case 'zoom-115': setZoom(115); break;
    case 'zoom-130': setZoom(130); break;
    case 'example': askConfirm('Завантажити навчальний приклад? Поточні дані буде перезаписано.', loadExample, 'Завантажити'); break;
    case 'shortcuts': showInfoModal('Клавіатурні скорочення', `Ctrl+S — зберегти .arttab
Ctrl+O — відкрити .arttab
Ctrl+N — нова таблиця
Ctrl+P — друк
Ctrl+Z / Ctrl+Y — скасувати / повернути
Delete — очистити виділені клітинки
Enter / Tab — перехід між клітинками
F2 — редагувати формулу в клітинці`); break;
    case 'about': showInfoModal('Про ПЛЮС Таблиці', `ПЛЮС Таблиці — шкільний табличний редактор у стилі Офіс ПЛЮС.

У цій версії додано:
• уніфікований інтерфейс
• формати чисел
• сортування діапазону
• збереження у формат .arttab
• кольори тексту й заливки
• статистику виділення`); break;
  }
}

function setZoom(zoom) {
  currentZoom = [90, 100, 115, 130].includes(Number(zoom)) ? Number(zoom) : 100;
  const factor = currentZoom / 100;
  document.documentElement.style.setProperty('--cell-font', `${Math.round(16 * factor)}px`);
  document.documentElement.style.setProperty('--cell-h', `${Math.round(44 * factor)}px`);
  document.documentElement.style.setProperty('--head-h', `${Math.round(42 * factor)}px`);
  const label = document.getElementById('zoomLabel');
  if (label) label.textContent = `${currentZoom}%`;
  document.querySelectorAll('.menu-item[data-action^="zoom-"]').forEach(btn => btn.classList.remove('checked'));
  document.querySelector(`.menu-item[data-action="zoom-${currentZoom}"]`)?.classList.add('checked');
  persistUiState();
}

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
