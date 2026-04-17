import { createEmbeddedToolBridge, titleCase } from "../shared/tool-bridge.js";

const workKind = document.getElementById("work-kind");
const authorName = document.getElementById("author-name");
const signatureStyle = document.getElementById("signature-style");
const resetButton = document.getElementById("reset-signature");
const finishButton = document.getElementById("finish-signature");
const status = document.getElementById("studio-status");
const notifyLessonCompleted = createEmbeddedToolBridge("signature-studio");

const previewIcon = document.getElementById("preview-icon");
const previewKind = document.getElementById("preview-kind");
const previewSignature = document.getElementById("preview-signature");

const iconsByKind = {
  "малюнок": "🖼",
  "листівка": "💌",
  "плакат": "📢"
};

const defaults = {
  kind: "малюнок",
  author: "Оля",
  style: "simple"
};

function buildSignature() {
  const name = authorName.value.trim() || "Автор";
  const kind = titleCase(workKind.value);

  switch (signatureStyle.value) {
    case "drawing":
      return `${kind} ${name}`;
    case "prepared":
      return `Підготував ${name}`;
    default:
      return name;
  }
}

function syncPreview() {
  previewIcon.textContent = iconsByKind[workKind.value] || "🖼";
  previewKind.textContent = titleCase(workKind.value);
  previewSignature.textContent = buildSignature();
  status.textContent = "Підпис оновлено. Перевір, чи зрозуміло, хто автор.";
}

[workKind, authorName, signatureStyle].forEach((control) => {
  control.addEventListener("input", syncPreview);
  control.addEventListener("change", syncPreview);
});

resetButton.addEventListener("click", () => {
  workKind.value = defaults.kind;
  authorName.value = defaults.author;
  signatureStyle.value = defaults.style;
  syncPreview();
});

finishButton.addEventListener("click", () => {
  if (!authorName.value.trim()) {
    status.textContent = "Додай ім’я автора, щоб підпис мав сенс.";
    authorName.focus();
    return;
  }

  notifyLessonCompleted();
  status.textContent = "Готово. Підпис завершив роботу.";
});

syncPreview();
