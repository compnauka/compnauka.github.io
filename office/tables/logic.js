'use strict';

/*
  Комірник — логіка: розміри сітки, зберігання, формули, утиліти.
  Файл навмисно не торкається DOM (окрім localStorage).
*/

// ---- Config ----
const DEFAULT_ROWS = 60;
const DEFAULT_COL_COUNT = 30; // A..AD
const MAX_CALC_DEPTH = 60;
const MAX_CELL_LEN = 200;

// ---- Global state (used from app.js) ----
let ROWS = DEFAULT_ROWS;
let COL_COUNT = DEFAULT_COL_COUNT;
let COLS = buildCols(COL_COUNT);

let cellData = {};     // {"A1":"123", "B2":"=A1+1", ...}
let colWidths = {};    // {0:80, 1:120, ...}
let cellStyles = {};   // {"A1":"style-bg-yellow style-border-all", ...}

let calcDepth = 0;
let history = [];
let historyIndex = -1;

let storageAvailable = true;

const STORAGE_KEYS = {
  meta: 'kom_meta',
  data: 'kom_data',
  widths: 'kom_widths',
  styles: 'kom_styles'
};

// ---- SessionStorage utils ----
function safeSetItem(key, value) {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    storageAvailable = false;
    console.warn('SessionStorage disabled:', e);
  }
}

