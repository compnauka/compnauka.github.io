import { createEmbeddedToolBridge, titleCase } from "../shared/tool-bridge.js";

const kindSelect = document.getElementById("product-kind");
const audienceSelect = document.getElementById("product-audience");
const textInput = document.getElementById("product-text");
const emojiSelect = document.getElementById("product-emoji");
const resetButton = document.getElementById("reset-product");
const finishButton = document.getElementById("finish-product");
const status = document.getElementById("studio-status");
const notifyLessonCompleted = createEmbeddedToolBridge("product-studio");

const previewKind = document.getElementById("preview-kind");
const previewAudience = document.getElementById("preview-audience");
const previewText = document.getElementById("preview-text");
const previewEmoji = document.getElementById("preview-emoji");

const defaults = {
  kind: "листівка",
  audience: "для класу",
  text: "Приходь у п’ятницю",
  emoji: "🎉"
};

function syncPreview() {
  previewKind.textContent = titleCase(kindSelect.value);
  previewAudience.textContent = audienceSelect.value;
  previewText.textContent = textInput.value.trim() || "Короткий текст";
  previewEmoji.textContent = emojiSelect.value;
  status.textContent = "Продукт оновлено. Перевір, чи він короткий і зрозумілий.";
}

[kindSelect, audienceSelect, textInput, emojiSelect].forEach((control) => {
  control.addEventListener("input", syncPreview);
  control.addEventListener("change", syncPreview);
});

resetButton.addEventListener("click", () => {
  kindSelect.value = defaults.kind;
  audienceSelect.value = defaults.audience;
  textInput.value = defaults.text;
  emojiSelect.value = defaults.emoji;
  syncPreview();
});

finishButton.addEventListener("click", () => {
  if (!textInput.value.trim()) {
    status.textContent = "Додай хоча б кілька слів, щоб продукт мав зміст.";
    textInput.focus();
    return;
  }

  notifyLessonCompleted();
  status.textContent = "Готово. Можна повернутися до уроку.";
});

syncPreview();
