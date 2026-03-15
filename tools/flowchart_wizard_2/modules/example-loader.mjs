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
  targetState.commentPos = {};
}

export function getExampleLoadedToastText(title) {
  return '\u041f\u0440\u0438\u043a\u043b\u0430\u0434 \u00ab' + title + '\u00bb \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e!';
}

