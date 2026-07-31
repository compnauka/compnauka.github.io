/**
 * ui.js — усе, що стосується екрана.
 *
 * Тут немає логіки Елізи: цей файл лише будує вузли DOM. Логіка живе в
 * main.js, знання — у rules.js, обробка — в engine.js.
 *
 * Увесь текст користувача потрапляє на сторінку через textContent, а не
 * innerHTML. Це і є справжній захист від підстановки чужого коду —
 * на відміну від функції sanitizeInput() у старій версії, яка клала рядок
 * у textContent і одразу читала його назад, тобто не робила нічого.
 */

export const els = {
  chat: document.getElementById('chat'),
  chips: document.getElementById('chips'),
  composer: document.getElementById('composer'),
  input: document.getElementById('input'),
  send: document.getElementById('send'),
  announcer: document.getElementById('announcer'),

  brainBtn: document.getElementById('brainBtn'),
  ruleBtn: document.getElementById('ruleBtn'),
  aboutBtn: document.getElementById('aboutBtn'),
  compareBtn: document.getElementById('compareBtn'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),

  statRules: document.getElementById('statRules'),
  statRule: document.getElementById('statRule'),
  statFallback: document.getElementById('statFallback'),

  historyBtn: document.getElementById('historyBtn'),

  aboutDialog: document.getElementById('aboutDialog'),
  historyDialog: document.getElementById('historyDialog'),
  compareDialog: document.getElementById('compareDialog'),
  ruleDialog: document.getElementById('ruleDialog'),
  ruleForm: document.getElementById('ruleForm'),
  ruleName: document.getElementById('ruleName'),
  ruleKeys: document.getElementById('ruleKeys'),
  ruleAnswers: document.getElementById('ruleAnswers'),
  customList: document.getElementById('customList')
};

/** Короткий конструктор вузлів. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Рядок «ключ → значення» в панелі мозку. */
function traceRow(key, value, valueClass) {
  const row = el('div', 'trace__row');
  row.append(el('span', 'trace__key', key));
  const box = el('span', 'trace__val');
  const code = el('code', valueClass, value);
  box.append(code);
  row.append(box);
  return row;
}

/** Обрізає довгий регулярний вираз, щоб він не займав пів екрана. */
function shorten(text, limit = 96) {
  const value = String(text);
  return value.length > limit ? value.slice(0, limit) + '…' : value;
}

export function scrollChat() {
  els.chat.scrollTop = els.chat.scrollHeight;
}

/** Повідомляє скрінрідеру ГОТОВУ репліку (а не кожну надруковану літеру). */
export function announce(text) {
  els.announcer.textContent = '';
  // Порожній кадр потрібен, щоб повторний однаковий текст теж прочитався.
  requestAnimationFrame(() => {
    els.announcer.textContent = text;
  });
}

export function buildUserMessage(text) {
  const node = el('div', 'msg msg--user');
  node.append(el('span', 'msg__who', '> '));
  node.append(el('span', 'msg__text', text));
  return node;
}

/**
 * Порожня репліка Елізи: текст у неї допише друкарська машинка.
 * Кризова відповідь виглядає інакше — вона не має здаватися черговою
 * дотепною реплікою бота, тож отримує окреме оформлення.
 */
export function buildElizaMessage({ crisis = false } = {}) {
  const node = el('div', 'msg msg--eliza msg--typing' + (crisis ? ' msg--crisis' : ''));
  node.append(el('span', 'msg__who', crisis ? '⚠ ВАЖЛИВО: ' : 'ЕЛІЗА: '));
  const textNode = el('span', 'msg__text');
  node.append(textNode);
  return { node, textNode };
}

/**
 * Панель «Зазирни в мозок» — головна навчальна частина сторінки.
 * Показує, що відповідь зібрана з деталей, а не придумана.
 */
