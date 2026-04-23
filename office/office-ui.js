(function () {
  'use strict';

  const focusableSelector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function closeMenus({ restoreFocus = false } = {}) {
    const trigger = qs('.menu-title[aria-expanded="true"]');
    qsa('.menu-dropdown.open').forEach(menu => menu.classList.remove('open'));
    qsa('.menu-title').forEach(title => title.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && trigger) trigger.focus();
    return !!trigger;
  }

  function closePickers({ restoreFocus = false } = {}) {
    let trigger = null;

    qsa('.picker-wrap.open').forEach(wrap => {
      trigger = trigger || qs('.picker-trigger', wrap);
      wrap.classList.remove('open');
    });
    qsa('.tool-picker.open').forEach(wrap => {
      trigger = trigger || qs('.tool-group-trigger', wrap);
      wrap.classList.remove('open');
    });

    qsa('.picker-trigger[aria-expanded="true"], .tool-group-trigger[aria-expanded="true"]').forEach(button => {
      trigger = trigger || button;
      button.setAttribute('aria-expanded', 'false');
      button.classList.remove('active');
    });

    if (restoreFocus && trigger) trigger.focus();
    return !!trigger;
  }

  function closePalettes({ restoreFocus = false } = {}) {
    let trigger = null;
    qsa('.palette-toggle[aria-expanded="true"]').forEach(button => {
      trigger = trigger || button;
      button.setAttribute('aria-expanded', 'false');
    });
    qsa('.palette-popover').forEach(popover => popover.setAttribute('hidden', ''));
    if (restoreFocus && trigger) trigger.focus();
    return !!trigger;
  }

  function closeTopOverlay({ restoreFocus = false } = {}) {
    return closeMenus({ restoreFocus }) ||
      closePickers({ restoreFocus }) ||
      closePalettes({ restoreFocus });
  }

  function openMenuFromTitle(title, focusFirstItem = false) {
    const name = title?.dataset?.menu;
    if (!name) return;
    closeTopOverlay();
    title.setAttribute('aria-expanded', 'true');
    const escapedName = window.CSS?.escape ? CSS.escape(name) : name.replace(/"/g, '\\"');
    const menu = qs(`.menu-dropdown[data-menu="${escapedName}"]`);
    menu?.classList.add('open');
    if (focusFirstItem) {
      qs(focusableSelector, menu)?.focus();
    }
  }

  function moveMenuFocus(menu, current, direction) {
    const items = qsa(focusableSelector, menu);
    if (!items.length) return;
    const currentIndex = Math.max(0, items.indexOf(current));
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex].focus();
  }

  function bindMenuKeyboard() {
    qsa('.menu-title').forEach(title => {
      if (title.dataset.officeKeyboardBound === 'true') return;
      title.dataset.officeKeyboardBound = 'true';
      title.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          openMenuFromTitle(title, true);
        }
        if (event.key === 'Escape') {
          if (closeTopOverlay({ restoreFocus: true })) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      });
    });

    qsa('.menu-dropdown').forEach(menu => {
      if (menu.dataset.officeKeyboardBound === 'true') return;
      menu.dataset.officeKeyboardBound = 'true';
      menu.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeMenus({ restoreFocus: true });
          return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          moveMenuFocus(menu, event.target, event.key === 'ArrowDown' ? 1 : -1);
          return;
        }
        if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          const items = qsa(focusableSelector, menu);
          if (items.length) items[event.key === 'Home' ? 0 : items.length - 1].focus();
        }
      });
    });
  }

  function bindGlobalOverlayBehavior() {
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (closeTopOverlay({ restoreFocus: true })) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    document.addEventListener('pointerdown', event => {
      if (event.target.closest('.menu-item-wrap, .picker-wrap, .tool-picker, .palette-wrap')) return;
      closeTopOverlay();
    }, true);
  }

  function syncAriaOnPointer() {
    document.addEventListener('click', () => {
      requestAnimationFrame(() => {
        qsa('.picker-wrap').forEach(wrap => {
          const trigger = qs('.picker-trigger', wrap);
          if (trigger) trigger.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
        });
        qsa('.tool-picker').forEach(wrap => {
          const trigger = qs('.tool-group-trigger', wrap);
          if (trigger) trigger.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
        });
      });
    }, true);
  }

  function init() {
    bindMenuKeyboard();
    bindGlobalOverlayBehavior();
    syncAriaOnPointer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.OfficeUI = { init, closeTopOverlay, closeMenus, closePickers, closePalettes };
}());
