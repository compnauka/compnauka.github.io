/**
 * tests.js — перевірки для мозку Елізи.
 *
 * Без жодних бібліотек і без збірки: відкрийте tests.html у браузері.
 * Кожен рядок — очікування, яке або справджується, або ні.
 *
 * Навіщо це вчителю: якщо ви дописали правило чи слово у словник і хочете
 * переконатися, що нічого не зламали, — відкрийте цю сторінку. Червоний
 * рядок покаже, що саме перестало працювати.
 */

import { createEliza } from './engine.js';
import { RULES, CRISIS_RULES, CRISIS_RESPONSES, GREETING, stem } from './rules.js';
import { reflect, PRONOUNS, VERBS } from './reflection.js';

const suites = [];

function suite(name, body) {
  const cases = [];
  body({
    /** Перевіряє довільну умову. */
    ok(label, condition, detail) {
      cases.push({ label, pass: Boolean(condition), detail });
    },
    /** Порівнює два значення. */
    equal(label, actual, expected) {
      cases.push({
        label,
        pass: actual === expected,
        detail: actual === expected ? '' : `отримано: ${JSON.stringify(actual)}, очікували: ${JSON.stringify(expected)}`
      });
    }
  });
  suites.push({ name, cases });
}

/** Свіжий бот на кожен виклик — щоб тести не впливали один на одного. */
const bot = () => createEliza({});

/** Проганяє фразу через усі варіанти відповіді правила. */
function allVariants(phrase, times = 6) {
  const instance = bot();
  return Array.from({ length: times }, () => instance.respond(phrase));
}

/* ═════ 1. Захисний фільтр ═══════════════════════════════════════════════ */

suite('Захисний фільтр (найважливіше)', (t) => {
  const mustCatch = {
    'самопошкодження': [
      'я хочу померти', 'я не хочу жити', 'хочу вбити себе',
      'я хочу себе порізати', 'краще б мене не було',
      'я хочу покінчити з собою', 'я зараз себе вб’ю',
      'краще померти', 'я не бачу сенсу жити',
      'я хочу померти після гри',
      'я хочу померти, а вчора грала в майнкрафт'
    ],
    'насильство': [
      'мене бють вдома', 'мене б’ють вдома', 'тато бє мене',
      'з мене знущаються', 'мене цькують', 'мені погрожують',
      'мене дуже часто б’ють', 'знущаються в школі з мене',
      'мене б’ють вдома, а я граю в майнкрафт'
    ],
    'безнадія': [
      'я нікому не потрібен', 'я нікому не потрібна',
      'ніхто мене не любить', 'ненавиджу себе'
    ]
  };

  for (const [category, phrases] of Object.entries(mustCatch)) {
    phrases.forEach((phrase) => {
      const trace = bot().respond(phrase).trace;
      t.ok(
        `«${phrase}» → захист (${category})`,
        trace.kind === 'crisis' && trace.category === category,
        trace.kind === 'crisis' ? `спрацював, але категорія «${trace.category}»` : `спрацювало: ${trace.kind}`
      );
    });
  }

  // Кризова відповідь має бути сталою — без випадковості й без дзеркала.
  const repeats = allVariants('я хочу померти', 5).map((r) => r.text);
  t.ok('кризова відповідь завжди однакова', new Set(repeats).size === 1);
  t.ok('кризова відповідь згадує дорослого', /дорослому/.test(repeats[0]));
  // Номери мають не просто бути в тексті, а стояти при правильному способі
  // дзвінка. За офіційними контактами «Ла Страда-Україна»:
  // 116 111 — з мобільних, 0 800 500 225 — зі стаціонарних.
  Object.entries(CRISIS_RESPONSES).forEach(([category, text]) => {
    t.ok(`«${category}»: 116 111 — з мобільного`, /116\s?111\s*—\s*з мобільного/.test(text), text);
    t.ok(`«${category}»: 0 800 500 225 — зі стаціонарного`,
      /0\s?800\s?500\s?225\s*—\s*зі\s+стаціонарного/.test(text), text);
    t.ok(`«${category}»: не плутає з лінією 116 123 / 0 800 500 335`,
      !/116\s?123|0\s?800\s?500\s?335/.test(text));
    // «дорослому», «дорослим» — основа спільна, відмінки різні.
    t.ok(`«${category}»: скеровує до дорослого`, /доросл/.test(text), text);
    t.ok(`«${category}»: чесно каже, що вона програма`, /програма/.test(text));
  });

  // Криза не має потрапляти в пам'ять і повертатися пізніше.
  const instance = bot();
  instance.respond('мій тато мене бє');
  const later = Array.from({ length: 6 }, () => instance.respond('абвгд еєжз'));
  t.ok(
    'кризова фраза не спливає з пам\'яті пізніше',
    later.every((r) => !/бє|б’є|тато/.test(r.text))
  );

  // Хибні тривоги на ігровому контексті.
  [
    'мене вбили в майнкрафті', 'я хочу вбити боса в грі',
    'мене бють в роблокс', 'в роблокс мене бють',
    'мій персонаж бється', 'хочу зникнути з цієї гри', 'я хочу грати'
  ].forEach((phrase) => {
    t.ok(`«${phrase}» → НЕ криза`, bot().respond(phrase).trace.kind !== 'crisis');
  });

  // Звичайні дитячі фрази теж не мають лякати.
  ['я хочу собаку', 'мені сумно', 'я люблю котів', 'я хочу морозива',
   'громада грудень гривня'].forEach((phrase) => {
    t.ok(`«${phrase}» → НЕ криза`, bot().respond(phrase).trace.kind !== 'crisis');
  });
});

