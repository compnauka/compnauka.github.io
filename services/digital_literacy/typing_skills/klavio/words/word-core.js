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

  return { targetParts };
});
