/**
 * Клас контролера гри, що координує взаємодію між моделлю (GameModel) та відображенням (GameView)
 *
 * Основні обов'язки:
 * - Відповідає за запуск, скидання та виконання програми користувача
 * - Реалізує логіку переходу між рівнями, додавання команд, запуску анімацій
 * - Прив'язує всі необхідні обробники подій до кнопок і елементів інтерфейсу
 *
 * Важливо: контролер не містить ігрової логіки або роботи з DOM напряму — лише координацію.
 */
class GameController {
  constructor(model, view) {
    this.model = model; // Модель гри (логіка та стан)
    this.view = view;   // Відображення (DOM)
    
    // Змінна для відстеження стану виконання програми (true, якщо робот виконує команди)
    this.isRunning = false;
    
    // Для відстеження повторень (розширення: якщо буде додано цикли)
    this.currentRepeatCount = 0;
    this.maxRepeatCount = 0;
    this.currentCommandStep = null;
    
    // Прив'язка обробників подій (кнопки, кліки, попередження при виході)
    this.bindEvents();
    
    // Початкова ініціалізація гри (відображення рівня, створення кнопок)
    this.initGame();
  }

  /**
   * Прив'язка обробників подій до кнопок і елементів інтерфейсу
   * - Кнопки запуску, очищення, скидання
   * - Додавання команд у програму
   * - Попередження при спробі закрити сторінку під час виконання програми
   */
  bindEvents() {
    // Обробники для кнопок управління
    document.querySelector(CONFIG.SELECTORS.RUN_BUTTON).addEventListener('click', () => this.runProgram());
    document.querySelector(CONFIG.SELECTORS.CLEAR_BUTTON).addEventListener('click', () => this.clearProgram());
    document.querySelector(CONFIG.SELECTORS.RESET_BUTTON).addEventListener('click', () => this.resetLevel());
    
    // Додаємо обробник для кнопки зупинки, якщо вона є
    if (document.querySelector(CONFIG.SELECTORS.STOP_BUTTON)) {
      document.querySelector(CONFIG.SELECTORS.STOP_BUTTON).addEventListener('click', () => this.stopProgram());
    }
    
    // Обробник для кнопок команд
    this.view.commandsContainer.addEventListener('click', (e) => {
      const commandBtn = e.target.closest('.command');
      if (commandBtn && !this.isRunning) {
        this.addCommand(commandBtn.dataset.command);
      }
    });
    
    // Обробник попередження при виході під час виконання програми
    window.addEventListener('beforeunload', (e) => {
      if (this.isRunning) {
        e.preventDefault();
        e.returnValue = 'Програма виконується. Дійсно бажаєте вийти?';
        return e.returnValue;
      }
    });
  }

  /**
   * Ініціалізація гри — створення кнопок рівнів і завантаження поточного рівня
   */
  initGame() {
    this.createLevelButtons();
    this.loadLevel(this.model.currentLevel);
  }

  /**
   * Створення кнопок вибору рівня
   * Передає у view функцію для зміни рівня
   */
  createLevelButtons() {
    this.view.createLevelButtons(
      this.model.currentLevel, 
      this.model.completedLevels,
      (level) => {
        if (!this.isRunning) {
          this.loadLevel(level);
        }
      }
    );
  }

  /**
   * Завантаження рівня за номером
   * @param {number} level - номер рівня 
   * Якщо рівень завантажено успішно — оновлює відображення
   */
  loadLevel(level) {
    if (this.model.loadLevel(level)) {
      // Передаємо поточний рівень у представлення
      this.view.setCurrentLevel(level);
      
      this.view.setLevelDescription(this.model.gameConfig.description);
      this.view.createField(this.model.gridSize);
      this.view.updateWalls(this.model.walls);
      this.view.updateRobotPosition(this.model.robotPosition);
      this.view.updateCollectibles(this.model.collectibles);
      this.view.clearProgram();
      this.createLevelButtons();
    }
  }

  /**
   * Додавання команди до програми користувача
   * @param {string} command - команда для додавання
   * Додає крок у view та дозволяє видалити його
   */
  addCommand(command) {
    if (this.isRunning) return;
    
    this.view.addProgramStep(command, (step) => {
      if (!this.isRunning) {
        step.remove();
      }
    });
  }

  /**
   * Очищення програми
   */
  clearProgram() {
    if (this.isRunning) return;
    this.view.clearProgram();
  }

  /**
   * Запуск програми
   */
  runProgram() {
    if (this.isRunning) return;
    
    const steps = this.view.getProgramSteps();
    if (steps.length === 0) return;
    
    this.isRunning = true;
    this.executeSteps(steps, 0);
  }

