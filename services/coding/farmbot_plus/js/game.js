/**
 * Основний модуль гри "Фермер Бот Плюс"
 * Відповідає за логіку ігрового процесу, взаємодію з DOM та обробку команд користувача.
 */

const game = (function() {
  // Приватні змінні для зберігання стану гри
  let robotPosition = { x: 0, y: 0 }; // Поточна позиція робота
  let collectibles = []; // Масив предметів для збору
  let walls = []; // Масив координат стін
  let isRunning = false; // Чи виконується програма
  let stepCount = 0; // Кількість кроків
  let maxSteps = 30; // Максимальна кількість кроків на рівень
  let gridSize = CONFIG.DEFAULT_GRID_SIZE; // Розмір поля
  let executionInterval = null; // Інтервал виконання команд
  let currentCommandIndex = 0; // Індекс поточної команди
  let parsedCommands = []; // Масив розпарсених команд
  let currentLevelIndex = 0; // Поточний рівень
  
  // DOM-елементи для взаємодії з інтерфейсом
  const robotField = document.getElementById("robotField"); // Поле гри
  const stepCountElement = document.getElementById("stepCount"); // Лічильник кроків
  const programTextarea = document.getElementById("programCode"); // Текстове поле для коду
  const levelDescriptionElement = document.getElementById("levelDescription"); // Опис рівня
  const levelProgressElement = document.getElementById("levelProgress"); // Прогрес рівнів
  
  /**
   * Ініціалізація гри: завантажує рівень, оновлює інтерфейс та ховає повідомлення
   */
  function initGame() {
    loadLevel();
    updateStepCounter();
    displayLevels();
    // Приховати toast при старті
    const toast = document.getElementById("toast");
    if (toast) {
      toast.style.display = "none";
    }
  }

  /**
   * Відображає список рівнів та виділяє активний
   */
  function displayLevels() {
    levelProgressElement.innerHTML = "";
    LEVELS.forEach((level, index) => {
      const levelBtn = document.createElement("div");
      levelBtn.className = "level-btn" + (index === currentLevelIndex ? " active" : "");
      levelBtn.textContent = `${utils.translate('level')} ${index + 1}`;
      levelBtn.onclick = () => jumpToLevel(index);
      levelProgressElement.appendChild(levelBtn);
    });
  }

  /**
   * Перехід до вибраного рівня
   * @param {number} index - Індекс рівня
   */
  function jumpToLevel(index) {
    if (index >= 0 && index < LEVELS.length) {
      currentLevelIndex = index;
      resetLevel();
    }
  }

  /**
   * Завантаження поточного рівня: оновлює поле, предмети, позицію робота
   */
  function loadLevel() {
    const levelConfig = LEVELS[currentLevelIndex];
    gridSize = levelConfig.gridSize;
    robotPosition = utils.deepClone(levelConfig.robotStart);
    maxSteps = levelConfig.maxSteps;
    walls = utils.deepClone(levelConfig.walls);
    stepCount = 0;
    currentCommandIndex = 0;
    parsedCommands = [];
    
    // Оновлення опису рівня
    levelDescriptionElement.textContent = levelConfig.description;
    createField();
    updateStepCounter();
    utils.logToConsole(utils.translate('gameInitialized'));
    displayLevels();
  }

  /**
   * Створює HTML-структуру ігрового поля
   */
  function createField() {
    robotField.innerHTML = "";
    
    // Адаптивні розміри клітинок залежно від розміру поля
    let cellSize = 50; // базовий розмір
    if (gridSize >= 8 && gridSize < 9) {
      cellSize = 45; // менший розмір для 8x8
    } else if (gridSize >= 9 && gridSize < 10) {
      cellSize = 40; // ще менший для 9x9
    } else if (gridSize >= 10) {
      cellSize = 35; // найменший для 10x10 і більше
    }
    
    robotField.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
    robotField.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;
    
    // Встановлюємо CSS змінну для поточного розміру клітинки
    document.documentElement.style.setProperty('--current-cell-size', `${cellSize}px`);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        robotField.appendChild(cell);
      }
    }
    
    updateWalls();
    updateRobotPosition();
    placeCollectibles();
  }

  /**
   * Оновлює відображення стін на полі
   */
  function updateWalls() {
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("wall");
    });
    
    walls.forEach((wall) => {
      const cell = document.querySelector(`.cell[data-x="${wall.x}"][data-y="${wall.y}"]`);
      if (cell) cell.classList.add("wall");
    });
  }

  /**
   * Розміщує предмети для збору на полі
   */
  function placeCollectibles() {
    collectibles = [];
    const levelConfig = LEVELS[currentLevelIndex];
    
    // Розміщуємо колектибли в випадкових позиціях
    while (collectibles.length < levelConfig.collectiblesCount) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      
      // Перевіряємо, щоб не накладались на робота чи стіни
      if (
        !utils.isSamePosition({x, y}, robotPosition) &&
        !utils.containsPosition(collectibles, {x, y}) &&
        !utils.containsPosition(walls, {x, y})
      ) {
        collectibles.push({ x, y, type: levelConfig.collectibleType });
      }
    }
    
    updateCollectibles();
  }

  /**
   * Оновлює позицію робота на полі
   */
  function updateRobotPosition() {
    document.querySelectorAll(".robot-icon").forEach((icon) => icon.remove());
    const cell = document.querySelector(`.cell[data-x="${robotPosition.x}"][data-y="${robotPosition.y}"]`);
    
    if (cell) {
      const robotIcon = document.createElement("div");
      robotIcon.className = "robot-icon";
      robotIcon.innerHTML = "🤖";
      cell.appendChild(robotIcon);
    }
    
    checkCollectibles();
  }

  /**
   * Оновлює відображення предметів для збору
   */
  function updateCollectibles() {
    document.querySelectorAll(".collectible").forEach((item) => item.remove());
    
    collectibles.forEach((item) => {
      const cell = document.querySelector(`.cell[data-x="${item.x}"][data-y="${item.y}"]`);
      if (cell) {
        const collectibleIcon = document.createElement("div");
        collectibleIcon.className = "collectible";
        collectibleIcon.innerHTML = item.type;
        cell.appendChild(collectibleIcon);
      }
    });
  }

  /**
   * Перевіряє, чи зібрано всі предмети, та показує повідомлення про успіх
   */
  function checkCollectibles() {
    const itemIndex = collectibles.findIndex(item => 
      utils.isSamePosition(item, robotPosition)
    );
    
    if (itemIndex !== -1) {
      const collectedItem = collectibles[itemIndex];
      collectibles.splice(itemIndex, 1);
      updateCollectibles();
      
      // Повідомлення про збір
      utils.logToConsole(
        `${utils.translate('fruitCollected')} ${collectedItem.type}! ${utils.translate('remaining')}: ${collectibles.length}`,
        MESSAGE_TYPES.SUCCESS
      );
      
      // Перевірка на завершення рівня
      if (collectibles.length === 0) {
        setTimeout(() => {
          isRunning = false;
          clearInterval(executionInterval);
          utils.showToast(utils.translate('levelSuccess'));
          utils.logToConsole(utils.translate('levelCompleted'), MESSAGE_TYPES.SUCCESS);
          
          // Перехід до наступного рівня після затримки
          setTimeout(() => {
            nextLevel();
          }, CONFIG.NEXT_LEVEL_DELAY);
        }, 500);
      }
    }
  }

  /**
   * Оновлює лічильник кроків на інтерфейсі
   */
  function updateStepCounter() {
    stepCountElement.textContent = `${utils.translate('steps')}: ${stepCount} / ${maxSteps}`;
    stepCountElement.style.backgroundColor =
      stepCount > maxSteps ? "var(--warning-color)" : "var(--primary-color)";
  }

  /**
   * Переміщує робота у заданому напрямку
   * @param {string} direction - Напрямок руху
   * @returns {boolean} Успішність руху
   */
  function moveRobot(direction) {
    let newPosition = utils.deepClone(robotPosition);
    
    switch (direction) {
      case COMMANDS.UP:
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case COMMANDS.DOWN:
        newPosition.y = Math.min(gridSize - 1, newPosition.y + 1);
        break;
      case COMMANDS.LEFT:
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case COMMANDS.RIGHT:
        newPosition.x = Math.min(gridSize - 1, newPosition.x + 1);
        break;
      default:
        utils.logToConsole(`${utils.translate('unknownCommand')}: ${direction}`, MESSAGE_TYPES.ERROR);
        return false;
    }
    
    // Перевірка на стіну
    const hitWall = utils.containsPosition(walls, newPosition);
    if (hitWall) {
      utils.logToConsole(utils.translate('wallHit'), MESSAGE_TYPES.ERROR);
      return false;
    }
    
    // Рух успішний
    robotPosition = newPosition;
    stepCount++;
    updateStepCounter();
    updateRobotPosition();
    
    if (stepCount > maxSteps) {
      utils.logToConsole(`${utils.translate('stepsExceeded')} (${maxSteps})`, MESSAGE_TYPES.ERROR);
    }
    
    return true;
  }

  /**
   * Парсить програму користувача у масив команд
   * @returns {Array|null} Масив команд або null в разі помилки
   */
  function parseProgram() {
    const code = programTextarea.value.trim();
    if (!code) {
      utils.showError(utils.translate('programEmpty'));
      return null;
    }
    
    const lines = code.split("\n");
    const commands = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("//")) continue;
      
      const parts = line.split(" ");
      const command = parts[0].toLowerCase();
      const count = parts.length > 1 ? parseInt(parts[1]) : 1;
      
      if (isNaN(count) || count < 1) {
        utils.showError(`${utils.translate('invalidIterations')} ${utils.translate('line')} ${i + 1}`);
        return null;
      }
      
      if (!utils.isValidCommand(command)) {
        utils.showError(`${utils.translate('unknownCommand')} "${command}" (${utils.translate('line')} ${i + 1})`);
        return null;
      }
      
      for (let j = 0; j < count; j++) {
        commands.push({ command: command, line: i + 1 });
      }
    }
    
    return commands;
  }

  /**
   * Запускає виконання програми користувача
   */
  function runProgram() {
    if (isRunning) return;
    
    parsedCommands = parseProgram();
    if (!parsedCommands) return;
    
    currentCommandIndex = 0;
    stepCount = 0;
    updateStepCounter();
    isRunning = true;
    utils.logToConsole(utils.translate('programStarted'));
    executionInterval = setInterval(executeNextCommand, CONFIG.ANIMATION_SPEED);
  }

  /**
   * Виконує наступну команду з програми
   */
  function executeNextCommand() {
    if (!isRunning || currentCommandIndex >= parsedCommands.length) {
      stopProgram();
      
      if (collectibles.length > 0) {
        utils.logToConsole(utils.translate('programIncomplete'), MESSAGE_TYPES.ERROR);
      } else {
        utils.logToConsole(utils.translate('programCompleted'), MESSAGE_TYPES.SUCCESS);
      }
      return;
    }
    
    const currentCommand = parsedCommands[currentCommandIndex];
    utils.logToConsole(`${utils.translate('executing')}: ${currentCommand.command} (${utils.translate('line')} ${currentCommand.line})`);
    
    const success = moveRobot(currentCommand.command);
    currentCommandIndex++;
    
    if (!success) {
      stopProgram();
      utils.logToConsole(utils.translate('programError'), MESSAGE_TYPES.ERROR);
    }
  }

  /**
   * Зупиняє виконання програми
   */
  function stopProgram() {
    if (!isRunning) return;
    
    clearInterval(executionInterval);
    isRunning = false;
    utils.logToConsole(utils.translate('programStopped'));
  }

  /**
   * Скидає рівень до початкового стану
   */
  function resetLevel() {
    stopProgram();
    stepCount = 0;
    currentCommandIndex = 0;
    parsedCommands = [];
    
    // Очищення текстового поля команд
    programTextarea.value = "";
    loadLevel();
    utils.logToConsole(utils.translate('levelReset'));
  }

  /**
   * Перехід до наступного рівня
   */
  function nextLevel() {
    if (currentLevelIndex < LEVELS.length - 1) {
      currentLevelIndex++;
      resetLevel();
    } else {
      utils.logToConsole(utils.translate('allLevelsCompleted'), MESSAGE_TYPES.SUCCESS);
    }
  }

  // Ініціалізація при завантаженні сторінки
  window.onload = initGame;

  // Публічний інтерфейс: доступні методи для керування грою з HTML
  return {
    runProgram,
    stopProgram,
    resetLevel,
    jumpToLevel,
    nextLevel
  };
})(); 
