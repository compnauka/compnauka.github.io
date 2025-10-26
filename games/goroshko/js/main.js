/**
 * Точка входу в додаток
 * Ініціалізує гру, авторизацію та всі компоненти
 */

import { Game } from './game.js';
import { soundEngine } from './sound.js';
import { authManager } from './auth.js';
import { storage } from './storage.js'; // Імпортуємо storage

/**
 * Головна функція ініціалізації
 */
async function init() {
  // Ініціалізація авторизації
  authManager.init();

  // Збір всіх DOM-елементів
  const elements = {
    // Сітка
    grid: document.getElementById('grid'),

    // Команди
    commandList: document.getElementById('commandList'),
    btnUp: document.getElementById('btnUp'),
    btnDown: document.getElementById('btnDown'),
    btnLeft: document.getElementById('btnLeft'),
    btnRight: document.getElementById('btnRight'),
    btnLoop: document.getElementById('btnLoop'),
    btnRoot: document.getElementById('btnRoot'),
    btnRun: document.getElementById('btnRun'),
    btnClear: document.getElementById('btnClear'),

    // Інформація про рівень
    levelNum: document.getElementById('levelNum'),
    levelDesc: document.getElementById('levelDesc'),
    damage: document.getElementById('damage'),
    armor: document.getElementById('armor'),
    health: document.getElementById('health'),
    parGold: document.getElementById('parGold'),

    // Бій
    battleScene: document.getElementById('battleScene'),
    battleLog: document.getElementById('battleLog'),
    heroHealthBar: document.getElementById('heroHealthBar'),
    monsterHealthBar: document.getElementById('monsterHealthBar'),
    heroHealthText: document.getElementById('heroHealthText'),
    monsterHealthText: document.getElementById('monsterHealthText'),
    monsterIcon: document.getElementById('monsterIcon'),
    monsterName: document.getElementById('monsterName'),

    // UI
    message: document.getElementById('message'),
    tutorialModal: document.getElementById('tutorialModal'),
    tutorialBackdrop: document.getElementById('tutorialModalBackdrop'),
    tutorialCloseBtn: document.getElementById('tutorialCloseBtn'),
    victoryModal: document.getElementById('victoryModal'),
    victoryBackdrop: document.getElementById('victoryModalBackdrop'),
    victoryBlockCount: document.getElementById('victoryBlockCount'),
    victoryMedal: document.getElementById('victoryMedal'),
    victoryNextBtn: document.getElementById('victoryNextBtn'),

    // Налаштування
    soundToggle: document.getElementById('soundToggle'),
    soundIcon: document.getElementById('soundIcon'),
    fullscreenToggle: document.getElementById('fullscreenToggle'),
    fullscreenIcon: document.getElementById('fullscreenIcon'),

    // Профіль користувача (нові елементи)
    userProfile: document.getElementById('userProfile'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn')
  };

  // Створення екземпляру гри
  const game = new Game();
  await game.init(elements); // Змінено: додано await для асинхронної ініціалізації

  // Обробка змін авторизації
  authManager.onAuthChange((user) => {
    updateUserUI(user, elements);
  });

  // Розблокування звуку при першій взаємодії
  soundEngine.unlock();

  // Додаємо обробники для профілю
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', () => {
      window.location.href = 'auth.html';
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', async () => {
      const result = await authManager.logout();
      if (result.success) {
        window.location.reload();
      }
    });
  }

  // Глобальний доступ для відлагодження
  if (typeof window !== 'undefined') {
    window.game = game;
    window.auth = authManager;
    console.log('🎮 Гра ініціалізована! Використовуй window.game для відлагодження.');
  }
}

/**
 * Оновлення UI профілю користувача
 * @param {Object} user - Firebase User або null
 * @param {Object} elements - DOM елементи
 */
function updateUserUI(user, elements) {
  if (!elements.userProfile) return;

  // Спочатку видаляємо старе повідомлення для гостя, якщо воно є
  const existingGuestMsg = document.getElementById('guestMessage');
  if (existingGuestMsg) {
    existingGuestMsg.remove();
  }

  if (user) {
    // Користувач авторизований
    if (elements.userAvatar) {
      elements.userAvatar.textContent = user.isAnonymous ? '👤' : '👨‍💻';
    }
    
    if (elements.userName) {
      elements.userName.textContent = authManager.getUserDisplayName();
    }

    if (elements.loginBtn) {
      elements.loginBtn.classList.add('hidden');
    }

    if (elements.logoutBtn && !user.isAnonymous) {
      elements.logoutBtn.classList.remove('hidden');
    } else if (elements.logoutBtn) {
      elements.logoutBtn.classList.add('hidden');
    }

    elements.userProfile.classList.remove('hidden');
    
    // Змінено: Додаємо повідомлення, якщо користувач - гість
    if (user.isAnonymous) {
      const guestMsg = document.createElement('p');
      guestMsg.id = 'guestMessage';
      guestMsg.className = 'text-xs text-center text-orange-600 font-bold mt-2';
      guestMsg.textContent = 'Прогрес зберігається лише на цьому пристрої.';
      // Додаємо повідомлення після батьківського контейнера профілю, щоб не порушувати flex-верстку
      elements.userProfile.parentElement.appendChild(guestMsg);
    }

  } else {
    // Користувач не авторизований
    if (elements.loginBtn) {
      elements.loginBtn.classList.remove('hidden');
    }

    if (elements.logoutBtn) {
      elements.logoutBtn.classList.add('hidden');
    }

    if (elements.userProfile) {
      elements.userProfile.classList.add('hidden');
    }
  }
}

// Запуск після завантаження DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
