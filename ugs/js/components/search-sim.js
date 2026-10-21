window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.searchSim = (root, config, ctx) => {
  const rounds = (config.rounds || []).map(r => ({ ...r, options: LessonUI.shuffle(r.options), results: LessonUI.shuffle(r.results || []) }));
  let index = 0, points = 0;
  function render() {
    const round = rounds[index];
    if (!round) return ctx.onComplete?.({ points, max: rounds.length * 2 });
    let mistakes = 0, queryChosen = false, done = false;
    root.innerHTML = `<div class="lesson-content stage-box" data-component="search-sim">
      <div class="stage-heading centered-heading"><div><span class="eyebrow">ПОШУК</span><div class="task-progress">${index + 1} / ${rounds.length}</div><h2>${round.task}</h2></div>${ctx.listenButton?.(round.task) || ''}</div>
      <div class="search-sim"><p data-query-prompt>Обери слова для пошуку.</p><div class="search-options" role="group" aria-label="Слова для пошуку">${round.options.map((o,i)=>`<button class="search-option" type="button" data-query="${i}">${LessonUI.escape(o.text)}</button>`).join('')}</div><p class="chosen-query" data-chosen-query hidden></p>
      <section data-results hidden><h3>2. Який результат потрібен?</h3><div class="result-list">${round.results.map((r,i)=>`<button class="search-result-card" type="button" data-result="${i}"><strong>${LessonUI.escape(r.title)}</strong><span>${LessonUI.escape(r.text)}</span></button>`).join('')}</div></section></div>
      <p class="feedback" data-feedback role="status" aria-live="polite"></p><div class="stage-actions">${ctx.allowBack ? '<button class="secondary-btn" type="button" data-back>Назад</button>' : ''}</div></div>`;
    const feedback = root.querySelector('[data-feedback]');
    root.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
      if (queryChosen) return;
      if (!round.options[Number(button.dataset.query)].correct) { mistakes++; feedback.textContent='Подумай, що саме треба знайти. Додай точні слова.'; return; }
      queryChosen = true;
      root.querySelectorAll('[data-query]').forEach(b=>b.disabled=true);
      button.classList.add('correct');
      root.querySelector('.search-options').hidden = true;
      root.querySelector('[data-query-prompt]').hidden = true;
      const chosenQuery = root.querySelector('[data-chosen-query]');
      chosenQuery.textContent = 'Шукаємо: ' + round.options[Number(button.dataset.query)].text;
      chosenQuery.hidden = false;
      root.querySelector('[data-results]').hidden=false;
      feedback.textContent='Запит обрано. Тепер порівняй результати із завданням.';
      root.querySelector('[data-result]')?.focus({preventScroll:true});
    }));
    root.querySelectorAll('[data-result]').forEach(button=>button.addEventListener('click',()=>{
      if (!queryChosen || done) return;
      if (!round.results[Number(button.dataset.result)].correct) { mistakes++; feedback.textContent='Це інший матеріал. Ще раз прочитай, що треба знайти.'; return; }
      done=true;
      points+=mistakes===0?2:1;
      button.classList.add('correct');
      root.querySelectorAll('[data-result]').forEach(b=>b.disabled=true);
      feedback.textContent='Так! Цей результат відповідає завданню.';
      LessonUI.nextButton(root,()=>{index++;render();ctx.focusHeading?.();});
    }));
    root.querySelector('[data-back]')?.addEventListener('click',ctx.onBack);
    ctx.bindListenButtons?.(root);
  }
  render();
};
