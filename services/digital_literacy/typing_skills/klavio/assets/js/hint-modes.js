(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioHintModes = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Після стількох помилок поспіль на одному символі режим тимчасово показує вимкнені підказки.
  const HINT_AFTER_MISSES = 2;

  // Ті самі три режими, що й в «Уроках»: клавіатура + палець, лише палець, без підказок.
  const MODES = [
    { id: "guided", label: "З підказками", keyboardHint: true, fingerHint: true },
    { id: "finger", label: "Лише палець", keyboardHint: false, fingerHint: true },
    { id: "independent", label: "Самостійно", keyboardHint: false, fingerHint: false }
  ];

  function find(id) {
    return MODES.find(function (mode) { return mode.id === id; }) || MODES[0];
  }

  // Що показувати для режиму config { keyboardHint, fingerHint } після missesOnChar помилок
  // на поточному символі. revealed — підказку показано лише завдяки помилкам.
  function visibility(config, missesOnChar) {
    const stuck = missesOnChar >= HINT_AFTER_MISSES;
    const keyboard = Boolean(config.keyboardHint) || stuck;
    const finger = Boolean(config.fingerHint) || stuck;
    return {
      keyboard,
      finger,
      revealed: keyboard !== Boolean(config.keyboardHint) || finger !== Boolean(config.fingerHint)
    };
  }

  // Сегментований перемикач у контейнері (role="group"). modes — підмножина MODES.
  function createControl(container, options) {
    const modes = options.modes || MODES;
    let current = options.value || modes[0].id;
    container.textContent = "";

    function refresh() {
      container.querySelectorAll("button").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.mode === current));
      });
    }

    modes.forEach(function (mode) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mode = mode.id;
      button.textContent = mode.label;
      button.addEventListener("click", function () {
        current = mode.id;
        refresh();
        if (options.onChange) options.onChange(mode.id);
      });
      container.appendChild(button);
    });
    refresh();

    return {
      get value() { return current; },
      set: function (id) { current = id; refresh(); }
    };
  }

  return { HINT_AFTER_MISSES, MODES, find, visibility, createControl };
});
