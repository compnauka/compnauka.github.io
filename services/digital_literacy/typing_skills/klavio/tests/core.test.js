"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const metrics = require("../assets/js/metrics.js");
const runtime = require("../assets/js/runtime.js");
const layouts = require("../assets/js/layouts.js");
const input = require("../assets/js/input.js");
const lessonData = require("../lessons/data.js");
const lessonCore = require("../lessons/lesson-core.js");
const wordsData = require("../words/data.js");
const wordCore = require("../words/word-core.js");
const sprintData = require("../sprint/data.js");
const sprintCore = require("../sprint/sprint-core.js");

test("точність враховує кожне неправильне натискання", function () {
  const result = metrics.create();
  metrics.recordCorrect(result);
  metrics.recordCorrect(result);
  metrics.recordError(result);

  assert.equal(metrics.attempts(result), 3);
  assert.equal(metrics.accuracy(result), 67);
});

test("порожня нова сесія має нейтральну точність 100%", function () {
  assert.equal(metrics.accuracy(metrics.create()), 100);
});

test("швидкість використовує нормалізоване слово з п’яти символів", function () {
  const result = metrics.create();
  metrics.start(result, 0);
  result.startedAt = 1;
  metrics.recordCorrect(result, 50);
  metrics.finish(result, 60001);

  assert.equal(metrics.cpm(result), 50);
  assert.equal(metrics.wpm(result), 10);
});

test("раунд має потрібну довжину й не змінює вихідний масив", function () {
  const source = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const result = runtime.buildRound(source, 8, function () { return 0.42; });

  assert.equal(result.length, 8);
  assert.deepEqual(source.map(function (item) { return item.id; }), ["a", "b", "c"]);
  assert.ok(result.every(function (item) { return source.includes(item); }));
});

test("українська літера зіставляється незалежно від регістру", function () {
  const target = { kind: "letter", value: "а" };

  assert.equal(input.matchesTarget(target, { key: "А", code: "KeyF" }, layouts), true);
  assert.equal(input.matchesTarget(target, { key: "о", code: "KeyJ" }, layouts), false);
});

test("латинська літера розпізнається як неправильна розкладка", function () {
  const target = { kind: "letter", value: "а" };

  assert.equal(input.issue(target.value, { key: "f" }), "layout");
  assert.equal(input.issue(target.value, { key: "о" }), "wrong");
});

test("обидві клавіші Shift підходять до одного завдання", function () {
  const target = { kind: "control", value: "Shift", codes: ["ShiftLeft", "ShiftRight"] };

  assert.equal(input.matchesTarget(target, { key: "Shift", code: "ShiftLeft" }, layouts), true);
  assert.equal(input.matchesTarget(target, { key: "Shift", code: "ShiftRight" }, layouts), true);
});

test("автоповтор і системні комбінації не є навчальними спробами", function () {
  assert.equal(input.isTextAttempt({ key: "а", code: "KeyF", repeat: true }), false);
  assert.equal(input.isTextAttempt({ key: "а", code: "KeyF", ctrlKey: true }), false);
  assert.equal(input.isTextAttempt({ key: "а", code: "KeyF" }), true);
});

test("Shift не вважається помилкою перед великою літерою", function () {
  const letter = { kind: "letter", value: "а" };
  const shift = { kind: "control", value: "Shift", codes: ["ShiftLeft", "ShiftRight"] };

  assert.equal(input.isTargetAttempt(letter, { key: "Shift", code: "ShiftLeft" }, layouts), false);
  assert.equal(input.isTargetAttempt(shift, { key: "Shift", code: "ShiftLeft" }, layouts), true);
});

test("Ctrl і Alt, натиснуті окремо, доходять до вправи як звичайні цілі", function () {
  const ctrl = { key: "Control", code: "ControlLeft", ctrlKey: true };
  const alt = { key: "Alt", code: "AltLeft", altKey: true };
  const ctrlTarget = { kind: "control", value: "Ctrl", codes: ["ControlLeft", "ControlRight"] };
  const altTarget = { kind: "control", value: "Alt", code: "AltLeft" };

  assert.equal(input.isSystemCombination(ctrl), false);
  assert.equal(input.isSystemCombination(alt), false);
  assert.equal(input.isTargetAttempt(ctrlTarget, ctrl, layouts), true);
  assert.equal(input.matchesTarget(ctrlTarget, ctrl, layouts), true);
  assert.equal(input.matchesTarget(ctrlTarget, { key: "Control", code: "ControlRight", ctrlKey: true }, layouts), true);
  assert.equal(input.isTargetAttempt(altTarget, alt, layouts), true);
  assert.equal(input.matchesTarget(altTarget, alt, layouts), true);
});

test("модифікатор не рахується помилкою, коли просять іншу клавішу", function () {
  const letter = { kind: "letter", value: "а" };
  const altTarget = { kind: "control", value: "Alt", code: "AltLeft" };

  assert.equal(input.isTargetAttempt(letter, { key: "Control", code: "ControlLeft", ctrlKey: true }, layouts), false);
  assert.equal(input.isTargetAttempt(letter, { key: "Alt", code: "AltLeft", altKey: true }, layouts), false);
  // AltGr спершу надсилає службовий ControlLeft — його теж треба пропустити.
  assert.equal(input.isTargetAttempt(altTarget, { key: "Control", code: "ControlLeft", ctrlKey: true }, layouts), false);
  assert.equal(input.isTargetAttempt(altTarget, { key: "Alt", code: "AltRight", ctrlKey: true, altKey: true }, layouts), false);
});

test("справжня системна комбінація лишається поза вправою", function () {
  assert.equal(input.isSystemCombination({ key: "Alt", code: "AltLeft", ctrlKey: true, altKey: true }), false);
  assert.equal(input.isSystemCombination({ key: "Control", code: "ControlLeft", ctrlKey: true, repeat: true }), true);
  assert.equal(input.isSystemCombination({ key: "Control", code: "ControlLeft", ctrlKey: true, shiftKey: true }), true);
  assert.equal(input.isTextAttempt({ key: "Control", code: "ControlLeft", ctrlKey: true }), false);
});

