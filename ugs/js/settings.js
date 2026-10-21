window.AppSettings = (() => {
  const header = document.querySelector('.topbar');
  if (!header) return {};
  const isLesson = !!document.getElementById('lessonStage');
  let audio = true;
  try { audio = localStorage.getItem('digital-minimum-audio-enabled') !== 'false'; } catch {}
  header.className = 'topbar app-header';
  header.innerHTML = `
    <a class="icon-button header-home" href="index.html" aria-label="На головну">${AppIcons.symbol('home')}</a>
    <a class="brand" href="index.html" aria-label="Цифрові суперсили — головна">
      <img class="brand-mark" src="assets/app-icon.svg" alt="" width="36" height="36">
      <span class="brand-stack"><span class="brand-name">Цифрові суперсили</span><span class="brand-sub" ${isLesson ? 'id="skillTopTitle"' : ''}>Ukrainian Global School</span></span>
    </a>
    <div class="header-actions">${isLesson ? `<button class="icon-button" id="speakPage" type="button" aria-label="Прослухати завдання">${AppIcons.symbol('speaker')}</button>` : ''}<button class="icon-button" id="openSettings" type="button" aria-label="Налаштування" aria-haspopup="dialog">${AppIcons.symbol('settings')}</button></div>`;

  const dialog = document.createElement('dialog');
  dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settingsTitle');
  dialog.innerHTML = `<div class="settings-heading"><h2 id="settingsTitle">Налаштування</h2><button class="icon-button" data-close-settings type="button" aria-label="Закрити налаштування">${AppIcons.symbol('close')}</button></div>
    <label class="settings-toggle"><span><strong>Озвучення</strong><small>Кнопка з динаміком читає пояснення вголос.</small></span><input id="audioPreference" type="checkbox" ${audio ? 'checked' : ''}></label>
    <a class="settings-adults" href="adults.html">Для батьків і вчителів ↗</a>
    <details class="adult-settings"><summary>Спільний пристрій</summary><p>Перед початком роботи іншої дитини можна очистити попередній прогрес.</p><button class="secondary-btn" data-reset-progress type="button">Почати для нового учня</button></details>`;
  document.body.append(dialog);
  function sync() {
    document.body.dataset.audio = audio ? 'on' : 'off';
    if (!audio && 'speechSynthesis' in window) speechSynthesis.cancel();
  }
  document.getElementById('openSettings').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-close-settings]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.querySelector('#audioPreference').addEventListener('change', event => {
    audio = event.target.checked;
    try { localStorage.setItem('digital-minimum-audio-enabled', String(audio)); } catch {}
    sync();
  });
  dialog.querySelector('[data-reset-progress]').addEventListener('click', () => {
    if (!confirm('Очистити прогрес на цьому пристрої для іншого учня?')) return;
    ProgressStore.reset();
    dialog.close();
    if (isLesson) location.href = 'index.html';
    else window.dispatchEvent(new Event('ugs-progress-reset'));
  });
  sync();
  return { get audioEnabled() { return audio; } };
})();
