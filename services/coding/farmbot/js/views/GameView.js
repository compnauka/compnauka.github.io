/**
 * Клас представлення гри (View), що відповідає за відображення та взаємодію з DOM
 *
 * Основні обов'язки:
 * - Оновлює інтерфейс користувача згідно зі станом моделі
 * - Створює ігрове поле, кнопки команд, рівнів, програму користувача
 * - Відповідає за відображення робота, предметів, стін, повідомлень
 * - Не містить логіки гри, лише роботу з DOM та UI
 */
class GameView {
  constructor() {
    // Кешування DOM-елементів для швидкого доступу
    this.robotField = document.querySelector(CONFIG.SELECTORS.ROBOT_FIELD); // Поле гри
    this.programContainer = document.querySelector(CONFIG.SELECTORS.PROGRAM); // Програма користувача
    this.commandsContainer = document.querySelector(CONFIG.SELECTORS.COMMANDS_CONTAINER); // Кнопки команд
    this.levelProgress = document.querySelector(CONFIG.SELECTORS.LEVEL_PROGRESS); // Прогрес рівнів
    this.levelDescription = document.querySelector(CONFIG.SELECTORS.LEVEL_DESCRIPTION); // Опис рівня
    this.toast = document.querySelector(CONFIG.SELECTORS.TOAST); // Toast message element
    this.confirmClearModal = document.querySelector(CONFIG.SELECTORS.CONFIRM_CLEAR_MODAL);
    this.confirmClearOkButton = document.querySelector(CONFIG.SELECTORS.CONFIRM_CLEAR_OK_BUTTON);
    this.confirmClearCancelButton = document.querySelector(CONFIG.SELECTORS.CONFIRM_CLEAR_CANCEL_BUTTON);
    this.soundToggleButton = document.querySelector(CONFIG.SELECTORS.SOUND_TOGGLE_BUTTON);
    
    // Поточний рівень (для підсвічування)
    this.currentLevel = 1;
    
    // Створення кнопок команд для керування роботом
    this.initCommandButtons();
    this.initAudio();
  }

  /**
   * Встановлення поточного рівня (оновлює підсвічування і список команд)
   * @param {number} level - номер рівня
   */
  setCurrentLevel(level) {
    this.currentLevel = level;
    this.initCommandButtons();
  }