test("«Старт» має набір з усіма літерами, цифрами та важливими клавішами", function () {
  const startData = require("../start/data.js");
  const everything = startData.sets.everything.targets;
  const kinds = new Set(everything.map(function (target) { return target.kind; }));

  assert.deepEqual([...kinds].sort(), ["control", "digit", "letter"]);
  assert.equal(everything.length, 32 + 10 + 6);
  assert.equal(new Set(everything.map(function (target) { return target.id; })).size, everything.length);
  assert.ok(startData.sets.controls.targets.some(function (target) { return target.value === "Ctrl"; }));
  assert.ok(startData.sets.controls.targets.some(function (target) { return target.value === "Alt"; }));
});

test("мішок видає весь набір, перш ніж повторити елемент", function () {
  const bag = runtime.createBag(["а", "б", "в", "г"]);
  const firstPass = [bag.next(), bag.next(), bag.next(), bag.next()];

  assert.equal(new Set(firstPass).size, 4);
  assert.notEqual(bag.next(), firstPass[3]);
  assert.equal(runtime.createBag([]).next(), null);
});

test("наборів Спринту вистачає на раунд без нав'язливих повторів", function () {
  sprintData.modes.forEach(function (mode) {
    sprintData.difficulties.forEach(function (difficulty) {
      const items = sprintData.targets[mode.id][difficulty.id];
      // Режим «Клавіші» обмежений абеткою — там достатньо десятка перших літер.
      const minimum = mode.id === "keys" ? 10 : 20;
      assert.ok(items.length >= minimum, mode.id + "/" + difficulty.id + ": " + items.length);
      assert.equal(new Set(items).size, items.length, "повтори у " + mode.id + "/" + difficulty.id);
    });
  });
});

test("у Словах кожен рівень покриває цілий раунд без повторів", function () {
  assert.ok(wordsData.pools.hard.length >= 18);
  wordsData.difficulties.forEach(function (level) {
    assert.ok(wordsData.sentences[level.id].length >= 10, level.id);
    assert.equal(new Set(wordsData.sentences[level.id]).size, wordsData.sentences[level.id].length);
  });
});

test("у завданнях для друку немає латиниці — її не набрати українською розкладкою", function () {
  const latin = /[A-Za-z]/;
  const sentences = Object.keys(wordsData.sentences).flatMap(function (id) {
    return wordsData.sentences[id];
  });

  assert.deepEqual(sentences.filter(function (item) { return latin.test(item); }), []);

  const sprintTargets = Object.keys(sprintData.targets).flatMap(function (mode) {
    return Object.keys(sprintData.targets[mode]).flatMap(function (level) {
      return sprintData.targets[mode][level];
    });
  });

  assert.deepEqual(sprintTargets.filter(function (item) { return latin.test(item); }), []);
});

test("курс містить усі 35 вправ без пропусків у нумерації", function () {
  assert.equal(lessonData.lessons.length, 35);
  assert.deepEqual(
    lessonData.lessons.map(function (lesson) { return lesson.id; }),
    Array.from({ length: 35 }, function (_, index) { return index + 1; })
  );
  assert.ok(lessonData.lessons.every(function (lesson) { return lesson.text.trim().length > 0; }));
});

test("навчальні тексти не містять випадкових латинських літер", function () {
  const contaminated = lessonData.lessons.filter(function (lesson) {
    return /[A-Za-z]/.test(lesson.text);
  });

  assert.deepEqual(contaminated, []);
});

test("текст уроку ділиться на слова з пробілом у кінці слова", function () {
  assert.deepEqual(lessonCore.splitWords("ао ва  ов"), ["ао ", "ва  ", "ов"]);
  assert.deepEqual(lessonCore.splitWords(""), []);

  lessonData.lessons.forEach(function (lesson) {
    const words = lessonCore.splitWords(lesson.text);
    assert.equal(words.join(""), lesson.text, "урок " + lesson.id);
    words.slice(1).forEach(function (word) {
      assert.match(word, /^\S/,"урок " + lesson.id + ": рядок не починається з пробілу");
    });
  });
});

test("у вправах великі й малі літери розрізняються", function () {
  assert.equal(input.matchesCharacter("А", { key: "А", code: "KeyF" }), true);
  assert.equal(input.matchesCharacter("А", { key: "а", code: "KeyF" }), false);
  assert.equal(input.issue("А", { key: "а" }), "case");
});

test("апостроф, ґ і кома відповідають шкільній українській розкладці", function () {
  assert.deepEqual(layouts.codesForTarget({ value: "'" }), ["Backquote"]);
  assert.deepEqual(layouts.codesForTarget({ value: "ґ" }), ["KeyU"]);
  assert.deepEqual(layouts.codesForTarget({ value: "," }), ["Slash"]);
  assert.equal(layouts.requiresShift(","), true);
});

test("для великої літери підказка додає протилежний Shift", function () {
  const hints = layouts.hintsForCharacter("А");

  assert.deepEqual(hints.map(function (hint) { return hint.code; }), ["KeyF", "ShiftRight"]);
});

test("спільна клавіатура має корпус із п’ятьма фізичними рядами", function () {
  assert.equal(layouts.ukrainianRows.length, 5);
  assert.equal(layouts.ukrainianRows[4][0].code, "ControlLeft");
  assert.equal(layouts.ukrainianRows[4].some(function (key) { return key.code === "Space"; }), true);
  assert.equal(layouts.ukrainianRows[1].find(function (key) { return key.code === "KeyQ"; }).secondary, "Q");
});

test("словник Слів розподілений за довжиною без латинських домішок", function () {
  assert.ok(wordsData.pools.easy.length > 20);
  assert.ok(wordsData.pools.medium.length > 20);
  assert.ok(wordsData.pools.hard.length > 5);
  assert.equal(wordsData.words.some(function (word) { return /[A-Za-z]/.test(word); }), false);
});

