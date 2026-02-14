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
    this.toast = document.querySelector(CONFIG.SELECTORS.TOAST); // Вікно повідомлення
    
    // Поточний рівень (для підсвічування)
    this.currentLevel = 1;
    
    // Створення кнопок команд для керування роботом
    this.initCommandButtons();
  }

  /**
   * Встановлення поточного рівня (оновлює підсвічування і список команд)
   * @param {number} level - номер рівня
   */
  setCurrentLevel(level) {
    this.currentLevel = level;
    this.initCommandButtons();
  }

  /**
   * Ініціалізація кнопок команд (вгору, вниз, вліво, вправо)
   * Викликається при зміні рівня або при старті гри
   */
  initCommandButtons() {
    this.commandsContainer.innerHTML = '';
    
    const commands = [
      { id: CONFIG.COMMANDS.UP, label: '⬆️ Вгору' },
      { id: CONFIG.COMMANDS.DOWN, label: '⬇️ Вниз' },
      { id: CONFIG.COMMANDS.LEFT, label: '⬅️ Вліво' },
      { id: CONFIG.COMMANDS.RIGHT, label: '➡️ Вправо' }
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
        commandIcon = '⬆️ Вгору';
        break;
      case CONFIG.COMMANDS.DOWN:
        commandIcon = '⬇️ Вниз';
        break;
      case CONFIG.COMMANDS.LEFT:
        commandIcon = '⬅️ Вліво';
        break;
      case CONFIG.COMMANDS.RIGHT:
        commandIcon = '➡️ Вправо';
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
    deleteBtn.innerHTML = '✖';
    deleteBtn.onclick = function(e) {
      e.stopPropagation();
      deleteCallback(programStep);
    };
    
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
        collectibleIcon.innerHTML = item.type;
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
