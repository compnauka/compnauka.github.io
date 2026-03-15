export function shouldIgnoreGlobalKeydown({ textInput, activeElement, activeDialog }) {
  return textInput === activeElement || Boolean(activeDialog);
}

export function shouldTriggerDeleteShortcut({ key, selectionId, wizardOpen }) {
  return (key === 'Delete' || key === 'Backspace') && Boolean(selectionId) && !wizardOpen;
}

export function closeAllEditorOverlays({ closeWizard, hideToolbar, closeModal }) {
  closeWizard();
  hideToolbar();
  ['del-modal', 'reset-modal', 'ex-modal', 'save-modal', 'check-modal'].forEach(closeModal);
}