test("апострофи різних накреслень приймаються як одна клавіша", function () {
  assert.equal(input.matchesCharacter("'", { key: "ʼ", code: "Backquote" }), true);
  assert.equal(input.matchesCharacter("’", { key: "'", code: "Backquote" }), true);
});

test("раунд слів не повторює елементи, доки вистачає набору", function () {
  const round = runtime.buildRound(["мама", "тато", "вода"], 3, function () { return 0; });
  assert.equal(new Set(round).size, 3);
});

test("Спринт містить клавіші, сполучення та слова на трьох рівнях", function () {
  assert.deepEqual(sprintData.modes.map(function (mode) { return mode.id; }), ["keys", "combos", "words"]);
  sprintData.modes.forEach(function (mode) {
    sprintData.difficulties.forEach(function (difficulty) {
      assert.ok(sprintData.targets[mode.id][difficulty.id].length > 0);
    });
  });
});

test("довша ціль Спринту отримує більше часу й швидка відповідь більше балів", function () {
  assert.ok(sprintCore.targetDuration(6000, "words", 1) > sprintCore.targetDuration(6000, "keys", 1));
  assert.ok(sprintCore.scoreFor(4, 0.2, 5) > sprintCore.scoreFor(4, 0.9, 5));
});

test("пробіл має власну клавішу на віртуальній клавіатурі", function () {
  assert.deepEqual(layouts.codesForTarget({ value: " " }), ["Space"]);
  assert.equal(input.displayCharacter(" "), "␣");
  assert.equal(input.describeCharacter(" "), "пробіл");
  assert.deepEqual(layouts.hintsForCharacter(" "), [
    { hand: "both", finger: "thumb", name: "великі пальці", code: "Space" }
  ]);
});

test("AltGr не вважається системною комбінацією, бо ним набирають «ґ»", function () {
  const altGraph = { key: "ґ", code: "KeyU", ctrlKey: true, altKey: true };

  assert.equal(input.isSystemCombination(altGraph), false);
  assert.equal(input.isTextAttempt(altGraph), true);
  assert.equal(input.matchesCharacter("ґ", altGraph), true);
  assert.equal(input.matchesCharacter("ґ", { key: "ґ", code: "KeyU" }), false);
  assert.equal(input.matchesCharacter("ґ", { key: "ґ", code: "Backslash", ctrlKey: true, altKey: true }), false);
  assert.equal(input.isSystemCombination({ key: "с", code: "KeyC", ctrlKey: true }), true);
});

test("«ґ» просить утримати Ctrl+Alt і підсвічує саме ці клавіші", function () {
  assert.equal(layouts.requiresAltGraph("ґ"), true);
  assert.equal(layouts.requiresAltGraph("г"), false);
  assert.deepEqual(layouts.modifierCodesForCharacter("ґ"), ["ControlRight", "AltRight"]);
  assert.deepEqual(layouts.codesForTarget({ value: "ґ" }), ["KeyU"]);
  assert.equal(layouts.comboHintForCharacter("ґ"), "Утримуй Ctrl + Alt і натисни Г");
  assert.equal(layouts.comboHintForCharacter("Ґ"), "Утримуй Ctrl + Alt + Shift і натисни Г");
  assert.equal(layouts.comboHintForCharacter("А"), "Утримуй Shift");
  assert.equal(layouts.comboHintForCharacter("а"), "");
});

test("у «Старті» немає «ґ», бо там тренують одну клавішу без модифікаторів", function () {
  const startData = require("../start/data.js");
  const everyTarget = Object.keys(startData.sets).flatMap(function (id) {
    return startData.sets[id].targets.map(function (target) { return target.value; });
  });

  assert.equal(everyTarget.includes("ґ"), false);
  assert.equal(everyTarget.includes("а"), true);
});

test("«ґ» доступна в Уроках, Словах і Спринті", function () {
  assert.ok(lessonData.lessons.some(function (lesson) { return lesson.text.includes("ґ"); }));
  assert.ok(wordsData.words.some(function (word) { return word.includes("ґ"); }));
  assert.ok(sprintData.targets.keys.hard.includes("ґ"));
});

test("Спринт дозволяє обрати бік, з якого летять цілі", function () {
  assert.deepEqual(sprintData.directions.map(function (item) { return item.id; }), ["ltr", "rtl"]);
});

test("errorHint: Caps Lock і регістр", function () {
  const caps = function (on) { return { getModifierState: function (name) { return name === "CapsLock" && on; } }; };
  const upper = Object.assign({ key: "О" }, caps(true));
  assert.equal(input.errorHint("о", upper, layouts).message, "Увімкнено Caps Lock — натисни його, щоб друкувати малими літерами");
  assert.equal(input.errorHint("о", Object.assign({ key: "О" }, caps(false)), layouts).message, "Тут мала літера — без Shift");
  assert.equal(input.errorHint("о", { key: "О" }, layouts).message, "Тут мала літера — без Shift");
  // Із увімкненим Caps Lock Shift дає малу літеру: підказка не має радити лише Shift.
  assert.match(input.errorHint("О", Object.assign({ key: "о" }, caps(true)), layouts).message, /Caps Lock/);
});

test("errorHint: велика літера називає протилежний Shift і не суперечить comboHint", function () {
  // А — на KeyF (ліва рука) → правий Shift; О — на KeyJ (права рука) → лівий Shift.
  assert.equal(input.errorHint("А", { key: "а" }, layouts).message, "Тут велика літера: утримуй правий Shift (мізинцем іншої руки)");
  assert.equal(input.errorHint("О", { key: "о" }, layouts).message, "Тут велика літера: утримуй лівий Shift (мізинцем іншої руки)");
  assert.equal(input.errorHint("А", { key: "а" }).message, "Тут велика літера: утримуй Shift мізинцем іншої руки");
  assert.equal(layouts.comboHintForCharacter("А"), "Утримуй Shift");
  assert.equal(input.errorHint("Ґ", { key: "ґ" }, layouts).message, layouts.comboHintForCharacter("Ґ"));
});

