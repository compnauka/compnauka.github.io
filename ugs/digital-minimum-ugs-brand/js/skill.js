(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id') || document.body.dataset.skillId) || 1;
  const skill = AppData.skills.find(s => s.id === id) || AppData.skills[0];
  const lesson = window.DeviceLessons?.[id] || window.InfoLessons?.[id] || window.OnlineLessons?.[id] || window.AlgoLessons?.[id];
  const category = AppData.categories.find(c => c.id === skill.category);
  const stepper = document.getElementById('stepper');
  const stage = document.getElementById('lessonStage');
  const speakButton = document.getElementById('speakPage');
  let step = 0;

  document.title = `${skill.title} — Цифрові суперсили`;
  document.getElementById('skillTopTitle').textContent = category?.label || 'Завдання';
  document.getElementById('skillTitle').textContent = skill.title;
  document.getElementById('skillIcon').innerHTML = AppIcons.svg(skill.icon);
  document.getElementById('skillCategory').textContent = category?.label || '';

  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  function speak(text) {
    if (!speechSupported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
    utterance.lang = 'uk-UA';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  function listenButton(text) {
    if (!speechSupported) return '';
    return `<button class="listen-button" type="button" data-speak="${encodeURIComponent(text)}" aria-label="Прослухати пояснення">${AppIcons.svg('speaker')}<span>Прослухати</span></button>`;
  }

  function bindListenButtons(scope = document) {
    scope.querySelectorAll('[data-speak]').forEach(button => {
      if (button.dataset.speakBound === '1') return;
      button.dataset.speakBound = '1';
      button.addEventListener('click', () => speak(decodeURIComponent(button.dataset.speak || '')));
    });
  }

  if (!speechSupported && speakButton) speakButton.hidden = true;
  speakButton?.addEventListener('click', () => speak(stage?.innerText || `${skill.title}. ${skill.goal}`));

  function renderStepper() {
    stepper.innerHTML = AppData.steps.map((name, i) => `
      <span class="step-chip ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}" ${i === step ? 'aria-current="step"' : ''}>
        <span class="step-number" aria-hidden="true">${i < step ? '✓' : i + 1}</span>
        <span>${name}</span>
      </span>`).join('');
  }

  function focusHeading() {
    requestAnimationFrame(() => {
      const heading = stage.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }

  function goTo(nextStep) {
    step = Math.max(0, Math.min(4, nextStep));
    render();
  }

  function markStarted() {
    if (ProgressStore.get(skill.id) === 'new') ProgressStore.set(skill.id, 'training');
  }

  function componentContext({ allowBack = true } = {}) {
    return {
      allowBack,
      listenButton,
      bindListenButtons,
      focusHeading,
      onBack: () => goTo(step - 1),
      onComplete: () => goTo(step + 1)
    };
  }

  function statusFromScore(points, max) {
    const ratio = max > 0 ? points / max : 0;
    if (ratio >= 0.75) return 'mastered';
    if (ratio >= 0.5) return 'almost';
    return 'training';
  }

  function statusCopy(status) {
    const copy = {
      mastered: { label: 'Вмію', title: 'Супер! У тебе вийшло', text: 'Можеш іти далі.', icon: 'check' },
      almost: { label: 'Майже!', title: 'Ти вже близько', text: 'Спробуй ще раз.', icon: 'info' },
      training: { label: 'Тренуюсь', title: 'Ще трохи практики', text: 'Повернись до вправи й спробуй ще.', icon: 'repeat' }
    };
    return copy[status] || copy.training;
  }

  function themeCompleteMessage() {
    if (lesson?.themeComplete) return lesson.themeComplete;
    if (id === 3) return 'Супер! Ти пройшов тему про пристрої.';
    return '';
  }

  function renderAssessmentResult(result) {
    const status = statusFromScore(result.points, result.max);
    ProgressStore.set(skill.id, status);
    const copy = statusCopy(status);
    const nextSkill = id < 16 ? AppData.skills.find(s => s.id === id + 1) : null;
    const themeMessage = themeCompleteMessage();

    stage.innerHTML = `
      <div class="lesson-content stage-box result-stage">
        <div class="result-mark status-${status}" aria-hidden="true">${AppIcons.svg(copy.icon)}</div>
        <span class="status-badge ${status}">${copy.label}</span>
        <h2>${copy.title}</h2>
        <p>${copy.text}</p>
        <div class="stage-actions">
          ${status !== 'mastered' ? '<button class="secondary-btn" type="button" data-repeat-practice>Ще раз</button>' : ''}
          ${nextSkill ? `<a class="primary-btn" href="skill.html?id=${nextSkill.id}">Далі</a>` : '<a class="primary-btn" href="index.html">На головну</a>'}
        </div>
        ${themeMessage ? `<div class="theme-complete-note"><strong>Готово!</strong><span>${themeMessage}</span></div>` : ''}
      </div>`;

    stage.querySelector('[data-repeat-practice]')?.addEventListener('click', () => goTo(3));
    focusHeading();
  }

  function mountActivity(config, ctx) {
    if (!config) return;
    const kind = config.kind;
    if (kind === 'quiz') return ComponentRegistry.quizRounds(stage, config, ctx);
    if (kind === 'control' || kind === 'controlLab' || kind === 'controlAssessment') return ComponentRegistry.controlLab(stage, config, ctx);
    if (kind === 'keyboard') return ComponentRegistry.virtualKeyboard(stage, config, ctx);
    if (kind === 'media') return ComponentRegistry.mediaLab(stage, config, ctx);
    if (kind === 'sort') return ComponentRegistry.sort(stage, config, ctx);
    if (kind === 'sequence') return ComponentRegistry.sequence(stage, config, ctx);
    if (kind === 'saveFind') return ComponentRegistry.saveFind(stage, config, ctx);
    if (kind === 'browserSim') return ComponentRegistry.browserSim(stage, config, ctx);
    if (kind === 'searchSim') return ComponentRegistry.searchSim(stage, config, ctx);
    if (kind === 'safetyScenario') return ComponentRegistry.safetyScenarios(stage, config, ctx);
    if (kind === 'passwordGame') return ComponentRegistry.passwordGame(stage, config, ctx);
    if (kind === 'commandLab') return ComponentRegistry.commandLab(stage, config, ctx);
    if (kind === 'routeRunner') return ComponentRegistry.routeRunner(stage, config, ctx);
    if (kind === 'grid-runner') return ComponentRegistry['grid-runner'](stage, config, ctx);
    if (kind === 'debugRunner') return ComponentRegistry.debugRunner(stage, config, ctx);
    if (kind === 'repeatRunner') return ComponentRegistry.repeatRunner(stage, config, ctx);
  }

  function mountAssessment(config) {
    const ctx = componentContext({ allowBack: true });
    ctx.onComplete = renderAssessmentResult;
    mountActivity({ ...config, assessment: true, finishLabel: 'Готово' }, ctx);
  }

  function renderFallback() {
    stage.innerHTML = `
      <div class="stage-box placeholder-stage">
        <div class="stage-icon" aria-hidden="true">${AppIcons.svg(skill.icon)}</div>
        <span class="eyebrow">Скоро</span>
        <h2>Це завдання ще готується</h2>
        <p>Обери інше завдання.</p>
        <div class="stage-actions"><a class="primary-btn" href="index.html">На головну</a></div>
      </div>`;
    focusHeading();
  }

  function render() {
    renderStepper();
    if (!lesson) {
      renderFallback();
      return;
    }

    if (step === 0) {
      ComponentRegistry.storyboard(stage, lesson.watch, { ...componentContext({ allowBack: false }), onComplete: () => goTo(1) });
    }

    if (step === 1) {
      ComponentRegistry.memoryCards(stage, {
        cards: lesson.remember,
        title: lesson.rememberTitle || 'Головне'
      }, componentContext());
    }

    if (step === 2) {
      markStarted();
      mountActivity(lesson.try, componentContext());
    }

    if (step === 3) {
      mountActivity(lesson.practice, componentContext());
    }

    if (step === 4) mountAssessment(lesson.assessment);

    bindListenButtons(stage);
    focusHeading();
  }

  render();
})();
