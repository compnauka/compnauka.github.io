(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioWeakKeys = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Символи, на яких учень помилявся щонайменше minMisses разів: до n штук,
  // за кількістю помилок, а за рівності — за порядком у тексті. Пробіли не рахуємо.
  // Помилки на «Ж» і «ж» складаються разом, а символ повертається в тому регістрі,
  // у якому помилок було більше (за рівності — малою). Спільна для всіх модулів Клавіо.
  function weakKeys(errorCounts, text, n, minMisses) {
    const limit = typeof n === "number" ? n : 3;
    const threshold = typeof minMisses === "number" ? minMisses : 2;
    const source = String(text).toLocaleLowerCase("uk-UA");
    const totals = {};
    const upper = {};

    Object.keys(errorCounts || {}).forEach(function (key) {
      if (!key.trim()) return;
      const lower = key.toLocaleLowerCase("uk-UA");
      totals[lower] = (totals[lower] || 0) + errorCounts[key];
      if (key !== lower) upper[lower] = (upper[lower] || 0) + errorCounts[key];
    });

    return Object.keys(totals)
      .filter(function (character) { return totals[character] >= threshold; })
      .sort(function (a, b) {
        if (totals[b] !== totals[a]) return totals[b] - totals[a];
        const first = source.indexOf(a);
        const second = source.indexOf(b);
        return (first === -1 ? Infinity : first) - (second === -1 ? Infinity : second);
      })
      .slice(0, limit)
      .map(function (character) {
        const capitals = upper[character] || 0;
        return capitals > totals[character] - capitals ? character.toLocaleUpperCase("uk-UA") : character;
      });
  }

  return { weakKeys };
});
