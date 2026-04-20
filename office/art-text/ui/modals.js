'use strict';
/* ui/modals.js — всі модальні вікна */

const ArtModals = (() => {
  let _confirmCb = null;

  function open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    // Фокус на першому інтерактивному елементі
    requestAnimationFrame(() => {
      (el.querySelector('[data-autofocus]') || el.querySelector('button'))?.focus();
    });
  }

  function close(id) {
    document.getElementById(id)?.classList.remove('active');
  }

  function closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(el => {
      el.classList.remove('active');
    });
  }

  function info(title, text) {
    document.getElementById('modalInfoTitle').textContent = title;
    document.getElementById('modalInfoText').textContent  = text;
    open('modalInfo');
  }

  function confirm(text, onYes, onNo = null) {
    document.getElementById('modalConfirmText').textContent = text;
    _confirmCb = { yes: onYes, no: onNo };
    open('modalConfirm');
  }

  function confirmYes() {
    close('modalConfirm');
    _confirmCb?.yes?.();
    _confirmCb = null;
  }

  function confirmNo() {
    close('modalConfirm');
    _confirmCb?.no?.();
    _confirmCb = null;
  }

  // Закривати модалки по Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });

  // Закривати по кліку на overlay
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAll();
  });

  return { open, close, closeAll, info, confirm, confirmYes, confirmNo };
})();
