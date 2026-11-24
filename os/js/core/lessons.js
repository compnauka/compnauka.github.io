/* Віконце — конструктор уроків і посилання для учнів. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el } = VOS;
  const MAX_STAGES = 4;
  const TITLE_LIMIT = 60;
  const PRESETS = [
    { title: 'Перші кроки', ids: ['start', 'buttons'] },
    { title: 'Порядок у файлах', ids: ['folder', 'order', 'copy'] },
    { title: 'Готуємо виставку', ids: ['exhibition'] },
  ];

  function validate(value) {
    if (!value || value.v !== 1 || typeof value.title !== 'string' || !Array.isArray(value.ids)) return null;
    const title = value.title.trim();
    const ids = value.ids;
    if (!title || title.length > TITLE_LIMIT || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(title)) return null;
    if (!ids.length || ids.length > MAX_STAGES || new Set(ids).size !== ids.length) return null;
    if (!ids.every((id) => VOS.MISSIONS.some((mission) => mission.id === id))) return null;
    return { v: 1, title, ids: [...ids] };
  }

  function read(url) {
    const values = url.searchParams.getAll('lesson');
    if (!values.length) return null;
    if (values.length === 1 && values[0].length <= 400) {
      try {
        const lesson = validate(JSON.parse(values[0]));
        if (lesson) return { lesson, preview: url.searchParams.get('preview') === '1' };
      } catch (e) { /* Пошкоджене або неповне посилання. */ }
    }
    return { lesson: null, preview: false };
  }

  function linkFor(lesson, preview = false) {
    const spec = validate(lesson);
    if (!spec) return null;
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    url.searchParams.set('lesson', JSON.stringify(spec));
    if (preview) url.searchParams.set('preview', '1');
    return url.href;
  }

  const button = (label, action, extra = '') => el('button.btn' + extra, { type: 'button', on: { click: action } }, label);

  function builder() {
    const ids = [];
    const root = el('div.lesson-builder');
    const title = el('input.input', { type: 'text', maxlength: TITLE_LIMIT, autofocus: true, placeholder: 'Наприклад, Порядок у файлах' });
    const presets = el('div.lesson-presets');
    const select = el('select.input', { 'aria-label': 'Доступне завдання' });
    const add = button('Додати', () => {
      if (!select.value || ids.includes(select.value) || ids.length >= MAX_STAGES) return;
      ids.push(select.value);
      render();
      if (add.disabled) list.lastElementChild?.querySelector('button:last-child')?.focus();
      else select.focus();
    });
    const list = el('ol.lesson-stages', { 'aria-label': 'Порядок завдань' });
    const empty = el('p.lesson-note', 'Додай від одного до чотирьох завдань.');
    const device = el('p.lesson-note');
    const field = el('input.input.lesson-link', { type: 'url', readonly: true, 'aria-label': 'Посилання для учнів' });
    const linkDetails = el('details.lesson-link-details', el('summary', 'Показати посилання'), field);
    const note = el('p.lesson-note', { role: 'status' });
    const preview = el('a.btn', { target: '_blank', rel: 'noopener', 'aria-disabled': 'true' }, VOS.icon('eye'), ' Переглянути як учень');
    const copy = button('Копіювати посилання', async () => {
      if (!field.value) return;
      const href = field.value;
      try {
        await navigator.clipboard.writeText(href);
        if (field.value === href) note.textContent = 'Посилання скопійовано.';
      } catch (e) {
        if (field.value !== href) return;
        linkDetails.open = true;
        field.focus();
        field.select();
        note.textContent = 'Посилання виділено. Скопіюй його з поля.';
      }
    }, '.btn-primary');
    preview.addEventListener('click', (e) => { if (!preview.hasAttribute('href')) e.preventDefault(); });
    field.addEventListener('click', () => field.select());
    const share = el('div.lesson-field', el('strong', 'Посилання для учнів'),
      el('p.lesson-note', 'Перевірте урок у перегляді, потім надішліть учням скопійоване посилання. Завдання вони відкриють через Совеня.'),
      el('div.lesson-builder-actions', preview, copy), linkDetails);

    function updateLink() {
      const spec = { v: 1, title: title.value, ids };
      const href = linkFor(spec);
      const previewHref = linkFor(spec, true);
      field.value = href || '';
      share.hidden = !href;
      copy.disabled = !href;
      if (previewHref) preview.setAttribute('href', previewHref);
      else preview.removeAttribute('href');
      preview.setAttribute('aria-disabled', String(!href));
      const desktop = VOS.MISSIONS.some((mission) => mission.desktopOnly && ids.includes(mission.id));
      device.hidden = !desktop;
      device.textContent = desktop ? 'На малому екрані завдання для комп’ютера буде пропущено.' : '';
      note.textContent = href ? '' : 'Для посилання потрібні назва уроку й хоча б одне завдання.';
    }

    function move(index, direction) {
      const target = index + direction;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      render();
      const row = list.children[target];
      const controls = row.querySelectorAll('button');
      if (!controls[direction < 0 ? 0 : 1].disabled) controls[direction < 0 ? 0 : 1].focus();
      else row.focus();
    }

    function render() {
      const selected = select.value;
      select.replaceChildren(el('option', { value: '' }, 'Обери завдання'));
      for (const mission of VOS.MISSIONS) {
        if (!ids.includes(mission.id)) {
          select.append(el('option', { value: mission.id }, mission.title + (mission.desktopOnly ? ' · комп’ютер' : '')));
        }
      }
      if (!ids.includes(selected)) select.value = selected;
      select.disabled = ids.length >= MAX_STAGES;
      add.disabled = select.disabled || !select.value;
      empty.hidden = ids.length > 0;
      list.replaceChildren();
      ids.forEach((id, i) => {
        const mission = VOS.MISSIONS.find((m) => m.id === id);
        const control = (icon, label, action, disabled = false) => el('button.btn.lesson-control', {
          type: 'button', disabled, 'aria-label': label + ': ' + mission.title, title: label, on: { click: action },
        }, VOS.icon(icon));
        list.append(el('li.lesson-stage', { tabindex: '-1' },
          el('span.lesson-stage-title', mission.title, mission.desktopOnly ? el('small', 'Для комп’ютера') : null),
          el('div.lesson-controls',
            control('arrow-up', 'Вище', () => move(i, -1), i === 0),
            control('chevron-down', 'Нижче', () => move(i, 1), i + 1 === ids.length),
            control('x', 'Прибрати з уроку', () => {
              ids.splice(i, 1);
              render();
              if (list.children[i] || list.lastElementChild) {
                (list.children[i] || list.lastElementChild).querySelector('button:last-child').focus();
              } else select.focus();
            }))));
      });
      updateLink();
    }

    for (const preset of PRESETS) {
      const spec = validate({ v: 1, ...preset });
      if (!spec) continue;
      presets.append(button(preset.title, () => {
        ids.splice(0, ids.length, ...preset.ids);
        title.value = preset.title;
        render();
      }, '.btn-small'));
    }
    title.addEventListener('input', updateLink);
    select.addEventListener('change', () => { add.disabled = !select.value; });
    root.append(
      el('div.lesson-field', 'Готові добірки', el('p.lesson-note', 'Оберіть добірку або створіть урок із власним порядком завдань.'), presets),
      el('label.lesson-field', 'Назва уроку', title),
      el('div.lesson-field', 'Завдання уроку', el('div.lesson-picker', select, add), empty, list, device),
      share,
      note);
    render();
    return root;
  }

  function openBuilder() {
    return VOS.dialog.modal(({ box, content, foot, close }) => {
      box.parentElement.classList.add('lesson-builder-overlay');
      content.append(builder());
      foot.append(button('Закрити', () => close()));
    }, { title: 'Створити урок', icon: 'books', wide: true, className: 'lesson-builder-dialog' });
  }

  function launch() {
    const [existing] = VOS.wm.byApp('lessons');
    if (existing) {
      if (existing.minimized) VOS.wm.restore(existing.id);
      else VOS.wm.focus(existing.id);
      return existing;
    }
    return VOS.wm.open({ app: 'lessons', title: 'Створити урок', icon: 'books', content: builder(), width: 720, height: 640, minWidth: 320, minHeight: 265 });
  }

  const request = read(new URL(window.location.href));
  VOS.lessons = { request, openBuilder };
  VOS.apps.register({ id: 'lessons', name: 'Створити урок', icon: 'books', color: '#0e7490', category: 'system', desc: 'Для вчителя: добірка завдань і посилання для учнів', launch });
})();
