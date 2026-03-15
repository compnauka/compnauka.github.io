export function getWizardBadge(lbl) {
  if (lbl !== 'yes' && lbl !== 'no') return null;
  return {
    text: lbl === 'yes' ? '\u0413\u0456\u043b\u043a\u0430 \u00ab\u0422\u0430\u043a\u00bb' : '\u0413\u0456\u043b\u043a\u0430 \u00ab\u041d\u0456\u00bb',
    className: `text-xs font-black px-2 py-0.5 rounded-full ${lbl === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`
  };
}

export function getWizardLiveText(step) {
  return step === 'type'
    ? '\u041a\u0440\u043e\u043a 1. \u041e\u0431\u0435\u0440\u0438 \u0442\u0438\u043f \u0431\u043b\u043e\u043a\u0443.'
    : step === 'explain'
      ? '\u041a\u0440\u043e\u043a 2. \u0412\u0432\u0435\u0434\u0438 \u0442\u0435\u043a\u0441\u0442 \u0431\u043b\u043e\u043a\u0443.'
      : '\u041a\u0440\u043e\u043a 3. \u041e\u0431\u0435\u0440\u0438 \u0431\u043b\u043e\u043a \u0434\u043b\u044f \u0437\u2019\u0454\u0434\u043d\u0430\u043d\u043d\u044f.';
}

export function getExplainBorderClass(type) {
  return {
    process: 'border-sky-200 bg-sky-50',
    decision: 'border-amber-200 bg-amber-50',
    'input-output': 'border-violet-200 bg-violet-50',
    subroutine: 'border-teal-200 bg-teal-50',
    end: 'border-rose-200 bg-rose-50',
    start: 'border-green-200 bg-green-50',
  }[type] || 'border-gray-200 bg-gray-50';
}

export function getExplainContentHtml(type, typeMeta, escHtml) {
  const m = typeMeta[type] || typeMeta.process;
  const explain = m.explain || '';
  const safeLabel = escHtml(m.label || '');
  const safeExplain = escHtml(explain);
  return {
    className: `flex items-start gap-3 p-4 rounded-2xl border-2 mb-4 ${getExplainBorderClass(type)}` ,
    html: `
    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
         style="background:${m.fill}">
      <i class="fa-solid ${m.icon} text-white text-sm"></i>
    </div>
    <div class="flex-1 min-w-0">
      <div class="font-black text-gray-800 mb-0.5">${safeLabel}</div>
      ${safeExplain ? `<div class="text-sm text-gray-500 font-semibold leading-snug">${safeExplain}</div>` : ''}
    </div>`
  };
}

export function getMergeHintText(sibNodeText, siblingLabel) {
  const label = siblingLabel === 'yes' ? '\u0422\u0430\u043a' : siblingLabel === 'no' ? '\u041d\u0456' : '\u043e\u0441\u043d\u043e\u0432\u043d\u0430';
  return `\u0417'\u0454\u0434\u043d\u0430\u0442\u0438 \u0437 \u0433\u0456\u043b\u043a\u043e\u044e "${sibNodeText || '...'}" (${label})`;
}


export function getDecisionEdgeLabelPosition(route, label) {
  const pts = route?.pts || [];
  if (pts.length < 2) return null;

  let segment = null;
  for (let i = 1; i < Math.min(pts.length, 4); i++) {
    const from = pts[i - 1];
    const to = pts[i];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const manhattan = Math.abs(dx) + Math.abs(dy);
    if (manhattan < 16) continue;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    if (!segment || (horizontal && !segment.horizontal)) {
      segment = { from, to, horizontal, dx, dy };
      if (horizontal) break;
    }
  }

  if (!segment) {
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    segment = {
      from: pts[0],
      to: pts[1],
      horizontal: Math.abs(dx) >= Math.abs(dy),
      dx,
      dy,
    };
  }

  const midX = Math.round((segment.from.x + segment.to.x) / 2);
  const midY = Math.round((segment.from.y + segment.to.y) / 2);
  if (segment.horizontal) {
    const bias = 0.68;
    return {
      x: Math.round(segment.from.x + segment.dx * bias),
      y: midY,
    };
  }

  const side = label === 'yes' ? -38 : 38;
  return { x: midX + side, y: midY };
}

export function getCycleConnectionHintHtml() {
  return '<i class="fa-solid fa-rotate mr-1"></i>\u0417\'\u0454\u0434\u043d\u0430\u043d\u043d\u044f \u0437 \u0431\u043b\u043e\u043a\u043e\u043c \u0432\u0438\u0449\u0435 \u2014 \u0446\u0435 <strong>\u0446\u0438\u043a\u043b</strong>! \u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c \u043f\u043e\u0432\u0442\u043e\u0440\u044e\u0432\u0430\u0442\u0438\u043c\u0435\u0442\u044c\u0441\u044f.';
}