function safeGetItem(key) {
  if (!storageAvailable) return null;
  try {
    return localStorage.getItem(key);
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

// ---- Columns: A..Z, AA.. ----
function indexToCol(idx) {
  // 0 -> A, 25 -> Z, 26 -> AA
  let n = Number(idx);
  if (!Number.isFinite(n) || n < 0) return 'A';
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function colToIndex(label) {
  const str = String(label || '').toUpperCase().trim();
  if (!/^[A-Z]+$/.test(str)) return -1;
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    n = n * 26 + (str.charCodeAt(i) - 64);
  }
  return n - 1; // 1-based -> 0-based
}

function buildCols(count) {
  const n = Math.max(1, Math.min(200, Number(count) || 1));
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(indexToCol(i));
  return arr;
}

function setGridSize(rows, colCount) {
  ROWS = Math.max(1, Math.min(500, Number(rows) || 1));
  COL_COUNT = Math.max(1, Math.min(200, Number(colCount) || 1));
  COLS = buildCols(COL_COUNT);
}

// ---- Storage load/save (DOM-free) ----
function loadStateFromStorage() {
  const meta = safeParseJSON(safeGetItem(STORAGE_KEYS.meta), null);
  if (meta && (meta.rows || meta.cols)) {
    setGridSize(meta.rows ?? ROWS, meta.cols ?? COL_COUNT);
  }

  const d = safeParseJSON(safeGetItem(STORAGE_KEYS.data), null);
  if (d) cellData = d;

  const w = safeParseJSON(safeGetItem(STORAGE_KEYS.widths), null);
  if (w) colWidths = w;

  const s = safeParseJSON(safeGetItem(STORAGE_KEYS.styles), null);
  if (s) cellStyles = s;
}

const STORAGE_WARN_BYTES = 3 * 1024 * 1024;  // 3 МБ — попередження
const STORAGE_MAX_BYTES  = 4.5 * 1024 * 1024; // 4.5 МБ — блокуємо запис

function estimateStorageSize(obj) {
  return JSON.stringify(obj).length * 2; // UTF-16: ~2 байти на символ
}

function persistStateToStorage() {
  const payload = {
    meta:   { rows: ROWS, cols: COL_COUNT },
    data:   cellData,
    widths: colWidths,
    styles: cellStyles
  };
  const totalBytes = estimateStorageSize(payload);

  if (totalBytes > STORAGE_MAX_BYTES) {
    window.dispatchEvent(new CustomEvent('storage-overflow', { detail: { bytes: totalBytes } }));
    return;
  }

  safeSetItem(STORAGE_KEYS.meta,   JSON.stringify(payload.meta));
  safeSetItem(STORAGE_KEYS.data,   JSON.stringify(payload.data));
  safeSetItem(STORAGE_KEYS.widths, JSON.stringify(payload.widths));
  safeSetItem(STORAGE_KEYS.styles, JSON.stringify(payload.styles));

  if (totalBytes > STORAGE_WARN_BYTES) {
    window.dispatchEvent(new CustomEvent('storage-warning', { detail: { bytes: totalBytes } }));
  }
}

// ---- Formula engine ----
// Безпечний рекурсивний парсер виразів (без Function/eval)
function safeMathEval(expr) {
  const src = String(expr || '').trim();
  let pos = 0;

  function peek() { return src[pos] || ''; }
  function eat(ch) {
    if (src[pos] === ch) { pos++; return true; }
    return false;
  }
  function skipSpaces() { while (src[pos] === ' ') pos++; }

  function parseExpr() {
    return parseAddSub();
  }

  function parseAddSub() {
    let left = parseMulDiv();
    skipSpaces();
    while (peek() === '+' || peek() === '-') {
      const op = src[pos++];
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
      skipSpaces();
    }
    return left;
  }

  function parseMulDiv() {
    let left = parseUnary();
    skipSpaces();
    while (peek() === '*' || peek() === '/') {
      const op = src[pos++];
      const right = parseUnary();
      if (op === '/' && right === 0) throw new Error('➗ Ділення на нуль! Перевір знаменник формули');
      left = op === '*' ? left * right : left / right;
      skipSpaces();
    }
    return left;
  }

  function parseUnary() {
    skipSpaces();
    if (peek() === '-') { pos++; return -parseUnary(); }
    if (peek() === '+') { pos++; return parseUnary(); }
    return parsePrimary();
  }

  function parsePrimary() {
    skipSpaces();
    if (peek() === '(') {
      pos++;
      const val = parseExpr();
      skipSpaces();
      if (!eat(')')) throw new Error('⚠️ Відсутня закрита дужка');
      return val;
    }
    // Number literal
    let numStr = '';
    while (/[\d.]/.test(peek())) numStr += src[pos++];
    if (numStr !== '') {
      const n = parseFloat(numStr);
      if (!isFinite(n)) throw new Error('🔢 Некоректне число');
      return n;
    }
    throw new Error('⚠️ Невідомий символ у формулі: ' + (peek() || 'кінець рядка') + '. Перевір: назви клітинок пишуться як A1, B2');
  }

  const result = parseExpr();
  skipSpaces();
  if (pos < src.length) throw new Error('⚠️ Зайві символи у формулі');
  return result;
}

function splitFormulaArgs(argsStr) {
  const src = String(argsStr || '');
  const parts = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);

    if ((ch === ',' || ch === ';') && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }

  if (current.trim() || src.includes(',') || src.includes(';')) parts.push(current.trim());
  return parts.filter((part, idx, arr) => part !== '' || (arr.length === 1 && idx === 0));
}

function isCellReference(value) {
  return /^[A-Z]+\d+$/.test(String(value || '').trim().toUpperCase());
}

function resolveRawCellValue(ref) {
  const key = String(ref || '').trim().toUpperCase();
  return cellData[key];
}

function countNonEmptyArgs(args) {
  return args.filter(arg => {
    if (isCellReference(arg)) {
      const raw = resolveRawCellValue(arg);
      return raw !== undefined && raw !== null && String(raw).trim() !== '';
    }
    return String(arg || '').trim() !== '';
  }).length;
}

function evaluateFormula(expr) {
  calcDepth++;
  if (calcDepth > MAX_CALC_DEPTH) {
    calcDepth = 0;
    throw new Error('♻️ Циклічне посилання: клітинка посилається сама на себе або утворює цикл');
  }

  try {
    let clean = String(expr || '').toUpperCase().trim();
    if (clean.length === 0) { calcDepth--; return 0; }
    if (clean.length > MAX_CELL_LEN) throw new Error('⚠️ Формула задовга');

    clean = clean.replace(/\b([A-Z]+)(\d+)\s*:\s*([A-Z]+)(\d+)\b/g,
      (m, c1, r1, c2, r2) => expandRange(c1, parseInt(r1, 10), c2, parseInt(r2, 10)).join(','));

    let changed = true;
    let guard = 0;
    while (changed && guard++ < 30) {
      changed = false;

      clean = clean.replace(/\b(SUM|AVG|MAX|MIN|COUNT|COUNTA|MEDIAN)\(([^()]*)\)/g, (m, func, args) => {
        changed = true;
        const rawArgs = splitFormulaArgs(args);
        const vals = rawArgs.map(a => resolveValue(a.trim())).filter(v => isFinite(v));
        if (func === 'COUNT') return String(vals.length);
        if (func === 'COUNTA') return String(countNonEmptyArgs(rawArgs));
        if (vals.length === 0) return '0';
        if (func === 'SUM') return String(vals.reduce((a, b) => a + b, 0));
        if (func === 'AVG') return String(vals.reduce((a, b) => a + b, 0) / vals.length);
        if (func === 'MAX') return String(Math.max(...vals));
        if (func === 'MIN') return String(Math.min(...vals));
        if (func === 'MEDIAN') {
          const sorted = [...vals].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return String(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
        }
        return '0';
      });

      clean = clean.replace(/\b(ABS|SQRT)\(([^()]*)\)/g, (m, func, args) => {
        changed = true;
        const val = resolveValue(splitFormulaArgs(args)[0]);
        if (func === 'ABS') return String(Math.abs(val));
        if (func === 'SQRT') {
          if (val < 0) throw new Error('⚠️ Корінь із від’ємного числа не підтримується');
          return String(Math.sqrt(val));
        }
        return '0';
      });

      clean = clean.replace(/\b(ROUND|POW|POWER)\(([^()]*)\)/g, (m, func, args) => {
        changed = true;
        const parts = splitFormulaArgs(args);
        const a = resolveValue(parts[0]);
        const b = resolveValue(parts[1]);
        if (func === 'ROUND') {
          const digits = Number.isFinite(b) ? b : 0;
          const factor = Math.pow(10, digits);
          return String(Math.round(a * factor) / factor);
        }
        return String(Math.pow(a, b));
      });
    }

    clean = clean.replace(/\b([A-Z]+)(\d+)\b/g, (m, c, r) => String(resolveValue(c + r)));

    const res = safeMathEval(clean);
    if (!isFinite(res)) throw new Error('♾️ Результат занадто великий');

    calcDepth--;
    return Number.isInteger(res) ? res : parseFloat(Number(res).toFixed(10).replace(/\.?0+$/, ''));
  } catch (e) {
    calcDepth = 0;
    throw new Error(e?.message || '❌ Помилка у формулі. Перевір назви клітинок, дужки та функції.');
  }
}

function resolveValue(ref) {
  const trimmed = String(ref || '').trim();
  if (trimmed === '') return 0;

  if (!isNaN(trimmed)) return parseFloat(trimmed);

  const m = /^([A-Z]+)(\d+)$/.exec(trimmed.toUpperCase());
  if (!m) return 0;

  const cIdx = colToIndex(m[1]);
  const rNum = parseInt(m[2], 10);
  if (cIdx < 0 || cIdx >= COL_COUNT || rNum < 1 || rNum > ROWS) return 0;

  const key = m[1] + rNum;
  const raw = cellData[key];
  if (raw === undefined || raw === null || raw === '') return 0;

  if (String(raw).startsWith('=')) {
    return evaluateFormula(String(raw).substring(1));
  }

  const normalized = String(raw).replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

function expandRange(c1, r1, c2, r2) {
  const list = [];
  const ci1 = colToIndex(c1);
  const ci2 = colToIndex(c2);
  if (ci1 < 0 || ci2 < 0) return list;

  const cMin = Math.min(ci1, ci2);
  const cMax = Math.max(ci1, ci2);
  const rMin = Math.min(r1, r2);
  const rMax = Math.max(r1, r2);

  for (let c = cMin; c <= cMax; c++) {
    for (let r = rMin; r <= rMax; r++) {
      if (c >= 0 && c < COL_COUNT && r >= 1 && r <= ROWS) {
        list.push(indexToCol(c) + r);
      }
    }
  }
  return list;
}

// ---- Reference shifting for row/col inserts (used in app.js) ----
function shiftFormulaRefs(formula, opts) {
  // opts: { rowAt: number|null, colAt: number|null, rowDelta: number, colDelta: number }
  const raw = String(formula || '');
  if (!raw.startsWith('=')) return raw;

  const rowAt = Number.isFinite(opts?.rowAt) ? opts.rowAt : null;
  const colAt = Number.isFinite(opts?.colAt) ? opts.colAt : null;
  const rowDelta = Number.isFinite(opts?.rowDelta) ? opts.rowDelta : 0;
  const colDelta = Number.isFinite(opts?.colDelta) ? opts.colDelta : 0;

  const shiftRef = (colLabel, rowStr) => {
    let cIdx = colToIndex(colLabel);
    let rNum = parseInt(rowStr, 10);
    if (rowAt !== null && rNum >= rowAt) rNum += rowDelta;
    if (colAt !== null && cIdx >= colAt) cIdx += colDelta;
    cIdx = Math.max(0, cIdx);
    rNum = Math.max(1, rNum);
    return indexToCol(cIdx) + rNum;
  };

  let out = raw.replace(/\b([A-Z]+)(\d+)\s*:\s*([A-Z]+)(\d+)\b/g, (m, c1, r1, c2, r2) => {
    const a = shiftRef(c1, r1);
    const b = shiftRef(c2, r2);
    return a + ':' + b;
  });

  out = out.replace(/\b([A-Z]+)(\d+)\b/g, (m, c, r) => shiftRef(c, r));
  return out;
}

// ---- Load saved state once on script load ----
loadStateFromStorage();