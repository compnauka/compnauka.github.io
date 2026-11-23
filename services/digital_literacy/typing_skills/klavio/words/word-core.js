(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioWordCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function targetParts(target, position) {
    return { done: target.slice(0, position), current: target[position] || "", todo: target.slice(position + 1) };
  }

  const APOSTROPHES = /['ʼ’]/g;

  function lowerCase(value) { return value.toLocaleLowerCase("uk-UA"); }
  function isLetter(value) { return lowerCase(value) !== value.toLocaleUpperCase("uk-UA"); }

  // Символи, відомі учню після уроків 1..upToLesson (за текстами уроків): точні символи,
  // а також ознака, чи вже вчили великі літери (тоді дозволено велику літеру вивченої літери).
  function learnedCharacters(lessons, upToLesson) {
    const exact = new Set();
    let capitals = false;
    lessons.filter(function (lesson) { return lesson.id <= upToLesson; }).forEach(function (lesson) {
      Array.from(lesson.text.replace(APOSTROPHES, "'")).forEach(function (character) {
        exact.add(character);
        if (isLetter(character) && character !== lowerCase(character)) capitals = true;
      });
    });
    return { exact: exact, capitals: capitals };
  }

  function isAllowed(character, learned) {
    const normal = character.replace(APOSTROPHES, "'");
    if (normal === " ") return true;
    if (learned.exact.has(normal)) return true;
    if (isLetter(normal) && normal !== lowerCase(normal)) return learned.capitals && learned.exact.has(lowerCase(normal));
    return false;
  }

  // Чиста функція фільтра: залишає слова чи речення, складені лише з вивчених до уроку символів.
  // learned — результат learnedCharacters; null означає «усі літери» (без фільтра).
  function filterByLearned(items, learned) {
    if (!learned) return items.slice();
    return items.filter(function (item) {
      return Array.from(item).every(function (character) { return isAllowed(character, learned); });
    });
  }

  // Рядок вправи з потрібної кількості завдань, поєднаних пробілами.
  function joinTasks(tasks) {
    return tasks.join(" ");
  }

  // Слова для вправи на слабкі символи: ті, де є слабка літера (без урахування регістру).
  // Якщо таких слів немає, повертає порожній масив.
  function weakWords(weakChars, words, count, random) {
    const weak = Array.from(weakChars || []).map(lowerCase);
    const next = typeof random === "function" ? random : Math.random;
    const found = words.filter(function (word) {
      const lower = lowerCase(word);
      return weak.some(function (character) { return lower.indexOf(character) !== -1; });
    });
    const shuffled = found.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(next() * (index + 1));
      const keep = shuffled[index];
      shuffled[index] = shuffled[swap];
      shuffled[swap] = keep;
    }
    const result = [];
    while (shuffled.length && result.length < count) {
      for (let index = 0; index < shuffled.length && result.length < count; index += 1) result.push(shuffled[index]);
    }
    return result;
  }

  return { targetParts, learnedCharacters, isAllowed, filterByLearned, joinTasks, weakWords };
});
