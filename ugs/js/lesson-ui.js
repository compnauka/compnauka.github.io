window.LessonUI = (() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function youtubeId(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return null;
      let id;
      if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
        id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
      }
      return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  }
  function status(points, max) {
    // Every task must be solved independently to claim mastery.
    if (max > 0 && points === max) return 'mastered';
    if (max > 0 && points > max / 2) return 'almost';
    return 'training';
  }
  function nextButton(root, action, label = 'Далі') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary-btn';
    button.dataset.continue = '';
    button.textContent = label;
    button.addEventListener('click', action, { once: true });
    root.querySelector('.stage-actions').append(button);
    button.focus({ preventScroll: true });
  }
  return { escape, shuffle, youtubeId, status, nextButton };
})();
