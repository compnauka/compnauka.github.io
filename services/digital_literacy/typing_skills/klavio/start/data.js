(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioStartData = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function letters(value) {
    return Array.from(value).map(function (letter) {
      return {
        id: "letter-" + letter,
        kind: "letter",
        value: letter,
        label: letter.toLocaleUpperCase("uk-UA")
      };
    });
  }

  function digits() {
    return Array.from("1234567890").map(function (digit) {
      return {
        id: "digit-" + digit,
        kind: "digit",
        value: digit,
        label: digit
      };
    });
  }

  // «Ґ» свідомо немає в жодному наборі: вона набирається комбінацією
  // Ctrl+Alt, а «Старт» вчить знаходити одну клавішу без модифікаторів.
  const ALPHABET = "абвгдеєжзиіїйклмнопрстуфхцчшщьюя";

  const CONTROL_TARGETS = [
    { id: "control-space", kind: "control", value: " ", label: "Пробіл", code: "Space" },
    { id: "control-enter", kind: "control", value: "Enter", label: "Enter", code: "Enter" },
    { id: "control-backspace", kind: "control", value: "Backspace", label: "Backspace", code: "Backspace" },
    { id: "control-shift", kind: "control", value: "Shift", label: "Shift", codes: ["ShiftLeft", "ShiftRight"] },
    { id: "control-ctrl", kind: "control", value: "Ctrl", label: "Ctrl", codes: ["ControlLeft", "ControlRight"] },
    // Тільки лівий Alt: правий на українській розкладці працює як AltGr для «ґ».
    { id: "control-alt", kind: "control", value: "Alt", label: "Alt", code: "AltLeft" }
  ];

  // Англійська (US ANSI). Перший десяток — найчастіші літери англійської мови,
  // як і в «Спринті» на рівні «Легко»: учень знайомиться з клавішами, які знадобляться найчастіше.
  const ENGLISH_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

  const ukrainianSets = {
      starter: {
        id: "starter",
        label: "Перші літери",
        description: "10 частих українських літер",
        // Той самий десяток, що й у «Спринті» на рівні «Легко».
        targets: letters("аоіентсрвл")
      },
      alphabet: {
        id: "alphabet",
        label: "Усі літери",
        description: "Абетка без «ґ» — вона потребує комбінації клавіш",
        targets: letters(ALPHABET)
      },
      digits: {
        id: "digits",
        label: "Цифри",
        description: "Цифри верхнього ряду",
        targets: digits()
      },
      controls: {
        id: "controls",
        label: "Важливі клавіші",
        description: "Пробіл, Enter, Backspace, Shift, Ctrl і Alt",
        targets: CONTROL_TARGETS
      },
      everything: {
        id: "everything",
        label: "Усе разом",
        description: "Літери, цифри та важливі клавіші",
        targets: letters(ALPHABET).concat(digits(), CONTROL_TARGETS)
      }
  };

  const englishSets = {
    starter: {
      id: "starter",
      label: "Перші літери",
      description: "10 частих англійських літер",
      targets: letters("etaoinsrhl")
    },
    alphabet: {
      id: "alphabet",
      label: "Усі літери",
      description: "Англійська абетка, 26 літер",
      targets: letters(ENGLISH_ALPHABET)
    },
    digits: ukrainianSets.digits,
    controls: ukrainianSets.controls,
    everything: {
      id: "everything",
      label: "Усе разом",
      description: "Літери, цифри та важливі клавіші",
      targets: letters(ENGLISH_ALPHABET).concat(digits(), CONTROL_TARGETS)
    }
  };

  // Підписи для карток вибору набору (значок у крузі) залежать від мови.
  const icons = {
    uk: { starter: "А", alphabet: "А–Я", digits: "123", controls: "↵", everything: "★" },
    en: { starter: "A", alphabet: "A–Z", digits: "123", controls: "↵", everything: "★" }
  };

  return {
    roundLength: 12,
    sets: ukrainianSets,
    setsByLanguage: { uk: ukrainianSets, en: englishSets },
    getSets: function (language) { return language === "en" ? englishSets : ukrainianSets; },
    icons: icons,
    encouragement: ["Чудово!", "Саме так!", "Правильно!", "Молодець!", "Влучно!"],
    retry: ["Спробуй ще раз", "Поглянь уважніше", "Майже! Шукай далі"]
  };
});
