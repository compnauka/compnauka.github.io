'use strict';
/* ui/toolbar.js — панель форматування */

const ArtToolbar = (() => {
  let _editor = null;

  const FONTS = [
    'Arial', 'Times New Roman', 'Calibri', 'Verdana',
    'Georgia', 'Courier New', 'Trebuchet MS',
  ];

  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  function init(editorEl) {
    _editor = editorEl;
    _buildFontSelect();
    _buildSizeSelect();
    _bindEvents();
  }

  // ── Побудова <select> шрифтів ──────────────
  function _buildFontSelect() {
    const sel = document.getElementById('tbFontFamily');
    if (!sel) return;
    sel.innerHTML = '';
    FONTS.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      opt.style.fontFamily = f;
      if (f === ArtState.get('fontFamily')) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      applyFont(sel.value);
    });
  }

  // ── Побудова <select> розмірів ─────────────
  function _buildSizeSelect() {
    const sel = document.getElementById('tbFontSize');
    if (!sel) return;
    sel.innerHTML = '';
    SIZES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === ArtState.get('fontSize')) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      applySize(Number(sel.value));
    });
  }

  // ── Прив'язка кнопок ───────────────────────
  function _bindEvents() {
    document.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        _editor.focus();
        ArtSelection.exec(cmd);
        updateState();
        ArtHistory.push(_editor.innerHTML);
      });
    });

    _bindColorMenus();

    _editor.addEventListener('keyup',   updateState);
    _editor.addEventListener('mouseup', updateState);
    _editor.addEventListener('focus',   updateState);
  }

  function _bindColorMenus() {
    const setups = [
      {
        button: document.getElementById('tbTextColorBtn'),
        menu: document.getElementById('tbTextColorMenu'),
        grid: document.getElementById('tbTextColorGrid'),
        more: document.getElementById('tbTextColorMore'),
        nativeInput: document.getElementById('tbTextColorNative'),
        palette: ['#1e293b','#000000','#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'],
        apply: applyColor,
      },
      {
        button: document.getElementById('tbHighlightBtn'),
        menu: document.getElementById('tbHighlightMenu'),
        grid: document.getElementById('tbHighlightGrid'),
        more: document.getElementById('tbHighlightMore'),
        nativeInput: document.getElementById('tbHighlightNative'),
        palette: ['#fef08a','#fde68a','#fdba74','#fecaca','#bfdbfe','#c7d2fe','#ddd6fe','#bbf7d0','#a5f3fc','#e5e7eb'],
        apply: applyHighlight,
      }
    ];

    setups.forEach(setup => {
      if (!setup.button || !setup.menu || !setup.grid) return;
      setup.grid.innerHTML = '';
      setup.palette.forEach(color => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'color-swatch';
        swatch.style.background = color;
        swatch.setAttribute('aria-label', `Колір ${color}`);
        swatch.addEventListener('click', e => {
          e.preventDefault();
          setup.apply(color);
          _closeColorMenus();
        });
        setup.grid.appendChild(swatch);
      });

      setup.button.addEventListener('click', e => {
        e.preventDefault();
        const willOpen = !setup.menu.classList.contains('open');
        _closeColorMenus();
        setup.menu.classList.toggle('open', willOpen);
        setup.button.setAttribute('aria-expanded', String(willOpen));
      });

      setup.more?.addEventListener('click', e => {
        e.preventDefault();
        setup.nativeInput?.click();
      });

      setup.nativeInput?.addEventListener('input', () => {
        setup.apply(setup.nativeInput.value);
        _closeColorMenus();
      });
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.color-tool')) _closeColorMenus();
    });
  }

  function _closeColorMenus() {
    document.querySelectorAll('.color-menu.open').forEach(menu => menu.classList.remove('open'));
    document.querySelectorAll('#tbTextColorBtn, #tbHighlightBtn').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  }

  // ── Форматування ───────────────────────────
  function applyFont(family) {
    _editor.focus();
    ArtSelection.exec('fontName', family);
    ArtState.set('fontFamily', family);
    ArtHistory.push(_editor.innerHTML);
    updateState();
  }

  function applySize(pt) {
    _editor.focus();
    const listItems = ArtSelection.getSelectedListItems();
    if (listItems.length) {
      listItems.forEach(li => { li.style.fontSize = pt + 'pt'; });
    } else {
      ArtSelection.applyInlineStyle({ 'font-size': pt + 'pt' });
    }
    ArtState.set('fontSize', pt);
    ArtHistory.push(_editor.innerHTML);
    updateState();
  }

  function applyAlign(side) {
    const map = {
      left:    'justifyLeft',
      center:  'justifyCenter',
      right:   'justifyRight',
      justify: 'justifyFull',
    };
    _editor.focus();
    ArtSelection.exec(map[side] || 'justifyLeft');
    ArtHistory.push(_editor.innerHTML);
    updateState();
  }

  function applyHeading(tag) {
    _editor.focus();
    ArtSelection.exec('formatBlock', tag);
    ArtHistory.push(_editor.innerHTML);
    updateState();
  }

  function applyColor(color) {
    _editor.focus();
    const listItems = ArtSelection.getSelectedListItems();
    if (listItems.length) {
      listItems.forEach(li => {
        li.style.color = color;
        li.style.textDecorationColor = color;
      });
    } else {
      ArtSelection.applyInlineStyle({ color, 'text-decoration-color': color });
    }
    ArtHistory.push(_editor.innerHTML);
  }

  function applyHighlight(color) {
    _editor.focus();
    const listItems = ArtSelection.getSelectedListItems();
    if (listItems.length) {
      listItems.forEach(li => { li.style.backgroundColor = color; });
    } else {
      ArtSelection.applyInlineStyle({ 'background-color': color });
    }
    ArtHistory.push(_editor.innerHTML);
  }

  // ── Оновлення активних кнопок ──────────────
  function updateState() {
    const cmds = ['bold','italic','underline','strikeThrough',
                  'insertUnorderedList','insertOrderedList'];
    cmds.forEach(cmd => {
      const btn = document.querySelector(`[data-cmd="${cmd}"]`);
      if (btn) btn.classList.toggle('active', ArtSelection.queryState(cmd));
    });

    // Оновити undo/redo
    const undoBtn = document.getElementById('tbUndo');
    const redoBtn = document.getElementById('tbRedo');
    if (undoBtn) undoBtn.disabled = !ArtHistory.canUndo();
    if (redoBtn) redoBtn.disabled = !ArtHistory.canRedo();
  }

  return {
    init,
    applyFont, applySize,
    applyAlign, applyHeading,
    applyColor, applyHighlight,
    updateState,
    FONTS, SIZES,
  };
})();
