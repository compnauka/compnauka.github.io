import { getCycleConnectionHintHtml } from './wizard.mjs';

export function buildExistingConnectionView({ candidates, ancestorIds, typeMeta, escHtml }) {
  const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
  const ancestors = ancestorIds instanceof Set ? ancestorIds : new Set(ancestorIds || []);
  const hasCycleHint = normalizedCandidates.some(node => ancestors.has(node.id));

  return {
    hasCandidates: normalizedCandidates.length > 0,
    hintHtml: hasCycleHint ? getCycleConnectionHintHtml() : '',
    items: normalizedCandidates.map(node => buildExistingConnectionItem(node, typeMeta, escHtml)),
  };
}

export function buildExistingConnectionItem(node, typeMeta, escHtml) {
  const meta = typeMeta[node.type] || typeMeta.process;
  return {
    id: node.id,
    html: `
        <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
             style="background:${meta.fill}">
          <i class="fa-solid ${meta.icon} text-white text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-black text-gray-800 text-sm truncate">${escHtml(node.text || '...')}</div>
          <div class="text-xs text-gray-400 font-bold">${meta.label}</div>
        </div>
        <i class="fa-solid fa-link text-indigo-300 flex-shrink-0 text-sm"></i>`,
  };
}

export function renderExistingConnectionView({ listEl, emptyEl, view, createElement, onSelect }) {
  if (!listEl || !emptyEl) return;

  listEl.innerHTML = '';
  if (!view?.hasCandidates) {
    emptyEl.classList.remove('hidden');
    listEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.classList.remove('hidden');

  if (view.hintHtml) {
    const hint = createElement('p');
    hint.className = 'text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 mb-2';
    hint.innerHTML = view.hintHtml;
    listEl.appendChild(hint);
  }

  view.items.forEach(item => {
    const btn = createElement('button');
    btn.className = 'exist-item w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 text-left';
    btn.innerHTML = item.html;
    btn.addEventListener('click', () => {
      onSelect(item.id);
    });
    listEl.appendChild(btn);
  });
}
