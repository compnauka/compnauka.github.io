/* Віконце — рушій завдань, помічник Совеня, програма «Завдання» і грамота. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, $, bus, store } = VOS;

  let active = null; // { m, step, ctx }
  let panel, ring, hintTarget, ringTimer = null, ringRaf = null;
  let lesson = null;
  const lessonRuns = new Map();

  const progress = () => store.get('progress', {});
  const isDone = (id) => !!progress()[id];
  const available = () => VOS.MISSIONS.filter((m) => !(m.desktopOnly && VOS.isCompact()));
  const doneCount = () => available().filter((m) => isDone(m.id)).length;

  function markDone(id) {
    const p = progress();
    p[id] = { ts: Date.now() };
    store.set('progress', p);
    updateBadge();
  }

  function updateBadge() {
    const b = $('#helper-btn .helper-count');
    if (b) b.textContent = lesson && !panel.hidden ? lessonDoneCount() + '/' + lesson.ids.length : '';
  }

  const lessonDoneCount = () => lesson.results.filter((status) => status === 'done').length;

  /* ---------- Підсвічування ---------- */
  function visible(e) {
    if (!e || !(e instanceof Element) || !e.isConnected) return false;
    if (e.closest('.minimized, [hidden]')) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function resolve(h, ctx) {
    if (!h) return null;
    if (Array.isArray(h)) { for (const x of h) { const r = resolve(x, ctx); if (r) return r; } return null; }
    let r = h;
    if (typeof r === 'function') r = r(ctx);
    if (typeof r === 'function') r = r();
    if (typeof r === 'string') r = [...document.querySelectorAll(r)].find(visible) || null;
    return visible(r) ? r : null;
  }

  function hideRing() {
    clearTimeout(ringTimer);
    cancelAnimationFrame(ringRaf);
    if (ring) ring.classList.remove('show');
    if (hintTarget) hintTarget.classList.remove('hint-target');
    hintTarget = null;
  }

  function showHint() {
    if (!active) return;
    const step = active.m.steps[active.step];
    const target = resolve(step.hint, active.ctx);
    if (!target) {
      VOS.toast(step.tip || 'Уважно прочитай завдання — у тебе все вийде!', 'bulb', 4500);
      return;
    }
    if (!ring) { ring = el('div.hint-ring', { 'aria-hidden': 'true' }); document.body.append(ring); }
    hideRing();
    hintTarget = target;
    hintTarget.classList.add('hint-target');
    const follow = () => {
      if (!visible(target)) { hideRing(); return; }
      const r = target.getBoundingClientRect();
      const pad = 6;
      Object.assign(ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      ringRaf = requestAnimationFrame(follow);
    };
    ring.classList.add('show');
    follow();
    ringTimer = setTimeout(hideRing, 6000);
    if (step.tip) VOS.toast(step.tip, 'bulb', 4500);
  }

  /* ---------- Хід завдання ---------- */
  function start(id) {
    if (lesson && (lesson.ids[lesson.index] !== id || lesson.results[lesson.index] === 'done')) return false;
    const m = available().find((x) => x.id === id);
    if (!m) return false;
    hideRing();
    active = null;
    const ctx = { state: {} };
    try {
      if (m.setup) m.setup(ctx);
    } catch (e) {
      console.error(e);
      VOS.dialog.error('Не вдалося підготувати завдання. Спробуй почати його ще раз.');
      render();
      return false;
    }
    active = { m, step: 0, ctx };
    skipCompactSteps();
    openPanel();
    render();
    updateMissionDot();
    bus.emit('mission:start', { id });
    return true;
  }

  function skipCompactSteps() {
    while (active && active.step < active.m.steps.length && active.m.steps[active.step].skipCompact && VOS.isCompact()) active.step++;
  }

  function stop() {
    active = null;
    hideRing();
    updateMissionDot();
    render();
  }

  function onEvent(data, type) {
    if (!active || type.startsWith('mission:')) return;
    const step = active.m.steps[active.step];
    if (!step) return;
    let ok = false;
    try { ok = !!step.check(type, data || {}, active.ctx); } catch (e) { ok = false; }
    if (!ok) return;
    hideRing();
    active.step++;
    skipCompactSteps();
    if (active.step >= active.m.steps.length) complete();
    else {
      if (!panel.hidden && !panel.classList.contains('collapsed')) VOS.sound.play('step');
      render(true);
    }
  }

  function complete() {
    const m = active.m;
    const first = !isDone(m.id);
    markDone(m.id);
    active = null;
    const showing = !panel.hidden && !panel.classList.contains('collapsed');
    if (showing) VOS.sound.play('win');
    bus.emit('mission:done', { id: m.id });
    VOS.missions.lastCompleted = m.id;
    updateMissionDot();
    if (lesson) {
      lesson.results[lesson.index] = 'done';
      if (lesson.index === lesson.ids.length - 1) lesson.index++;
      updateBadge();
      render();
    } else if (showing) renderDone(m, first);
  }

  /** Крапка на кнопці Совеня: завдання триває, навіть коли панель схована. */
  function updateMissionDot() {
    const b = $('#helper-btn');
    if (b) {
      b.classList.toggle('mission-on', !!active || !!lesson);
      b.setAttribute('aria-label', lesson ? 'Совеня: урок від учителя' : 'Помічник і завдання');
    }
  }

  function nextMission(afterId) {
    const list = available();
    const i = list.findIndex((m) => m.id === afterId);
    return list.slice(i + 1).find((m) => !isDone(m.id)) || list.find((m) => !isDone(m.id)) || null;
  }

  /* ---------- Урок за посиланням ---------- */
  function freshLesson(spec) {
    return { title: spec.title, ids: spec.ids, results: spec.ids.map(() => null), index: 0 };
  }

  function exitLesson() {
    lessonRuns.set(store.profileId, null);
    lesson = null;
    stop();
    updateBadge();
  }

  function showLessonStage() {
    active = null;
    hideRing();
    openPanel();
    const eligible = available();
    while (lesson.index < lesson.ids.length && lesson.results[lesson.index] !== 'done'
      && !eligible.some((mission) => mission.id === lesson.ids[lesson.index])) {
      lesson.results[lesson.index] = 'skipped';
      lesson.index++;
    }
    if (lesson.index < lesson.ids.length && lesson.results[lesson.index] !== 'done') start(lesson.ids[lesson.index]);
    else render();
    updateBadge();
  }

  function lessonContext() {
    const title = VOS.lessons?.request?.preview ? 'Перегляд учня · ' + lesson.title : lesson.title;
    const skipped = lesson.results.filter((status) => status === 'skipped').length;
    const status = 'Виконано ' + lessonDoneCount() + ' з ' + lesson.ids.length;
    return el('div.lesson-context', el('b', title), el('small', status + (skipped ? ' · пропущено ' + skipped : '')));
  }

  function lessonSummary() {
    const titles = lesson.ids.map((id) => VOS.MISSIONS.find((mission) => mission.id === id).title);
    const exitBtn = el('button.btn', { type: 'button', on: { click: exitLesson } }, 'Вийти з уроку');
    const current = lesson.index;
    if (current === lesson.ids.length) {
      const results = el('ol.lesson-result-list');
      const count = lessonDoneCount();
      titles.forEach((title, i) => results.append(el('li', title, el('small', lesson.results[i] === 'done' ? 'Виконано' : 'Пропущено · потрібен великий екран'))));
      return el('div.hp-body', lessonContext(),
        el('p.hp-say.big', count ? 'Урок завершено!' : 'Для цього уроку потрібен великий екран.'),
        results,
        el('div.hp-actions',
          el('button.btn.btn-primary', { type: 'button', on: { click: () => {
            lesson = freshLesson(lesson);
            lessonRuns.set(store.profileId, lesson);
            showLessonStage();
          } } }, 'Повторити урок'), exitBtn));
    }

    const done = lesson.results[current] === 'done';
    return el('div.hp-body', lessonContext(),
      el('p.hp-say.big', done ? 'Завдання «' + titles[current] + '» виконано!' : 'Почнімо завдання «' + titles[current] + '».'),
      el('div.hp-actions',
        el('button.btn.btn-primary', { type: 'button', on: { click: () => {
          if (done) lesson.index++;
          showLessonStage();
        } } }, done ? 'Далі' : 'Почати завдання'), exitBtn));
  }

  /* ---------- Панель помічника ---------- */
  function openPanel() {
    panel.hidden = false;
    panel.classList.remove('collapsed');
    $('#helper-btn').classList.add('active');
    updateBadge();
  }
  function closePanel() {
    panel.hidden = true;
    $('#helper-btn').classList.remove('active');
    hideRing();
    updateBadge();
  }
  function togglePanel() {
    if (panel.hidden) { openPanel(); render(); } else closePanel();
  }

  function head(title) {
    return el('div.hp-head',
      el('span.hp-owl', VOS.icon('owl')), el('b.hp-title', title),
      el('button.hp-x', { type: 'button', title: 'Згорнути помічника', 'aria-label': 'Згорнути помічника', on: { click: () => panel.classList.toggle('collapsed') } }, VOS.icon('chevron-down')),
      el('button.hp-x', { type: 'button', title: active ? 'Сховати (завдання продовжиться)' : 'Сховати', 'aria-label': 'Сховати помічника', on: { click: closePanel } }, VOS.icon('x')));
  }

  const touchMQ = window.matchMedia('(pointer: coarse)');
  function stepText(step, ctx) {
    const text = (touchMQ.matches && step.touchText) || step.text;
    return typeof text === 'function' ? text(ctx) : text;
  }

  function render(animate) {
    if (!panel || panel.hidden) return;
    panel.innerHTML = '';
    if (!active) {
      if (lesson) {
        panel.append(head('Урок'), lessonSummary());
        return;
      }
      const list = el('div.hp-list');
      available().forEach((m) => list.append(el('button.hp-mission' + (isDone(m.id) ? '.done' : ''), { type: 'button', on: { click: () => start(m.id) } },
        el('span.hp-m-ico', VOS.icon(m.icon)), el('span.hp-m-title', m.title), el('span.hp-m-star', isDone(m.id) ? VOS.icon('st-star') : VOS.icon('star')))));
      panel.append(head('Совеня'),
        el('div.hp-body',
          el('p.hp-say', doneCount() ? 'Обери наступне завдання. Ти вже маєш ' + doneCount() + ' ' + VOS.plural(doneCount(), 'зірочку', 'зірочки', 'зірочок') + '!' : 'Привіт, ' + VOS.session.profile.name + '! Я допоможу тобі навчитися працювати з комп\'ютером. Обери завдання:'),
          list));
      return;
    }
    const { m, step } = active;
    const steps = el('ol.hp-steps');
    m.steps.forEach((s, i) => {
      if (s.skipCompact && VOS.isCompact()) return;
      steps.append(el('li' + (i < step ? '.done' : i === step ? '.current' : ''), i < step ? VOS.icon('check') : '', stepText(s, active.ctx)));
    });
    const cur = m.steps[step];
    const total = m.steps.filter((s) => !(s.skipCompact && VOS.isCompact())).length;
    const doneN = m.steps.slice(0, step).filter((s) => !(s.skipCompact && VOS.isCompact())).length;
    const body = el('div.hp-body',
      lesson ? lessonContext() : null,
      el('div.hp-mtitle', VOS.icon(m.icon), ' ', m.title),
      el('div.meter.small', el('span', { style: { width: Math.round((doneN / total) * 100) + '%' } })),
      el('p.hp-say.big' + (animate ? '.pop' : ''), stepText(cur, active.ctx)),
      el('div.hp-actions',
        el('button.btn.btn-primary', { type: 'button', on: { click: showHint } }, VOS.icon('bulb'), ' Підказка'),
        el('button.btn', { type: 'button', 'aria-label': 'Почати завдання спочатку', on: { click: () => start(m.id) } }, 'Спочатку'),
        el('button.btn', { type: 'button', on: { click: lesson ? exitLesson : stop } }, lesson ? 'Вийти з уроку' : 'Припинити')),
      lesson ? null : el('p.hp-free', 'Можна сховати Совеня й досліджувати самостійно — завдання зарахується, щойно ти все зробиш.'),
      el('details.hp-all', el('summary', 'Усі кроки (' + doneN + ' з ' + total + ')'), steps));
    panel.append(head('Завдання'), body);
  }

  function renderDone(m, first) {
    openPanel();
    panel.innerHTML = '';
    const next = nextMission(m.id);
    panel.append(head('Молодець!'),
      el('div.hp-body.hp-done',
        el('div.hp-bigstar', VOS.icon('st-star', 72)),
        el('p.hp-say.big', 'Завдання «' + m.title + '» виконано!'),
        el('p.hp-say', first ? 'Ти отримуєш зірочку. Уже ' + doneCount() + ' з ' + available().length + '.' : 'Чудове повторення!'),
        el('div.hp-actions',
          next ? el('button.btn.btn-primary', { type: 'button', on: { click: () => start(next.id) } }, VOS.icon(next.icon), ' Далі: ' + next.title) : null,
          !next ? el('button.btn.btn-primary', { type: 'button', on: { click: certificate } }, VOS.icon('trophy'), ' Отримати грамоту') : null,
          el('button.btn', { type: 'button', on: { click: () => render() } }, 'До списку'))));
  }

  /* ---------- Програма «Завдання» ---------- */
  function launchApp() {
    if (lesson) {
      openPanel();
      render();
      return null;
    }
    const root = el('div.app-missions');
    const render = () => {
      root.innerHTML = '';
      const all = available();
      const d = doneCount();
      root.append(
        el('div.ms-hero', el('span.ms-owl', VOS.icon('owl', 64)),
          el('div', el('b', 'Завдання від Совеня'), el('p', 'Виконуй завдання й збирай зірочки. Якщо щось не виходить — натисни «Підказка».'),
            el('div.meter', el('span', { style: { width: Math.round((d / all.length) * 100) + '%' } })),
            el('small', 'Зірочок: ' + d + ' з ' + all.length))),
        d === all.length ? el('button.btn.btn-primary.ms-cert', { type: 'button', on: { click: certificate } }, VOS.icon('trophy'), ' Отримати грамоту') : '');
      const grid = el('div.ms-grid');
      all.forEach((m, i) => grid.append(el('button.ms-card' + (isDone(m.id) ? '.done' : ''), { type: 'button', on: { click: () => { start(m.id); win.close(); } } },
        el('span.ms-num', String(i + 1)), el('span.ms-ico', VOS.icon(m.icon)), el('b', m.title), el('small', m.desc), el('span.ms-star', isDone(m.id) ? [VOS.icon('st-star'), ' Виконано'] : [VOS.icon('star'), ' Почати']))));
      root.append(grid);
      if (VOS.MISSIONS.some((m) => m.desktopOnly) && VOS.isCompact()) root.append(el('p.set-note', 'Деякі завдання з перетягуванням вікон доступні лише на великому екрані.'));
    };
    const off = bus.on('mission:done', render);
    const win = VOS.wm.open({ app: 'missions', singleton: 'missions', title: 'Завдання', icon: 'star', content: root, width: 760, height: 540, minWidth: 320, minHeight: 300, onClose: off });
    render();
    return win;
  }

  /* ---------- Грамота ---------- */
  function certificate() {
    const p = VOS.session.profile;
    const date = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    const cert = el('div.certificate',
      el('div.cert-top', VOS.icon('trophy', 64)),
      el('h1', 'ГРАМОТА'),
      el('p', 'вручається'),
      el('h2.cert-name', VOS.icons.avatar(p.avatar), ' ', p.name),
      el('p', 'за успішне виконання всіх завдань у навчальній операційній системі «Віконце»'),
      el('ul.cert-list', available().map((m) => el('li', VOS.icon('st-star'), ' ', m.title))),
      el('p.cert-date', date),
      el('p.cert-sign', VOS.icon('owl', 36), ' Совеня'));
    const printBtn = el('button.btn.btn-primary', { type: 'button' }, VOS.icon('printer'), ' Надрукувати');
    printBtn.addEventListener('click', () => {
      const f = el('iframe', { style: { position: 'fixed', width: '0', height: '0', border: '0', right: '0', bottom: '0' } });
      document.body.append(f);
      const css = [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n');
      f.contentDocument.write('<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Грамота</title><style>' + css + ' body{background:#fff;margin:0;padding:24px}</style></head><body>' + cert.outerHTML + '</body></html>');
      f.contentDocument.close();
      setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1000); }, 300);
    });
    const root = el('div.app-cert', cert, el('div.cert-actions', printBtn));
    VOS.wm.open({ app: 'certificate', title: 'Грамота', icon: 'trophy', content: root, width: 640, height: 620, minWidth: 320 });
    bus.emit('mission:certificate', {});
  }

  function init() {
    panel = $('#helper');
    $('#helper-btn').addEventListener('click', togglePanel);
    bus.on('*', onEvent);
    // Без активного завдання помічник не заважає: ховається, щойно учень відкрив програму
    bus.on('win:open', ({ app }) => { if (!active && !lesson && app !== 'missions' && !panel.hidden) closePanel(); });
    VOS.compactMQ.addEventListener && VOS.compactMQ.addEventListener('change', () => {
      if (active && active.m.desktopOnly && VOS.isCompact()) {
        if (lesson) showLessonStage();
        else stop();
      }
      else {
        skipCompactSteps();
        if (active && active.step >= active.m.steps.length) complete();
        else render();
      }
      updateBadge();
    });
    touchMQ.addEventListener && touchMQ.addEventListener('change', () => render());
  }

  function onLogin() {
    active = null;
    hideRing();
    const spec = VOS.lessons?.request?.lesson;
    if (spec && !lessonRuns.has(store.profileId)) lessonRuns.set(store.profileId, freshLesson(spec));
    lesson = lessonRuns.get(store.profileId) || null;
    if (lesson) {
      closePanel();
      updateMissionDot();
      return;
    }
    updateBadge();
    // Вільне дослідження за замовчуванням: Совеня не вискакує сам. Лише один раз тихо підказуємо, де він.
    if (VOS.settings.get('helperAuto') && doneCount() < available().length) {
      openPanel();
      render();
      if (VOS.isCompact()) panel.classList.add('collapsed');
    } else {
      closePanel();
    }
  }

  VOS.apps.register({ id: 'missions', name: 'Завдання', icon: 'star', color: '#fab005', category: 'system', desc: 'Навчальні завдання від Совеня', launch: launchApp });
  VOS.missions = { init, onLogin, start, stop, showHint, certificate, get active() { return active; }, lastCompleted: null, doneCount, available };
})();
