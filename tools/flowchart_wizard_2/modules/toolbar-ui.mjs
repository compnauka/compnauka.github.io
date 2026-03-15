export function showToolbarElement(toolbar) {
  if (!toolbar) return;
  toolbar.classList.remove('hidden');
  toolbar.style.display = 'flex';
}

export function hideToolbarElement(toolbar) {
  if (!toolbar) return;
  toolbar.classList.add('hidden');
  toolbar.style.display = '';
}

export function shouldHideToolbarOnCanvasPointer({ onNode, onPlus, hasSelection }) {
  return !onNode && !onPlus && hasSelection;
}
