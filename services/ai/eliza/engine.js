/**
 * engine.js — РУШІЙ ЕЛІЗИ.
 *
 * Рушій нічого не знає про конкретні теми — усі знання лежать у rules.js.
 * Його робота — чотири кроки:
 *
 *   1. знайти всі правила, шаблони яких підходять до фрази;
 *   2. вибрати найвагоміше (rank) — так само робила ELIZA 1966;
 *   3. перевернути особу в захоплених словах («я малюю» → «ти малюєш»);
 *   4. підставити їх у шаблон відповіді.
 *
 * Разом із відповіддю рушій повертає trace — повний протокол того, що
 * відбулося всередині. Саме його показує режим «Зазирни в мозок»:
 * без нього учень бачить лише результат і може подумати, що бот «мислить».
 */

import {
  RULES, MEMORY_PATTERNS, MEMORY_RESPONSES, GENERIC_RESPONSES,
  CRISIS_RULES, CRISIS_RESPONSES
} from './rules.js';
import { reflect } from './reflection.js';

/** Знаходить $<група> у шаблоні відповіді. Літерал — жодних new RegExp. */
const PLACEHOLDER = /\$<([^<>]+)>/gu;

/**
 * Підставляє значення груп у шаблон.
 *
 * Один прохід із функцією-замінником: те, що ми підставили, більше не
 * переглядається. Тому користувач не може «підсунути» власний $<...>.
 *
 * (У старій версії тут було new RegExp('{0}') — і воно падало з помилкою
 * «Nothing to repeat», бо {0} для регулярних виразів означає квантифікатор.)
 */