test("errorHint: інший символ, пробіл і розкладка", function () {
  assert.deepEqual(input.errorHint("о", { key: "л" }, layouts), { kind: "wrong", message: "Потрібно: о" });
  assert.equal(input.errorHint(" ", { key: "а" }, layouts).message, "Потрібно: пробіл");
  assert.equal(input.errorHint("о", { key: "j" }, layouts).kind, "layout");
  // issue() лишається без змін для Слів і Спринту.
  assert.equal(input.issue("о", { key: "л" }), "wrong");
});

test("hintVisibility: підказка з'являється після двох помилок на символі", function () {
  const guided = { keyboardHint: true, fingerHint: true };
  const finger = { keyboardHint: false, fingerHint: true };
  const independent = { keyboardHint: false, fingerHint: false };

  assert.deepEqual(lessonCore.hintVisibility(guided, 5), { keyboard: true, finger: true, revealed: false });
  assert.deepEqual(lessonCore.hintVisibility(finger, 0), { keyboard: false, finger: true, revealed: false });
  assert.deepEqual(lessonCore.hintVisibility(finger, 1), { keyboard: false, finger: true, revealed: false });
  assert.deepEqual(lessonCore.hintVisibility(finger, 2), { keyboard: true, finger: true, revealed: true });
  assert.deepEqual(lessonCore.hintVisibility(independent, 1), { keyboard: false, finger: false, revealed: false });
  assert.deepEqual(lessonCore.hintVisibility(independent, 2), { keyboard: true, finger: true, revealed: true });
  assert.equal(lessonCore.HINT_AFTER_MISSES, 2);
});

test("weakKeys: поріг, порядок, пробіли й регістр", function () {
  const text = "аж жа жжо ев є";
  // Поріг ≥2; Ж і ж рахуються разом; пробіл ігнорується.
  assert.deepEqual(lessonCore.weakKeys({ "ж": 1, "Ж": 1, " ": 9, "а": 1 }, text, 3), ["ж"]);
  // За кількістю помилок, а за рівності — за першою появою в тексті.
  assert.deepEqual(lessonCore.weakKeys({ "є": 2, "ж": 2, "е": 5, "о": 1 }, text, 3), ["е", "ж", "є"]);
  // Ліміт n.
  assert.deepEqual(lessonCore.weakKeys({ "є": 2, "ж": 2, "е": 5 }, text, 2), ["е", "ж"]);
  assert.deepEqual(lessonCore.weakKeys({ "ж": 1 }, text, 3), []);
  assert.deepEqual(lessonCore.weakKeys({}, text, 3), []);
});

test("buildDrill: лише дозволені символи, є кожен слабкий, довжина й детермінізм", function () {
  const texts = lessonData.lessons.slice(0, 6).map(function (item) { return item.text; });
  const allowedText = texts.join(" ");
  const allowed = new Set(Array.from(allowedText));
  function makeRandom() {
    let seed = 42;
    return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  }

  [["ж", "д"], ["ж"], ["а", "о", "в"]].forEach(function (weak) {
    const drill = lessonCore.buildDrill(weak, allowedText, texts, makeRandom());
    assert.ok(drill.length >= 60 && drill.length <= 90, "довжина " + drill.length);
    weak.forEach(function (character) { assert.ok(drill.includes(character), character); });
    Array.from(drill).forEach(function (character) { assert.ok(allowed.has(character), "зайвий символ " + character); });
    assert.equal(drill, lessonCore.buildDrill(weak, allowedText, texts, makeRandom()));
  });

  const later = lessonData.lessons.slice(0, 30).map(function (item) { return item.text; });
  const punctuation = lessonCore.buildDrill(["."], later.join(" "), later, makeRandom());
  assert.ok(punctuation.includes("."));
  assert.equal(lessonCore.buildDrill([], allowedText, texts, makeRandom()), "");
});

test("weakKeys: регістр, у якому помилявся учень", function () {
  const text = "Токмак тут";
  assert.deepEqual(lessonCore.weakKeys({ "Т": 3, "т": 1, "к": 2 }, text, 3), ["Т", "к"]);
  assert.deepEqual(lessonCore.weakKeys({ "Т": 1, "т": 2 }, text, 3), ["т"]);
});

test("buildDrill: якість тексту — партнери, подвоєння, знаки, велика літера", function () {
  const FREQUENT = Array.from("аоиіентрвслкдмпу");
  function makeRandom(start) {
    let seed = start;
    return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  }
  function sources(count) { return lessonData.lessons.slice(0, count).map(function (item) { return item.text; }); }
  function drill(count, weak, seed) {
    const texts = sources(count);
    return lessonCore.buildDrill(weak, texts.join(" "), texts, makeRandom(seed));
  }

  for (let seed = 1; seed <= 20; seed += 1) {
    [[6, ["ж", "д"]], [30, ["."]], [31, [",", "."]], [34, ["Т", "к"]], [3, ["д"]], [1, ["а"]]].forEach(function (item) {
      const text = drill(item[0], item[1], seed);
      assert.ok(text.length >= 60 && text.length <= 90, item[0] + ": довжина " + text.length);
      assert.ok(!/(.)\1\1/u.test(text), "три однакові поспіль: " + text);
      item[1].forEach(function (weak) { assert.ok(text.includes(weak), weak + " у «" + text + "»"); });
    });
  }

  // Слабкі «ж», «д» на уроці 6: літери з частих (вивчених) або самі слабкі, без ф, є, ї тощо.
  for (let seed = 1; seed <= 20; seed += 1) {
    const text = drill(6, ["ж", "д"], seed);
    Array.from(text.replace(/ /g, "")).forEach(function (ch) {
      assert.ok(FREQUENT.includes(ch) || "жд".includes(ch), "рідкісна літера " + ch + " у «" + text + "»");
    });
  }

  // Знаки стоять лише одразу після слова з ≥2 літер, не подвоєні й не «...».
  for (let seed = 1; seed <= 20; seed += 1) {
    const text = drill(31, [",", "."], seed);
    assert.ok(!/[.,]{2}/.test(text), text);
    assert.ok(!/(^|\s)[.,]/.test(text), text);
    assert.ok(!/(^|[^\p{L}])\p{L}[.,]/u.test(text), "одна літера перед знаком: " + text);
    text.split(/\s+/).forEach(function (token) { assert.match(token, /^\p{L}{2,}[.,]$/u); });
  }

  // Велика слабка літера дає слова й склади з великої, а не лише малі.
  for (let seed = 1; seed <= 10; seed += 1) {
    const text = drill(34, ["Т"], seed);
    const capitals = text.split(/\s+/).filter(function (token) { return token.startsWith("Т"); });
    assert.ok(capitals.length >= 3, text);
    assert.ok(text.split(/\s+/).every(function (token) { return token.startsWith("Т"); }), text);
  }
});

