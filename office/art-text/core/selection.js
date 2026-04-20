'use strict';
/* core/selection.js — утиліти для роботи з виділенням. */

const ArtSelection = (() => {

  function getSelection() { return window.getSelection(); }
  function getRange() {
    const sel = getSelection();
    return (sel && sel.rangeCount) ? sel.getRangeAt(0) : null;
  }

  function save() {
    const range = getRange();
    return range ? range.cloneRange() : null;
  }

  function restore(range) {
    if (!range) return;
    const sel = getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function hasSelection() {
    const sel = getSelection();
    return sel && !sel.isCollapsed;
  }

  function getText() {
    return getSelection()?.toString() ?? '';
  }

  function getClosest(tagName) {
    const range = getRange();
    let node = range?.startContainer || null;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
    tagName = String(tagName || '').toUpperCase();
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === tagName) return node;
      if (node.id === 'editor') break;
      node = node.parentNode;
    }
    return null;
  }

  function getSelectedListItems() {
    const range = getRange();
    if (!range) return [];
    const root = document.getElementById('editor');
    if (!root) return [];

    const items = new Set();
    const startLi = closestLi(range.startContainer);
    const endLi = closestLi(range.endContainer);
    if (startLi) items.add(startLi);
    if (endLi) items.add(endLi);

    root.querySelectorAll('li').forEach(li => {
      try {
        if (range.intersectsNode(li)) items.add(li);
      } catch (_) {}
    });
    return [...items];
  }

  function closestLi(node) {
    while (node && node !== document) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') return node;
      node = node.parentNode;
    }
    return null;
  }

  function wrapWithSpan(style) {
    const range = getRange();
    if (!range || range.collapsed) return false;
    const span = document.createElement('span');
    span.setAttribute('style', style);
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    const sel = getSelection();
    if (sel) {
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    }
    return true;
  }

  function applyInlineStyle(styleMap) {
    const style = Object.entries(styleMap).map(([k,v]) => `${k}:${v}`).join(';');
    return wrapWithSpan(style);
  }

  function exec(cmd, value = null) {
    document.execCommand(cmd, false, value);
  }

  function queryState(cmd) {
    return document.queryCommandState(cmd);
  }

  return { save, restore, hasSelection, getText, wrapWithSpan, applyInlineStyle, exec, queryState, getRange, getClosest, getSelectedListItems };
})();
