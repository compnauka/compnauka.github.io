class WindowTrainer {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.streak = 0;
        this.currentTask = null;
        this.timeLimit = 8000; // 8 секунд
        this.timer = null;
        this.isGameActive = false;
        this.currentLanguage = 'uk';

        this.apps = [
            { name: 'TextEditor Pro', icon: '<i class="fa-solid fa-file-alt"></i>', color: '#4CAF50' },
            { name: 'Calculator Plus', icon: '<i class="fa-solid fa-calculator"></i>', color: '#2196F3' },
            { name: 'Photo Viewer', icon: '<i class="fa-solid fa-image"></i>', color: '#FF9800' },
            { name: 'Music Player', icon: '<i class="fa-solid fa-music"></i>', color: '#E91E63' },
            { name: 'File Manager', icon: '<i class="fa-solid fa-folder-open"></i>', color: '#607D8B' },
            { name: 'Browser X', icon: '<i class="fa-solid fa-globe"></i>', color: '#009688' },
            { name: 'Email Client', icon: '<i class="fa-solid fa-envelope"></i>', color: '#3F51B5' },
            { name: 'Video Player', icon: '<i class="fa-solid fa-film"></i>', color: '#F44336' },
            { name: 'Code Editor', icon: '<i class="fa-solid fa-code"></i>', color: '#795548' },
            { name: 'Paint Studio', icon: '<i class="fa-solid fa-palette"></i>', color: '#9C27B0' }
        ];

        this.tasks = ['close', 'minimize', 'maximize'];

        this.taskIcons = {
            close: '<i class="fa-solid fa-xmark"></i>',
            minimize: '<i class="fa-solid fa-window-minimize"></i>',
            maximize: '<i class="fa-regular fa-square"></i>'
        };

        this.translations = {
            uk: {
                score: 'Рахунок',
                level: 'Рівень',
                streak: 'Серія',
                startGame: 'Почати гру',
                stopGame: 'Зупинити гру',
                playAgain: 'Зіграти знову',
                gameInProgress: 'Гра йде...',
                welcome: 'Вітаємо в',
                description: 'Це вікно навчальної програми для тренування навичок роботи з вікнами операційної системи.',
                currentTaskTitle: 'Поточне завдання:',
                tasks: {
                    close: 'Закрийте це вікно',
                    minimize: 'Згорніть це вікно',
                    maximize: 'Розгорніть це вікно'
                },
                notifyCorrect: 'Правильно!',
                notifyPoints: 'балів',
                notifyIncorrect: 'Неправильно! Спробуйте ще раз',
                notifyTimeout: 'Час вийшов!',
                gameOverTitle: 'Гру закінчено!',
                gameOverScore: 'Ваш рахунок',
                gameOverLevel: 'Досягнутий рівень',
                gameOverStreak: 'Найдовша серія'
            },
            en: {
                score: 'Score',
                level: 'Level',
                streak: 'Streak',
                startGame: 'Start Game',
                stopGame: 'Stop Game',
                playAgain: 'Play Again',
                gameInProgress: 'In Progress...', 
                welcome: 'Welcome to',
                description: 'This is a window of a training application for practicing skills with operating system windows.',
                currentTaskTitle: 'Current task:',
                tasks: {
                    close: 'Close this window',
                    minimize: 'Minimize this window',
                    maximize: 'Maximize this window'
                },
                notifyCorrect: 'Correct!',
                notifyPoints: 'points',
                notifyIncorrect: 'Incorrect! Try again',
                notifyTimeout: 'Time is up!',
                gameOverTitle: 'Game Over!',
                gameOverScore: 'Your Score',
                gameOverLevel: 'Level Reached',
                gameOverStreak: 'Longest Streak'
            }
        };

        window.addEventListener('resize', () => this.handleResize());
        this.setLanguage(this.currentLanguage);
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            el.textContent = this.translations[lang][key];
        });

        document.getElementById('lang-uk').classList.toggle('active', lang === 'uk');
        document.getElementById('lang-en').classList.toggle('active', lang === 'en');

        if (this.isGameActive) {
            this.clearTimer(); // Clear timer and reset progress bar
            this.updateStats(); // Update stats in the new language
        } else {
            const btn = document.getElementById('startGameBtn');
            btn.textContent = this.translations[this.currentLanguage].startGame;
        }
    }

    startGame() {
        if (this.isGameActive) return;
        this.isGameActive = true;
        document.getElementById('startGameBtn').style.display = 'none';
        document.getElementById('stopGameBtn').style.display = 'block';
        this.score = 0;
        this.level = 1;
        this.streak = 0;
        this.timeLimit = 8000; 
        this.updateStats();
        const gameOverNotification = document.querySelector('.notification.info');
        if (gameOverNotification) {
            gameOverNotification.remove();
        }
        this.createWindow();
    }

    stopGame() {
        this.isGameActive = false;
        this.clearTimer(); // Call a new method to clear the timer and reset the progress bar
        const existingWindows = document.querySelectorAll('.window');
        existingWindows.forEach(w => w.remove());
        document.getElementById('startGameBtn').style.display = 'block';
        document.getElementById('startGameBtn').textContent = this.translations[this.currentLanguage].playAgain;
        document.getElementById('stopGameBtn').style.display = 'none';

        this.showNotification(
            `<h3>${this.translations[this.currentLanguage].gameOverTitle}</h3>
            <p>${this.translations[this.currentLanguage].gameOverScore}: ${this.score}</p>
            <p>${this.translations[this.currentLanguage].gameOverLevel}: ${this.level}</p>
            <p>${this.translations[this.currentLanguage].gameOverStreak}: ${this.streak}</p>
            <button class="notification-close-btn"><i class="fa-solid fa-xmark"></i></button>`,
            'info',
            0 // Duration 0 means it won't auto-close
        );

        document.querySelector('.notification-close-btn').addEventListener('click', (e) => {
            e.target.closest('.notification').remove();
        });
    }

    createWindow() {
        if (!this.isGameActive) return;

        const existingWindows = document.querySelectorAll('.window');
        existingWindows.forEach(w => w.remove());

        const app = this.apps[Math.floor(Math.random() * this.apps.length)];
        const task = this.tasks[Math.floor(Math.random() * this.tasks.length)];

        this.currentTask = task;

        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.style.left = Math.random() * (window.innerWidth - 450) + 'px';
        windowEl.style.top = Math.random() * (window.innerHeight - 350) + 'px';
        windowEl.style.width = '420px';
        windowEl.style.height = '320px';

        const T = this.translations[this.currentLanguage];

        windowEl.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <span class="window-icon">${app.icon}</span>
                    <span>${app.name}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control minimize" title="Згорнути" aria-label="${T.tasks.minimize}">${this.taskIcons.minimize}</button>
                    <button class="window-control maximize" title="Розгорнути" aria-label="${T.tasks.maximize}">${this.taskIcons.maximize}</button>
                    <button class="window-control close" title="Закрити" aria-label="${T.tasks.close}">${this.taskIcons.close}</button>
                </div>
            </div>
            <div class="window-content" style="background: linear-gradient(135deg, ${app.color}20, ${app.color}10);">
                <h3>${T.welcome} ${app.name}!</h3>
                <p>${T.description}</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4>${T.currentTaskTitle}</h4>
                    <p style="color: ${app.color}; font-weight: bold; font-size: 16px;">${T.tasks[task]}</p>
                </div>
                <div style="margin-top: auto; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
                    <small>${T.level}: ${this.level} | ${T.score}: ${this.score}</small>
                </div>
            </div>
        `;

        windowEl.querySelector('.minimize').addEventListener('click', () => this.handleAction('minimize'));
        windowEl.querySelector('.maximize').addEventListener('click', () => this.handleAction('maximize'));
        windowEl.querySelector('.close').addEventListener('click', () => this.handleAction('close'));

        document.getElementById('desktop').appendChild(windowEl);

        this.startTimer();
        this.makeDraggable(windowEl);
    }

    startTimer() {
        const progressFill = document.getElementById('progressFill');
        progressFill.style.transition = 'none';
        progressFill.style.width = '100%';

        setTimeout(() => {
             progressFill.style.transition = `width ${this.timeLimit / 1000}s linear`;
             progressFill.style.width = '0%';
        }, 50);

        this.timer = setTimeout(() => {
            this.handleTimeout();
        }, this.timeLimit);
    }

    clearTimer() {
        clearTimeout(this.timer);
        const progressFill = document.getElementById('progressFill');
        progressFill.style.transition = 'none';
        progressFill.style.width = '100%'; // Reset to full to hide the bar
    }

    handleAction(action) {
        if (!this.isGameActive) return;

        this.clearTimer(); // Clear timer when action is taken

        const windowEl = document.querySelector('.window');
        if (!windowEl) return;

        if (action === this.currentTask) {
            this.handleCorrectAction(action, windowEl);
        } else {
            this.handleIncorrectAction(windowEl);
        }
    }

    handleCorrectAction(action, windowEl) {
        this.score += (10 * this.level);
        this.streak++;

        if (this.streak >= 5) {
            this.level++;
            this.streak = 0;
            this.timeLimit = Math.max(4000, this.timeLimit - 150); // Змінено поріг та крок зменшення
        }

        this.updateStats();
        const T = this.translations[this.currentLanguage];
        this.showNotification(`${T.notifyCorrect} +${10 * this.level} ${T.notifyPoints}`, 'success');

        switch(action) {
            case 'close':
                windowEl.style.transform = 'scale(0) rotate(180deg)';
                windowEl.style.opacity = '0';
                break;
            case 'minimize':
                windowEl.classList.add('minimized');
                break;
            case 'maximize':
                windowEl.classList.add('maximized');
                break;
        }

        setTimeout(() => {
            windowEl.remove();
            this.createWindow();
        }, 500);
    }

    handleIncorrectAction(windowEl) {
        this.streak = 0;
        this.updateStats();
        this.showNotification(this.translations[this.currentLanguage].notifyIncorrect, 'error');

        windowEl.style.transition = 'transform 0.5s ease';
        windowEl.style.transform = 'translateX(-10px)';
        setTimeout(() => { windowEl.style.transform = 'translateX(10px)'; }, 100);
        setTimeout(() => { windowEl.style.transform = 'translateX(-10px)'; }, 200);
        setTimeout(() => { windowEl.style.transform = 'translateX(0px)'; }, 300);

        setTimeout(() => this.createWindow(), 1000);
    }

    handleTimeout() {
        this.streak = 0;
        this.updateStats();
        this.showNotification(this.translations[this.currentLanguage].notifyTimeout, 'error');

        const windowEl = document.querySelector('.window');
        if (windowEl) {
            windowEl.style.opacity = '0.5';
            setTimeout(() => this.createWindow(), 1000);
        }
    }

    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('streak').textContent = this.streak;
    }

    showNotification(message, type = 'success', duration = 2500) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<div class="notification-content">${message}</div>`;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 400);
            }, duration);
        }
    }

    makeDraggable(element) {
        const header = element.querySelector('.window-header');
        let isDragging = false;
        let startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-control') || element.classList.contains('maximized')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            let maxZIndex = 0;
            document.querySelectorAll('.window').forEach(win => {
                const zIndex = parseInt(win.style.zIndex) || 0;
                if (zIndex > maxZIndex) {
                    maxZIndex = zIndex;
                }
            });
            element.style.zIndex = maxZIndex + 1;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            element.style.left = (initialX + deltaX) + 'px';
            element.style.top = (initialY + deltaY) + 'px';
        });

        document.addEventListener('mouseup', () => isDragging = false);
    }

    handleResize() {
        const windows = document.querySelectorAll('.window');
        windows.forEach(windowEl => {
            const rect = windowEl.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                windowEl.style.left = (window.innerWidth - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                windowEl.style.top = (window.innerHeight - rect.height) + 'px';
            }
            if (rect.left < 0) {
                windowEl.style.left = '0px';
            }
            if (rect.top < 0) {
                windowEl.style.top = '0px';
            }
        });
    }
}

const trainer = new WindowTrainer();
document.getElementById('startGameBtn').addEventListener('click', () => trainer.startGame());
document.getElementById('stopGameBtn').addEventListener('click', () => trainer.stopGame());
document.getElementById('lang-uk').addEventListener('click', () => trainer.setLanguage('uk'));
document.getElementById('lang-en').addEventListener('click', () => trainer.setLanguage('en'));