test("lessonIntro: палець і положення клавіші беруться з розкладки", function () {
  const special = lessonData.intros;
  lessonData.lessons.forEach(function (lesson) {
    const intro = lessonCore.lessonIntro(lesson, layouts, special);
    assert.ok(intro && intro.title, "урок " + lesson.id + " без вступу");
    assert.ok(Array.isArray(intro.lines));
    assert.ok(intro.title.length + intro.lines.join(" ").length <= 150, "завдовгий вступ уроку " + lesson.id);

    const character = (special[lesson.id] && special[lesson.id].char) ||
      (Array.from(lesson.focus).length === 1 ? lesson.focus.toLocaleLowerCase("uk-UA") : "");
    if (!character) return;

    const main = layouts.hintsForCharacter(character)[0];
    assert.ok(intro.title.includes(main.name), "урок " + lesson.id + ": немає пальця «" + main.name + "» у «" + intro.title + "»");
    assert.ok(intro.title.includes(main.hand === "left" ? "лівий" : "правий"), "урок " + lesson.id + ": не та рука");
  });

  assert.equal(lessonCore.lessonIntro(lessonData.lessons[5], layouts, special).title, "Нова клавіша: Ж — правий мізинець");
  assert.deepEqual(lessonCore.lessonIntro(lessonData.lessons[5], layouts, special).lines, ["Вона на домашньому ряду, праворуч від Д."]);
  assert.match(lessonCore.lessonIntro(lessonData.lessons[1], layouts, special).title, /правий середній палець/);
  assert.match(lessonCore.lessonIntro(lessonData.lessons[30], layouts, special).lines[0], /лівий Shift/);
  assert.deepEqual(lessonCore.lessonIntro(lessonData.lessons[32], layouts, special).lines, ["Утримуй Ctrl + Alt і натисни Г."]);
  assert.match(lessonCore.lessonIntro(lessonData.lessons[0], layouts, special).title, /А та О/);
});

