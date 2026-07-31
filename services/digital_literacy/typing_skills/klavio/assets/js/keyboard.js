(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioKeyboard = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function create(container, layouts) {
    if (!container || !layouts) throw new Error("KlavioKeyboard requires a container and layouts.");

    const keys = new Map();
    container.textContent = "";

    layouts.ukrainianRows.forEach(function (rowDefinition) {
      const row = document.createElement("div");
      row.className = "keyboard-row";

      rowDefinition.forEach(function (definition) {
        const key = document.createElement("span");
        key.className = "keyboard-key";
        key.dataset.code = definition.code;

        const finger = layouts.fingerForCode(definition.code);
        if (finger) key.dataset.finger = finger.finger;
        if (definition.width) key.classList.add("keyboard-key--" + definition.width);
        if (definition.muted) key.classList.add("keyboard-key--muted");

        layouts.renderKeycap(key, definition);
        row.appendChild(key);
        keys.set(definition.code, key);
      });

      container.appendChild(row);
    });

    function clearClass(className) {
      keys.forEach(function (key) { key.classList.remove(className); });
    }

    function setHint(targetOrValue, visible) {
      clearClass("is-target");
      if (!visible || targetOrValue === null || targetOrValue === undefined) return;

      const target = typeof targetOrValue === "object" ? targetOrValue : { value: targetOrValue };
      const codes = layouts.codesForTarget(target);
      codes.forEach(function (code) {
        const key = keys.get(code);
        if (key) key.classList.add("is-target");
      });

      if (layouts.requiresShift(target.value)) {
        const finger = layouts.fingerForCode(codes[0]);
        const shiftCode = finger && finger.hand === "left" ? "ShiftRight" : "ShiftLeft";
        const shift = keys.get(shiftCode);
        if (shift) shift.classList.add("is-target");
      }
    }

    function setAllowedTargets(targets) {
      const allowed = new Set();
      (targets || []).forEach(function (target) {
        layouts.codesForTarget(target).forEach(function (code) { allowed.add(code); });
      });

      keys.forEach(function (key, code) {
        key.classList.toggle("is-unavailable", allowed.size > 0 && !allowed.has(code));
      });
    }

    function flash(code, className, duration) {
      const key = keys.get(code);
      if (!key) return;
      key.classList.remove("is-pressed-correct", "is-pressed-error");
      void key.offsetWidth;
      key.classList.add(className);
      window.setTimeout(function () { key.classList.remove(className); }, duration || 180);
    }

    return {
      element: container,
      keys,
      setHint,
      setAllowedTargets,
      flash,
      clearHint: function () { clearClass("is-target"); },
      clearPressed: function () {
        clearClass("is-pressed-correct");
        clearClass("is-pressed-error");
      }
    };
  }

  return { create };
});