function fillTemplate(template, values) {
  return template.replace(PLACEHOLDER, (whole, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : whole
  );
}

/** Перемішує копію масиву (алгоритм Фішера — Йейтса). */
function shuffled(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createEliza({ rules = RULES, customRules = [] } = {}) {
  /** Циклічні лічильники: гарантують, що відповідь не повториться двічі поспіль. */
  const cursors = new Map();
  /** Стос пам'яті — фрази користувача про «мій / моя / моє». */
  const memory = [];

  let custom = customRules.slice();
  let turns = 0;
  let fallbacks = 0;
  let crisisHits = 0;
  let lastMemoryPhrase = null;
  /** Чим була попередня відмовка: 'memory' чи 'generic'. */
  let lastFallbackKind = null;

  const genericQueue = shuffled(GENERIC_RESPONSES);
  let genericIndex = 0;

  /**
   * Бере наступну відповідь зі списку по колу, а не навмання.
   * Саме так робила оригінальна ELIZA — щоб не повторюватися.
   */
  function nextFrom(key, list) {
    if (!cursors.has(key)) {
      cursors.set(key, Math.floor(Math.random() * list.length));
    }
    const index = cursors.get(key) % list.length;
    cursors.set(key, index + 1);
    return { text: list[index], index };
  }

  /** Запам'ятовує фрази на кшталт «моя собака» для подальшого повернення. */
  function remember(input) {
    for (const pattern of MEMORY_PATTERNS) {
      const match = input.match(pattern);
      if (!match) continue;

      const phrase = match[0].replace(/^[^\p{L}\p{M}]+/u, '').trim();
      if (phrase.length < 4 || memory.includes(phrase)) continue;

      memory.push(phrase);
      if (memory.length > 8) memory.shift();
      return phrase;
    }
    return null;
  }

  /** Усі правила, які підходять до фрази, від найвагомішого до найлегшого. */
  function findCandidates(input) {
    const all = custom.concat(rules);
    const matched = [];

    for (const rule of all) {
      const match = input.match(rule.pattern);
      if (match) matched.push({ rule, match });
    }

    return matched.sort((a, b) => (b.rule.rank || 0) - (a.rule.rank || 0));
  }

  /** Готує значення груп: сирі та перевернуті. */
  function prepareGroups(rule, match) {
    const groups = [];
    const values = {};
    let verbReflected = false;

    for (const [name, raw] of Object.entries(match.groups || {})) {
      if (raw === undefined) continue;

      const cleaned = raw.trim().replace(/[.!?,;:]+$/u, '');
      let final = cleaned;

      if (rule.reflect) {
        const mirrored = reflect(cleaned);
        final = mirrored.text;
        if (mirrored.verbReflected) verbReflected = true;
        groups.push({ name, raw: cleaned, reflected: mirrored.text, swaps: mirrored.swaps });
      } else {
        groups.push({ name, raw: cleaned, reflected: null, swaps: [] });
      }

      values[name] = final;
    }

    return { groups, values, verbReflected };
  }

  /**
   * Захисний фільтр. Перевіряється найпершим — раніше за пам'ять і правила,
   * тому жодне звичайне правило не може його перебити, хоч би який був rank.
   */
  function findCrisis(input) {
    for (const rule of CRISIS_RULES) {
      // Вилучаємо лише конкретні безпечні ігрові конструкції. Звичайне слово
      // «гра» в іншій частині повідомлення не може вимкнути захист цілком.
      const checked = (rule.ignore || []).reduce((text, pattern) => {
        pattern.lastIndex = 0;
        const result = text.replace(pattern, ' ');
        pattern.lastIndex = 0;
        return result;
      }, input);

      if (rule.pattern.test(checked)) return rule;
    }
    return null;
  }

  function respond(input) {
    turns += 1;

    const text = String(input).trim();

    // ── Захист спрацьовує до всього іншого ───────────────────────────────
    const crisis = findCrisis(text);
    if (crisis) {
      crisisHits += 1;

      // Навмисно НЕ запам'ятовуємо таку фразу: повернути її пізніше
      // реплікою «раніше в розмові прозвучало…» було б жорстоко.
      return {
        text: CRISIS_RESPONSES[crisis.category],
        trace: {
          turn: turns,
          input: text,
          kind: 'crisis',
          category: crisis.category,
          winner: { id: crisis.id, name: 'Захисний фільтр', rank: '∞' },
          candidates: [],
          groups: [],
          template: CRISIS_RESPONSES[crisis.category],
          response: CRISIS_RESPONSES[crisis.category],
          notes: [
            'Спрацював захисний фільтр — окремий шар, який перевіряється ' +
            'раніше за всі 30 правил. Він не використовує ані дзеркала, ані ' +
            'випадкового вибору: відповідь тут завжди та сама.',
            'Багато сучасних чат-ботів теж мають окремі перевірки безпеки ' +
            'до або після основної логіки відповіді.'
          ]
        }
      };
    }

    const remembered = remember(text);
    const candidates = findCandidates(text);

    const trace = {
      turn: turns,
      input: text,
      remembered,
      candidates: candidates.map(({ rule }) => ({
        id: rule.id,
        name: rule.name,
        rank: rule.rank || 0,
        isCustom: Boolean(rule.isCustom)
      })),
      notes: []
    };

    // ── Жодне правило не підійшло ────────────────────────────────────────
    if (candidates.length === 0) {
      fallbacks += 1;

      // Відмовки чергуються з поверненням до пам'яті (прийом ELIZA 1966):
      // загальна фраза → спогад → загальна фраза → спогад…
      // Так Еліза не заїжджає платівкою, але й пам'ять видно вже з першого разу.
      const usable = memory.filter((phrase) => phrase !== lastMemoryPhrase);
      if (usable.length > 0 && lastFallbackKind !== 'memory') {
        const phrase = usable[usable.length - 1];
        const template = nextFrom('memory', MEMORY_RESPONSES);
        lastMemoryPhrase = phrase;
        lastFallbackKind = 'memory';

        trace.kind = 'memory';
        trace.template = template.text;
        trace.groups = [{ name: 'що', raw: phrase, reflected: null, swaps: [] }];
        trace.response = fillTemplate(template.text, { 'що': phrase });
        trace.notes.push('Правила не спрацювали — Еліза дістала фразу зі стосу пам\'яті.');
        return { text: trace.response, trace };
      }

      const generic = genericQueue[genericIndex % genericQueue.length];
      genericIndex += 1;
      lastFallbackKind = 'generic';

      trace.kind = 'generic';
      trace.template = generic;
      trace.groups = [];
      trace.response = generic;
      trace.notes.push('Жодне правило не підійшло — Еліза сказала загальну відмовку.');
      return { text: generic, trace };
    }

    // ── Перемагає правило з найбільшою вагою ─────────────────────────────
    const { rule, match } = candidates[0];
    const { groups, values, verbReflected } = prepareGroups(rule, match);

    let pool = rule.responses;
    if (rule.reflect && rule.responsesIfVerbUnknown && !verbReflected && groups.length > 0) {
      pool = rule.responsesIfVerbUnknown;
      trace.notes.push(
        'Дієслова немає у словнику, тому Еліза не будує речення, а цитує твої слова. ' +
        'Інакше вийшло б «ти люблю малювати».'
      );
    }

    const chosen = nextFrom(`rule-${rule.id}`, pool);

    trace.kind = rule.isCustom ? 'custom' : 'rule';
    trace.winner = {
      id: rule.id,
      name: rule.name,
      rank: rule.rank || 0,
      pattern: String(rule.pattern),
      isCustom: Boolean(rule.isCustom)
    };
    trace.matchedText = match[0].trim();
    trace.groups = groups;
    trace.template = chosen.text;
    trace.templateIndex = chosen.index;
    trace.templateCount = pool.length;
    trace.response = fillTemplate(chosen.text, values);

    if (candidates.length > 1) {
      trace.notes.push(
        `Підійшло правил: ${candidates.length}. Виграло те, у якого більша вага (${rule.rank}).`
      );
    }

    return { text: trace.response, trace };
  }

  return {
    respond,

    /** Додає правило, придумане учнем. */
    addCustomRule(rule) {
      custom = custom.concat([{ ...rule, isCustom: true }]);
    },

    setCustomRules(list) {
      custom = list.map((rule) => ({ ...rule, isCustom: true }));
    },

    getStats() {
      return {
        turns,
        fallbacks,
        crisisHits,
        rulesCount: rules.length + custom.length,
        builtInCount: rules.length,
        customCount: custom.length,
        memoryCount: memory.length
      };
    },

    reset() {
      cursors.clear();
      memory.length = 0;
      turns = 0;
      fallbacks = 0;
      crisisHits = 0;
      lastMemoryPhrase = null;
      lastFallbackKind = null;
      genericIndex = 0;
    }
  };
}
