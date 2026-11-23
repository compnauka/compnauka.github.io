/* Кнопка «Aa» у шапці з налаштуваннями читання.
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
  if (document.querySelector(".lesson-text")) {
    switches.push(
      { label: "Більші інтервали", get: settings.isWideSpacing, set: settings.setWideSpacing },
      { label: "Озвучувати клавіші у вправах", get: settings.isKeyAnnouncementEnabled, set: settings.setKeyAnnouncementEnabled }
    );
  }

  const wrap = document.createElement("div");
  wrap.className = "a11y-menu";

  const toggle = document.createElement("button");
  toggle.className = "a11y-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Налаштування читання");
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
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close(true, true);
    }
  });
  document.addEventListener("click", function (event) {
    if (!panel.hidden && !wrap.contains(event.target)) close(false, false);
  });

  // ---- Перемикач мови друку «УКР | ENG» ------------------------------
  const languages = [
    { id: "uk", text: "УКР", label: "Друкувати українською" },
    { id: "en", text: "ENG", label: "Друкувати англійською" }
  ];
  const langGroup = document.createElement("div");
  langGroup.className = "lang-switch";
  langGroup.setAttribute("role", "group");
  langGroup.setAttribute("aria-label", "Мова друку");

  const langButtons = languages.map(function (item) {
    const button = document.createElement("button");
    button.className = "lang-switch__button";
    button.type = "button";
    button.dataset.lang = item.id;
    button.textContent = item.text;
    button.setAttribute("aria-label", item.label);
    button.addEventListener("click", function () {
      if (settings.getLanguage() === item.id) return;
      settings.setLanguage(item.id);
      refreshLanguage();
      window.dispatchEvent(new CustomEvent("klavio:lang-change", { detail: { lang: item.id } }));
    });
    // Стрілки переходять між кнопками (як у групі перемикачів).
    button.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const other = langButtons[langButtons.indexOf(button) === 0 ? 1 : 0];
      other.focus();
    });
    langGroup.appendChild(button);
    return button;
  });

  function refreshLanguage() {
    const current = settings.getLanguage();
    document.documentElement.dataset.langTyping = current;
    langButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.lang === current));
    });
  }

  wrap.append(toggle, panel);
  const theme = document.getElementById("theme-toggle");
  actions.insertBefore(wrap, theme && theme.parentNode === actions ? theme : null);
  actions.insertBefore(langGroup, wrap);
  refresh();
  refreshLanguage();
})();
