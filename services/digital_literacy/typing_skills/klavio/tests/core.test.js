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

test("вікно тексту тримає поточний символ біля сталої позиції", function () {
  const text = "0123456789".repeat(12);
  const view = lessonCore.textWindow(text, 65, 40, 15);

  assert.equal(view.start, 50);
  assert.equal(view.current, text[65]);
  assert.equal(view.done.length, 15);
  assert.equal(view.done + view.current + view.todo, text.slice(view.start, view.end));
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
