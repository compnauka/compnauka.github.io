export function bindCheckModalControls({ openButton, closeButton, onOpen, onClose }) {
  if (openButton) {
    openButton.addEventListener('click', () => {
      onOpen();
    });
  }
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      onClose();
    });
  }
}
