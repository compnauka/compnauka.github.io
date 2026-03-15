export function computeRanks(S, { outEdges, findBackEdges }) {
  const backEdges = findBackEdges();
  const indeg = {};
  for (const id of Object.keys(S.nodes)) indeg[id] = 0;
  for (const e of S.edges) {
    if (backEdges.has(e)) continue;
    if (e.to && S.nodes[e.to]) indeg[e.to] = (indeg[e.to] || 0) + 1;
  }
  const rank = {}, q = [];
  for (const id of Object.keys(S.nodes)) {
    if (!indeg[id]) { rank[id] = 0; q.push(id); }
  }
  while (q.length) {
    const id = q.shift();
    for (const e of outEdges(id)) {
      if (backEdges.has(e)) continue;
      if (!e.to || !S.nodes[e.to]) continue;
      rank[e.to] = Math.max(rank[e.to] ?? 0, (rank[id] ?? 0) + 1);
      if (--indeg[e.to] === 0) q.push(e.to);
    }
  }
  for (const id of Object.keys(S.nodes)) {
    if (rank[id] === undefined) rank[id] = 0;
  }
  return rank;
}

export function applyLayout(S, options) {
  const {
    inEdges, outEdges, findBackEdges, nodeH, updateWrapSize, svg, constants,
  } = options;
  const { CX, HO, ROW_GAP, NODE_H, VG, DY_LIMIT } = constants;

  const prevPos = S.pos || {};
  S.ranks = {}; S.pos = {}; S.rankY = {}; S.rankH = {}; S.baseX = {}; S.baseY = {};
  if (!S.root) return;

  const backEdges = findBackEdges();
  const inForwardEdges = id => inEdges(id).filter(e => !backEdges.has(e));
  const outForwardEdges = id => outEdges(id).filter(e => !backEdges.has(e));


  const rank = computeRanks(S, { outEdges, findBackEdges });
  S.ranks = rank;

  const byRnk = {};
  for (const [id, r] of Object.entries(rank)) {
    (byRnk[r] = byRnk[r] || []).push(id);
  }

  const x = {};
  x[S.root] = CX;

  const rnks = Object.keys(byRnk).map(Number).sort((a, b) => a - b);
  for (const r of rnks) {
    for (const id of byRnk[r]) {
      if (x[id] === undefined) {
        const prevX = prevPos[id]?.x;
        if (typeof prevX === 'number' && Number.isFinite(prevX)) {
          x[id] = prevX;
        } else {
          const pxs = inForwardEdges(id).map(e => x[e.from]).filter(v => v !== undefined);
          x[id] = pxs.length ? pxs.reduce((a, b) => a + b, 0) / pxs.length : CX;
        }
      }
      const n = S.nodes[id];
      const out = outForwardEdges(id);

      if (n.type === 'decision') {
        const ye = out.find(e => e.label === 'yes');
        const ne = out.find(e => e.label === 'no');
        if (ye?.to && x[ye.to] === undefined) x[ye.to] = x[id] - HO;
        if (ne?.to && x[ne.to] === undefined) x[ne.to] = x[id] + HO;
      } else {
        const ne = out.find(e => !e.label);
        if (ne?.to && x[ne.to] === undefined) x[ne.to] = x[id];
      }
    }
  }

  for (const id of Object.keys(S.nodes)) {
    if (inForwardEdges(id).length !== 1) continue;
    const [incoming] = inForwardEdges(id);
    const parent = S.nodes[incoming.from];
    const hasPrevX = typeof prevPos[id]?.x === 'number' && Number.isFinite(prevPos[id].x);
    const hasManualX = typeof S.manual?.[id]?.dx === 'number' && Number.isFinite(S.manual[id].dx);
    if (hasPrevX || hasManualX) continue;
    if (!parent || parent.type === 'decision' || incoming.label) continue;
    if (x[incoming.from] !== undefined) x[id] = x[incoming.from];
  }

  for (const id of Object.keys(S.nodes)) {
    if (inForwardEdges(id).length > 1) {
      const hasPrevX = typeof prevPos[id]?.x === 'number' && Number.isFinite(prevPos[id].x);
      const hasManualX = typeof S.manual?.[id]?.dx === 'number' && Number.isFinite(S.manual[id].dx);
      if (hasPrevX || hasManualX) continue;
      const pxs = inForwardEdges(id).map(e => x[e.from]).filter(v => v !== undefined);
      if (pxs.length >= 2) x[id] = pxs.reduce((a, b) => a + b, 0) / pxs.length;
    }
  }

  S.baseX = { ...x };

  if (!S.manual) S.manual = {};
  for (const id of Object.keys(x)) {
    const dx = S.manual[id]?.dx;
    if (typeof dx === 'number' && Number.isFinite(dx)) x[id] += dx;
  }

  const hasTitle = String(S.title ?? '').trim().length > 0;
  const TOP = hasTitle ? 190 : 88;
  const yByRank = {};
  const hByRank = {};
  const rowH = (r) => Math.max(...(byRnk[r] || []).map(id => nodeH(id)), NODE_H);

  if (!rnks.length) return;

  yByRank[rnks[0]] = TOP;
  hByRank[rnks[0]] = rowH(rnks[0]);

  for (let i = 1; i < rnks.length; i++) {
    const prev = rnks[i - 1];
    const cur = rnks[i];
    const ph = hByRank[prev] ?? rowH(prev);
    const ch = rowH(cur);
    hByRank[cur] = ch;
    yByRank[cur] = (yByRank[prev] ?? TOP) + (ph / 2 + ROW_GAP + ch / 2);
  }

  S.rankY = yByRank;
  S.rankH = hByRank;

  for (const id of Object.keys(S.nodes)) {
    const r = rank[id];
    if (r === undefined) continue;
    const baseY = (yByRank[r] ?? (TOP + r * VG));
    S.baseY[id] = baseY;
    const rawDy = S.manual?.[id]?.dy;
    const dy = (typeof rawDy === 'number' && Number.isFinite(rawDy))
      ? Math.max(-DY_LIMIT, Math.min(DY_LIMIT, rawDy))
      : 0;
    S.pos[id] = { x: x[id] ?? CX, y: baseY + dy };
  }

  let maxY = 300;
  for (const [id, p] of Object.entries(S.pos)) {
    maxY = Math.max(maxY, p.y + nodeH(id) / 2);
  }
  svg.style.minHeight = (maxY + 220) + 'px';
  updateWrapSize();
}



