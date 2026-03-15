export function renderWizardBadge(badgeEl, badgeData) {
  if (!badgeEl) return;
  if (badgeData) {
    badgeEl.textContent = badgeData.text;
    badgeEl.className = badgeData.className;
    badgeEl.classList.remove('hidden');
  } else {
    badgeEl.classList.add('hidden');
  }
}

export function showWizardStepUi({ stepIds, currentStep, getElement, liveEl, liveText }) {
  for (const id of stepIds) {
    const el = getElement(id);
    const visible = id === 'step-' + currentStep;
    el.classList.toggle('hidden', !visible);
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }
  if (liveEl) {
    liveEl.textContent = liveText;
  }
}

export function openWizardPanelUi({ panel, mascotEl, mascotToggleEl, focusTarget, activateFocus, measure }) {
  panel.style.transform = 'translateY(0)';
  panel.setAttribute('aria-hidden', 'false');
  activateFocus(panel, focusTarget);
  mascotEl.classList.add('wiz-open');
  mascotToggleEl.style.opacity = '0';
  mascotToggleEl.style.pointerEvents = 'none';
  measure(() => {
    const wh = panel.offsetHeight || 0;
    mascotEl.style.bottom = (wh + 10) + 'px';
    mascotToggleEl.style.bottom = (wh + 10) + 'px';
  });
}

export function closeWizardPanelUi({ panel, mascotEl, mascotToggleEl, deactivateFocus }) {
  panel.style.transform = 'translateY(110%)';
  deactivateFocus(panel);
  mascotEl.classList.remove('wiz-open');
  mascotEl.style.bottom = '18px';
  mascotToggleEl.style.opacity = '';
  mascotToggleEl.style.pointerEvents = '';
  mascotToggleEl.style.bottom = '16px';
}
