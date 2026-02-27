/* ══════════════════════════════════════════════════════════════
   AUDIO
══════════════════════════════════════════════════════════════ */
const Snd = {
  ctx: null, muted: false,
  _init()   { if (!this.ctx) this.ctx = new (window.AudioContext||window.webkitAudioContext)(); },
  _resume() { if (!this.muted && this.ctx?.state==='suspended') this.ctx.resume().catch(()=>{}); },
  toggleMute(btn) {
    this.muted = !this.muted;
    const ic = btn.querySelector('i');
    ic.className = this.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    btn.classList.toggle('muted', this.muted);
  },
  _tone(freq, type, dur, v0=0.06, v1=0.001) {
    if (this.muted) return;
    this._init(); this._resume();
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (type === 'triangle') o.frequency.exponentialRampToValueAtTime(freq/4, this.ctx.currentTime+dur);
    g.gain.setValueAtTime(v0, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(v1, this.ctx.currentTime+dur);
    o.start(); o.stop(this.ctx.currentTime+dur+.05);
  },
  click()   { this._tone(500,'triangle',.04); },
  error()   { this._tone(180,'sawtooth',.14,.1); },
  success() {
    if (this.muted) return;
    [523,659,784,1047].forEach((f,i) => setTimeout(() => this._tone(f,'sine',.22,.1), i*55));
  },
  streak()  {
    if (this.muted) return;
    [784,988,1175,1568].forEach((f,i) => setTimeout(() => this._tone(f,'sine',.18,.12), i*45));
  },
  testEnd() {
    if (this.muted) return;
    [523,659,784,880,1047].forEach((f,i) => setTimeout(() => this._tone(f,'sine',.3,.15), i*80));
  }
};

/* ══════════════════════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════════════════════ */
const Store = {
  get(lang)          { return parseInt(localStorage.getItem(`sd_best_${lang}`)    || '0', 10); },
  getWpm(lang)       { return parseInt(localStorage.getItem(`sd_wpm_${lang}`)     || '0', 10); },
  save(score, lang)  {
    if (score > this.get(lang)) { localStorage.setItem(`sd_best_${lang}`, String(score)); return true; }
    return false;
  },
  saveWpm(wpm, lang) {
    if (wpm > this.getWpm(lang)) { localStorage.setItem(`sd_wpm_${lang}`, String(wpm)); return true; }
    return false;
  }
};

/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */
const DATA = {
  uk: {
    words: [...new Set([
      /* very short, easy (≤4 chars) */
      "він","вона","вони","його","час","все","мій","так","щоб","ще","де","як",
      "рік","рот","ніс","ліс","мир","дім","пес","кіт","лис","вух","рак",
      /* short (5 chars) */
      "люди","коли","було","мене","дуже","мені","тому","тебе","який","себе",
      "може","вже","того","буде","треба","лише","можна","тут","день","свою",
      "тепер","йому","свої","інші","навіть","хочу","куди","тоді","теж","очі",
      "руки","ніби","поки","мама","тато","брат","мова","вода","небо","поле",
      "ріка","море","гора","село","хата","стіл","школа","клас","урок","ручка",
      "друг","сила","воля","слава","пісня","душа","серце","любов","мрія","надія",
      "віра","правда","краса","добро","успіх","праця","знати","жити","часто",
      "сонце","земля","ліжко","хліб","голова","одяг","дорога","грати","камінь",
      "птах","риба","кішка","кінь","курка","яйце","яблуко","число","один","три",
      "учень","зошит","файл","гра","спорт",
      /* medium (6–8 chars) */
      "ніхто","кожен","завжди","ніколи","рідко","батько","сестра","кімната",
      "молоко","куртка","пісок","дерево","квітка","трава","корова","чотири",
      "школяр","учитель","олівець","гумка","мишка","екран","програма","графіка",
      "звук","кнопка","меню","папка","вулиця","хлопець","дівчина","малюнок",
      "вчора","зустріч","початок","кінець","думка","слово","речення","відповідь",
      "сьогодні","завтра","природа","тварина","навчання","робота","музика",
      "собака","два","три","ніж","просто","багато","зараз","саме",
      "яка","доки","кого","були","радість",
      /* hard (9+ chars) with apostrophe words */
      "клавіатура","навчання","комп'ютер","пам'ять","сім'я","м'яч","п'ять",
      "суспільство","відповідь","підготовка","результати","знайомство",
      "продовжувати","відчувати","навколишній","захоплення","організація"
    ])],
    layout: [
      ['й','ц','у','к','е','н','г','ш','щ','з','х','ї'],
      ['ф','і','в','а','п','р','о','л','д','ж','є'],
      ['я','ч','с','м','и','т','ь','б','ю','.']
    ],
    milestones: [
      "Чудовий старт!","Ти справжній майстер!","Неймовірна швидкість!",
      "Продовжуй так само!","Клавіатурний геній!","Неперевершено!","Ти просто вогонь!"
    ],
    success: ["Чудово!","Так тримати!","Молодець!","Відмінно!","Супер!","Браво!","Вогонь!","Зачаровано!"],
    labels: {
      words:"Слова", errors:"Помилки", record:"Рекорд", acc:"Точність",
      wpm:"WPM", streak:"Серія", btnNext:"Далі",
      pressAny:"Натисни будь-яку клавішу", mTitle:"Супер!",
      mWords:"слів!",
      testBtn:"Тест",
      trTitle:"Результат тесту!",
      trWpmLbl:"WPM — Слів/хвилину",
      trWordsLbl:"Слів",
      trAccLbl:"Точність",
      trBestLbl:"Рекорд WPM",
      trRetry:"Повторити",
      trBack:"Практика",
      trNew:"🏆 Новий рекорд!",
      diffAll:"Всі рівні",
      diffLvl1:"Легко",
      diffLvl2:"Середньо",
      diffLvl3:"Складно",
      countdownReady:"Приготуйся!",
      countdownGo:"Вперед!",
      confirmTitle:"Зміна мови",
      confirmSub:"Поточний прогрес буде скинуто.\nПродовжити?",
      testInstrTitle:"Тест 1 хвилина",
      testInstrL1:"Друкуй слова з клавіатури",
      testInstrL2:"Пропускати слова не можна",
      testInstrL3:"Backspace — повертає на крок назад",
      testInstrL4:"Ціль — більше слів за хвилину",
      testInstrBtn:"Почати відлік!",
      testInstrHint:"Натисни Enter або кнопку",
      mashWarning:"Набирай правильно, а не навмання! 🙅",
      cancelTest:"Пізніше",
      obClose:"Закрити"
    }
  },
  en: {
    words: [...new Set([
      /* very short, easy */
      "cat","dog","run","sun","fun","big","get","let","bit","sit",
      "top","tip","cup","cut","map","nap","bat","hat","lap","cap",
      /* short (5 chars) */
      "about","other","which","first","would","these","click","price",
      "state","world","music","books","links","years","could","group",
      "games","start","today","pages","found","house","photo","power",
      "while","three","total","place","think","where","after","water",
      "guide","board","white","small","times","sites","level","thank",
      "phone","hours","black","plant","trade","radio","study","party",
      "early","given","light","every","field","large","point","never",
      "great","right","write","thing","check","stand","ready","story",
      "media","class","value","image","model","space","night","table",
      "event","order","range","cloud","focus","voice","offer","learn",
      "money","paper","track","terms","skill","brain","dream",
      /* medium (6–8 chars) */
      "people","number","system","program","screen","button","window",
      "folder","school","teacher","student","lesson","picture","family",
      "mother","father","brother","sister","animal","forest","river",
      "garden","kitchen","bedroom","office","project","player","friend",
      "energy","future","travel","planet","castle","shield","health",
      "score","record","leader","dragon","magic","brave","quick","stone",
      "earth","flame","storm","spark","sharp","clear","green","yellow",
      "orange","purple","silver","golden","nation",
      /* hard (9+ chars) */
      "mountain","ocean","flower","robot","happy","strong","keyboard",
      "practice","computer","internet","language","knowledge","adventure",
      "challenge","education","beautiful","wonderful","fantastic","incredible"
    ])],
    layout: [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['z','x','c','v','b','n','m',',','.']
    ],
    milestones: [
      "Great Start!","You're a Master!","Incredible Speed!",
      "Keep it Up!","Keyboard Genius!","Outstanding!","You're on Fire!"
    ],
    success: ["Great!","Awesome!","Well done!","Excellent!","Super!","Bravo!","On fire!","Nailed it!"],
    labels: {
      words:"Words", errors:"Errors", record:"Record", acc:"Accuracy",
      wpm:"WPM", streak:"Streak", btnNext:"Next",
      pressAny:"Press any key", mTitle:"Super!",
      mWords:"words!",
      testBtn:"Test",
      trTitle:"Test Result!",
      trWpmLbl:"WPM — Words per minute",
      trWordsLbl:"Words",
      trAccLbl:"Accuracy",
      trBestLbl:"WPM Record",
      trRetry:"Retry",
      trBack:"Practice",
      trNew:"🏆 New Record!",
      diffAll:"All Levels",
      diffLvl1:"Easy",
      diffLvl2:"Medium",
      diffLvl3:"Hard",
      countdownReady:"Get ready!",
      countdownGo:"Go!",
      confirmTitle:"Change Language",
      confirmSub:"Current progress will be reset.\nContinue?",
      testInstrTitle:"1 Minute Test",
      testInstrL1:"Type the words using your keyboard",
      testInstrL2:"You cannot skip words",
      testInstrL3:"Backspace — one step back",
      testInstrL4:"Goal — type as many words as possible",
      testInstrBtn:"Start Countdown!",
      testInstrHint:"Press Enter or the button",
      mashWarning:"Type carefully, not randomly! 🙅",
      cancelTest:"Later",
      obClose:"Close"
    }
  }
};

/* Pre-split words by difficulty after DATA definition */
['uk','en'].forEach(lang => {
  const words = DATA[lang].words;
  // For Ukrainian: exclude words with ґ from easy/medium pools
  // ґ requires AltGr on most keyboards and is taught only at advanced level
  const noGhe = lang === 'uk' ? (w => !/ґ/i.test(w)) : () => true;
  // Easy: ≤5 chars (not counting apostrophe)
  DATA[lang].easy   = words.filter(w => w.replace(/'/g,'').length <= 5).filter(noGhe);
  // Medium: 6–8 chars
  DATA[lang].medium = words.filter(w => { const l = w.replace(/'/g,'').length; return l >= 6 && l <= 8; }).filter(noGhe);
  // Hard: 9+ chars (ґ words allowed here)
  DATA[lang].hard   = words.filter(w => w.replace(/'/g,'').length >= 9);
});

/* ══════════════════════════════════════════════════════════════
   DOM REFS
══════════════════════════════════════════════════════════════ */
const esc = s => window.CSS?.escape ? CSS.escape(s) : String(s).replace(/["'\\[\]]/g, '\\$&');
const $   = id => document.getElementById(id);

const el = {
  word:    $('word-display'),
  score:   $('st-score'),   errors: $('st-errors'),
  record:  $('st-record'),  wpm:    $('st-wpm'),
  acc:     $('st-acc'),     streak: $('st-streak'),
  prog:    $('prog-bar'),
  msgArea: $('msg-area'),   msgText: $('msg-text'), msgIcon: $('msg-icon'),
  mModal:  $('milestone-modal'), mTitle: $('m-title'), mText: $('m-text'),
  mNextBtn:$('m-next-btn'), mBtnLabel:$('m-btn-label'), mHint: $('m-hint'),
  startModal:   $('start-modal'),    startBtn:    $('start-btn'),
  startTestBtn: $('start-test-btn'),
  confirmModal: $('confirm-modal'),  confirmYes:  $('confirm-yes'),
  confirmCancel:$('confirm-cancel'), confirmTitle:$('confirm-title'), confirmSub:$('confirm-sub'),
  tiModal: $('test-instr-modal'), tiTitle: $('ti-title'),
  tiL1: $('ti-l1'), tiL2: $('ti-l2'), tiL3: $('ti-l3'), tiL4: $('ti-l4'),
  tiStartBtn: $('ti-start-btn'), tiStartLbl: $('ti-start-lbl'), tiHint: $('ti-hint'),
  countdownModal: $('countdown-modal'), countdownNum: $('countdown-num'), countdownLabel: $('countdown-label'),
  testResultModal: $('test-result-modal'),
  trWpm:    $('tr-wpm'),
  trAcc:    $('tr-acc'),    trBest:    $('tr-best'),
  trWpmLbl: $('tr-wpm-lbl'),
  trAccLbl: $('tr-acc-lbl'),trBestLbl: $('tr-best-lbl'),
  trComment:$('tr-comment'),trTitle:   $('tr-title'),
  trWpmBox: $('tr-wpm-box'),trBestBox: $('tr-best-box'),
  trRetryBtn:$('tr-retry-btn'), trBackBtn:$('tr-back-btn'),
  trRetryLbl:$('tr-retry-lbl'),trBackLbl:$('tr-back-lbl'),
  testBanner:$('test-banner'), timerSec:$('timer-sec'),
  diffBadge: $('diff-badge'),
  langBtn: $('lang-btn'),   langLabel: $('lang-label'),
  soundBtn:$('sound-btn'),  kb: $('kb'),
  testBtn: $('test-btn'),   testBtnLabel: $('test-btn-label'),
  onboardModal: $('onboard-modal'),
  obNextBtn: $('ob-next-btn'), obSkipBtn: $('ob-skip-btn')
};

/* ══════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════ */
function updateLabels(lang) {
  const L = DATA[lang].labels;
  document.querySelector('[data-label="words"]').textContent    = L.words;
  document.querySelector('[data-label="errors"]').textContent   = L.errors;
  document.querySelector('[data-label="record"]').textContent   = L.record;
  document.querySelector('[data-label="accuracy"]').textContent = L.acc;
  document.querySelector('[data-label="wpm"]').textContent      = L.wpm;
  document.querySelector('[data-label="streak"]').textContent   = L.streak;
  el.mBtnLabel.textContent   = L.btnNext;
  el.mHint.textContent       = L.pressAny;
  el.mTitle.textContent      = L.mTitle;
  el.langLabel.textContent   = lang.toUpperCase();
  el.testBtnLabel.textContent = L.testBtn;
  el.trTitle.textContent     = L.trTitle;
  el.trWpmLbl.textContent    = L.trWpmLbl;
  el.trAccLbl.textContent    = L.trAccLbl;
  el.trBestLbl.textContent   = L.trBestLbl;
  el.trRetryLbl.textContent  = L.trRetry;
  el.trBackLbl.textContent   = L.trBack;
  el.confirmTitle.textContent = L.confirmTitle;
  el.confirmSub.textContent  = L.confirmSub;
  el.diffBadge.textContent   = L.diffAll;
  // Test instructions
  el.tiTitle.textContent     = L.testInstrTitle;
  el.tiL1.textContent        = L.testInstrL1;
  el.tiL2.textContent        = L.testInstrL2;
  el.tiL3.textContent        = L.testInstrL3;
  el.tiL4.textContent        = L.testInstrL4;
  el.tiStartLbl.textContent  = L.testInstrBtn;
  el.tiHint.textContent      = L.testInstrHint;
  const tiCancelLbl = document.getElementById('ti-cancel-lbl');
  if (tiCancelLbl) tiCancelLbl.textContent = L.cancelTest || 'Пізніше';
  // How it works button on start screen
  const howLbl = document.getElementById('how-lbl');
  if (howLbl) howLbl.textContent = L.howItWorks;
  // Onboarding text
  const obIds = ['ob-t1','ob-t2','ob-t3','ob-d1','ob-d2','ob-d3',
                 'ob-skip-lbl','ob-next-lbl','ob-mode1','ob-mode1d','ob-mode2','ob-mode2d'];
  const obKeys = ['obT1','obT2','obT3','obD1','obD2','obD3',
                  'obSkip','obNext','obMode1','obMode1d','obMode2','obMode2d'];
  obIds.forEach((id, i) => {
    const el2 = document.getElementById(id);
    if (el2 && L[obKeys[i]]) el2.textContent = L[obKeys[i]];
  });
}

function updateKeyboard(lang) {
  const layout = DATA[lang].layout;
  const rows   = document.querySelectorAll('.kb-letter-row');
  const apoKey = $('apo-key');

  [0,1,2].forEach(ri => {
    const keys = rows[ri].querySelectorAll('.letter');
    keys.forEach(k => k.classList.remove('hidden-key'));

    const offset = (ri === 2 && lang === 'en') ? 1 : 0;
    if (offset) keys[0].classList.add('hidden-key');

    layout[ri].forEach((ch, i) => {
      const k = keys[i + offset];
      if (k) {
        
        const mainSpan = k.querySelector('.key-main');
        if (mainSpan) mainSpan.textContent = ch.toUpperCase();
        else k.textContent = ch.toUpperCase();
        k.dataset.char = ch;
      }
    });
    for (let i = layout[ri].length + offset; i < keys.length; i++) {
      keys[i].classList.add('hidden-key');
    }
  });

  // Apostrophe key lives in the numbers row (leftmost position)
  // For Ukrainian: show as a letter key with hint support
  // For English:   show as a decorative special key (no typing needed)
  if (lang === 'uk') {
    apoKey.textContent = "'";
    apoKey.dataset.char = "'";
    apoKey.classList.remove('hidden-key', 'special');
    apoKey.classList.add('letter');
  } else {
    apoKey.textContent = "`";
    apoKey.classList.add('special');
    apoKey.classList.remove('letter', 'hidden-key', 'hint');
    delete apoKey.dataset.char;
  }

  document.querySelectorAll('.letter.hidden-key').forEach(k => delete k.dataset.char);
}

function renderWord(word, idx) {
  el.word.innerHTML = '';
  for (let i = 0; i < word.length; i++) {
    const s = document.createElement('span');
    s.textContent = word[i];
    if      (i < idx)   s.style.cssText = 'color:var(--sage-dk);';
    else if (i === idx) s.style.cssText = 'color:var(--teal-dk);border-bottom:4px solid var(--teal);padding-bottom:2px;';
    else                s.style.cssText = 'color:#C8C8C8;';
    el.word.appendChild(s);
  }
}

let _msgTimer = null;
function showMsg(text, isRecord) {
  el.msgText.textContent = text;
  el.msgIcon.className   = isRecord
    ? 'fa-solid fa-trophy'
    : 'fa-solid fa-check-circle';
  el.msgArea.style.color   = isRecord ? 'var(--amber-dk)' : 'var(--sage-dk)';
  el.msgArea.style.opacity = '1';
  el.msgArea.style.transform = 'scale(1.15)';
  clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => {
    el.msgArea.style.opacity   = '0';
    el.msgArea.style.transform = 'scale(1)';
  }, 950);
}

function updateStats(st) {
  el.score.textContent  = st.score;
  el.errors.textContent = st.errors;
  el.record.textContent = st.best;
  el.streak.textContent = st.streak;

  const tot = st.totalHits + st.errors;
  const pct = tot <= 0 ? 100 : (st.totalHits / tot) * 100;
  el.acc.textContent = `${pct.toFixed(1)}%`;
  el.acc.style.color = pct > 95 ? 'var(--sage-dk)' : pct > 80 ? 'var(--amber-dk)' : 'var(--coral-dk)';

  // Progress bar: only used in practice mode (test mode controls bar separately)
  if (!G.testMode) {
    // Milestones at 10 and 20: show progress within current 10-word cycle
    const milestone = st.score < 10 ? 10 : st.score < 20 ? 20 : null;
    if (milestone !== null) {
      const base = milestone === 20 ? 10 : 0;
      const cyclePos = st.score - base;
      // Bug fix: wordProg = 0 when word just completed (charIdx === word.length)
      const wordProg = (st.word.length > 0 && st.charIdx < st.word.length)
        ? st.charIdx / st.word.length : 0;
      el.prog.style.width = `${Math.min((cyclePos + wordProg) * 10, 100)}%`;
    } else {
      // After 20 words: show current word progress only
      const wordProg = st.word.length > 0 ? st.charIdx / st.word.length : 0;
      el.prog.style.width = `${wordProg * 100}%`;
    }
  }
}

// WPM: only call this when a word is completed — never from a tick interval
// This freezes the displayed value between word completions
function updateWPM(st) {
  if (!st.startTime || st.score === 0) { el.wpm.textContent = '0'; return; }
  const mins = (Date.now() - st.startTime) / 60000;
  el.wpm.textContent = mins < .001 ? '0' : String(Math.round(st.score / mins));
}

function clearHints() { el.kb.querySelectorAll('.hint').forEach(k => k.classList.remove('hint')); }

function highlightKey(ch) {
  clearHints();
  if (!ch) return;
  const sel = ch === ' ' ? '[data-code="Space"]' : `[data-char="${esc(ch.toLowerCase())}"]`;
  el.kb.querySelector(sel)?.classList.add('hint');
}

function flashKey(ch, cls) {
  if (!ch) return;
  const sel = ch === ' ' ? '[data-code="Space"]' : `[data-char="${esc(ch.toLowerCase())}"]`;
  const k = el.kb.querySelector(sel);
  if (!k) return;
  k.classList.add(cls);
  setTimeout(() => k.classList.remove(cls), 170);
}

function shakeWord() {
  el.word.classList.add('shake','word-wrong');
  setTimeout(() => el.word.classList.remove('shake','word-wrong'), 440);
}

const isOpen = m => !m.classList.contains('hidden');

function updateDiffBadge(lang, score) {
  const L = DATA[lang].labels;
  if (score < 10) {
    el.diffBadge.textContent = L.diffLvl1;
    el.diffBadge.className = 'lvl-1';
  } else if (score < 20) {
    el.diffBadge.textContent = L.diffLvl2;
    el.diffBadge.className = 'lvl-2';
  } else {
    el.diffBadge.textContent = L.diffLvl3;
    el.diffBadge.className = 'lvl-3';
  }
}

/* ══════════════════════════════════════════════════════════════
   GAME
══════════════════════════════════════════════════════════════ */
const IGNORED = new Set([
  'Shift','Control','Alt','Meta','Tab','CapsLock','Escape',
  'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'
]);

const G = {
  lang: 'uk',
  testMode: false,
  testSec: 60,
  mainInterval: null,
  closing: false,
  _lastWord: '',
  _mashTimes: [],
  _mashWarnTimer: null,
  _obStep: 1,

  st: {
    wordIdx: 0, charIdx: 0, score: 0, errors: 0, totalHits: 0,
    best: 0, bestWpm: 0, startTime: null, word: '', paused: true,
    started: false, streak: 0
  },

  init() {
    updateLabels(this.lang);
    updateKeyboard(this.lang);
    renderWord('...', 0);
    updateStats(this.st);
    this._bindEvents();
  },

  _bindEvents() {
    // Start modal buttons → always show onboarding first
    el.startBtn.addEventListener('click', () => {
      el.startModal.classList.add('hidden');
      Snd._init(); Snd._resume();
      this._showOnboarding('practice');
    });
    el.startTestBtn.addEventListener('click', () => {
      el.startModal.classList.add('hidden');
      Snd._init(); Snd._resume();
      this._showOnboarding('test');
    });

    // Onboarding nav
    if (el.obNextBtn) el.obNextBtn.addEventListener('click', () => this._obNext());
    if (el.obSkipBtn) el.obSkipBtn.addEventListener('click', () => this._obFinish());

    // Header "How it works?" button — available in-game
    const howHeaderBtn = document.getElementById('help-btn') || document.getElementById('how-header-btn');
    if (howHeaderBtn) howHeaderBtn.addEventListener('click', () => {
      if (isOpen(el.mModal) || isOpen(el.confirmModal) || isOpen(el.countdownModal)) return;
      this._showOnboarding('inline');
    });

    // Header controls
    el.soundBtn.addEventListener('click', () => Snd.toggleMute(el.soundBtn));
    el.langBtn.addEventListener('click',  () => this._toggleLang());
    el.testBtn.addEventListener('click',  () => this._onTestBtnClick());

    // Test instructions modal
    el.tiStartBtn.addEventListener('click', () => {
      el.tiModal.classList.add('hidden');
      this._startCountdown();
    });
    // Cancel / "Later" button in test instructions
    const tiCancelBtn = document.getElementById('ti-cancel-btn');
    if (tiCancelBtn) {
      tiCancelBtn.addEventListener('click', () => {
        el.tiModal.classList.add('hidden');
        // Return to practice if already started, else show start modal
        if (this.st.started) {
          this.st.paused = false;
        } else {
          el.startModal.classList.remove('hidden');
        }
      });
    }
    // Milestone close X
    const mCloseX = document.getElementById('m-close-x');
    if (mCloseX) mCloseX.addEventListener('click', () => this._closeMilestone());

    // Milestone modal
    el.mNextBtn.addEventListener('click', () => this._closeMilestone());

    // Confirm modal (lang switch)
    el.confirmYes.addEventListener('click', () => {
      el.confirmModal.classList.add('hidden');
      this.st.paused = false;
      this._switchLang();
    });
    el.confirmCancel.addEventListener('click', () => {
      el.confirmModal.classList.add('hidden');
      this.st.paused = false;
    });

    // Test result buttons
    el.trRetryBtn.addEventListener('click', () => {
      el.testResultModal.classList.add('hidden');
      this._showTestInstructions();
    });
    el.trBackBtn.addEventListener('click', () => {
      el.testResultModal.classList.add('hidden');
      this._startPractice();
    });

    // Onboarding dot navigation
    document.querySelectorAll('.ob-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this._obSetStep(parseInt(dot.dataset.step));
      });
    });
    const mw = document.createElement('div');
    mw.id = 'mash-warning';
    document.body.appendChild(mw);

    // Keyboard — block mouse clicks, only allow touch/stylus
    document.addEventListener('keydown', e => this._onKey(e), { passive: false });

    el.kb.addEventListener('pointerdown', e => {
      // Block mouse — only allow touch/stylus (kids can't cheat by clicking)
      if (e.pointerType === 'mouse') return;

      const k = e.target.closest('.key');
      if (!k) return;
      const hasAction = k.dataset.action || k.dataset.char || k.dataset.code;
      if (!hasAction) return;
      e.preventDefault(); e.stopPropagation();

      if (!this.st.started || this.st.paused) {
        if (isOpen(el.mModal)) this._closeMilestone();
        return;
      }
      if (k.dataset.action === 'backspace') this._backspace();
      else this._input(k.dataset.char || ' ');
    });
  },

  /* ── MASH WARNING ────────────────────────────────────────── */
  _showMashWarning() {
    const mw = document.getElementById('mash-warning');
    if (!mw) return;
    mw.textContent = DATA[this.lang].labels.mashWarning;
    mw.classList.add('show');
    clearTimeout(this._mashWarnTimer);
    this._mashWarnTimer = setTimeout(() => mw.classList.remove('show'), 2500);
  },

  /* ── TEST INSTRUCTIONS ───────────────────────────────────── */
  _showTestInstructions() {
    updateLabels(this.lang); // ensure labels are up to date
    el.tiModal.classList.remove('hidden');
    setTimeout(() => el.tiStartBtn.focus(), 80);
  },

  /* ── WORD POOL (progressive difficulty) ─────────────────── */
  _getPool() {
    const D = DATA[this.lang];
    if (this.testMode) return D.words; // all levels in test
    const s = this.st.score;
    if (s < 10)  return D.easy.length  >= 3 ? D.easy   : D.words;
    if (s < 20)  return [...D.easy, ...D.medium];
    return D.words;
  },

  _pickWord() {
    const pool = this._getPool();
    let w;
    let tries = 0;
    do {
      w = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    } while (w === this._lastWord && pool.length > 1 && tries < 10);
    this._lastWord = w;
    return w;
  },

  /* ── PRACTICE MODE ───────────────────────────────────────── */
  _startPractice() {
    this.testMode = false;
    clearInterval(this.mainInterval);
    el.testBanner.classList.add('hidden');
    el.prog.classList.remove('test-bar');
    el.testBtn.classList.remove('active-test');

    Object.assign(this.st, {
      wordIdx: 0, charIdx: 0, score: 0, errors: 0, totalHits: 0,
      best: Store.get(this.lang), bestWpm: Store.getWpm(this.lang),
      startTime: null, word: '', streak: 0, paused: false, started: true
    });

    this._loadWord();
    updateStats(this.st);
    el.wpm.textContent = '0';
    // No interval needed for practice - WPM only updates on word complete
  },

  /* ── TEST MODE ───────────────────────────────────────────── */
  _onTestBtnClick() {
    // Guard: don't open test during open modals
    if (isOpen(el.mModal) || isOpen(el.confirmModal) || isOpen(el.countdownModal) || isOpen(el.tiModal)) return;

    if (!this.st.started) {
      // Not started yet — start directly
      el.startModal.classList.add('hidden');
      Snd._init(); Snd._resume();
      this.st.started = true;
    }
    this._showTestInstructions();
  },

  _startCountdown() {
    // Hide any open modals first
    el.mModal.classList.add('hidden');
    el.tiModal.classList.add('hidden');
    el.testResultModal.classList.add('hidden');
    this.st.paused = true;

    clearInterval(this.mainInterval);

    let n = 3;
    const L = DATA[this.lang].labels;
    el.countdownNum.textContent = n;
    el.countdownLabel.textContent = L.countdownReady;
    el.countdownModal.classList.remove('hidden');

    // Force re-animation on each number change
    const setNum = (val) => {
      el.countdownNum.style.animation = 'none';
      void el.countdownNum.offsetHeight; // reflow
      el.countdownNum.style.animation = '';
      el.countdownNum.textContent = val;
    };

    const tick = setInterval(() => {
      n--;
      if (n > 0) {
        setNum(n);
        el.countdownNum.classList.remove('is-go');
      } else {
        clearInterval(tick);
        el.countdownNum.classList.add('is-go');
        setNum(L.countdownGo);
        el.countdownLabel.textContent = '';
        setTimeout(() => {
          el.countdownModal.classList.add('hidden');
          el.countdownNum.classList.remove('is-go');
          this._beginTest();
        }, 700);
      }
    }, 700);
  },

  _beginTest() {
    this.testMode = true;
    this.testSec  = 60;
    el.testBtn.classList.add('active-test');
    el.prog.classList.add('test-bar');
    el.prog.style.width = '100%';
    el.prog.style.transition = 'none'; // prevent initial transition

    Object.assign(this.st, {
      charIdx: 0, score: 0, errors: 0, totalHits: 0,
      best: Store.get(this.lang), bestWpm: Store.getWpm(this.lang),
      startTime: Date.now(), word: '', streak: 0, paused: false, started: true
    });

    el.timerSec.textContent = this.testSec;
    el.testBanner.classList.remove('hidden');
    el.testBanner.classList.remove('low-time');

    this._loadWord();
    updateStats(this.st);
    el.wpm.textContent = '0';

    // Reset transition after setting 100%
    setTimeout(() => { el.prog.style.transition = ''; }, 50);

    this.mainInterval = setInterval(() => {
      if (!this.st.paused) this._tickTest();
    }, 1000);
  },

  _tickTest() {
    this.testSec--;
    el.timerSec.textContent = this.testSec;
    el.prog.style.width = `${(this.testSec / 60) * 100}%`;

    if (this.testSec <= 10) el.testBanner.classList.add('low-time');

    if (this.testSec <= 0) this._endTest();
  },

  _endTest() {
    clearInterval(this.mainInterval);
    this.mainInterval = null;
    this.testMode = false;
    this.st.paused = true;

    Snd.testEnd();
    el.testBanner.classList.add('hidden');
    el.prog.style.width = '0%';
    el.prog.classList.remove('test-bar');
    el.testBtn.classList.remove('active-test');

    // Compute final WPM (exactly 1 minute)
    const wpm   = this.st.score;
    const isNew = Store.saveWpm(wpm, this.lang);
    const best  = Store.getWpm(this.lang);

    const tot = this.st.totalHits + this.st.errors;
    const acc = tot > 0 ? ((this.st.totalHits / tot) * 100).toFixed(1) : '100.0';

    const L = DATA[this.lang].labels;
    el.trWpm.textContent   = wpm;
    el.trAcc.textContent   = `${acc}%`;
    el.trBest.textContent  = best;
    el.trComment.textContent = isNew ? L.trNew : this._wpmComment(wpm, this.lang);

    el.trWpmBox.classList.toggle('new-record', isNew);
    el.trBestBox.classList.toggle('new-record', isNew);

    el.testResultModal.classList.remove('hidden');
  },

  _wpmComment(wpm, lang) {
    const uk = lang === 'uk';
    if (wpm < 10)  return uk ? 'Гарний початок! Продовжуй тренуватись 💪' : 'Good start! Keep practicing 💪';
    if (wpm < 20)  return uk ? 'Непогано! Трохи більше практики 🙂'       : 'Not bad! A bit more practice 🙂';
    if (wpm < 35)  return uk ? 'Чудовий результат! Ти вже досвідчений 🎉' : 'Great result! You are experienced 🎉';
    if (wpm < 50)  return uk ? 'Вражаюча швидкість! Справжній майстер 🔥' : 'Impressive speed! True master 🔥';
    return uk ? 'Абсолютний рекорд! Ти геній друку ⚡'                     : 'Absolute champion! Typing genius ⚡';
  },

  /* ── LANG TOGGLE ─────────────────────────────────────────── */
  _toggleLang() {
    // Guard: don't open confirm during test mode or other modals
    if (isOpen(el.mModal) || isOpen(el.confirmModal) || isOpen(el.countdownModal)) return;
    if (this.testMode) return; // can't switch lang during test

    const hasProgress = this.st.score > 0 || this.st.errors > 0 || this.st.totalHits > 0;
    if (this.st.started && hasProgress) {
      this.st.paused = true;
      el.confirmModal.classList.remove('hidden');
      return;
    }
    this._switchLang();
  },

  _switchLang() {
    this.lang = this.lang === 'uk' ? 'en' : 'uk';
    updateLabels(this.lang);
    updateKeyboard(this.lang);
    clearHints();
    el.langBtn.blur();
    if (this.st.started) this._startPractice();
    else {
      this.st.best    = Store.get(this.lang);
      this.st.bestWpm = Store.getWpm(this.lang);
      updateStats(this.st);
    }
  },

  /* ── WORD LOAD ───────────────────────────────────────────── */
  _loadWord() {
    this.st.word    = this._pickWord();
    this.st.charIdx = 0;
    renderWord(this.st.word, 0);
    highlightKey(this.st.word[0] || null);
    updateStats(this.st);

    // Update difficulty badge in practice mode
    if (!this.testMode) {
      updateDiffBadge(this.lang, this.st.score);
    }
  },

  /* ── INPUT ───────────────────────────────────────────────── */
  _input(ch) {
    if (!this.st.started || this.st.paused) return;
    if (!this.st.startTime) this.st.startTime = Date.now();

    Snd._resume();
    Snd.click();

    const target = this.st.word[this.st.charIdx];
    if (!target) return;

    if (ch.toLowerCase() === target.toLowerCase()) {
      flashKey(ch, 'correct');
      this.st.charIdx++;
      this.st.totalHits++;
      renderWord(this.st.word, this.st.charIdx);

      if (this.st.charIdx === this.st.word.length) {
        this._wordDone();
      } else {
        highlightKey(this.st.word[this.st.charIdx]);
        updateStats(this.st);
      }
    } else {
      flashKey(ch, 'wrong');
      this.st.errors++;
      this.st.streak = 0;
      Snd.error();
      shakeWord();
      updateStats(this.st);

      // Mash detection: 5+ errors within 2 seconds
      const now = Date.now();
      this._mashTimes.push(now);
      if (this._mashTimes.length > 5) this._mashTimes.shift();
      if (this._mashTimes.length === 5 && (now - this._mashTimes[0]) < 2000) {
        this._mashTimes = [];
        this._showMashWarning();
      }
    }
  },

  _backspace() {
    if (!this.st.started || this.st.paused || this.st.charIdx === 0) return;
    Snd.click();
    this.st.charIdx--;
    renderWord(this.st.word, this.st.charIdx);
    highlightKey(this.st.word[this.st.charIdx] || null);
    updateStats(this.st);
  },

  /* ── WORD DONE ───────────────────────────────────────────── */
  _wordDone() {
    this.st.score++;
    this.st.streak++;

    // ✅ Update stats immediately so score panel reflects the new word count
    // at the exact moment of completion — critical for test-mode final snapshot
    updateStats(this.st);

    if (this.st.streak > 0 && this.st.streak % 5 === 0) Snd.streak();
    else Snd.success();

    // Update WPM display only on word completion (freeze between completions)
    updateWPM(this.st);

    if (!this.testMode) {
      // Practice mode: save record, show message
      const isRecord = Store.save(this.st.score, this.lang);
      if (isRecord) this.st.best = this.st.score;
      const msgs = DATA[this.lang].success;
      showMsg(msgs[Math.floor(Math.random() * msgs.length)], isRecord);
      // Update record display if new record
      if (isRecord) el.record.textContent = this.st.best;

      // Milestones only at exactly 10 and 20 words
      if (this.st.score === 10 || this.st.score === 20) {
        this._milestone();
      } else {
        // Bug fix: pause briefly to prevent double-input on word boundary
        this.st.paused = true;
        setTimeout(() => {
          this.st.paused = false;
          this._loadWord();
        }, 190);
      }
    } else {
      // Test mode: fast transitions, no milestones, no records
      this.st.paused = true;
      setTimeout(() => {
        if (!this.testMode) return; // test may have ended
        this.st.paused = false;
        this._loadWord();
      }, 120);
    }
  },

  /* ── MILESTONE (practice only) ───────────────────────────── */
  _milestone() {
    this.st.paused = true;
    try { confetti({ particleCount: 240, spread: 95, origin: { y: .6 } }); } catch(_){}
    const phrases = DATA[this.lang].milestones;
    const phrase  = phrases[Math.floor(Math.random() * phrases.length)];
    const mWords  = DATA[this.lang].labels.mWords;
    el.mText.textContent = `${phrase}\n${this.st.score} ${mWords}`;
    el.mModal.classList.remove('hidden');
    el.prog.style.width = '100%';
    setTimeout(() => el.mNextBtn.focus(), 80);
  },

  _closeMilestone() {
    if (this.closing || !isOpen(el.mModal)) return;
    this.closing = true;
    el.mModal.classList.add('hidden');
    this.st.paused = false;
    el.prog.style.width = '0%';
    this._loadWord();
    setTimeout(() => { this.closing = false; }, 260);
  },

  /* ── ONBOARDING ──────────────────────────────────────────── */
  // mode: 'practice' | 'test' | 'inline'
  // 'practice' / 'test' — called from start screen, launches game on finish
  // 'inline' — called from header during game, resumes game on finish
  _showOnboarding(mode) {
    this._obMode = mode;
    this._obStep = 1;
    this._obSetStep(1);
    // Pause game if showing inline
    if (mode === 'inline' && this.st.started) this.st.paused = true;
    if (el.onboardModal) el.onboardModal.classList.remove('hidden');
  },

  _obSetStep(n) {
    this._obStep = n;
    [1,2,3].forEach(i => {
      const s = document.getElementById(`ob-step-${i}`);
      if (s) s.classList.toggle('active', i === n);
    });
    document.querySelectorAll('.ob-dot').forEach(d => {
      d.classList.toggle('active', parseInt(d.dataset.step) === n);
    });
    const L = DATA[this.lang].labels;
    const nextLbl = document.getElementById('ob-next-lbl');
    const nextIcon = document.getElementById('ob-next-icon');
    if (nextLbl) {
      if (n === 3) {
        nextLbl.textContent = this._obMode === 'inline'
          ? (L.obClose || 'Закрити')
          : (L.obStart || 'Розпочати!');
        if (nextIcon) nextIcon.className = this._obMode === 'inline'
          ? 'fa-solid fa-xmark'
          : 'fa-solid fa-play';
      } else {
        nextLbl.textContent = L.obNext || 'Далі';
        if (nextIcon) nextIcon.className = 'fa-solid fa-arrow-right';
      }
    }
    // Show/hide skip: only when launching from start screen
    const skipBtn = document.getElementById('ob-skip-btn');
    if (skipBtn) skipBtn.style.display = this._obMode === 'inline' ? 'none' : '';
  },

  _obNext() {
    if (this._obStep < 3) {
      this._obSetStep(this._obStep + 1);
    } else {
      this._obFinish();
    }
  },

  _obFinish() {
    if (el.onboardModal) el.onboardModal.classList.add('hidden');
    if (this._obMode === 'inline') {
      // Resume game
      if (this.st.started) this.st.paused = false;
      return;
    }
    // From start screen: launch selected mode
    this.st.started = true; this.st.paused = false;
    if (this._obMode === 'test') {
      this._showTestInstructions();
    } else {
      this._startPractice();
    }
  },

  /* ── KEY HANDLER ─────────────────────────────────────────── */
  _onKey(e) {
    // Onboarding modal keyboard nav — works even before game starts
    if (el.onboardModal && isOpen(el.onboardModal)) {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault(); this._obNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (this._obStep > 1) this._obSetStep(this._obStep - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault(); this._obFinish();
      }
      return;
    }

    if (!this.st.started || isOpen(el.startModal)) return;

    if (isOpen(el.countdownModal)) return; // no input during countdown

    if (isOpen(el.tiModal)) {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.tiModal.classList.add('hidden');
        this._startCountdown();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        el.tiModal.classList.add('hidden');
      }
      return;
    }

    if (isOpen(el.testResultModal)) {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.testResultModal.classList.add('hidden');
        this._startCountdown();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        el.testResultModal.classList.add('hidden');
        this._startPractice();
      }
      return;
    }

    if (this.st.paused) {
      if (isOpen(el.mModal)) {
        e.preventDefault(); this._closeMilestone();
      } else if (isOpen(el.confirmModal)) {
        if (e.key === 'Escape') {
          e.preventDefault();
          el.confirmModal.classList.add('hidden');
          this.st.paused = false;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          el.confirmModal.classList.add('hidden');
          this.st.paused = false;
          this._switchLang();
        }
      }
      return;
    }

    if (e.key === 'Backspace') { e.preventDefault(); this._backspace(); return; }
    if (IGNORED.has(e.key) || e.ctrlKey || e.metaKey) return;
    
    if (e.altKey && e.key?.length !== 1) return;
    if (e.key?.length === 1) this._input(e.key);
  }
};

G.init();

/* ══════════════════════════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════════════════════════ */
const Onboard = (() => {
  let step = 1;
  const TOTAL = 3;
  let _fromHeader = false; // true = opened during game, just close on finish

  function _setStep(n) {
    step = n;
    for (let i = 1; i <= TOTAL; i++) {
      document.getElementById(`ob-step-${i}`)?.classList.toggle('active', i === n);
      document.querySelector(`.ob-dot[data-step="${i}"]`)?.classList.toggle('active', i === n);
    }
    const lbl  = document.getElementById('ob-next-lbl');
    const icon = document.getElementById('ob-next-icon');
    if (lbl)  lbl.textContent = n === TOTAL ? 'Почати!' : 'Далі';
    if (icon) icon.className  = n === TOTAL ? 'fa-solid fa-play' : 'fa-solid fa-arrow-right';
  }

  function _open(fromHeader) {
    _fromHeader = fromHeader;
    const modal = document.getElementById('onboard-modal');
    if (!modal) return;
    _setStep(1);
    modal.classList.remove('hidden');
  }

  function _finish() {
    document.getElementById('onboard-modal').classList.add('hidden');
    if (_fromHeader) {
      // Opened via "?" during game — just close, resume
      G.st.paused = false;
      return;
    }
    // Opened via "Почати практику" — start game
    Snd._init(); Snd._resume();
    G.st.started = true; G.st.paused = false;
    G._startPractice();
  }

  function _advance() {
    if (step < TOTAL) {
      _setStep(step + 1);
    } else {
      _finish();
    }
  }

  function init() {
    const modal   = document.getElementById('onboard-modal');
    const nextBtn = document.getElementById('ob-next-btn');
    const skipBtn = document.getElementById('ob-skip-btn');
    if (!modal) return;

    // "Почати практику" → ALWAYS show onboarding first
    document.getElementById('start-btn').addEventListener('click', e => {
      e.stopImmediatePropagation();
      document.getElementById('start-modal').classList.add('hidden');
      _open(false);
    }, true);

    // "?" header button → open during game
    document.getElementById('help-btn')?.addEventListener('click', () => {
      if (G.testMode) return; // don't interrupt test
      G.st.paused = true;
      _open(true);
    });

    nextBtn?.addEventListener('click', _advance);
    skipBtn?.addEventListener('click', _finish);

    document.querySelectorAll('.ob-dot').forEach(dot => {
      dot.addEventListener('click', () => _setStep(parseInt(dot.dataset.step)));
    });

    // Keyboard nav inside onboarding
    document.addEventListener('keydown', e => {
      if (!modal || modal.classList.contains('hidden')) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); _advance(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (step > 1) _setStep(step - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); _finish(); }
    });
  }

  return { init };
})();

Onboard.init();

