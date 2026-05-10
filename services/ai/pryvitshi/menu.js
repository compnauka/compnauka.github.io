export function initMenu({ menuBtn, closeMenuBtn, sidebar, overlay }) {
  const isOpen = () => !sidebar.classList.contains('app-sidebar--hidden');

  function toggle(show) {
    menuBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (show) {
      sidebar.classList.remove('app-sidebar--hidden');
      overlay.classList.remove('app-overlay--hidden');
      requestAnimationFrame(() => overlay.classList.remove('app-overlay--transparent'));
      closeMenuBtn.focus();
    } else {
      sidebar.classList.add('app-sidebar--hidden');
      overlay.classList.add('app-overlay--transparent');
      setTimeout(() => overlay.classList.add('app-overlay--hidden'), 300);
      menuBtn.focus();
    }
  }

  function close() { toggle(false); }

  menuBtn.addEventListener('click', () => toggle(true));
  closeMenuBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 1024) close();
    }, 250);
  });

  return { close };
}
