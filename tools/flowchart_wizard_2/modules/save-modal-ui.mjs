export function bindSaveModalControls({ confirmButton, cancelButton, input, onConfirm, onClose }) {
  if (confirmButton) confirmButton.onclick = onConfirm;
  if (cancelButton) cancelButton.onclick = () => onClose();
  if (input) {
    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
  }
}