export function buildTrace(trace) {
  const box = el('div', 'trace');
  box.append(el('div', 'trace__title', '🧠 що відбулося всередині'));

  if (trace.kind === 'crisis') {
    box.append(traceRow('Спрацював', 'ЗАХИСНИЙ ФІЛЬТР ' + trace.winner.id));
    box.append(traceRow('Категорія', trace.category));
    box.append(traceRow('Дзеркало', 'не застосовується'));
    box.append(traceRow('Вибір шаблону', 'відсутній — відповідь завжди та сама'));
  } else if (trace.kind === 'generic') {
    box.append(traceRow('Правило', 'жодне не підійшло'));
    box.append(traceRow('Відповідь', trace.template));
  } else if (trace.kind === 'memory') {
    box.append(traceRow('Правило', 'жодне не підійшло'));
    box.append(traceRow('Пам\'ять', trace.groups[0].raw));
    box.append(traceRow('Шаблон', trace.template));
  } else {
    const label = `#${trace.winner.id} «${trace.winner.name}», вага ${trace.winner.rank}` +
      (trace.winner.isCustom ? ' — ТВОЄ ПРАВИЛО' : '');
    box.append(traceRow('Правило', label));
    box.append(traceRow('Шаблон пошуку', shorten(trace.winner.pattern)));
    box.append(traceRow('Знайдено', trace.matchedText));

    trace.groups.forEach((group) => {
      const value = group.reflected && group.reflected !== group.raw
        ? `${group.raw} → ${group.reflected}`
        : group.raw;
      box.append(traceRow(`Група «${group.name}»`, value));

      group.swaps.forEach((swap) => {
        box.append(traceRow('Дзеркало', `${swap.from} → ${swap.to} (${swap.kind})`));
      });
    });

    const variant = trace.templateCount > 1
      ? `${trace.template}   [варіант ${trace.templateIndex + 1} з ${trace.templateCount}]`
      : trace.template;
    box.append(traceRow('Шаблон відповіді', variant));
  }

  if (trace.candidates.length > 1) {
    const others = trace.candidates
      .slice(1)
      .map((candidate) => `#${candidate.id} ${candidate.name} (${candidate.rank})`)
      .join(', ');
    box.append(traceRow('Теж підійшли', others));
  }

  trace.notes.forEach((note) => {
    box.append(el('p', 'trace__note', note));
  });

  return box;
}

/** Картка-підказка: челендж «Зламай Елізу», ефект Елізи тощо. */
export function buildCard({ title, text, actionLabel, onAction }) {
  const card = el('div', 'card');
  card.append(el('div', 'card__title', title));
  card.append(el('p', null, text));

  if (actionLabel && onAction) {
    const button = el('button', 'tool', actionLabel);
    button.type = 'button';
    button.addEventListener('click', onAction);
    card.append(button);
  }

  return card;
}

export function renderChips(phrases, onPick) {
  els.chips.replaceChildren();
  phrases.forEach((phrase) => {
    const chip = el('button', 'chip', phrase);
    chip.type = 'button';
    chip.addEventListener('click', () => onPick(phrase));
    els.chips.append(chip);
  });
}

export function renderCustomList(rules, onDelete) {
  els.customList.replaceChildren();

  if (rules.length === 0) {
    els.customList.append(el('li', 'custom-list__empty', 'Поки що жодного. Додай перше!'));
    return;
  }

  rules.forEach((rule, index) => {
    const item = el('li');
    item.append(el('span', 'custom-list__name', rule.name));
    item.append(el('span', 'custom-list__keys', rule.keys.join(', ')));

    const del = el('button', 'custom-list__del', 'Видалити');
    del.type = 'button';
    del.setAttribute('aria-label', `Видалити правило «${rule.name}»`);
    del.addEventListener('click', () => onDelete(index));
    item.append(del);

    els.customList.append(item);
  });
}

export function setStats({ rulesCount, lastRule, fallbacks }) {
  els.statRules.textContent = String(rulesCount);
  els.statRule.textContent = lastRule;
  els.statFallback.textContent = String(fallbacks);
}

export function setBusy(busy) {
  els.send.disabled = busy;
  els.input.disabled = busy;
}

/** Відкриває <dialog> з коректним запасним варіантом. */
export function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}
