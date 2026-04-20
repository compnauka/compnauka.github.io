'use strict';
/* ui/menu.js — головне меню */

const ArtMenu = (() => {
  let _openMenu = null;

  function init() {
    // Клік по заголовку меню
    document.querySelectorAll('.menu-title').forEach(title => {
      title.addEventListener('click', e => {
        e.stopPropagation();
        const name = title.dataset.menu;
        _toggle(name, title);
      });
      title.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          title.click();
        }
      });
    });

    // Закрити при кліку поза меню
    document.addEventListener('click', _closeAll);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') _closeAll();
    });

    // Пункти меню
    document.querySelectorAll('.menu-item[data-action]').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const action = item.dataset.action;
        _closeAll();
        _dispatch(action, item);
      });
    });
  }

  function _toggle(name, titleEl) {
    if (_openMenu === name) { _closeAll(); return; }
    _closeAll();
    const dropdown = document.querySelector(`.menu-dropdown[data-menu="${name}"]`);
    if (!dropdown) return;
    dropdown.classList.add('open');
    titleEl.setAttribute('aria-expanded', 'true');
    _openMenu = name;
  }

  function _closeAll() {
    document.querySelectorAll('.menu-dropdown.open').forEach(d => {
      d.classList.remove('open');
    });
    document.querySelectorAll('.menu-title').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
    });
    _openMenu = null;
  }

  // ── Дії меню ─────────────────────────────────
  function _dispatch(action, item) {
    switch (action) {

      // Файл
      case 'new':
        if (ArtState.isDirty()) {
          ArtModals.confirm(
            'Є незбережені зміни. Створити новий документ і втратити їх?',
            ArtEditor.newDoc
          );
        } else {
          ArtEditor.newDoc();
        }
        break;

      case 'open':
        if (ArtState.isDirty()) {
          ArtModals.confirm(
            'Є незбережені зміни. Відкрити інший файл і втратити їх?',
            () => document.getElementById('fileInput').click()
          );
        } else {
          document.getElementById('fileInput').click();
        }
        break;

      case 'save-txt':  ArtEditor.saveAs('txt');  break;
      case 'save-rtf':  ArtEditor.saveAs('rtf');  break;
      case 'save-docx': ArtEditor.saveAs('docx'); break;
      case 'print':     window.print();            break;

      // Редагування
      case 'undo':  ArtHistory.undo(); ArtToolbar.updateState(); break;
      case 'redo':  ArtHistory.redo(); ArtToolbar.updateState(); break;
      case 'cut':   ArtSelection.exec('cut');   break;
      case 'copy':  ArtSelection.exec('copy');  break;
      case 'paste': ArtSelection.exec('paste'); break;
      case 'select-all': ArtSelection.exec('selectAll'); break;
      case 'find':  ArtModals.open('modalFind'); break;

      // Перегляд
      case 'orient-portrait':  ArtEditor.setOrientation('portrait');  break;
      case 'orient-landscape': ArtEditor.setOrientation('landscape'); break;
      case 'zoom-75':   ArtEditor.setZoom(75);  break;
      case 'zoom-100':  ArtEditor.setZoom(100); break;
      case 'zoom-125':  ArtEditor.setZoom(125); break;
      case 'zoom-150':  ArtEditor.setZoom(150); break;

      // Вставка
      case 'insert-hr': ArtSelection.exec('insertHorizontalRule'); break;
      case 'insert-table': ArtModals.open('modalTable'); break;

      // Допомога
      case 'shortcuts': ArtModals.open('modalShortcuts'); break;
      case 'about':     ArtModals.open('modalAbout');     break;
    }
  }

  // Програмний виклик дії (з клавіатурних скорочень тощо)
  function dispatch(action) { _dispatch(action, null); }

  return { init, dispatch };
})();
