export function buildShape(mkSvg, constants, type, x, y, fill, stroke, sw) {
  const { NODE_W, NODE_H, DIAMOND_HALF, IO_W } = constants;
  const a = { fill, stroke, 'stroke-width': sw, filter: 'url(#sh)' };
  if (type === 'start' || type === 'end') {
    return mkSvg('rect', { ...a, x: x - NODE_W / 2, y: y - NODE_H / 2, width: NODE_W, height: NODE_H, rx: NODE_H / 2 });
  }
  if (type === 'process') {
    return mkSvg('rect', { ...a, x: x - NODE_W / 2, y: y - NODE_H / 2, width: NODE_W, height: NODE_H, rx: 10 });
  }
  if (type === 'subroutine') {
    const g = mkSvg('g', { filter: 'url(#sh)' });
    g.appendChild(mkSvg('rect', {
      fill,
      stroke,
      'stroke-width': sw,
      x: x - NODE_W / 2,
      y: y - NODE_H / 2,
      width: NODE_W,
      height: NODE_H,
      rx: 10,
    }));
    g.appendChild(mkSvg('line', {
      x1: x - NODE_W / 2 + 14,
      y1: y - NODE_H / 2,
      x2: x - NODE_W / 2 + 14,
      y2: y + NODE_H / 2,
      stroke,
      'stroke-width': sw,
    }));
    g.appendChild(mkSvg('line', {
      x1: x + NODE_W / 2 - 14,
      y1: y - NODE_H / 2,
      x2: x + NODE_W / 2 - 14,
      y2: y + NODE_H / 2,
      stroke,
      'stroke-width': sw,
    }));
    return g;
  }
  if (type === 'decision') {
    return mkSvg('polygon', { ...a, points: `${x},${y - DIAMOND_HALF} ${x + DIAMOND_HALF},${y} ${x},${y + DIAMOND_HALF} ${x - DIAMOND_HALF},${y}` });
  }
  const s = 20;
  return mkSvg('polygon', {
    ...a,
    points: `${x - IO_W / 2 + s},${y - NODE_H / 2} ${x + IO_W / 2 + s},${y - NODE_H / 2} ${x + IO_W / 2 - s},${y + NODE_H / 2} ${x - IO_W / 2 - s},${y + NODE_H / 2}`
  });
}

export function shiftBySide(pt, side, dist) {
  if (side === 'left') return { x: pt.x - dist, y: pt.y };
  if (side === 'right') return { x: pt.x + dist, y: pt.y };
  if (side === 'top') return { x: pt.x, y: pt.y - dist };
  return { x: pt.x, y: pt.y + dist };
}

export function simplifyPath(pts) {
  const out = [];
  for (const p of pts) {
    const q = { x: Math.round(p.x), y: Math.round(p.y) };
    const prev = out[out.length - 1];
    if (!prev || prev.x !== q.x || prev.y !== q.y) out.push(q);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < out.length - 1; i++) {
      const a = out[i - 1], b = out[i], c = out[i + 1];
      const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
      if (collinear) { out.splice(i, 1); changed = true; break; }
    }
  }
  return out;
}

export function pathLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
  return s;
}

export function orthHitsRect(a, b, rect) {
  if (a.x === b.x) {
    const x = a.x;
    const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
    return x > rect.l && x < rect.r && y2 > rect.t && y1 < rect.b;
  }
  if (a.y === b.y) {
    const y = a.y;
    const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
    return y > rect.t && y < rect.b && x2 > rect.l && x1 < rect.r;
  }
  return false;
}

export function pathSegments(pts) {
  const segs = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (a.x === b.x || a.y === b.y) segs.push({ a, b });
  }
  return segs;
}

export function segOverlapPenalty(s1, s2) {
  if (s1.a.x === s1.b.x && s2.a.x === s2.b.x && s1.a.x === s2.a.x) {
    const y1a = Math.min(s1.a.y, s1.b.y), y1b = Math.max(s1.a.y, s1.b.y);
    const y2a = Math.min(s2.a.y, s2.b.y), y2b = Math.max(s2.a.y, s2.b.y);
    const ov = Math.min(y1b, y2b) - Math.max(y1a, y2a);
    if (ov > 0) return 8 + ov * 0.06;
  }
  if (s1.a.y === s1.b.y && s2.a.y === s2.b.y && s1.a.y === s2.a.y) {
    const x1a = Math.min(s1.a.x, s1.b.x), x1b = Math.max(s1.a.x, s1.b.x);
    const x2a = Math.min(s2.a.x, s2.b.x), x2b = Math.max(s2.a.x, s2.b.x);
    const ov = Math.min(x1b, x2b) - Math.max(x1a, x2a);
    if (ov > 0) return 8 + ov * 0.06;
  }
  const v = (s1.a.x === s1.b.x) ? s1 : (s2.a.x === s2.b.x ? s2 : null);
  const h = (s1.a.y === s1.b.y) ? s1 : (s2.a.y === s2.b.y ? s2 : null);
  if (v && h && v !== h) {
    const vx = v.a.x;
    const vy1 = Math.min(v.a.y, v.b.y), vy2 = Math.max(v.a.y, v.b.y);
    const hy = h.a.y;
    const hx1 = Math.min(h.a.x, h.b.x), hx2 = Math.max(h.a.x, h.b.x);
    if (vx > hx1 && vx < hx2 && hy > vy1 && hy < vy2) return 1.6;
  }
  return 0;
}

export function createWrapText() {
  const cache = new Map();
  return function wrapText(str, maxCPL, maxLines = 3) {
    const cacheKey = `${str}|${maxCPL}|${maxLines}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const s = String(str ?? '').trim().replace(/\s+/g, ' ');
    if (!s) return ['...'];

    const splitLongWord = (w) => {
      const m = String(w).match(/([!?.,:;]+)$/);
      const suffix = m ? m[1] : '';
      const core = suffix ? String(w).slice(0, -suffix.length) : String(w);
      const coreMax = Math.max(4, maxCPL - suffix.length);
      if (core.length <= coreMax) return [core + suffix];
      const parts = [];
      let rest = core;
      while (rest.length > coreMax) {
        parts.push(rest.slice(0, coreMax - 1) + '-');
        rest = rest.slice(coreMax - 1);
      }
      parts.push(rest + suffix);
      return parts;
    };

    const words = s.split(' ').flatMap(splitLongWord);
    const lines = [];
    let cur = '';
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (next.length <= maxCPL) {
        cur = next;
        continue;
      }
      if (cur) lines.push(cur);
      cur = word;
      if (lines.length === maxLines - 1) break;
    }
    if (cur) lines.push(cur);
    const trimmed = lines.slice(0, maxLines);
    if (words.join(' ').length > trimmed.join(' ').replace(/\s+/g, ' ').trim().length) {
      const last = trimmed[trimmed.length - 1] || '';
      trimmed[trimmed.length - 1] = last.length >= maxCPL ? `${last.slice(0, Math.max(1, maxCPL - 1))}\u2026` : `${last}\u2026`;
    }
    cache.set(cacheKey, trimmed);
    return trimmed;
  };
}
