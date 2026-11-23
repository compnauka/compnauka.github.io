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
    let language = null;

    // Будує ряди розкладки потрібної мови. Сторонні діти контейнера (напр. картка вступу
    // в «Уроках») лишаються на місці — прибираємо лише ряди.
    function build(requested) {
      language = requested === "en" || requested === "uk" ? requested :
        (typeof layouts.getLanguage === "function" ? layouts.getLanguage() : "uk");
      const rows = typeof layouts.rowsFor === "function" ? layouts.rowsFor(language) : layouts.ukrainianRows;

      keys.clear();
      Array.from(container.querySelectorAll(".keyboard-row")).forEach(function (row) { row.remove(); });
      container.dataset.layout = language;

      rows.forEach(function (rowDefinition) {
        const row = document.createElement("div");
        row.className = "keyboard-row";

        rowDefinition.forEach(function (definition) {
          const key = document.createElement("span");
          key.className = "keyboard-key";
          key.dataset.code = definition.code;

          const finger = layouts.fingerForCode(definition.code);
          if (finger) key.dataset.finger = finger.finger;
          // Ширина в одиницях u: CSS рахує її через --w (див. keyboard.css).
          if (definition.w) key.style.setProperty("--w", String(definition.w));
          if (definition.muted) key.classList.add("keyboard-key--muted");

          layouts.renderKeycap(key, definition);
          row.appendChild(key);
          keys.set(definition.code, key);
        });

        container.appendChild(row);
      });
    }

    build();

    function clearClass(className) {
      keys.forEach(function (key) { key.classList.remove(className); });
    }

    function setHint(targetOrValue, visible) {
      clearClass("is-target");
      clearClass("is-modifier-target");
      if (!visible || targetOrValue === null || targetOrValue === undefined) return "";

      const target = typeof targetOrValue === "object" ? targetOrValue : { value: targetOrValue };

      layouts.codesForTarget(target).forEach(function (code) {
        const key = keys.get(code);
        if (key) key.classList.add("is-target");
      });

      layouts.modifierCodesForCharacter(target.value).forEach(function (code) {
        const key = keys.get(code);
        if (key) key.classList.add("is-modifier-target");
      });

      return layouts.comboHintForCharacter(target.value);
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
      // Перебудовує клавіатуру в іншій мові. Підсвічування та приглушення
      // треба виставити знову (setHint / setAllowedTargets).
      setLanguage: build,
      get language() { return language; },
      flash,
      clearHint: function () {
        clearClass("is-target");
        clearClass("is-modifier-target");
      },
      clearPressed: function () {
        clearClass("is-pressed-correct");
        clearClass("is-pressed-error");
      }
    };
  }

  return { create };
});
