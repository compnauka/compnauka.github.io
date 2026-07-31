(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioSound = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function create(options) {
    const button = options.button;
    const glyph = options.glyph;
    const settings = options.settings;
    let enabled = settings.isSoundEnabled();

    function update() {
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", enabled ? "Вимкнути звук" : "Увімкнути звук");
      if (glyph) glyph.textContent = enabled ? "♪" : "×";
    }

    function set(nextEnabled) {
      enabled = Boolean(nextEnabled);
      settings.setSoundEnabled(enabled);
      update();
      if (typeof options.onChange === "function") options.onChange(enabled);
      return enabled;
    }

    button.addEventListener("click", function () { set(!enabled); });
    update();

    return {
      isEnabled: function () { return enabled; },
      set,
      update
    };
  }

  return { create };
});
