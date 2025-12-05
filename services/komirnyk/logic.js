'use strict';

const COLS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
const ROWS = 20;
const MAX_CALC_DEPTH = 50;

// Глобальний стан (доступний в app.js)
let cellData = {}; 
let colWidths = {};
let calcDepth = 0;
let history = [];
let historyIndex = -1;
let storageAvailable = true;

const STORAGE_KEYS = {
    data: 'kom_data',
    widths: 'kom_widths',
    styles: 'kom_styles'
};

/* --- SessionStorage Utils --- */
// Використовуємо sessionStorage замість localStorage, щоб дані очищувались при закритті вкладки
function safeSetItem(key, value) {
    if (!storageAvailable) return;
    try {
        sessionStorage.setItem(key, value);
    } catch (e) {
        storageAvailable = false;
        console.warn('SessionStorage disabled:', e);
    }
}

function safeGetItem(key) {
    if (!storageAvailable) return null;
    try {
        return sessionStorage.getItem(key);
    } catch (e) {
        storageAvailable = false;
        console.warn('SessionStorage disabled:', e);
        return null;
    }
}

function safeParseJSON(value, fallback) {
    if (typeof value !== 'string' || !value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return (parsed && typeof parsed === 'object') ? parsed : fallback;
    } catch (e) {
        console.warn('Broken JSON in storage:', e);
        return fallback;
    }
}

/* --- Formula Engine --- */
function evaluateFormula(expr) {
    calcDepth++;
    if (calcDepth > MAX_CALC_DEPTH) {
        calcDepth = 0;
        throw new Error('♻️ Циклічне посилання');
    }

    try {
        let clean = String(expr || '').toUpperCase().trim();
        if (clean.length === 0) {
            calcDepth--;
            return 0;
        }
        if (clean.length > 200) {
            throw new Error('⚠️ Формула задовга');
        }

        // Розгортання діапазонів (A1:A3 -> A1,A2,A3)
        clean = clean.replace(/([A-O])([0-9]+)\s*:\s*([A-O])([0-9]+)/g,
            (m, c1, r1, c2, r2) => expandRange(c1, parseInt(r1, 10), c2, parseInt(r2, 10)).join(','));

        // Обробка функцій
        clean = clean.replace(/(SUM|AVG|MAX|MIN)\((.*?)\)/g, (m, func, args) => {
            const vals = args
                .split(',')
                .map(resolveValue)
                .filter(v => !isNaN(v) && isFinite(v));

            if (vals.length === 0) return 0;
            if (func === 'SUM') return vals.reduce((a, b) => a + b, 0);
            if (func === 'AVG') return vals.reduce((a, b) => a + b, 0) / vals.length;
            if (func === 'MAX') return Math.max(...vals);
            if (func === 'MIN') return Math.min(...vals);
            return 0;
        });

        // Підстановка значень клітинок
        clean = clean.replace(/[A-O]([0-9]+)/g, (m) => resolveValue(m));

        if (/[^0-9+\-*/().\s]/.test(clean)) {
            throw new Error('⚠️ Помилка у формулі');
        }
        if (/\d{15,}/.test(clean)) {
            throw new Error('🔢 Число завелике');
        }
        
        const res = Function('"use strict"; return (' + clean + ')')();
        if (!isFinite(res)) {
            throw new Error('♾️ Занадто велике');
        }
        
        calcDepth--;
        return Number.isInteger(res) ? res : parseFloat(res.toFixed(2));
    } catch (e) {
        calcDepth = 0;
        throw new Error(e.message || '❌ Помилка');
    }
}

function resolveValue(ref) {
    const trimmed = String(ref).trim();
    if (trimmed === '') return 0;

    if (!isNaN(trimmed)) return parseFloat(trimmed);

    const raw = cellData[trimmed];
    if (raw === undefined || raw === null || raw === '') return 0;
    
    if (String(raw).startsWith('=')) {
        return evaluateFormula(String(raw).substring(1));
    }
    const num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
}

function expandRange(c1, r1, c2, r2) {
    const list = [];
    const ci1 = COLS.indexOf(c1);
    const ci2 = COLS.indexOf(c2);
    const cMin = Math.min(ci1, ci2);
    const cMax = Math.max(ci1, ci2);
    const rMin = Math.min(r1, r2);
    const rMax = Math.max(r1, r2);

    for (let c = cMin; c <= cMax; c++) {
        for (let r = rMin; r <= rMax; r++) {
            if (c >= 0 && c < COLS.length && r >= 1 && r <= ROWS) {
                list.push(`${COLS[c]}${r}`);
            }
        }
    }
    return list;
}
