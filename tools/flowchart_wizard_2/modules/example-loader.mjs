export function applyExampleState(targetState, exampleState) {
  targetState.nodes = exampleState.nodes;
  targetState.edges = exampleState.edges;
  targetState.root = exampleState.root;
  targetState.cnt = exampleState.cnt;
  targetState.undo = [];
  targetState.sel = null;
  targetState.pos = {};
  targetState.ranks = {};
  targetState.manual = {};
  targetState.baseX = {};
  targetState.baseY = {};
  targetState.rankY = {};
  targetState.rankH = {};
  targetState.comments = exampleState.comments;
}

export function getExampleLoadedToastText(title) {
  return '??????? ?' + title + '? ???????????!';
}
