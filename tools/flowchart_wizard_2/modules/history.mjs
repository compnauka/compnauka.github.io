const SNAPSHOT_KEYS = [
  'nodes',
  'edges',
  'root',
  'cnt',
  'title',
  'manual',
  'baseX',
  'baseY',
  'rankY',
  'rankH',
  'pos',
  'ranks',
  'comments',
];

function cloneValue(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createStateSnapshot(S) {
  const snapshot = {};
  for (const key of SNAPSHOT_KEYS) snapshot[key] = cloneValue(S[key]);
  return snapshot;
}

export function restoreStateSnapshot(S, snapshot) {
  for (const key of SNAPSHOT_KEYS) {
    S[key] = cloneValue(snapshot[key]);
  }
  S.sel = null;
  S.issues = [];
  S.issuesByNode = {};
}

export function pushUndoSnapshot(S, snapshot, maxSize = 40) {
  if (!Array.isArray(S.undo)) S.undo = [];
  S.undo.push(snapshot);
  if (S.undo.length > maxSize) S.undo.shift();
}

export function popUndoSnapshot(S) {
  if (!Array.isArray(S.undo) || !S.undo.length) return null;
  return S.undo.pop();
}
