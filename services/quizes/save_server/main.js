document.addEventListener('DOMContentLoaded', () => {
    const strings = window.UI_STRINGS || {};
    const quizContent = window.QUIZ_CONTENT || {};
    const modules = window.ServerRescueModules || {};
    const missionDatabase = quizContent.missionDatabase || [];
    const storyCheckpoints = quizContent.storyCheckpoints || {};
    const PARTICLE_COLORS = ['#ff0000', '#ff4500', '#ffd700', '#ffffff'];
    const ROBOT_BASE_CLASS = 'robot-avatar-shell w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 shrink-0 z-10 relative transition-all duration-300';
    const ROBOT_ICON_BASE_CLASS = 'fas text-2xl md:text-3xl transition-colors';

    const SoundFX = modules.createSoundFX();
    const shuffleArray = modules.shuffleArray;
    const triggerSparks = (x, y) => modules.createSparks(x, y, PARTICLE_COLORS);

    let gameSession = [];
    let gameState = { currentLevelIndex: 0 };
    let totalErrors = 0;
    let currentHealth = 100;
    let failedTopics = [];
    let timerInterval;
    let isTimerEnabled = false;
    let shownCheckpoints = {};
    let consecutiveErrors = 0;
    let hasExtendedCurrentQuestion = false;
    let hasWarnedAboutTimer = false;
    let optionsRenderTimeout = null;
    let pendingOptions = null;

    const elements = {
        dialogueText: document.getElementById('dialogue-text'),
        interactionArea: document.getElementById('interaction-area'),
        gameFooter: document.getElementById('game-footer'),
        footerContent: document.getElementById('footer-content'),
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
        characterArea: document.getElementById('character-area'),
        mainContent: document.getElementById('main-content'),
        srStatus: document.getElementById('sr-status'),
        srAlert: document.getElementById('sr-alert')
    };

    function getString(path, fallback = '') {
        const segments = path.split('.');
        let current = strings;

        for (const segment of segments) {
            current = current?.[segment];
        }

        return typeof current === 'string' ? current : fallback;
    }

    function appString(key, fallback = '') {
        return getString(`app.${key}`, fallback);
    }

    function runtimeString(key, fallback = '') {
        return getString(`runtime.${key}`, fallback);
    }

    function applyStaticStrings() {
        document.querySelectorAll('[data-i18n-key]').forEach((node) => {
            const value = getString(node.dataset.i18nKey, node.textContent.trim());
            node.textContent = value;
        });

        document.querySelectorAll('[data-i18n-html]').forEach((node) => {
            const value = getString(node.dataset.i18nHtml, node.innerHTML);
            node.innerHTML = value;
        });

        document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
            const attrName = node.dataset.i18nAttr;
            const attrValue = getString(node.dataset.i18nKey, node.getAttribute(attrName) || '');
            node.setAttribute(attrName, attrValue);

            if (node.dataset.i18nAttrSecondary && node.dataset.i18nKeySecondary) {
                const secondaryName = node.dataset.i18nAttrSecondary;
                const secondaryValue = getString(node.dataset.i18nKeySecondary, node.getAttribute(secondaryName) || '');
                node.setAttribute(secondaryName, secondaryValue);
            }
        });

        if (appString('documentTitle')) {
            document.title = appString('documentTitle');
        }
    }

    function announceStatus(message) {
        elements.srStatus.textContent = '';
        window.setTimeout(() => {
            elements.srStatus.textContent = message;
        }, 10);
    }

    function announceAlert(message) {
        elements.srAlert.textContent = '';
        window.setTimeout(() => {
            elements.srAlert.textContent = message;
        }, 10);
    }

    function focusMainContent() {
        elements.mainContent.focus();
    }

    function clearInteractionArea() {
        elements.interactionArea.innerHTML = '';
    }

    function cancelPendingOptionRender() {
        if (optionsRenderTimeout) {
            clearTimeout(optionsRenderTimeout);
            optionsRenderTimeout = null;
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

    function showFooterPanel() {
        elements.gameFooter.classList.remove('is-hidden');
        elements.gameFooter.classList.add('is-visible');
    }

    function setProgressState(index) {
        const progressPct = Math.round((index / gameSession.length) * 100);
        elements.levelIndicator.innerText = `${index + 1}/${gameSession.length}`;
        elements.progressBar.style.width = `${progressPct}%`;
        elements.progressBar.setAttribute('aria-valuenow', progressPct);
        elements.progressBar.setAttribute('aria-valuetext', `${runtimeString('progressAnnouncement')} ${progressPct}%`);
    }

    function focusFirstAnswerButton() {
        const firstButton = elements.interactionArea.querySelector('button[data-option-index]');
        if (firstButton) {
            firstButton.focus();
        }
    }

    function getAnswerButtons() {
        return Array.from(elements.interactionArea.querySelectorAll('button[data-option-index]'));
    }

    function focusAnswerByOffset(offset) {
        const answerButtons = getAnswerButtons();
        if (answerButtons.length === 0) return;

        const activeIndex = answerButtons.findIndex((button) => button === document.activeElement);
        const fallbackIndex = activeIndex === -1 ? 0 : activeIndex;
        const nextIndex = (fallbackIndex + offset + answerButtons.length) % answerButtons.length;
        answerButtons[nextIndex].focus();
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(() => {
                announceAlert(runtimeString('serviceWorkerFailed'));
            });
        });
    }

    function setupConnectionStatus() {
        window.addEventListener('offline', () => {
            announceAlert(runtimeString('offlineNotice'));
        });

        window.addEventListener('online', () => {
            announceStatus(runtimeString('onlineNotice'));
        });
    }

    const {
        cancelTypeWriter,
        updateRobotEmotion,
        updateHealthUI,
        typeWriter,
        renderTimerWarning,
        showFeedback,
        hideFeedback,
        renderOptions,
        showNextButton,
        showEndScreen,
        celebrateCorrectAnswer
    } = modules.createGameRenderers({
        elements,
        appString,
        runtimeString,
        soundFX: SoundFX,
        createSparks: triggerSparks,
        robotBaseClass: ROBOT_BASE_CLASS,
        robotIconBaseClass: ROBOT_ICON_BASE_CLASS
    });

    applyStaticStrings();
    registerServiceWorker();
    setupConnectionStatus();

    elements.startBtn.addEventListener('click', startGame);
    elements.resetBtnTop.addEventListener('click', resetProgress);
    elements.restartBtn.addEventListener('click', resetProgress);
    document.addEventListener('keydown', handleKeyboardInput);

    function initGameSession() {
        localStorage.removeItem('serverRescue_session');

        const checkpointIndices = Object.keys(storyCheckpoints).map(Number).sort((a, b) => a - b);
        const ranges = [];
        let lastIndex = 0;

        checkpointIndices.forEach((index) => {
            ranges.push([lastIndex, index]);
            lastIndex = index;
        });
        ranges.push([lastIndex, missionDatabase.length]);

        let shuffledTopics = [];
        ranges.forEach(([start, end]) => {
            const moduleTopics = missionDatabase.slice(start, end);
            shuffleArray(moduleTopics);
            shuffledTopics = shuffledTopics.concat(moduleTopics);
        });

        gameSession = shuffledTopics.map((topicData) => {
            const variationIndex = Math.floor(Math.random() * topicData.variations.length);
            const variation = topicData.variations[variationIndex];

            return {
                title: topicData.topic,
                ...variation,
                options: shuffleArray([...variation.options])
            };
        });
    }

    function startGame() {
        SoundFX.init();
        SoundFX.playClick();

        isTimerEnabled = elements.timerToggle.checked;
        if (isTimerEnabled) elements.timerDisplay.classList.remove('hidden');
        else elements.timerDisplay.classList.add('hidden');

        resetGameState();
        localStorage.removeItem('serverRescue_progress');

        initGameSession();

        elements.startScreen.classList.add('hidden');
        elements.victoryScreen.classList.add('hidden');
        elements.characterArea.classList.remove('hidden');
        focusMainContent();
        announceStatus(runtimeString('gameStarted'));

        loadLevel(gameState.currentLevelIndex);
    }

    function resetGameState() {
        gameState.currentLevelIndex = 0;
        totalErrors = 0;
        currentHealth = 100;
        failedTopics = [];
        shownCheckpoints = {};
        consecutiveErrors = 0;
        hasExtendedCurrentQuestion = false;
        hasWarnedAboutTimer = false;
        updateHealthUI(currentHealth);
    }

    function resetProgress() {
        const isConfirmed = window.confirm(runtimeString('resetConfirm'));
        if (!isConfirmed) {
            announceStatus(runtimeString('resetCanceled'));
            return;
        }

        localStorage.removeItem('serverRescue_progress');
        localStorage.removeItem('serverRescue_session');
        location.reload();
    }

    function startTimer() {
        if (!isTimerEnabled) return;

        let timeLeft = 45;
        hasExtendedCurrentQuestion = false;
        hasWarnedAboutTimer = false;

        elements.timerDisplay.innerText = `${timeLeft}s`;
        elements.timerDisplay.classList.remove('text-red-500', 'animate-pulse');
        elements.timerDisplay.classList.add('text-yellow-400');

        stopTimer();
        timerInterval = setInterval(() => {
            timeLeft -= 1;
            elements.timerDisplay.innerText = `${timeLeft}s`;

            if (timeLeft === 20 && !hasWarnedAboutTimer) {
                hasWarnedAboutTimer = true;
                announceAlert(runtimeString('timerWarningAlert'));
                renderTimerWarning({
                    onExtend: () => {
                        if (hasExtendedCurrentQuestion) return;

                        hasExtendedCurrentQuestion = true;
                        timeLeft += 20;
                        elements.timerDisplay.innerText = `${timeLeft}s`;
                        announceStatus(runtimeString('timerExtended'));
                        hideFeedback();
                        focusFirstAnswerButton();
                    },
                    showFooterPanel
                });
            }

            if (timeLeft <= 10) {
                elements.timerDisplay.classList.remove('text-yellow-400');
                elements.timerDisplay.classList.add('text-red-500', 'animate-pulse');
            }

            if (timeLeft <= 0) {
                stopTimer();
                handleTimeOut();
            }
        }, 1000);
    }

    function handleTimeOut() {
        disableButtons();
        SoundFX.playZap();
        updateRobotEmotion('sad');
        totalErrors += 1;
        currentHealth = Math.max(0, currentHealth - 10);
        updateHealthUI(currentHealth);

        const levelData = gameSession[gameState.currentLevelIndex];
        registerFailedQuestion(levelData);

        showFeedback({
            isSuccess: false,
            message: runtimeString('timeoutMessage'),
            showFooterPanel,
            announceStatus
        });
        announceAlert(runtimeString('timeoutAlert'));
        showNextButton(handleNextStep);
    }

    function renderPendingOptions() {
        if (!pendingOptions || elements.interactionArea.hasChildNodes()) return;

        renderOptions(pendingOptions, handleAnswer);
        pendingOptions = null;

        if (isTimerEnabled) startTimer();
        focusFirstAnswerButton();
    }

    function showCheckpoint(index) {
        stopTimer();
        cancelPendingOptionRender();
        cancelTypeWriter();
        pendingOptions = null;
        updateRobotEmotion('happy');
        clearInteractionArea();
        hideFeedback();
        setProgressState(index);

        const text = storyCheckpoints[index] || '';
        const speed = isTimerEnabled ? 15 : 20;
        typeWriter(text, elements.dialogueText, speed);
        announceStatus(`${runtimeString('checkpointPrefix')} ${text.split('\n')[0]}`);

        const continueButton = document.createElement('button');
        continueButton.className = 'action-button action-button--warning mt-4 md:w-auto text-lg touch-manipulation';
        continueButton.innerHTML = runtimeString('continueMission');
        continueButton.addEventListener('click', () => {
            SoundFX.playClick();
            loadLevel(index);
        });

        elements.interactionArea.appendChild(continueButton);
        continueButton.focus();
    }

    function loadLevel(index) {
        updateRobotEmotion('neutral');
        stopTimer();
        cancelPendingOptionRender();
        cancelTypeWriter();

        if (index >= gameSession.length) {
            setTimeout(() => showEndScreenView(true), 500);
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
            failedTopics
        }));

        gameState.currentLevelIndex = index;
        const levelData = gameSession[index];
        setProgressState(index);
        pendingOptions = levelData.options;
        clearInteractionArea();
        hideFeedback();
        hasExtendedCurrentQuestion = false;
        hasWarnedAboutTimer = false;

        const speed = isTimerEnabled ? 15 : 20;
        typeWriter(levelData.dialogue, elements.dialogueText, speed);
        announceStatus(`${runtimeString('questionPrefix')} ${index + 1} ${runtimeString('ofLabel')} ${gameSession.length}. ${levelData.title}.`);

        const delay = Math.min(levelData.dialogue.length * speed + 500, 2000);
        optionsRenderTimeout = setTimeout(() => {
            optionsRenderTimeout = null;
            renderPendingOptions();
        }, delay);
    }

    function handleAnswer(selectedOption, button) {
        stopTimer();
        disableButtons();

        if (selectedOption.correct) {
            SoundFX.playSuccess();
            updateRobotEmotion('happy');
            consecutiveErrors = 0;
            button.classList.replace('border-slate-600', 'border-green-400');
            button.classList.add('answer-option--correct');

            showFeedback({
                isSuccess: true,
                message: selectedOption.feedback,
                showFooterPanel,
                announceStatus
            });
            celebrateCorrectAnswer(button);
        } else {
            SoundFX.playZap();
            updateRobotEmotion('sad');
            totalErrors += 1;
            currentHealth = Math.max(0, currentHealth - 10);
            updateHealthUI(currentHealth);
            registerFailedQuestion(gameSession[gameState.currentLevelIndex]);

            button.classList.replace('border-slate-600', 'border-red-400');
            button.classList.add('answer-option--incorrect', 'shake');
            elements.gameContainer.classList.add('shake');
            setTimeout(() => elements.gameContainer.classList.remove('shake'), 500);

            showFeedback({
                isSuccess: false,
                message: selectedOption.feedback,
                showFooterPanel,
                announceStatus
            });

            consecutiveErrors += 1;
            if (consecutiveErrors >= 3) {
                consecutiveErrors = 0;
                announceAlert(runtimeString('learningHint'));
            }
        }

        showNextButton(handleNextStep);
    }

    function disableButtons() {
        const buttons = elements.interactionArea.querySelectorAll('button');
        buttons.forEach((button) => {
            button.disabled = true;
        });
    }

    function registerFailedQuestion(levelData) {
        if (!failedTopics.some((topic) => topic.topic === levelData.title)) {
            failedTopics.push({
                topic: levelData.title,
                dialogue: levelData.dialogue.split('\n')[0]
            });
        }
    }

    function handleNextStep() {
        SoundFX.playClick();
        if (currentHealth <= 0) showEndScreenView(false);
        else loadLevel(gameState.currentLevelIndex + 1);
    }

    function showEndScreenView(isVictory, reason) {
        showEndScreen({
            isVictory,
            reason,
            currentHealth,
            totalErrors,
            failedTopics,
            announceStatus,
            announceAlert
        });
    }

    function handleKeyboardInput(event) {
        if (!elements.startScreen.classList.contains('hidden') || !elements.victoryScreen.classList.contains('hidden')) {
            return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            focusAnswerByOffset(1);
            return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            focusAnswerByOffset(-1);
            return;
        }

        if (event.key.toLowerCase() === 'n') {
            const nextButton = elements.footerContent.querySelector('button[data-nav-action="next"]');
            if (nextButton && !nextButton.disabled) {
                event.preventDefault();
                nextButton.click();
                return;
            }
        }

        const pressedNumber = parseInt(event.key, 10);
        if (pressedNumber >= 1 && pressedNumber <= 4) {
            const buttons = elements.interactionArea.querySelectorAll('button[data-option-index]');
            if (buttons[pressedNumber - 1] && !buttons[pressedNumber - 1].disabled) {
                buttons[pressedNumber - 1].click();
            }
        }
    }
});
