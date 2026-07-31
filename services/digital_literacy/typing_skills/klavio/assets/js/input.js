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

  function normalizeCharacter(value) {
    return typeof value === "string" ? value.replace(APOSTROPHES, "'") : "";
  }

  function isSystemCombination(event) {
    return Boolean(event.ctrlKey || event.altKey || event.metaKey || event.repeat);
  }

  function isTextAttempt(event) {
    if (isSystemCombination(event)) return false;
    return typeof event.key === "string" && event.key.length === 1;
  }

  function matchesCharacter(expected, event) {
    if (expected === " ") return event.code === "Space";
    return normalizeCharacter(expected) === normalizeCharacter(event.key);
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
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      return codes.includes(event.code);
    }

    if (typeof event.key === "string" && event.key.length === 1) return true;
    return codes.includes(event.code);
  }

  function matchesTarget(target, event, layouts) {
    if (!target) return false;
    const codes = targetCodes(target, layouts);

    if (target.kind === "control" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
      return codes.includes(event.code);
    }

    return normalizeCharacter(event.key).toLocaleLowerCase("uk-UA") ===
      normalizeCharacter(target.value).toLocaleLowerCase("uk-UA");
  }

  return {
    normalizeCharacter,
    isSystemCombination,
    isTextAttempt,
    matchesCharacter,
    issue,
    isTargetAttempt,
    matchesTarget
  };
});