  /**
   * Виконання кроків програми по черзі
   * @param {NodeList} steps - кроки програми
   * @param {number} index - поточний індекс кроку
   */
  executeSteps(steps, index) {
    // Перевірка на завершення або зупинку програми
    if (index >= steps.length || !this.isRunning) {
      this.isRunning = false;
      this.view.highlightProgramStep(-1); // Знімаємо виділення з усіх кроків
      return;
    }
    
    // Перевірка загальної кількості кроків програми
    const totalSteps = Array.from(steps).reduce((total, step) => {
      return total + parseInt(step.dataset.repeatCount || '1');
    }, 0);
    
    if (totalSteps > CONFIG.MAX_PROGRAM_STEPS) {
      this.view.showToast(CONFIG.ERROR_MESSAGES.COMPLEX_PROGRAM);
      this.isRunning = false;
      this.view.highlightProgramStep(-1);
      return;
    }
    
    const currentStep = steps[index];
    const command = currentStep.dataset.command || '';
    const repeatCount = Math.min(
      parseInt(currentStep.dataset.repeatCount || '1'),
      CONFIG.MAX_COMMAND_REPEATS
    );
    
    // Якщо починаємо нову команду, ініціалізуємо лічильник повторень
    if (this.currentCommandStep !== currentStep) {
      this.currentCommandStep = currentStep;
      this.currentRepeatCount = 0;
      this.maxRepeatCount = repeatCount;
    }
    
    // Підсвічуємо поточний крок
    this.view.highlightProgramStep(index);
    
    // Захист від зависання - якщо програма зависла на 5+ секунд
    const timeoutSafety = setTimeout(() => {
      console.log("Програма аварійно зупинена через таймаут");
      this.isRunning = false;
      this.view.showToast("Програма зупинена через перевищення часу виконання");
      this.view.highlightProgramStep(-1);
    }, CONFIG.ANIMATION_SPEED * 10); // В 10 разів більше стандартної затримки
    
    // Виконання руху робота
    const success = this.model.moveRobot(command);
    
    // Очищаємо таймер безпеки
    clearTimeout(timeoutSafety);
    
    if (success) {
      this.view.updateRobotPosition(this.model.robotPosition);
      
      // Перевірка збору предметів
      if (this.model.checkCollectibles()) {
        this.view.updateCollectibles(this.model.collectibles);
        
        // Перевірка завершення рівня
        if (this.model.isLevelCompleted()) {
          setTimeout(() => {
            this.handleLevelCompletion();
          }, CONFIG.ANIMATION_SPEED / 2);
          return;
        }
      }
      
      // Збільшуємо лічильник повторень
      this.currentRepeatCount++;
      
      // Перевіряємо, чи потрібно повторити команду або перейти до наступної
      if (this.currentRepeatCount < this.maxRepeatCount) {
        // Продовжуємо повторювати ту ж команду
        setTimeout(() => {
          if (this.isRunning) {
            this.executeSteps(steps, index);
          }
        }, CONFIG.ANIMATION_SPEED);
      } else {
        // Переходимо до наступної команди
        setTimeout(() => {
          if (this.isRunning) {
            this.executeSteps(steps, index + 1);
          }
        }, CONFIG.ANIMATION_SPEED);
      }
    } else {
      // Обробка випадку, коли рух неможливий (стіна або край поля)
      this.view.showToast(CONFIG.ERROR_MESSAGES.WALL_COLLISION);
      
      // Затримка перед продовженням програми
      setTimeout(() => {
        if (this.isRunning) {
          // Переходимо до наступної команди, пропускаючи поточне повторення
          this.currentRepeatCount = this.maxRepeatCount;
          this.executeSteps(steps, index + 1);
        }
      }, CONFIG.ANIMATION_SPEED);
    }
  }

  /**
   * Обробка завершення рівня
   */
  handleLevelCompletion() {
    this.isRunning = false;
    this.model.completeLevel();
    this.view.showToast(`Молодець! Ти завершив рівень ${this.model.currentLevel}!`);
    this.createLevelButtons();
    
    // Автоматичний перехід до наступного рівня, якщо він є
    if (this.model.hasNextLevel()) {
      setTimeout(() => {
        this.loadLevel(this.model.getNextLevel());
      }, 2000);
    }
  }

  /**
   * Скидання рівня
   */
  resetLevel() {
    if (this.isRunning) {
      this.isRunning = false;
      setTimeout(() => {
        this.loadLevel(this.model.currentLevel);
      }, 100);
    } else {
      this.loadLevel(this.model.currentLevel);
    }
  }

  /**
   * Зупинка виконання програми
   */
  stopProgram() {
    if (this.isRunning) {
      this.isRunning = false;
      this.view.highlightProgramStep(-1);
      this.view.showToast("Програму зупинено");
    }
  }
} 
