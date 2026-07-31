(function () {
  "use strict";

  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const year = document.getElementById("current-year");

  function isDarkTheme() {
    return root.dataset.theme === "dark";
  }

  function updateThemeControls() {
    if (!toggle) return;

    const dark = isDarkTheme();
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Увімкнути світлу тему" : "Увімкнути темну тему");

    if (themeMeta) {
      themeMeta.setAttribute("content", dark ? "#07101f" : "#f8fafc");
    }
  }

  function setTheme(theme) {
    root.dataset.theme = theme;

    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      // Сторінка залишається працездатною, навіть якщо сховище браузера недоступне.
    }

    updateThemeControls();
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(isDarkTheme() ? "light" : "dark");
    });
  }

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  updateThemeControls();
})();
