export function computeToolbarPlacement({ rect, toolbarWidth, toolbarHeight, viewportWidth }) {
  const cx = rect.left + rect.width / 2;
  const top = rect.top;
  return {
    left: Math.max(4, Math.min(viewportWidth - toolbarWidth - 4, cx - toolbarWidth / 2)),
    top: Math.max(56, top - toolbarHeight - 10),
  };
}

export function getDeleteNodeMessage(nodeType) {
  return nodeType === 'decision'
    ? 'Це «Питання» буде видалено. Ми спробуємо з’єднати схему так, щоб алгоритм продовжився далі.'
    : 'Блок буде видалено, а наступні блоки залишаться - ми під’єднаємо схему автоматично.';
}
