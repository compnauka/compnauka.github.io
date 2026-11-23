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

  // Налаштування робочого місця (не дані учня). Ті самі ключі читає prefs-init.js,
  // який ставить атрибути на <html> ще до малювання сторінки.
  const SOUND_KEY = "klavio.sound";
  const TEXT_KEY = "klavio.text";
  const CONTRAST_KEY = "klavio.contrast";
  const LANG_KEY = "klavio.lang";

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

  // За замовчуванням текст звичайний, а контраст стандартний.
  function isLargeText() {
    return read(TEXT_KEY, "normal") === "large";
  }

  function setLargeText(enabled) {
    write(TEXT_KEY, enabled ? "large" : "normal");
    return Boolean(enabled);
  }

  function isHighContrast() {
    return read(CONTRAST_KEY, "normal") === "high";
  }

  function setHighContrast(enabled) {
    write(CONTRAST_KEY, enabled ? "high" : "normal");
    return Boolean(enabled);
  }

  // Мова друку (розкладка й тексти вправ): "uk" за замовчуванням або "en".
  // Мова інтерфейсу завжди українська.
  function getLanguage() {
    return read(LANG_KEY, "uk") === "en" ? "en" : "uk";
  }

  function setLanguage(language) {
    const value = language === "en" ? "en" : "uk";
    write(LANG_KEY, value);
    return value;
  }

  // Виставляє data-text і data-contrast на елементі (зазвичай <html>), за потреби прибирає їх.
  function applyPreferences(element) {
    if (isLargeText()) element.dataset.text = "large";
    else delete element.dataset.text;

    if (isHighContrast()) element.dataset.contrast = "high";
    else delete element.dataset.contrast;
  }

  return {
    isSoundEnabled,
    setSoundEnabled,
    isLargeText,
    setLargeText,
    getLanguage,
    setLanguage,
    isHighContrast,
    setHighContrast,
    applyPreferences
  };
});
