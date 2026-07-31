(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioLessonCore = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function textWindow(text, position, visible, caretAt) {
    const size = Number.isFinite(visible) ? visible : 86;
    const anchor = Number.isFinite(caretAt) ? caretAt : 30;
    const safePosition = Math.max(0, Math.min(position, text.length));
    const maxStart = Math.max(0, text.length - size);
    const start = Math.min(maxStart, Math.max(0, safePosition - anchor));
    const end = Math.min(text.length, start + size);
    const localPosition = safePosition - start;
    const fragment = text.slice(start, end);

    return {
      start,
      end,
      done: fragment.slice(0, localPosition),
      current: fragment[localPosition] || "",
      todo: fragment.slice(localPosition + 1)
    };
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return minutes + ":" + seconds;
  }

  return { textWindow, formatTime };
});
