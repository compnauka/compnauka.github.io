export function getCheckSummaryText({ issueCount, errors, warnings }) {
  return issueCount === 0
    ? 'Помилок не знайдено. Схема виглядає добре.'
    : `Знайдено: ${errors} критичних, ${warnings} підказок.`;
}

export function getCheckSuccessHtml() {
  return '<i class="fa-solid fa-circle-check text-green-500"></i><div class="font-bold">Чудово! Можна продовжувати або зберігати схему.</div>';
}

export function getCheckIssueMeta(level) {
  return level === 'error'
    ? { rowClass: 'error', iconHtml: '<i class="fa-solid fa-triangle-exclamation"></i>' }
    : { rowClass: 'warn', iconHtml: '<i class="fa-solid fa-lightbulb"></i>' };
}
