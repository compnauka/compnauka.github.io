const elements = {
            difficultySelector: document.getElementById('difficulty-selector'),
            gameBoard: document.getElementById('gameBoard'),
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            countdownScreen: document.getElementById('countdownScreen'),
            resultModal: document.getElementById('resultModal'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            score: document.getElementById('score'),
            misses: document.getElementById('misses'),
            timerBarFill: document.getElementById('timer-bar-fill'),
            countdownNumber: document.getElementById('countdownNumber'),
            finalScore: document.getElementById('finalScore'),
            finalMisses: document.getElementById('finalMisses'),
            accuracy: document.getElementById('accuracy'),
            resultIcon: document.getElementById('resultIcon'),
        };

        let gameState = {};
        let gameInterval, timerInterval;
        let activeTimeouts = new Map(); // Для керування таймерами під час паузи

        const difficultySettings = {
            easy: { spawn: 1200, life: 4000 },
            medium: { spawn: 900, life: 3000 },
            hard: { spawn: 600, life: 2200 }
        };
        const GAME_SESSION_TIME = 60; // 60 секунд

        const sounds = {
            success: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.2 } }).toDestination(),
            error: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 } }).toDestination(),
            countdown: new Tone.MembraneSynth().toDestination(),
        };

        function resetGameState() {
            gameState = {
                running: false, paused: false, score: 0, misses: 0,
                timeLeft: GAME_SESSION_TIME,
                difficulty: 'medium',
                pauseStartTime: 0,
            };
        }
        
        function createTarget() {
            if (!gameState.running || gameState.paused) return;

            const circle = document.createElement('div');
            const circleId = `circle-${Date.now()}-${Math.random()}`;
            circle.id = circleId;
            circle.className = 'target-circle';
            const size = Math.random() * 40 + 60;
            circle.style.width = `${size}px`;
            circle.style.height = `${size}px`;
            
            const boardRect = elements.gameBoard.getBoundingClientRect();
            circle.style.left = `${Math.random() * (boardRect.width - size - 20) + 10}px`;
            circle.style.top = `${Math.random() * (boardRect.height - size - 20) + 10}px`;
            
            const isLeftClick = Math.random() > 0.5;
            circle.dataset.type = isLeftClick ? 'left' : 'right';
            circle.textContent = isLeftClick ? 'Л' : 'П';
            circle.classList.add(isLeftClick ? 'l-circle' : 'r-circle');
            
            elements.gameBoard.appendChild(circle);

            const timeoutDuration = difficultySettings[gameState.difficulty].life;
            const timeout = setTimeout(() => {
                if (circle.parentNode) {
                    circle.remove();
                    if (gameState.running && !gameState.paused) {
                        gameState.misses++;
                        updateUI();
                    }
                }
                activeTimeouts.delete(circleId);
            }, timeoutDuration);
            
            activeTimeouts.set(circleId, {
                element: circle,
                timeout: timeout,
                remaining: timeoutDuration,
                startTime: Date.now()
            });
        }

        function handleCircleClick(e) {
            e.preventDefault();
            
            const circle = e.target.closest('.target-circle');

            if (!gameState.running || gameState.paused || !circle || circle.dataset.clicked) return;

            const requiredClick = circle.dataset.type;
            const actualClick = e.button === 0 ? 'left' : (e.button === 2 ? 'right' : null);

            if (!actualClick) return;

            if (requiredClick === actualClick) {
                gameState.score++;
                sounds.success.triggerAttackRelease('C5', '8n');
                
                circle.dataset.clicked = 'true';
                
                const timeoutData = activeTimeouts.get(circle.id);
                if (timeoutData) {
                    clearTimeout(timeoutData.timeout);
                    activeTimeouts.delete(circle.id);
                }

                circle.classList.add('pop-success-animation');
                circle.addEventListener('animationend', () => {
                    if (circle.parentNode) circle.remove();
                }, { once: true });
            } else {
                gameState.misses++;
                sounds.error.triggerAttackRelease('C3', '8n');
                circle.classList.add('shake-error-animation');
                circle.addEventListener('animationend', () => {
                    circle.classList.remove('shake-error-animation');
                }, { once: true });
            }
            updateUI();
        }

        function updateUI() {
            elements.score.textContent = gameState.score;
            elements.misses.textContent = gameState.misses;
            elements.timerBarFill.style.width = `${(gameState.timeLeft / GAME_SESSION_TIME) * 100}%`;
        }
        
        function startCountdown() {
            let count = 3;
            elements.countdownScreen.classList.remove('hidden');
            const interval = setInterval(() => {
                if(count > 0) {
                    elements.countdownNumber.textContent = count;
                    sounds.countdown.triggerAttackRelease('C3', '8n', Tone.now());
                } else {
                     elements.countdownNumber.textContent = '▶';
                     sounds.countdown.triggerAttackRelease('G3', '8n', Tone.now());
                }
                count--;
                if (count < -1) {
                    clearInterval(interval);
                    elements.countdownScreen.classList.add('hidden');
                    startGameLoop();
                }
            }, 800);
        }
        
        function startGameLoop() {
            gameState.running = true;
            gameState.paused = false;
            elements.pauseBtn.disabled = false;
            elements.pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
            const settings = difficultySettings[gameState.difficulty];
            gameInterval = setInterval(createTarget, settings.spawn);
            
            timerInterval = setInterval(() => {
                if (!gameState.paused) {
                    gameState.timeLeft--;
                    updateUI();
                    if (gameState.timeLeft <= 0) endGame();
                }
            }, 1000);
        }

        function startGame() {
            resetGameState();
            gameState.difficulty = document.querySelector('.difficulty-btn.active').dataset.difficulty;
            elements.startScreen.classList.add('hidden');
            elements.resultModal.classList.add('hidden');
            elements.difficultySelector.classList.add('invisible');
            elements.gameBoard.querySelectorAll('.target-circle').forEach(el => el.remove());
            updateUI();
            startCountdown();
        }

        function togglePause() {
            if (!gameState.running) return;
            gameState.paused = !gameState.paused;
            if (gameState.paused) {
                gameState.pauseStartTime = Date.now();
                elements.pauseScreen.classList.remove('hidden');
                elements.pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                
                activeTimeouts.forEach((data, id) => {
                    clearTimeout(data.timeout);
                    data.remaining -= (Date.now() - data.startTime);
                });

            } else {
                elements.pauseScreen.classList.add('hidden');
                elements.pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

                activeTimeouts.forEach((data, id) => {
                    data.startTime = Date.now();
                    const newTimeout = setTimeout(() => {
                        if (data.element.parentNode) {
                            data.element.remove();
                            if (gameState.running && !gameState.paused) {
                                gameState.misses++;
                                updateUI();
                            }
                        }
                        activeTimeouts.delete(id);
                    }, data.remaining);
                    
                    data.timeout = newTimeout;
                });
            }
        }

        function endGame() {
            gameState.running = false;
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            
            activeTimeouts.forEach(data => clearTimeout(data.timeout));
            activeTimeouts.clear();

            elements.gameBoard.querySelectorAll('.target-circle').forEach(circle => circle.remove());
            elements.pauseBtn.disabled = true;
            elements.difficultySelector.classList.remove('invisible');
            showResults();
        }

        function showResults() {
            elements.finalScore.textContent = gameState.score;
            elements.finalMisses.textContent = gameState.misses;
            const total = gameState.score + gameState.misses;
            const accuracy = total > 0 ? Math.round((gameState.score / total) * 100) : 0;
            elements.accuracy.textContent = `${accuracy}%`;

            if (accuracy >= 90) elements.resultIcon.textContent = '🏆';
            else if (accuracy >= 70) elements.resultIcon.textContent = '👍';
            else if (accuracy >= 50) elements.resultIcon.textContent = '🙂';
            else elements.resultIcon.textContent = '🤔';

            elements.resultModal.classList.remove('hidden');
        }

        elements.startBtn.addEventListener('click', async () => {
            await Tone.start();
            startGame();
        });
        elements.playAgainBtn.addEventListener('click', () => {
             elements.resultModal.classList.add('hidden');
             elements.startScreen.classList.remove('hidden');
        });
        elements.pauseBtn.addEventListener('click', togglePause);
        
        elements.difficultySelector.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                elements.difficultySelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.key === 'Escape') && gameState.running) {
                e.preventDefault();
                togglePause();
            }
        });
        
        elements.gameBoard.addEventListener('mousedown', handleCircleClick);
        elements.gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());
        
        resetGameState();
        updateUI();
