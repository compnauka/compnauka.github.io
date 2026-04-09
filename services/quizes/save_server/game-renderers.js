window.ServerRescueModules = window.ServerRescueModules || {};

window.ServerRescueModules.createGameRenderers = function createGameRenderers({
    elements,
    appString,
    runtimeString,
    soundFX,
    createSparks,
    robotBaseClass,
    robotIconBaseClass
}) {
    let typeWriterTimeout = null;

    function cancelTypeWriter() {
        if (typeWriterTimeout) {
            clearTimeout(typeWriterTimeout);
            typeWriterTimeout = null;
        }
    }

    function updateRobotEmotion(state) {
        elements.robotAvatar.className = robotBaseClass;
        elements.robotIcon.className = robotIconBaseClass;

        const emotions = {
            happy: {
                avatar: ['bg-green-900', 'border-green-400'],
                icon: ['fa-face-smile', 'text-green-200'],
                glow: 'robot-glow--happy animate-pulse'
            },
            sad: {
                avatar: ['bg-red-900', 'border-red-400'],
                icon: ['fa-face-frown-open', 'text-red-200'],
                glow: 'robot-glow--sad animate-pulse'
            },
            neutral: {
                avatar: ['bg-blue-900', 'border-blue-400'],
                icon: ['fa-robot', 'text-white'],
                glow: 'robot-glow--neutral animate-pulse'
            }
        };

        const currentEmotion = emotions[state] || emotions.neutral;
        elements.robotAvatar.classList.add(...currentEmotion.avatar);
        elements.robotIcon.classList.add(...currentEmotion.icon);
        elements.robotGlow.className = `absolute inset-0 rounded-full blur-lg transition-colors duration-300 ${currentEmotion.glow}`;
    }

    function updateHealthUI(currentHealth) {
        elements.healthBar.style.width = `${currentHealth}%`;
        elements.healthBar.setAttribute('aria-valuenow', currentHealth);
        elements.healthBar.setAttribute('aria-valuetext', `${runtimeString('healthAnnouncement')} ${currentHealth}%`);

        let colorClass = 'bg-green-500';
        if (currentHealth <= 30) colorClass = 'bg-red-500';
        else if (currentHealth <= 70) colorClass = 'bg-yellow-500';

        elements.healthBar.className = `h-full ${colorClass} transition-all duration-500`;
    }

    function typeWriter(text, element, speed = 20) {
        cancelTypeWriter();
        element.textContent = '';
        element.classList.add('typing-effect');

        let currentIndex = 0;
        function typeNextCharacter() {
            if (currentIndex < text.length) {
                element.textContent += text.charAt(currentIndex);
                currentIndex += 1;
                typeWriterTimeout = setTimeout(typeNextCharacter, speed);
                return;
            }

            element.classList.remove('typing-effect');
        }

        typeNextCharacter();
    }

    function renderTimerWarning({ onExtend, showFooterPanel }) {
        showFooterPanel();
        elements.footerContent.className = 'footer-panel p-4 md:p-6 border-t-4 bg-slate-800 border-yellow-400 flex flex-col md:flex-row items-center justify-between gap-4';
        elements.footerContent.innerHTML = `
            <div class="flex items-start gap-4 flex-1 timer-warning">
                <i class="fas fa-clock text-3xl mt-1 shrink-0 text-yellow-300"></i>
                <div>
                    <h4 class="font-bold text-white text-lg mb-1">${runtimeString('timerWarningTitle')}</h4>
                    <p class="text-slate-300 text-sm md:text-base">${runtimeString('timerWarningText')}</p>
                </div>
            </div>
        `;

        const extendBtn = document.createElement('button');
        extendBtn.className = 'action-button action-button--warning md:w-auto touch-manipulation shrink-0';
        extendBtn.innerHTML = runtimeString('timerWarningButton');
        extendBtn.addEventListener('click', () => {
            soundFX.playClick();
            onExtend();
        });
        elements.footerContent.appendChild(extendBtn);
    }

    function showFeedback({ isSuccess, message, showFooterPanel, announceStatus }) {
        showFooterPanel();

        const title = isSuccess ? runtimeString('correctTitle') : runtimeString('incorrectTitle');
        const icon = isSuccess
            ? 'fa-check-circle text-green-400'
            : 'fa-times-circle text-red-400';
        const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';

        elements.footerContent.className = `footer-panel p-4 md:p-6 border-t-4 bg-slate-800 ${borderColor} flex flex-col md:flex-row items-center justify-between gap-4`;
        elements.footerContent.innerHTML = `
            <div class="flex items-start gap-4 flex-1">
                <i class="fas ${icon} text-3xl mt-1 shrink-0"></i>
                <div>
                    <h4 class="font-bold text-white text-lg mb-1">${title}</h4>
                    <p class="text-slate-300 text-sm md:text-base">${message}</p>
                </div>
            </div>
        `;

        announceStatus(`${title} ${message}`);
    }

    function hideFeedback() {
        elements.gameFooter.classList.remove('is-visible');
        elements.gameFooter.classList.add('is-hidden');
    }

    function renderOptions(options, handleAnswer) {
        if (elements.interactionArea.hasChildNodes()) return;

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-fade-in';
        grid.setAttribute('aria-label', runtimeString('keyboardHint'));

        options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'answer-option group relative bg-slate-800 border-2 border-slate-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg text-left flex items-center gap-4 touch-manipulation';
            btn.dataset.optionIndex = index;
            btn.setAttribute('aria-label', `${runtimeString('optionPrefix')} ${index + 1}: ${option.text}`);
            btn.innerHTML = `
                <div class="w-10 h-10 bg-slate-700 group-hover:bg-blue-600 rounded-full flex items-center justify-center shrink-0 transition-colors">
                    <i class="fas ${option.icon} text-xl"></i>
                </div>
                <div class="flex-1">
                    <div class="text-xs text-slate-400 mb-0.5">${index + 1}</div>
                    <div class="text-sm md:text-base">${option.text}</div>
                </div>
            `;

            btn.addEventListener('click', () => handleAnswer(option, btn));
            grid.appendChild(btn);
        });

        elements.interactionArea.appendChild(grid);
    }

    function showNextButton(onNext) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'action-button action-button--primary md:w-auto touch-manipulation shrink-0 whitespace-nowrap';
        nextBtn.innerHTML = runtimeString('nextButton');
        nextBtn.setAttribute('data-nav-action', 'next');
        nextBtn.addEventListener('click', onNext);

        elements.footerContent.appendChild(nextBtn);
        nextBtn.focus();
    }

    function showEndScreen({
        isVictory,
        reason,
        currentHealth,
        totalErrors,
        failedTopics,
        announceStatus,
        announceAlert
    }) {
        elements.victoryScreen.classList.remove('hidden');
        document.getElementById('final-health').innerText = `${currentHealth}%`;
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
            failedList.innerHTML = failedTopics.map((topic) =>
                `<div class="flex items-start gap-2"><i class="fas fa-exclamation-triangle text-yellow-500 mt-1"></i><span>${topic.topic}</span></div>`
            ).join('');
        }

        if (isVictory) {
            title.innerText = appString('endTitleVictory');
            title.classList.remove('text-red-500');
            summary.innerHTML = runtimeString('victorySummary');
            localStorage.removeItem('serverRescue_progress');
            announceStatus(runtimeString('victoryAnnouncement'));
        } else {
            title.innerText = runtimeString('failureTitle');
            title.classList.add('text-red-500');
            summary.innerHTML = reason === 'study_needed'
                ? runtimeString('studyNeededSummary')
                : runtimeString('failureSummary');
            announceAlert(runtimeString('endAnnouncement'));
        }

        elements.restartBtn.focus();
    }

    function celebrateCorrectAnswer(button) {
        const rect = button.getBoundingClientRect();
        createSparks(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    return {
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
    };
};
