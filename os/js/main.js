/* Віконце — завантаження, вхід (профілі учнів), вимкнення. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr, lang, setLanguage } = VOS.i18n;
  const { el, $, store, bus } = VOS;

  // Аватари доступні в налаштуваннях профілю.
  const AVATARS = ['fox', 'cat', 'dog', 'panda', 'frog', 'owl'];
  const AVATAR_NAMES = { fox: tr('Лисичка'), cat: tr('Котик'), dog: tr('Песик'), panda: tr('Панда'), frog: tr('Жабка'), lion: tr('Левеня'), rabbit: tr('Зайчик'), bear: tr('Ведмедик'), koala: tr('Коала'), unicorn: tr('Єдиноріг'), owl: tr('Совеня'), penguin: tr('Пінгвін'), chick: tr('Курчатко'), robot: tr('Робот') };

  const profiles = () => store.rawGet('profiles', []);
  const saveProfiles = (list) => store.rawSet('profiles', list);
  const CLASSROOM_DURATION = 45 * 60 * 1000;
  const classroom = () => store.rawGet('classroom', null);
  const lessonRequest = VOS.lessons?.request;
  const previewProfile = lessonRequest?.preview ? { id: VOS.uid('preview-'), name: tr('Перегляд учня'), avatar: 'owl' } : null;
  let previewLoaded = false;
  let expiryTimer;
  let retiring = false;
  let entering = false;
  let sessionFullscreen = false;

  async function purge(id) {
    store.removeProfileData(id);
    if (window.indexedDB) await VOS.db.clearProfile(id);
  }

  async function retire(profile) {
    const pending = new Set(store.rawGet('retiredClassrooms', []));
    pending.add(profile.id);
    store.rawSet('retiredClassrooms', [...pending]);
    if (classroom()?.id === profile.id) store.rawRemove('classroom');
    if (session.profile?.id === profile.id) await VOS.fs.discard();
    await purgeRetired();
  }

  async function purgeRetired() {
    for (const id of store.rawGet('retiredClassrooms', [])) {
      try {
        await purge(id);
        store.rawSet('retiredClassrooms', store.rawGet('retiredClassrooms', []).filter((key) => key !== id));
      } catch (error) { console.warn('[session] очищення відкладено', error); }
    }
  }

  async function checkExpiry() {
    const profile = session.profile;
    if (!profile || store.temporary || entering || retiring || store.canWriteProfile(profile.id)) return;
    retiring = true;
    clearTimeout(expiryTimer);
    show('login');
    try { await retire(profile); }
    finally { window.location.reload(); }
  }

  function scheduleExpiry(profile) {
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(checkExpiry, Math.max(0, profile.expiresAt - Date.now()));
  }

  const session = {
    AVATARS,
    AVATAR_NAMES,
    profile: null,
    updateProfile(patch) {
      if (store.temporary) {
        Object.assign(previewProfile, patch);
        Object.assign(session.profile, patch);
        bus.emit('profile:change', { ...session.profile });
        return;
      }
      const p = classroom();
      if (p?.id !== session.profile.id || !store.canWriteProfile(p.id)) return;
      const updated = { ...p, ...patch };
      if (!store.rawSet('classroom', updated)) return;
      Object.assign(session.profile, updated);
      bus.emit('profile:change', { ...session.profile });
    },
    async powerOff() {
      VOS.shell.closeStart();
      if (!(await VOS.wm.closeAll(false))) return;
      await leave('off', () => bus.emit('power:off', {}));
    },
    async restart() {
      VOS.shell.closeStart();
      if (!(await VOS.wm.closeAll(false))) return;
      await leave('restart');
    },
    async switchUser() {
      VOS.shell.closeStart();
      if (store.temporary) { if (await VOS.wm.closeAll(false)) await leave('login'); return; }
      if (!await VOS.dialog.confirm(tr('Завершити цей сеанс і видалити його роботи з браузера?'), {
        title: tr('Завершити сеанс'), okText: tr('Завершити сеанс'), danger: true,
      })) return;
      retiring = true;
      await retire(session.profile);
      window.location.reload();
    },
  };
  VOS.session = session;

  function requestSessionFullscreen() {
    const page = document.documentElement;
    const request = page.requestFullscreen || page.webkitRequestFullscreen;
    if (!request || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      const pending = request.call(page);
      sessionFullscreen = true;
      pending?.catch(() => { sessionFullscreen = false; });
    } catch { /* Вхід працює і в звичайному вікні. */ }
  }

  function exitSessionFullscreen() {
    if (!sessionFullscreen) return;
    sessionFullscreen = false;
    if ((document.fullscreenElement || document.webkitFullscreenElement) !== document.documentElement) return;
    try {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      exit?.call(document)?.catch(() => {});
    } catch { /* Браузер уже міг вийти з повноекранного режиму. */ }
  }

  function show(id) {
    ['boot', 'login', 'off'].forEach((s) => { $('#' + s).hidden = s !== id; });
    document.body.classList.toggle('session', id === 'desktop');
    if (id !== 'desktop') {
      exitSessionFullscreen();
      VOS.xray.close();
    }
  }

  function boot(next) {
    show('boot');
    const bar = $('#boot .boot-bar span');
    bar.style.transition = 'none';
    bar.style.width = '0%';
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = 'width 1.3s ease'; bar.style.width = '100%'; }));
    let done = false;
    const go = () => { if (done) return; done = true; $('#boot').removeEventListener('pointerdown', go); next(); };
    $('#boot').addEventListener('pointerdown', go);
    setTimeout(go, 1500);
  }

  /* ---------- Вхід ---------- */
  function lessonLoginNote() {
    if (!lessonRequest) return null;
    return el('p.lesson-login-note', lessonRequest.lesson
      ? [tr('Урок «'), el('strong', lessonRequest.lesson.title), tr('». Завдання будуть у Совеняти.')]
      : tr('Посилання на урок пошкоджене або містить невідомі завдання.'));
  }

  function oldProfiles() {
    const initial = profiles();
    if (!initial.length) return null;
    let page = 0;
    const pageSize = 8;
    const query = el('input.input', { type: 'search', placeholder: tr('Знайти старий профіль'), 'aria-label': tr('Знайти старий профіль') });
    const list = el('div.legacy-profiles');
    const prev = el('button.btn', { type: 'button', on: { click: () => { page--; render(); } } }, tr('Назад'));
    const next = el('button.btn', { type: 'button', on: { click: () => { page++; render(); } } }, tr('Далі'));
    const summary = el('summary', tr('Старі профілі (') + initial.length + ')');
    const pageInfo = el('span', { role: 'status' });
    const paging = el('div.legacy-paging', prev, pageInfo, next);
    const details = el('details.legacy-manager', summary, query, list, paging);
    function render() {
      const all = profiles();
      summary.textContent = tr('Старі профілі (') + all.length + ')';
      const needle = query.value.trim().toLocaleLowerCase('uk');
      const matches = all.filter(p => String(p.name).toLocaleLowerCase('uk').includes(needle))
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'uk'));
      const pages = Math.ceil(matches.length / pageSize);
      page = Math.max(0, Math.min(page, pages - 1));
      list.replaceChildren(...matches.slice(page * pageSize, (page + 1) * pageSize).map(p => el('div.legacy-profile',
        el('span', p.name),
        el('button.btn', { type: 'button', 'aria-label': tr('Видалити профіль ') + p.name, on: { click: async () => {
          if (!await VOS.dialog.confirm(tr('Видалити профіль «') + p.name + tr('» разом з усіма його файлами?'), {
            title: tr('Видалення профілю'), okText: tr('Видалити'), danger: true, icon: 'alert',
          })) return;
          try {
            await purge(p.id);
            if (!saveProfiles(profiles().filter(x => x.id !== p.id))) throw new Error();
            if (store.rawGet('lastProfile', null) === p.id) store.rawRemove('lastProfile');
            render();
            query.focus();
          } catch (error) { VOS.dialog.error(tr('Не вдалося видалити профіль. Спробуй ще раз.')); }
        } } }, tr('Видалити')))));
      if (!matches.length) list.append(el('p', tr('Профілів не знайдено.')));
      paging.hidden = pages <= 1;
      prev.disabled = page === 0;
      next.disabled = page + 1 >= pages;
      pageInfo.textContent = (page + 1) + ' / ' + pages;
    }
    query.addEventListener('input', () => { page = 0; render(); });
    render();
    return details;
  }

  async function openClassroom() {
    if (previewProfile) return renderLogin();
    const p = classroom();
    if (p && !store.canWriteProfile(p.id)) await retire(p);
    else if (p) await enter(p);
    if (!p || !store.canWriteProfile(p.id)) renderLogin();
    await purgeRetired();
  }

  function renderLogin() {
    if (previewProfile) {
      show('boot');
      return enter(previewProfile, true);
    }
    const teacher = $('#login-teacher');
    teacher.open = false;
    const context = $('#login-teacher-context');
    const notes = [lessonLoginNote(), oldProfiles()].filter(Boolean);
    context.replaceChildren(...notes);
    context.hidden = !notes.length;
    show('login');
  }

  async function startSession(event) {
    event.preventDefault();
    if (entering || retiring || previewProfile) return;
    const current = classroom();
    if (current && store.canWriteProfile(current.id)) {
      requestSessionFullscreen();
      return enter(current);
    }
    if (current) retire(current).catch(error => console.warn('[session]', error));
    const created = Date.now();
    const profile = {
      id: VOS.uid('classroom-'),
      name: tr('Учень'),
      avatar: 'owl',
      created,
      expiresAt: created + CLASSROOM_DURATION,
    };
    if (!store.rawSet('classroom', profile)) {
      VOS.dialog.error(tr('Браузер не дозволяє зберігати сеанс. Дозволь збереження даних сайту й спробуй ще раз.'));
      return;
    }
    requestSessionFullscreen();
    return enter(profile);
  }

  async function enter(p, temporary = false) {
    if (entering) return;
    entering = true;
    session.profile = { ...p };
    store.profileId = p.id;
    store.temporary = temporary;
    VOS.settings.load();
    try {
      if (!temporary || !previewLoaded) {
        await VOS.fs.load({ temporary });
        if (temporary) previewLoaded = true;
      }
    } catch (e) {
      console.error(e);
      entering = false;
      if (!temporary && !store.canWriteProfile(p.id)) { checkExpiry(); return; }
      if (temporary) {
        $('#login-form').hidden = true;
        $('#login-teacher').hidden = true;
        $('#login-preview-error').hidden = false;
        show('login');
      } else {
        renderLogin();
        VOS.dialog.error(tr('Не вдалося відкрити файли цього профілю. Спробуй оновити сторінку.'));
      }
      return;
    }
    entering = false;
    if (!temporary && !store.canWriteProfile(p.id)) { checkExpiry(); return; }
    if (!temporary) scheduleExpiry(p);
    show('desktop');
    VOS.shell.start();
    VOS.missions.onLogin();
    VOS.sound.play('boot');
    bus.emit('session:start', { profile: p });
  }

  async function leave(where, afterFlush) {
    try {
      if (store.temporary) await VOS.fs.flush(); // попередній перегляд триває в цій вкладці
      else await VOS.fs.unload();
    }
    catch (e) {
      console.error('[session] не вдалося зберегти файли перед виходом', e);
      VOS.dialog.error(tr('Не вдалося зберегти файли. Перевір вільне місце й спробуй ще раз.'));
      return false;
    }
    if (afterFlush) afterFlush();
    VOS.ui.closeMenu();
    $('#helper').hidden = true;
    document.querySelectorAll('.hint-ring').forEach((r) => r.classList.remove('show'));
    if (where === 'off') {
      const praise = VOS.missions.lastCompleted === 'shutdown';
      VOS.missions.lastCompleted = null;
      show('off');
      $('#off .off-praise').hidden = !praise;
    } else if (where === 'restart') {
      boot(openClassroom);
    } else {
      renderLogin();
    }
    return true;
  }

  function init() {
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = tr(node.textContent); });
    document.querySelectorAll('[data-i18n-attrs]').forEach((node) => {
      for (const attr of node.dataset.i18nAttrs.split(' ')) node.setAttribute(attr, tr(node.getAttribute(attr)));
    });
    document.querySelectorAll('.login-language').forEach((button) => {
      const language = button.dataset.language;
      button.setAttribute('aria-pressed', String(language === lang));
      button.addEventListener('click', () => setLanguage(language));
    });
    $('#login-form').addEventListener('submit', startSession);
    $('#login-create-lesson').addEventListener('click', () => VOS.lessons.openBuilder());
    document.querySelectorAll("[data-ico]").forEach((e) => e.prepend(VOS.icon(e.dataset.ico)));
    VOS.wm.init();
    VOS.shell.init();
    VOS.missions.init();
    $('#off .power-on').addEventListener('click', () => boot(openClassroom));
    window.addEventListener('storage', (event) => { if (!event.key || event.key === 'vikontse.classroom') checkExpiry(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkExpiry(); });
    // Не даємо браузеру масштабувати сторінку жестом і відкривати своє меню поза вікнами програм
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('input, textarea, .win-body, [contenteditable]')) e.preventDefault();
    });
    boot(openClassroom);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
