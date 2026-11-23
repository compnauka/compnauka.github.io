(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioLessonCore = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Ділить текст уроку на слова для показу в полі. Пробіл після слова
  // належить цьому слову: так рядок переноситься лише між словами,
  // а пробіл ніколи не опиняється на початку нового рядка.
  function splitWords(text) {
    return String(text).match(/\S+\s*|\s+/g) || [];
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return minutes + ":" + seconds;
  }

  // Після стількох помилок поспіль на одному символі режим тимчасово показує вимкнені підказки.
  const HINT_AFTER_MISSES = 2;

  // Що показувати для режиму config { keyboardHint, fingerHint } після missesOnChar помилок
  // на поточному символі. revealed — підказку показано лише завдяки помилкам.
  function hintVisibility(config, missesOnChar) {
    const stuck = missesOnChar >= HINT_AFTER_MISSES;
    const keyboard = Boolean(config.keyboardHint) || stuck;
    const finger = Boolean(config.fingerHint) || stuck;
    return {
      keyboard,
      finger,
      revealed: keyboard !== Boolean(config.keyboardHint) || finger !== Boolean(config.fingerHint)
    };
  }

  // Слабкі символи рахує спільний модуль assets/js/weak-keys.js (його ж використовують Старт, Слова й Спринт).
  const weakApi = typeof module === "object" && module.exports ? require("../assets/js/weak-keys.js") : window.KlavioWeakKeys;

  function weakKeys(errorCounts, text, n, minMisses) {
    return weakApi.weakKeys(errorCounts, text, n, minMisses);
  }

  // Найчастіші літери: лише вони правлять за партнерів у сполученнях, щоб склади були вимовними.
  const FREQUENT_LETTERS = Array.from("аоиіентрвслкдмпу");
  const VOWELS = Array.from("аеєиіїоуюя");
  // Для англійської: найчастіші літери та голосні (y рахуємо голосною, як у складах).
  const FREQUENT_LETTERS_EN = Array.from("etaoinshrldu");
  const VOWELS_EN = Array.from("aeiouy");
  const LETTER = /^\p{L}+$/u;

  function lowerCase(value) { return value.toLocaleLowerCase("uk-UA"); }
  function isLetter(value) { return lowerCase(value) !== value.toLocaleUpperCase("uk-UA"); }
  function capitalize(word) { return word.charAt(0).toLocaleUpperCase("uk-UA") + word.slice(1); }

  // Схоже на справжнє слово: ≥3 літер, є голосна, немає трьох приголосних поспіль, а літера
  // не повторюється впритул, через одну чи через дві. Так відсіюються штучні «слова» на кшталт «фофоф»,
  // «ададд», «джєдє», якими починаються тексти уроків.
  function isWordLike(word, vowelList) {
    const vowelSet = vowelList || VOWELS;
    const letters = Array.from(lowerCase(word));
    if (letters.length < 3 || !letters.some(function (c) { return vowelSet.indexOf(c) !== -1; })) return false;
    for (let i = 1; i < letters.length; i += 1) {
      if (letters[i] === letters[i - 1] || (i >= 2 && letters[i] === letters[i - 2]) || (i >= 3 && letters[i] === letters[i - 3])) return false;
      if (i >= 2 && [i, i - 1, i - 2].every(function (k) { return vowelSet.indexOf(letters[k]) === -1; })) return false;
    }
    return true;
  }

  // Коротка вправа (70–90 символів) на слабкі символи. Використовує лише літери з allowedText
  // (текст уроків до поточного включно), тож нових літер не з'являється. Складається зі
  // складів із частих літер, справжніх слів із текстів і, для знаків, слів із комою чи крапкою.
  // Велика слабка літера тренується у складах і словах з великої. random повертає число з [0, 1).
  // language — "uk" (за замовчуванням) або "en": визначає часті літери й голосні.
  function buildDrill(weakChars, allowedText, sourceTexts, random, language) {
    const FREQUENT_LETTERS_USED = language === "en" ? FREQUENT_LETTERS_EN : FREQUENT_LETTERS;
    const VOWELS_USED = language === "en" ? VOWELS_EN : VOWELS;
    const MIN_LENGTH = 70;
    const MAX_LENGTH = 90;
    const weak = Array.from(weakChars || []);
    if (weak.length === 0) return "";

    const weakLower = weak.map(lowerCase);
    const learned = new Set(Array.from(lowerCase(String(allowedText))).filter(isLetter));

    function pick(list) { return list[Math.floor(random() * list.length)]; }
    function shuffle(list) {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
      }
      return copy;
    }

    // Партнери: часті літери серед вивчених; якщо їх замало — усі вивчені, які є.
    let partners = FREQUENT_LETTERS_USED.filter(function (c) { return learned.has(c) && weakLower.indexOf(c) === -1; });
    if (partners.length < 2) {
      partners = Array.from(learned).filter(function (c) { return weakLower.indexOf(c) === -1 && "ьй".indexOf(c) === -1; });
    }
    const vowels = partners.filter(function (c) { return VOWELS_USED.indexOf(c) !== -1; });
    const consonants = partners.filter(function (c) { return VOWELS_USED.indexOf(c) === -1; });

    function vowel() { return pick(vowels.length ? vowels : consonants.length ? consonants : weakLower); }
    function consonant() { return pick(consonants.length ? consonants : vowels.length ? vowels : weakLower); }

    // Склад із літерою c: «жа», «ож», «жо», «Та». Подвоєння — найбільше «жжа», як у самих уроках.
    function syllable(c) {
      // Партнерів немає (вивчені лише слабкі літери): комбінуємо самі слабкі, не більше подвоєння.
      if (partners.length === 0) return c + pick(weak.filter(function (x) { return x !== c; }).concat([c]));
      const lower = lowerCase(c);
      const capital = c !== lower;
      const k = consonant();
      const v = vowel();

      if (lower === "ь") return pick([k + c, v + k + c, k + c + v]);
      if (lower === "й") return pick([v + c, k + v + c, v + c + v]);
      if (VOWELS_USED.indexOf(lower) !== -1) {
        return capital ? c + pick([k, k + v, k + v + k]) : pick([k + c, c + k, k + c + k, c + k + c]);
      }
      if (capital) return c + pick([v, v + k, v + k + v]);
      return pick([c + v, v + c, c + v + k, k + v + c, c + c + v, v + c + v]);
    }

    // Слова з текстів, придатні для вправи: чисті літери без розділових знаків.
    const learnedWords = [];
    const seenWords = new Set();
    (sourceTexts || []).forEach(function (text) {
      String(text).split(/\s+/).forEach(function (raw) {
        const word = raw.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
        if (!word || seenWords.has(word) || !LETTER.test(word) || !isWordLike(word, VOWELS_USED)) return;
        // Скорочення з крапкою («укр.», «лат.», «мед.») — не слова.
        if (/\.$/.test(raw) && word.length <= 4) return;
        if (Array.from(word.slice(1)).some(function (ch) { return ch !== lowerCase(ch); })) return;
        if (!Array.from(lowerCase(word)).every(function (ch) { return learned.has(ch); })) return;
        seenWords.add(word);
        learnedWords.push(word);
      });
    });

    function wordsFor(c) {
      const lower = lowerCase(c);
      const capital = c !== lower;
      const found = learnedWords.filter(function (word) {
        const letters = Array.from(lowerCase(word));
        if (capital) return letters[0] === lower;
        // Для малої літери беремо слова лише з частих літер і самих слабких.
        return word === lowerCase(word) && letters.indexOf(lower) !== -1 &&
          letters.every(function (ch) { return FREQUENT_LETTERS_USED.indexOf(ch) !== -1 || weakLower.indexOf(ch) !== -1; });
      });
      return shuffle(found).map(function (word) { return capital ? capitalize(word) : word; });
    }

    // Слово для знака: справжнє, а за браком — вимовне з двох складів.
    function plainWord() {
      return consonant() + vowel() + consonant() + vowel();
    }

    const queues = {};
    weak.forEach(function (c) {
      queues[c] = isLetter(c) ? wordsFor(c) : shuffle(learnedWords.filter(function (word) { return word === lowerCase(word); }));
    });

    const used = new Set();
    function next(c, preferWord) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        let token;
        if (!isLetter(c)) token = (queues[c].shift() || plainWord()) + c;
        else if (preferWord && queues[c].length) token = queues[c].shift();
        else token = syllable(c);
        // Коли унікальних складів не лишилось (найперші уроки), повторюємо останній варіант.
        if (!used.has(token) || attempt === 7) { used.add(token); return token; }
      }
      return null;
    }

    const tokens = [];
    let length = 0;
    function add(token) {
      if (!token) return;
      const extra = (tokens.length ? 1 : 0) + token.length;
      if (tokens.length && length + extra > MAX_LENGTH) return;
      tokens.push(token);
      length += extra;
    }

    // Перший круг гарантує, що кожен слабкий символ є у вправі.
    weak.forEach(function (c) { add(next(c, !isLetter(c))); });
    for (let round = 0; length < MIN_LENGTH && round < 80; round += 1) {
      const c = weak[round % weak.length];
      // Слова й склади чергуються кожен повний круг по слабких символах.
      add(next(c, Math.floor(round / weak.length) % 2 === 0));
    }
    return tokens.join(" ");
  }

  const SIDE = { left: "лівий", right: "правий" };
  const ROW_NAMES = { 1: "у верхньому ряду", 2: "на домашньому ряду", 3: "у нижньому ряду" };

  // «правий мізинець», «лівий вказівний палець».
  function fingerPhrase(hint) {
    const side = SIDE[hint.hand] || "";
    return side + " " + hint.name + (hint.name === "мізинець" ? "" : " палець");
  }

  // Де клавіша: рядок і сусід у тому ж рядку («на домашньому ряду, праворуч від Д»).
  // Фраза без підмета: «на домашньому ряду, праворуч від Д». Порожня, якщо сусідніх літер немає.
  function positionPhrase(character, layouts, language) {
    const wanted = lowerCase(character);
    const rows = language === "en" && layouts.englishRows ? layouts.englishRows : layouts.ukrainianRows;
    for (let r = 1; r <= 3; r += 1) {
      const row = rows[r];
      const index = row.findIndex(function (key) { return key.value && lowerCase(key.value) === wanted; });
      if (index === -1) continue;

      const before = row[index - 1];
      const after = row[index + 1];
      const hasLetter = function (key) { return key && key.value && isLetter(key.value); };
      if (hasLetter(before)) return ROW_NAMES[r] + ", праворуч від " + before.label;
      if (hasLetter(after)) return ROW_NAMES[r] + ", ліворуч від " + after.label;
    }
    return "";
  }

  function positionTip(character, layouts, language) {
    const phrase = positionPhrase(character, layouts, language);
    return phrase ? "Вона " + phrase + "." : "";
  }

  // Вступ до уроку: { title, lines } або null. Палець беремо з розкладки, а не дублюємо в даних.
  // language — "uk" (за замовчуванням) або "en". Урок може мати keys (кілька нових клавіш),
  // а вступ — notes і labels для знаків: { notes: { ";": "..." }, labels: { ";": "крапка з комою (;)" } }.
  function lessonIntro(lesson, layouts, intros, language) {
    const lang = language === "en" ? "en" : "uk";
    const spec = (intros && intros[lesson.id]) || {};
    if (spec.title) return { title: spec.title, lines: (spec.lines || []).slice() };

    const labels = spec.labels || {};
    const notes = spec.notes || {};
    const labelOf = function (key) {
      return labels[key] || (isLetter(key) ? key.toLocaleUpperCase("uk-UA") : key);
    };

    const keys = Array.isArray(lesson.keys) ? lesson.keys : null;
    if (keys && keys.length > 1) {
      const parts = [];
      const lines = [];
      keys.forEach(function (key) {
        const hints = layouts.hintsForCharacter(key, lang);
        if (!hints.length) return;
        parts.push(labelOf(key) + " — " + fingerPhrase(hints[0]));
        const shiftHand = hints[1] ? SIDE[hints[1].hand] : "";
        const phrase = positionPhrase(key, layouts, lang);
        const note = notes[key] ? notes[key].replace("{shift}", shiftHand) : phrase ? phrase + "." : "";
        if (note) lines.push(labelOf(key) + ": " + note);
      });
      if (!parts.length) return null;
      return { title: "Нові клавіші: " + parts.join(", "), lines: lines };
    }

    const focus = String(lesson.focus || "");
    const character = spec.char || (keys && keys[0]) || (Array.from(focus).length === 1 ? lowerCase(focus) : "");
    if (!character) return null;

    const hints = layouts.hintsForCharacter(character, lang);
    if (!hints.length) return null;

    const shiftHand = hints[1] ? SIDE[hints[1].hand] : "";
    const lines = [];
    if (spec.note) lines.push(spec.note.replace("{shift}", shiftHand));
    else lines.push(positionTip(character, layouts, lang));
    const combo = layouts.comboHintForCharacter(character, lang);
    if (combo.indexOf("Ctrl") !== -1) lines.push(combo + ".");

    return {
      title: "Нова клавіша: " + (spec.label || labelOf(character)) + " — " + fingerPhrase(hints[0]),
      lines: lines.filter(Boolean)
    };
  }

  return { splitWords, formatTime, hintVisibility, HINT_AFTER_MISSES, weakKeys, buildDrill, lessonIntro };
});