test("settings: великий текст і контраст мають типові значення та зберігаються", function () {
  const store = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: function (key) { return store.has(key) ? store.get(key) : null; },
    setItem: function (key, value) { store.set(key, String(value)); }
  };

  try {
    const settings = require("../assets/js/settings.js");
    const element = { dataset: {} };

    assert.equal(settings.isLargeText(), false);
    assert.equal(settings.isHighContrast(), false);
    settings.applyPreferences(element);
    assert.deepEqual(element.dataset, {});

    settings.setLargeText(true);
    settings.setHighContrast(true);
    assert.equal(store.get("klavio.text"), "large");
    assert.equal(store.get("klavio.contrast"), "high");
    assert.equal(settings.isLargeText(), true);
    assert.equal(settings.isHighContrast(), true);
    settings.applyPreferences(element);
    assert.deepEqual(element.dataset, { text: "large", contrast: "high" });

    settings.setLargeText(false);
    settings.applyPreferences(element);
    assert.deepEqual(element.dataset, { contrast: "high" });
    // Звук і тема не зачеплені новими ключами.
    assert.equal(settings.isSoundEnabled(), true);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

test("кожен ряд клавіатури має рівно 15u, а спецклавіші мають ширини ANSI", function () {
  layouts.ukrainianRows.forEach(function (row) {
    const units = row.reduce(function (sum, key) { return sum + (key.w || 1); }, 0);
    assert.equal(units, layouts.rowUnits);
  });

  const byCode = {};
  layouts.ukrainianRows.forEach(function (row) { row.forEach(function (key) { byCode[key.code] = key; }); });
  assert.equal(byCode.Backspace.w, 2);
  assert.equal(byCode.Tab.w, 1.5);
  assert.equal(byCode.Backslash.w, 1.5);
  assert.equal(byCode.CapsLock.w, 1.75);
  assert.equal(byCode.Enter.w, 2.25);
  assert.equal(byCode.ShiftLeft.w, 2.25);
  assert.equal(byCode.ShiftRight.w, 2.75);
  assert.equal(byCode.Space.w, 6.25);
  assert.deepEqual(layouts.ukrainianRows[4].map(function (key) { return key.code; }),
    ["ControlLeft", "MetaLeft", "AltLeft", "Space", "AltRight", "MetaRight", "ContextMenu", "ControlRight"]);
  // «ґ» і далі виконується через фізичну клавішу Г, а Backslash лишається «\».
  assert.equal(byCode.Backslash.label, "\\");
});

test("англійська розкладка: 15u у кожному ряду, ті самі коди, пальці й цілі", function () {
  assert.equal(layouts.englishRows.length, 5);
  layouts.englishRows.forEach(function (row, index) {
    assert.equal(row.reduce(function (sum, key) { return sum + (key.w || 1); }, 0), layouts.rowUnits);
    assert.deepEqual(row.map(function (key) { return key.code; }), layouts.ukrainianRows[index].map(function (key) { return key.code; }));
  });

  const q = layouts.englishRows[1].find(function (key) { return key.code === "KeyQ"; });
  assert.equal(q.label, "Q");
  assert.equal(q.secondary, "Й");

  assert.deepEqual(layouts.codesForTarget({ value: "a" }, "en"), ["KeyA"]);
  assert.deepEqual(layouts.codesForTarget({ value: "A" }, "en"), ["KeyA"]);
  assert.deepEqual(layouts.codesForTarget({ value: "!" }, "en"), ["Digit1"]);
  assert.deepEqual(layouts.codesForTarget({ value: "'" }, "en"), ["Quote"]);
  assert.deepEqual(layouts.codesForTarget({ value: "?" }, "en"), ["Slash"]);
  assert.deepEqual(layouts.codesForTarget({ value: "'" }, "uk"), ["Backquote"]);
  assert.equal(layouts.requiresShift("A", "en"), true);
  assert.equal(layouts.requiresShift("a", "en"), false);
  assert.equal(layouts.requiresShift(",", "en"), false);
  assert.equal(layouts.requiresShift("@", "en"), true);
  assert.equal(layouts.requiresAltGraph("ґ", "en"), false);
  assert.deepEqual(layouts.modifierCodesForCharacter("A", "en"), ["ShiftRight"]);
  assert.equal(layouts.comboHintForCharacter("A", "en"), "Утримуй Shift");
  assert.deepEqual(layouts.hintsForCharacter("A", "en").map(function (hint) { return hint.code; }), ["KeyA", "ShiftRight"]);
  assert.equal(layouts.hintsForCharacter("j", "en")[0].finger, "index");
});

test("активна мова змінює поведінку функцій без параметра", function () {
  try {
    layouts.setLanguage("en");
    assert.deepEqual(layouts.codesForTarget({ value: "a" }), ["KeyA"]);
    assert.equal(layouts.rowsFor(), layouts.englishRows);
  } finally {
    layouts.setLanguage("uk");
  }
  assert.deepEqual(layouts.codesForTarget({ value: "а" }), ["KeyF"]);
  assert.equal(layouts.rowsFor(), layouts.ukrainianRows);
});

test("input: перевірка розкладки й підказки для англійської", function () {
  assert.equal(input.issue("a", { key: "ф" }, "en"), "layout");
  assert.equal(input.issue("a", { key: "s" }, "en"), "wrong");
  assert.equal(input.issue("A", { key: "a" }, "en"), "case");
  assert.equal(input.issue("а", { key: "a" }), "layout");
  assert.equal(input.issue("а", { key: "a" }, "uk"), "layout");
  assert.equal(input.issue("а", { key: "ф" }, "en"), "wrong");

  try {
    layouts.setLanguage("en");
    assert.equal(input.errorHint("a", { key: "ф" }, layouts).kind, "layout");
    assert.equal(input.errorHint("a", { key: "s" }, layouts).message, "Потрібно: a");
    assert.equal(input.errorHint(" ", { key: "s" }, layouts).message, "Потрібно: пробіл");
    assert.equal(input.errorHint("a", { key: "A" }, layouts).message, "Тут мала літера — без Shift");
    assert.equal(input.errorHint("A", { key: "a" }, layouts).message, "Тут велика літера: утримуй правий Shift (мізинцем іншої руки)");
    assert.match(input.errorHint("a", Object.assign({ key: "A" }, { getModifierState: function () { return true; } }), layouts).message, /Caps Lock/);
  } finally {
    layouts.setLanguage("uk");
  }
  assert.equal(layouts.layoutWarningText("en"), "Перемкни на англійську: Alt + Shift або Win + Пробіл");
});

test("англійські набори «Старту» та цілі «Спринту»", function () {
  const startData = require("../start/data.js");
  const english = startData.getSets("en");
  assert.equal(english.starter.targets.length, 10);
  assert.equal(english.alphabet.targets.length, 26);
  assert.equal(startData.getSets("uk"), startData.sets);
  Object.keys(english).forEach(function (id) {
    english[id].targets.forEach(function (target) {
      if (target.kind === "letter") assert.match(target.value, /^[a-z]$/);
    });
  });

  const targets = sprintData.getTargets("en");
  assert.equal(sprintData.getTargets("uk"), sprintData.targets);
  sprintData.modes.forEach(function (mode) {
    sprintData.difficulties.forEach(function (difficulty) {
      const items = targets[mode.id][difficulty.id];
      assert.ok(items.length >= 10);
      assert.equal(new Set(items).size, items.length);
      items.forEach(function (item) { assert.match(item, /^[a-z0-9]+$/); });
    });
  });
});

test("settings: мова друку за замовчуванням uk і зберігається", function () {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: function (k) { return store.has(k) ? store.get(k) : null; }, setItem: function (k, v) { store.set(k, String(v)); } }
  });
  try {
    const settings = require("../assets/js/settings.js");
    assert.equal(settings.getLanguage(), "uk");
    settings.setLanguage("en");
    assert.equal(settings.getLanguage(), "en");
    assert.equal(store.get("klavio.lang"), "en");
    settings.setLanguage("xx");
    assert.equal(settings.getLanguage(), "uk");
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});

// ---- Англійський курс уроків, слова й речення ---------------------------------
const lessonDataEn = require("../lessons/data-en.js");

