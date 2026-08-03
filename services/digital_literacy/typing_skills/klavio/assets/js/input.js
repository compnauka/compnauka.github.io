(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioInput = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const APOSTROPHES = /['ʼ’]/g;
  const UKRAINIAN_CHARACTER = /[а-яіїєґА-ЯІЇЄҐ]/;

  const MODIFIER_CODES = ["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight"];

  // Модифікатор натиснуто окремо, якщо жодного іншого не утримують.
  const LONE_MODIFIER_FLAGS = {
    Control: ["altKey", "shiftKey", "metaKey"],
    Alt: ["ctrlKey", "shiftKey", "metaKey"],
    Shift: ["ctrlKey", "altKey", "metaKey"]
  };

  function normalizeCharacter(value) {
    return typeof value === "string" ? value.replace(APOSTROPHES, "'") : "";
  }

  function isModifierCode(code) {
    return MODIFIER_CODES.indexOf(code) !== -1;
  }

  // AltGr на Windows приходить як Ctrl+Alt. Це звичайне введення «ґ»,
  // а не системна комбінація, тому таку подію не можна відкидати.
  function isAltGraph(event) {
    return Boolean(event.ctrlKey && event.altKey);
  }

  // Ctrl, Alt і Shift самі бувають завданням у «Старті». Натиснуті поодинці,
  // вони ще нічого не запускають, тому подію треба пропустити далі.
  function isLoneModifier(event) {
    const flags = LONE_MODIFIER_FLAGS[event.key];
    if (!flags) return false;
    return flags.every(function (flag) { return !event[flag]; });
  }

  function isSystemCombination(event) {
    if (event.repeat || event.metaKey) return true;
    if (isLoneModifier(event)) return false;
    if (isAltGraph(event)) return false;
    return Boolean(event.ctrlKey || event.altKey);
  }

  // Пробіл має бути видимим у завданні, а не порожнім місцем.
  function displayCharacter(value) {
    if (value === " ") return "␣";
    return value;
  }

  function describeCharacter(value) {
    if (value === " ") return "пробіл";
    return value;
  }

  function isTextAttempt(event) {
    if (isSystemCombination(event)) return false;
    return typeof event.key === "string" && event.key.length === 1;
  }

  function matchesCharacter(expected, event) {
    if (expected === " ") return event.code === "Space";
    const wanted = normalizeCharacter(expected);
    const actual = normalizeCharacter(event.key);

    // У цій шкільній схемі «ґ» — це саме Ctrl+Alt+Г. Перевіряємо
    // і символ, і фізичну клавішу, щоб випадкова інша схема не
    // навчала дитину неправильного руху.
    if (wanted.toLocaleLowerCase("uk-UA") === "ґ") {
      return actual === wanted && isAltGraph(event) && event.code === "KeyU";
    }

    return wanted === actual;
  }

  function issue(expected, event) {
    const wanted = normalizeCharacter(expected);
    const actual = normalizeCharacter(event.key || "");

    if (UKRAINIAN_CHARACTER.test(wanted) && /^[a-z]$/i.test(actual)) return "layout";
    if (wanted !== actual && wanted.toLocaleLowerCase("uk-UA") === actual.toLocaleLowerCase("uk-UA")) return "case";
    return "wrong";
  }

  function targetCodes(target, layouts) {
    if (!target) return [];
    if (Array.isArray(target.codes)) return target.codes;
    if (target.code) return [target.code];
    return layouts && typeof layouts.codesForTarget === "function" ? layouts.codesForTarget(target) : [];
  }

  function isTargetAttempt(target, event, layouts) {
    if (isSystemCombination(event)) return false;

    const codes = targetCodes(target, layouts);
    // Модифікатор рахуємо спробою лише тоді, коли його й просять натиснути.
    // Інакше Shift перед великою літерою чи Ctrl від AltGr стали б помилкою.
    if (isModifierCode(event.code)) return codes.includes(event.code);

    if (typeof event.key === "string" && event.key.length === 1) return true;
    return codes.includes(event.code);
  }

  function matchesTarget(target, event, layouts) {
    if (!target) return false;
    const codes = targetCodes(target, layouts);

    if (target.kind === "control" || isModifierCode(event.code)) {
      return codes.includes(event.code);
    }

    return normalizeCharacter(event.key).toLocaleLowerCase("uk-UA") ===
      normalizeCharacter(target.value).toLocaleLowerCase("uk-UA");
  }

  return {
    modifierCodes: MODIFIER_CODES,
    normalizeCharacter,
    displayCharacter,
    describeCharacter,
    isModifierCode,
    isAltGraph,
    isLoneModifier,
    isSystemCombination,
    isTextAttempt,
    matchesCharacter,
    issue,
    isTargetAttempt,
    matchesTarget
  };
});
