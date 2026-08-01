(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioSprintData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  return {
    durationSeconds: 60,
    modes: [
      { id: "keys", label: "Клавіші" },
      { id: "combos", label: "Сполучення" },
      { id: "words", label: "Слова" }
    ],
    difficulties: [
      { id: "easy", label: "Легко" },
      { id: "medium", label: "Звичайно" },
      { id: "hard", label: "Складно" }
    ],
    speeds: [
      { id: "slow", label: "Повільно", duration: 8500 },
      { id: "normal", label: "Середньо", duration: 6000 },
      { id: "fast", label: "Швидко", duration: 4200 }
    ],
    directions: [
      { id: "ltr", label: "Зліва" },
      { id: "rtl", label: "Справа" }
    ],
    targets: {
      keys: {
        easy: Array.from("аоіентсрвл"),
        medium: Array.from("абвгдеєжзиіїйклмнопрстуфхцчшщьюя"),
        hard: Array.from("абвгґдеєжзиіїйклмнопрстуфхцчшщьюя1234567890")
      },
      combos: {
        easy: ["ва", "ла", "на", "ти", "то", "ра", "ст", "ко", "по", "ми", "но", "ро"],
        medium: ["про", "при", "ний", "ого", "ати", "ення", "ість", "ува", "ере", "ово", "вся", "ться"],
        hard: ["під", "над", "роз", "без", "ств", "ння", "зап", "ком", "швид", "клав", "трен", "друк", "ґан", "ґро"]
      },
      words: {
        easy: ["мама", "тато", "вода", "небо", "мова", "клас", "урок", "друг", "сила", "пісня", "сонце", "земля", "птах", "риба", "спорт"],
        medium: ["школа", "учень", "зошит", "квітка", "дерево", "кімната", "учитель", "олівець", "природа", "музика", "дівчина", "малюнок"],
        hard: ["клавіатура", "комп'ютер", "підготовка", "результати", "знайомство", "організація", "суспільство", "продовжувати", "ґрунтовний"]
      }
    }
  };
});
