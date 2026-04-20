'use strict';
/*
  app.js — точка входу АРТ Тексту.
  Ініціалізує всі модулі після DOMContentLoaded.
  Реєструє глобальні клавіатурні скорочення.

  Порядок підключення скриптів у index.html:
    core/state.js → core/history.js → core/selection.js
    formats/txt.js → formats/rtf.js → formats/docx.js
    ui/modals.js → ui/toolbar.js → ui/menu.js → ui/editor.js
    app.js
*/

document.addEventListener('DOMContentLoaded', () => {
  const editor    = document.getElementById('editor');
  const announcer = document.getElementById('ariaAnnouncer');

  if (!editor) { console.error('АРТ Текст: #editor не знайдено'); return; }

  // ── Ініціалізація модулів ──────────────────
  ArtHistory.init(editor);
  ArtHistory.markSaved();
  ArtHistory.onButtonsUpdate(() => ArtToolbar.updateState());

  ArtToolbar.init(editor);
  ArtMenu.init();
  ArtEditor.init(editor, announcer);

  // ── Клавіатурні скорочення ─────────────────
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;

    const map = {
      'b': 'bold', 'i': 'italic', 'u': 'underline',
      'z': e.shiftKey ? 'redo' : 'undo',
      'y': 'redo',
      'n': () => ArtMenu.dispatch('new'),
      's': () => ArtModals.open('modalSave'),
      'o': () => ArtMenu.dispatch('open'),
      'p': () => window.print(),
      'f': () => ArtModals.open('modalFind'),
      'a': () => ArtSelection.exec('selectAll'),
    };

    const handler = map[e.key.toLowerCase()];
    if (!handler) return;
    e.preventDefault();

    if (typeof handler === 'string') {
      // Форматування / undo / redo
      if (handler === 'undo') { ArtHistory.undo(); ArtToolbar.updateState(); }
      else if (handler === 'redo') { ArtHistory.redo(); ArtToolbar.updateState(); }
      else {
        editor.focus();
        ArtSelection.exec(handler);
        ArtToolbar.updateState();
        ArtHistory.push(editor.innerHTML);
      }
    } else {
      handler();
    }
  });

  // ── Обробники для HTML (onclick залишки) ───
  // Всі дії доступні через window.art для inline onClick у модалках
  window.art = {
    menu:    ArtMenu,
    editor:  ArtEditor,
    toolbar: ArtToolbar,
    modals:  ArtModals,
    history: ArtHistory,
  };
});
