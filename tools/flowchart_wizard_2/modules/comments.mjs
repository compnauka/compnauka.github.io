export const COMMENT_BOX = Object.freeze({
  offsetX: 72,
  width: 220,
  minHeight: 52,
  dash: '6 3',
  textMaxCpl: 26,
  textMaxLines: 6,
  lineHeight: 16,
  paddingY: 12,
});

export function normalizeCommentText(raw, maxLen = 140) {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function normalizeCommentOffset(raw) {
  const x = Number(raw?.x);
  const y = Number(raw?.y);
  return {
    x: Number.isFinite(x) ? Math.round(x) : 0,
    y: Number.isFinite(y) ? Math.round(y) : 0,
  };
}

export function getCommentLayout({ text, position, nodeWidth, wrapText, offset }) {
  const normalized = normalizeCommentText(text);
  if (!normalized || !position || typeof nodeWidth !== 'number') return null;

  const safeOffset = normalizeCommentOffset(offset);
  const lines = wrapText(normalized, COMMENT_BOX.textMaxCpl, COMMENT_BOX.textMaxLines);
  const boxHeight = Math.max(COMMENT_BOX.minHeight, lines.length * COMMENT_BOX.lineHeight + COMMENT_BOX.paddingY * 2);
  const boxX = position.x + nodeWidth / 2 + COMMENT_BOX.offsetX + safeOffset.x;
  const boxY = position.y - boxHeight / 2 + safeOffset.y;
  const startY = boxY + COMMENT_BOX.paddingY + COMMENT_BOX.lineHeight / 2;

  return {
    text: normalized,
    offset: safeOffset,
    connector: {
      x1: position.x + nodeWidth / 2,
      y1: position.y,
      x2: boxX,
      y2: boxY + boxHeight / 2,
    },
    box: {
      x: boxX,
      y: boxY,
      width: COMMENT_BOX.width,
      height: boxHeight,
      rx: 6,
    },
    lines: lines.map((line, index) => ({
      text: line,
      x: boxX + COMMENT_BOX.width / 2,
      y: startY + index * COMMENT_BOX.lineHeight,
    })),
  };
}
