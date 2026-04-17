import { createEmbeddedToolBridge, titleCase } from "../shared/tool-bridge.js";

const taskSelect = document.getElementById("team-task");
const roleSelect = document.getElementById("team-role");
const ruleSelect = document.getElementById("team-rule");
const resetButton = document.getElementById("reset-team");
const finishButton = document.getElementById("finish-team");
const status = document.getElementById("studio-status");
const notifyLessonCompleted = createEmbeddedToolBridge("teamwork-studio");

const previewTask = document.getElementById("preview-task");
const previewRole = document.getElementById("preview-role");
const previewRule = document.getElementById("preview-rule");

const defaults = {
  task: "плакат для класу",
  role: "малюю",
  rule: "слухаємо одне одного"
};

function syncPreview() {
  previewTask.textContent = titleCase(taskSelect.value);
  previewRole.textContent = `Я роблю: ${roleSelect.value}`;
  previewRule.textContent = `Наше правило: ${ruleSelect.value}`;
  status.textContent = "План оновлено. Перевір, чи роль і правило допомагають працювати разом.";
}

[taskSelect, roleSelect, ruleSelect].forEach((control) => {
  control.addEventListener("input", syncPreview);
  control.addEventListener("change", syncPreview);
});

resetButton.addEventListener("click", () => {
  taskSelect.value = defaults.task;
  roleSelect.value = defaults.role;
  ruleSelect.value = defaults.rule;
  syncPreview();
});

finishButton.addEventListener("click", () => {
  notifyLessonCompleted();
  status.textContent = "Готово. Ваш спільний план зібрано.";
});

syncPreview();
