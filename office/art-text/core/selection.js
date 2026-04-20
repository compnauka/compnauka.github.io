'use strict';
/* core/selection.js — стабільні Range API без execCommand */

const ArtSelection = (() => {
  const ZWSP = '\u200B';

  function getSelection() { return window.getSelection(); }

  function getRange(editor) {
    const sel = getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;
    return range;
  }

  function save(editor) {
    const range = getRange(editor);
    return range ? range.cloneRange() : null;
  }

  function restore(range) {
    if (!range) return;
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function cloneRangeSafe(range) {
    return range ? range.cloneRange() : null;
  }

  function serializeSelection(editor) {
    const range = getRange(editor);
    if (!range) return null;
    return {
      start: { path: _nodePath(editor, range.startContainer), offset: range.startOffset },
      end:   { path: _nodePath(editor, range.endContainer), offset: range.endOffset }
    };
  }

  function restoreSerializedSelection(editor, data) {
    if (!data) return;
    const startNode = _nodeFromPath(editor, data.start.path);
    const endNode   = _nodeFromPath(editor, data.end.path);
    if (!startNode || !endNode) return;
    const range = document.createRange();
    try {
      range.setStart(startNode, Math.min(data.start.offset, _maxOffset(startNode)));
      range.setEnd(endNode, Math.min(data.end.offset, _maxOffset(endNode)));
      restore(range);
    } catch {}
  }

  function restoreLast(editor) {
    const saved = editor?._artSavedRange;
    if (saved) restore(saved.cloneRange ? saved.cloneRange() : saved);
  }

  function remember(editor) {
    const range = getRange(editor);
    editor._artSavedRange = range ? range.cloneRange() : editor._artSavedRange || null;
  }

  function hasSelection(editor) {
    const range = getRange(editor);
    return !!range && !range.collapsed;
  }

  function getText(editor) {
    return getRange(editor)?.toString() || '';
  }

  function selectAll(editor) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    restore(range);
  }

  function insertNode(editor, node) {
    const range = getRange(editor);
    if (!range) return false;
    range.deleteContents();
    range.insertNode(node);
    _placeCaretAfter(node);
    normalizeEditor(editor);
    return true;
  }

  function insertHTML(editor, html) {
    const range = getRange(editor);
    if (!range) return false;
    const frag = _htmlToFragment(ArtSanitize.clean(html));
    const last = frag.lastChild;
    range.deleteContents();
    range.insertNode(frag);
    if (last) _placeCaretAfter(last);
    normalizeEditor(editor);
    return true;
  }

  function insertParagraphAfter(editor) {
    const block = getCurrentBlock(editor) || editor.lastElementChild || editor;
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    if (block === editor) editor.appendChild(p);
    else block.insertAdjacentElement('afterend', p);
    _placeCaretInsideStart(p);
    normalizeEditor(editor);
  }

  function toggleInlineTag(editor, tagName) {
    const range = getRange(editor);
    if (!range) return false;
    const existing = _closestFormattingAncestor(editor, range.startContainer, el => el.tagName?.toLowerCase() === tagName);
    if (existing && (range.collapsed || existing.contains(range.commonAncestorContainer))) {
      _unwrap(existing);
      normalizeEditor(editor);
      return true;
    }

    const el = document.createElement(tagName);
    const colorHost = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    if (colorHost) {
      const computed = getComputedStyle(colorHost).color;
      if (computed && ['u','s','strike'].includes(tagName)) el.style.color = computed;
    }
    if (range.collapsed) {
      el.textContent = ZWSP;
      range.insertNode(el);
      _placeCaretInsideStart(el, 1);
    } else {
      _surroundRange(range, el);
      _selectNodeContents(el);
    }
    normalizeEditor(editor);
    return true;
  }

  function applyInlineStyle(editor, styles, options = {}) {
    const range = getRange(editor);
    if (!range) return false;
    const span = document.createElement('span');
    Object.assign(span.style, styles);
    if (range.collapsed) {
      span.textContent = ZWSP;
      range.insertNode(span);
      _syncDecorationColor(span, styles, options);
      _placeCaretInsideStart(span, 1);
    } else {
      _surroundRange(range, span);
      _syncDecorationColor(span, styles, options);
      _selectNodeContents(span);
    }
    normalizeEditor(editor);
    return true;
  }

  function setBlockTag(editor, tagName) {
    const block = getCurrentBlock(editor);
    if (!block || block === editor) return false;
    if (block.tagName.toLowerCase() === tagName) return true;
    const replacement = document.createElement(tagName);
    [...block.attributes].forEach(attr => replacement.setAttribute(attr.name, attr.value));
    replacement.innerHTML = block.innerHTML;
    block.replaceWith(replacement);
    _placeCaretInsideStart(replacement);
    normalizeEditor(editor);
    return true;
  }

  function setAlignment(editor, align) {
    const block = getCurrentBlock(editor);
    if (!block || block === editor) return false;
    block.style.textAlign = align === 'left' ? '' : align;
    normalizeEditor(editor);
    return true;
  }

  function toggleList(editor, listTag) {
    const block = getCurrentBlock(editor);
    if (!block || block === editor) return false;
    const item = block.closest('li');
    const list = block.closest('ul,ol');

    if (list && list.tagName.toLowerCase() === listTag && item) {
      const p = document.createElement('p');
      p.innerHTML = item.innerHTML || '<br>';
      if (item.nextElementSibling) list.parentNode.insertBefore(p, list.nextElementSibling);
      else list.insertAdjacentElement('afterend', p);
      item.remove();
      if (!list.children.length) list.remove();
      _placeCaretInsideStart(p);
    } else if (list && item) {
      const replacement = document.createElement(listTag);
      replacement.innerHTML = list.innerHTML;
      list.replaceWith(replacement);
      _placeCaretInsideStart(replacement.querySelector('li') || replacement);
    } else {
      const listEl = document.createElement(listTag);
      const li = document.createElement('li');
      li.innerHTML = block.innerHTML || '<br>';
      listEl.appendChild(li);
      block.replaceWith(listEl);
      _placeCaretInsideStart(li);
    }
    normalizeEditor(editor);
    return true;
  }

  function indent(editor, delta = 24) {
    const block = getCurrentBlock(editor);
    if (!block || block === editor) return false;
    const current = parseInt(block.style.marginLeft || '0', 10) || 0;
    block.style.marginLeft = `${Math.max(0, current + delta)}px`;
    return true;
  }

  function outdent(editor, delta = 24) {
    const block = getCurrentBlock(editor);
    if (!block || block === editor) return false;
    const current = parseInt(block.style.marginLeft || '0', 10) || 0;
    block.style.marginLeft = `${Math.max(0, current - delta)}px`;
    if (block.style.marginLeft === '0px') block.style.marginLeft = '';
    return true;
  }

  function insertHorizontalRule(editor) {
    const hr = document.createElement('hr');
    return insertNode(editor, hr);
  }

  async function copy(editor) {
    const text = getText(editor);
    if (!text) return false;
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
  }

  async function cut(editor) {
    const range = getRange(editor);
    if (!range || range.collapsed) return false;
    const ok = await copy(editor);
    range.deleteContents();
    normalizeEditor(editor);
    return ok;
  }

  async function pastePlainText(editor) {
    try {
      const text = await navigator.clipboard.readText();
      return insertText(editor, text);
    } catch {
      return false;
    }
  }

  function insertText(editor, text) {
    const range = getRange(editor);
    if (!range) return false;
    const lines = String(text).replace(/\r/g, '').split('\n');
    if (lines.length === 1) {
      const node = document.createTextNode(lines[0]);
      range.deleteContents();
      range.insertNode(node);
      _placeCaretAfter(node);
    } else {
      const frag = document.createDocumentFragment();
      lines.forEach((line, i) => {
        if (i > 0) frag.appendChild(document.createElement('br'));
        if (line) frag.appendChild(document.createTextNode(line));
      });
      const last = frag.lastChild;
      range.deleteContents();
      range.insertNode(frag);
      if (last) _placeCaretAfter(last);
    }
    normalizeEditor(editor);
    return true;
  }

  function queryState(editor, cmd) {
    const range = getRange(editor);
    if (!range) return false;
    const el = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    if (!el) return false;
    switch (cmd) {
      case 'bold': return !!el.closest('b,strong');
      case 'italic': return !!el.closest('i,em');
      case 'underline': return !!el.closest('u');
      case 'strikeThrough': return !!el.closest('s,strike');
      case 'insertUnorderedList': return !!el.closest('ul');
      case 'insertOrderedList': return !!el.closest('ol');
      default: return false;
    }
  }

  function getCurrentBlock(editor) {
    const range = getRange(editor);
    if (!range) return null;
    let node = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentNode;
    while (node && node !== editor) {
      if (_isBlock(node)) return node;
      node = node.parentNode;
    }
    return editor.firstElementChild || editor;
  }

  function normalizeEditor(editor) {
    editor.querySelectorAll('span, strong, b, em, i, u, s, strike').forEach(el => {
      if (el.textContent === ZWSP && !el.querySelector('*')) return;
      if (!el.textContent && !el.querySelector('br, img, table, hr')) {
        if (el.parentNode) el.remove();
      }
    });
    if (!editor.innerHTML.trim()) editor.innerHTML = '<p><br></p>';
    if (![...editor.children].some(ch => _isBlock(ch))) {
      const p = document.createElement('p');
      p.innerHTML = editor.innerHTML || '<br>';
      editor.innerHTML = '';
      editor.appendChild(p);
    }
  }


  function _syncDecorationColor(node, styles, options = {}) {
    if (!options.syncDecorations || !styles?.color) return;
    let el = node.parentElement;
    while (el) {
      const tag = el.tagName?.toLowerCase();
      if (tag === 'u' || tag === 's' || tag === 'strike') {
        el.style.color = styles.color;
        el.style.textDecorationColor = styles.color;
      }
      el = el.parentElement;
    }
    node.querySelectorAll?.('u,s,strike').forEach(dec => {
      dec.style.color = styles.color;
      dec.style.textDecorationColor = styles.color;
    });
  }

  function insertImage(editor, src, alt = '') {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'art-image';
    return insertNode(editor, img);
  }

  function _nodePath(root, node) {
    const path = [];
    while (node && node !== root) {
      const parent = node.parentNode;
      if (!parent) break;
      path.unshift([...parent.childNodes].indexOf(node));
      node = parent;
    }
    return path;
  }

  function _nodeFromPath(root, path) {
    return path.reduce((node, idx) => node?.childNodes?.[idx], root);
  }

  function _maxOffset(node) {
    return node.nodeType === Node.TEXT_NODE ? node.textContent.length : node.childNodes.length;
  }

  function _surroundRange(range, wrapper) {
    try {
      range.surroundContents(wrapper);
    } catch {
      const frag = range.extractContents();
      wrapper.appendChild(frag);
      range.insertNode(wrapper);
    }
  }

  function _unwrap(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  function _closestFormattingAncestor(editor, node, predicate) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== editor) {
      if (predicate(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function _placeCaretAfter(node) {
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    restore(range);
  }

  function _placeCaretInsideStart(node, offset = 0) {
    const range = document.createRange();
    if (node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
      range.setStart(node.firstChild, Math.min(offset, node.firstChild.textContent.length));
    } else {
      range.setStart(node, Math.min(offset, node.childNodes.length));
    }
    range.collapse(true);
    restore(range);
  }

  function _selectNodeContents(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    restore(range);
  }

  function _htmlToFragment(html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
  }

  function _isBlock(node) {
    return node && node.nodeType === 1 && ['P','DIV','H1','H2','H3','H4','BLOCKQUOTE','UL','OL','TABLE'].includes(node.tagName);
  }

  return {
    save, restore, cloneRangeSafe, restoreLast, remember, serializeSelection, restoreSerializedSelection,
    hasSelection, getText, selectAll,
    insertNode, insertHTML, insertText, insertParagraphAfter,
    toggleInlineTag, applyInlineStyle, insertImage,
    setBlockTag, setAlignment, toggleList, indent, outdent, insertHorizontalRule,
    copy, cut, pastePlainText, queryState, getCurrentBlock, normalizeEditor, getRange
  };
})();
