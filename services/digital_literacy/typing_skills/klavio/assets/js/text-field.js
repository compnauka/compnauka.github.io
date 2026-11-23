(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioTextField = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Ділить текст на слова. Пробіл після слова належить цьому слову: рядок переноситься
  // лише між словами, а пробіл ніколи не опиняється на початку нового рядка.
  function splitWords(text) {
    return String(text).match(/\S+\s*|\s+/g) || [];
  }

  const spokenSymbols = {
    " ": "пробіл", ".": "крапка", ",": "кома", "'": "апостроф", "’": "апостроф",
    "?": "знак питання", "!": "знак оклику", ":": "двокрапка", ";": "крапка з комою",
    "-": "дефіс", "–": "коротке тире", "—": "тире", '"': "лапки", "/": "скісна риска",
    "(": "відкрити дужку", ")": "закрити дужку"
  };

  // Велике поле з усім текстом вправи (спільне для «Уроків» і «Слів»): обсяг роботи видно одразу,
  // курсор рухається по нерухомому тексту, помилки лишаються позначеними.
  // options: box — елемент .lesson-text; minLines / maxLines — межі висоти поля;
  // feedback — повідомлення вправи, яке екранний читач пропускає під час озвучення клавіш.
  function create(options) {
    const box = options.box;
    const minLines = options.minLines || 2;
    const maxLines = options.maxLines || 4;
    let chars = [];
    let shown = -1;
    let keysAllowed = false;
    let announceKeys = false;
    const announcer = document.createElement("span");
    announcer.className = "visually-hidden";
    announcer.dataset.keyAnnouncement = "";
    announcer.setAttribute("role", "status");
    box.after(announcer);

    function announce(position, mistake) {
      if (!announceKeys) return;
      const layouts = window.KlavioLayouts;
      const hands = window.KlavioHands;
      const character = chars[position]?.textContent;
      if (!character || !layouts || !hands) {
        announcer.textContent = "";
        return;
      }

      const hint = layouts.hintsForCharacter(character)[0];
      const parts = [mistake ? "Помилка. Спробуй ще раз" : "Наступний символ", spokenSymbols[character] || character];
      if (hint && hint.hand !== "both") parts.push(hands.handLabel(hint.hand), hint.name);
      const combo = layouts.comboHintForCharacter(character);
      if (combo) parts.push(combo);
      announcer.replaceChildren(document.createTextNode(parts.join(". ")));
    }

    function refreshAnnouncements() {
      const enabled = keysAllowed && Boolean(window.KlavioSettings?.isKeyAnnouncementEnabled?.());
      if (enabled === announceKeys) return;

      announceKeys = enabled;
      if (options.feedback) options.feedback.setAttribute("aria-live", enabled ? "off" : "polite");
      if (enabled) announce(shown, false);
      else announcer.textContent = "";
    }

    function setKeyAnnouncements(allowed) {
      keysAllowed = allowed;
      refreshAnnouncements();
    }

    window.addEventListener("klavio:prefs-change", refreshAnnouncements);

    function setText(text) {
      const fragment = document.createDocumentFragment();
      chars = [];
      shown = -1;
      announcer.textContent = "";

      splitWords(text).forEach(function (word) {
        const wordElement = document.createElement("span");
        wordElement.className = "lesson-word";
        Array.from(word).forEach(function (character) {
          const charElement = document.createElement("span");
          charElement.className = "lesson-char";
          charElement.textContent = character;
          wordElement.appendChild(charElement);
          chars.push(charElement);
        });
        fragment.appendChild(wordElement);
      });

      box.textContent = "";
      box.appendChild(fragment);
      box.scrollTop = 0;
    }

    function keepVisible(charElement) {
      // .lesson-text має position: relative, тож offsetTop рахується від нього.
      // Поточний рядок тримаємо другим, щоб попередній лишався видимим.
      const paddingTop = parseFloat(getComputedStyle(box).paddingTop) || 0;
      const target = Math.max(0, charElement.offsetTop - paddingTop - charElement.offsetHeight);
      if (Math.abs(box.scrollTop - target) > 1) box.scrollTop = target;
    }

    // Позначає виконане й поточний символ; повертає елемент поточного символу.
    function setPosition(position) {
      const previous = chars[shown];
      if (previous) previous.classList.remove("is-current", "is-space");
      for (let index = Math.max(0, shown); index < position; index += 1) {
        if (chars[index]) chars[index].classList.add("is-done");
      }
      for (let index = position; index < shown; index += 1) {
        if (chars[index]) chars[index].classList.remove("is-done");
      }

      const current = chars[position];
      if (current) {
        current.classList.add("is-current");
        current.classList.toggle("is-space", current.textContent === " ");
        keepVisible(current);
      }
      if (shown !== position) announce(position, false);
      shown = position;
      return current || null;
    }

    // Символ, на якому була помилка, лишається позначеним до кінця вправи.
    function markMistake(position) {
      const element = chars[position];
      if (!element) return;
      element.classList.remove("is-mistake-flash");
      void element.offsetWidth;
      element.classList.add("is-mistake", "is-mistake-flash");
      if (position === shown) announce(position, true);
    }

    function clearMistake(position) {
      chars[position]?.classList.remove("is-mistake", "is-mistake-flash");
    }

    // Висота поля підлаштовується під текст: стільки рядків, скільки він займає, від min до max.
    function fitHeight() {
      const style = getComputedStyle(box);
      const line = parseFloat(style.lineHeight);
      if (!line) return;

      box.style.height = "auto";
      const pads = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const content = box.clientHeight - pads;
      const lines = Math.min(maxLines, Math.max(minLines, Math.round(content / line)));
      const frame = box.offsetHeight - content;
      box.style.height = (style.boxSizing === "border-box" ? lines * line + frame : lines * line) + "px";
    }

    function keepCurrentVisible() {
      const current = chars[shown];
      if (current) keepVisible(current);
    }

    return {
      setText,
      setPosition,
      markMistake,
      clearMistake,
      setKeyAnnouncements,
      fitHeight,
      keepVisible: keepCurrentVisible,
      get length() { return chars.length; }
    };
  }

  return { create, splitWords };
});