/* ═════ 2. Межі слів (кирилиця) ══════════════════════════════════════════ */

suite('Межі слів — «я» всередині інших слів', (t) => {
  // Через це стара версія на «твоя мама гарна» відповідала «ти мама гарна».
  [
    ['твоя мама гарна', 'мама'],
    ['моя улюблена гра', 'улюблена'],
    ['ця історія цікава', 'історія'],
    ['зоряна ніч', 'ніч'],
    ['своя кімната', 'кімната']
  ].forEach(([phrase, leaked]) => {
    const results = allVariants(phrase, 5).map((r) => r.text);
    t.ok(
      `«${phrase}» не перетворюється на «ти ${leaked}…»`,
      results.every((text) => !new RegExp('ти\\s+' + leaked, 'i').test(text)),
      results.find((text) => new RegExp('ти\\s+' + leaked, 'i').test(text))
    );
  });

  t.ok('«я» на початку речення ловиться', bot().respond('я малюю').trace.winner !== undefined);
  t.ok('«я» в середині речення ловиться', bot().respond('сьогодні я малюю').trace.winner !== undefined);
});

/* ═════ 3. Дзеркало ══════════════════════════════════════════════════════ */

suite('Дзеркало (заміна особи)', (t) => {
  t.equal('я → ти', reflect('я').text, 'ти');
  t.equal('мене → тебе', reflect('мене').text, 'тебе');
  t.equal('моя мама → твоя мама', reflect('моя мама').text, 'твоя мама');
  t.equal('люблю → любиш', reflect('люблю').text, 'любиш');
  t.equal('не змінює чужі слова', reflect('дракон літає').text, 'дракон літає');
  t.equal('зберігає розділові знаки', reflect('я, мабуть, малюю').text, 'ти, мабуть, малюєш');
  t.ok('позначає, що дієслово знайдено', reflect('я малюю').verbReflected === true);
  t.ok('позначає, що дієслова немає', reflect('я бегемотю').verbReflected === false);

  // Мова: словники не мають містити порожніх значень.
  t.ok('усі займенники мають заміну', Object.values(PRONOUNS).every((v) => v && v.length > 0));
  t.ok('усі дієслова мають заміну', Object.values(VERBS).every((v) => v && v.length > 0));

  // Підстановка в шаблон.
  const loves = allVariants('я люблю котів', 6).map((r) => r.text);
  t.ok('«я люблю котів» → «ти любиш котів»', loves.some((s) => /любиш котів/.test(s)));
  t.ok('ніде не залишається «ти люблю»', loves.every((s) => !/ти\s+люблю/.test(s)));

  const thinks = allVariants('я думаю, що я найкращий', 6).map((r) => r.text);
  t.ok('вкладений займенник теж перевертається', thinks.some((s) => /що ти найкращий/.test(s)));
  t.ok('ніде не лишається «що я найкращий»', thinks.every((s) => !/що я найкращий/.test(s)));

  // Невідоме дієслово → цитата замість зіпсованої граматики.
  const unknown = allVariants('я бегемотю щодня', 5).map((r) => r.text);
  t.ok('невідоме дієслово цитується', unknown.every((s) => s.includes('«')));
});

/* ═════ 4. Підстановка в шаблони ═════════════════════════════════════════ */

