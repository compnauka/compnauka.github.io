document.addEventListener('DOMContentLoaded', function () {

    let currentColor = '#000000';
    let currentTool = 'pencil';
    let isDrawing = false;
    let canvasSize = 16;
    let pixelStates = [];

    const canvas = document.getElementById('pixel-canvas');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    const colorOptions = document.querySelectorAll('.color-option');
    const toolButtons = document.querySelectorAll('.tool-button');
    const sizeOptions = document.querySelectorAll('.size-option');
    const successMsg = document.getElementById('success-message');

    // ====== Додаємо підтримку клавіатури для інтерактивних елементів ======
    function addKeyboardSupport(elements) {
        elements.forEach(el => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        });
    }
    addKeyboardSupport(colorOptions);
    addKeyboardSupport(toolButtons);
    addKeyboardSupport(sizeOptions);

    // ====== Розрахунок розміру пікселя ======
    function getPixelSize() {
        const wrapper = document.querySelector('.canvas-wrapper');
        const availW = Math.max(wrapper.clientWidth - 45, 120);
        const availH = Math.max(wrapper.clientHeight - 45, 120);

        const byW = Math.floor(availW / canvasSize);
        const byH = Math.floor(availH / canvasSize);

        return Math.max(6, Math.min(byW, byH, 50));
    }

    // ====== Ініціалізація полотна ======
    function initCanvas() {
        canvas.innerHTML = '';
        const ps = getPixelSize();

        canvas.style.gridTemplateColumns = `repeat(${canvasSize}, ${ps}px)`;
        canvas.style.gridTemplateRows = `repeat(${canvasSize}, ${ps}px)`;

        pixelStates = Array.from({ length: canvasSize }, () => Array(canvasSize).fill('#ffffff'));

        for (let y = 0; y < canvasSize; y++) {
            for (let x = 0; x < canvasSize; x++) {
                const pixel = document.createElement('div');
                pixel.className = 'pixel';
                pixel.dataset.x = x;
                pixel.dataset.y = y;

                pixel.addEventListener('mousedown', startDrawing);
                pixel.addEventListener('mouseover', draw);
                pixel.addEventListener('touchstart', handleTouchStart, { passive: false });
                pixel.addEventListener('touchmove', handleTouchMove, { passive: false });

                canvas.appendChild(pixel);
            }
        }

        document.addEventListener('mouseup', stopDrawing);
        document.addEventListener('touchend', stopDrawing);
    }

    // ====== Touch-події ======
    function handleTouchStart(e) {
        e.preventDefault();
        startDrawing({ target: this });
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.classList.contains('pixel')) draw({ target: el });
    }

    // ====== Малювання ======
    function startDrawing(e) { isDrawing = true; draw(e); }
    function stopDrawing() { isDrawing = false; }

    function draw(e) {
        if (!isDrawing) return;
        const pixel = e.target;
        if (!pixel || !pixel.classList.contains('pixel')) return;

        if ('vibrate' in navigator) navigator.vibrate(4);

        const x = +pixel.dataset.x;
        const y = +pixel.dataset.y;

        if (currentTool === 'pencil') {
            pixel.style.backgroundColor = currentColor;
            pixelStates[y][x] = currentColor;

        } else if (currentTool === 'eraser') {
            pixel.style.backgroundColor = '#ffffff';
            pixelStates[y][x] = '#ffffff';

        } else if (currentTool === 'fill') {
            const targetColor = pixelStates[y][x];
            if (targetColor === currentColor) return;

            const stack = [{ x, y }];
            const visited = new Set();

            while (stack.length) {
                const cur = stack.pop();
                const key = `${cur.x},${cur.y}`;
                if (visited.has(key)) continue;
                visited.add(key);

                if (cur.x < 0 || cur.x >= canvasSize || cur.y < 0 || cur.y >= canvasSize) continue;

                if (pixelStates[cur.y][cur.x] !== targetColor) continue;

                pixelStates[cur.y][cur.x] = currentColor;
                const p = document.querySelector(`.pixel[data-x="${cur.x}"][data-y="${cur.y}"]`);
                if (p) p.style.backgroundColor = currentColor;

                stack.push(
                    { x: cur.x + 1, y: cur.y },
                    { x: cur.x - 1, y: cur.y },
                    { x: cur.x, y: cur.y + 1 },
                    { x: cur.x, y: cur.y - 1 }
                );
            }
            if ('vibrate' in navigator) navigator.vibrate([25, 35, 25]);
        }
    }

    // ====== Очищення ======
    async function clearCanvas() {
        const ok = await showModal('Справді очистити весь малюнок?', 'Очистити', 'Назад');
        if (!ok) return;
        document.querySelectorAll('.pixel').forEach(p => {
            p.style.backgroundColor = '#ffffff';
            pixelStates[+p.dataset.y][+p.dataset.x] = '#ffffff';
        });
        if ('vibrate' in navigator) navigator.vibrate([50, 80, 50]);
    }

    // ====== Збереження ======
    function saveCanvas() {
        const scale = 10;
        const tmp = document.createElement('canvas');
        tmp.width = canvasSize * scale;
        tmp.height = canvasSize * scale;
        const ctx = tmp.getContext('2d');

        for (let y = 0; y < canvasSize; y++) {
            for (let x = 0; x < canvasSize; x++) {
                ctx.fillStyle = pixelStates[y][x];
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        const url = tmp.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'мій-піксель-малюнок.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        successMsg.style.display = 'block';
        successMsg.style.animation = 'none';
        void successMsg.offsetWidth;
        successMsg.style.animation = 'toastIn 2.2s ease-in-out forwards';
        setTimeout(() => { successMsg.style.display = 'none'; }, 2400);

        if ('vibrate' in navigator) navigator.vibrate([30, 50, 100]);
    }

    // ====== Вибір кольору ======
    colorOptions.forEach(opt => {
        opt.addEventListener('click', function () {
            currentColor = this.dataset.color;
            colorOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            if (currentTool !== 'pencil') {
                currentTool = 'pencil';
                toolButtons.forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.tool === 'pencil') b.classList.add('active');
                });
            }
        });
    });

    // ====== Вибір інструмента ======
    toolButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            currentTool = this.dataset.tool;
            toolButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if ('vibrate' in navigator) navigator.vibrate(15);
        });
    });

    // ====== Вибір розміру ======
    sizeOptions.forEach(opt => {
        opt.addEventListener('click', async function () {
            const newSize = +this.dataset.size;
            if (canvasSize === newSize) return;
            const ok = await showModal('Змінити розмір? Поточний малюнок буде очищено!', 'Змінити', 'Назад');
            if (!ok) return;
            canvasSize = newSize;
            sizeOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            initCanvas();
        });
    });

    // ====== Обробник зміни розміру вікна ======
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const saved = pixelStates.map(row => [...row]);
            initCanvas();
            const minR = Math.min(saved.length, canvasSize);
            const minC = saved[0] ? Math.min(saved[0].length, canvasSize) : 0;
            for (let y = 0; y < minR; y++) {
                for (let x = 0; x < minC; x++) {
                    if (saved[y]?.[x] && saved[y][x] !== '#ffffff') {
                        const p = document.querySelector(`.pixel[data-x="${x}"][data-y="${y}"]`);
                        if (p) {
                            p.style.backgroundColor = saved[y][x];
                            pixelStates[y][x] = saved[y][x];
                        }
                    }
                }
            }
        }, 180);
    });

    // ====== Модальне вікно ======
    function showModal(message, okText, cancelText) {
        return new Promise(resolve => {
            const overlay = document.getElementById('modal-overlay');
            const msgEl = document.getElementById('modal-message');
            const okBtn = document.getElementById('modal-ok');
            const cancelBtn = document.getElementById('modal-cancel');
            msgEl.textContent = message;
            okBtn.textContent = okText;
            cancelBtn.textContent = cancelText;
            overlay.style.display = 'flex';

            function done(r) {
                overlay.style.display = 'none';
                okBtn.removeEventListener('click', yes);
                cancelBtn.removeEventListener('click', no);
                resolve(r);
            }
            function yes() { done(true); }
            function no() { done(false); }
            okBtn.addEventListener('click', yes);
            cancelBtn.addEventListener('click', no);
        });
    }

    // ====== Допоміжна функція перетворення кольору (для сумісності) ======
    window.rgbToHex = function (rgb) {
        if (!rgb) return '#ffffff';
        if (rgb.startsWith('#')) return rgb.toLowerCase();
        if (rgb === 'white') return '#ffffff';
        const r = rgb.match(/\d+/g);
        if (!r || r.length < 3) return '#ffffff';
        return '#' + r.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
    };

    // ====== Запуск ======
    initCanvas();
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveCanvas);
});