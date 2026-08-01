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

  return {
    roundLength: 12,
    sets: {
      starter: {
        id: "starter",
        label: "Перші літери",
        description: "10 частих українських літер",
        targets: letters("аоієнтсрвл")
      },
      alphabet: {
        id: "alphabet",
        label: "Усі літери",
        // «Ґ» тут свідомо немає: вона набирається комбінацією Ctrl+Alt,
        // а «Старт» вчить знаходити одну клавішу без модифікаторів.
        description: "Абетка без «ґ» — вона потребує комбінації клавіш",
        targets: letters("абвгдеєжзиіїйклмнопрстуфхцчшщьюя")
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
        description: "Пробіл, Enter, Backspace і Shift",
        targets: [
          { id: "control-space", kind: "control", value: " ", label: "Пробіл", code: "Space" },
          { id: "control-enter", kind: "control", value: "Enter", label: "Enter", code: "Enter" },
          { id: "control-backspace", kind: "control", value: "Backspace", label: "Backspace", code: "Backspace" },
          { id: "control-shift", kind: "control", value: "Shift", label: "Shift", codes: ["ShiftLeft", "ShiftRight"] }
        ]
      }
    },
    encouragement: ["Чудово!", "Саме так!", "Правильно!", "Молодець!", "Влучно!"],
    retry: ["Спробуй ще раз", "Поглянь уважніше", "Майже! Шукай далі"]
  };
});