function seeded(seed) {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function learnedBefore(lessonId) {
  const letters = new Set();
  const marks = new Set();
  lessonDataEn.lessons.filter(function (lesson) { return lesson.id <= lessonId; }).forEach(function (lesson) {
    (lesson.keys || []).forEach(function (key) {
      if (/[a-z]/.test(key)) letters.add(key); else marks.add(key);
    });
  });
  return { letters, marks };
}

test("EN-курс: ідентифікатори, групи, довжини й дозволені символи", function () {
  const lessons = lessonDataEn.lessons;
  assert.ok(lessons.length >= 24 && lessons.length <= 30);
  assert.deepEqual(lessons.map(function (lesson) { return lesson.id; }), lessons.map(function (lesson, index) { return index + 1; }));

  // Групи покривають усі уроки без пропусків.
  let expected = 1;
  lessonDataEn.groups.forEach(function (group) {
    assert.equal(group.range[0], expected);
    expected = group.range[1] + 1;
    lessons.filter(function (lesson) { return lesson.groupId === group.id; }).forEach(function (lesson) {
      assert.ok(lesson.id >= group.range[0] && lesson.id <= group.range[1]);
    });
  });
  assert.equal(expected - 1, lessons.length);

  lessons.forEach(function (lesson) {
    assert.ok(lesson.text.length >= 80 && lesson.text.length <= 170, "довжина уроку " + lesson.id);
    assert.equal(lesson.text, lesson.text.trim());
    assert.ok(!/ {2}/.test(lesson.text));

    const learned = learnedBefore(lesson.id);
    // Великі літери дозволені з уроку 16; усі літери вивчено вже до нього.
    const allowed = function (char) {
      if (char === " ") return true;
      if (/[a-z]/.test(char)) return learned.letters.has(char);
      if (/[A-Z]/.test(char)) return lesson.id >= 16 && learned.letters.has(char.toLowerCase());
      return learned.marks.has(char);
    };
    Array.from(lesson.text).forEach(function (char) {
      assert.ok(allowed(char), "урок " + lesson.id + ": недозволений символ «" + char + "»");
    });

    // Фокус-клавіша присутня в тексті.
    (lesson.keys || []).forEach(function (key) {
      assert.ok(lesson.text.includes(key), "урок " + lesson.id + " без " + key);
    });
  });

  assert.ok(/[A-Z]/.test(lessons[15].text) && /[A-Z]/.test(lessons[16].text));
  assert.deepEqual(lessons.slice(0, 15).map(function (lesson) { return lesson.keys.join(""); }),
    ["fj", "dk", "sl", "a;", "gh", "ei", "ru", "ty", "wo", "qp", "c,", "vm", "x.", "z/", "bn"]);
});

test("EN-вступи: палець беруться з розкладки для кожного уроку", function () {
  lessonDataEn.lessons.forEach(function (lesson) {
    const intro = lessonCore.lessonIntro(lesson, layouts, lessonDataEn.intros, "en");
    assert.ok(intro && intro.title, "вступ уроку " + lesson.id);
    (lesson.keys || []).forEach(function (key) {
      const hints = layouts.hintsForCharacter(key, "en");
      assert.ok(hints.length > 0, "палець для " + key);
    });
  });

  const intros = lessonDataEn.lessons.map(function (lesson) { return lessonCore.lessonIntro(lesson, layouts, lessonDataEn.intros, "en"); });
  assert.match(intros[0].title, /F та J/);
  assert.match(intros[1].title, /D — лівий середній палець, K — правий середній палець/);
  assert.match(intros[5].title, /E — лівий середній палець, I — правий середній палець/);
  assert.match(intros[5].lines.join(" "), /E: у верхньому ряду, праворуч від W/);
  assert.match(intros[3].title, /A — лівий мізинець, крапка з комою \(;\) — правий мізинець/);
  assert.match(intros[18].lines[0], /лівий Shift/);
  assert.match(intros[19].lines[0], /правий Shift/);
  // Українські вступи не змінились.
  assert.match(lessonCore.lessonIntro(lessonData.lessons[5], layouts, lessonData.intros).title, /Ж — правий мізинець/);
});

test("EN: weakKeys і buildDrill використовують лише вивчені літери", function () {
  const texts = lessonDataEn.lessons.slice(0, 9).map(function (lesson) { return lesson.text; });
  const allowedText = texts.join(" ");
  const learned = new Set(Array.from(allowedText));

  [["e"], ["w", "o"], ["t", "y", "r"], ["T"]].forEach(function (weak) {
    const drill = lessonCore.buildDrill(weak, allowedText, texts, seeded(7), "en");
    assert.ok(drill.length >= 70 && drill.length <= 90, "довжина " + drill.length);
    Array.from(drill).forEach(function (char) {
      assert.ok(char === " " || learned.has(char) || learned.has(char.toLowerCase()), "символ «" + char + "» у вправі " + weak.join(""));
    });
    weak.forEach(function (key) { assert.ok(drill.toLowerCase().includes(key.toLowerCase())); });
  });

  const text = "the quick";
  assert.deepEqual(lessonCore.weakKeys({ "e": 3, "t": 2, "q": 1, " ": 5 }, text, 3), ["e", "t"]);
});

test("EN: слова й речення — лише латиниця, апостроф і базова пунктуація", function () {
  const english = wordsData.getContent("en");
  ["easy", "medium", "hard"].forEach(function (level) {
    assert.ok(english.pools[level].length >= 80, "слів у рівні " + level);
    assert.ok(english.sentences[level].length >= 14, "речень у рівні " + level);
    english.pools[level].forEach(function (word) { assert.match(word, /^[a-z]+$/); });
    english.sentences[level].forEach(function (sentence) {
      assert.match(sentence, /^[A-Z][A-Za-z' ,.?!]+[.?!]$/);
    });
    assert.equal(new Set(english.pools[level]).size, english.pools[level].length);
  });
  english.pools.easy.forEach(function (word) { assert.ok(word.length <= 5); });
  english.pools.medium.forEach(function (word) { assert.ok(word.length >= 6 && word.length <= 8); });
  english.pools.hard.forEach(function (word) { assert.ok(word.length >= 9); });
  assert.equal(wordsData.getContent("uk").pools, wordsData.pools);
});

test("EN: у уроках і словах немає небажаних для дітей слів", function () {
  const banned = ["gash", "hag", "gag", "slash", "sag", "hash", "dash", "lass", "alas", "fad", "fads", "lad", "lads", "adds", "gas"];
  const lessonWords = lessonDataEn.lessons.flatMap(function (lesson) { return lesson.text.toLowerCase().match(/[a-z]+/g) || []; });
  const english = wordsData.getContent("en");
  const poolWords = Object.keys(english.pools).flatMap(function (level) { return english.pools[level]; });
  const sentenceWords = Object.keys(english.sentences).flatMap(function (level) {
    return english.sentences[level].flatMap(function (sentence) { return sentence.toLowerCase().match(/[a-z]+/g) || []; });
  });
  banned.forEach(function (word) {
    assert.ok(!lessonWords.includes(word), "урок містить " + word);
    assert.ok(!poolWords.includes(word), "слова містять " + word);
    assert.ok(!sentenceWords.includes(word), "речення містять " + word);
  });
});

test("EN: «;» і «/» стоять лише у справжніх прикладах", function () {
  const lessons = lessonDataEn.lessons;
  assert.ok(!/b(sad|dad|fall|add|all|ask|flask|salad);/.test(lessons[3].text), "«;» не після слів");
  assert.ok(!/(zoo|glaze|pizza)\//.test(lessons[13].text));
  assert.ok(/he\/she|his\/her|him\/her/.test(lessons[13].text));
});

// ---- Крок D: спільні модулі, фільтр слів за уроком ------------------------------
const weakKeysApi = require("../assets/js/weak-keys.js");
const hintModesApi = require("../assets/js/hint-modes.js");
const textFieldApi = require("../assets/js/text-field.js");

test("фільтр слів за вивченими уроками: українські слова й речення", function () {
  const content = wordsData.getContent("uk");
  const learned5 = wordCore.learnedCharacters(lessonData.lessons, 5);
  const filtered5 = wordCore.filterByLearned(content.pools.easy, learned5);
  assert.ok(filtered5.length >= 1);
  filtered5.forEach(function (word) {
    Array.from(word).forEach(function (character) { assert.ok(learned5.exact.has(character), word); });
  });

  // «Усі літери» (null) нічого не відфільтровує, а пізніший урок дає більше слів.
  assert.equal(wordCore.filterByLearned(content.pools.easy, null).length, content.pools.easy.length);
  const counts = [5, 10, 20, 29, 35].map(function (n) {
    return wordCore.filterByLearned(content.pools.easy, wordCore.learnedCharacters(lessonData.lessons, n)).length;
  });
  assert.deepEqual(counts.slice().sort(function (a, b) { return a - b; }), counts);
  assert.ok(counts[4] >= 40);

  // Речення з крапкою й великою літерою з'являються лише після відповідних уроків.
  const early = wordCore.learnedCharacters(lessonData.lessons, 20);
  assert.equal(wordCore.filterByLearned(content.sentences.easy, early).length, 0);
  const late = wordCore.learnedCharacters(lessonData.lessons, 35);
  assert.ok(wordCore.filterByLearned(content.sentences.easy, late).length >= 3);
});

test("фільтр слів за вивченими уроками: англійська", function () {
  const content = wordsData.getContent("en");
  const learned = wordCore.learnedCharacters(lessonDataEn.lessons, 10);
  const words = wordCore.filterByLearned(content.pools.easy, learned);
  assert.ok(words.length >= 30);
  words.forEach(function (word) {
    Array.from(word).forEach(function (character) { assert.ok("fjdksla;ghe irutywoqp".includes(character), word); });
  });
  assert.ok(!words.some(function (word) { return /[cvmxzbn]/.test(word); }));

  // Великі літери дозволені лише після уроків про них.
  assert.equal(wordCore.isAllowed("A", wordCore.learnedCharacters(lessonDataEn.lessons, 15)), false);
  assert.equal(wordCore.isAllowed("A", wordCore.learnedCharacters(lessonDataEn.lessons, 16)), true);
  const sentences = wordCore.filterByLearned(content.sentences.medium, wordCore.learnedCharacters(lessonDataEn.lessons, 24));
  assert.equal(sentences.length, content.sentences.medium.length);
});

test("weakWords: слова зі слабкою літерою, повтор до потрібної кількості", function () {
  const words = ["вода", "мама", "тато", "ліс"];
  const result = wordCore.weakWords(["В"], words, 5, seeded(3));
  assert.equal(result.length, 5);
  result.forEach(function (word) { assert.equal(word, "вода"); });
  assert.deepEqual(wordCore.weakWords(["ж"], words, 5, seeded(3)), []);
});

test("спільні модулі: weakKeys, режими підказок, поділ тексту на слова", function () {
  // Той самий weakKeys, що й в «Уроках».
  assert.deepEqual(weakKeysApi.weakKeys({ "є": 2, "ж": 2, "е": 5 }, "ежє", 3), lessonCore.weakKeys({ "є": 2, "ж": 2, "е": 5 }, "ежє", 3));
  assert.deepEqual(weakKeysApi.weakKeys({ "a": 1 }, "a", 3), []);

  assert.deepEqual(hintModesApi.MODES.map(function (mode) { return mode.id; }), ["guided", "finger", "independent"]);
  const independent = hintModesApi.find("independent");
  assert.deepEqual(hintModesApi.visibility(independent, 0), { keyboard: false, finger: false, revealed: false });
  assert.deepEqual(hintModesApi.visibility(independent, hintModesApi.HINT_AFTER_MISSES), { keyboard: true, finger: true, revealed: true });
  assert.equal(hintModesApi.visibility(hintModesApi.find("guided"), 0).revealed, false);
  assert.equal(hintModesApi.find("невідомий").id, "guided");

  assert.deepEqual(textFieldApi.splitWords("раз два  три"), ["раз ", "два  ", "три"]);
  assert.deepEqual(textFieldApi.splitWords(""), []);
});

test("Спринт UK: немає нетипових сполучень, англійські цілі є", function () {
  const all = Object.keys(sprintData.targets.combos).flatMap(function (level) { return sprintData.targets.combos[level]; });
  ["ерж", "юва", "обі"].forEach(function (combo) { assert.ok(!all.includes(combo), combo); });
  Object.keys(sprintData.targets.combos).forEach(function (level) {
    const items = sprintData.targets.combos[level];
    assert.equal(new Set(items).size, items.length);
  });
});
