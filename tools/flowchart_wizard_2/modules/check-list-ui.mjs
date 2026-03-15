export function bindCheckIssueRow(row, issue, { onFocusIssue }) {
  if (!row) return;
  if (issue?.nodeId) {
    row.addEventListener('click', () => {
      onFocusIssue(issue.nodeId);
    });
    return;
  }
  row.disabled = true;
}

export function hasCheckIssueTarget(issue) {
  return Boolean(issue?.nodeId);
}
