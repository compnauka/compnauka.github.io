/* Віконце — Калькулятор. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, bus } = VOS;

  function launch() {
    let cur = '0', prev = null, op = null, fresh = true, expr = '';
    const exprEl = el('div.calc-expr', ' ');
    const out = el('div.calc-out', { 'aria-live': 'polite' }, '0');
    const fmt = (s) => {
      if (s === tr('Помилка')) return s;
      const [i, f] = s.split('.');
      const neg = i.startsWith('-');
      const g = (neg ? i.slice(1) : i).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? '−' : '') + g + (f != null ? ',' + f : '');
    };
    const show = () => { out.textContent = fmt(cur); exprEl.textContent = expr || ' '; out.classList.toggle('long', cur.length > 10); };
    const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    const calc = (a, b, o) => {
      switch (o) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
      }
      return b;
    };
    const norm = (v) => (isFinite(v) ? String(parseFloat(v.toPrecision(12))) : tr('Помилка'));

    function evaluate(a, b, operator) {
      const result = norm(calc(a, b, operator));
      VOS.xray.compute(fmt(String(a)) + ' ' + SYM[operator] + ' ' + fmt(String(b)), fmt(result));
      return result;
    }

    function press(k) {
      if (cur === tr('Помилка') && k !== 'C') { cur = '0'; expr = ''; }
      if (/^\d$/.test(k)) {
        if (fresh) { cur = k; fresh = false; } else if (cur.replace(/[-.]/g, '').length < 14) cur = cur === '0' ? k : cur + k;
      } else if (k === '.') {
        if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.';
      } else if (k in SYM) {
        if (op && !fresh) cur = evaluate(prev, parseFloat(cur), op);
        prev = parseFloat(cur); op = k; fresh = true;
        expr = fmt(cur) + ' ' + SYM[k];
      } else if (k === '=') {
        if (op == null) return show();
        const b = parseFloat(cur);
        expr = fmt(String(prev)) + ' ' + SYM[op] + ' ' + fmt(cur) + ' =';
        cur = evaluate(prev, b, op);
        op = null; prev = null; fresh = true;
        bus.emit('calc:result', { value: cur });
      } else if (k === 'C') { cur = '0'; prev = null; op = null; fresh = true; expr = ''; }
      else if (k === 'CE') { cur = '0'; fresh = true; }
      else if (k === '⌫') { if (!fresh) { cur = cur.length > 1 && !(cur.length === 2 && cur[0] === '-') ? cur.slice(0, -1) : '0'; } }
      else if (k === '±') { if (cur !== '0') cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur; }
      else if (k === '%') {
        const expression = fmt(cur) + '%' + (prev == null ? '' : ' × ' + fmt(String(prev)));
        cur = norm(prev != null ? (prev * parseFloat(cur)) / 100 : parseFloat(cur) / 100);
        VOS.xray.compute(expression, fmt(cur));
        fresh = true;
      }
      show();
    }

    const keys = [
      ['C', 'fn'], ['CE', 'fn'], ['⌫', 'fn'], ['/', 'op'],
      ['7'], ['8'], ['9'], ['*', 'op'],
      ['4'], ['5'], ['6'], ['-', 'op'],
      ['1'], ['2'], ['3'], ['+', 'op'],
      ['±', 'fn'], ['0'], ['.'], ['=', 'eq'],
    ];
    const pad = el('div.calc-pad');
    keys.forEach(([k, cls]) => pad.append(el('button.calc-key' + (cls ? '.' + cls : ''), { type: 'button', dataset: { k }, 'aria-label': k }, k === '⌫' ? VOS.icon('backspace') : SYM[k] || (k === '.' ? ',' : k))));
    pad.addEventListener('click', (e) => { const b = e.target.closest('.calc-key'); if (b) { press(b.dataset.k); VOS.sound.play('click'); } });
    const root = el('div.app-calc', { tabindex: '0' }, el('div.calc-screen', exprEl, out), pad);
    root.addEventListener('keydown', (e) => {
      const map = { Enter: '=', '=': '=', Escape: 'C', Backspace: '⌫', Delete: 'CE', ',': '.', x: '*', X: '*', ':': '/' };
      const k = map[e.key] || e.key;
      if (/^[\d.+\-*/%=]$/.test(k) || ['C', 'CE', '⌫'].includes(k)) {
        e.preventDefault();
        if (k === 'C' && e.key === 'Escape' && cur === '0' && !expr) return;
        press(k);
        const b = pad.querySelector('[data-k="' + CSS.escape(k) + '"]');
        if (b) { b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 100); }
      }
    });
    const win = VOS.wm.open({ app: 'calculator', title: tr('Калькулятор'), icon: 'calculator', content: root, width: 320, height: 470, minWidth: 260, minHeight: 380 });
    setTimeout(() => root.focus(), 50);
    return win;
  }

  VOS.apps.register({ id: 'calculator', name: 'Калькулятор', icon: 'calculator', color: '#495057', category: 'think', desc: tr('Додавай, віднімай, множ і діли'), launch });
})();
