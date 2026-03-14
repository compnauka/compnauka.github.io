import { shiftBySide, simplifyPath, pathLen, orthHitsRect, pathSegments, segOverlapPenalty } from './render-utils.mjs';

function nodeRect(S, nodeW, nodeH, id, pad = 0) {
  const p = S.pos[id];
  if (!p) return null;
  const w = nodeW(id), h = nodeH(id);
  return { l: p.x - w / 2 - pad, r: p.x + w / 2 + pad, t: p.y - h / 2 - pad, b: p.y + h / 2 + pad };
}

function graphBounds(S, nodeW, nodeH, CX, pad = 0) {
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
  for (const id of Object.keys(S.nodes)) {
    const box = nodeRect(S, nodeW, nodeH, id, pad);
    if (!box) continue;
    l = Math.min(l, box.l); r = Math.max(r, box.r);
    t = Math.min(t, box.t); b = Math.max(b, box.b);
  }
  if (!Number.isFinite(l)) return { l: CX - 400, r: CX + 400, t: 60, b: 700 };
  return { l, r, t, b };
}

function edgeAnchor(S, nodeW, nodeH, DIAMOND_HALF, id, side) {
  const p = S.pos[id];
  if (!p) return { x: 0, y: 0 };
  const n = S.nodes[id];
  if (n?.type === 'decision') {
    if (side === 'left') return { x: p.x - DIAMOND_HALF, y: p.y };
    if (side === 'right') return { x: p.x + DIAMOND_HALF, y: p.y };
    if (side === 'top') return { x: p.x, y: p.y - DIAMOND_HALF };
    return { x: p.x, y: p.y + DIAMOND_HALF };
  }
  const w = nodeW(id), h = nodeH(id);
  if (side === 'left') return { x: p.x - w / 2, y: p.y };
  if (side === 'right') return { x: p.x + w / 2, y: p.y };
  if (side === 'top') return { x: p.x, y: p.y - h / 2 };
  return { x: p.x, y: p.y + h / 2 };
}

function pathCollisions(S, nodeRectFn, EDGE_HIT_PAD, pts, fromId, toId) {
  let hit = 0;
  const ids = Object.keys(S.nodes).filter(id => id !== fromId && id !== toId);
  for (let i = 1; i < pts.length; i++) {
    for (const id of ids) {
      const rect = nodeRectFn(id, EDGE_HIT_PAD);
      if (rect && orthHitsRect(pts[i - 1], pts[i], rect)) hit++;
    }
  }
  return hit;
}

function pathOverlapPenalty(edgeOccupancy, pts) {
  if (!edgeOccupancy.length) return 0;
  const segs = pathSegments(pts);
  let p = 0;
  for (const s1 of segs) {
    for (const s2 of edgeOccupancy) p += segOverlapPenalty(s1, s2);
  }
  return p;
}

