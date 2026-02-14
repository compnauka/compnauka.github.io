'use strict';

// Стан інтерфейсу
let selStart = {c:0, r:1};
let selEnd = {c:0, r:1};
let activeId = 'A1';
let isDrag = false;
let isResizing = false;
let resizeCol = null;
let chartObj = null;
let chartType = 'bar';
let confirmFn = null;
const MAX_HISTORY = 50;

/* --- History & Styles --- */
function captureStyles() {
    const styles = {};
    document.querySelectorAll('td').forEach(td => {
        if (td.className && td.className.includes('style-')) {
            styles[td.dataset.id] = td.className;
        }
    });
    return JSON.stringify(styles);
}

function restoreStyles(stylesJson) {
    if (!stylesJson) return;
    const styles = safeParseJSON(stylesJson, {});
    document.querySelectorAll('td').forEach(td => {
        const id = td.dataset.id;
        if (styles[id]) {
            td.className = styles[id];
        } else {
            td.className = '';
        }
    });
}

function saveToHistory() {
    const state = {
        cellData: JSON.stringify(cellData),
        colWidths: JSON.stringify(colWidths),
        styles: captureStyles()
    };
    
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    
    history.push(state);
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }
    
    updateUndoRedoButtons();
}

function restoreState(state) {
    if (!state) return;
    cellData = safeParseJSON(state.cellData, {});
    colWidths = safeParseJSON(state.colWidths, {});
    applyColWidths();
    restoreStyles(state.styles);
    recalculateAll();
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

/* --- Initialization --- */
function init() {
    const hRow = document.getElementById('headRow');
    const bRows = document.getElementById('bodyRows');
    
    if (!hRow || !bRows) {
        console.error("Grid elements not found!");
        return;
    }

    COLS.forEach((c, idx) => {
        const th = document.createElement('th');
        th.classList.add('col-header');
        th.innerText = c;
        th.dataset.col = idx;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.addEventListener('mousedown', (e) => startResize(e, idx));
        th.appendChild(handle);

        th.addEventListener('mousedown', (e) => {
            const rect = th.getBoundingClientRect();
            const distanceFromRight = rect.right - e.clientX;
            if (distanceFromRight <= 10) {
                startResize(e, idx);
            }
        });
        
        hRow.appendChild(th);
        
        if (!colWidths[idx]) colWidths[idx] = 80;
    });

    for (let r = 1; r <= ROWS; r++) {
        const tr = document.createElement('tr');
        const rowTh = document.createElement('th');
        rowTh.innerText = r;
        rowTh.className = 'row-header';
        tr.appendChild(rowTh);

        COLS.forEach((c, cIdx) => {
            const td = document.createElement('td');
            const id = `${c}${r}`;
            td.dataset.id = id;
            td.dataset.c = cIdx;
            td.dataset.r = r;
            
            const inp = document.createElement('input');
            inp.id = `inp_${id}`;
            inp.className = 'cell-input';
            inp.autocomplete = 'off';
            
            td.onmousedown = (e) => { if (!isResizing) startSel(e, cIdx, r, id); };
            td.onmouseenter = () => { if (!isResizing) updateSel(cIdx, r); };
            inp.onfocus = () => { if (!isDrag && !isResizing) setActive(cIdx, r, id); };
            
            inp.oninput = (e) => { 
                if (e.target.value.length > 200) {
                    e.target.value = e.target.value.substring(0, 200);
                }
                cellData[id] = e.target.value; 
                
                if (activeId === id) {
                    const fb = document.getElementById('formulaBar');
                    if (fb) fb.value = e.target.value;
                }
            };
            
            inp.onkeydown = (e) => handleKey(e, cIdx, r);
            inp.onblur = () => recalculateAll();

            td.appendChild(inp);
            tr.appendChild(td);
        });
        bRows.appendChild(tr);
    }

    document.onmouseup = () => {
        if (isDrag || isResizing) saveToHistory();
        isDrag = false;
        isResizing = false;
        resizeCol = null;
    };
    
    document.onmousemove = (e) => {
        if (isResizing && resizeCol !== null) {
            resizeColumn(e);
        }
    };
    
    const fb = document.getElementById('formulaBar');
    if (fb) {
        fb.oninput = (e) => {
            if (e.target.value.length > 200) {
                e.target.value = e.target.value.substring(0, 200);
            }
            cellData[activeId] = e.target.value;
        };
        fb.onkeydown = (e) => {
            if (e.key === 'Enter') {
                saveToHistory();
                recalculateAll();
                const inp = document.getElementById(`inp_${activeId}`);
                if (inp) inp.focus();
            }
        };
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                e.preventDefault();
                redo();
                return;
            }
        }
        
        if (e.key === 'Delete') {
            const active = document.activeElement;
            const isFormulaBar = active && active.id === 'formulaBar';
            
            if (!isFormulaBar) {
                e.preventDefault();
                saveToHistory();
                deleteSelection();
            }
        }
    });

    loadData();
    applyColWidths();
    saveToHistory();
}

