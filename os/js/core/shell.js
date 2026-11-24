/* Віконце — оболонка: робочий стіл, шпалери, панель задач, меню програм, годинник, сповіщення. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, $, fs, bus, settings } = VOS;

  const WALLPAPERS = {
    dawn: { name: 'Світанок', light: true, css: 'radial-gradient(55% 50% at 12% 18%, #ffd6a5 0, transparent 70%), radial-gradient(50% 45% at 88% 22%, #bde0fe 0, transparent 70%), radial-gradient(65% 55% at 70% 100%, #c3fae8 0, transparent 70%), radial-gradient(45% 40% at 20% 95%, #ffc9de 0, transparent 70%), linear-gradient(160deg, #fff4e6, #e7f5ff)' },
    bubbles: { name: 'Бульбашки', css: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.35) 0 60px, transparent 61px), radial-gradient(circle at 75% 20%, rgba(255,255,255,.25) 0 90px, transparent 91px), radial-gradient(circle at 60% 75%, rgba(255,255,255,.3) 0 50px, transparent 51px), radial-gradient(circle at 90% 85%, rgba(255,255,255,.2) 0 120px, transparent 121px), linear-gradient(135deg, #38d9a9, #3bc9db)' },
    ukraine: { name: 'Поле', css: 'radial-gradient(circle at 20% 22%, #fff 0 3%, transparent 3.5%), radial-gradient(circle at 24% 20%, #fff 0 4%, transparent 4.5%), radial-gradient(circle at 28% 23%, #fff 0 3%, transparent 3.5%), linear-gradient(#4aa3ff 0 55%, #ffd43b 55% 100%)' },
    sky: { name: 'Небо', light: true, css: 'linear-gradient(160deg, #a5d8ff 0%, #d0bfff 55%, #ffd6e7 100%)' },
    sunset: { name: 'Захід сонця', css: 'radial-gradient(circle at 50% 78%, #fff3bf 0 6%, #ffd43b 6.5% 9%, transparent 9.5%), linear-gradient(#5f3dc4 0%, #e64980 45%, #ff922b 75%, #2b8a3e 75.5%, #2f9e44 100%)' },
    ocean: { name: 'Океан', css: 'radial-gradient(140% 40% at 50% 100%, #0b7285 0 45%, transparent 45.5%), repeating-radial-gradient(ellipse at 50% 140%, #1c7ed6 0 18px, #228be6 18px 36px), linear-gradient(#74c0fc, #1971c2)' },
    space: { name: 'Космос', css: 'radial-gradient(circle at 75% 30%, #ffa94d 0 6%, #e8590c 6.5% 7.5%, transparent 8%), radial-gradient(1.5px 1.5px at 10% 20%, #fff 50%, transparent), radial-gradient(1.5px 1.5px at 30% 70%, #fff 50%, transparent), radial-gradient(2px 2px at 55% 15%, #fff 50%, transparent), radial-gradient(1.5px 1.5px at 85% 80%, #fff 50%, transparent), radial-gradient(2px 2px at 65% 55%, #fff 50%, transparent), radial-gradient(1.5px 1.5px at 20% 90%, #fff 50%, transparent), radial-gradient(ellipse at 30% 40%, #3b2a7a, #120c2e 70%)' },
    candy: { name: 'Цукерка', light: true, css: 'repeating-linear-gradient(45deg, #ffe3ef 0 28px, #fff0f6 28px 56px)' },
    forest: { name: 'Ліс', css: 'radial-gradient(60px 120px at 10% 100%, #2b8a3e 98%, transparent), radial-gradient(70px 150px at 25% 100%, #2f9e44 98%, transparent), radial-gradient(60px 110px at 45% 100%, #2b8a3e 98%, transparent), radial-gradient(80px 160px at 70% 100%, #37b24d 98%, transparent), radial-gradient(60px 120px at 90% 100%, #2b8a3e 98%, transparent), linear-gradient(#d3f9d8, #8ce99a)' },
    mint: { name: 'М\'ята', light: true, css: '#63e6be' },
    lemon: { name: 'Лимон', light: true, css: '#ffe066' },
    berry: { name: 'Ягідка', css: '#da77f2' },
    night: { name: 'Ніч', css: '#1e293b' },
  };

  let deskIcons, taskList, startMenu, startBtn, clockBtn, calendarEl = null;

  /* ---------- Сповіщення ---------- */
  function toast(msg, icon = 'info', ms = 3200) {
    const box = $('#toasts');
    const t = el('div.toast', { role: 'status' }, el('span.toast-ico', VOS.ico(icon)), el('span', msg));
    box.append(t);
    setTimeout(() => {
      t.classList.add('hide');
      setTimeout(() => t.remove(), 300);
    }, ms);
  }

  /* ---------- Вигляд ---------- */
  function applyLook() {
    const wp = WALLPAPERS[settings.get('wallpaper')] || WALLPAPERS.dawn;
    $('#desktop').style.background = wp.css;
    document.body.classList.toggle('wp-light', !!wp.light);
    document.body.classList.toggle('theme-dark', settings.get('theme') === 'dark');
    document.body.dataset.icons = settings.get('iconSize');
  }

  /* ---------- Робочий стіл ---------- */
  function renderDesktop() {
    const sel = VOS.ui.selectedId(deskIcons);
    const actions = deskIcons.querySelector('.bg-actions');
    deskIcons.innerHTML = '';
    fs.children('desktop').forEach((n) => deskIcons.append(VOS.ui.renderItem(n)));
    if (actions) deskIcons.append(actions);
    if (sel && fs.get(sel) && fs.get(sel).parent === 'desktop') VOS.ui.select(deskIcons, sel);
  }

  /* ---------- Панель задач ---------- */
  function addTask(win) {
    const b = el('button.task-btn', { type: 'button', title: win.title, dataset: { win: win.id, app: win.app, hint: 'task-' + win.app } },
      el('span.task-ico', { style: { color: (VOS.apps.get(win.app) || {}).color || '' } }, VOS.ico(win.icon)), el('span.task-title', win.title));
    b.addEventListener('click', () => {
      const w = VOS.wm.get(win.id);
      if (!w) return;
      closeStart();
      if (w.minimized) { VOS.wm.restore(w.id); bus.emit('taskbar:switch', { winId: w.id, app: w.app }); }
      else if (VOS.wm.activeId() === w.id) VOS.wm.minimize(w.id);
      else { VOS.wm.focus(w.id); bus.emit('taskbar:switch', { winId: w.id, app: w.app }); }
    });
    b.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const w = VOS.wm.get(win.id);
      if (!w) return;
      VOS.ui.menu(e.clientX, e.clientY - 10, [
        { label: w.minimized ? 'Показати' : 'Згорнути', icon: w.minimized ? 'arrow-up' : 'minus', action: () => (w.minimized ? VOS.wm.restore(w.id) : VOS.wm.minimize(w.id)) },
        { label: 'Закрити вікно', icon: 'x', danger: true, action: () => VOS.wm.close(w.id) },
        { sep: true },
        VOS.explain.appItem(w.app),
      ]);
    });
    taskList.append(b);
    b.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], 160);
  }

  function taskBtn(id) { return taskList.querySelector('[data-win="' + id + '"]'); }

  function bindTaskbar() {
    bus.on('win:open', ({ winId }) => addTask(VOS.wm.get(winId)));
    bus.on('win:close', ({ winId }) => { const b = taskBtn(winId); if (b) b.remove(); });
    bus.on('win:title', ({ winId, title }) => { const b = taskBtn(winId); if (b) { b.title = title; b.querySelector('.task-title').textContent = title; } });
    bus.on('win:focus', ({ winId }) => taskList.querySelectorAll('.task-btn').forEach((b) => b.classList.toggle('active', b.dataset.win === winId)));
    bus.on('win:icon', ({ winId, icon }) => { const b = taskBtn(winId); if (b) b.querySelector('.task-ico').replaceChildren(VOS.ico(icon)); });
    bus.on('win:minimize', ({ winId }) => { const b = taskBtn(winId); if (b) b.classList.add('min'); });
    bus.on('win:unminimize', ({ winId }) => { const b = taskBtn(winId); if (b) b.classList.remove('min'); });

    $('#show-desktop').addEventListener('click', () => {
      closeStart();
      VOS.wm.minimizeAll();
      bus.emit('desktop:show', {});
    });
  }

  /* ---------- Годинник і календар ---------- */
  const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
  function tick() {
    const d = new Date();
    clockBtn.querySelector('.clock-time').textContent = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    clockBtn.querySelector('.clock-date').textContent = d.toLocaleDateString('uk-UA');
    clockBtn.title = d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function toggleCalendar() {
    if (calendarEl) { calendarEl.remove(); calendarEl = null; return; }
    closeStart();
    const today = new Date();
    let y = today.getFullYear(), m = today.getMonth();
    calendarEl = el('div.calendar.popup', { role: 'dialog', 'aria-label': 'Календар' });
    const render = () => {
      calendarEl.innerHTML = '';
      const head = el('div.cal-head',
        el('button.btn-icon', { type: 'button', 'aria-label': 'Попередній місяць', on: { click: () => { if (--m < 0) { m = 11; y--; } render(); } } }, VOS.icon('chevron-left')),
        el('strong', MONTHS[m] + ' ' + y),
        el('button.btn-icon', { type: 'button', 'aria-label': 'Наступний місяць', on: { click: () => { if (++m > 11) { m = 0; y++; } render(); } } }, VOS.icon('chevron-right')));
      const grid = el('div.cal-grid');
      ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].forEach((d, i) => grid.append(el('div.cal-dow' + (i > 4 ? '.we' : ''), d)));
      const first = (new Date(y, m, 1).getDay() + 6) % 7;
      const days = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < first; i++) grid.append(el('div'));
      for (let d = 1; d <= days; d++) {
        const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        const dow = (first + d - 1) % 7;
        grid.append(el('div.cal-day' + (isToday ? '.today' : '') + (dow > 4 ? '.we' : ''), String(d)));
      }
      calendarEl.append(
        el('div.cal-big', today.toLocaleDateString('uk-UA', { weekday: 'long' }), el('br'), el('b', today.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }))),
        head, grid);
    };
    render();
    document.body.append(calendarEl);
    bus.emit('calendar:open', {});
    setTimeout(() => document.addEventListener('pointerdown', function off(e) {
      if (calendarEl && !calendarEl.contains(e.target) && !clockBtn.contains(e.target)) { calendarEl.remove(); calendarEl = null; }
      if (!calendarEl) document.removeEventListener('pointerdown', off, true);
    }, true), 0);
  }

  /* ---------- Кишеня (буфер обміну) ---------- */
  let pocketBtn, pocketSlot, pocketOp, pocketPop = null, pocketShown = null; // pocketShown: { op, id }
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pocketThumb(n) {
    return el('span.pocket-thumb', VOS.ui.renderIcon(n, 'pk-ico'));
  }

  /** Старий значок «виштовхується» з кишені: видно, що вміщається лише одна річ. */
  function popOut(node) {
    if (!node) return;
    if (reducedMotion() || !node.animate) { node.remove(); return; }
    node.style.zIndex = '2';
    node.animate([{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(-22px) scale(.55) rotate(-12deg)', opacity: 0 }], { duration: 320, easing: 'ease-out' }).onfinish = () => node.remove();
  }

  function flyToPocket(id, thumb) {
    const reveal = () => { thumb.classList.remove('pk-wait'); if (!reducedMotion() && thumb.animate) thumb.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.18)', offset: .6 }, { transform: 'scale(1)' }], 220); };
    const items = [...document.querySelectorAll('.item[data-id="' + id + '"]')].filter((i) => i.offsetParent !== null || i.getClientRects().length);
    const src = items.length ? (items.find((i) => i.classList.contains('selected')) || items[items.length - 1]).querySelector('.item-ico') : null;
    if (reducedMotion() || !src || !src.animate) { reveal(); return; }
    const a = src.getBoundingClientRect();
    const b = pocketBtn.querySelector('.pocket-ico').getBoundingClientRect();
    const n = fs.get(id);
    if (!n || !a.width) { reveal(); return; }
    const fly = VOS.ui.renderIcon(n, 'pk-fly');
    Object.assign(fly.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.append(fly);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const k = Math.min(1, 22 / a.width);
    const anim = fly.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .5}px, ${dy * .5 - 40}px) scale(${(1 + k) / 2})`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: .9 },
    ], { duration: 450, easing: 'cubic-bezier(.4,0,.6,1)' });
    anim.onfinish = anim.oncancel = () => { fly.remove(); reveal(); };
  }

  const pocketLabel = (n) => (n ? n.name : '');
  const opText = (op) => (op === 'cut' ? 'Вирізано' : 'Скопійовано');

  /** Оновлює вигляд кишені. animate=true — коли щойно скопіювали щось нове. */
  function updatePocket(animate) {
    const clip = VOS.ui.clipboard;
    const n = clip ? fs.get(clip.id) : null;
    const old = pocketSlot.firstElementChild;
    pocketBtn.classList.toggle('full', !!n);
    pocketBtn.dataset.op = n ? clip.op : '';
    pocketOp.hidden = !n;
    pocketOp.replaceChildren(n ? VOS.icon(clip.op === 'cut' ? 'scissors' : 'copy') : '');
    pocketBtn.title = n ? 'Кишеня: ' + n.name + ' (' + opText(clip.op).toLowerCase() + ')' : 'Кишеня порожня';
    pocketBtn.setAttribute('aria-label', n ? 'Кишеня: ' + n.name + ', ' + opText(clip.op).toLowerCase() : 'Кишеня порожня');
    if (!n) { if (old) animate ? popOut(old) : old.remove(); }
    else if (animate) {
      if (old) popOut(old);
      const t = pocketThumb(n);
      t.classList.add('pk-wait');
      pocketSlot.append(t);
      flyToPocket(clip.id, t);
    } else if (!old || pocketShown.id !== clip.id || !pocketShown.sameName) {
      if (old) old.remove();
      pocketSlot.append(pocketThumb(n));
    }
    pocketShown = n ? { op: clip.op, id: clip.id, sameName: true } : null;
    if (pocketPop) renderPocketPop();
  }

  function renderPocketPop() {
    const clip = VOS.ui.clipboard;
    const n = clip ? fs.get(clip.id) : null;
    pocketPop.innerHTML = '';
    if (!n) {
      pocketPop.append(el('div.pocket-empty', VOS.icon('pocket', 36), el('p', 'Кишеня порожня. Скопіюй файл (Ctrl+C), і він з\'явиться тут.')));
      return;
    }
    pocketPop.append(
      el('div.pocket-now', el('span.pocket-big', VOS.ui.renderIcon(n, 'pk-ico')),
        el('div.pocket-info', el('b', 'У кишені: ' + n.name), el('span.pocket-op-text', VOS.icon(clip.op === 'cut' ? 'scissors' : 'copy'), ' ' + opText(clip.op)))),
      el('p.pocket-note', 'Кишеня (буфер обміну) пам\'ятає лише останнє, що ти скопіював. Щоб вставити — клацни правою кнопкою в папці й вибери «Вставити» або натисни Ctrl+V.'),
      el('button.btn.pocket-clear', { type: 'button', on: { click: () => VOS.ui.clearClipboard() } }, VOS.icon('x'), ' Очистити кишеню'));
  }

  function closePocketPop() {
    if (!pocketPop) return;
    pocketPop.remove();
    pocketPop = null;
    pocketBtn.classList.remove('active');
    pocketBtn.setAttribute('aria-expanded', 'false');
  }

  function togglePocketPop() {
    if (pocketPop) { closePocketPop(); return; }
    closeStart();
    if (calendarEl) { calendarEl.remove(); calendarEl = null; }
    pocketPop = el('div.pocket-pop.popup', { role: 'dialog', 'aria-label': 'Кишеня' });
    renderPocketPop();
    document.body.append(pocketPop);
    pocketBtn.classList.add('active');
    pocketBtn.setAttribute('aria-expanded', 'true');
    bus.emit('pocket:open', {});
    setTimeout(() => document.addEventListener('pointerdown', function off(e) {
      if (pocketPop && !pocketPop.contains(e.target) && !pocketBtn.contains(e.target)) closePocketPop();
      if (!pocketPop) document.removeEventListener('pointerdown', off, true);
    }, true), 0);
  }

  function initPocket() {
    pocketBtn = $('#pocket-btn');
    pocketSlot = pocketBtn.querySelector('.pocket-slot');
    pocketOp = pocketBtn.querySelector('.pocket-op');
    updatePocket(false);
    pocketBtn.addEventListener('click', togglePocketPop);
    pocketBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      VOS.ui.menu(e.clientX, e.clientY - 10, [
        { label: 'Очистити кишеню', icon: 'x', disabled: !VOS.ui.clipboard, action: () => VOS.ui.clearClipboard() },
        ...VOS.explain.sepAndItem(() => ({ ...VOS.explain.kind('pocket') })),
      ], { target: 'pocket' });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pocketPop) { closePocketPop(); pocketBtn.focus(); } });
    bus.on('clipboard:change', (d) => updatePocket(!!(d && d.op)));
    // видалили назавжди — у кишені порожньо; перейменували — оновити підпис
    bus.on('fs:change', () => {
      const clip = VOS.ui.clipboard;
      if (clip && !fs.get(clip.id)) VOS.ui.clearClipboard();
      else {
        if (pocketShown) pocketShown.sameName = false;
        updatePocket(false);
      }
    });
  }

  /* ---------- Меню програм (у Windows — «Пуск») ---------- */
  const PINNED = ['explorer', 'notepad', 'paint', 'calculator', 'photos', 'missions', 'drukaryk', 'penslyk', 'settings'];

  function appButton(a, cls = 'start-app') {
    return el('button.' + cls, { type: 'button', dataset: { app: a.id, hint: 'start-' + a.id }, title: a.desc || a.name, on: { click: () => { closeStart(); VOS.apps.launch(a.id); } } },
      el('span.app-tile.sm', { style: { '--tile': a.color || '#64748b' } }, VOS.icon(a.icon)), el('span.start-app-name', a.name));
  }

  function openStart() {
    if (calendarEl) { calendarEl.remove(); calendarEl = null; }
    const p = VOS.session.profile;
    startMenu.innerHTML = '';
    const search = el('input.start-search', { type: 'search', placeholder: 'Пошук програм…', 'aria-label': 'Пошук програм', autocomplete: 'off', dataset: { hint: 'start-search' } });
    const body = el('div.start-body');
    const renderHome = () => {
      body.innerHTML = '';
      const pinned = el('div.start-pinned');
      PINNED.map(VOS.apps.get).filter(Boolean).forEach((a) => pinned.append(appButton(a, 'start-tile')));
      body.append(el('h3.start-h', 'Закріплені'), pinned, el('h3.start-h', 'Усі програми'));
      VOS.apps.CATEGORIES.forEach((c) => {
        const apps = VOS.apps.list(c.id);
        if (!apps.length) return;
        const det = el('details.start-cat', { open: c.id === 'standard' }, el('summary', c.name, el('span.cnt', String(apps.length))));
        apps.forEach((a) => det.append(appButton(a)));
        body.append(det);
      });
    };
    const renderSearch = (q) => {
      body.innerHTML = '';
      const low = q.toLocaleLowerCase('uk');
      const res = VOS.apps.list().filter((a) => (a.name + ' ' + (a.desc || '')).toLocaleLowerCase('uk').includes(low));
      body.append(el('h3.start-h', 'Знайдено: ' + res.length));
      if (!res.length) body.append(el('p.start-empty', 'Нічого не знайдено. Спробуй інше слово.'));
      res.forEach((a) => body.append(appButton(a)));
    };
    search.addEventListener('input', VOS.debounce(() => {
      const q = search.value.trim();
      if (q) { renderSearch(q); bus.emit('start:search', { q }); } else renderHome();
    }, 150));
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = body.querySelector('.start-app, .start-tile');
        if (first) first.click();
      }
    });
    renderHome();

    const powerBtn = el('button.start-power', { type: 'button', title: 'Вимкнення', 'aria-label': 'Вимкнення', dataset: { hint: 'power' } }, VOS.icon('power'));
    powerBtn.addEventListener('click', (e) => {
      const r = powerBtn.getBoundingClientRect();
      VOS.ui.menu(r.left, r.top - 150, [
        { label: 'Вимкнути', icon: 'power', hint: 'power-off', action: () => VOS.session.powerOff() },
        { label: 'Перезавантажити', icon: 'refresh', action: () => VOS.session.restart() },
        { label: 'Завершити сеанс', icon: 'users', action: () => VOS.session.switchUser() },
        ...VOS.explain.sepAndItem(() => ({ ...VOS.explain.kind('power') })),
      ], { target: 'power' });
      e.stopPropagation();
    });
    startMenu.append(
      el('div.start-top', el('span.start-avatar', VOS.icons.avatar(p.avatar)), el('div.start-user', el('b', p.name), el('small', 'Учень')), powerBtn),
      el('label.start-search-wrap', VOS.icon('search'), search),
      body,
      el('div.start-bottom',
        el('button.start-link', { type: 'button', on: { click: () => { closeStart(); VOS.apps.launch('explorer', { folder: 'docs' }); } } }, VOS.icon('books'), ' Документи'),
        el('button.start-link', { type: 'button', on: { click: () => { closeStart(); VOS.apps.launch('settings'); } } }, VOS.icon('settings'), ' Налаштування'),
        el('button.start-link', { type: 'button', on: { click: () => { closeStart(); VOS.apps.launch('help'); } } }, VOS.icon('help'), ' Довідка'))
    );
    startMenu.classList.add('open');
    startBtn.classList.add('active');
    startBtn.setAttribute('aria-expanded', 'true');
    if (!VOS.isCompact() && matchMedia('(pointer: fine)').matches) setTimeout(() => search.focus(), 50);
    bus.emit('start:open', {});
  }

  function closeStart() {
    if (!startMenu.classList.contains('open')) return;
    startMenu.classList.remove('open');
    startBtn.classList.remove('active');
    startBtn.setAttribute('aria-expanded', 'false');
    bus.emit('start:close', {});
  }
  const toggleStart = () => (startMenu.classList.contains('open') ? closeStart() : openStart());

  /* ---------- Ініціалізація ---------- */
  function init() {
    deskIcons = $('#desk-icons');
    taskList = $('#task-list');
    startMenu = $('#start-menu');
    startBtn = $('#start-btn');
    clockBtn = $('#clock');

    VOS.ui.bindItems(deskIcons, {
      folder: () => 'desktop',
      extraBgMenu: () => [
        { sep: true },
        { label: 'Змінити шпалери…', icon: 'palette', hint: 'bg-wallpaper', action: () => VOS.apps.launch('settings', { page: 'look' }) },
        { label: 'Налаштування', icon: 'settings', action: () => VOS.apps.launch('settings') },
      ],
    });
    VOS.transfer.bindDrop(deskIcons, () => 'desktop');
    bus.on('fs:change', ({ parents, reset }) => {
      if (reset || parents.includes('desktop') || parents.includes('trash')) renderDesktop();
    });
    bus.on('clipboard:change', renderDesktop);
    bus.on('settings:change', applyLook);
    bus.on('settings:showExt', renderDesktop);
    initPocket();

    startBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleStart(); });
    startBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      VOS.ui.menu(e.clientX, e.clientY - 10, [
        { label: 'Відкрити меню', icon: 'logo', action: () => { if (!startMenu.classList.contains('open')) toggleStart(); } },
        ...VOS.explain.sepAndItem(() => ({ ...VOS.explain.kind('start') })),
      ], { target: 'start-button' });
    });
    $('#taskbar').addEventListener('contextmenu', (e) => {
      e.preventDefault();
      VOS.ui.menu(e.clientX, e.clientY - 10, [
        { label: 'Показати робочий стіл', icon: 'monitor', action: () => { closeStart(); VOS.wm.minimizeAll(); bus.emit('desktop:show', {}); } },
        ...VOS.explain.sepAndItem(() => ({ ...VOS.explain.kind('taskbar') })),
      ], { target: 'taskbar' });
    });
    document.addEventListener('pointerdown', (e) => {
      if (startMenu.classList.contains('open') && !startMenu.contains(e.target) && !startBtn.contains(e.target) && !e.target.closest('.ctx-menu')) closeStart();
    });
    document.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('session')) return;
      if (e.key === 'Escape' && startMenu.classList.contains('open')) closeStart();
      if (e.key === 'Escape' && e.ctrlKey) { e.preventDefault(); toggleStart(); }
    });
    clockBtn.addEventListener('click', toggleCalendar);
    bindTaskbar();
    tick();
    setInterval(tick, 10000);

    bus.on('store:full', () => toast('Пам\'ять переповнена! Видали непотрібні малюнки й очисти кошик.', 'alert', 6000));
  }

  function start() {
    applyLook();
    renderDesktop();
    taskList.innerHTML = '';
  }

  VOS.shell = { init, start, renderDesktop, applyLook, openStart, closeStart, toast, WALLPAPERS };
  VOS.toast = toast;
})();
