export function getProgressPercent({ hasRoot, nodeCount, isComplete }) {
  return !hasRoot ? 5
    : nodeCount <= 1 ? 5
      : isComplete ? 100
        : Math.min(92, nodeCount * 11);
}

export function showToastElement(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
}

export function hideToastElement(element) {
  if (!element) return;
  element.classList.remove('show');
}

export function getRuntimeErrorMascotHtml(details, escHtml) {
  return `<i class="fa-solid fa-triangle-exclamation text-red-500 mr-2"></i>Сталася помилка: ${escHtml(details)}`;
}

export function getRuntimeErrorToastText(details) {
  return `Помилка: ${details}`;
}