/* --- Resizing & Grid Logic --- */
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
    saveData();
}

function applyColWidths() {
    COLS.forEach((c, idx) => {
        const width = colWidths[idx] || 80;
        const th = document.querySelector(`th[data-col="${idx}"]`);
        if (th) th.style.width = width + 'px';
        
        for (let r = 1; r <= ROWS; r++) {
            const td = document.querySelector(`td[data-id="${c}${r}"]`);
            if (td) td.style.width = width + 'px';
        }
    });
}

function recalculateAll() {
    for (let r = 1; r <= ROWS; r++) {
        for (const c of COLS) {
            const id = `${c}${r}`;
            const raw = cellData[id];
            const input = document.getElementById(`inp_${id}`);
            if (!input) continue;
            
            input.parentElement.classList.remove('error-cell');

            if (!raw && raw !== 0) {
                if (document.activeElement !== input) input.value = '';
                continue;
            }

            if (String(raw).startsWith('=')) {
                try {
                    calcDepth = 0; 
                    const val = evaluateFormula(String(raw).substring(1));
                    input.value = val;
                } catch (e) {
                    input.value = e.message || '❌ Помилка';
                    input.parentElement.classList.add('error-cell');
                }
            } else {
                input.value = raw;
            }
        }
    }
    saveData();
}

function startSel(e, c, r, id) {
    if (e.button !== 0) return;
    const bar = document.getElementById('formulaBar');
    
    if (bar && document.activeElement === bar && bar.value.startsWith('=')) {
        e.preventDefault();
        e.stopPropagation();
        insertChar(id);
        return;
    }

    isDrag = true;
    selStart = { c, r };
    selEnd = { c, r };
    setActive(c, r, id);
    renderSel();
}

function updateSel(c, r) {
    if (isDrag) {
        selEnd = { c, r };
        renderSel();
    }
}

function setActive(c, r, id) {
    activeId = id;
    const ref = document.getElementById('activeCellRef');
    if (ref) ref.innerText = id;
    const fb = document.getElementById('formulaBar');
    if (fb) fb.value = cellData[id] || '';
    
    if (!isDrag) {
        selStart = selEnd = { c, r };
        renderSel();
    }
}

function renderSel() {
    const cMin = Math.min(selStart.c, selEnd.c);
    const cMax = Math.max(selStart.c, selEnd.c);
    const rMin = Math.min(selStart.r, selEnd.r);
    const rMax = Math.max(selStart.r, selEnd.r);

    document.querySelectorAll('td').forEach(td => {
        const c = parseInt(td.dataset.c, 10);
        const r = parseInt(td.dataset.r, 10);
        td.classList.remove('selected-cell', 'in-range');
        if (td.dataset.id === activeId) td.classList.add('selected-cell');
        if (c >= cMin && c <= cMax && r >= rMin && r <= rMax) td.classList.add('in-range');
    });
}

function handleKey(e, c, r) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveToHistory();
        recalculateAll();
        const nextR = Math.min(r + 1, ROWS);
        const nextId = `${COLS[c]}${nextR}`;
        const inp = document.getElementById(`inp_${nextId}`);
        if (inp) inp.focus();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        saveToHistory();
        recalculateAll();
        const nextC = e.shiftKey ? Math.max(c - 1, 0) : Math.min(c + 1, COLS.length - 1);
        const nextId = `${COLS[nextC]}${r}`;
        const inp = document.getElementById(`inp_${nextId}`);
        if (inp) inp.focus();
    }
}

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
    
    bar.focus();
    const newPos = start + String(char).length;
    bar.setSelectionRange(newPos, newPos);
}

