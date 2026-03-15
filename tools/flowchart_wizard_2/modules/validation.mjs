function severityRank(level) {
  return level === 'error' ? 3 : level === 'warn' ? 2 : 1;
}

export function collectIssues(S, { inEdges, outEdges, findBackEdges }) {
  const issues = [];
  const ids = Object.keys(S.nodes);
  const backEdges = findBackEdges();
  const backEdgeTargets = new Set([...backEdges].map(e => e.to).filter(id => id && S.nodes[id]));

  if (!S.root || !S.nodes[S.root]) {
    issues.push({ level: 'error', code: 'root-missing', nodeId: null, msg: 'Немає або пошкоджено блок "Початок".' });
    return { issues, byNode: {} };
  }

  const startIds = ids.filter(id => S.nodes[id].type === 'start');
  if (startIds.length !== 1) {
    for (const id of startIds) {
      issues.push({ level: 'error', code: 'start-count', nodeId: id, msg: 'У схемі має бути рівно один блок "Початок".' });
    }
  }

  const endIds = ids.filter(id => S.nodes[id].type === 'end');
  if (!endIds.length) {
    issues.push({ level: 'warn', code: 'no-end', nodeId: null, msg: 'Немає блоку "Кінець", але алгоритм має завершуватися.' });
  }

  for (const id of ids) {
    const n = S.nodes[id];
    const incoming = inEdges(id).filter(e => S.nodes[e.from]);
    const outgoing = outEdges(id).filter(e => S.nodes[e.to]);

    if (n.type === 'start' && incoming.length > 0) {
      issues.push({ level: 'error', code: 'start-incoming', nodeId: id, msg: 'У "Початок" не повинно входити жодної стрілки.' });
    }
    if (n.type === 'end' && outgoing.length > 0) {
      issues.push({ level: 'error', code: 'end-outgoing', nodeId: id, msg: 'Від блоку "Кінець" не повинно виходити жодної стрілки.' });
    }

    if (n.type !== 'start' && incoming.length === 0 && !backEdgeTargets.has(id)) {
      issues.push({ level: 'warn', code: 'no-input', nodeId: id, msg: 'Цей блок ізольований: у нього не входить жодна стрілка.' });
    }
    if (n.type !== 'end' && outgoing.length === 0) {
      issues.push({ level: 'warn', code: 'no-output', nodeId: id, msg: 'Цей блок ще не має продовження. Треба додати стрілку далі.' });
    }

    if (n.type === 'decision') {
      const labels = outgoing.map(e => e.label).filter(Boolean);
      const hasYes = labels.includes('yes');
      const hasNo = labels.includes('no');
      if (!hasYes || !hasNo) {
        issues.push({ level: 'warn', code: 'decision-branches', nodeId: id, msg: 'У "Питання" мають бути дві гілки: "Так" і "Ні".' });
      }
      const invalid = labels.filter(l => l !== 'yes' && l !== 'no');
      if (invalid.length) {
        issues.push({ level: 'error', code: 'decision-label', nodeId: id, msg: 'У "Питання" підписи гілок мають бути тільки "Так" і "Ні".' });
      }
      if (outgoing.length > 2) {
        issues.push({ level: 'error', code: 'decision-too-many', nodeId: id, msg: 'Блок "Питання" не може мати більше двох виходів.' });
      }
    } else if (outgoing.some(e => e.label === 'yes' || e.label === 'no')) {
      issues.push({ level: 'error', code: 'label-on-non-decision', nodeId: id, msg: 'Підписи "Так/Ні" можна ставити лише біля блоку "Питання".' });
    }
  }

  const seen = new Set();
  const q = [S.root];
  seen.add(S.root);
  while (q.length) {
    const cur = q.shift();
    for (const e of outEdges(cur)) {
      if (!e.to || !S.nodes[e.to] || seen.has(e.to)) continue;
      seen.add(e.to);
      q.push(e.to);
    }
  }
  for (const id of ids) {
    if (!seen.has(id) && !backEdgeTargets.has(id)) {
      issues.push({ level: 'warn', code: 'unreachable', nodeId: id, msg: 'До цього блоку неможливо дійти від "Початок".' });
    }
  }

  const uniq = new Map();
  for (const it of issues) uniq.set(it.code + '|' + (it.nodeId || ''), it);
  const dedup = [...uniq.values()];

  const byNode = {};
  for (const it of dedup) {
    if (!it.nodeId) continue;
    const cur = byNode[it.nodeId];
    if (!cur || severityRank(it.level) > severityRank(cur.level)) {
      byNode[it.nodeId] = { level: it.level, msgs: [it.msg] };
    } else if (severityRank(it.level) === severityRank(cur.level)) {
      cur.msgs.push(it.msg);
    }
  }

  return { issues: dedup, byNode };
}