  initAudio() {
    this.audioContext = null;
    this.audioEnabled = this.readSoundEnabledFromSession();
    this.isAudioUnlocked = false;
    this.updateSoundToggleButton();

    const unlockAudio = () => {
      if (!this.audioEnabled || this.isAudioUnlocked) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          this.audioEnabled = false;
          this.persistSoundEnabledState();
          this.updateSoundToggleButton();
          return;
        }

        this.audioContext = this.audioContext || new AudioContextClass();
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        this.isAudioUnlocked = true;
      } catch (error) {
        this.audioEnabled = false;
        this.persistSoundEnabledState();
        this.updateSoundToggleButton();
      }
    };

    document.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  }

  readSoundEnabledFromSession() {
    try {
      return sessionStorage.getItem(CONFIG.STORAGE_KEYS.SOUND_ENABLED_SESSION) !== 'false';
    } catch (error) {
      return true;
    }
  }

  persistSoundEnabledState() {
    try {
      sessionStorage.setItem(
        CONFIG.STORAGE_KEYS.SOUND_ENABLED_SESSION,
        this.audioEnabled ? 'true' : 'false'
      );
    } catch (error) {
      // Ignore sessionStorage errors in restricted browser modes
    }
  }

  updateSoundToggleButton() {
    if (!this.soundToggleButton) return;

    this.soundToggleButton.classList.toggle('is-muted', !this.audioEnabled);
    this.soundToggleButton.setAttribute('aria-pressed', String(this.audioEnabled));
    this.soundToggleButton.innerHTML = this.audioEnabled
      ? '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> Звук: Увімк.'
      : '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i> Звук: Вимк.';
  }

  async toggleSoundEnabled() {
    this.audioEnabled = !this.audioEnabled;
    this.persistSoundEnabledState();
    this.updateSoundToggleButton();

    if (this.audioEnabled) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (error) {
          this.audioEnabled = false;
          this.persistSoundEnabledState();
          this.updateSoundToggleButton();
          return;
        }
      }
      this.playSound('confirm');
    }
  }

  playSound(type) {
    if (!this.audioEnabled || !this.audioContext) return;

    const soundMap = {
      click: { frequency: 560, duration: 0.06, gain: 0.03, wave: 'triangle' },
      delete: { frequency: 250, duration: 0.08, gain: 0.035, wave: 'sawtooth' },
      run: { frequency: 780, duration: 0.1, gain: 0.035, wave: 'square' },
      stop: { frequency: 320, duration: 0.1, gain: 0.035, wave: 'square' },
      collect: { frequency: 920, duration: 0.07, gain: 0.03, wave: 'sine' },
      success: { frequency: 1040, duration: 0.12, gain: 0.04, wave: 'triangle' },
      error: { frequency: 210, duration: 0.1, gain: 0.04, wave: 'sawtooth' },
      confirm: { frequency: 660, duration: 0.09, gain: 0.03, wave: 'triangle' }
    };

    const config = soundMap[type] || soundMap.click;
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = config.wave;
    oscillator.frequency.setValueAtTime(config.frequency, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(config.gain, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + config.duration + 0.01);
  }

  /**
   * Ініціалізація кнопок команд (вгору, вниз, вліво, вправо)
   * Викликається при зміні рівня або при старті гри
   */
  initCommandButtons() {
    this.commandsContainer.innerHTML = '';
    
    const commands = [
      { id: CONFIG.COMMANDS.UP, label: '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i> Вгору' },
      { id: CONFIG.COMMANDS.DOWN, label: '<i class="fa-solid fa-arrow-down" aria-hidden="true"></i> Вниз' },
      { id: CONFIG.COMMANDS.LEFT, label: '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Вліво' },
      { id: CONFIG.COMMANDS.RIGHT, label: '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i> Вправо' }
    ];
    
    commands.forEach(cmd => {
      const commandBtn = document.createElement('div');
      commandBtn.className = 'command';
      commandBtn.innerHTML = cmd.label;
      commandBtn.dataset.command = cmd.id;
      this.commandsContainer.appendChild(commandBtn);
    });
  }

  /**
   * Створення ігрового поля заданого розміру
   * @param {number} gridSize - розмір сітки (кількість клітинок по осі)
   * Динамічно створює DOM-елементи для кожної клітинки
   */
  createField(gridSize) {
    this.robotField.innerHTML = '';
    
    // Адаптивний розмір клітинок в залежності від розміру поля
    let cellSize = 50; // базовий розмір для маленьких полів
    
    if (gridSize >= 9) {
      cellSize = 35; // для дуже великих полів (9x9, 10x10)
    } else if (gridSize >= 7) {
      cellSize = 40; // для великих полів (7x7, 8x8)
    }
    
    this.robotField.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
    this.robotField.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;
    
    // Встановлюємо CSS змінну для розміру клітинки
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    document.documentElement.style.setProperty('--icon-size', `${Math.floor(cellSize * 0.65)}px`);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        this.robotField.appendChild(cell);
      }
    }
  }

  /**
   * Очищення програми користувача (видаляє всі кроки з DOM)
   */
  clearProgram() {
    this.programContainer.innerHTML = '';
  }

  confirmClearProgram() {
    return new Promise((resolve) => {
      if (!this.confirmClearModal || !this.confirmClearOkButton || !this.confirmClearCancelButton) {
        resolve(true);
        return;
      }

      const onConfirm = () => {
        this.hideConfirmClearModal();
        this.playSound('confirm');
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        this.hideConfirmClearModal();
        cleanup();
        resolve(false);
      };

      const onBackdropClick = (event) => {
        if (event.target === this.confirmClearModal) {
          onCancel();
        }
      };

      const onEscape = (event) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };

      const cleanup = () => {
        this.confirmClearOkButton.removeEventListener('click', onConfirm);
        this.confirmClearCancelButton.removeEventListener('click', onCancel);
        this.confirmClearModal.removeEventListener('click', onBackdropClick);
        document.removeEventListener('keydown', onEscape);
      };

      this.confirmClearOkButton.addEventListener('click', onConfirm);
      this.confirmClearCancelButton.addEventListener('click', onCancel);
      this.confirmClearModal.addEventListener('click', onBackdropClick);
      document.addEventListener('keydown', onEscape);
      this.showConfirmClearModal();
      this.confirmClearCancelButton.focus();
    });
  }

  showConfirmClearModal() {
    this.confirmClearModal.classList.add('open');
    this.confirmClearModal.setAttribute('aria-hidden', 'false');
  }

  hideConfirmClearModal() {
    this.confirmClearModal.classList.remove('open');
    this.confirmClearModal.setAttribute('aria-hidden', 'true');
  }

  /**
   * Додавання кроку до програми користувача
   * @param {string} command - команда кроку
   * @param {function} deleteCallback - функція зворотного виклику для видалення кроку
   * Створює DOM-елемент для кроку з можливістю видалення
   */
  addProgramStep(command, deleteCallback) {
    const programStep = document.createElement('div');
    programStep.className = 'program-step';
    programStep.dataset.command = command;
    
    // Базова кількість повторень
    programStep.dataset.repeatCount = '1';
    
    // Додаємо піктограму команди
    let commandIcon = '';
    switch (command) {
      case CONFIG.COMMANDS.UP:
        programStep.classList.add('command-step-up');
        commandIcon = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i> Вгору';
        break;
      case CONFIG.COMMANDS.DOWN:
        programStep.classList.add('command-step-down');
        commandIcon = '<i class="fa-solid fa-arrow-down" aria-hidden="true"></i> Вниз';
        break;
      case CONFIG.COMMANDS.LEFT:
        programStep.classList.add('command-step-left');
        commandIcon = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Вліво';
        break;
      case CONFIG.COMMANDS.RIGHT:
        programStep.classList.add('command-step-right');
        commandIcon = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i> Вправо';
        break;
    }
    
    // Створюємо елемент для іконки команди
    const iconSpan = document.createElement('span');
    iconSpan.className = 'command-icon';
    iconSpan.innerHTML = commandIcon;
    programStep.appendChild(iconSpan);
    
    // Додаємо поле повторення для рівнів 3 і вище
    if (this.currentLevel >= 3) {
      const repeatContainer = document.createElement('div');
      repeatContainer.className = 'repeat-container';
      
      // Додаємо текст "x" перед полем
      const repeatLabel = document.createElement('span');
      repeatLabel.className = 'repeat-label';
      repeatLabel.textContent = 'x';
      repeatContainer.appendChild(repeatLabel);
      
      // Створюємо поле для введення кількості повторень
      const repeatInput = document.createElement('input');
      repeatInput.type = 'number';
      repeatInput.className = 'repeat-input';
      repeatInput.min = '1';
      repeatInput.max = '10';
      repeatInput.value = '1';
      repeatInput.addEventListener('change', (e) => {
        // Переконуємося, що значення в допустимому діапазоні
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) {
          e.target.value = '1';
          programStep.dataset.repeatCount = '1';
        } else if (value > 10) {
          e.target.value = '10';
          programStep.dataset.repeatCount = '10';
        } else {
          programStep.dataset.repeatCount = e.target.value;
        }
      });
      
      repeatContainer.appendChild(repeatInput);
      programStep.appendChild(repeatContainer);
    }
    
    // Додаємо кнопку видалення
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-step';
    deleteBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    deleteBtn.onclick = function(e) {
      e.stopPropagation();
      this.playSound('delete');
      deleteCallback(programStep);
    }.bind(this);
    
    programStep.appendChild(deleteBtn);
    this.programContainer.appendChild(programStep);
    
    return programStep;
  }

  /**
   * Оновлення відображення стін на полі
   * @param {Array} walls - масив стін
   */
  updateWalls(walls) {
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('wall');
    });
    
    walls.forEach(wall => {
      const cell = document.querySelector(`.cell[data-x="${wall.x}"][data-y="${wall.y}"]`);
      if (cell) cell.classList.add('wall');
    });
  }

  /**
   * Оновлення позиції робота
   * @param {Object} position - позиція робота {x, y}
   */
  updateRobotPosition(position) {
    document.querySelectorAll('.robot-icon').forEach(icon => icon.remove());
    
    const cell = document.querySelector(`.cell[data-x="${position.x}"][data-y="${position.y}"]`);
    if (cell) {
      const robotIcon = document.createElement('div');
      robotIcon.className = 'robot-icon';
      robotIcon.innerHTML = '🤖';
      cell.appendChild(robotIcon);
    }
  }

  /**
   * Оновлення відображення колекційних предметів
   * @param {Array} collectibles - масив колекційних предметів
   */
  updateCollectibles(collectibles) {
    document.querySelectorAll('.collectible').forEach(item => item.remove());
    
    collectibles.forEach(item => {
      const cell = document.querySelector(`.cell[data-x="${item.x}"][data-y="${item.y}"]`);
      if (cell) {
        const collectibleIcon = document.createElement('div');
        collectibleIcon.className = 'collectible';

        if (item.eggAsset) {
          const eggImage = document.createElement('img');
          eggImage.className = 'collectible-image';
          eggImage.src = item.eggAsset;
          eggImage.alt = '';
          eggImage.onerror = () => {
            collectibleIcon.textContent = '🥚';
          };
          collectibleIcon.appendChild(eggImage);
        } else {
          collectibleIcon.textContent = item.type;
        }

        cell.appendChild(collectibleIcon);
      }
    });
  }

  /**
   * Створення кнопок вибору рівня
   * @param {number} currentLevel - поточний рівень
   * @param {Array} completedLevels - завершені рівні
   * @param {function} levelSelectCallback - функція зворотного виклику для вибору рівня
   */
  createLevelButtons(currentLevel, completedLevels, levelSelectCallback) {
    this.levelProgress.innerHTML = '';
    this.currentLevel = currentLevel;
    
    for (let i = 0; i < CONFIG.LEVELS.length; i++) {
      const levelBtn = document.createElement('div');
      levelBtn.className = 'level-btn';
      
      if (i + 1 === currentLevel) levelBtn.classList.add('active');
      if (completedLevels.includes(i + 1)) levelBtn.classList.add('completed');
      
      levelBtn.textContent = `Рівень ${i + 1}`;
      levelBtn.dataset.level = i + 1;
      
      levelBtn.addEventListener('click', () => levelSelectCallback(i + 1));
      this.levelProgress.appendChild(levelBtn);
    }
  }

  /**
   * Встановлення опису рівня
   * @param {string} description - текст опису
   */
  setLevelDescription(description) {
    // Додаємо інформацію про цикли для рівнів 3+
    let updatedDescription = description;
    if (this.currentLevel >= 3 && !description.includes('повторення')) {
      updatedDescription += ' Тепер ти можеш використовувати повторення (цикли) для команд!';
    }
    this.levelDescription.textContent = updatedDescription;
  }

  /**
   * Виділення поточного кроку програми
   * @param {number} index - індекс кроку, якщо -1 то знімає виділення з усіх кроків
   */
  highlightProgramStep(index) {
    const steps = this.programContainer.querySelectorAll('.program-step');
    
    // Знімаємо виділення з усіх кроків
    steps.forEach(step => step.classList.remove('active'));
    
    // Якщо індекс не від'ємний, виділяємо вказаний крок
    if (index >= 0 && index < steps.length) {
      steps[index].classList.add('active');
      
      // Прокручуємо контейнер, щоб було видно активний крок
      steps[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Показ повідомлення
   * @param {string} message - текст повідомлення
   */
  showToast(message) {
    // Очищаємо попередній таймер, якщо він є
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    
    this.toast.textContent = message;
    this.toast.style.display = 'block';
    
    // Зберігаємо таймер, щоб мати можливість його очистити
    this.toastTimer = setTimeout(() => {
      this.toast.style.display = 'none';
    }, CONFIG.TOAST_DURATION);
  }

  /**
   * Отримання всіх кроків програми
   * @returns {NodeList} елементи кроків програми
   */
  getProgramSteps() {
    return this.programContainer.querySelectorAll('.program-step');
  }
} 


