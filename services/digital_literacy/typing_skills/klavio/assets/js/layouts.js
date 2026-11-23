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

  // Геометрія ANSI-клавіатури 60%: кожен ряд рівно 15u (u — ширина звичайної клавіші).
  // w — ширина в u (за замовчуванням 1); func — службова клавіша з дрібним підписом
  // ліворуч-внизу; muted — приглушена заливка.
  const ROW_UNITS = 15;

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
      { code: "Backspace", label: "← Backspace", w: 2, func: true }
    ],
    [
      { code: "Tab", label: "Tab ↹", w: 1.5, func: true, muted: true },
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
      { code: "Backslash", label: "\\", w: 1.5, muted: true }
    ],
    [
      { code: "CapsLock", label: "Caps Lock", w: 1.75, func: true, muted: true },
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
      { code: "Enter", label: "Enter ↵", w: 2.25, func: true }
    ],
    [
      { code: "ShiftLeft", label: "⇧ Shift", w: 2.25, func: true },
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
      { code: "ShiftRight", label: "⇧ Shift", w: 2.75, func: true }
    ],
    [
      { code: "ControlLeft", label: "Ctrl", w: 1.25, func: true, muted: true },
      { code: "MetaLeft", label: "Win", w: 1.25, func: true, muted: true },
      { code: "AltLeft", label: "Alt", w: 1.25, func: true, muted: true },
      { code: "Space", label: "Пробіл", w: 6.25, func: true, value: " " },
      { code: "AltRight", label: "Alt Gr", w: 1.25, func: true, muted: true },
      { code: "MetaRight", label: "Win", w: 1.25, func: true, muted: true },
      { code: "ContextMenu", label: "☰", w: 1.25, func: true, muted: true },
      { code: "ControlRight", label: "Ctrl", w: 1.25, func: true, muted: true }
    ]
  ];

  // ---- Мова друку ---------------------------------------------------
  const UK = "uk";
  const EN = "en";
  let activeLanguage = UK;

  function normalizeLanguage(language) {
    return language === EN ? EN : UK;
  }

  function resolve(language) {
    return language === undefined || language === null ? activeLanguage : normalizeLanguage(language);
  }

  // Мову друку ставить prefs-init.js / settings.js на <html> ще до запуску скриптів.
  if (typeof document !== "undefined" && document.documentElement && document.documentElement.dataset) {
    activeLanguage = normalizeLanguage(document.documentElement.dataset.langTyping);
  }

  // US ANSI: ті самі коди клавіш і геометрія 15u, що й в українській. Основна (велика) легенда —
  // латинська, дрібна — українська літера, як на двомовних клавіатурах. Для клавіш без
  // української літери дрібний напис — символ із Shift. Рядок: [значення, значення із Shift, дрібний напис].
  const EN_SYMBOLS = {
    Backquote: ["`", "~"], Minus: ["-", "_"], Equal: ["=", "+"],
    Digit1: ["1", "!"], Digit2: ["2", "@"], Digit3: ["3", "#"], Digit4: ["4", "$"], Digit5: ["5", "%"],
    Digit6: ["6", "^"], Digit7: ["7", "&"], Digit8: ["8", "*"], Digit9: ["9", "("], Digit0: ["0", ")"],
    BracketLeft: ["[", "{"], BracketRight: ["]", "}"], Backslash: ["\\", "|"],
    Semicolon: [";", ":"], Quote: ["'", "\""], Comma: [",", "<"], Period: [".", ">"], Slash: ["/", "?"]
  };

  function englishKey(key) {
    if (key.func || key.code === "Space") return key;
    const copy = Object.assign({}, key);
    const symbol = EN_SYMBOLS[key.code];

    if (symbol) {
      copy.label = symbol[0];
      copy.value = symbol[0];
      copy.shiftValue = symbol[1];
      // Українська літера (Х, Ж, Б ...) дрібно; інакше — символ із Shift.
      copy.secondary = /[А-ЯІЇЄҐ]/.test(key.label) ? key.label : symbol[1];
      // У англійській мові всі ці клавіші можна друкувати, тож «приглушені» лише службові.
      if (key.code === "Backquote" || key.code === "Minus" || key.code === "Equal" || key.code === "Backslash") copy.muted = true;
      else delete copy.muted;
      return copy;
    }

    // Літерна клавіша: латинська велика основна, українська дрібна.
    copy.label = key.secondary;
    copy.secondary = key.label;
    copy.value = key.secondary.toLowerCase();
    return copy;
  }

  const ENGLISH_ROWS = UKRAINIAN_ROWS.map(function (row) { return row.map(englishKey); });

  function rowsFor(language) {
    return resolve(language) === EN ? ENGLISH_ROWS : UKRAINIAN_ROWS;
  }

  function setLanguage(language) {
    activeLanguage = normalizeLanguage(language);
    return activeLanguage;
  }

  function getLanguage() {
    return activeLanguage;
  }

  // Назва мови для підписів і підказок.
  function layoutWarningText(language) {
    return resolve(language) === EN
      ? "Перемкни на англійську: Alt + Shift або Win + Пробіл"
      : "Перемкни клавіатуру на українську розкладку";
  }

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

  function codesForTarget(target, language) {
    const lang = resolve(language);
    if (Array.isArray(target.codes)) return target.codes;
    if (target.code) return [target.code];

    const normalized = normalize(target.value);
    // На шкільних Windows-комп’ютерах «ґ» вводиться як Ctrl+Alt+Г.
    // Тому основною ціллю є фізична клавіша Г (KeyU), а не Backslash.
    if (lang === UK && normalized === "ґ") return ["KeyU"];
    const matches = [];

    rowsFor(lang).forEach(function (row) {
      row.forEach(function (key) {
        if (normalize(key.value) === normalized || normalize(key.shiftValue) === normalized) matches.push(key.code);
      });
    });

    return matches;
  }

  function requiresShift(value, language) {
    if (typeof value !== "string" || value.length !== 1) return false;
    const lang = resolve(language);

    let shifted = false;
    rowsFor(lang).forEach(function (row) {
      row.forEach(function (key) {
        if (key.shiftValue === value) shifted = true;
      });
    });

    if (shifted) return true;
    return lang === EN ? /[A-Z]/.test(value) : /[А-ЯІЇЄҐ]/.test(value);
  }

  // «Ґ» набирається комбінацією AltGr (Ctrl+Alt), а не однією клавішею.
  function requiresAltGraph(value, language) {
    return resolve(language) === UK && (value === "ґ" || value === "Ґ");
  }

  function fingerForCode(code) {
    if (code === "Space") return { hand: "both", finger: "thumb", name: "великі пальці", code: "Space" };
    const value = FINGER_BY_CODE[code];
    return value ? { hand: value[0], finger: value[1], name: value[2], code } : null;
  }

  function hintsForCharacter(value, language) {
    const lang = resolve(language);
    const codes = codesForTarget({ value }, lang);
    const mainCode = codes[0] || null;
    const hints = [];

    if (mainCode === "Space") {
      hints.push({ hand: "both", finger: "thumb", name: "великі пальці", code: "Space" });
      return hints;
    }

    const mainFinger = fingerForCode(mainCode);
    if (mainFinger) hints.push(mainFinger);

    if (requiresShift(value, lang) && mainFinger) {
      const shiftCode = mainFinger.hand === "left" ? "ShiftRight" : "ShiftLeft";
      hints.push(fingerForCode(shiftCode));
    }

    return hints.filter(Boolean);
  }

  // Клавіші-модифікатори, які треба підсвітити разом із основною.
  function modifierCodesForCharacter(value, language) {
    const lang = resolve(language);
    const codes = [];
    if (requiresAltGraph(value, lang)) codes.push("ControlRight", "AltRight");

    if (requiresShift(value, lang)) {
      const mainFinger = fingerForCode(codesForTarget({ value }, lang)[0]);
      codes.push(mainFinger && mainFinger.hand === "left" ? "ShiftRight" : "ShiftLeft");
    }

    return codes;
  }

  // Коротка підказка «як натиснути», якщо однієї клавіші замало.
  function comboHintForCharacter(value, language) {
    const lang = resolve(language);
    if (requiresAltGraph(value, lang)) {
      return value === "Ґ"
        ? "Утримуй Ctrl + Alt + Shift і натисни Г"
        : "Утримуй Ctrl + Alt і натисни Г";
    }

    return requiresShift(value, lang) ? "Утримуй Shift" : "";
  }

  function renderKeycap(element, definition) {
    element.textContent = "";
    if (definition.func) {
      // Службова клавіша: дрібний підпис ліворуч-внизу, як на справжній клавіатурі.
      const legend = document.createElement("span");
      legend.className = "key-legend key-legend--func";
      legend.textContent = definition.label;
      element.classList.add("keyboard-key--func");
      element.appendChild(legend);
    } else if (definition.secondary) {
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

  // Перемикач мови (prefs.js) сповіщає подією; layouts.js підключається раніше за модулі,
  // тож його слухач спрацьовує першим і модулі вже бачать нову мову.
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("klavio:lang-change", function (event) {
      activeLanguage = normalizeLanguage(event.detail && event.detail.lang);
    });
  }

  return {
    ukrainianRows: UKRAINIAN_ROWS,
    englishRows: ENGLISH_ROWS,
    rowsFor,
    setLanguage,
    getLanguage,
    layoutWarningText,
    rowUnits: ROW_UNITS,
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
