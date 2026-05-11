// ── Activity: Класифікатор тварин ──────────────────────────────────────────
// Дитина класифікує emoji-картки як "тварина / не тварина".
// Після всіх карток — пояснення про розмітку даних.

function buildCard(card, options, onClassified) {
  const el = document.createElement('div');
  el.className = 'ac-card';

  const emoji = document.createElement('div');
  emoji.className = 'ac-card__emoji';
  emoji.textContent = card.emoji;
  emoji.setAttribute('aria-hidden', 'true');

  const label = document.createElement('div');
  label.className = 'ac-card__label';
  label.textContent = card.label;

  const btns = document.createElement('div');
  btns.className = 'ac-card__btns';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'ac-card__btn';
    btn.textContent = opt.label;
    btn.setAttribute('aria-label', `${card.label}: ${opt.label}`);

    btn.addEventListener('click', () => {
      if (el.classList.contains('ac-card--done')) return;

      const correct = opt.value === card.correct;
      el.classList.add('ac-card--done', correct ? 'ac-card--correct' : 'ac-card--wrong');
      btns.querySelectorAll('button').forEach(b => { b.disabled = true; });

      const badge = document.createElement('div');
      badge.className = 'ac-card__badge';
      badge.textContent = correct ? '✓' : '✗';
      badge.setAttribute('aria-label', correct ? 'Правильно' : 'Неправильно');
      el.appendChild(badge);

      onClassified(correct);
    }, { once: true });

    btns.appendChild(btn);
  });

  el.appendChild(emoji);
  el.appendChild(label);
  el.appendChild(btns);
  return el;
}

function buildCompletion(correct, total, message) {
  const el = document.createElement('div');
  el.className = 'ac-completion fade-in';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  const score = document.createElement('div');
  score.className = 'ac-completion__score';

  const num = document.createElement('span');
  num.className = 'ac-completion__num';
  num.textContent = `${correct}/${total}`;
  score.appendChild(num);

  const lbl = document.createElement('span');
  lbl.className = 'ac-completion__lbl';
  lbl.textContent = ' правильно';
  score.appendChild(lbl);

  const msg = document.createElement('p');
  msg.className = 'ac-completion__msg';
  msg.textContent = message;

  el.appendChild(score);
  el.appendChild(msg);
  return el;
}

// ── Публічне API ────────────────────────────────────────────────────────────

export function buildClassifierActivity(data) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ac-wrap fade-in-up';

  // Заголовок
  const header = document.createElement('div');
  header.className = 'ac-header';

  const title = document.createElement('h3');
  title.className = 'ac-title';
  title.textContent = data.title;
  header.appendChild(title);

  const instruction = document.createElement('p');
  instruction.className = 'ac-instruction';
  instruction.textContent = data.instruction;
  header.appendChild(instruction);
  wrapper.appendChild(header);

  // Прогрес
  const progressRow = document.createElement('div');
  progressRow.className = 'ac-progress';

  const bar = document.createElement('div');
  bar.className = 'ac-progress__bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', String(data.cards.length));
  bar.setAttribute('aria-valuenow', '0');
  bar.setAttribute('aria-label', 'Прогрес класифікації');
  const fill = document.createElement('div');
  fill.className = 'ac-progress__fill';
  fill.style.width = '0%';
  bar.appendChild(fill);

  const progressLbl = document.createElement('span');
  progressLbl.className = 'ac-progress__lbl';
  progressLbl.textContent = `0 / ${data.cards.length}`;

  progressRow.appendChild(bar);
  progressRow.appendChild(progressLbl);
  wrapper.appendChild(progressRow);

  // Сітка карток
  const grid = document.createElement('div');
  grid.className = 'ac-grid';

  let classified = 0;
  let correctCount = 0;

  data.cards.forEach(card => {
    const cardEl = buildCard(card, data.options, (wasCorrect) => {
      if (wasCorrect) correctCount++;
      classified++;

      const pct = Math.round((classified / data.cards.length) * 100);
      fill.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(classified));
      progressLbl.textContent = `${classified} / ${data.cards.length}`;

      if (classified === data.cards.length) {
        const comp = buildCompletion(correctCount, data.cards.length, data.completionMessage);
        wrapper.appendChild(comp);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        comp.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
    });
    grid.appendChild(cardEl);
  });

  wrapper.appendChild(grid);
  return wrapper;
}
