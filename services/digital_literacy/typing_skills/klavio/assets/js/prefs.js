/* Кнопка «Aa» у шапці з меню двох перемикачів: великий текст і високий контраст.
   Кнопку й меню створює скрипт, тож усі сторінки Клавіо підключають лише цей файл. */
(function () {
  "use strict";

  const settings = window.KlavioSettings;
  const actions = document.querySelector(".site-header__actions");
  if (!settings || !actions) return;

  const switches = [
    { label: "Великий текст", get: settings.isLargeText, set: settings.setLargeText },
    { label: "Високий контраст", get: settings.isHighContrast, set: settings.setHighContrast }
  ];

  const wrap = document.createElement("div");
  wrap.className = "a11y-menu";

  const toggle = document.createElement("button");
  toggle.className = "a11y-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Зручність читання: розмір тексту й контраст");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "a11y-panel");
  toggle.innerHTML = '<span aria-hidden="true">Aa</span>';

  const panel = document.createElement("div");
  panel.className = "a11y-panel";
  panel.id = "a11y-panel";
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Зручність читання");
  panel.hidden = true;

  const buttons = switches.map(function (item) {
    const button = document.createElement("button");
    button.className = "a11y-switch";
    button.type = "button";
    button.setAttribute("role", "switch");
    button.innerHTML = "<span></span><i class=\"a11y-switch__track\" aria-hidden=\"true\"></i>";
    button.firstChild.textContent = item.label;
    button.addEventListener("click", function () {
      item.set(!item.get());
      refresh();
      // Сторінки (наприклад, «Уроки») перераховують розміри під новий текст.
      window.dispatchEvent(new CustomEvent("klavio:prefs-change"));
    });
    panel.appendChild(button);
    return button;
  });

  function refresh() {
    settings.applyPreferences(document.documentElement);
    switches.forEach(function (item, index) {
      buttons[index].setAttribute("aria-checked", String(item.get()));
    });
  }

  function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  // notify — меню закрито клавіатурою чи самою кнопкою: сторінка може повернути фокус у вправу.
  function close(returnFocus, notify) {
    if (panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (returnFocus) toggle.focus();
    if (notify) window.dispatchEvent(new CustomEvent("klavio:prefs-close"));
  }

  toggle.addEventListener("click", function () {
    if (panel.hidden) open();
    else close(false, true);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) close(true, true);
  });
  document.addEventListener("click", function (event) {
    if (!panel.hidden && !wrap.contains(event.target)) close(false, false);
  });

  wrap.append(toggle, panel);
  const theme = document.getElementById("theme-toggle");
  actions.insertBefore(wrap, theme && theme.parentNode === actions ? theme : null);
  refresh();
})();
