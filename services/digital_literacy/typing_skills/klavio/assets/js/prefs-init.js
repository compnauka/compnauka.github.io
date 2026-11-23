/* Налаштування читання на цьому робочому місці.
   Скрипт підключено в <head> без defer, щоб атрибути стояли ще до малювання й сторінка не блимала.
   Ключі ті самі, що в settings.js. */
(function () {
  "use strict";

  try {
    const root = document.documentElement;
    if (localStorage.getItem("klavio.text") === "large") root.dataset.text = "large";
    if (localStorage.getItem("klavio.contrast") === "high") root.dataset.contrast = "high";
    if (localStorage.getItem("klavio.spacing") === "wide") root.dataset.spacing = "wide";
    // Мова друку: data-lang-typing="uk" | "en" (за замовчуванням "uk").
    root.dataset.langTyping = localStorage.getItem("klavio.lang") === "en" ? "en" : "uk";
  } catch (error) {
    // Сховище недоступне — лишаються стандартні налаштування.
    document.documentElement.dataset.langTyping = "uk";
  }
})();
