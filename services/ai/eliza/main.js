/**
 * main.js — збирає все докупи.
 *
 *   rules.js      — що Еліза знає
 *   engine.js     — як вона це застосовує
 *   reflection.js — як перевертає особу
 *   ui.js         — як це виглядає
 *   main.js       — хто кого коли викликає (цей файл)
 */

import { createEliza } from './engine.js';
import { GREETING, stem } from './rules.js';
import { typeText } from './typewriter.js';
import { storage } from './storage.js';
import {
  els, announce, scrollChat, setStats, setBusy, openDialog,
  buildUserMessage, buildElizaMessage, buildTrace, buildCard,
  renderChips, renderCustomList
} from './ui.js';

/* ── Стан сторінки ─────────────────────────────────────────────────────── */

let transcript = storage.loadTranscript();
let customRules = storage.loadCustomRules();
let shownCards = storage.loadShownCards();
let brainMode = storage.loadBrainMode();
let activeTyping = null;
/** Таймер «Еліза думає». Тримаємо id, щоб скидання могло його скасувати. */
let pendingReply = null;

/**
 * Готові фрази для тих, хто ще повільно друкує (1-4 клас).
 *
 * Набір підібраний так, щоб пройти їх по порядку — це вже готова
 * демонстрація всіх механізмів Елізи. Порядок має значення:
 * «Моя мама вчителька» закладає фразу в пам'ять, а «Учора був дощ»
 * не підходить під жодне правило й тому дістає її звідти назад.
 */
const STARTER_PHRASES = [
  'Привіт!',                    // просте правило
  'Хто ти?',                    // правило з історичним фактом
  'Моя мама вчителька',         // потрапляє в пам'ять
  'Я люблю малювати драконів',  // дзеркало + конкуренція трьох правил
  'Мені трохи сумно',           // правило з підстановкою
  'Я не можу заснути',          // правило з інфінітивом
  'Чому небо синє?',            // Еліза не відповідає, а перепитує
  'Учора був дощ'               // відмовка → повернення до пам'яті
];

const CARDS = {
  break: {
    title: '🏆 Ти зламав(-ла) Елізу!',
    text: 'Уже тричі жодне правило не підійшло до твоїх слів — і Елізі довелося ' +
      'викручуватися загальною фразою або спогадом із пам\'яті. ' +
      'Усі її правила писала людина, і їх лише кілька десятків. ' +
      'Хочеш дописати правило, якого їй бракує?',
    actionLabel: '＋ Додати своє правило'
  },
  effect: {
    title: '💡 Ефект Елізи',
    text: 'Ви розмовляєте вже давно. У 1966 році секретарка Джозефа Вейценбаума, ' +
      'яка на власні очі бачила, як він писав цей код, попросила залишити її ' +
      'з програмою наодинці — настільки живою здавалася розмова. ' +
      'Схильність приписувати комп\'ютеру розуміння, якого в нього немає, ' +
      'назвали «ефектом Елізи». Увімкни «Зазирни в мозок» і перевір, чи є там розуміння.'
  }
};

/* ── Правила, придумані учнями ─────────────────────────────────────────── */

/** Знешкоджує спецсимволи, щоб слово учня не зламало регулярний вираз. */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Перетворює збережені дані на робоче правило для рушія. */
function compileCustomRule(rule, index) {
  return {
    id: `У${index + 1}`,
    name: rule.name,
    rank: 8,
    pattern: stem(...rule.keys.map(escapeRegExp)),
    responses: rule.responses
  };
}

const eliza = createEliza({
  customRules: customRules.map(compileCustomRule)
});

/* ── Показники ─────────────────────────────────────────────────────────── */

function lastTrace() {
  for (let i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i].trace) return transcript[i].trace;
  }
  return null;
}

