window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.choice = function mountChoice(container, config) {
  const options = config.options || [
    { label:'📷 Камера', correct:true },
    { label:'🎧 Навушники', correct:false }
  ];
  container.innerHTML = `
    <div class="stage-box">
      <span class="eyebrow">ОБЕРИ</span>
      <h2>${config.question || 'Що допоможе зробити фотографію?'}</h2>
      <div class="choice-grid">
        ${options.map((o,i)=>`<button class="answer-btn" data-i="${i}">${o.label}</button>`).join('')}
      </div>
      <div class="feedback" aria-live="polite"></div>
    </div>`;
  const feedback = container.querySelector('.feedback');
  container.querySelectorAll('.answer-btn').forEach(btn => btn.addEventListener('click', () => {
    const option = options[Number(btn.dataset.i)];
    if (option.correct) {
      btn.classList.add('correct');
      feedback.textContent = 'Чудово! Це правильна відповідь.';
      if (config.onSuccess) config.onSuccess();
    } else {
      btn.classList.remove('wrong'); void btn.offsetWidth; btn.classList.add('wrong');
      feedback.textContent = 'Спробуй ще раз.';
    }
  }));
};