suite('Підстановка $<група>', (t) => {
  // Саме тут стара версія падала: new RegExp('{0}') — недійсний вираз.
  ['мені сумно', 'я люблю котів', 'я почуваюся щасливим', 'я хочу собаку',
   'я не можу заснути', 'я думаю, що це смішно'].forEach((phrase) => {
    let crashed = false;
    try { bot().respond(phrase); } catch (error) { crashed = true; }
    t.ok(`«${phrase}» не кидає виняток`, !crashed);
  });

  t.ok(
    'у відповідях не залишається незаповнених $<…>',
    allVariants('я люблю малювати', 6).every((r) => !/\$</.test(r.text))
  );

  // Текст користувача не може підсунути власний плейсхолдер.
  // Перевіряємо лише ті варіанти, які взагалі повторюють слова користувача:
  // серед шаблонів є й такі, що груп не використовують.
  const injected = allVariants('я люблю $<що> і $<дія>', 6).map((r) => r.text);
  const echoing = injected.filter((text) => /любиш/.test(text));
  t.ok(
    'плейсхолдер із тексту користувача не підставляється',
    echoing.length > 0 && echoing.every((text) => text.includes('$<що>')),
    injected.join(' | ')
  );
});

/* ═════ 5. Ранги та конкуренція ══════════════════════════════════════════ */

suite('Ранги правил', (t) => {
  const trace = bot().respond('я люблю малювати драконів').trace;
  t.ok('підходить кілька правил', trace.candidates.length > 1);
  t.ok(
    'виграє правило з найбільшою вагою',
    trace.candidates.every((c) => c.rank <= trace.winner.rank)
  );

  t.equal('питання про Елізу важливіше за загальне питання',
    bot().respond('а ти робот?').trace.winner.id, 2);

  t.ok('усі правила мають унікальний id',
    new Set(RULES.map((r) => r.id)).size === RULES.length);
  t.ok('усі правила мають rank', RULES.every((r) => typeof r.rank === 'number'));
  t.ok('усі правила мають хоч одну відповідь',
    RULES.every((r) => Array.isArray(r.responses) && r.responses.length > 0));
  t.ok('усі кризові правила мають category',
    CRISIS_RULES.every((r) => typeof r.category === 'string' && r.category.length > 0));
});

/* ═════ 6. Кожне правило справді досяжне ═════════════════════════════════ */

suite('Кожне правило можна активувати', (t) => {
  // Фраза-зразок для кожного правила. Якщо ви додали правило — додайте рядок.
  const samples = {
    1: 'хто ти', 2: 'ти робот', 3: 'скільки тобі років', 4: 'привіт',
    5: 'бувай', 6: 'дякую', 7: 'ти дурна', 8: 'я почуваюся щасливим',
    9: 'мені сумно', 10: 'я втомився', 11: 'я хочу собаку', 12: 'я люблю котів',
    13: 'я думаю, що це смішно', 14: 'я не можу заснути', 15: 'я не знаю',
    16: 'допоможи мені', 17: 'моя мама', 18: 'у школі', 19: 'мій друг',
    20: 'мій кіт', 21: 'майнкрафт', 22: 'я малюю', 23: 'морозиво',
    24: 'штучний інтелект', 25: 'тому що холодно', 26: 'а ти любиш морозиво?',
    27: 'чому небо синє?', 28: 'так', 29: 'ні', 30: 'я стрибаю на батуті'
  };

  RULES.forEach((rule) => {
    const sample = samples[rule.id];
    if (sample === undefined) {
      t.ok(`правило #${rule.id} «${rule.name}» має тестову фразу`, false,
        'додайте зразок у samples');
      return;
    }
    const trace = bot().respond(sample).trace;
    t.ok(
      `#${rule.id} «${rule.name}» ← «${sample}»`,
      trace.winner && trace.winner.id === rule.id,
      trace.winner ? `спрацювало #${trace.winner.id} ${trace.winner.name}` : `спрацювало: ${trace.kind}`
    );
  });
});

/* ═════ 7. Пам'ять ═══════════════════════════════════════════════════════ */

suite('Пам\'ять', (t) => {
  const instance = bot();
  instance.respond('моя собака Рекс');
  const reply = instance.respond('абракадабра шурумбурум');
  t.ok('повертається до згаданого раніше', /Рекс/.test(reply.text), reply.text);
  t.equal('позначено як пам\'ять', reply.trace.kind, 'memory');

  const next = instance.respond('тарабарщина квадратна');
  t.equal('наступна відмовка — вже загальна', next.trace.kind, 'generic');

  const empty = bot().respond('абракадабра');
  t.equal('без пам\'яті — одразу загальна відмовка', empty.trace.kind, 'generic');
});

/* ═════ 8. Без повторів поспіль ══════════════════════════════════════════ */

