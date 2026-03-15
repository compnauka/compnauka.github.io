import { createClosedWizardState } from './wizard-state.mjs';

export function createEmptyWorkspaceState() {
  return {
    nodes: {},
    edges: [],
    root: null,
    cnt: 0,
    undo: [],
    sel: null,
    ranks: {},
    pos: {},
    manual: {},
    baseX: {},
    baseY: {},
    rankY: {},
    rankH: {},
    title: '',
    issues: [],
    issuesByNode: {},
    comments: {},
    wiz: createClosedWizardState(),
  };
}