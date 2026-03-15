export function createExampleCardButton(doc, example, cardHtml, onSelect) {
  const card = doc.createElement('button');
  card.className = `ex-card w-full flex items-center gap-4 p-4 ${example.bg} border-2 ${example.border} rounded-2xl text-left transition`;
  card.innerHTML = cardHtml;
  card.addEventListener('click', onSelect);
  return card;
}

export function isBackdropClick(target, modalElement) {
  return Boolean(modalElement) && target === modalElement;
}
