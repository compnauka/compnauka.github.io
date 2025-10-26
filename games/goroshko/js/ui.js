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
     * Оновлення блоку досягнень
     * @param {Object} stats - Статистика прогресу
     */
    updateAchievements(stats = {}) {
      const mapping = [
        ['achCompleted', 'totalCompleted'],
        ['achAttempts', 'totalAttempts'],
        ['achGold', 'goldMedals'],
        ['achSilver', 'silverMedals'],
        ['achBronze', 'bronzeMedals']
      ];

      let hasData = false;

      mapping.forEach(([elementKey, statKey]) => {
        const el = this.elements[elementKey];
        if (!el) return;

        const value = stats?.[statKey];
        if (typeof value === 'number' && Number.isFinite(value)) {
          el.textContent = value;
          hasData = true;
        } else {
          el.textContent = '0';
        }
      });

      if (this.elements.achievementList) {
        this.elements.achievementList.classList.toggle('opacity-60', !hasData);
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
        this.elements.btnClear
      ].filter(Boolean);

      buttons.forEach(btn => {
        btn.disabled = !enabled;
      });

      if (this.elements.commandPalette) {
        this.elements.commandPalette.querySelectorAll('.palette-block').forEach((btn) => {
          btn.disabled = !enabled;
          btn.setAttribute('draggable', enabled ? 'true' : 'false');
        });
      }

      if (this.elements.commandList) {
        this.elements.commandList.classList.toggle('workspace-disabled', !enabled);
      }
    }

    /**
     * Показ кнопок залежно від рівня
     * @param {number} level - Номер рівня (починаючи з 0)
     */
    updateButtonsVisibility(level) {
      if (!this.elements.commandPalette) return;

      const buttons = this.elements.commandPalette.querySelectorAll('[data-visible-from]');
      buttons.forEach((btn) => {
        const fromLevel = Number(btn.dataset.visibleFrom || '0');
        if (level >= fromLevel) {
          btn.classList.remove('hidden-by-level');
        } else {
          btn.classList.add('hidden-by-level');
        }
      });
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
  