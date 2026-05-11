// ── Activity: 20 запитань ──────────────────────────────────────────────────
// Заготовка для майбутньої активності "Так чи ні".
// Поки порожня — щоб не захаращувати renderers.js.

export function buildTwentyQuestionsActivity(_data) {
  const el = document.createElement('div');
  el.className = 'activity-placeholder';
  el.textContent = 'Гру «Так чи ні» можна провести в класі разом із учителем: загадайте тварину й звужуйте список запитаннями.';
  return el;
}
