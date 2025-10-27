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
      this._messageTimeout = null;
      this._homes = {};
    }

    /**
     * Ініціалізація UI-менеджера
     * @param {Object} elements - Об'єкт з DOM-елементами
     */
    init(elements) {
      this.elements = elements;
      this.elements.mapPanel = elements.mapPanel || document.getElementById('mapPanel');
      this.elements.programPanel = elements.programPanel || document.getElementById('programPanel');
      this.elements.statBoard = elements.statBoard || document.querySelector('.stat-board');
      this.elements.commandList = elements.commandList || document.getElementById('commandList');
      this.elements.defaultCommandList = this.elements.commandList;
      this.elements.workspaceControls = elements.workspaceControls || document.querySelector('.workspace-controls');
      this.elements.workspaceIntro = elements.workspaceIntro || document.querySelector('.workspace-intro');

      this._rememberHome('commandList');
      this._rememberHome('workspaceControls');
      this._rememberHome('workspaceIntro');
      this._rememberHome('message');
    }

    updateUILayout(levelIndex) {
      const mapPanel = this.elements.mapPanel || document.getElementById('mapPanel');
      const programPanel = this.elements.programPanel || document.getElementById('programPanel');
      const mapBody = mapPanel?.querySelector('.interface-panel__body') || null;
      const useInlineWorkspace = levelIndex < 2;
      const body = typeof document !== 'undefined' ? document.body : null;

      if (body) {
        body.classList.toggle('ui-inline-workspace', useInlineWorkspace);
      }

      if (useInlineWorkspace) {
        if (programPanel) {
          programPanel.classList.add('hidden');
        }

        let miniWorkspace = document.getElementById('miniWorkspace');
        if (!miniWorkspace && mapPanel) {
          miniWorkspace = document.createElement('div');
          miniWorkspace.id = 'miniWorkspace';
          miniWorkspace.className = 'mini-workspace';
          miniWorkspace.innerHTML = `
            <div class="mini-workspace__title">Твій план:</div>
            <div class="mini-workspace__intro" data-slot="intro"></div>
            <div class="mini-workspace__commands" data-slot="command-list"></div>
            <div class="mini-workspace__controls" data-slot="controls"></div>
            <div class="mini-workspace__message" data-slot="message"></div>
          `;

          if (mapBody && typeof mapBody.prepend === 'function') {
            mapBody.prepend(miniWorkspace);
          } else if (mapPanel) {
            const header = mapPanel.querySelector('.interface-panel__header');
            if (header && typeof header.after === 'function') {
              header.after(miniWorkspace);
            } else {
              mapPanel.appendChild(miniWorkspace);
            }
          }
        }

        const commandsSlot = miniWorkspace?.querySelector('[data-slot="command-list"]');
        const controlsSlot = miniWorkspace?.querySelector('[data-slot="controls"]');
        const messageSlot = miniWorkspace?.querySelector('[data-slot="message"]');
        const introSlot = miniWorkspace?.querySelector('[data-slot="intro"]');

        this._moveElementTo('workspaceIntro', introSlot);
        this._moveElementTo('commandList', commandsSlot);
        this._moveElementTo('workspaceControls', controlsSlot);
        this._moveElementTo('message', messageSlot);

        if (this.elements.workspaceControls) {
          this.elements.workspaceControls.classList.add('workspace-controls--inline');
        }
      } else {
        if (programPanel) {
          programPanel.classList.remove('hidden');
        }

        if (this.elements.workspaceControls) {
          this.elements.workspaceControls.classList.remove('workspace-controls--inline');
        }

        this._restoreHome('workspaceIntro');
        this._restoreHome('commandList');
        this._restoreHome('workspaceControls');
        this._restoreHome('message');

        const miniWorkspace = document.getElementById('miniWorkspace');
        if (miniWorkspace) {
          miniWorkspace.remove();
        }
      }

      const statBoard = this.elements.statBoard || document.querySelector('.stat-board');
      if (statBoard) {
        if (levelIndex < 5) {
          statBoard.classList.add('stat-board--minimal');
          this.elements.statBoard = statBoard;
          this._ensureMapHealthIndicator();
        } else {
          statBoard.classList.remove('stat-board--minimal');
          this._removeMapHealthIndicator();
        }
      }
    }

    _rememberHome(key) {
      const el = this.elements[key];
      if (!el || this._homes[key]) return;

      this._homes[key] = {
        parent: el.parentElement || null,
        nextSibling: el.nextSibling || null
      };
    }

    _moveElementTo(key, target) {
      const el = this.elements[key];
      if (!el || !target) return;

      this._rememberHome(key);
      if (target.contains(el)) return;
      target.appendChild(el);
    }

    _restoreHome(key) {
      const el = this.elements[key];
      const home = this._homes[key];
      if (!el || !home || !home.parent) return;

      if (home.nextSibling && home.nextSibling.parentNode === home.parent) {
        home.parent.insertBefore(el, home.nextSibling);
      } else {
        home.parent.appendChild(el);
      }
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

      this._updateMapHearts(data.health);

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
    showMessage(text, type = 'info', duration = 3000) {
      this._showBanner(text, type, duration);
    }

    showDialogue(text, type = 'info', duration = 3000) {
      this._showBanner(text, type, duration);
    }

    _showBanner(text, type, duration = 3000) {
      if (!this.elements.message) return;

      const states = {
        success: 'message--success',
        error: 'message--error',
        info: 'message--info'
      };

      this.elements.message.className = `message ${states[type] || states.info}`;
      this.elements.message.textContent = text;
      this.elements.message.classList.remove('hidden');

      if (this._messageTimeout) {
        clearTimeout(this._messageTimeout);
      }

      if (duration !== null) {
        this._messageTimeout = setTimeout(() => this.hideMessage(), duration);
      }
    }

    /**
     * Приховування повідомлення
     */
    hideMessage() {
      if (this._messageTimeout) {
        clearTimeout(this._messageTimeout);
        this._messageTimeout = null;
      }
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
        this.elements.btnStep
      ].filter(Boolean);

      buttons.forEach(btn => {
        btn.disabled = !enabled;
      });

      if (this.elements.commandPalette) {
        this.elements.commandPalette.querySelectorAll('.command-tile').forEach((btn) => {
          btn.disabled = !enabled;
          btn.setAttribute('draggable', enabled ? 'true' : 'false');
        });
      }

      if (this.elements.commandList) {
        this.elements.commandList.classList.toggle('workspace-disabled', !enabled);
      }
    }

    _ensureMapHealthIndicator() {
      const mapPanel = this.elements.mapPanel || document.getElementById('mapPanel');
      if (!mapPanel) return;

      let indicator = this.elements.mapHealthIndicator || document.getElementById('mapHealthIndicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'mapHealthIndicator';
        indicator.className = 'map-health-indicator';
        indicator.setAttribute('aria-hidden', 'true');

        const body = mapPanel.querySelector('.interface-panel__body');
        if (body) {
          body.appendChild(indicator);
        } else {
          mapPanel.appendChild(indicator);
        }
      }

      indicator.classList.remove('hidden');
      this.elements.mapHealthIndicator = indicator;

      const currentHealth = Number(this.elements.health?.textContent || '100');
      this._updateMapHearts(currentHealth);
    }

    _removeMapHealthIndicator() {
      if (this.elements.mapHealthIndicator) {
        this.elements.mapHealthIndicator.remove();
        this.elements.mapHealthIndicator = null;
      }
    }

    _updateMapHearts(health) {
      const indicator = this.elements.mapHealthIndicator;
      if (!indicator) return;

      const numericHealth = Number(health);
      if (!Number.isFinite(numericHealth) || numericHealth <= 0) {
        indicator.textContent = '💔';
        return;
      }

      const heartsCount = Math.min(5, Math.max(1, Math.round(numericHealth / 20)));
      indicator.textContent = '❤️'.repeat(heartsCount);
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

    animatePaletteTransfer(sourceEl, targetEl) {
      if (!sourceEl || !targetEl) return;

      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      if (!sourceRect.width || !targetRect.width) return;

      const ghost = sourceEl.cloneNode(true);
      ghost.removeAttribute('id');
      ghost.classList.add('palette-flight');
      ghost.style.position = 'fixed';
      ghost.style.left = `${sourceRect.left}px`;
      ghost.style.top = `${sourceRect.top}px`;
      ghost.style.width = `${sourceRect.width}px`;
      ghost.style.height = `${sourceRect.height}px`;
      ghost.style.margin = '0';
      ghost.style.transform = 'translate3d(0, 0, 0)';
      document.body.appendChild(ghost);

      requestAnimationFrame(() => {
        const translateX = targetRect.left + (targetRect.width / 2) - (sourceRect.left + (sourceRect.width / 2));
        const translateY = targetRect.top + (targetRect.height / 2) - (sourceRect.top + (sourceRect.height / 2));
        ghost.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(0.6)`;
        ghost.classList.add('palette-flight--fade');
      });

      setTimeout(() => ghost.remove(), 450);
    }
  }
  