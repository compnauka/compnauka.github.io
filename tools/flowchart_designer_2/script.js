document.addEventListener('DOMContentLoaded', function() {
    // ============= Отримання DOM-елементів =============
    const canvas = document.getElementById('flowchart-canvas');
    const canvasContainer = document.getElementById('canvas-container');
    const shapeButtons = document.querySelectorAll('.shape-button');
    const colorOptions = document.querySelectorAll('.color-option');
    const connectButton = document.getElementById('connect-button');
    const deleteButton = document.getElementById('delete-button');
    const clearButton = document.getElementById('clear-button');
    const saveButton = document.getElementById('save-button');
    const textModal = document.getElementById('text-modal');
    const shapeText = document.getElementById('shape-text');
    const cancelText = document.getElementById('cancel-text');
    const saveText = document.getElementById('save-text');
    const helpButton = document.getElementById('help-button');
    const helpContent = document.getElementById('help-content');
    
    // Елементи керування масштабом
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const zoomResetButton = document.getElementById('zoom-reset');
    const zoomLevelText = document.getElementById('zoom-level');
    
    // Елементи модального вікна з'єднання
    const connectionModal = document.getElementById('connection-modal');
    const connectionYesBtn = document.getElementById('connection-yes');
    const connectionNoBtn = document.getElementById('connection-no');
    const cancelConnection = document.getElementById('cancel-connection');
    
    // ============= Змінні стану додатку =============
    const state = {
        shapes: [],                // Масив для зберігання всіх фігур
        connections: [],           // Масив для зберігання з'єднань між фігурами
        selectedShape: null,       // Поточна вибрана фігура
        currentShapeType: 'start-end', // Тип фігури для створення
        currentColor: '#3f51b5',   // Поточний вибраний колір
        isConnecting: false,       // Режим з'єднання фігур
        firstSelectedShape: null,  // Перша фігура для з'єднання
        secondSelectedShape: null, // Друга фігура для з'єднання
        shapeCounter: 0,           // Лічильник для унікальних ID фігур
        activeShape: null,         // Фігура, яка перетягується або редагується
        offsetX: 0,                // Зміщення X при перетягуванні
        offsetY: 0,                // Зміщення Y при перетягуванні
        isDragging: false,         // Флаг перетягування
        scale: 1,                  // Поточний масштаб (100%)
        minScale: 0.25,            // Мінімальний масштаб (25%)
        maxScale: 3,               // Максимальний масштаб (300%)
        scaleStep: 0.1             // Крок масштабування
    };
    
    // Показуємо довідку автоматично при першому відкритті
    helpContent.classList.add('active');
    
    // ============= Функції масштабування =============
    
    /**
     * Встановлює масштаб полотна
     * @param {number} newScale - Новий масштаб
     */
    function setZoom(newScale) {
        // Обмежуємо масштаб мінімальним та максимальним значеннями
        newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
        
        // Зберігаємо поточні координати прокрутки контейнера
        const containerRect = canvasContainer.getBoundingClientRect();
        const scrollCenterX = canvasContainer.scrollLeft + containerRect.width / 2;
        const scrollCenterY = canvasContainer.scrollTop + containerRect.height / 2;
        
        // Координати центру в просторі полотна
        const canvasCenterX = scrollCenterX / state.scale;
        const canvasCenterY = scrollCenterY / state.scale;
        
        // Оновлюємо масштаб
        state.scale = newScale;
        
        // Застосовуємо масштаб лише до canvas (НЕ до svgLayer)
        canvas.style.transform = `scale(${newScale})`;
        
        // Оновлюємо текст показника масштабу
        zoomLevelText.textContent = `${Math.round(newScale * 100)}%`;
        
        // Оновлюємо прокрутку для збереження центру
        canvasContainer.scrollLeft = canvasCenterX * newScale - containerRect.width / 2;
        canvasContainer.scrollTop = canvasCenterY * newScale - containerRect.height / 2;
        
        // Оновлюємо всі з'єднання
        state.connections.forEach(conn => {
            updateConnection(conn.id);
            if (conn.type) {
                updateConnectionLabel(conn.id);
            }
        });
    }
    
    /**
     * Збільшує масштаб
     */
    function zoomIn() {
        setZoom(state.scale + state.scaleStep);
    }
    
    /**
     * Зменшує масштаб
     */
    function zoomOut() {
        setZoom(state.scale - state.scaleStep);
    }
    
    /**
     * Скидає масштаб до 100%
     */
    function resetZoom() {
        setZoom(1);
    }
    
    // Додаємо обробники подій для кнопок масштабування
    zoomInButton.addEventListener('click', zoomIn);
    zoomOutButton.addEventListener('click', zoomOut);
    zoomResetButton.addEventListener('click', resetZoom);
    
    // Додаємо масштабування колесом миші
    canvasContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        // Визначаємо напрямок прокрутки
        const delta = Math.sign(e.deltaY) * -0.1;
        
        // Оновлюємо масштаб
        setZoom(state.scale + delta);
    });
    
    // ============= Допоміжні функції =============
    
    /**
     * Отримати DOM-елемент фігури за ідентифікатором
     * @param {string} id - Ідентифікатор фігури
     * @returns {HTMLElement|null} - DOM-елемент фігури або null, якщо не знайдено
     */
    function getShapeById(id) {
        return document.getElementById(id);
    }
    
    /**
     * Знаходить індекс фігури в масиві state.shapes за її id
     * @param {string} shapeId - Ідентифікатор фігури
     * @returns {number} - Індекс фігури в масиві або -1, якщо не знайдено
     */
    function getShapeIndexInState(shapeId) {
        if (!shapeId) return -1;
        
        return state.shapes.findIndex(shape => shape.id === shapeId);
    }
    
    /**
     * Встановлює текст для фігури і в DOM, і в масиві state.shapes
     * @param {string} shapeId - Ідентифікатор фігури
     * @param {string} text - Новий текст
     * @returns {{dom: boolean, state: boolean}} - статуси оновлення DOM і state
     */
    function setShapeText(shapeId, text) {
        // Перевіряємо вхідні дані
        if (!shapeId || typeof text !== 'string') {
            console.error('setShapeText: Некоректні параметри', { shapeId, text });
            return { dom: false, state: false };
        }
        
        let domSuccess = false;
        let stateSuccess = false;
        
        // Оновлюємо в DOM
        const shapeElement = getShapeById(shapeId);
        if (shapeElement) {
            const content = shapeElement.querySelector('.content');
            if (content) {
                // Запам'ятовуємо старий текст для логу
                const oldText = content.textContent;
                
                // Оновлюємо текст у DOM
                content.textContent = text;
                console.log(`DOM: Текст фігури ${shapeId} оновлено з "${oldText}" на "${text}"`);
                domSuccess = true;
            } else {
                console.error(`DOM: У фігурі ${shapeId} не знайдено елемент .content`);
            }
        } else {
            console.error(`DOM: Фігуру з id ${shapeId} не знайдено в DOM`);
        }
        
        // Оновлюємо в state незалежно від успіху в DOM
        const index = getShapeIndexInState(shapeId);
        if (index !== -1) {
            // Запам'ятовуємо старий текст для логу
            const oldText = state.shapes[index].text;
            
            // Оновлюємо текст у state
            state.shapes[index].text = text;
            console.log(`STATE: Текст фігури ${shapeId} оновлено з "${oldText}" на "${text}"`);
            stateSuccess = true;
        } else {
            console.error(`STATE: Фігуру з id ${shapeId} не знайдено в state`);
        }
        
        return { dom: domSuccess, state: stateSuccess };
    }
    
    /**
     * Оновлює текст фігури і в DOM, і в масиві state.shapes
     * @param {HTMLElement} element - DOM-елемент фігури
     * @param {string} newText - Новий текст для фігури
     */
    function updateShapeText(element, newText) {
        if (!element || !element.id) return;
        
        // Оновлюємо текст в DOM
        const content = element.querySelector('.content');
        if (content) {
            content.textContent = newText;
        }
        
        // Оновлюємо текст в state.shapes
        const shapeId = element.id;
        const shapeIndex = state.shapes.findIndex(s => s.id === shapeId);
        if (shapeIndex >= 0) {
            state.shapes[shapeIndex].text = newText;
            console.log(`Текст фігури ${shapeId} оновлено на "${newText}"`);
        } else {
            console.error(`Фігуру з id ${shapeId} не знайдено в state.shapes!`);
        }
    }
    
    /**
     * Створює нову фігуру на полотні
     * @param {string} type - Тип фігури (start-end, process, decision, input-output)
     * @param {string} color - Колір фігури (HEX)
     * @param {string} textValue - Текст для фігури
     * @returns {HTMLElement} - Створений DOM-елемент фігури
     */
    function createShape(type, color, textValue) {
        state.shapeCounter++;
        const shapeId = `shape-${state.shapeCounter}`;
        
        // Встановлюємо початковий колір для кожного типу фігури
        let defaultColor = color;
        if (!textValue) { // Якщо це не завантаження збереженої схеми
            switch (type) {
                case 'start-end':
                    defaultColor = '#4caf50'; // зелений
                    break;
                case 'process':
                    defaultColor = 'rgb(3, 169, 244)'; // блакитний
                    break;
                case 'decision':
                    defaultColor = '#ff9800'; // помаранчевий
                    break;
                case 'input-output':
                    defaultColor = '#3f51b5'; // фіолетовий
                    break;
            }
        }
        
        // Створюємо DOM-елемент
        const shape = document.createElement('div');
        shape.id = shapeId;
        shape.className = `shape ${type}`;
        // Для "Дія" завжди встановлюємо блакитний колір
        if (type === 'process') {
            shape.style.backgroundColor = 'rgb(3, 169, 244)';
            shape.style.color = '#fff';
        } else {
            shape.style.backgroundColor = defaultColor;
        }
        
        // Встановлюємо початкову позицію з урахуванням масштабу
        const containerRect = canvasContainer.getBoundingClientRect();
        const scrollLeft = canvasContainer.scrollLeft;
        const scrollTop = canvasContainer.scrollTop;
        
        // Центр видимої області з урахуванням масштабу
        const centerX = (scrollLeft + containerRect.width / 2) / state.scale;
        const centerY = (scrollTop + containerRect.height / 3) / state.scale;
        
        shape.style.left = `${Math.max(50, Math.min(canvas.offsetWidth / state.scale - 150, centerX - 50))}px`;
        shape.style.top = `${Math.max(50, Math.min(canvas.offsetHeight / state.scale - 150, centerY - 50))}px`;
        
        // Визначаємо початковий текст
        const initialText = textValue || getDefaultText(type);
        
        // Додаємо контейнер для тексту
        const content = document.createElement('div');
        content.className = 'content';
        content.textContent = initialText;
        shape.appendChild(content);
        
        // Додаємо фігуру до DOM
        canvas.appendChild(shape);
        
        // Додаємо до масиву фігур
        state.shapes.push({
            id: shapeId,
            type: type,
            color: color,
            text: initialText
        });
        
        console.log(`Створено фігуру ${shapeId} типу ${type} з текстом "${initialText}"`);
        
        // Робимо фігуру перетягуваною
        makeShapeDraggable(shape);
        
        // Додаємо обробник подвійного кліку для редагування тексту
        shape.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            console.log(`Відкриваємо редактор для фігури ${this.id}`);
            
            // Зберігаємо посилання на активну фігуру
            state.activeShape = this;
            
            // Отримуємо поточний текст з DOM
            const content = this.querySelector('.content');
            if (content) {
                // Отримуємо основний текст, видаляючи дочірні елементи (мітки Так/Ні)
                let currentText = '';
                // Беремо тільки текстовий вміст першого вузла (основний текст)
                for (let i = 0; i < content.childNodes.length; i++) {
                    if (content.childNodes[i].nodeType === 3) { // 3 = TEXT_NODE
                        currentText += content.childNodes[i].textContent;
                    }
                }
                currentText = currentText.trim();
                
                shapeText.value = currentText;
                console.log(`Поточний текст: "${currentText}"`);
            } else {
                console.warn(`У фігурі ${this.id} не знайдено елемент .content`);
                shapeText.value = '';
            }
            
            // Показуємо модальне вікно
            textModal.style.display = 'flex';
        });
        
        // Додаємо обробник кліку для вибору фігури
        shape.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (state.isConnecting) {
                // Режим з'єднання фігур
                if (!state.firstSelectedShape) {
                    // Вибрана перша фігура
                    state.firstSelectedShape = this;
                    this.classList.add('selected');
                } else if (state.firstSelectedShape !== this) {
                    // Вибрана друга фігура
                    const fromShapeIndex = getShapeIndexInState(state.firstSelectedShape.id);
                    
                    // Запам'ятовуємо другу фігуру
                    state.secondSelectedShape = this;
                    
                    // Якщо перша фігура - блок рішення з типом Так/Ні, показуємо модальне вікно з вибором типу з'єднання
                    if (fromShapeIndex !== -1 && state.shapes[fromShapeIndex].type === 'decision') {
                        connectionModal.style.display = 'flex';
                    } else {
                        // Для інших типів фігур - просто з'єднуємо
                        connectShapes(state.firstSelectedShape, this);
                        
                        // Скидаємо стан з'єднання
                        resetConnectionState();
                    }
                }
            } else {
                // Звичайний режим вибору
                if (state.selectedShape) {
                    state.selectedShape.classList.remove('selected');
                }
                
                state.selectedShape = this;
                this.classList.add('selected');
                
                // Оновлюємо вибір кольору відповідно до кольору фігури
                const shapeColor = this.style.backgroundColor;
                // Конвертуємо RGB у HEX, якщо потрібно
                const hexColor = rgbToHex(shapeColor);
                
                colorOptions.forEach(opt => {
                    if (opt.getAttribute('data-color').toLowerCase() === hexColor.toLowerCase()) {
                        colorOptions.forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        state.currentColor = hexColor;
                    }
                });
            }
        });
        
        return shape;
    }
    
    /**
     * Робить фігуру перетягуваною
     * @param {HTMLElement} element - DOM-елемент фігури
     */
    function makeShapeDraggable(element) {
        element.addEventListener('mousedown', function(e) {
            if (state.isConnecting) return; // Забороняємо перетягування в режимі з'єднання
            
            // Використовуємо позицію елемента, а не кліка для запобігання перестрибування
            const computedStyle = window.getComputedStyle(element);
            const currentLeft = parseInt(computedStyle.left);
            const currentTop = parseInt(computedStyle.top);
            
            // Позиція кліка відносно канвасу з урахуванням масштабу
            const canvasRect = canvas.getBoundingClientRect();
            const clickX = (e.clientX - canvasRect.left) / state.scale;
            const clickY = (e.clientY - canvasRect.top) / state.scale;
            
            // Зберігаємо різницю між позицією кліка та верхнім лівим кутом елемента
            state.offsetX = clickX - currentLeft;
            state.offsetY = clickY - currentTop;
            
            state.isDragging = true;
            state.activeShape = element;
            
            // Запобігаємо виділенню тексту під час перетягування
            e.preventDefault();
        });
    }
    
    /**
     * З'єднує дві фігури стрілкою
     * @param {HTMLElement} fromShape - Фігура, від якої йде з'єднання
     * @param {HTMLElement} toShape - Фігура, до якої йде з'єднання
     * @param {string} connectionType - Тип з'єднання ('yes', 'no' або null)
     * @returns {SVGElement} - Створений SVG-елемент з'єднання
     */
    function connectShapes(fromShape, toShape, connectionType = null) {
        let connectionId;
        if (connectionType) {
            connectionId = `conn-${fromShape.id}-${toShape.id}-${connectionType}`;
        } else {
            connectionId = `conn-${fromShape.id}-${toShape.id}`;
        }
        if (state.connections.some(conn => conn.id === connectionId)) {
            alert("Ці фігури вже з'єднані!");
            return null;
        }
        // Додаємо лінію у єдиний SVG-шар
        const svgLayer = document.getElementById('connectors-layer');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('id', connectionId);
        if (connectionType === 'yes') {
            line.setAttribute('stroke', '#6aa84f');
            line.setAttribute('marker-end', 'url(#arrowhead-yes)');
        } else if (connectionType === 'no') {
            line.setAttribute('stroke', '#e06666');
            line.setAttribute('marker-end', 'url(#arrowhead-no)');
        } else {
            line.setAttribute('stroke', '#333');
            line.setAttribute('marker-end', 'url(#arrowhead)');
        }
        line.setAttribute('stroke-width', '2');
        svgLayer.appendChild(line);
        state.connections.push({
            id: connectionId,
            from: fromShape.id,
            to: toShape.id,
            type: connectionType
        });
        updateConnection(connectionId);
        if (connectionType) {
            addConnectionLabel(connectionId, connectionType);
        }
        return line;
    }
    
    /**
     * Додає мітку до з'єднання (Так/Ні)
     * @param {string} connectionId - ID з'єднання
     * @param {string} labelType - Тип мітки ('yes' або 'no')
     */
    function addConnectionLabel(connectionId, labelType) {
        const connection = state.connections.find(conn => conn.id === connectionId);
        if (!connection) return;
        
        // Створюємо групу для мітки в SVG
        const svgLayer = document.getElementById('connectors-layer');
        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.id = `label-${connectionId}`;
        
        // Створюємо фон (прямокутник з закругленими кутами)
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('rx', '10');
        background.setAttribute('ry', '10');
        background.setAttribute('fill', 'white');
        background.setAttribute('stroke', labelType === 'yes' ? '#6aa84f' : '#e06666');
        background.setAttribute('stroke-width', '1');
        
        // Створюємо текст
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('fill', labelType === 'yes' ? '#6aa84f' : '#e06666');
        text.setAttribute('font-family', "'Roboto', Arial, sans-serif");
        text.setAttribute('font-size', '12px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = labelType === 'yes' ? 'Так' : 'Ні';
        
        // Додаємо елементи до групи
        labelGroup.appendChild(background);
        labelGroup.appendChild(text);
        
        // Додаємо групу до SVG
        svgLayer.appendChild(labelGroup);
        
        // Встановлюємо початкову позицію мітки
        updateConnectionLabel(connectionId);
    }
    
    /**
     * Оновлює позицію мітки з'єднання
     * @param {string} connectionId - ID з'єднання
     */
    function updateConnectionLabel(connectionId) {
        const labelGroup = document.getElementById(`label-${connectionId}`);
        if (!labelGroup) return;
        
        const line = document.getElementById(connectionId);
        if (!line) return;
        
        // Отримуємо координати лінії
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        
        // Розміщуємо мітку посередині лінії, зі зміщенням
        const labelX = (x1 + x2) / 2;
        const labelY = (y1 + y2) / 2;
        
        // Отримуємо елементи мітки
        const text = labelGroup.querySelector('text');
        const background = labelGroup.querySelector('rect');
        
        // Встановлюємо позицію тексту
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        
        // Встановлюємо розмір і позицію фону
        // Відступ навколо тексту
        const padding = 5;
        
        // Отримуємо розміри тексту
        const textBBox = text.getBBox();
        
        // Встановлюємо атрибути фону
        background.setAttribute('x', textBBox.x - padding);
        background.setAttribute('y', textBBox.y - padding);
        background.setAttribute('width', textBBox.width + 2 * padding);
        background.setAttribute('height', textBBox.height + 2 * padding);
    }
    
    /**
     * Повертає текст за замовчуванням для різних типів фігур
     * @param {string} type - Тип фігури
     * @returns {string} - Текст за замовчуванням
     */
    function getDefaultText(type) {
        switch (type) {
            case 'start-end': return 'Початок';
            case 'process': return 'Дія';
            case 'decision': return 'Умова?';
            case 'input-output': return 'Ввід/Вивід';
            default: return '';
        }
    }
    
    /**
     * Конвертує RGB-формат кольору в HEX
     * @param {string} rgb - Колір у форматі RGB або RGBA або HEX
     * @returns {string} - Колір у форматі HEX
     */
    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return '#ffffff';
        // Якщо вже HEX — повертаємо як є
        if (rgb.startsWith('#')) return rgb;
        // rgb або rgba
        let match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (match) {
            return '#' + [1,2,3].map(i => (+match[i]).toString(16).padStart(2,'0')).join('');
        }
        match = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d\.]+)\)$/);
        if (match) {
            return '#' + [1,2,3].map(i => (+match[i]).toString(16).padStart(2,'0')).join('');
        }
        return '#ffffff';
    }
    
    /**
     * Завантажує блок-схему з JSON-даних
     * @param {Object} data - Дані схеми
     */
    function loadFlowchart(data) {
        if (!data || !data.shapes || !data.connections) {
            console.error("Некоректні дані для завантаження");
            return;
        }
        
        // Очищаємо поточну схему
        state.shapes.forEach(shape => {
            const element = document.getElementById(shape.id);
            if (element) element.remove();
        });
        
        state.connections.forEach(conn => {
            const line = document.getElementById(conn.id);
            if (line) line.remove();
        });
        
        state.shapes = [];
        state.connections = [];
        
        // Відновлюємо лічильник фігур
        state.shapeCounter = 0;
        
        // Створюємо фігури
        data.shapes.forEach(shapeData => {
            const shape = createShape(shapeData.type, shapeData.color, shapeData.text);
            shape.style.left = shapeData.left || '0px';
            shape.style.top = shapeData.top || '0px';
            
            // Оновлюємо ID для збереження оригінальних ідентифікаторів
            if (shapeData.id) {
                const oldId = shape.id;
                shape.id = shapeData.id;
                
                // Оновлюємо запис в масиві
                const shapeIndex = state.shapes.findIndex(s => s.id === oldId);
                if (shapeIndex >= 0) {
                    state.shapes[shapeIndex].id = shapeData.id;
                }
                
                // Витягуємо номер з ID для оновлення лічильника
                const match = shapeData.id.match(/shape-(\d+)/);
                if (match && match[1]) {
                    const num = parseInt(match[1]);
                    if (num > state.shapeCounter) {
                        state.shapeCounter = num;
                    }
                }
            }
        });
        
        // Відновлюємо з'єднання
        data.connections.forEach(connData => {
            const fromShape = document.getElementById(connData.from);
            const toShape = document.getElementById(connData.to);
            
            if (fromShape && toShape) {
                connectShapes(fromShape, toShape, connData.type);
            }
        });
    }
    
    /**
     * Створює початкові фігури для демонстрації
     */
    function createInitialShapes() {
        console.log("Створення початкових фігур...");
        
        // Отримуємо розміри видимої області контейнера для центрування
        const containerRect = canvasContainer.getBoundingClientRect();
        const scrollLeft = canvasContainer.scrollLeft;
        const scrollTop = canvasContainer.scrollTop;
        const centerX = containerRect.width / 2 + scrollLeft;
        const centerY = containerRect.height / 3 + scrollTop; // Розміщуємо у верхній третині
        
        // Створюємо фігуру "Початок"
        const startShape = createShape('start-end', '#6aa84f', 'Початок');
        startShape.style.left = `${centerX - 50}px`;
        startShape.style.top = `${centerY - 100}px`;
        
        // Створюємо фігуру "Дія"
        const processShape = createShape('process', '#f3f3f3', 'Моя дія');
        processShape.style.left = `${centerX - 50}px`;
        processShape.style.top = `${centerY}px`;
        
        // З'єднуємо фігури
        connectShapes(startShape, processShape);
        
        console.log("Початкові фігури створено та поєднано");
        
        // Відладкова інформація
        console.log("Стан:", state.shapes);
    }
    
    // ============= Ініціалізація обробників подій =============
    
    // Делегування для створення фігур
    document.querySelector('.shape-buttons').addEventListener('click', function(e) {
        const btn = e.target.closest('.shape-button');
        if (btn) {
            state.currentShapeType = btn.getAttribute('data-shape');
            createShape(state.currentShapeType, state.currentColor);
        }
    });
    
    // Делегування для вибору кольору
    document.querySelector('.color-picker').addEventListener('click', function(e) {
        const option = e.target.closest('.color-option');
        if (option) {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            state.currentColor = option.getAttribute('data-color');
            if (state.selectedShape) {
                state.selectedShape.style.backgroundColor = state.currentColor;
            }
        }
    });
    
    /**
     * Обробник події для кнопки "З'єднати фігури"
     * Перемикає режим з'єднання фігур
     */
    connectButton.addEventListener('click', function() {
        if (state.isConnecting) {
            // Вимикаємо режим з'єднання
            resetConnectionState();
        } else {
            // Вмикаємо режим з'єднання
            state.isConnecting = true;
            this.textContent = "Скасувати з'єднання";
            this.style.backgroundColor = '#ffcc00';
        }
    });
    
    /**
     * Обробник події для кнопки "Видалити"
     * Видаляє вибрану фігуру та всі з'єднання з нею
     */
    deleteButton.addEventListener('click', function() {
        if (state.selectedShape) {
            // Видаляємо з'єднання, пов'язані з цією фігурою
            state.connections = state.connections.filter(conn => {
                if (conn.from === state.selectedShape.id || conn.to === state.selectedShape.id) {
                    // Видаляємо <line> з єдиного SVG
                    const line = document.getElementById(conn.id);
                    if (line) line.remove();
                    // Видаляємо мітку з'єднання, якщо вона є
                    const label = document.getElementById(`label-${conn.id}`);
                    if (label) label.remove();
                    return false;
                }
                return true;
            });
            
            // Видаляємо саму фігуру
            state.shapes = state.shapes.filter(shape => shape.id !== state.selectedShape.id);
            state.selectedShape.remove();
            state.selectedShape = null;
        }
    });
    
    /**
     * Обробник події для кнопки "Очистити все"
     * Видаляє всі фігури та з'єднання з полотна
     */
    clearButton.addEventListener('click', function() {
        showConfirmModal("Ви впевнені, що хочете видалити всі фігури?", function() {
            // Видаляємо всі фігури з DOM
            state.shapes.forEach(shape => {
                const element = document.getElementById(shape.id);
                if (element) {
                    element.remove();
                }
            });
            
            // Видаляємо всі з'єднання та їх мітки з DOM
            state.connections.forEach(conn => {
                // Видаляємо <line> з єдиного SVG
                const line = document.getElementById(conn.id);
                if (line) line.remove();
                // Видаляємо мітку з'єднання, якщо вона є
                const label = document.getElementById(`label-${conn.id}`);
                if (label) label.remove();
            });
            
            // Скидаємо стан
            state.shapes = [];
            state.connections = [];
            state.selectedShape = null;
            resetConnectionState();
        });
    });
    
    /**
     * Обробник події для кнопки "Зберегти"
     * У повній версії тут має бути код для збереження схеми
     */
    saveButton.addEventListener('click', function() {
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) {
            showMessageModal('Не знайдено область для збереження блок-схеми!');
            return;
        }
        // Приховуємо елементи зміни масштабу перед збереженням
        const zoomControls = document.querySelector('.zoom-controls');
        if (zoomControls) zoomControls.style.display = 'none';
        html2canvas(canvasContainer).then(function(canvas) {
            // Повертаємо елементи зміни масштабу після збереження
            if (zoomControls) zoomControls.style.display = '';
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'моя_блок-схема.png';
                a.click();
                URL.revokeObjectURL(url);
                showMessageModal("Твоя блок-схема успішно збережена як зображення!");
            });
        });
    });
    
    /**
     * Обробники для модального вікна вводу тексту
     */
    cancelText.addEventListener('click', function() {
        state.activeShape = null;
        textModal.style.display = 'none';
    });
    
    saveText.addEventListener('click', function() {
        if (state.activeShape) {
            const shapeId = state.activeShape.id;
            const newText = shapeText.value;
            
            console.log(`Спроба оновити текст для фігури ${shapeId} на "${newText}"`);
            const result = setShapeText(shapeId, newText);
            if (result.dom && result.state) {
                console.log(`Текст фігури ${shapeId} успішно оновлено`);
            } else if (!result.dom && !result.state) {
                console.error(`Не вдалося оновити текст фігури ${shapeId} ані в DOM, ані в state`);
            } else if (!result.dom) {
                console.error(`Текст фігури ${shapeId} оновлено в state, але не в DOM`);
            } else if (!result.state) {
                console.error(`Текст фігури ${shapeId} оновлено в DOM, але не в state`);
            }
        } else {
            console.warn('saveText: state.activeShape є null');
        }
        
        // Скидаємо активну фігуру
        state.activeShape = null;
        textModal.style.display = 'none';
    });
    
    /**
     * Обробник для кнопки довідки
     */
    helpButton.addEventListener('click', function() {
        helpContent.classList.toggle('active');
    });
    
    /**
     * Обробник кліку на полотні
     * Знімає виділення з поточної фігури при кліку в порожньому місці полотна
     */
    canvas.addEventListener('pointerdown', function(e) {
        // Якщо клік по самому полотну (а не по фігурі)
        if (e.target === canvas && !state.isConnecting) {
            if (state.selectedShape) {
                state.selectedShape.classList.remove('selected');
                state.selectedShape = null;
            }
        }
    });
    
    /**
     * Обробник події руху миші для перетягування фігур
     */
    document.addEventListener('mousemove', function(e) {
        if (!state.isDragging || !state.activeShape) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        
        // Обчислюємо нову позицію елемента з урахуванням зміщення та масштабу
        const newX = (e.clientX - canvasRect.left) / state.scale - state.offsetX;
        const newY = (e.clientY - canvasRect.top) / state.scale - state.offsetY;
        
        // Обмежуємо позицію в межах полотна
        const canvasWidth = canvas.offsetWidth / state.scale;
        const canvasHeight = canvas.offsetHeight / state.scale;
        const shapeWidth = state.activeShape.offsetWidth;
        const shapeHeight = state.activeShape.offsetHeight;
        
        // Оновлюємо позицію фігури з урахуванням обмежень
        state.activeShape.style.left = `${Math.max(0, Math.min(canvasWidth - shapeWidth, newX))}px`;
        state.activeShape.style.top = `${Math.max(0, Math.min(canvasHeight - shapeHeight, newY))}px`;
        
        // Оновлюємо з'єднання
        updateConnections(state.activeShape.id);
    });
    
    /**
     * Обробник події відпускання кнопки миші
     */
    document.addEventListener('mouseup', function() {
        if (state.isDragging) {
            state.isDragging = false;
            state.activeShape = null;
        }
    });
    
    // Додаємо функцію завантаження схеми через Drag&Drop
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const data = JSON.parse(event.target.result);
                        loadFlowchart(data);
                    } catch (error) {
                        console.error("Помилка при завантаженні файлу:", error);
                        showMessageModal("Помилка при завантаженні файлу блок-схеми");
                    }
                };
                reader.readAsText(file);
            } else {
                showMessageModal("Будь ласка, виберіть файл у форматі JSON");
            }
        }
    });
    
    // === Модальне вікно для повідомлень/підтверджень ===
    function showMessageModal(text, onClose) {
        const modal = document.getElementById('message-modal');
        const textDiv = document.getElementById('message-modal-text');
        const buttonsDiv = document.getElementById('message-modal-buttons');
        textDiv.innerHTML = text;
        buttonsDiv.innerHTML = '';
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.className = 'modal-button save';
        okBtn.onclick = function() {
            modal.classList.remove('active');
            modal.style.display = 'none';
            if (onClose) onClose();
        };
        buttonsDiv.appendChild(okBtn);
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
    function showConfirmModal(text, onOk, onCancel) {
        const modal = document.getElementById('message-modal');
        const textDiv = document.getElementById('message-modal-text');
        const buttonsDiv = document.getElementById('message-modal-buttons');
        textDiv.innerHTML = text;
        buttonsDiv.innerHTML = '';
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.className = 'modal-button save';
        okBtn.onclick = function() {
            modal.classList.remove('active');
            modal.style.display = 'none';
            if (onOk) onOk();
        };
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Скасувати';
        cancelBtn.className = 'modal-button cancel';
        cancelBtn.onclick = function() {
            modal.classList.remove('active');
            modal.style.display = 'none';
            if (onCancel) onCancel();
        };
        buttonsDiv.appendChild(okBtn);
        buttonsDiv.appendChild(cancelBtn);
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
    
    // === Кінець модального вікна для повідомлень/підтверджень ===
    
    // Створюємо початкові фігури з затримкою для коректного рендеринга
    setTimeout(createInitialShapes, 500);
    
    /**
     * Оновлює всі з'єднання, пов'язані з конкретною фігурою
     * @param {string} shapeId - Ідентифікатор фігури
     */
    function updateConnections(shapeId) {
        state.connections.forEach(conn => {
            if (conn.from === shapeId || conn.to === shapeId) {
                updateConnection(conn.id);
                
                // Якщо це з'єднання з міткою, оновлюємо також мітку
                if (conn.type) {
                    updateConnectionLabel(conn.id);
                }
            }
        });
    }
    
    /**
     * Оновлює позицію конкретного з'єднання
     * @param {string} connectionId - Ідентифікатор з'єднання
     */
    function updateConnection(connectionId) {
        const connection = state.connections.find(conn => conn.id === connectionId);
        if (!connection) return;
        
        const fromShape = document.getElementById(connection.from);
        const toShape = document.getElementById(connection.to);
        
        if (!fromShape || !toShape) return;
        
        const line = document.getElementById(connectionId);
        if (!line) return;
        
        const fromRect = fromShape.getBoundingClientRect();
        const toRect = toShape.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        // Обчислюємо центральні точки фігур
        // НЕ ділимо на state.scale, бо блоки вже відмасштабовані
        const fromX = (fromRect.left + fromRect.width / 2 - canvasRect.left);
        const fromY = (fromRect.top + fromRect.height / 2 - canvasRect.top);
        const toX = (toRect.left + toRect.width / 2 - canvasRect.left);
        const toY = (toRect.top + toRect.height / 2 - canvasRect.top);
        
        // Встановлюємо координати лінії
        line.setAttribute('x1', fromX);
        line.setAttribute('y1', fromY);
        line.setAttribute('x2', toX);
        line.setAttribute('y2', toY);
    }
    
    /**
     * Скидає стан режиму з'єднання фігур
     */
    function resetConnectionState() {
        if (state.firstSelectedShape) {
            state.firstSelectedShape.classList.remove('selected');
        }
        state.firstSelectedShape = null;
        state.secondSelectedShape = null;
        state.isConnecting = false;
        connectButton.textContent = "З'єднати фігури";
        connectButton.style.backgroundColor = '';
    }
    
    // Обробники подій для модального вікна з'єднання
    connectionYesBtn.addEventListener('click', function() {
        if (state.firstSelectedShape && state.secondSelectedShape) {
            // З'єднуємо фігури з типом "Так"
            connectShapes(state.firstSelectedShape, state.secondSelectedShape, 'yes');
            
            // Закриваємо модальне вікно
            connectionModal.style.display = 'none';
            
            // Скидаємо стан з'єднання
            resetConnectionState();
        }
    });
    
    connectionNoBtn.addEventListener('click', function() {
        if (state.firstSelectedShape && state.secondSelectedShape) {
            // З'єднуємо фігури з типом "Ні"
            connectShapes(state.firstSelectedShape, state.secondSelectedShape, 'no');
            
            // Закриваємо модальне вікно
            connectionModal.style.display = 'none';
            
            // Скидаємо стан з'єднання
            resetConnectionState();
        }
    });
    
    cancelConnection.addEventListener('click', function() {
        // Просто закриваємо модальне вікно без з'єднання
        connectionModal.style.display = 'none';
        
        // Скидаємо стан з'єднання
        resetConnectionState();
    });

    // ============= Панорамування канвасу мишею =============
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panScroll = { left: 0, top: 0 };

    canvasContainer.addEventListener('pointerdown', function(e) {
        // Тільки якщо клік по порожньому місцю (не по фігурі) і права/середня кнопка, або торкання
        if (
            (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2)) ||
            (e.pointerType === 'mouse' && e.button === 0 && e.target === canvas) ||
            (e.pointerType !== 'mouse' && e.target === canvas)
        ) {
            isPanning = true;
            panStart = { x: e.clientX, y: e.clientY };
            panScroll = { left: canvasContainer.scrollLeft, top: canvasContainer.scrollTop };
            canvasContainer.setPointerCapture(e.pointerId);
            canvasContainer.style.cursor = 'grab';
            e.preventDefault();
        }
    });

    document.addEventListener('pointermove', function(e) {
        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            canvasContainer.scrollLeft = panScroll.left - dx;
            canvasContainer.scrollTop = panScroll.top - dy;
        }
    });

    document.addEventListener('pointerup', function(e) {
        if (isPanning) {
            isPanning = false;
            canvasContainer.releasePointerCapture && canvasContainer.releasePointerCapture(e.pointerId);
            canvasContainer.style.cursor = '';
        }
    });

    // Відключаємо контекстне меню на канвасі для зручності панорамування
    canvasContainer.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    const helpClose = document.getElementById('help-close');
    if (helpClose) {
        helpClose.addEventListener('click', function() {
            helpContent.classList.remove('active');
        });
    }
});