function getBounds() {
    return {
        cMin: Math.min(selStart.c, selEnd.c),
        cMax: Math.max(selStart.c, selEnd.c),
        rMin: Math.min(selStart.r, selEnd.r),
        rMax: Math.max(selStart.r, selEnd.r)
    };
}

function deleteSelection() {
    const b = getBounds();
    for (let c = b.cMin; c <= b.cMax; c++) {
        for (let r = b.rMin; r <= b.rMax; r++) {
            const id = `${COLS[c]}${r}`;
            cellData[id] = '';
            const inp = document.getElementById(`inp_${id}`);
            if (inp) inp.value = '';
        }
    }
    const fb = document.getElementById('formulaBar');
    if (fb) fb.value = '';
    saveData();
}

function applyFunc(name) {
    saveToHistory();
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

    if (tC >= COLS.length || tR > ROWS) {
        alertModal('Немає місця для результату.');
        return;
    }

    const range = `${COLS[b.cMin]}${b.rMin}:${COLS[b.cMax]}${b.rMax}`;
    const targetId = `${COLS[tC]}${tR}`;
    
    cellData[targetId] = `=${name}(${range})`;
    recalculateAll();
    const inp = document.getElementById(`inp_${targetId}`);
    if (inp) inp.focus();
}

/* --- Styling & Features --- */
function applyStyle(fn) {
    const b = getBounds();
    for (let c = b.cMin; c <= b.cMax; c++) {
        for (let r = b.rMin; r <= b.rMax; r++) {
            const td = document.querySelector(`td[data-id="${COLS[c]}${r}"]`);
            if (td) fn(td);
        }
    }
    saveData();
}

function toggleStyle(cls) {
    saveToHistory();
    applyStyle(td => td.classList.toggle(cls));
}

function cycleColor() {
    saveToHistory();
    const colors = ['style-bg-yellow', 'style-bg-green', 'style-bg-red', ''];
    applyStyle(td => {
        let curr = -1;
        colors.forEach((c, i) => { if (c && td.classList.contains(c)) curr = i; });
        colors.forEach(c => { if (c) td.classList.remove(c); });
        const next = colors[(curr + 1) % colors.length];
        if (next) td.classList.add(next);
    });
}

function autoFitColumns() {
    const bounds = getBounds();
    const colsToFit = [];
    for (let c = bounds.cMin; c <= bounds.cMax; c++) {
        colsToFit.push(c);
    }
    if (colsToFit.length === 0) return;

    saveToHistory();

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
        if (th) {
            const text = th.innerText || '';
            maxWidth = Math.max(maxWidth, ctx.measureText(text).width);
        }

        for (let r = 1; r <= ROWS; r++) {
            const inp = document.getElementById(`inp_${COLS[cIdx]}${r}`);
            if (!inp) continue;
            const text = inp.value || '';
            if (!text) continue;
            const w = ctx.measureText(text).width;
            maxWidth = Math.max(maxWidth, w);
        }

        const padding = 32;
        const finalWidth = Math.min(Math.max(80, Math.ceil(maxWidth + padding)), 400);
        colWidths[cIdx] = finalWidth;
    });

    applyColWidths();
    saveData();
}

