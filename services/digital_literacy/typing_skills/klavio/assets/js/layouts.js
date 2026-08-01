(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioLayouts = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const UKRAINIAN_ROWS = [
    [
      { code: "Backquote", label: "ʼ", secondary: "~", value: "'" },
      { code: "Digit1", label: "1", secondary: "!", value: "1" },
      { code: "Digit2", label: "2", secondary: "\"", value: "2" },
      { code: "Digit3", label: "3", secondary: "№", value: "3" },
      { code: "Digit4", label: "4", secondary: ";", value: "4" },
      { code: "Digit5", label: "5", secondary: "%", value: "5" },
      { code: "Digit6", label: "6", secondary: ":", value: "6" },
      { code: "Digit7", label: "7", secondary: "?", value: "7" },
      { code: "Digit8", label: "8", secondary: "*", value: "8" },
      { code: "Digit9", label: "9", secondary: "(", value: "9" },
      { code: "Digit0", label: "0", secondary: ")", value: "0" },
      { code: "Minus", label: "−", secondary: "_", muted: true },
      { code: "Equal", label: "=", secondary: "+", muted: true },
      { code: "Backspace", label: "⌫", width: "wide" }
    ],
    [
      { code: "Tab", label: "Tab", width: "medium", muted: true },
      { code: "KeyQ", label: "Й", secondary: "Q", value: "й" },
      { code: "KeyW", label: "Ц", secondary: "W", value: "ц" },
      { code: "KeyE", label: "У", secondary: "E", value: "у" },
      { code: "KeyR", label: "К", secondary: "R", value: "к" },
      { code: "KeyT", label: "Е", secondary: "T", value: "е" },
      { code: "KeyY", label: "Н", secondary: "Y", value: "н" },
      { code: "KeyU", label: "Г", secondary: "U", value: "г" },
      { code: "KeyI", label: "Ш", secondary: "I", value: "ш" },
      { code: "KeyO", label: "Щ", secondary: "O", value: "щ" },
      { code: "KeyP", label: "З", secondary: "P", value: "з" },
      { code: "BracketLeft", label: "Х", secondary: "[", value: "х" },
      { code: "BracketRight", label: "Ї", secondary: "]", value: "ї" },
      { code: "Backslash", label: "\\", muted: true }
    ],
    [
      { code: "CapsLock", label: "Caps", width: "wide", muted: true },
      { code: "KeyA", label: "Ф", secondary: "A", value: "ф" },
      { code: "KeyS", label: "І", secondary: "S", value: "і" },
      { code: "KeyD", label: "В", secondary: "D", value: "в" },
      { code: "KeyF", label: "А", secondary: "F", value: "а" },
      { code: "KeyG", label: "П", secondary: "G", value: "п" },
      { code: "KeyH", label: "Р", secondary: "H", value: "р" },
      { code: "KeyJ", label: "О", secondary: "J", value: "о" },
      { code: "KeyK", label: "Л", secondary: "K", value: "л" },
      { code: "KeyL", label: "Д", secondary: "L", value: "д" },
      { code: "Semicolon", label: "Ж", secondary: ";", value: "ж" },
      { code: "Quote", label: "Є", secondary: "'", value: "є" },
      { code: "Enter", label: "Enter", width: "wide" }
    ],
    [
      { code: "ShiftLeft", label: "Shift", width: "xwide" },
      { code: "KeyZ", label: "Я", secondary: "Z", value: "я" },
      { code: "KeyX", label: "Ч", secondary: "X", value: "ч" },
      { code: "KeyC", label: "С", secondary: "C", value: "с" },
      { code: "KeyV", label: "М", secondary: "V", value: "м" },
      { code: "KeyB", label: "И", secondary: "B", value: "и" },
      { code: "KeyN", label: "Т", secondary: "N", value: "т" },
      { code: "KeyM", label: "Ь", secondary: "M", value: "ь" },
      { code: "Comma", label: "Б", secondary: "<", value: "б" },
      { code: "Period", label: "Ю", secondary: ">", value: "ю" },
      { code: "Slash", label: ".", secondary: ",", value: ".", shiftValue: "," },
      { code: "ShiftRight", label: "Shift", width: "xwide" }
    ],
    [
      { code: "ControlLeft", label: "Ctrl", width: "medium", muted: true },
      { code: "MetaLeft", label: "Win", width: "medium", muted: true },
      { code: "AltLeft", label: "Alt", width: "medium", muted: true },
      { code: "Space", label: "Пробіл", width: "space", value: " " },
      { code: "AltRight", label: "AltGr", width: "medium", muted: true },
      { code: "ControlRight", label: "Ctrl", width: "medium", muted: true }
    ]
  ];

  const FINGER_BY_CODE = {
    Backquote: ["left", "pinky", "мізинець"], Digit1: ["left", "pinky", "мізинець"],
    Tab: ["left", "pinky", "мізинець"], KeyQ: ["left", "pinky", "мізинець"],
    CapsLock: ["left", "pinky", "мізинець"], KeyA: ["left", "pinky", "мізинець"],
    ShiftLeft: ["left", "pinky", "мізинець"], KeyZ: ["left", "pinky", "мізинець"],
    Digit2: ["left", "ring", "безіменний"], KeyW: ["left", "ring", "безіменний"],
    KeyS: ["left", "ring", "безіменний"], KeyX: ["left", "ring", "безіменний"],
    Digit3: ["left", "middle", "середній"], KeyE: ["left", "middle", "середній"],
    KeyD: ["left", "middle", "середній"], KeyC: ["left", "middle", "середній"],
    Digit4: ["left", "index", "вказівний"], Digit5: ["left", "index", "вказівний"],
    KeyR: ["left", "index", "вказівний"], KeyT: ["left", "index", "вказівний"],
    KeyF: ["left", "index", "вказівний"], KeyG: ["left", "index", "вказівний"],
    KeyV: ["left", "index", "вказівний"], KeyB: ["left", "index", "вказівний"],
    Digit6: ["right", "index", "вказівний"], Digit7: ["right", "index", "вказівний"],
    KeyY: ["right", "index", "вказівний"], KeyU: ["right", "index", "вказівний"],
    KeyH: ["right", "index", "вказівний"], KeyJ: ["right", "index", "вказівний"],
    KeyN: ["right", "index", "вказівний"], KeyM: ["right", "index", "вказівний"],
    Digit8: ["right", "middle", "середній"], KeyI: ["right", "middle", "середній"],
    KeyK: ["right", "middle", "середній"], Comma: ["right", "middle", "середній"],
    Digit9: ["right", "ring", "безіменний"], KeyO: ["right", "ring", "безіменний"],
    KeyL: ["right", "ring", "безіменний"], Period: ["right", "ring", "безіменний"],
    Digit0: ["right", "pinky", "мізинець"], Minus: ["right", "pinky", "мізинець"],
    Equal: ["right", "pinky", "мізинець"], Backspace: ["right", "pinky", "мізинець"],
    KeyP: ["right", "pinky", "мізинець"], BracketLeft: ["right", "pinky", "мізинець"],
    BracketRight: ["right", "pinky", "мізинець"], Backslash: ["right", "pinky", "мізинець"],
    Semicolon: ["right", "pinky", "мізинець"], Quote: ["right", "pinky", "мізинець"],
    Enter: ["right", "pinky", "мізинець"], Slash: ["right", "pinky", "мізинець"],
    ShiftRight: ["right", "pinky", "мізинець"]
  };

  function normalize(value) {
    return typeof value === "string" ? value.toLocaleLowerCase("uk-UA") : "";
  }

  function codesForTarget(target) {
    if (Array.isArray(target.codes)) return target.codes;
    if (target.code) return [target.code];

    const normalized = normalize(target.value);
    // На шкільних Windows-комп’ютерах «ґ» вводиться як Ctrl+Alt+Г.
    // Тому основною ціллю є фізична клавіша Г (KeyU), а не Backslash.
    if (normalized === "ґ") return ["KeyU"];
    const matches = [];

    UKRAINIAN_ROWS.forEach(function (row) {
      row.forEach(function (key) {
        if (normalize(key.value) === normalized || normalize(key.shiftValue) === normalized) matches.push(key.code);
      });
    });

    return matches;
  }

  function requiresShift(value) {
    if (typeof value !== "string" || value.length !== 1) return false;

    let shifted = false;
    UKRAINIAN_ROWS.forEach(function (row) {
      row.forEach(function (key) {
        if (key.shiftValue === value) shifted = true;
      });
    });

    if (shifted) return true;
    return /[А-ЯІЇЄҐ]/.test(value);
  }

  // «Ґ» набирається комбінацією AltGr (Ctrl+Alt), а не однією клавішею.
  function requiresAltGraph(value) {
    return value === "ґ" || value === "Ґ";
  }

  function fingerForCode(code) {
    if (code === "Space") return { hand: "both", finger: "thumb", name: "великі пальці", code: "Space" };
    const value = FINGER_BY_CODE[code];
    return value ? { hand: value[0], finger: value[1], name: value[2], code } : null;
  }

  function hintsForCharacter(value) {
    const codes = codesForTarget({ value });
    const mainCode = codes[0] || null;
    const hints = [];

    if (mainCode === "Space") {
      hints.push({ hand: "both", finger: "thumb", name: "великі пальці", code: "Space" });
      return hints;
    }

    const mainFinger = fingerForCode(mainCode);
    if (mainFinger) hints.push(mainFinger);

    if (requiresShift(value) && mainFinger) {
      const shiftCode = mainFinger.hand === "left" ? "ShiftRight" : "ShiftLeft";
      hints.push(fingerForCode(shiftCode));
    }

    return hints.filter(Boolean);
  }

  // Клавіші-модифікатори, які треба підсвітити разом із основною.
  function modifierCodesForCharacter(value) {
    const codes = [];
    if (requiresAltGraph(value)) codes.push("ControlRight", "AltRight");

    if (requiresShift(value)) {
      const mainFinger = fingerForCode(codesForTarget({ value })[0]);
      codes.push(mainFinger && mainFinger.hand === "left" ? "ShiftRight" : "ShiftLeft");
    }

    return codes;
  }

  // Коротка підказка «як натиснути», якщо однієї клавіші замало.
  function comboHintForCharacter(value) {
    if (requiresAltGraph(value)) {
      return value === "Ґ"
        ? "Утримуй Ctrl + Alt + Shift і натисни Г"
        : "Утримуй Ctrl + Alt і натисни Г";
    }

    return requiresShift(value) ? "Утримуй Shift" : "";
  }

  function renderKeycap(element, definition) {
    element.textContent = "";
    if (definition.secondary) {
      const secondary = document.createElement("span");
      secondary.className = "key-legend key-legend--secondary";
      secondary.textContent = definition.secondary;
      const primary = document.createElement("span");
      primary.className = "key-legend key-legend--primary";
      primary.textContent = definition.label;
      element.classList.add("keyboard-key--dual");
      element.append(secondary, primary);
    } else {
      const primary = document.createElement("span");
      primary.className = "key-legend key-legend--single";
      primary.textContent = definition.label;
      element.appendChild(primary);
    }
  }

  return {
    ukrainianRows: UKRAINIAN_ROWS,
    codesForTarget,
    requiresShift,
    requiresAltGraph,
    modifierCodesForCharacter,
    comboHintForCharacter,
    fingerForCode,
    hintsForCharacter,
    renderKeycap
  };
});
