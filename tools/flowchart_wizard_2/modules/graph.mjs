export function createEdgeCacheState() {
  return { cacheOut: new Map(), cacheIn: new Map(), dirty: true };
}

export function invalidateEdgeCache(edgeCache) {
  edgeCache.dirty = true;
}

function ensureEdgeCache(S, edgeCache) {
  if (!edgeCache.dirty) return;
  edgeCache.cacheOut = new Map();
  edgeCache.cacheIn = new Map();
  for (const e of S.edges) {
    if (!edgeCache.cacheOut.has(e.from)) edgeCache.cacheOut.set(e.from, []);
    edgeCache.cacheOut.get(e.from).push(e);
    if (!edgeCache.cacheIn.has(e.to)) edgeCache.cacheIn.set(e.to, []);
    edgeCache.cacheIn.get(e.to).push(e);
  }
  edgeCache.dirty = false;
}

export function outEdges(S, edgeCache, id) {
  ensureEdgeCache(S, edgeCache);
  return edgeCache.cacheOut.get(id) ?? [];
}

export function inEdges(S, edgeCache, id) {
  ensureEdgeCache(S, edgeCache);
  return edgeCache.cacheIn.get(id) ?? [];
}

export function ancestors(S, edgeCache, id) {
  const res = new Set([id]);
  const q = [id];
  while (q.length) {
    inEdges(S, edgeCache, q.shift()).forEach(e => {
      if (!res.has(e.from)) {
        res.add(e.from);
        q.push(e.from);
      }
    });
  }
  return res;
}

export function descendants(S, edgeCache, startId) {
  const res = new Set();
  if (!startId || !S.nodes[startId]) return res;
  const q = [startId];
  res.add(startId);
  while (q.length) {
    outEdges(S, edgeCache, q.shift()).forEach(e => {
      if (e.to && S.nodes[e.to] && !res.has(e.to)) {
        res.add(e.to);
        q.push(e.to);
      }
    });
  }
  return res;
}

export function openEnds(S, edgeCache) {
  return Object.keys(S.nodes).flatMap(id => {
    const n = S.nodes[id];
    const outValid = outEdges(S, edgeCache, id).filter(e => e.to && S.nodes[e.to]);
    if (n.type === 'end') return [];
    if (n.type === 'decision') {
      const res = [];
      if (!outValid.some(e => e.label === 'yes')) res.push({ pid: id, lbl: 'yes' });
      if (!outValid.some(e => e.label === 'no')) res.push({ pid: id, lbl: 'no' });
      return res;
    }
    return outValid.some(e => !e.label) ? [] : [{ pid: id, lbl: null }];
  });
}

export function isDone(S, edgeCache) {
  return S.root && Object.keys(S.nodes).length > 1 && openEnds(S, edgeCache).length === 0;
}

export function hasIncompleteIf(S, edgeCache) {
  return Object.values(S.nodes).some(n => {
    if (n.type !== 'decision') return false;
    const yes = outEdges(S, edgeCache, n.id).find(e => e.label === 'yes' && e.to && S.nodes[e.to]);
    const no = outEdges(S, edgeCache, n.id).find(e => e.label === 'no' && e.to && S.nodes[e.to]);
    if (!yes || !no) return false;
    return descendants(S, edgeCache, yes.to).has(no.to);
  });
}

export function findBackEdges(S, edgeCache) {
  const state = {};
  const back = new Set();

  function walk(id) {
    state[id] = 1;
    for (const e of outEdges(S, edgeCache, id)) {
      const to = e.to;
      if (!to || !S.nodes[to]) continue;
      if (state[to] === 1) {
        back.add(e);
        continue;
      }
      if (!state[to]) walk(to);
    }
    state[id] = 2;
  }

  if (S.root && S.nodes[S.root]) walk(S.root);
  for (const id of Object.keys(S.nodes)) {
    if (!state[id]) walk(id);
  }
  return back;
}