function refreshStats() {
  const trace = lastTrace();
  // Відмовка — це будь-який випадок, коли жодне правило не підійшло.
  // Відповідь із пам'яті теж сюди належить: правила не спрацювали, просто
  // замість «Розкажи більше» Еліза дістала стару фразу.
  const fallbacks = transcript.filter(
    (entry) => entry.trace && (entry.trace.kind === 'generic' || entry.trace.kind === 'memory')
  ).length;

  let lastRule = '—';
  if (trace) {
    if (trace.kind === 'crisis') lastRule = 'захист';
    else if (trace.kind === 'generic') lastRule = 'відмовка';
    else if (trace.kind === 'memory') lastRule = 'пам\'ять';
    else lastRule = `#${trace.winner.id}`;
  }

  setStats({ rulesCount: eliza.getStats().rulesCount, lastRule, fallbacks });
  return fallbacks;
}

/* ── Малювання чату ────────────────────────────────────────────────────── */

function appendCard(cardId) {
  const config = CARDS[cardId];
  if (!config) return;

  els.chat.append(buildCard({
    title: config.title,
    text: config.text,
    actionLabel: config.actionLabel,
    onAction: config.actionLabel ? openRuleDialog : null
  }));
  scrollChat();
}

/** Перемальовує весь діалог із пам'яті сеансу — без ефекту друку. */
function renderTranscript() {
  els.chat.replaceChildren();

  transcript.forEach((entry) => {
    if (entry.who === 'card') {
      appendCard(entry.cardId);
      return;
    }
    if (entry.who === 'user') {
      els.chat.append(buildUserMessage(entry.text));
      return;
    }

    const isCrisis = Boolean(entry.trace && entry.trace.kind === 'crisis');
    const { node, textNode } = buildElizaMessage({ crisis: isCrisis });
    node.classList.remove('msg--typing');
    textNode.textContent = entry.text;
    if (entry.trace) node.append(buildTrace(entry.trace));
    els.chat.append(node);
  });

  scrollChat();
}

function persist() {
  storage.saveTranscript(transcript);
}

/** Показує картку один раз за сеанс. */
function maybeShowCard(cardId) {
  if (shownCards.includes(cardId)) return;

  shownCards = shownCards.concat([cardId]);
  storage.saveShownCards(shownCards);

  transcript.push({ who: 'card', cardId });
  persist();
  appendCard(cardId);
}

/** Друкує репліку Елізи. */
function speak(text, trace, { instant = false } = {}) {
  const isCrisis = Boolean(trace && trace.kind === 'crisis');

  // Кризову відповідь не «набираємо» ефектно — вона з'являється одразу.
  const showAtOnce = instant || isCrisis;

  const { node, textNode } = buildElizaMessage({ crisis: isCrisis });
  els.chat.append(node);

  const finish = () => {
    node.classList.remove('msg--typing');
    if (trace) node.append(buildTrace(trace));
    scrollChat();
    announce(text);
    setBusy(false);
    activeTyping = null;

    if (!document.querySelector('dialog[open]')) {
      els.input.focus({ preventScroll: true });
    }
  };

  if (showAtOnce) {
    textNode.textContent = text;
    finish();
    return;
  }

  activeTyping = typeText(textNode, text, {
    onTick: scrollChat,
    onDone: finish
  });
}

/* ── Головний цикл розмови ─────────────────────────────────────────────── */

function send(rawText) {
  const text = String(rawText).trim();
  if (text === '' || els.send.disabled) return;

  transcript.push({ who: 'user', text });
  els.chat.append(buildUserMessage(text));
  scrollChat();

  els.input.value = '';
  setBusy(true);

  pendingReply = window.setTimeout(() => {
    pendingReply = null;
    let reply;

    // Стара версія падала саме тут — і поле вводу лишалося заблокованим
    // назавжди. Тепер будь-яка помилка перетворюється на звичайну репліку.
    try {
      reply = eliza.respond(text);
    } catch (error) {
      console.error('[eliza] помилка рушія', error);
      reply = {
        text: 'Ой, я заплуталася у власних правилах. Спробуй сказати це інакше.',
        trace: null
      };
    }

    transcript.push({ who: 'eliza', text: reply.text, trace: reply.trace });
    persist();
    speak(reply.text, reply.trace);

    const fallbacks = refreshStats();
    const userTurns = transcript.filter((entry) => entry.who === 'user').length;

    if (fallbacks >= 3) maybeShowCard('break');
    else if (userTurns >= 10) maybeShowCard('effect');
  }, 350 + Math.random() * 350);
}

