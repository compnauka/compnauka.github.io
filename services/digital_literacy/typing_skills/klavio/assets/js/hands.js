(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioHands = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function handLabel(hand) {
    if (hand === "left") return "Ліва рука";
    if (hand === "right") return "Права рука";
    return "Обидві руки";
  }

  // Підсвічує пальці долонь у контейнері guide за підказками hints (з layouts.hintsForCharacter)
  // і повертає підпис «Ліва рука · вказівний (+ Shift)».
  function update(guide, hints) {
    guide.querySelectorAll(".is-active").forEach(function (finger) {
      finger.classList.remove("is-active");
    });

    if (!hints || hints.length === 0) return "—";

    hints.forEach(function (hint) {
      if (hint.hand === "both") {
        guide.querySelectorAll('[data-finger="thumb"]').forEach(function (finger) {
          finger.classList.add("is-active");
        });
      } else {
        const finger = guide.querySelector('.hand-visual[data-hand="' + hint.hand + '"] [data-finger="' + hint.finger + '"]');
        if (finger) finger.classList.add("is-active");
      }
    });

    if (hints.length === 1) return handLabel(hints[0].hand) + " · " + hints[0].name;
    return handLabel(hints[0].hand) + " · " + hints[0].name + " + Shift";
  }

  return { handLabel, update };
});
