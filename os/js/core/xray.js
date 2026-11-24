/* Рентген — інтерактивна схема обчислень і запитів Віконця. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, icon } = VOS;
  const { tr, lang, locale } = VOS.i18n;
  const title = tr('Рентген');
  const text = (uk, en) => lang === 'en' ? en : uk;
  const slowStep = 1600;
  let panel, kind, stageList, diagram, detail;
  let previous, next, toggle, fold, active, timer;

  function control(name, graphic, action, className = '') {
    return el('button.xr-button' + className, {
      type: 'button', 'aria-label': name, title: name, on: { click: action },
    }, icon(graphic));
  }

  function playbackLabel(name, graphic) {
    toggle.setAttribute('aria-label', name);
    toggle.title = name;
    const symbol = graphic === 'refresh' ? icon(graphic)
      : el('span.xr-transport.' + graphic, { 'aria-hidden': 'true' });
    toggle.replaceChildren(symbol, el('span', name));
  }

  function buildPanel() {
    kind = el('span.xr-kind');
    const example = el('button.xr-example.xr-button', { type: 'button', on: { click: demo } },
      text('Приклад', 'Example'));
    fold = control(text('Згорнути схему', 'Collapse diagram'), 'chevron-down', function () {
      const collapsed = panel.classList.toggle('xr-collapsed');
      document.body.classList.toggle('xray-collapsed', collapsed);
      diagram.parentElement.hidden = collapsed;
      const label = collapsed ? text('Розгорнути схему', 'Expand diagram') : text('Згорнути схему', 'Collapse diagram');
      fold.setAttribute('aria-label', label);
      fold.title = label;
      fold.setAttribute('aria-expanded', String(!collapsed));
      fold.classList.toggle('is-folded', collapsed);
    });
    fold.setAttribute('aria-controls', 'xr-content');
    fold.setAttribute('aria-expanded', 'true');
    const hide = control(tr('Закрити Рентген'), 'x', close);
    const heading = el('h2', { tabindex: '-1' }, icon('eye'), title);
    stageList = el('ol.xr-stages', { 'aria-label': text('Шлях даних', 'Data path') });
    diagram = el('div.xr-diagram',
      el('div.xr-rail', { 'aria-hidden': 'true' }, el('span.xr-travel'), el('span.xr-packet')), stageList);
    detail = el('p.xr-detail', { role: 'status' });
    previous = control(text('Попередній крок', 'Previous step'), 'chevron-left', () => jump(active.step - 1));
    next = control(text('Наступний крок', 'Next step'), 'chevron-right', () => jump(active.step + 1));
    toggle = control('', 'refresh', togglePlayback, '.xr-play');
    const toolbar = el('div.xr-controls', { role: 'group', 'aria-label': text('Кроки анімації', 'Animation steps') },
      previous, toggle, next);
    panel = el('aside.xr-panel', {
      'aria-label': title, on: { keydown: (event) => { if (event.key === 'Escape') close(); } },
    },
    el('div.xr-shell',
      el('header.xr-header', heading, kind, example, fold, hide),
      el('div#xr-content', diagram, el('div.xr-readout', detail, toolbar))));
    document.querySelector('#taskbar').before(panel);
  }

  function open() {
    if (!panel) buildPanel();
    panel.hidden = false;
    document.body.classList.add('xray-open');
    if (!active) demo();
    if (panel.classList.contains('xr-collapsed')) fold.click();
    panel.querySelector('h2').focus({ preventScroll: true });
  }

  function close() {
    if (!panel || panel.hidden) return;
    if (panel.contains(document.activeElement) && document.body.classList.contains('session')) {
      document.querySelector('.win.active .app-calc')?.focus({ preventScroll: true });
      if (panel.contains(document.activeElement)) document.getElementById('start-btn').focus();
    }
    clearTimeout(timer);
    active = null;
    panel.hidden = true;
    document.body.classList.remove('xray-open', 'xray-collapsed');
    if (panel.classList.contains('xr-collapsed')) fold.click();
  }

  function stage(name, graphic, value, explanation) {
    return { name, graphic, value, explanation };
  }

  function activate(type, steps, available = steps.length - 1, autoplay = true) {
    if (!panel || panel.hidden) return null;
    clearTimeout(timer);
    active = { steps, available, step: 0, autoplay };
    const items = steps.map(({ name, graphic, value }, index) => {
      const token = el('span.xr-token', value);
      const button = el('button.xr-node', { type: 'button', on: { click: () => jump(index) } },
        el('span.xr-symbol', icon(graphic)), el('span.xr-node-title', name), token);
      return { item: el('li', button), button, token };
    });
    active.items = items;
    diagram.style.setProperty('--xr-count', String(steps.length));
    diagram.classList.add('xr-reset');
    kind.textContent = type;
    stageList.replaceChildren(...items.map(({ item }) => item));
    render();
    // Snap the packet back to the start before a new route can animate.
    requestAnimationFrame(() => {
      if (active?.items === items) diagram.classList.remove('xr-reset');
    });
    schedule();
    return active;
  }

  function render() {
    const { items, steps, step, available, autoplay } = active;
    const complete = step === steps.length - 1;
    diagram.style.setProperty('--xr-progress', String(step / (steps.length - 1)));
    items.forEach(({ button, item, token }, index) => {
      const visible = index <= step;
      item.classList.toggle('current', index === step);
      item.classList.toggle('done', index < step);
      item.classList.toggle('failed', Boolean(steps[index].failed) && visible);
      button.disabled = index > available;
      token.textContent = visible ? steps[index].value : '· · ·';
      if (index === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    detail.textContent = steps[step].explanation;
    previous.disabled = step === 0;
    next.disabled = step >= available;
    if (complete) playbackLabel(text('Повторити', 'Replay'), 'refresh');
    else if (autoplay) playbackLabel(text('Пауза', 'Pause'), 'pause');
    else playbackLabel(text('Відтворити', 'Play'), 'play');
  }

  function schedule() {
    clearTimeout(timer);
    if (!active?.autoplay || active.step >= active.available) return;
    timer = setTimeout(() => {
      active.step++;
      if (active.step === active.steps.length - 1) active.autoplay = false;
      render();
      schedule();
    }, slowStep);
  }

  function jump(index) {
    if (!active || index < 0 || index > active.available) return;
    active.autoplay = false;
    active.step = index;
    clearTimeout(timer);
    render();
  }

  function togglePlayback() {
    const complete = active.step === active.steps.length - 1;
    if (complete) active.step = 0;
    active.autoplay = complete || !active.autoplay;
    render();
    schedule();
  }

  function finish(event, result) {
    if (!event || event !== active) return;
    event.available = event.steps.length - 1;
    Object.assign(event.steps[event.available], result);
    render();
    schedule();
  }

  function computation(expression, result, example = false) {
    return activate(
      example ? text('Приклад · Модель', 'Example · Model') : tr('Навчальна модель'),
      [
        stage(text('Клавіші', 'Keys'), 'keyboard', expression,
          text('Ти вводиш числа й дію. Калькулятор отримує твій запис.', 'You enter numbers and an operation. The calculator receives your input.')),
        stage(text('Пам’ять', 'Memory'), 'list', expression,
          text('Оперативна пам’ять тримає числа й дію, поки вони потрібні.', 'Working memory holds the numbers and operation while they are needed.')),
        stage(tr('Процесор'), 'settings', expression + ' = ' + result,
          text('Процесор читає числа з пам’яті, обчислює результат і записує його назад.', 'The processor reads the numbers, calculates the result and puts it back in memory.')),
        stage(tr('Екран'), 'monitor', result,
          text('Калькулятор бере результат із пам’яті й показує його тобі.', 'The calculator takes the result from memory and shows it to you.')),
      ],
      undefined, !example);
  }

  function demo() {
    computation('7 + 5', '12', true);
  }

  function request(url, purpose) {
    if (!panel || panel.hidden) return null;
    const target = new URL(url, document.baseURI);
    const address = target.host + target.pathname;
    const event = activate(tr('Запит браузера'), [
      stage(text('Браузер', 'Browser'), 'monitor', purpose,
        text('Браузер просить відкрити сторінку: ', 'The browser asks for a page: ') + address),
      stage(text('Сервер', 'Server'), 'globe', target.host,
        text('Запит прямує до сайту. Браузер чекає, поки отримає дані.', 'The request heads to the site. The browser waits for data.')),
      stage(tr('Відповідь'), 'file-text', '', ''),
    ], 1);
    const started = performance.now();
    return (status, httpStatus) => {
      const duration = Math.round(performance.now() - started).toLocaleString(locale) + tr(' мс');
      const outcome = status === 'canceled' ? tr('Запит перервано')
        : status === 'error' ? tr('Не вдалося завантажити') : tr('Завантажено');
      finish(event, {
        value: outcome + ' · ' + duration,
        explanation: (status === 'loaded'
          ? text('Браузер отримав дані. Він може показати сторінку. ', 'The browser received data. It can show the page. ')
          : outcome + '. ') + (httpStatus ? 'HTTP ' + httpStatus + ' · ' : '') + duration + ' · ' + address,
        failed: status !== 'loaded',
      });
    };
  }

  function localSearch() {
    const event = activate(tr('Пошук у Віконці'), [
      stage(tr('Запит'), 'search', tr('Шукарик'),
        text('Шукарик приймає слова, які ти ввів у пошуку.', 'Shukaryk receives the words you entered.')),
      stage(tr('Каталог'), 'grid', text('Навчальні сайти', 'Learning sites'),
        text('Віконце шукає збіги в каталозі й текстах доступних сторінок.', 'Vikontse looks for matches in its directory and available pages.')),
      stage(tr('Результати'), 'list', '', ''),
    ], 1);
    if (!event) return null;
    return (count) => finish(event, {
      value: count.toLocaleString(locale),
      explanation: tr('Знайдено сайтів') + ' · ' + count.toLocaleString(locale),
    });
  }

  VOS.xray = { close, compute: computation, localSearch, request };
  VOS.apps.register({
    id: 'xray', name: 'Рентген', icon: 'eye', color: '#6846b8', category: 'computer',
    desc: tr('Подивись, як Віконце обчислює й завантажує дані'), launch: open,
  });
})();
