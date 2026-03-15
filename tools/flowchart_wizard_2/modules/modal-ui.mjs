export function showModalElement(element, onActivate = null) {
  if (!element) return;
  element.setAttribute('aria-hidden', 'false');
  element.classList.remove('hidden');
  element.classList.add('flex');
  if (onActivate) onActivate(element);
}

export function hideModalElement(element, onDeactivate = null) {
  if (!element) return;
  element.classList.add('hidden');
  element.classList.remove('flex');
  if (onDeactivate) onDeactivate(element);
}
