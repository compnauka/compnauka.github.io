'use strict';
/* core/history.js — undo/redo стек для contenteditable. */

const ArtHistory = (() => {
  const MAX = 200;
  let _stack = [];
  let _index = -1;
  let _editorEl = null;
  let _paused = false;
  let _lastSaved = '';

  function init(editorEl) {
    _editorEl = editorEl;
    _stack = [{ html: editorEl.innerHTML, sel: null }];
    _index = 0;
    _lastSaved = editorEl.innerHTML;
  }

  function _getSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    // Зберігаємо як текстові зсуви відносно editor
    return {
      startOffset: range.startOffset,
      endOffset:   range.endOffset,
    };
  }

  function push(html) {
    if (_paused) return;
    // Не дублюємо однаковий стан
    if (_stack[_index]?.html === html) return;

    // Відрізаємо "майбутнє" якщо робили undo
    _stack = _stack.slice(0, _index + 1);

    _stack.push({ html, sel: _getSelection() });
    if (_stack.length > MAX) _stack.shift();
    _index = _stack.length - 1;

    ArtState.setDirty(html !== _lastSaved);
    _notifyButtons();
  }

  function undo() {
    if (_index <= 0) return;
    _index--;
    _restore(_stack[_index]);
    _notifyButtons();
  }

  function redo() {
    if (_index >= _stack.length - 1) return;
    _index++;
    _restore(_stack[_index]);
    _notifyButtons();
  }

  function _restore(entry) {
    if (!_editorEl) return;
    _paused = true;
    _editorEl.innerHTML = entry.html;
    _paused = false;
    ArtState.setDirty(_editorEl.innerHTML !== _lastSaved);
    _editorEl.dispatchEvent(new Event('art:restored'));
  }

  function markSaved() {
    _lastSaved = _editorEl?.innerHTML ?? '';
    ArtState.setDirty(false);
  }

  function canUndo() { return _index > 0; }
  function canRedo() { return _index < _stack.length - 1; }

  // Виклик після кожного збереження/undo/redo щоб UI оновив кнопки
  let _buttonCallback = null;
  function onButtonsUpdate(fn) { _buttonCallback = fn; }
  function _notifyButtons() { _buttonCallback?.(); }

  function pause()  { _paused = true; }
  function resume() { _paused = false; }

  return { init, push, undo, redo, canUndo, canRedo,
           markSaved, onButtonsUpdate, pause, resume };
})();