export function computeEdgeRoute({ S, e, edgeOccupancy = [], nodeW, nodeH, constants }) {
  const { CX, DIAMOND_HALF, EDGE_STUB, EDGE_END_STUB, EDGE_LANE_GAP, EDGE_HIT_PAD } = constants;
  const fp = S.pos[e.from], tp = S.pos[e.to];
  if (!fp || !tp) return null;
  const upward = tp.y < fp.y - 18;
  const fromNode = S.nodes[e.from];
  const decisionBranch = fromNode?.type === 'decision' && (e.label === 'yes' || e.label === 'no');
  let fromSides;
  if (fromNode?.type === 'decision' && e.label === 'yes') fromSides = ['left'];
  else if (fromNode?.type === 'decision' && e.label === 'no') fromSides = ['right'];
  else if (upward) {
    const near = tp.x >= fp.x ? 'right' : 'left';
    const far = near === 'right' ? 'left' : 'right';
    fromSides = ['top', near, far, 'bottom'];
  } else {
    fromSides = ['bottom', 'left', 'right', 'top'];
  }
  let toSides;
  if (decisionBranch) {
    if (upward) toSides = e.label === 'yes' ? ['left', 'right', 'top'] : ['right', 'left', 'top'];
    else toSides = ['top'];
  } else if (upward) {
    const near = tp.x >= fp.x ? 'left' : 'right';
    const far = near === 'left' ? 'right' : 'left';
    toSides = [near, 'top', far, 'bottom'];
  } else {
    toSides = ['top', 'left', 'right', 'bottom'];
  }
  const nodeRectFn = (id, pad = 0) => nodeRect(S, nodeW, nodeH, id, pad);
  const gb = graphBounds(S, nodeW, nodeH, CX, EDGE_LANE_GAP + 20);
  let best = null;
  for (let fi = 0; fi < fromSides.length; fi++) {
    for (let ti = 0; ti < toSides.length; ti++) {
      const fs = fromSides[fi], ts = toSides[ti];
      const s0 = edgeAnchor(S, nodeW, nodeH, DIAMOND_HALF, e.from, fs);
      const t0 = edgeAnchor(S, nodeW, nodeH, DIAMOND_HALF, e.to, ts);
      const startStub = (decisionBranch && upward) ? EDGE_STUB + 16 : EDGE_STUB;
      const endStub = (decisionBranch && upward) ? EDGE_END_STUB + 14 : EDGE_END_STUB;
      const s1 = shiftBySide(s0, fs, startStub);
      const t1 = shiftBySide(t0, ts, endStub);
      const laneL = Math.min(gb.l, Math.min(s1.x, t1.x) - EDGE_LANE_GAP);
      const laneR = Math.max(gb.r, Math.max(s1.x, t1.x) + EDGE_LANE_GAP);
      const laneT = Math.min(gb.t, Math.min(s1.y, t1.y) - EDGE_LANE_GAP);
      const laneB = Math.max(gb.b, Math.max(s1.y, t1.y) + EDGE_LANE_GAP);
      let variants;
      if (decisionBranch) {
        const sidePad = upward ? Math.max(58, Math.min(132, Math.abs(t1.x - s1.x) * 0.42 + 44)) : Math.round(EDGE_STUB * 1.4);
        const sideX = (fs === 'left') ? Math.min(s1.x, t1.x) - sidePad : Math.max(s1.x, t1.x) + sidePad;
        const localLift = upward
          ? Math.min(s1.y, t1.y) - Math.max(24, Math.min(68, Math.abs(s1.y - t1.y) * 0.26 + 24))
          : Math.min(s1.y, t1.y) - Math.max(16, Math.min(28, Math.abs(s1.y - t1.y) * 0.35));
        variants = [
          [s0, s1, { x: sideX, y: s1.y }, { x: sideX, y: t1.y }, t1, t0],
          [s0, s1, { x: sideX, y: s1.y }, { x: sideX, y: localLift }, { x: t1.x, y: localLift }, t1, t0],
          [s0, s1, { x: t1.x, y: s1.y }, t1, t0],
          [s0, s1, { x: s1.x, y: t1.y }, t1, t0],
          [s0, s1, { x: laneL, y: s1.y }, { x: laneL, y: t1.y }, t1, t0],
          [s0, s1, { x: laneR, y: s1.y }, { x: laneR, y: t1.y }, t1, t0],
        ];
      } else {
        variants = [
          [s0, s1, { x: t1.x, y: s1.y }, t1, t0],
          [s0, s1, { x: s1.x, y: t1.y }, t1, t0],
          [s0, s1, { x: laneL, y: s1.y }, { x: laneL, y: t1.y }, t1, t0],
          [s0, s1, { x: laneR, y: s1.y }, { x: laneR, y: t1.y }, t1, t0],
          [s0, s1, { x: s1.x, y: laneT }, { x: t1.x, y: laneT }, t1, t0],
          [s0, s1, { x: s1.x, y: laneB }, { x: t1.x, y: laneB }, t1, t0],
        ];
      }
      for (const raw of variants) {
        const pts = simplifyPath(raw);
        if (pts.length < 2) continue;
        const minY = Math.min(...pts.map(p => p.y));
        const minX = Math.min(...pts.map(p => p.x));
        const maxX = Math.max(...pts.map(p => p.x));
        const tooHigh = decisionBranch ? Math.max(0, (Math.min(fp.y, tp.y) - 72) - minY) : 0;
        let wrongSidePenalty = 0;
        if (upward && fp.x > tp.x + 24 && minX < tp.x - 48) wrongSidePenalty += 140;
        if (upward && fp.x < tp.x - 24 && maxX > tp.x + 48) wrongSidePenalty += 140;
        if (decisionBranch && upward) {
          if (e.label === 'yes' && maxX > tp.x + 60) wrongSidePenalty += 220;
          if (e.label === 'no' && minX < tp.x - 60) wrongSidePenalty += 220;
        }
        let tightAirPenalty = 0;
        if (decisionBranch && upward) {
          const sideSpread = Math.abs((e.label === 'yes' ? minX : maxX) - s0.x);
          if (sideSpread < 58) tightAirPenalty += (58 - sideSpread) * 12;
        }
        const score = pathLen(pts)
          + Math.max(0, pts.length - 2) * 24
          + pathCollisions(S, nodeRectFn, EDGE_HIT_PAD, pts, e.from, e.to) * 2400
          + pathOverlapPenalty(edgeOccupancy, pts) * 650
          + tooHigh * 8 + wrongSidePenalty + tightAirPenalty + fi * 14 + ti * 10
          + ((upward && fs === 'bottom') ? 90 : 0);
        if (!best || score < best.score) best = { score, pts, fromSide: fs, fromAnchor: s0 };
      }
    }
  }
  if (!best && fromSides.length && toSides.length) {
    const fs = fromSides[0], ts = toSides[0];
    const s0 = edgeAnchor(S, nodeW, nodeH, DIAMOND_HALF, e.from, fs);
    const t0 = edgeAnchor(S, nodeW, nodeH, DIAMOND_HALF, e.to, ts);
    const s1 = shiftBySide(s0, fs, EDGE_STUB);
    const t1 = shiftBySide(t0, ts, EDGE_END_STUB);
    const fallback = simplifyPath([s0, s1, { x: s1.x, y: t1.y }, t1, t0]);
    if (fallback.length >= 2) best = { score: Number.MAX_SAFE_INTEGER, pts: fallback, fromSide: fs, fromAnchor: s0 };
    else {
      const plain = simplifyPath([s0, t0]);
      if (plain.length >= 2) best = { score: Number.MAX_SAFE_INTEGER, pts: plain, fromSide: fs, fromAnchor: s0 };
    }
  }
  return best;
}
