export function renderMascotMessage(element, html) {
  if (!element) return;
  element.innerHTML = html;
}

export function toggleMascotVisibility(element) {
  if (!element) return false;
  element.classList.toggle('visible');
  return element.classList.contains('visible');
}
