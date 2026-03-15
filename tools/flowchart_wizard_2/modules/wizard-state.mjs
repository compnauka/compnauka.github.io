export function createClosedWizardState() {
  return { open: false, step: 'type', pid: null, plbl: null, type: null, editId: null };
}

export function createInsertWizardState(pid, label) {
  return { open: true, step: 'type', pid, plbl: label, type: null, editId: null };
}

export function createEditWizardState(type, editId) {
  return { open: true, step: 'explain', pid: null, plbl: null, type, editId };
}
