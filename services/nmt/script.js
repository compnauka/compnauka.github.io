// Firebase config previously inlined in index.html
const firebaseConfig = {
    apiKey: "AIzaSyBgyNmD9ixU_vHOo-MM4_UARiHU35hlt6k",
    authDomain: "tests4-2a91a.firebaseapp.com",
    projectId: "tests4-2a91a",
    storageBucket: "tests4-2a91a.firebasestorage.app",
    messagingSenderId: "706201183615",
    appId: "1:706201183615:web:7104601b8da69ee1ff664a"
  };
  const __firebase_config = JSON.stringify(firebaseConfig);
  
  // Centralized Firebase service
  import {
    app, auth, db, isFirebaseActive, initFirebase,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged,
    GoogleAuthProvider, signInWithPopup, signInWithCustomToken, signInAnonymously,
    sendEmailVerification,
    doc, getDoc, setDoc, updateDoc, increment, onSnapshot
  } from './services/firebase.js';
  
  // Firebase state now comes from service


  // Імпорт функцій валідації (додайте на початок файлу)
  import { 
    validateEmail, 
    validatePassword, 
    RecaptchaService,
    showPasswordStrength,
    showValidationErrors 
  } from './utils/validation.js';

  // Ініціалізація reCAPTCHA (замініть YOUR_SITE_KEY на ваш ключ)
  const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Тестовий ключ
  const recaptchaService = new RecaptchaService(RECAPTCHA_SITE_KEY);

  // Завантажити reCAPTCHA при старті
  recaptchaService.load().catch(error => {
    console.error('Не вдалося завантажити reCAPTCHA:', error);
  });
  
  // DOM and UI helpers
  import { getRefs, showScreen, setLoadingState, showToast, showModal, hideModal, focusableElementsSelector } from './ui/dom.js';
  // ЗМІНА: Додано infoModal
  const { welcomeContainer, authContainer, dashboardContainer, testContainer, resultsModal, reviewModal, confirmationModal, infoModal, optionsContainer } = getRefs();
  
  // State
  let currentUser = null;
  let currentUserData = null;
  let unsubscribeUserDataListener = null;
  let currentTest = { questions: [], subject: '', currentIndex: 0, score: 0, mode: 'practice', reviewData: [] };
  import { createTimer } from './features/timer.js';
  import { displayQuestion as renderQuestion, updateProgressUI as renderProgress, showReview as renderReview } from './features/quiz.js';
  let timerApi = null;
  const TEST_LENGTH = 5;
  let activeTestSessionId = null;
  let previouslyFocusedElement = null;
  
  // Data moved to module
  import { questions, badges } from './data/questions.js';
  
  // UI helpers
  // moved to ui/dom.js
  
  function setMode(mode){
    currentTest.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn=>{
      const isActive = btn.dataset.mode === mode;
      btn.classList.toggle('border-2',isActive);
      btn.classList.toggle('border-blue-500',isActive);
      btn.classList.toggle('bg-blue-100',isActive);
      btn.classList.toggle('bg-white',!isActive);
      btn.classList.toggle('is-active',isActive);
    });
  }
  
  // ЗМІНА: Нова функція для показу інформаційного модального вікна
  function showInfoModal(title, text) {
    const titleEl = document.getElementById('info-title');
    const textEl = document.getElementById('info-text');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    showModal(infoModal);
  }
  
  window.addEventListener('beforeunload',(event)=>{
    if(activeTestSessionId){
      event.preventDefault();
      event.returnValue = '';
    }
  });
  
  // Auth + RT data
  function setupAuthListener(){
    onAuthStateChanged(auth, async (user)=>{
      if(unsubscribeUserDataListener) unsubscribeUserDataListener();
      if(user && !user.isAnonymous){
        if (!user.emailVerified) {
          showScreen('welcome');
          // ЗМІНА: Замінено alert на модальне вікно
          showInfoModal(
            'Акаунт не активовано',
            'Будь ласка, перевірте свою пошту та перейдіть за посиланням для підтвердження.'
          );
          signOut(auth);
          currentUser = null;
          currentUserData = null;
        } else {
          currentUser = user;
          listenToUserData(user.uid);
          await trySyncOfflineScores();
          showScreen('dashboard');
        }
      }else{
        currentUser = null; currentUserData = null;
        setMode('practice'); showScreen('welcome');
      }
    });
  }
  
  function listenToUserData(userId){
    const userDocRef = doc(db, 'users', userId);
    unsubscribeUserDataListener = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const newUserData = docSnap.data();
        const oldBadges = currentUserData ? new Set(currentUserData.badges) : new Set();
        currentUserData = newUserData;
        updateDashboard();
  
        // Перевірка нагород
        const awardedBadges = [];
        for (const badgeId in badges) {
          const badge = badges[badgeId];
          if (!newUserData.badges.includes(badgeId)) {
            const checkScore = badge.subject === 'total' ? newUserData.totalScore : (newUserData.scores[badge.subject] || 0);
            if (checkScore >= badge.score) {
              awardedBadges.push(badgeId);
            }
          }
        }
  
        if (awardedBadges.length > 0) {
          const newlyAwarded = awardedBadges.filter(b => !oldBadges.has(b));
          if (newlyAwarded.length > 0) {
              const lastBadge = badges[newlyAwarded[newlyAwarded.length - 1]];
              document.getElementById('new-badge').innerHTML = `<i class="${lastBadge.icon}"></i>`;
              document.getElementById('new-badge-name').textContent = lastBadge.name;
              document.getElementById('new-badge-container').classList.remove('hidden');
          }
          // Оновлюємо список бейджів у базі даних
          const allBadges = [...newUserData.badges, ...awardedBadges];
          await updateDoc(userDocRef, { badges: allBadges }).catch(e => console.error('Error awarding badges:', e));
        }
  
      } else {
        const newUserData = {
          email: currentUser.email, totalScore: 0, badges: [],
          scores: { math: 0, ukrainian: 0, english: 0 }
        };
        await setDoc(userDocRef, newUserData).catch(e => console.error('Error creating user doc:', e));
        currentUserData = newUserData;
        updateDashboard();
      }
    }, (error) => {
      console.error('Error listening to user data:', error);
      showToast('Помилка синхронізації профілю.');
    });
  }
  
  
  async function saveScore(score,subject,retries=3,delay=1000){
    if(!currentUser || !isFirebaseActive || score===0) return;
    const userDocRef = doc(db,'users',currentUser.uid);
    try{
      await updateDoc(userDocRef,{
        totalScore: increment(score),
        [`scores.${subject}`]: increment(score)
      });
    }catch(error){
      if(error.code==='unavailable' && retries>0){
        console.warn(`Network error. Retrying in ${delay}ms... (${retries} left)`);
        setTimeout(()=>saveScore(score,subject,retries-1,delay*2),delay);
      }else{
        console.error('Failed to save score:',error);
        showToast('Помилка збереження. Результат збережено локально.');
        saveScoreOffline(score,subject);
        throw error;
      }
    }
  }
  
  function saveScoreOffline(score,subject){
    const offlineScores = JSON.parse(localStorage.getItem('offlineScores')||'[]');
    offlineScores.push({ score, subject, timestamp: Date.now() });
    localStorage.setItem('offlineScores',JSON.stringify(offlineScores));
  }
  
  async function trySyncOfflineScores(){
    const q = JSON.parse(localStorage.getItem('offlineScores')||'[]');
    if(q.length===0 || !isFirebaseActive || !currentUser) return;
    showToast(`Синхронізація ${q.length} незбережених результатів...`,'info');
    const pending = [];
    for(const item of q){
      try{ await saveScore(item.score,item.subject); }
      catch{ pending.push(item); }
    }
    localStorage.setItem('offlineScores',JSON.stringify(pending));
    if(q.length>0 && pending.length===0) showToast('Синхронізацію завершено!','success');
    else if(pending.length>0) showToast(`Не вдалося синхронізувати ${pending.length} результат(и).`,'error');
  }
  
  function updateDashboard(){
    const userEmailDisplay = document.getElementById('user-email-display');
    const totalScoreDisplay = document.getElementById('total-score');
    const badgesContainer = document.getElementById('badges-container');
    if(!currentUserData || !currentUser) return;
    userEmailDisplay.textContent = currentUser.email;
    totalScoreDisplay.textContent = currentUserData.totalScore||0;
    badgesContainer.innerHTML = '';
    if(currentUserData.badges && currentUserData.badges.length>0){
      currentUserData.badges.forEach(badgeId=>{
        const badge = badges[badgeId];
        if(badge){
          const el = document.createElement('div');
          el.className = 'badge text-4xl cursor-pointer text-yellow-500';
          el.title = badge.name;
          el.innerHTML = `<i class="${badge.icon}" aria-hidden="true"></i>`;
          badgesContainer.appendChild(el);
        }
      });
    }else{
      badgesContainer.innerHTML = '<p class="text-gray-500">Поки що немає нагород.</p>';
    }
    setMode('practice');
  }
  
  function shuffleArray(array){
    let currentIndex = array.length, randomIndex;
    while(currentIndex>0){
      randomIndex = Math.floor(Math.random()*currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }
  
  function startTest(subject){
    const testSessionId = Date.now();
    activeTestSessionId = testSessionId;
  
    const startBtn = document.querySelector(`.start-test-btn[data-subject="${subject}"]`);
    setLoadingState(startBtn,true);
  
    setTimeout(()=>{
      if(activeTestSessionId!==testSessionId) return;
  
      currentTest.subject = subject;
      currentTest.questions = shuffleArray([...questions[subject]]).slice(0,TEST_LENGTH);
      currentTest.currentIndex = 0;
      currentTest.score = 0;
      currentTest.reviewData = [];
  
      document.getElementById('test-title').textContent = { math:'Математика', ukrainian:'Українська мова', english:'Англійська' }[subject];
      document.getElementById('total-questions-num').textContent = currentTest.questions.length;
      document.getElementById('current-question-num').textContent = 0;
      document.getElementById('progress-bar').style.width = '0%';
  
      const modeIndicator = document.getElementById('test-mode-indicator');
      modeIndicator.textContent = currentTest.mode==='exam' ? 'Іспит' : 'Навчання';
      modeIndicator.className = `text-xs sm:text-sm font-semibold px-3 py-1 rounded-full ml-3 ${currentTest.mode==='exam' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`;
  
      setLoadingState(startBtn,false);
      showScreen('test');
      displayQuestion();
  
      if(currentTest.mode==='exam' && timerApi) timerApi.start();
      else document.getElementById('timer-display').classList.add('hidden');
    },300);
  }
  
  function displayQuestion(){ renderQuestion(currentTest, optionsContainer, radioKeyHandler); }
  
  function updateProgressUI(){ renderProgress(currentTest); }
  
  function nextQuestion(){
    currentTest.currentIndex++;
    if(currentTest.currentIndex < currentTest.questions.length){
      displayQuestion();
    }else{
      endTest();
    }
  }
  
  async function endTest(timedOut=false){
    activeTestSessionId = null;
    if(timerApi) timerApi.stop();
  
    // скидання таймера
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    if(timerMinutes) timerMinutes.textContent = '5';
    if(timerSeconds) timerSeconds.textContent = '00';
  
    showModal(resultsModal);
    document.getElementById('results-score').textContent = currentTest.score;
    document.getElementById('results-total').textContent = currentTest.questions.length;
    document.getElementById('time-up-message').classList.toggle('hidden', !timedOut);
    document.getElementById('new-badge-container').classList.add('hidden');
  
    // «Переглянути відповіді» — завжди доступно
    document.getElementById('review-answers-btn').classList.remove('hidden');
  
    if(currentUser && isFirebaseActive && !currentUser.isAnonymous){
      document.getElementById('guest-prompt').classList.add('hidden');
      await saveScore(currentTest.score,currentTest.subject);
    }else{
      document.getElementById('guest-prompt').classList.remove('hidden');
      saveScoreOffline(currentTest.score,currentTest.subject);
    }
  }
  
  // timer moved to features/timer
  
  function showReview(){ renderReview(currentTest, { resultsModal, reviewModal, showModal, hideModal }); }
  
  // A11y: radio keyboard handler
  function radioKeyHandler(e){
    const radios = [...optionsContainer.querySelectorAll('.option-btn[role="radio"]')];
    if(radios.length===0) return;
    let i = radios.indexOf(document.activeElement);
    if(e.key==='ArrowDown' || e.key==='ArrowRight'){
      i = (i+1+radios.length)%radios.length; radios[i].focus(); e.preventDefault();
    }else if(e.key==='ArrowUp' || e.key==='ArrowLeft'){
      i = (i-1+radios.length)%radios.length; radios[i].focus(); e.preventDefault();
    }else if(e.key===' ' || e.key==='Enter'){
      if(document.activeElement && document.activeElement.classList.contains('option-btn')){
        document.activeElement.click(); e.preventDefault();
      }
    }
  }
  
  // moved to ui/dom.js
  
  const getAuthErrorMessage = (code)=>{
    switch(code){
      case 'auth/wrong-password': return 'Неправильний пароль.';
      case 'auth/user-not-found': return 'Користувача не знайдено.';
      case 'auth/email-already-in-use': return 'Ця пошта вже зареєстрована.';
      case 'auth/weak-password': return 'Пароль має містити > 5 символів.';
      case 'auth/popup-closed-by-user': return 'Вікно входу було закрито.';
      default: return 'Виникла помилка. Спробуйте пізніше.';
    }
  };
  
  function setupEventListeners(){
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const googleSigninBtn = document.getElementById('google-signin-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const saveProgressBtn = document.getElementById('save-progress-btn');
    const toggleAuthLink = document.getElementById('toggle-auth');
    const showLoginBtn = document.getElementById('show-login-btn');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quitTestBtn = document.getElementById('quit-test-btn');
    const cancelActionBtn = document.getElementById('cancel-action-btn');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const reviewAnswersBtn = document.getElementById('review-answers-btn');
    const closeReviewBtn = document.getElementById('close-review-btn');
    const infoOkBtn = document.getElementById('info-ok-btn'); // <-- ЗМІНА: Додано
  
    // ============================================
    // ВАЛІДАЦІЯ В РЕАЛЬНОМУ ЧАСІ
    // ============================================
    
    const registerPasswordInput = document.getElementById('register-password');
    if (registerPasswordInput) {
      registerPasswordInput.addEventListener('input', (e) => {
        showPasswordStrength(e.target.value, 'register-password-strength');
      });
    }
  
    // ============================================
    // ФОРМА РЕЄСТРАЦІЇ З ВАЛІДАЦІЄЮ
    // ============================================
    
    if (isFirebaseActive && registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('#register-email').value;
        const password = form.querySelector('#register-password').value;
        const submitButton = form.querySelector('button[type="submit"]');
        
        showValidationErrors([], 'register-validation-errors');
        document.getElementById('auth-error').textContent = '';
        
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          showValidationErrors(emailValidation.errors, 'register-validation-errors');
          return;
        }
        
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          showValidationErrors(passwordValidation.errors, 'register-validation-errors');
          return;
        }
        
        if (passwordValidation.strength < 3) {
          const confirmWeak = confirm(
            'Ваш пароль має низьку надійність. Рекомендуємо використати надійніший пароль.\n\n' +
            'Поради:\n' +
            passwordValidation.warnings.join('\n') +
            '\n\nПродовжити з поточним паролем?'
          );
          if (!confirmWeak) return;
        }
        
        setLoadingState(submitButton, true);
        
        try {
          const recaptchaToken = await recaptchaService.getToken('register');
          console.log('reCAPTCHA token отримано:', recaptchaToken ? 'OK' : 'Failed');
          
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          await sendEmailVerification(userCredential.user);

          // ЗМІНА: Замінено alert на модальне вікно
          showInfoModal(
            'Підтвердження реєстрації',
            'Ми відправили вам лист для підтвердження. Будь ласка, перейдіть за посиланням у ньому, щоб активувати акаунт.'
          );
          
        } catch (error) {
          console.error('Помилка реєстрації:', error);
          const errorMessage = getAuthErrorMessage(error.code);
          document.getElementById('auth-error').textContent = errorMessage;
          recaptchaService.reset();
        } finally {
          setLoadingState(submitButton, false);
        }
      });
    }
  
    // ============================================
    // ФОРМА ЛОГІНУ З ВАЛІДАЦІЄЮ
    // ============================================
    
    if (isFirebaseActive && loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('#login-email').value;
        const password = form.querySelector('#login-password').value;
        const submitButton = form.querySelector('button[type="submit"]');
        
        showValidationErrors([], 'login-validation-errors');
        document.getElementById('auth-error').textContent = '';
        
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          showValidationErrors(emailValidation.errors, 'login-validation-errors');
          return;
        }
        
        if (!password || password.length < 6) {
          showValidationErrors(['Пароль має містити щонайменше 6 символів'], 'login-validation-errors');
          return;
        }
        
        setLoadingState(submitButton, true);
        
        try {
          const recaptchaToken = await recaptchaService.getToken('login');
          console.log('reCAPTCHA token отримано:', recaptchaToken ? 'OK' : 'Failed');
          
          await signInWithEmailAndPassword(auth, email, password);
          showToast('Ви успішно увійшли!', 'success');
          
        } catch (error) {
          console.error('Помилка входу:', error);
          const errorMessage = getAuthErrorMessage(error.code);
          document.getElementById('auth-error').textContent = errorMessage;
          recaptchaService.reset();
        } finally {
          setLoadingState(submitButton, false);
        }
      });
    }
  
    // ============================================
    // ВХІД ЧЕРЕЗ GOOGLE
    // ============================================
    
    if (isFirebaseActive && googleSigninBtn) {
      googleSigninBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        document.getElementById('auth-error').textContent = '';
        setLoadingState(googleSigninBtn, true);
        
        try {
          const recaptchaToken = await recaptchaService.getToken('google_signin');
          console.log('reCAPTCHA token отримано:', recaptchaToken ? 'OK' : 'Failed');
          
          await signInWithPopup(auth, provider);
          showToast('Ви успішно увійшли через Google!', 'success');
          
        } catch (error) {
          console.error('Помилка входу через Google:', error);
          document.getElementById('auth-error').textContent = getAuthErrorMessage(error.code);
          recaptchaService.reset();
          
        } finally {
          setLoadingState(googleSigninBtn, false);
        }
      });
    }
  
    // ============================================
    // ВИХІД З АКАУНТА
    // ============================================
    
    if (isFirebaseActive && logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (unsubscribeUserDataListener) unsubscribeUserDataListener();
        signOut(auth);
        showToast('Ви вийшли з акаунта', 'info');
      });
    }
  
    // answer click
    optionsContainer.addEventListener('click',(e)=>{
      const button = e.target.closest('.option-btn');
      if(!button || button.disabled) return;
  
      const selectedIndex = parseInt(button.dataset.index,10);
      const q = currentTest.questions[currentTest.currentIndex];
      const isCorrect = selectedIndex===q.correct;
  
      if(isCorrect) currentTest.score++;
      currentTest.reviewData.push({ question:q, selectedIndex });
  
      const all = optionsContainer.querySelectorAll('.option-btn');
      all.forEach((btn, idx)=>{
        btn.disabled = true;
        btn.setAttribute('aria-checked', btn===button);
      });
  
      const feedbackIcon = document.createElement('span');
      feedbackIcon.className = 'feedback-icon ml-auto text-2xl';
      feedbackIcon.innerHTML = isCorrect ? '✓' : '✗';
  
      button.classList.add(isCorrect ? 'correct' : 'incorrect');
      button.appendChild(feedbackIcon);
  
      if (currentTest.mode === 'practice' && !isCorrect) {
          const rightButton = optionsContainer.querySelector(`.option-btn[data-index="${q.correct}"]`);
          if (rightButton) {
              const correctIcon = document.createElement('span');
              correctIcon.className = 'feedback-icon ml-auto text-2xl';
              correctIcon.innerHTML = '✓';
              rightButton.classList.add('correct');
              rightButton.appendChild(correctIcon);
          }
      }
  
      if(currentTest.mode==='practice'){
        document.getElementById('explanation-text').textContent = q.explanation;
        document.getElementById('explanation-container').classList.remove('hidden');
      }
  
      updateProgressUI();
  
      const nextBtn = document.getElementById('next-question-btn');
      nextBtn.textContent = (currentTest.currentIndex===currentTest.questions.length-1) ? 'Завершити тест' : 'Наступне питання';
      nextBtn.classList.remove('hidden');
      nextBtn.focus();
  
      optionsContainer.removeEventListener('keydown', radioKeyHandler);
    });
  
    document.querySelectorAll('.start-test-btn').forEach(btn=>{
      btn.addEventListener('click',()=>startTest(btn.dataset.subject));
    });
    document.querySelectorAll('.mode-btn').forEach(btn=>{
      btn.addEventListener('click',()=>setMode(btn.dataset.mode));
    });
  
    backToMainBtn.addEventListener('click',()=>{
      hideModal(resultsModal);
      if(currentUser && isFirebaseActive && !currentUser.isAnonymous) showScreen('dashboard');
      else showScreen('welcome');
    });
  
    saveProgressBtn.addEventListener('click',()=>{
      hideModal(resultsModal);
      showScreen('auth');
    });
  
    toggleAuthLink.addEventListener('click',(e)=>{
      e.preventDefault();
      document.getElementById('login-form').classList.toggle('hidden');
      document.getElementById('register-form').classList.toggle('hidden');
      toggleAuthLink.textContent =
        document.getElementById('login-form').classList.contains('hidden') ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Зареєструватися';
      document.getElementById('auth-error').textContent = '';
    });
  
    document.getElementById('show-login-btn').addEventListener('click',(e)=>{ e.preventDefault(); showScreen('auth'); });
    document.getElementById('back-to-welcome-btn').addEventListener('click',()=>showScreen('welcome'));
    document.getElementById('next-question-btn').addEventListener('click',nextQuestion);
  
    // quit flow
    quitTestBtn.addEventListener('click',()=>{ if(timerApi) timerApi.pause(); showModal(confirmationModal); });
    cancelActionBtn.addEventListener('click',()=>{ hideModal(confirmationModal); if(timerApi) timerApi.resume(); });
    confirmActionBtn.addEventListener('click',()=>{
      hideModal(confirmationModal);
      activeTestSessionId = null;
      if(timerApi) timerApi.stop();
      if(currentUser && isFirebaseActive && !currentUser.isAnonymous) showScreen('dashboard');
      else showScreen('welcome');
    });
  
    // review
    reviewAnswersBtn.addEventListener('click',showReview);
    closeReviewBtn.addEventListener('click',()=>{
      hideModal(reviewModal);
      if(currentUser && isFirebaseActive && !currentUser.isAnonymous) showScreen('dashboard');
      else showScreen('welcome');
    });

    // ЗМІНА: Додано обробник для кнопки "OK"
    if (infoOkBtn) {
      infoOkBtn.addEventListener('click', () => hideModal(infoModal));
    }
  
    // Safety: global delegated handler to ensure clicks always work
    document.addEventListener('click',(e)=>{
      const startBtn = e.target.closest('.start-test-btn');
      if(startBtn){ startTest(startBtn.dataset.subject); return; }
      const modeBtn = e.target.closest('.mode-btn');
      if(modeBtn){ setMode(modeBtn.dataset.mode); }
    });
  }
  
  // Initial setup
  (async()=>{
    setMode('practice');
  
    try{
      if(typeof __firebase_config!=='undefined' && __firebase_config){
        const cfg = JSON.parse(__firebase_config);
        if(cfg.apiKey && cfg.projectId){
          await initFirebase(cfg);
        }else{ throw new Error('Firebase config is missing essential keys.'); }
      }else{ throw new Error('__firebase_config is not defined.'); }
    }catch(error){
      console.warn('Firebase initialization failed:', error.message, 'App will run in offline mode.');
    }
  
    if(isFirebaseActive){
      setupAuthListener();
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible'){ trySyncOfflineScores(); }
      });
  
      if(typeof __initial_auth_token!=='undefined' && __initial_auth_token){
        try{ await signInWithCustomToken(auth,__initial_auth_token); }
        catch(error){
          console.error('Custom token sign-in failed:',error);
          try{ await signInAnonymously(auth); }catch(e){ console.error('Anonymous sign-in fallback failed:',e); }
        }
      }else{
        try{ await signInAnonymously(auth); }catch(e){ console.error('Anonymous sign-in failed:',e); }
      }
  
      await trySyncOfflineScores();
    }else{
      document.querySelectorAll('#show-login-btn, #google-signin-btn, #login-form, #register-form, #toggle-auth, #save-progress-btn, #logout-btn').forEach(el=>{
        el.style.opacity='.5'; el.style.pointerEvents='none'; if(el.tagName==='BUTTON') el.setAttribute('disabled',true);
      });
      const authText = document.querySelector('a#show-login-btn')?.parentElement;
      if(authText) authText.innerHTML = 'Збереження прогресу недоступне.';
      showScreen('welcome');
    }
  
    setupEventListeners();
  
    // init timer API after DOM is ready and state is set
    timerApi = createTimer({
      onTimeout: ()=>endTest(true),
      getActiveTestSessionId: ()=>activeTestSessionId,
      getMode: ()=>currentTest.mode
    });
  })();
