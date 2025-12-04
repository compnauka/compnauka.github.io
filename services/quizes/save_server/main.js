document.addEventListener('DOMContentLoaded', () => {
    // --- SOUND ENGINE ---
    const SoundFX = {
        ctx: null,
        init: function() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            if (!this.ctx) {
                this.ctx = new AudioContext();
            } else if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        },
        playTone: function(freq, type, startTime, duration, vol = 0.1) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        },
        playClick: function() { 
            if (this.ctx) this.playTone(800, 'sine', this.ctx.currentTime, 0.1, 0.05); 
        },
        playSuccess: function() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                this.playTone(freq, 'sine', now + (i * 0.1), 0.3, 0.1);
            });
        },
        playZap: function() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    };

    // --- PARTICLE SYSTEM ---
    function createSparks(x, y) {
        const colors = ['#ff0000', '#ff4500', '#ffd700', '#ffffff'];
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < 20; i++) {
            const spark = document.createElement('div');
            spark.classList.add('spark');
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 60 + 20;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity + 50;
            
            spark.style.left = x + 'px';
            spark.style.top = y + 'px';
            spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            fragment.appendChild(spark);
            
            const animation = spark.animate([
                { transform: `translate(0,0) scale(1)`, opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(0, .9, .57, 1)' });
            
            animation.onfinish = () => spark.remove();
        }
        document.body.appendChild(fragment);
    }

    // --- STATE MANAGEMENT ---
    let gameSession = [];
    let gameState = { currentLevelIndex: 0 };
    let totalErrors = 0;
    let currentHealth = 100;
    let failedTopics = [];
    let timerInterval;
    let isTimerEnabled = false;
    let shownCheckpoints = {};
    let typeWriterTimeout;

    // --- DOM ELEMENTS ---
    const elements = {
        dialogueText: document.getElementById('dialogue-text'),
        skipDialogueBtn: document.getElementById('skip-dialogue-btn'),
        interactionArea: document.getElementById('interaction-area'),
        feedbackMsg: document.getElementById('feedback-msg'),
        progressBar: document.getElementById('progress-bar'),
        levelIndicator: document.getElementById('level-indicator'),
        gameContainer: document.getElementById('game-container'),
        healthBar: document.getElementById('health-bar'),
        robotAvatar: document.getElementById('robot-avatar'),
        robotIcon: document.getElementById('robot-icon'),
        robotGlow: document.getElementById('robot-glow'),
        timerDisplay: document.getElementById('timer-display'),
        timerToggle: document.getElementById('timer-toggle'),
        startScreen: document.getElementById('start-screen'),
        victoryScreen: document.getElementById('victory-screen'),
        startBtn: document.getElementById('start-btn'),
        resetBtnTop: document.getElementById('reset-btn-top'),
        restartBtn: document.getElementById('restart-btn'),
        characterArea: document.getElementById('character-area')
    };

    // --- EVENT LISTENERS ---
    elements.startBtn.addEventListener('click', startGame);
    elements.resetBtnTop.addEventListener('click', resetProgress);
    elements.restartBtn.addEventListener('click', resetProgress);
    
    document.addEventListener('keydown', handleKeyboardInput);

    // --- GAME LOGIC ---

    function initGameSession() {
        const savedSession = localStorage.getItem('serverRescue_session');
        if (savedSession) {
            try {
                gameSession = JSON.parse(savedSession);
                if (gameSession.length === missionDatabase.length) return;
            } catch (e) { console.error("Session parse error", e); }
        }

        // Generate new session if none exists or invalid
        gameSession = missionDatabase.map(topicData => {
            const randomVarIndex = Math.floor(Math.random() * topicData.variations.length);
            return {
                title: topicData.topic,
                ...topicData.variations[randomVarIndex]
            };
        });
        localStorage.setItem('serverRescue_session', JSON.stringify(gameSession));
    }

    function startGame() {
        SoundFX.init();
        SoundFX.playClick();
        
        isTimerEnabled = elements.timerToggle.checked;
        if (isTimerEnabled) elements.timerDisplay.classList.remove('hidden');
        else elements.timerDisplay.classList.add('hidden');

        initGameSession();
        
        const savedData = localStorage.getItem('serverRescue_progress');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if(parsed.level < gameSession.length && parsed.health > 0) {
                    gameState.currentLevelIndex = parsed.level;
                    totalErrors = parsed.errors || 0;
                    currentHealth = parsed.health || 100;
                    failedTopics = Array.isArray(parsed.failedTopics) ? parsed.failedTopics : [];
                    updateHealthUI();
                } else {
                    resetGameState();
                }
            } catch (e) { resetGameState(); }
        } else {
            resetGameState();
        }

        elements.startScreen.classList.add('hidden');
        elements.victoryScreen.classList.add('hidden');
        elements.characterArea.classList.remove('hidden');
        
        loadLevel(gameState.currentLevelIndex);
    }

    function resetGameState() {
        gameState.currentLevelIndex = 0;
        totalErrors = 0;
        currentHealth = 100;
        failedTopics = [];
        updateHealthUI();
    }

    function resetProgress() {
        localStorage.removeItem('serverRescue_progress');
        localStorage.removeItem('serverRescue_session');
        location.reload();
    }

    function updateRobotEmotion(state) {
        // Reset classes safely
        elements.robotAvatar.className = "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 relative transition-all duration-300";
        elements.robotIcon.className = "fas text-2xl md:text-3xl transition-colors";
        
        const emotions = {
            happy: {
                avatar: ['bg-green-900', 'border-green-400'],
                icon: ['fa-face-smile', 'text-green-200'],
                glow: "bg-green-500 opacity-40 animate-pulse"
            },
            sad: {
                avatar: ['bg-red-900', 'border-red-400'],
                icon: ['fa-face-frown-open', 'text-red-200'],
                glow: "bg-red-500 opacity-40 animate-pulse"
            },
            neutral: {
                avatar: ['bg-blue-900', 'border-blue-400'],
                icon: ['fa-robot', 'text-white'],
                glow: "bg-blue-500 opacity-30 animate-pulse"
            }
        };

        const current = emotions[state] || emotions.neutral;
        elements.robotAvatar.classList.add(...current.avatar);
        elements.robotIcon.classList.add(...current.icon);
        elements.robotGlow.className = `absolute inset-0 rounded-full blur-lg transition-colors duration-300 ${current.glow}`;
    }

    function updateHealthUI() {
        elements.healthBar.style.width = `${currentHealth}%`;
        elements.healthBar.setAttribute('aria-valuenow', currentHealth);
        
        let colorClass = "bg-green-500";
        if (currentHealth <= 30) colorClass = "bg-red-500";
        else if (currentHealth <= 70) colorClass = "bg-yellow-500";

        elements.healthBar.className = `h-full ${colorClass} transition-all duration-500`;
    }

    function typeWriter(text, element, speed = 20) {
        if (typeWriterTimeout) clearTimeout(typeWriterTimeout);
        element.innerHTML = "";
        element.classList.add('typing-effect');
        
        let i = 0;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                typeWriterTimeout = setTimeout(type, speed);
            } else {
                element.classList.remove('typing-effect');
                elements.skipDialogueBtn.classList.add('hidden');
            }
        }
        type();
    }

    function startTimer() {
        if (!isTimerEnabled) return;
        let timeLeft = 45;
        
        elements.timerDisplay.innerText = timeLeft + 's';
        elements.timerDisplay.classList.remove('text-red-500', 'animate-pulse');
        elements.timerDisplay.classList.add('text-yellow-400');
        
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            timeLeft--;
            elements.timerDisplay.innerText = timeLeft + 's';
            
            if (timeLeft <= 10) {
                elements.timerDisplay.classList.remove('text-yellow-400');
                elements.timerDisplay.classList.add('text-red-500', 'animate-pulse');
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 1000);
    }

    function handleTimeOut() {
        disableButtons();
        SoundFX.playZap();
        updateRobotEmotion('sad');
        totalErrors++;
        currentHealth = Math.max(0, currentHealth - 10);
        updateHealthUI();

        const levelData = gameSession[gameState.currentLevelIndex];
        registerFailedQuestion(levelData);

        showFeedback(false, "Час вийшов! Система пошкоджена.");
        showNextButton();
    }

    function showFeedback(isSuccess, message) {
        elements.feedbackMsg.classList.remove('hidden', 'scale-95', 'opacity-0');
        elements.feedbackMsg.classList.add('scale-100', 'opacity-100');
        
        if (isSuccess) {
            elements.feedbackMsg.className = "mt-4 p-4 rounded-lg text-left font-bold text-white w-full shadow-lg transform transition-all duration-300 scale-100 opacity-100 border-l-4 shrink-0 bg-green-600/90 border-green-400";
            elements.feedbackMsg.innerHTML = `<div><i class="fas fa-check-circle mr-2"></i> ${message}</div>`;
        } else {
            elements.feedbackMsg.className = "mt-4 p-4 rounded-lg text-left font-bold text-white w-full shadow-lg transform transition-all duration-300 scale-100 opacity-100 border-l-4 shrink-0 bg-red-600/90 border-red-400";
            elements.feedbackMsg.innerHTML = `<div><i class="fas fa-times-circle mr-2"></i> ${message}</div>`;
        }
    }

    function showCheckpoint(index) {
        if (timerInterval) clearInterval(timerInterval);
        updateRobotEmotion('happy');
        elements.interactionArea.innerHTML = '';
        elements.feedbackMsg.classList.add('hidden');
        
        const progressPct = (index / gameSession.length) * 100;
        elements.progressBar.style.width = `${progressPct}%`;
        elements.levelIndicator.innerText = `${index + 1}/${gameSession.length}`;

        const text = storyCheckpoints[index] || "";
        const speed = isTimerEnabled ? 15 : 20;
        typeWriter(text, elements.dialogueText, speed);

        setupSkipButton(text);

        const btn = document.createElement('button');
        btn.className = "mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-8 rounded-full shadow-lg w-full md:w-auto text-lg transition-transform active:scale-95 touch-manipulation";
        btn.innerHTML = `Продовжити місію <i class="fas fa-arrow-right ml-2"></i>`;
        btn.addEventListener('click', () => {
            SoundFX.playClick();
            loadLevel(index);
        });
        elements.interactionArea.appendChild(btn);
    }

    function loadLevel(index) {
        updateRobotEmotion('neutral');
        if (timerInterval) clearInterval(timerInterval);

        if (index >= gameSession.length) {
            setTimeout(() => showEndScreen(true), 500);
            return;
        }

        if (storyCheckpoints[index] && !shownCheckpoints[index]) {
            shownCheckpoints[index] = true;
            showCheckpoint(index);
            return;
        }

        localStorage.setItem('serverRescue_progress', JSON.stringify({
            level: index,
            errors: totalErrors,
            health: currentHealth,
            failedTopics: failedTopics
        }));

        gameState.currentLevelIndex = index;
        const levelData = gameSession[index];

        elements.levelIndicator.innerText = `${index + 1}/${gameSession.length}`;
        elements.progressBar.style.width = `${(index / gameSession.length) * 100}%`;
        elements.interactionArea.innerHTML = '';
        elements.feedbackMsg.classList.add('hidden');

        const speed = isTimerEnabled ? 15 : 20;
        typeWriter(levelData.dialogue, elements.dialogueText, speed);
        setupSkipButton(levelData.dialogue);

        // Wait for typing or skip
        const delay = Math.min(levelData.dialogue.length * speed + 500, 2000); 
        setTimeout(() => {
            renderOptions(levelData.options);
            if (isTimerEnabled) startTimer();
        }, delay);
    }

    function setupSkipButton(fullText) {
        elements.skipDialogueBtn.classList.remove('hidden');
        // Remove old listeners by cloning
        const newBtn = elements.skipDialogueBtn.cloneNode(true);
        elements.skipDialogueBtn.parentNode.replaceChild(newBtn, elements.skipDialogueBtn);
        elements.skipDialogueBtn = newBtn;

        elements.skipDialogueBtn.addEventListener('click', () => {
            if (typeWriterTimeout) clearTimeout(typeWriterTimeout);
            elements.dialogueText.innerHTML = fullText;
            elements.dialogueText.classList.remove('typing-effect');
            elements.skipDialogueBtn.classList.add('hidden');
        });
    }

    function renderOptions(options) {
        // Check if options are already rendered to avoid duplicates
        if (elements.interactionArea.hasChildNodes()) return;

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-fade-in";

        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = "group relative bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:-translate-y-1 text-left flex items-center gap-4 touch-manipulation";
            btn.dataset.optionIndex = idx;
            btn.innerHTML = `
                <div class="w-10 h-10 bg-slate-700 group-hover:bg-blue-600 rounded-full flex items-center justify-center shrink-0 transition-colors">
                    <i class="fas ${opt.icon} text-xl"></i>
                </div>
                <div class="flex-1">
                    <div class="text-xs text-slate-400 mb-1">${idx + 1}</div>
                    <div class="text-sm md:text-base">${opt.text}</div>
                </div>
            `;
            btn.addEventListener('click', () => handleAnswer(opt, btn));
            grid.appendChild(btn);
        });
        elements.interactionArea.appendChild(grid);
    }

    function handleAnswer(selectedOption, btn) {
        if (timerInterval) clearInterval(timerInterval);
        disableButtons();

        if (selectedOption.correct) {
            SoundFX.playSuccess();
            updateRobotEmotion('happy');
            btn.classList.replace('border-slate-600', 'border-green-400');
            btn.classList.add('bg-green-900/50');
            
            showFeedback(true, selectedOption.feedback);
            
            const rect = btn.getBoundingClientRect();
            createSparks(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else {
            SoundFX.playZap();
            updateRobotEmotion('sad');
            totalErrors++;
            currentHealth = Math.max(0, currentHealth - 10);
            updateHealthUI();
            registerFailedQuestion(gameSession[gameState.currentLevelIndex]);

            btn.classList.replace('border-slate-600', 'border-red-400');
            btn.classList.add('bg-red-900/50', 'shake');
            elements.gameContainer.classList.add('shake');
            setTimeout(() => elements.gameContainer.classList.remove('shake'), 500);

            showFeedback(false, selectedOption.feedback);
        }
        showNextButton();
    }

    function disableButtons() {
        const buttons = elements.interactionArea.querySelectorAll('button');
        buttons.forEach(b => b.disabled = true);
    }

    function registerFailedQuestion(levelData) {
        if (!failedTopics.some(t => t.topic === levelData.title)) {
            failedTopics.push({
                topic: levelData.title,
                dialogue: levelData.dialogue.split('\n')[0]
            });
        }
    }

    function showNextButton() {
        setTimeout(() => {
            const nextBtn = document.createElement('button');
            nextBtn.className = "mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-1 w-full md:w-auto touch-manipulation";
            nextBtn.innerHTML = `Далі <i class="fas fa-arrow-right ml-2"></i>`;
            nextBtn.addEventListener('click', () => {
                SoundFX.playClick();
                if (currentHealth <= 0) showEndScreen(false);
                else loadLevel(gameState.currentLevelIndex + 1);
            });
            elements.interactionArea.appendChild(nextBtn);
            // Auto scroll to bottom
            elements.interactionArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 1000);
    }

    function showEndScreen(isVictory) {
        elements.victoryScreen.classList.remove('hidden');
        document.getElementById('final-health').innerText = currentHealth + '%';
        document.getElementById('stats-errors').innerText = totalErrors;

        const failedList = document.getElementById('failed-topics-list');
        const perfectMsg = document.getElementById('perfect-score-msg');
        const summary = document.getElementById('victory-summary');
        const title = document.getElementById('end-title');

        if (failedTopics.length === 0) {
            failedList.classList.add('hidden');
            perfectMsg.classList.remove('hidden');
        } else {
            failedList.classList.remove('hidden');
            perfectMsg.classList.add('hidden');
            failedList.innerHTML = failedTopics.map(t => 
                `<div class="flex items-start gap-2"><i class="fas fa-exclamation-triangle text-yellow-500 mt-1"></i><span>${t.topic}</span></div>`
            ).join('');
        }

        if (isVictory) {
             title.innerText = "МІСІЮ ВИКОНАНО!";
             title.classList.remove('text-red-500');
             summary.innerHTML = `<strong class="text-green-400">Вітаємо!</strong> Ти успішно відновив сервер.`;
             localStorage.removeItem('serverRescue_progress');
        } else {
             title.innerText = "СИСТЕМА ВПАЛА";
             title.classList.add('text-red-500');
             summary.innerHTML = `<strong class="text-red-400">Сервер критично пошкоджено!</strong> Спробуй ще раз.`;
        }
    }

    function handleKeyboardInput(e) {
        if (elements.startScreen.classList.contains('hidden') && elements.victoryScreen.classList.contains('hidden')) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 4) {
                const buttons = elements.interactionArea.querySelectorAll('button[data-option-index]');
                if (buttons[num - 1] && !buttons[num - 1].disabled) {
                    buttons[num - 1].click();
                }
            }
        }
    }
});