/* --- Charts --- */
function makeChart() {
    recalculateAll();
    const b = getBounds();
    const labels = [];
    const data = [];
    const isTwoCols = (b.cMax - b.cMin) === 1;

    for (let r = b.rMin; r <= b.rMax; r++) {
        const valId = isTwoCols ? `${COLS[b.cMax]}${r}` : `${COLS[b.cMin]}${r}`;
        const lblId = isTwoCols ? `${COLS[b.cMin]}${r}` : null;
        
        const valInp = document.getElementById(`inp_${valId}`);
        if (!valInp) continue;
        const val = parseFloat(valInp.value);
        
        if (!isNaN(val)) {
            data.push(val);
            let lbl = `R${r}`;
            if (lblId) {
                const lblInp = document.getElementById(`inp_${lblId}`);
                if (lblInp && lblInp.value.trim() !== '') {
                    lbl = lblInp.value.trim();
                }
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

function setChartType(t) {
    chartType = t;
    if (chartObj) {
        renderChart(chartObj.data.labels, chartObj.data.datasets[0].data);
    }
}

/* --- Data & Utils --- */
function saveData() {
    const styles = {};
    document.querySelectorAll('td').forEach(td => {
        if (td.className && td.className.includes('style-')) {
            styles[td.dataset.id] = td.className;
        }
    });

    safeSetItem(STORAGE_KEYS.data, JSON.stringify(cellData));
    safeSetItem(STORAGE_KEYS.widths, JSON.stringify(colWidths));
    safeSetItem(STORAGE_KEYS.styles, JSON.stringify(styles));
    
    const badge = document.getElementById('saveBadge');
    if (badge) {
        badge.style.opacity = 1;
        setTimeout(() => { badge.style.opacity = 0; }, 1000);
    }
}

function loadData() {
    const d = safeParseJSON(safeGetItem(STORAGE_KEYS.data), null);
    if (d) {
        cellData = d;
    }
    
    const w = safeParseJSON(safeGetItem(STORAGE_KEYS.widths), null);
    if (w) {
        colWidths = w;
    }
    
    const s = safeParseJSON(safeGetItem(STORAGE_KEYS.styles), null);
    if (s) {
        for (const id in s) {
            if (Object.prototype.hasOwnProperty.call(s, id)) {
                // Стилі будуть застосовані після створення сітки в init(), 
                // але нам потрібно зберегти їх, якщо ми використовуємо restoreStyles
                // Однак, loadData викликається всередині init після створення DOM,
                // тому ми можемо застосувати їх тут.
                const td = document.querySelector(`td[data-id="${id}"]`);
                if (td) td.className = s[id];
            }
        }
    }

    recalculateAll();
}

function loadExample() {
    saveToHistory();
    clearAll();
    cellData = {
        'A1': 'Товар', 'B1': 'Ціна', 'C1': 'Кількість', 'D1': 'Разом',
        'A2': 'Ручка', 'B2': '15', 'C2': '2', 'D2': '=B2*C2',
        'A3': 'Зошит', 'B3': '10', 'C3': '5', 'D3': '=B3*C3',
        'A4': 'Гумка', 'B4': '5',  'C4': '1', 'D4': '=B4*C4',
        'A5': 'Олівець', 'B5': '8',  'C5': '3', 'D5': '=B5*C5',
        'C6': 'СУМА:', 'D6': '=SUM(D2:D5)',
        'C7': 'СЕРЕДНЄ:', 'D7': '=AVG(D2:D5)'
    };
    recalculateAll();
    alertModal('Приклад завантажено! Спробуйте змінити кількість або додати нові товари.');
}

function clearAll() {
    cellData = {};
    document.querySelectorAll('input').forEach(i => {
        if (i.id !== 'formulaBar') i.value = '';
    });
    document.querySelectorAll('td').forEach(t => { t.className = ''; });
    saveData();
}

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

document.getElementById('confirmBtnYes').onclick = () => {
    if (typeof confirmFn === 'function') {
        confirmFn();
    }
    closeModal('confirmModal');
};

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

const themes = {
    blue: { header: 'bg-blue-600', th: '#e2e8f0', text: '#334155' },
    green: { header: 'bg-green-600', th: '#dcfce7', text: '#14532d' },
    pink: { header: 'bg-pink-500', th: '#fce7f3', text: '#831843' }
};

function changeTheme(name) {
    const t = themes[name];
    if (!t) return;

    const h = document.getElementById('header');
    if (h) {
        h.className = h.className.replace(/bg-\w+-\d+/, t.header);
    }
    document.documentElement.style.setProperty('--th-bg', t.th);
    document.documentElement.style.setProperty('--th-text', t.text);
}

// Старт
init();
setActive(0, 1, 'A1');
