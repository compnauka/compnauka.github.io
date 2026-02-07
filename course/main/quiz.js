export function checkAnswer({ lessonId, ctx, chosenIndex }) {
  if (ctx.state.activeLessonId !== lessonId) return;

  const content = ctx.state.currentLessonContent;
  if (!content?.quiz) return;

  const optionsWrap = document.getElementById('quizOptions');
  const feedback = document.getElementById('quizFeedback');
  if (!optionsWrap || !feedback) return;

  const buttons = Array.from(optionsWrap.querySelectorAll('button[role="radio"]'));
  const correctIndex = content.quiz.correct;

  const chosenBtn = buttons[chosenIndex];
  if (!chosenBtn) return;

  // ARIA checked
  buttons.forEach((b, i) => b.setAttribute('aria-checked', String(i === chosenIndex)));

  // reset styles
  for (const btn of buttons) {
    btn.classList.remove(
      'ring-2','ring-green-500','ring-red-500',
      'bg-green-50','bg-red-50','border-green-500','border-red-500',
      'dark:bg-green-900/30','dark:bg-red-900/30'
    );
    btn.classList.remove('opacity-60','cursor-not-allowed');

    const badge = btn.querySelector('span');
    badge?.classList.remove('bg-green-500','bg-red-500','text-white','border-green-500','border-red-500');
  }

  const mark = (btn, kind) => {
    const badge = btn.querySelector('span');
    if (!badge) return;

    if (kind === 'correct') {
      btn.classList.add('ring-2','ring-green-500','bg-green-50','dark:bg-green-900/30','border-green-500');
      badge.classList.add('bg-green-500','text-white','border-green-500');
    } else {
      btn.classList.add('ring-2','ring-red-500','bg-red-50','dark:bg-red-900/30','border-red-500');
      badge.classList.add('bg-red-500','text-white','border-red-500');
    }
  };

  feedback.classList.remove('hidden');

  const setFeedback = (ok) => {
    feedback.textContent = '';
    if (ok) {
      feedback.className = "mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20";
      feedback.insertAdjacentHTML('beforeend', '<i class="fa-regular fa-face-smile text-2xl mb-2 block" aria-hidden="true"></i>');
      feedback.appendChild(document.createTextNode(' Правильно! Ти супер!'));
    } else {
      feedback.className = "mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20";
      feedback.insertAdjacentHTML('beforeend', '<i class="fa-regular fa-face-frown text-2xl mb-2 block" aria-hidden="true"></i>');
      feedback.appendChild(document.createTextNode(' Спробуй ще раз.'));
    }
  };

  if (chosenIndex === correctIndex) {
    // disable all
    for (const btn of buttons) {
      btn.disabled = true;
      btn.classList.add('opacity-60','cursor-not-allowed');
    }
    chosenBtn.classList.remove('opacity-60','cursor-not-allowed');
    mark(chosenBtn, 'correct');
    setFeedback(true);

    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    if (!ctx.state.completedLessons.includes(lessonId)) {
      ctx.state.completedLessons.push(lessonId);
      localStorage.setItem('cs_completed', JSON.stringify(ctx.state.completedLessons));
    }
  } else {
    chosenBtn.disabled = true;
    chosenBtn.classList.add('opacity-60','cursor-not-allowed');
    mark(chosenBtn, 'wrong');
    setFeedback(false);
  }
}
