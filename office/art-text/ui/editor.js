'use strict';
/* ui/editor.js — область редактора, аркуші, орієнтація, zoom, файли */

const ArtEditor = (() => {
  let _editor = null;
  let _announcer = null;

  function init(editorEl, announcerEl) {
    _editor    = editorEl;
    _announcer = announcerEl;

    // Початковий вміст
    _editor.innerHTML = '<p><br></p>';

    // Подія input — пушимо в history з debounce
    let _debTimer = null;
    _editor.addEventListener('input', () => {
      ArtState.setDirty(true);
      _updateStatusBar();
      clearTimeout(_debTimer);
      _debTimer = setTimeout(() => {
        ArtHistory.push(_editor.innerHTML);
      }, 400);
    });

    // Відновлення після undo/redo
    _editor.addEventListener('art:restored', _updateStatusBar);

    // Слухаємо зміни стану
    ArtState.on('change:dirty', dirty => {
      const dot = document.getElementById('dirtyDot');
      if (dot) dot.style.display = dirty ? 'inline' : 'none';
    });

    ArtState.on('change:orientation', _applyOrientation);
    ArtState.on('change:zoom', _applyZoom);

    // Відкриття файлу
    document.getElementById('fileInput')?.addEventListener('change', _handleFileOpen);

    // Попередження перед закриттям
    window.addEventListener('beforeunload', e => {
      if (ArtState.isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });

    _updateStatusBar();
    _editor.focus();
  }

  // ── Новий документ ──────────────────────────
  function newDoc() {
    _editor.innerHTML = '<p><br></p>';
    ArtState.set('fileName', 'документ');
    ArtState.set('fileFormat', 'docx');
    ArtHistory.init(_editor);
    ArtHistory.markSaved();
    _updateFileName();
    _updateStatusBar();
    _editor.focus();
    _announce('Новий документ');
  }

  // ── Відкриття файлу ─────────────────────────
  async function _handleFileOpen(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const ext = file.name.split('.').pop().toLowerCase();

    try {
      let result;
      if (ext === 'txt')  result = await ArtTxt.importTxt(file);
      else if (ext === 'rtf')  result = await ArtRtf.importRtf(file);
      else if (ext === 'docx') result = await ArtDocx.importDocx(file);
      else { ArtModals.info('Непідтримуваний формат', `Файл .${ext} не підтримується.`); return; }

      _editor.innerHTML = result.html;
      ArtState.set('fileName', _stripExt(file.name));
      ArtState.set('fileFormat', result.meta.format);
      ArtHistory.init(_editor);
      ArtHistory.markSaved();
      _updateFileName();
      _updateStatusBar();

      if (result.meta.warnings?.length) {
        ArtModals.info(
          'Файл відкрито з застереженнями',
          'Деяке форматування могло бути спрощено:\n' + result.meta.warnings.join('\n')
        );
      }
      _announce(`Файл ${file.name} відкрито`);
    } catch (err) {
      ArtModals.info('Помилка відкриття', err.message || String(err));
    }
  }

  // ── Збереження ──────────────────────────────
  async function saveAs(format) {
    ArtModals.close('modalSave');
    const html = _editor.innerHTML;

    try {
      let blob, ext;

      if (format === 'txt') {
        blob = new Blob([ArtTxt.exportTxt(html)],
                        { type: 'text/plain;charset=utf-8' });
        ext = 'txt';

      } else if (format === 'rtf') {
        blob = new Blob([ArtRtf.exportRtf(html)],
                        { type: 'application/rtf;charset=utf-8' });
        ext = 'rtf';

      } else if (format === 'docx') {
        blob = await ArtDocx.exportDocx(html, {
          orientation: ArtState.get('orientation'),
        });
        ext = 'docx';

      } else {
        ArtModals.info('Помилка', `Невідомий формат: ${format}`);
        return;
      }

      _download(blob, `${ArtState.get('fileName')}.${ext}`);
      ArtState.set('fileFormat', format);
      ArtHistory.markSaved();
      _flashSaved();
      _announce(`Збережено як ${ArtState.get('fileName')}.${ext}`);

    } catch (err) {
      ArtModals.info('Помилка збереження', err.message || String(err));
    }
  }

  // ── Орієнтація ──────────────────────────────
  function setOrientation(value) {
    ArtState.set('orientation', value);
  }

  function _applyOrientation(value) {
    const pages = document.querySelector('.pages-wrap');
    if (!pages) return;
    pages.dataset.orientation = value;

    // Оновлюємо чекмарки в меню
    document.querySelectorAll('[data-action^="orient-"]').forEach(item => {
      item.classList.toggle('checked', item.dataset.action === `orient-${value}`);
    });
  }

  // ── Масштаб ─────────────────────────────────
  function setZoom(pct) {
    ArtState.set('zoom', pct);
  }

  function _applyZoom(pct) {
    const wrap = document.querySelector('.pages-wrap');
    if (wrap) wrap.style.setProperty('--zoom', pct / 100);

    document.querySelectorAll('[data-action^="zoom-"]').forEach(item => {
      item.classList.toggle('checked', item.dataset.action === `zoom-${pct}`);
    });

    const badge = document.getElementById('zoomBadge');
    if (badge) badge.textContent = `${pct}%`;
  }

  // ── Вставка таблиці ─────────────────────────
  function insertTable(rows, cols) {
    ArtModals.close('modalTable');
    _editor.focus();

    const table = document.createElement('table');
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = document.createElement(r === 0 ? 'th' : 'td');
        td.innerHTML = '<br>';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    ArtSelection.exec('insertHTML', table.outerHTML);
    ArtHistory.push(_editor.innerHTML);
  }

  // ── Пошук ───────────────────────────────────
  function findNext(query) {
    if (!query) return;
    window.find(query);    // нативний браузерний пошук
  }

  // ── Назва файлу ─────────────────────────────
  function _updateFileName() {
    const el = document.getElementById('fileName');
    if (el) el.textContent = ArtState.get('fileName');
  }

  function editFileName() {
    const span = document.getElementById('fileName');
    if (!span) return;
    const input = document.createElement('input');
    input.type      = 'text';
    input.value     = ArtState.get('fileName');
    input.className = 'filename-input';
    input.setAttribute('aria-label', 'Назва файлу');
    span.replaceWith(input);
    input.focus(); input.select();

    function commit() {
      const val = input.value.trim() || 'документ';
      ArtState.set('fileName', val);
      input.replaceWith(span);
      span.textContent = val;
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { input.replaceWith(span); }
    });
  }

  // ── Статусний рядок ─────────────────────────
  function _updateStatusBar() {
    const div = document.createElement('div');
    div.innerHTML = _editor.innerHTML;
    const text  = div.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const wEl = document.getElementById('statusWords');
    const cEl = document.getElementById('statusChars');
    if (wEl) wEl.textContent = words;
    if (cEl) cEl.textContent = chars;
  }

  // ── Saved flash ─────────────────────────────
  function _flashSaved() {
    const badge = document.getElementById('savedBadge');
    if (!badge) return;
    badge.style.opacity = '1';
    setTimeout(() => { badge.style.opacity = '0'; }, 2500);
  }

  // ── Утиліти ─────────────────────────────────
  function _download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a   = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  }

  function _stripExt(name) {
    return name.replace(/\.[^.]+$/, '') || name;
  }

  function _announce(msg) {
    if (!_announcer) return;
    _announcer.textContent = '';
    requestAnimationFrame(() => { _announcer.textContent = msg; });
  }

  return {
    init, newDoc, saveAs,
    setOrientation, setZoom,
    insertTable, findNext,
    editFileName,
  };
})();
