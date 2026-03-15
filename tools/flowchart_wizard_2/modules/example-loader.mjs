export function applyExampleState(targetState, exampleState) {
  targetState.nodes = exampleState.nodes;
  targetState.edges = exampleState.edges;
  targetState.root = exampleState.root;
  targetState.cnt = exampleState.cnt;
  targetState.undo = [];
  targetState.sel = null;
  targetState.pos = {};
  targetState.ranks = {};
  targetState.manual = exampleState.manual ? { ...exampleState.manual } : {};
  targetState.baseX = {};
  targetState.baseY = {};
  targetState.rankY = {};
  targetState.rankH = {};
  targetState.comments = exampleState.comments;
  targetState.commentPos = exampleState.commentPos ? { ...exampleState.commentPos } : {};
}

export function getExampleLoadedToastText(title) {
  return 'Приклад «' + title + '» завантажено!';
}

