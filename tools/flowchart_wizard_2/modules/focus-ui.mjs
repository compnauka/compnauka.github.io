export function getNodeFocusScroll({ position, scale, viewportWidth, viewportHeight }) {
  return {
    top: Math.max(0, position.y * scale - viewportHeight * 0.42),
    left: Math.max(0, position.x * scale - viewportWidth * 0.5),
    behavior: 'smooth',
  };
}
