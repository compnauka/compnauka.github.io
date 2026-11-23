(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioFit = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const VARIABLES = ["--key-width", "--key-height", "--key-gap", "--key-scale"];

  // Підгонка панелі вправи під висоту вікна. Спільна для всіх модулів Клавіо.
  // Правила: клавіші не більші за натуральний розмір, не менші за minKeySize (px);
  // висота панелі лінійно залежить від масштабу клавіш, тож досить двох вимірів;
  // якщо навіть мінімальні клавіші не вміщаються — викликаємо compact(true)
  // (в «Уроках» це ховає долоні).
  //
  // options:
  //   panel      — елемент, чия висота має вміститись у вікно;
  //   keyboard   — елемент .virtual-keyboard;
  //   probeCode  — клавіша-зразок для натурального розміру (KeyF);
  //   minKeySize, margin, mobileWidth — межі (px);
  //   isActive   — () => false, якщо клавіатури не видно (підгонку пропускаємо);
  //   beforeFit  — () => void, викликається перед виміром (напр. висота поля тексту);
  //   afterFit   — () => void, викликається після підгонки;
  //   compact    — (on) => void, крайній захід.
  function create(options) {
    const panel = options.panel;
    const keyboard = options.keyboard;
    const probeCode = options.probeCode || "KeyF";
    const minKeySize = options.minKeySize || 26;
    const margin = options.margin === undefined ? 4 : options.margin;
    const mobileWidth = options.mobileWidth || 860;
    const isActive = options.isActive || function () { return true; };
    const compact = options.compact || function () {};

    if (!panel || !keyboard) throw new Error("KlavioFit requires a panel and a keyboard.");

    function header() {
      return document.querySelector(".site-header");
    }

    function reset() {
      VARIABLES.forEach(function (name) { keyboard.style.removeProperty(name); });
      compact(false);
    }

    function fitKeys() {
      reset();
      if (window.innerWidth <= mobileWidth || !isActive()) return;

      const probe = keyboard.querySelector('[data-code="' + probeCode + '"]');
      if (!probe) return;
      const natural = {
        width: probe.offsetWidth,
        height: probe.offsetHeight,
        gap: parseFloat(getComputedStyle(probe.parentElement).columnGap) || 0
      };
      if (!natural.width || !natural.height) return;
      const bar = header();
      const available = window.innerHeight - (bar ? bar.offsetHeight : 0) - 2 * margin;

      function apply(scale) {
        keyboard.style.setProperty("--key-width", natural.width * scale + "px");
        keyboard.style.setProperty("--key-height", natural.height * scale + "px");
        keyboard.style.setProperty("--key-gap", Math.max(2, natural.gap * scale) + "px");
        keyboard.style.setProperty("--key-scale", String(scale));
        return panel.offsetHeight;
      }

      const full = panel.offsetHeight;
      if (full <= available) return;

      const slope = (full - apply(0.5)) / 0.5;
      const minScale = Math.min(1, minKeySize / Math.min(natural.width, natural.height));
      let scale = slope > 1 ? Math.min(1, Math.max(minScale, 1 + (available - full) / slope)) : 1;
      let height = apply(scale);
      // Поля й рамки не масштабуються лінійно: добираємо запас кроками.
      for (let guard = 0; guard < 12 && height > available && scale > minScale; guard += 1) {
        scale = Math.max(minScale, scale - 0.02);
        height = apply(scale);
      }
      if (height > available) compact(true);
    }

    function fit() {
      if (panel.hidden || !panel.offsetParent) return;
      if (options.beforeFit) options.beforeFit();
      fitKeys();
      if (options.afterFit) options.afterFit();
    }

    // Прокручує сторінку так, щоб панель стала одразу під шапкою, якщо вона виходить за вікно.
    function reveal() {
      if (panel.hidden || !panel.offsetParent) return;
      const bar = header();
      const rect = panel.getBoundingClientRect();
      const top = rect.top - (bar ? bar.offsetHeight : 0) - margin;
      if (rect.bottom > window.innerHeight || top < 0) window.scrollBy({ top: top, behavior: "instant" });
    }

    let frame = 0;
    function schedule() {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        fit();
      });
    }

    window.addEventListener("resize", schedule);
    // Великий текст і контраст змінюють розміри.
    window.addEventListener("klavio:prefs-change", schedule);
    window.addEventListener("klavio:prefs-close", schedule);

    return { fit: fit, reveal: reveal, schedule: schedule };
  }

  return { create };
});
