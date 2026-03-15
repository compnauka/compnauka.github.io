export const COMMENT_BOX = Object.freeze({
  offsetX: 88,
  width: 236,
  minHeight: 52,
  dash: '6 3',
  textMaxCpl: 29,
  textMaxLines: 6,
  lineHeight: 16,
  paddingY: 12,
  elbow: 18,
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
  const boxMidY = boxY + boxHeight / 2;
  const nodeHalfW = nodeWidth / 2;
  const nodeHalfH = 29;
  const verticalBias = boxMidY < position.y - 10 ? -1 : boxMidY > position.y + 10 ? 1 : 0;
  const anchorY = verticalBias < 0
    ? position.y - nodeHalfH * 0.45
    : verticalBias > 0
      ? position.y + nodeHalfH * 0.45
      : position.y;
  const elbowX = position.x + nodeHalfW + COMMENT_BOX.elbow;
  const leadX = Math.max(elbowX, boxX - COMMENT_BOX.elbow);

  return {
    text: normalized,
    offset: safeOffset,
    connector: {
      points: [
        { x: position.x + nodeHalfW, y: anchorY },
        { x: elbowX, y: anchorY },
        { x: leadX, y: boxMidY },
        { x: boxX, y: boxMidY },
      ],
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
