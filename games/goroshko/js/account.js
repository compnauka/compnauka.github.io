import { authManager } from './auth.js';
import { storage } from './storage.js';
import { initHeader } from './header.js';

const loadingSection = document.getElementById('accountLoading');
const contentSection = document.getElementById('accountContent');
const emptySection = document.getElementById('accountEmpty');
const summaryLevels = document.getElementById('summaryLevels');
const summaryGold = document.getElementById('summaryGold');
const summarySilver = document.getElementById('summarySilver');
const summaryBronze = document.getElementById('summaryBronze');
const summaryMaxLevel = document.getElementById('summaryMaxLevel');
const summaryAttempts = document.getElementById('summaryAttempts');
const levelsList = document.getElementById('levelsList');

authManager.init();
initHeader();

function showLoading() {
  loadingSection?.classList.remove('hidden');
  contentSection?.classList.add('hidden');
  emptySection?.classList.add('hidden');
}

function showEmpty() {
  loadingSection?.classList.add('hidden');
  contentSection?.classList.add('hidden');
  emptySection?.classList.remove('hidden');
}

function showContent() {
  loadingSection?.classList.add('hidden');
  emptySection?.classList.add('hidden');
  contentSection?.classList.remove('hidden');
}

authManager.onAuthChange(async (user) => {
  if (!user) {
    showEmpty();
    return;
  }

  showLoading();
  try {
    const stats = await storage.getStats();
    updateSummary(stats);

    const progress = await storage.loadProgress();
    renderLevels(progress.levels || {});

    showContent();
  } catch (error) {
    console.error('Не вдалося завантажити акаунт:', error);
    showEmpty();
  }
});

function updateSummary(stats) {
  if (summaryLevels) summaryLevels.textContent = stats.totalCompleted ?? 0;
  if (summaryGold) summaryGold.textContent = stats.goldMedals ?? 0;
  if (summarySilver) summarySilver.textContent = stats.silverMedals ?? 0;
  if (summaryBronze) summaryBronze.textContent = stats.bronzeMedals ?? 0;
  if (summaryMaxLevel) summaryMaxLevel.textContent = stats.maxLevel ?? 1;
  if (summaryAttempts) summaryAttempts.textContent = stats.totalAttempts ?? 0;
}

function renderLevels(levelsMap) {
  if (!levelsList) return;
  levelsList.innerHTML = '';

  const entries = Object.keys(levelsMap)
    .map((key) => ({ levelIndex: Number(key), ...levelsMap[key] }))
    .sort((a, b) => a.levelIndex - b.levelIndex);

  if (entries.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.className = 'panel-hint';
    placeholder.textContent = 'Ще немає збережених проходжень. Завітай у гру та здобувай медалі!';
    levelsList.appendChild(placeholder);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'account-level-card';

    const medalEmoji = medalToEmoji(entry.medal);
    const attempts = entry.attempts ?? 0;
    const blocks = entry.blocks ?? '—';

    card.innerHTML = `
      <div class="account-level-card__header">
        <span class="account-level-card__index">Рівень ${entry.levelIndex + 1}</span>
        <span class="account-level-card__medal">${medalEmoji}</span>
      </div>
      <div class="account-level-card__stats">
        <div>
          <p class="account-level-card__label">Блоків використано</p>
          <p class="account-level-card__value">${blocks}</p>
        </div>
        <div>
          <p class="account-level-card__label">Спроб</p>
          <p class="account-level-card__value">${attempts}</p>
        </div>
      </div>
    `;

    levelsList.appendChild(card);
  });
}

function medalToEmoji(medal) {
  if (medal === 'gold') return '🥇';
  if (medal === 'silver') return '🥈';
  if (medal === 'bronze') return '🥉';
  return '🔄';
}
