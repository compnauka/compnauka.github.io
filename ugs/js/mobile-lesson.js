// Keep the current action reachable without shrinking text or touch targets.
(() => {
  const stage = document.getElementById('lessonStage');
  if (!stage) return;
  const media = matchMedia('(max-width: 48rem)');
  const dock = document.createElement('nav');
  dock.className = 'lesson-dock';
  dock.setAttribute('aria-label', 'Дії уроку');
  document.body.append(dock);
  const priorities = ['[data-story-next]', '[data-next]', '[data-continue]', '[data-run]', '[data-check]', '[data-save]', '[data-create]', '[data-gallery]', '[data-close]', '[data-retry]', 'a.primary-btn'];
  function available(element) { return element && !element.closest('[hidden]'); }
  function update() {
    const hadFocus = dock.contains(document.activeElement);
    stage.querySelectorAll('[data-mobile-docked]').forEach(element => element.removeAttribute('data-mobile-docked'));
    if (!media.matches) { dock.hidden = true; document.body.classList.remove('has-lesson-dock'); return; }
    dock.hidden = false;
    document.body.classList.add('has-lesson-dock');
    const primary = priorities.map(selector => [...stage.querySelectorAll(selector)].find(available)).find(Boolean);
    const back = [...stage.querySelectorAll('.stage-actions [data-prev], .stage-actions [data-back], .stage-actions [data-step-back], [data-story-prev], [data-repeat-practice]')].find(available);
    dock.replaceChildren();
    function proxy(source, secondary = false) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'secondary-btn' : 'primary-btn';
      button.textContent = source.textContent.trim();
      button.disabled = !!source.disabled;
      button.setAttribute(secondary ? 'data-dock-back' : 'data-dock-primary', '');
      button.addEventListener('click', () => source.click());
      source.setAttribute('data-mobile-docked', '');
      dock.append(button);
      return button;
    }
    if (back) proxy(back, true);
    if (primary) {
      const button = proxy(primary);
      if (hadFocus && !button.disabled) button.focus({ preventScroll: true });
    } else {
      const hint = document.createElement('span');
      hint.className = 'dock-hint';
      hint.textContent = 'Спробуй виконати завдання';
      dock.append(hint);
    }
  }
  new MutationObserver(update).observe(stage, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'disabled', 'class'] });
  media.addEventListener('change', update);
  function fitVisibleViewport() {
    const viewport = window.visualViewport;
    const inset = viewport && viewport.scale === 1 ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0;
    dock.style.bottom = `${inset}px`;
  }
  window.visualViewport?.addEventListener('resize', fitVisibleViewport);
  window.visualViewport?.addEventListener('scroll', fitVisibleViewport);
  fitVisibleViewport();
  update();
})();
