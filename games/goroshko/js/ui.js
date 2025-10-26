/**
 * Модуль управління інтерфейсом користувача
 * Відповідає за модальні вікна, повідомлення та UI-елементи
 */

/**
 * Клас UIManager
 * Керує всіма елементами інтерфейсу
 */
export class UIManager {
    constructor() {
      this.elements = {};
      this.tutorialShown = false;
    }
  
    /**
     * Ініціалізація UI-менеджера
     * @param {Object} elements - Об'єкт з DOM-елементами
     */
    init(elements) {
      this.elements = elements;
    }
  
    /**
     * Оновлення інформації про рівень
     * @param {Object} data - Дані {levelNum, desc, damage, armor, health, parGold}
     */
    updateLevelInfo(data) {
      if (this.elements.levelNum) {
        this.elements.levelNum.textContent = data.levelNum;
      }
      if (this.elements.levelDesc) {
        this.elements.levelDesc.textContent = data.desc;
      }
      if (this.elements.damage) {
        this.elements.damage.textContent = data.damage;
      }
      if (this.elements.armor) {
        this.elements.armor.textContent = data.armor;
      }
      if (this.elements.health) {
        this.elements.health.textContent = data.health;
      }
      if (this.elements.parGold) {
        this.elements.parGold.textContent = data.parGold;
      }
    }
  
    /**
     * Показ повідомлення
     * @param {string} text - Текст повідомлення
     * @param {string} type - Тип ('success', 'error', 'info')
     */
    showMessage(text, type = 'info') {
      if (!this.elements.message) return;
  
      const colors = {
        success: 'bg-green-100 text-green-800 border-2 border-green-300',
        error: 'bg-red-100 text-red-800 border-2 border-red-300',
        info: 'bg-blue-100 text-blue-800 border-2 border-blue-300'
      };
  
      this.elements.message.className = `message text-center p-2.5 rounded-lg mt-3 md:mt-6 text-sm md:text-lg font-bold ${colors[type] || colors.info}`;
      this.elements.message.textContent = text;
      this.elements.message.classList.remove('hidden');
  
      // Автоматичне приховування через 3 секунди
      setTimeout(() => this.hideMessage(), 3000);
    }
  
    /**
     * Приховування повідомлення
     */
    hideMessage() {
      if (this.elements.message) {
        this.elements.message.classList.add('hidden');
      }
    }
  
    /**
     * Показ туторіалу про цикли
     */
    showTutorial() {
      if (this.tutorialShown) return;
      
      if (this.elements.tutorialModal && this.elements.tutorialBackdrop) {
        this.elements.tutorialModal.classList.remove('hidden');
        this.elements.tutorialBackdrop.classList.remove('hidden');
        this.tutorialShown = true;
      }
    }
  
    /**
     * Приховування туторіалу
     */
    hideTutorial() {
      if (this.elements.tutorialModal && this.elements.tutorialBackdrop) {
        this.elements.tutorialModal.classList.add('hidden');
        this.elements.tutorialBackdrop.classList.add('hidden');
      }
    }
  
    /**
     * Показ модального вікна перемоги
     * @param {Object} data - Дані {blocks, medal, parGold, parSilver}
     */
    showVictoryModal(data) {
      if (!this.elements.victoryModal || !this.elements.victoryBackdrop) return;
  
      // Оновлення даних
      if (this.elements.victoryBlockCount) {
        this.elements.victoryBlockCount.textContent = data.blocks;
      }
  
      if (this.elements.victoryMedal) {
        const medals = {
          gold: '🥇 Золота медаль! Ідеально!',
          silver: '🥈 Срібна медаль! Чудово!',
          bronze: '🥉 Бронзова медаль! Добре!'
        };
        this.elements.victoryMedal.textContent = medals[data.medal] || '✅ Рівень пройдено!';
      }
  
      // Показ модального вікна
      this.elements.victoryModal.classList.remove('hidden');
      this.elements.victoryBackdrop.classList.remove('hidden');
    }
  
    /**
     * Приховування модального вікна перемоги
     */
    hideVictoryModal() {
      if (this.elements.victoryModal && this.elements.victoryBackdrop) {
        this.elements.victoryModal.classList.add('hidden');
        this.elements.victoryBackdrop.classList.add('hidden');
      }
    }
  
    /**
     * Увімкнення/вимкнення кнопок керування
     * @param {boolean} enabled - Стан кнопок
     */
    setControlsEnabled(enabled) {
      const buttons = [
        this.elements.btnRun,
        this.elements.btnClear,
        ...document.querySelectorAll('.cmd-btn')
      ].filter(Boolean);
  
      buttons.forEach(btn => {
        btn.disabled = !enabled;
      });
    }
  
    /**
     * Показ кнопок залежно від рівня
     * @param {number} level - Номер рівня (починаючи з 0)
     */
    updateButtonsVisibility(level) {
      // Рівень 0: тільки права стрілка
      // Рівень 1+: всі стрілки
      // Рівень 4+: цикли
  
      const buttons = {
        up: this.elements.btnUp,
        down: this.elements.btnDown,
        left: this.elements.btnLeft,
        right: this.elements.btnRight,
        loop: this.elements.btnLoop,
        endLoop: this.elements.btnRoot
      };
  
      // Спочатку ховаємо всі
      Object.values(buttons).forEach(btn => {
        if (btn) btn.classList.add('hidden-by-level');
      });
  
      // Показуємо потрібні
      if (level === 0) {
        // Тільки права стрілка
        if (buttons.right) buttons.right.classList.remove('hidden-by-level');
      } else if (level < 4) {
        // Всі стрілки
        if (buttons.up) buttons.up.classList.remove('hidden-by-level');
        if (buttons.down) buttons.down.classList.remove('hidden-by-level');
        if (buttons.left) buttons.left.classList.remove('hidden-by-level');
        if (buttons.right) buttons.right.classList.remove('hidden-by-level');
      } else {
        // Всі кнопки включно з циклами
        Object.values(buttons).forEach(btn => {
          if (btn) btn.classList.remove('hidden-by-level');
        });
      }
    }
  
    /**
     * Перемикання повноекранного режиму
     */
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
        if (this.elements.fullscreenIcon) {
          this.elements.fullscreenIcon.classList.remove('fa-expand');
          this.elements.fullscreenIcon.classList.add('fa-compress');
        }
      } else {
        document.exitFullscreen();
        if (this.elements.fullscreenIcon) {
          this.elements.fullscreenIcon.classList.remove('fa-compress');
          this.elements.fullscreenIcon.classList.add('fa-expand');
        }
      }
    }
  
    /**
     * Перемикання звуку
     * @param {boolean} enabled - Стан звуку
     */
    updateSoundIcon(enabled) {
      if (!this.elements.soundIcon || !this.elements.soundToggle) return;
  
      if (enabled) {
        this.elements.soundIcon.classList.remove('fa-volume-mute');
        this.elements.soundIcon.classList.add('fa-volume-up');
        this.elements.soundToggle.setAttribute('aria-pressed', 'true');
      } else {
        this.elements.soundIcon.classList.remove('fa-volume-up');
        this.elements.soundIcon.classList.add('fa-volume-mute');
        this.elements.soundToggle.setAttribute('aria-pressed', 'false');
      }
    }
  
    /**
     * Анімація кнопки
     * @param {HTMLElement} button - Елемент кнопки
     */
    animateButton(button) {
      if (!button) return;
      
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 100);
    }
  }
  