/* ── Конструктор правил ────────────────────────────────────────────────── */

function syncCustomRules() {
  storage.saveCustomRules(customRules);
  eliza.setCustomRules(customRules.map(compileCustomRule));
  renderCustomList(customRules, deleteCustomRule);
  refreshStats();
}

function deleteCustomRule(index) {
  customRules = customRules.filter((_, i) => i !== index);
  syncCustomRules();
}

function openRuleDialog() {
  renderCustomList(customRules, deleteCustomRule);
  openDialog(els.ruleDialog);
  els.ruleName.focus();
}

els.ruleForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = els.ruleName.value.trim();
  const keys = els.ruleKeys.value.split(',').map((key) => key.trim()).filter(Boolean);
  const responses = els.ruleAnswers.value.split('\n').map((line) => line.trim()).filter(Boolean);

  if (!name || keys.length === 0 || responses.length === 0) return;

  customRules = customRules.concat([{ name, keys, responses }]);
  syncCustomRules();

  els.ruleForm.reset();
  els.ruleName.focus();
});

/* ── Кнопки ────────────────────────────────────────────────────────────── */

function setBrainMode(value) {
  brainMode = value;
  document.body.classList.toggle('brain-on', brainMode);
  els.brainBtn.setAttribute('aria-pressed', String(brainMode));
  storage.saveBrainMode(brainMode);
  scrollChat();
}

els.brainBtn.addEventListener('click', () => setBrainMode(!brainMode));
els.aboutBtn.addEventListener('click', () => openDialog(els.aboutDialog));
els.historyBtn.addEventListener('click', () => openDialog(els.historyDialog));
els.compareBtn.addEventListener('click', () => openDialog(els.compareDialog));
els.ruleBtn.addEventListener('click', openRuleDialog);

els.saveBtn.addEventListener('click', () => {
  const lines = transcript
    .filter((entry) => entry.who === 'user' || entry.who === 'eliza')
    .map((entry) => (entry.who === 'user' ? 'Я: ' : 'ЕЛІЗА: ') + entry.text);

  const header = [
    'Розмова з ЕЛІЗОЮ — першим чат-ботом (1966)',
    'itnauka.org/services/ai/eliza/',
    new Date().toLocaleString('uk-UA'),
    '─'.repeat(46),
    ''
  ];

  const blob = new Blob([header.concat(lines).join('\r\n')], {
    type: 'text/plain;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rozmova-z-elizoyu.txt';
  link.click();
  URL.revokeObjectURL(url);
});

els.resetBtn.addEventListener('click', () => {
  if (!window.confirm('Почати розмову спочатку? Діалог буде стерто. Твої правила залишаться.')) return;

  // Без цього відповідь на попереднє повідомлення долітала вже в новий,
  // порожній діалог — і там висіла репліка без питання.
  if (pendingReply !== null) {
    window.clearTimeout(pendingReply);
    pendingReply = null;
  }
  if (activeTyping) {
    activeTyping.finish();
    activeTyping = null;
  }

  transcript = [];
  shownCards = [];
  storage.saveShownCards(shownCards);
  eliza.reset();
  persist();
  start();
});

/* ── Введення ──────────────────────────────────────────────────────────── */

els.composer.addEventListener('submit', (event) => {
  event.preventDefault();
  send(els.input.value);
});

// Клац по чату — не чекати, поки Еліза «додрукує».
els.chat.addEventListener('click', () => {
  if (activeTyping && !activeTyping.isDone()) activeTyping.finish();
});

renderChips(STARTER_PHRASES, (phrase) => {
  els.input.value = phrase;
  send(phrase);
});

/* ── Запуск ────────────────────────────────────────────────────────────── */

function start() {
  setBrainMode(brainMode);
  renderCustomList(customRules, deleteCustomRule);

  if (transcript.length === 0) {
    transcript.push({ who: 'eliza', text: GREETING, trace: null });
    persist();
    renderTranscript();

    // Вітання друкуємо «наживо» — це частина ретро-враження.
    els.chat.replaceChildren();
    setBusy(true);
    speak(GREETING, null);
  } else {
    renderTranscript();
    setBusy(false);
  }

  refreshStats();
}

start();
