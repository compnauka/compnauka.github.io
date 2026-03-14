export function getMascotHtml({ nodeCount, wizardOpen, wizardStep, isComplete, hasLoop, hasIncompleteBranch, openEnds }) {
  if (nodeCount <= 1) {
    return '<i class="fa-solid fa-hand-wave mr-1 text-yellow-500"></i>\u041f\u0440\u0438\u0432\u0456\u0442! \u041d\u0430\u0442\u0438\u0441\u043d\u0438 <strong>+</strong>, \u0449\u043e\u0431 \u043f\u043e\u0447\u0430\u0442\u0438!';
  }
  if (wizardOpen && wizardStep === 'existing') {
    return '<i class="fa-solid fa-link mr-1 text-slate-400"></i>\u0412\u0438\u0431\u0435\u0440\u0438 \u0431\u043b\u043e\u043a \u0434\u043b\u044f \u0437\'\u0454\u0434\u043d\u0430\u043d\u043d\u044f!';
  }
  if (wizardOpen && wizardStep === 'explain') {
    return '<i class="fa-solid fa-pen mr-1 text-indigo-400"></i>\u041d\u0430\u043f\u0438\u0448\u0438, \u0449\u043e \u0442\u0443\u0442 \u0432\u0456\u0434\u0431\u0443\u0432\u0430\u0454\u0442\u044c\u0441\u044f!';
  }
  if (wizardOpen) {
    return '<i class="fa-solid fa-lightbulb mr-1 text-yellow-400"></i>\u0412\u0438\u0431\u0435\u0440\u0438 \u0442\u0438\u043f \u0431\u043b\u043e\u043a\u0443!';
  }
  if (hasLoop && !isComplete) {
    return '<i class="fa-solid fa-rotate mr-1 text-sky-500"></i>\u0422\u0438 \u0431\u0443\u0434\u0443\u0454\u0448 <strong>\u0446\u0438\u043a\u043b</strong>! \u0421\u0442\u0440\u0456\u043b\u043a\u0430 \u043d\u0430\u0437\u0430\u0434 \u2014 \u0446\u0435 \u043f\u043e\u0432\u0442\u043e\u0440\u0435\u043d\u043d\u044f \u0434\u0456\u0439.';
  }
  if (hasLoop && isComplete) {
    return '<i class="fa-solid fa-trophy mr-1 text-yellow-500"></i>\u0426\u0438\u043a\u043b \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e! \u0417\u0431\u0435\u0440\u0435\u0436\u0438 <i class="fa-solid fa-download text-indigo-400"></i>';
  }
  if (hasIncompleteBranch) {
    return '<i class="fa-solid fa-code-branch mr-1 text-amber-500"></i>\u041d\u0435\u043f\u043e\u0432\u043d\u0435 \u0440\u043e\u0437\u0433\u0430\u043b\u0443\u0436\u0435\u043d\u043d\u044f: \u0433\u0456\u043b\u043a\u0430 <strong>\u00ab\u041d\u0456\u00bb</strong> \u043f\u0440\u043e\u043f\u0443\u0441\u043a\u0430\u0454 \u0434\u0456\u044e!';
  }
  if (isComplete) {
    return '<i class="fa-solid fa-trophy mr-1 text-yellow-500"></i>\u0421\u0445\u0435\u043c\u0430 \u0433\u043e\u0442\u043e\u0432\u0430! \u0417\u0431\u0435\u0440\u0435\u0436\u0438 <i class="fa-solid fa-download text-indigo-400"></i>';
  }
  if (openEnds.some(e => e.lbl)) {
    return '<i class="fa-solid fa-code-branch mr-1 text-amber-500"></i>\u041f\u0456\u0434\u043a\u043b\u044e\u0447\u0438 \u043e\u0431\u0438\u0434\u0432\u0456 \u0433\u0456\u043b\u043a\u0438 <strong>\u0422\u0430\u043a</strong> \u0456 <strong>\u041d\u0456</strong>!';
  }
  return nodeCount <= 3
    ? '<i class="fa-solid fa-fire mr-1 text-orange-500"></i>\u0427\u0443\u0434\u043e\u0432\u043e! \u041d\u0430\u0442\u0438\u0441\u043d\u0438 <strong>+</strong>, \u0449\u043e\u0431 \u043f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438!'
    : '<i class="fa-solid fa-thumbs-up mr-1 text-green-500"></i>\u0422\u0430\u043a \u0442\u0440\u0438\u043c\u0430\u0442\u0438! \u041f\u0440\u043e\u0434\u043e\u0432\u0436\u0443\u0439 \u0431\u0443\u0434\u0443\u0432\u0430\u0442\u0438!';
}
