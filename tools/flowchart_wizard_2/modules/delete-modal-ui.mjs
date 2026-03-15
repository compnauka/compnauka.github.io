export function getDeleteModalState({ selectedId, rootId, nodeType, getDeleteMessage }) {
  if (!selectedId) return { blocked: true, blockedMessage: '', message: '' };
  if (selectedId === rootId) {
    return {
      blocked: true,
      blockedMessage: 'Блок «Початок» не можна видалити!',
      message: '',
    };
  }
  return {
    blocked: false,
    blockedMessage: '',
    message: getDeleteMessage(nodeType),
  };
}

export function bindDeleteModalButtons({ cancelButton, confirmButton, onCancel, onConfirm }) {
  if (cancelButton) cancelButton.addEventListener('click', onCancel);
  if (confirmButton) confirmButton.onclick = onConfirm;
}
