export function bindWizardControls({
  typeCards,
  connectExistingButton,
  cancelButton,
  backTextButton,
  backExistingButton,
  okButton,
  textInput,
  onChooseType,
  onOpenExisting,
  onCancel,
  onBackText,
  onBackExisting,
  onConfirm,
  onInputCancel,
}) {
  for (const card of typeCards || []) {
    card.addEventListener('click', () => {
      onChooseType(card.dataset.type);
    });
  }

  if (connectExistingButton) {
    connectExistingButton.addEventListener('click', () => {
      onOpenExisting();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      onCancel();
    });
  }

  if (backTextButton) {
    backTextButton.addEventListener('click', () => {
      onBackText();
    });
  }

  if (backExistingButton) {
    backExistingButton.addEventListener('click', () => {
      onBackExisting();
    });
  }

  if (okButton) {
    okButton.addEventListener('click', () => {
      onConfirm();
    });
  }

  if (textInput) {
    textInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onInputCancel();
    });
  }
}
