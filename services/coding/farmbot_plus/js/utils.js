/**
 * Утиліти та допоміжні функції для гри "Фермер Бот Плюс"
 */

const utils = {
  /**
   * Поточна мова інтерфейсу
   */
  currentLang: 'uk',
  
  /**
   * Отримати переклад за ключем
   * @param {string} key - Ключ перекладу
   * @param {object} params - Параметри для підстановки
   * @returns {string} Перекладений текст
   */
  translate(key, params = {}) {
    const translation = TRANSLATIONS[this.currentLang][key] || key;
    
    // Підстановка параметрів, якщо вони є
    if (Object.keys(params).length) {
      return Object.keys(params).reduce((result, param) => {
        return result.replace(`{${param}}`, params[param]);
      }, translation);
    }
    
    return translation;
  },
  
  /**
   * Змінити мову інтерфейсу
   * @param {string} lang - Код мови (uk, en)
   */
  setLanguage(lang) {
    if (TRANSLATIONS[lang]) {
      this.currentLang = lang;
      // Тут можна додати логіку для оновлення всіх текстових елементів інтерфейсу
    }
  },
  
  /**
   * Показати спливаюче повідомлення
   * @param {string} message - Текст повідомлення
   * @param {boolean} isError - Чи є повідомлення помилкою
   */
  showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    const messageElement = toast.querySelector(".toast-message") || toast;
    
    if (messageElement !== toast) {
      messageElement.textContent = message;
    } else {
      toast.textContent = message;
    }
    
    // Встановлюємо відповідну іконку
    const iconElement = toast.querySelector(".toast-icon");
    if (iconElement) {
      iconElement.textContent = isError ? "❌" : "🎉";
    }
    
    toast.style.backgroundColor = isError 
      ? 'var(--error-color)' 
      : 'var(--success-color)';
      
    // Показуємо toast
    toast.style.display = "flex";
    
    // Анімація появи
    toast.style.animation = 'none';
    // Forced reflow to restart animation
    toast.offsetHeight;
    toast.style.animation = 'toast-appear 0.3s ease';
    
    // Автоматично ховаємо через вказаний час
    setTimeout(() => {
      toast.style.display = "none";
    }, CONFIG.TOAST_DURATION);
  },
  
  /**
   * Показати повідомлення про помилку
   * @param {string} message - Текст повідомлення
   */
  showError(message) {
    this.logToConsole(message, MESSAGE_TYPES.ERROR);
    this.showToast(message, true);
  },
  
  /**
   * Додати повідомлення в консоль
   * @param {string} message - Текст повідомлення
   * @param {string} type - Тип повідомлення (info, error, success)
   */
  logToConsole(message, type = MESSAGE_TYPES.INFO) {
    const consoleEl = document.getElementById("console");
    const line = document.createElement("div");
    line.className = "console-line";
    
    if (type === MESSAGE_TYPES.ERROR) {
      line.classList.add("console-error");
      message = "❌ " + message;
    } else if (type === MESSAGE_TYPES.SUCCESS) {
      line.classList.add("console-success");
      message = "✅ " + message;
    }
    
    line.textContent = message;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    
    // Обмеження кількості рядків
    while (consoleEl.children.length > CONFIG.MAX_CONSOLE_LINES) {
      consoleEl.children[0].remove();
    }
  },
  
  /**
   * Перевірка, чи є команда валідною
   * @param {string} command - Команда для перевірки
   * @returns {boolean} Результат перевірки
   */
  isValidCommand(command) {
    return Object.values(COMMANDS).includes(command);
  },
  
  /**
   * Перетворити координати в рядок
   * @param {object} position - Об'єкт з координатами {x, y}
   * @returns {string} Рядок з координатами "x,y"
   */
  positionToString(position) {
    return `${position.x},${position.y}`;
  },
  
  /**
   * Перевірити, чи дві позиції однакові
   * @param {object} pos1 - Перша позиція {x, y}
   * @param {object} pos2 - Друга позиція {x, y}
   * @returns {boolean} Результат порівняння
   */
  isSamePosition(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  },
  
  /**
   * Перевірити, чи містить масив позиції вказану позицію
   * @param {Array} positions - Масив позицій [{x, y}, ...]
   * @param {object} position - Позиція для перевірки {x, y}
   * @returns {boolean} Результат перевірки
   */
  containsPosition(positions, position) {
    return positions.some(pos => this.isSamePosition(pos, position));
  },
  
  /**
   * Створити глибоку копію об'єкта
   * @param {*} obj - Об'єкт для копіювання
   * @returns {*} Глибока копія об'єкта
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}; 
