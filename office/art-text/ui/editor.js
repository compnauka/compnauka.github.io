'use strict';
/* ui/editor.js — редактор, файли, пошук, статус */

const ArtEditor = (() => {
  let _editor = null;
  let _announcer = null;
  let _findState = { query: '', index: -1, matches: [] };

  function init(editorEl, announcerEl) {
    _editor = editorEl;
    _announcer = announcerEl;
    _editor.innerHTML = '<p><br></p>';

    _editor.addEventListener('input', () => {
      ArtState.setDirty(true);
      _updateStatusBar();
      _updateVirtualPages();
    });

    _editor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        ArtSelection.insertText(_editor, '    ');
        ArtHistory.pushNow();
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        ArtSelection.insertHTML(_editor, '<br>');
        ArtHistory.pushNow();
      }
      if (e.key === 'Enter' && _handleListEnter(e)) {
        ArtHistory.pushNow();
      }
    });

    _editor.addEventListener('blur', () => ArtHistory.pushNow(), true);
    _editor.addEventListener('mouseup', () => ArtToolbar.updateState());
    _editor.addEventListener('keyup', () => ArtToolbar.updateState());
    _editor.addEventListener('art:restored', () => {
      _updateStatusBar();
      ArtToolbar.updateState();
    });

    ArtState.on('change:dirty', dirty => {
      const dot = document.getElementById('dirtyDot');
      if (dot) dot.style.display = dirty ? 'inline-block' : 'none';
    });
    ArtState.on('change:orientation', _applyOrientation);
    ArtState.on('change:zoom', _applyZoom);

    document.getElementById('fileInput')?.addEventListener('change', _handleFileOpen);
    document.getElementById('imageInput')?.addEventListener('change', _handleImageInsert);
    window.addEventListener('resize', _updateVirtualPages);
    window.addEventListener('beforeunload', e => {
      if (ArtState.isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });

    _applyOrientation(ArtState.get('orientation'));
    _applyZoom(ArtState.get('zoom'));
    _updateFileName();
    _updateStatusBar();
    _updateVirtualPages();
    _editor.focus();
  }

  function newDoc() {
    clearFindHighlights();
    _editor.innerHTML = '<p><br></p>';
    ArtState.set('fileName', 'документ');
    ArtState.set('fileFormat', 'docx');
    ArtHistory.init(_editor);
    ArtHistory.markSaved();
    _updateFileName();
    _updateStatusBar();
    _updateVirtualPages();
    _editor.focus();
    _announce('Новий документ');
  }

  async function _handleFileOpen(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      let result;
      if (ext === 'txt') result = await ArtTxt.importTxt(file);
      else if (ext === 'rtf') result = await ArtRtf.importRtf(file);
      else if (ext === 'docx') result = await ArtDocx.importDocx(file);
      else return ArtModals.info('Непідтримуваний формат', `Файл .${ext} не підтримується.`);

      clearFindHighlights();
      _editor.innerHTML = ArtSanitize.clean(result.html);
      ArtSelection.normalizeEditor(_editor);
      ArtState.set('fileName', _stripExt(file.name));
      ArtState.set('fileFormat', result.meta.format);
      ArtHistory.init(_editor);
      ArtHistory.markSaved();
      _updateFileName();
      _updateStatusBar();
      _updateVirtualPages();
      if (result.meta.warnings?.length) {
        ArtModals.info('Файл відкрито з застереженнями', 'Деяке форматування могло бути спрощено.');
      }
      _announce(`Файл ${file.name} відкрито`);
    } catch (err) {
      ArtModals.info('Помилка відкриття', err.message || String(err));
    }
  }

  async function saveAs(format) {
    ArtModals.close('modalSave');
    const html = _editor.innerHTML;
    try {
      let blob, ext;
      if (format === 'txt') {
        blob = new Blob([ArtTxt.exportTxt(html)], { type: 'text/plain;charset=utf-8' });
        ext = 'txt';
      } else if (format === 'rtf') {
        blob = new Blob([ArtRtf.exportRtf(html)], { type: 'application/rtf;charset=utf-8' });
        ext = 'rtf';
      } else if (format === 'docx') {
        blob = await ArtDocx.exportDocx(html, { orientation: ArtState.get('orientation') });
        ext = 'docx';
      } else return;
      _download(blob, `${ArtState.get('fileName')}.${ext}`);
      ArtState.set('fileFormat', format);
      ArtHistory.markSaved();
      _flashSaved();
      _announce(`Збережено як ${ArtState.get('fileName')}.${ext}`);
    } catch (err) {
      ArtModals.info('Помилка збереження', err.message || String(err));
    }
  }

  function setOrientation(value) { ArtState.set('orientation', value); }
  function setZoom(value) { ArtState.set('zoom', value); }

  function _applyOrientation(value) {
    const pages = document.querySelector('.pages-wrap');
    if (pages) pages.dataset.orientation = value;
    _updateVirtualPages();
    document.querySelectorAll('[data-action^="orient-"]').forEach(item => {
      item.classList.toggle('checked', item.dataset.action === `orient-${value}`);
    });
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

  function insertTable(rows, cols) {
    ArtModals.close('modalTable');
    ArtToolbar.run(() => {
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement(r === 0 ? 'th' : 'td');
          cell.innerHTML = '<br>';
          tr.appendChild(cell);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      ArtSelection.insertNode(_editor, table);
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      table.insertAdjacentElement('afterend', p);
      ArtSelection.normalizeEditor(_editor);
      const range = document.createRange();
      range.selectNodeContents(table.querySelector('th,td'));
      range.collapse(true);
      ArtSelection.restore(range);
    });
  }


  function openImageDialog() {
    ArtSelection.remember(_editor);
    document.getElementById('imageInput')?.click();
  }

  async function _handleImageInsert(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      ArtSelection.restoreLast(_editor);
      ArtToolbar.run(() => ArtSelection.insertImage(_editor, String(reader.result), file.name.replace(/\.[^.]+$/, '')));
      _updateVirtualPages();
      _announce(`Зображення ${file.name} вставлено`);
    };
    reader.readAsDataURL(file);
  }

  function _handleListEnter(e) {
    const range = ArtSelection.getRange(_editor);
    if (!range) return false;
    let node = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const li = node?.closest?.('li');
    if (!li || !(_editor.contains(li))) return false;
    if (!range.collapsed) return false;
    const plain = (li.textContent || '').replace(/​/g, '').trim();
    e.preventDefault();
    if (!plain) {
      const list = li.parentElement;
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      if (list.nextSibling) list.parentNode.insertBefore(p, list.nextSibling);
      else list.parentNode.appendChild(p);
      li.remove();
      if (!list.children.length) list.remove();
      ArtSelection.normalizeEditor(_editor);
      const range2 = document.createRange();
      range2.selectNodeContents(p);
      range2.collapse(true);
      ArtSelection.restore(range2);
      return true;
    }
    const newLi = document.createElement('li');
    newLi.innerHTML = '<br>';
    li.insertAdjacentElement('afterend', newLi);
    const range2 = document.createRange();
    range2.selectNodeContents(newLi);
    range2.collapse(true);
    ArtSelection.restore(range2);
    return true;
  }

  function _updateVirtualPages() {
    const wrap = document.querySelector('.pages-wrap');
    const stack = wrap?.querySelector('.page-stack');
    const pageEl = wrap?.querySelector('.page-editor');
    if (!wrap || !stack || !pageEl || !_editor) return;
    const pageHeight = wrap.dataset.orientation === 'landscape' ? 794 : 1123;
    const pageGap = 24;
    const styles = getComputedStyle(pageEl);
    const padTop = parseFloat(styles.paddingTop) || 0;
    const padBottom = parseFloat(styles.paddingBottom) || 0;
    const contentHeight = Math.ceil(_editor.scrollHeight + padTop + padBottom);
    const count = Math.max(1, Math.ceil(contentHeight / pageHeight));
    stack.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const ghost = document.createElement('div');
      ghost.className = 'page';
      ghost.setAttribute('aria-hidden', 'true');
      stack.appendChild(ghost);
    }
    pageEl.style.minHeight = `${count * pageHeight + ((count - 1) * pageGap)}px`;
  }

  function findNext(query) {
    query = String(query || '').trim();
    if (!query) return;
    if (_findState.query !== query) {
      _findState = { query, index: -1, matches: [] };
      clearFindHighlights();
      _findState.matches = _collectMatches(query);
      _paintMatches();
    }
    if (!_findState.matches.length) {
      ArtModals.info('Пошук', 'Нічого не знайдено.');
      return;
    }
    _findState.index = (_findState.index + 1) % _findState.matches.length;
    const target = _editor.querySelectorAll('mark.search-hit')[_findState.index];
    if (!target) return;
    _editor.querySelectorAll('mark.search-hit.current').forEach(el => el.classList.remove('current'));
    target.classList.add('current');
    const range = document.createRange();
    range.selectNodeContents(target);
    ArtSelection.restore(range);
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function _collectMatches(query) {
    const textNodes = [];
    const walker = document.createTreeWalker(_editor, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('mark.search-hit') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) if (n.textContent.trim()) textNodes.push(n);
    const matches = [];
    const q = query.toLowerCase();
    textNodes.forEach(node => {
      let from = 0;
      const lower = node.textContent.toLowerCase();
      while (true) {
        const idx = lower.indexOf(q, from);
        if (idx === -1) break;
        matches.push({ node, start: idx, end: idx + q.length });
        from = idx + q.length;
      }
    });
    return matches;
  }

  function _paintMatches() {
    [..._findState.matches].reverse().forEach(match => {
      const range = document.createRange();
      range.setStart(match.node, match.start);
      range.setEnd(match.node, match.end);
      const mark = document.createElement('mark');
      mark.className = 'search-hit';
      try { range.surroundContents(mark); } catch {}
    });
  }

  function clearFindHighlights() {
    _editor.querySelectorAll('mark.search-hit').forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    _findState = { query: '', index: -1, matches: [] };
  }

  function editFileName() {
    const span = document.getElementById('fileName');
    if (!span) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = ArtState.get('fileName');
    input.className = 'filename-input';
    input.setAttribute('aria-label', 'Назва файлу');
    span.replaceWith(input);
    input.focus();
    input.select();
    function commit() {
      const val = input.value.trim() || 'документ';
      ArtState.set('fileName', val);
      input.replaceWith(span);
      span.textContent = val;
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { input.replaceWith(span); }
    });
  }

  function _updateFileName() {
    const el = document.getElementById('fileName');
    if (el) el.textContent = ArtState.get('fileName');
  }

  function _updateStatusBar() {
    const text = _editor.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.replace(/\u200B/g, '').length;
    document.getElementById('statusWords').textContent = words;
    document.getElementById('statusChars').textContent = chars;
  }

  function _flashSaved() {
    const badge = document.getElementById('savedBadge');
    if (!badge) return;
    badge.style.opacity = '1';
    setTimeout(() => badge.style.opacity = '0', 2500);
  }

  function _download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function _stripExt(name) { return name.replace(/\.[^.]+$/, '') || name; }
  function _announce(msg) {
    if (!_announcer) return;
    _announcer.textContent = '';
    requestAnimationFrame(() => _announcer.textContent = msg);
  }

  return { init, newDoc, saveAs, setOrientation, setZoom, insertTable, openImageDialog, findNext, clearFindHighlights, editFileName };
})();
