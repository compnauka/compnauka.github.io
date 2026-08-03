(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioSprintCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  function scoreFor(length, progress, streak) { return Math.max(1, length * 10 + Math.round((1 - Math.min(1, progress)) * 10) + Math.floor(streak / 5) * 5); }
  function targetDuration(base, mode, pace) { const modeFactor = mode === "words" ? 1.65 : mode === "combos" ? 1.25 : 1; return Math.round(base * modeFactor * (pace || 1)); }
  return { scoreFor, targetDuration };
});