suite('Відповіді не повторюються поспіль', (t) => {
  ['я люблю котів', 'мені сумно', 'привіт'].forEach((phrase) => {
    const texts = allVariants(phrase, 4).map((r) => r.text);
    let repeated = false;
    for (let i = 1; i < texts.length; i++) if (texts[i] === texts[i - 1]) repeated = true;
    t.ok(`«${phrase}» — чотири поспіль без дублів`, !repeated, texts.join(' | '));
  });

  const genericBot = bot();
  const generics = Array.from({ length: 4 }, () => genericBot.respond('абракадабра').text);
  t.ok(
    'відмовки не повторюються поспіль',
    generics.every((text, index) => index === 0 || text !== generics[index - 1]),
    generics.join(' | ')
  );
});

/* ═════ 9. Правила, придумані учнем ══════════════════════════════════════ */

suite('Власні правила', (t) => {
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const make = (name, keys, responses) => ({
    id: 'У1', name, rank: 8, pattern: stem(...keys.map(escape)), responses, isCustom: true
  });

  const instance = createEliza({ customRules: [make('Космос', ['космос', 'ракет'], ['А ти був у космосі?'])] });
  const reply = instance.respond('мене цікавлять ракети');
  t.equal('власне правило спрацьовує', reply.text, 'А ти був у космосі?');
  t.ok('основа слова ловить відмінки', reply.trace.matchedText.includes('ракет'));
  t.ok('позначається як власне', reply.trace.winner.isCustom === true);

  // Спецсимволи не мають ламати регулярний вираз.
  let crashed = false;
  try {
    createEliza({ customRules: [make('Тест', ['*(котик', 'a)b+', '$<x>'], ['ок'])] })
      .respond('мій *(котик тут');
  } catch (error) { crashed = true; }
  t.ok('спецсимволи в словах-підказках не ламають бота', !crashed);

  t.ok('власні правила рахуються',
    createEliza({ customRules: [make('X', ['зоря'], ['ок'])] }).getStats().customCount === 1);
});

/* ═════ 10. Дрібниці ═════════════════════════════════════════════════════ */

suite('Різне', (t) => {
  t.ok('вітання не порожнє', GREETING.length > 40);
  t.ok('вітання чесно каже, що вона не розуміє', /не розумію/.test(GREETING));

  t.ok('порожній ввід не кидає виняток', (() => {
    try { bot().respond('   '); return true; } catch (e) { return false; }
  })());

  t.ok('дуже довгий ввід не кидає виняток', (() => {
    try { bot().respond('я люблю ' + 'ко'.repeat(400)); return true; } catch (e) { return false; }
  })());

  const withEmoji = allVariants('я люблю 🐱🐱', 6).map((r) => r.text).filter((s) => /любиш/.test(s));
  t.ok('емодзі доживають до відповіді неушкодженими',
    withEmoji.length > 0 && withEmoji.every((s) => s.includes('🐱🐱')),
    withEmoji.join(' | '));

  const instance = bot();
  instance.respond('я люблю котів');
  instance.reset();
  t.equal('скидання обнуляє лічильники', instance.getStats().turns, 0);
});

/* ═════ Виведення ════════════════════════════════════════════════════════ */

export function runTests(root) {
  let total = 0;
  let failed = 0;
  root.replaceChildren();

  const summary = document.createElement('div');
  summary.className = 'summary';
  root.append(summary);

  suites.forEach((s) => {
    const section = document.createElement('section');
    const title = document.createElement('h2');
    const failsHere = s.cases.filter((c) => !c.pass).length;
    title.textContent = s.name;
    if (failsHere > 0) title.classList.add('has-fail');
    section.append(title);

    const list = document.createElement('ul');
    s.cases.forEach((c) => {
      total += 1;
      if (!c.pass) failed += 1;

      const item = document.createElement('li');
      item.className = c.pass ? 'pass' : 'fail';
      item.append(Object.assign(document.createElement('span'), {
        className: 'mark', textContent: c.pass ? '✓' : '✕'
      }));
      item.append(Object.assign(document.createElement('span'), {
        className: 'label', textContent: c.label
      }));
      if (!c.pass && c.detail) {
        item.append(Object.assign(document.createElement('span'), {
          className: 'detail', textContent: String(c.detail)
        }));
      }
      list.append(item);
    });

    section.append(list);
    root.append(section);
  });

  summary.className = 'summary ' + (failed === 0 ? 'ok' : 'bad');
  summary.textContent = failed === 0
    ? `Усі перевірки пройдено: ${total} із ${total}`
    : `Не пройдено ${failed} із ${total}`;

  return { total, failed };
}
