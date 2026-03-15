export const COMMENT_BOX = Object.freeze({
  offsetX: 80,
  width: 140,
  height: 44,
  dash: '6 3',
  textMaxCpl: 18,
  textMaxLines: 2,
  lineHeight: 16,
});

export function normalizeCommentText(raw, maxLen = 140) {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function getCommentLayout({ text, position, nodeWidth, wrapText }) {
  const normalized = normalizeCommentText(text);
  if (!normalized || !position || typeof nodeWidth !== 'number') return null;

  const boxX = position.x + nodeWidth / 2 + COMMENT_BOX.offsetX;
  const boxY = position.y - COMMENT_BOX.height / 2;
  const lines = wrapText(normalized, COMMENT_BOX.textMaxCpl, COMMENT_BOX.textMaxLines);
  const startY = position.y - (lines.length * COMMENT_BOX.lineHeight) / 2 + COMMENT_BOX.lineHeight / 2;

  return {
    text: normalized,
    connector: {
      x1: position.x + nodeWidth / 2,
      y1: position.y,
      x2: boxX,
      y2: position.y,
    },
    box: {
      x: boxX,
      y: boxY,
      width: COMMENT_BOX.width,
      height: COMMENT_BOX.height,
      rx: 6,
    },
    lines: lines.map((line, index) => ({
      text: line,
      x: boxX + COMMENT_BOX.width / 2,
      y: startY + index * COMMENT_BOX.lineHeight,
    })),
  };
}
