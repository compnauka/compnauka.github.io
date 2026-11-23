(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioCustomText = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const MAX_LENGTH = 1000;

  function inspect(value, layouts, input, core, learned) {
    const text = value.normalize("NFC").replace(/\s+/g, " ").trim();
    const unsupported = new Set();
    const unlearned = new Set();

    Array.from(text).forEach(function (character) {
      const normalized = input.normalizeCharacter(character);
      if (character.length !== 1 || layouts.codesForTarget({ value: normalized }).length === 0) {
        unsupported.add(character);
      } else if (learned && !core.isAllowed(character, learned)) {
        unlearned.add(character);
      }
    });

    return { text, unsupported, unlearned, tooLong: text.length > MAX_LENGTH };
  }

  function list(characters) {
    const sample = Array.from(characters).slice(0, 8).map(function (character) {
      // Невидимі символи мають бути помітними в попередженні.
      if (/^\p{C}$/u.test(character)) return "U+" + character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
      return "«" + character + "»";
    });
    return sample.join(", ") + (characters.size > sample.length ? " та інші" : "");
  }

  function create(container, options) {
    container.innerHTML = `
      <form class="custom-text-form">
        <label for="custom-text-input">Текст для друку</label>
        <textarea id="custom-text-input" rows="5" spellcheck="false" autocomplete="off" autocapitalize="off" aria-describedby="custom-text-help custom-text-warning"></textarea>
        <p id="custom-text-help">Встав або введи уривок до 1000 символів. Переноси рядків і повторні пробіли стануть одним пробілом.</p>
        <p id="custom-text-warning" class="custom-text-warning" role="status"></p>
        <button class="button button--primary" type="submit">Почати друк</button>
      </form>`;
    const form = container.querySelector("form");
    const field = container.querySelector("textarea");
    const warning = container.querySelector(".custom-text-warning");
    const submit = container.querySelector("button");
    let exercise = "";

    function validate() {
      const result = options.inspect(field.value);
      const messages = [];
      if (result.tooLong) messages.push("Скороти уривок до " + MAX_LENGTH + " символів.");
      if (result.unsupported.size) messages.push("Непідтримувані символи для цієї розкладки: " + list(result.unsupported) + ". Заміни або видали їх.");
      if (result.unlearned.size) messages.push("Поза межами вибраного уроку: " + list(result.unlearned) + ".");
      warning.textContent = messages.join(" ");
      submit.disabled = !result.text || result.tooLong || result.unsupported.size > 0;
      field.setAttribute("aria-invalid", String(result.tooLong || result.unsupported.size > 0));
      return result;
    }

    field.addEventListener("input", validate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const result = validate();
      if (submit.disabled) return;
      exercise = result.text;
      options.start(exercise);
    });

    return {
      show: function (focus) {
        container.hidden = false;
        validate();
        if (focus !== false) field.focus();
      },
      hide: function () { container.hidden = true; },
      isVisible: function () { return !container.hidden; },
      getExercise: function () { return exercise; }
    };
  }

  return { inspect, create };
});
