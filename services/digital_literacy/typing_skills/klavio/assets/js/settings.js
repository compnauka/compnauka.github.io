(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioSettings = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const SOUND_KEY = "klavio.sound";

  function read(key, fallback) {
    try {
      const value = root.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      root.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function isSoundEnabled() {
    return read(SOUND_KEY, "on") !== "off";
  }

  function setSoundEnabled(enabled) {
    write(SOUND_KEY, enabled ? "on" : "off");
    return Boolean(enabled);
  }

  return {
    isSoundEnabled,
    setSoundEnabled
  };
});
