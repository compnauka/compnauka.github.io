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
