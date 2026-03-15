export function bindResetModalControls({ openButton, cancelButton, confirmButton, onOpen, onCancel, onConfirm }) {
  if (openButton) {
    openButton.addEventListener('click', () => {
      onOpen();
    });
  }
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      onCancel();
    });
  }
  if (confirmButton) {
    confirmButton.addEventListener('click', () => {
      onConfirm();
    });
  }
}
