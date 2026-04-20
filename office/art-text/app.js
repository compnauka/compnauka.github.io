'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('editor');
  const announcer = document.getElementById('ariaAnnouncer');
  if (!editor) return;

  ArtToolbar.init(editor);
  ArtMenu.init();
  ArtEditor.init(editor, announcer);
  ArtHistory.init(editor);
  ArtHistory.markSaved();
  ArtHistory.onButtonsUpdate(() => ArtToolbar.updateState());
  ArtToolbar.updateState();

  document.addEventListener('keydown', async e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    const key = e.key.toLowerCase();
    const map = {
      b: () => ArtToolbar.applyCommand('bold'),
      i: () => ArtToolbar.applyCommand('italic'),
      u: () => ArtToolbar.applyCommand('underline'),
      z: () => e.shiftKey ? ArtHistory.redo() : ArtHistory.undo(),
      y: () => ArtHistory.redo(),
      s: () => ArtModals.open('modalSave'),
      o: () => ArtMenu.dispatch('open'),
      p: () => window.print(),
      f: () => ArtModals.open('modalFind'),
      a: () => ArtSelection.selectAll(editor),
      c: () => ArtSelection.copy(editor),
      x: async () => { await ArtSelection.cut(editor); editor.dispatchEvent(new Event('input', { bubbles: true })); requestAnimationFrame(() => ArtHistory.pushNow()); },
      v: async () => { await ArtSelection.pastePlainText(editor); editor.dispatchEvent(new Event('input', { bubbles: true })); requestAnimationFrame(() => ArtHistory.pushNow()); }
    };
    if (!map[key]) return;
    e.preventDefault();
    await map[key]();
    ArtToolbar.updateState();
  });

  window.art = { menu: ArtMenu, editor: ArtEditor, toolbar: ArtToolbar, modals: ArtModals, history: ArtHistory };
});
