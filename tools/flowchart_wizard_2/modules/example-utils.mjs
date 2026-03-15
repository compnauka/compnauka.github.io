export function getExampleMaxNodeId(example) {
  return example.nodes.reduce((maxValue, node) => {
    const number = parseInt(String(node.id || '').replace('n', ''), 10) || 0;
    return Math.max(maxValue, number);
  }, 0);
}

export function createExampleState(example) {
  return {
    nodes: Object.fromEntries(example.nodes.map(node => [node.id, { ...node }])),
    edges: example.edges.map(edge => ({ ...edge })),
    root: example.root,
    cnt: getExampleMaxNodeId(example),
    comments: example.comments ? { ...example.comments } : {},
  };
}

export function getExampleCardHtml(example) {
  return `
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow"
           style="background:${example.color}">
        <i class="fa-solid ${example.icon} text-white text-xl"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-black text-gray-800 text-base">${example.title}</div>
        <div class="text-xs text-gray-500 font-semibold mt-0.5">${example.subtitle}</div>
      </div>
      <i class="fa-solid fa-arrow-right text-gray-300 flex-shrink-0"></i>`;
}
