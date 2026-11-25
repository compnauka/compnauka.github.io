const byId = id => document.getElementById(id);

const seniorCopy = {
  purpose: "Ми шукаємо інформацію, щоб дізнатися факт, виконати завдання або ухвалити рішення. Наприклад, з’ясувати, чому світить Місяць, знайти інструкцію для досліду чи перевірити, чи працює бібліотека цієї суботи.",
  "search-tool": "Google і Bing шукають серед багатьох сайтів. Введи запит і переглянь заголовки, назви сайтів і короткі описи. Якщо знаєш, хто публікує потрібну інформацію, можеш одразу перейти на сайт цієї установи.",
  "official-tool": "Сайт бібліотеки, школи чи музею допоможе перевірити розклад, правила або оголошення саме цієї установи. Звертай увагу на дату й можливі зміни до розкладу.",
  "book-tool": "Для наукового пояснення підійде шкільний підручник, енциклопедія або сайт фахової установи. Для місячного світла можна порівняти матеріали NASA та Гринвіцької обсерваторії.",
  browser: "Браузер, наприклад Chrome чи Firefox, відкриває сайти. Пошуковик допомагає їх знайти. Коли ти вводиш слова в адресний рядок браузера, він може передати їх обраному пошуковику.",
  maps: "Для адреси й маршруту підійдуть Карти Google. Якщо час роботи на карті відрізняється від свіжого розкладу на сайті бібліотеки, перевір оголошення бібліотеки або уточни в неї.",
  "tool-task": "У результатах пошуку є старий допис із годинами роботи бібліотеки та свіжий розклад на її сайті. Ти плануєш піти туди цієї суботи. Обери подумки, що перевіриш спочатку, а потім відкрий відповідь.",
  "tool-solution": "Почни зі свіжого розкладу на сайті бібліотеки. Знайди години на суботу й подивися, чи є оголошення про зміни саме на потрібну дату.",
  query: "Запит — це слова, які ти вводиш у рядок пошуку. Назви тему й уточни мету. Замість широкого «Місяць» спробуй «Чому світить Місяць?» або уточни, що шукаєш пояснення для дітей.",
  ad: "Переглянь заголовок, сайт і короткий опис результату. Сторінка про місячне світло підходить до запиту. Оголошення про нічник має іншу мету. Його можуть позначити «Реклама» або «Спонсоровано». Місце результату саме по собі нічого не доводить.",
  source: "Відкрий сторінку й знайди потрібне пояснення. Подивись, хто його підготував, на які докази спирається та коли опубліковано матеріал. Для важливого факту знайди ще одне незалежне джерело. Дві сторінки, які повторюють той самий допис, мають спільне джерело.",
  regular: "Пошуковик добирає сторінки до запиту. Опис у результатах може бути лише коротким уривком. Відкрий статтю й прочитай потрібну частину повністю, щоб зрозуміти пояснення.",
  ai: "ШІ — це скорочення від «штучний інтелект». Пошуковик іноді показує огляд, створений ШІ на основі вебсторінок. Деякі чатботи теж можуть шукати в інтернеті й давати посилання. Це залежить від сервісу та доступних у ньому функцій. ШІ може пропустити деталь, неправильно пояснити джерело або вигадати факт.",
  verify: "Порівняй твердження по суті. NASA пояснює, що місячне світло є відбитим сонячним світлом. Гринвіцька обсерваторія теж описує це відбиття. Обидва пояснення суперечать словам «світиться сам». Саме так перевіряй огляд ШІ: відкрий джерела й знайди, що вони кажуть про той самий факт.",
  "practice-check": "Відкрий «Друге незалежне джерело». Порівняй з оглядом обидва пояснення. Нижче обери відповідь, прочитай підказку й спробуй іншу тему.",
  "check-one": "Що я хочу дізнатися? Який короткий, точний запит допоможе?",
  "check-two": "Хто опублікував матеріал, коли й на чому ґрунтується його пояснення?",
  "check-three": "Чи підтверджують твердження огляду ШІ два незалежні джерела? Що саме в них сказано?"
};

const topics = [
  {
    label: "🌙 Місяць", query: "Чому світить Місяць?", match: /місяц|місяч|moon/iu,
    confirmed: false,
    claim: "Місяць світиться сам, як лампа.",
    source: "Матеріал про місячне світло",
    publisher: "NASA Science",
    evidence: "Місяць відбиває світло Сонця. Саме це світло ми бачимо із Землі.",
    second: {
      publisher: "Королівські музеї Гринвіча",
      evidence: "Справжній Місяць відбиває сонячне світло. У матеріалі це порівнюють зі скульптурою Місяця, яка відбиває те, що її оточує."
    },
    ad: "Замов нічник у формі Місяця!"
  },
  {
    label: "☀️ Сонце", query: "Чи є Сонце зорею?", match: /сонц|соняч|sun/iu,
    confirmed: true,
    claim: "Сонце — найближча до Землі зоря.",
    source: "Навчальний матеріал про Сонце",
    publisher: "NASA Science",
    evidence: "Сонце — зоря. Воно ближче до Землі за інші зорі.",
    second: {
      publisher: "Європейське космічне агентство",
      evidence: "Сонце — наша найближча зоря. Вона дає Землі світло й тепло."
    },
    ad: "Купи набір наліпок із зорями!"
  },
  {
    label: "🌍 Земля", query: "За скільки днів Земля обертається навколо Сонця?", match: /земл|365|тривалість року/iu,
    confirmed: true,
    claim: "Земля робить оберт навколо Сонця приблизно за 365 днів.",
    source: "Словничок про рух Землі",
    publisher: "NOAA, наукова установа США",
    evidence: "Один оберт Землі навколо Сонця триває приблизно 365 і чверть доби.",
    explanation: "Огляд каже «приблизно 365 днів». Точніше число — близько 365 і чверті доби. Слово «приблизно» означає, що число округлили.",
    second: {
      publisher: "NASA Space Place",
      evidence: "Рік на Землі триває приблизно 365,25 дня. Додаткова чверть доби пояснює, чому в календарі бувають високосні роки."
    },
    ad: "Сьогодні знижка на глобуси!"
  }
];

const juniorQuestions = [
  {
    prompt: "Ти хочеш дізнатися, чому світить Місяць. Який запит допоможе?",
    answers: ["Покажи щось цікаве", "Чому світить Місяць?"],
    correct: 1, detail: "У цьому запиті є тема й точне питання."
  },
  {
    prompt: "Біля посилання на нічник написано «Реклама». Що це означає?",
    answers: ["Хтось заплатив за показ", "Це вже перевірена відповідь"],
    correct: 0, detail: "Реклама допомагає продавати. Для відповіді про Місяць краще знайти навчальну сторінку."
  },
  {
    prompt: "ШІ написав, що Місяць світиться сам. Що зробиш?",
    answers: ["Одразу перекажу це друзям", "Звірю з книжкою разом із дорослим"],
    correct: 1, detail: "Місяць відбиває світло Сонця. Відповіді ШІ можуть містити помилки."
  },
  {
    prompt: "На сторінці обіцяють подарунок за твою адресу. Як діяти?",
    answers: ["Закрию сторінку й скажу дорослому", "Напишу свою адресу"],
    correct: 0, detail: "Домашню адресу бережи. Дорослий допоможе, якщо сторінка викликає сумнів."
  }
];

const seniorQuestions = [
  {
    prompt: "Ти готуєш розповідь про Місяць. Який запит допоможе з’ясувати, звідки береться місячне світло?",
    answers: ["Місяць цікаве", "Чому світить Місяць: відбите сонячне світло", "Найяскравіші фото Місяця"],
    correct: 1, detail: "Точний запит називає тему й підказує, який факт потрібно знайти."
  },
  {
    prompt: "ШІ додав посилання до відповіді. Як перевірити твердження?",
    answers: ["Відкрити посилання, знайти підтвердження і звірити з незалежним джерелом", "Порахувати, скільки посилань додав ШІ", "Перечитати лише сам огляд ШІ"],
    correct: 0, detail: "Кількість посилань мало що говорить. Важливо, чи джерела підтверджують саме це твердження."
  },
  {
    prompt: "Два сайти повторюють дослівно одну новину й посилаються на той самий допис. Що далі?",
    answers: ["Вважати новину перевіреною двічі", "Повірити сайту з красивішими фото", "Знайти незалежне джерело або першоджерело"],
    correct: 2, detail: "Скопійована новина має те саме джерело. Незалежна перевірка дає додаткове підтвердження."
  },
  {
    prompt: "Перший результат пошуку має позначку «Спонсоровано». Ти шукаєш науковий факт. Як діяти?",
    answers: ["Обрати його, бо він перший", "Знайти матеріал фахової установи й перевірити докази", "Обрати будь-який сайт без рекламної позначки"],
    correct: 1, detail: "Для наукового факту важливі авторство та докази. Місце в пошуку або відсутність рекламної позначки цього не доводять."
  },
  {
    prompt: "Сторінка зі старою датою називає час роботи музею. Де перевірити розклад на завтра?",
    answers: ["У свіжому розкладі на сайті музею", "У старому дописі з багатьма вподобайками", "У першому короткому уривку під посиланням"],
    correct: 0, detail: "Розклад змінюється. Знайди актуальну інформацію самого музею."
  },
  {
    prompt: "Чат із ШІ просить твої номер телефону й адресу, щоб відповісти на запитання про Сонце. Що зробиш?",
    answers: ["Напишу лише адресу", "Надішлю фото з адресою", "Залишу дані при собі й звернуся до дорослого"],
    correct: 2, detail: "Особисті дані зайві для такого запиту. Якщо сервіс їх просить, дорослий допоможе розібратися."
  }
];

const juniorCopy = Object.fromEntries(Array.from(document.querySelectorAll("[data-copy]"), node => [node.dataset.copy, node.textContent]));
const results = byId("results");
const status = byId("search-status");
const queryInput = byId("search-query");
const topicsBox = byId("topics");
const answersBox = byId("answers");
const certificate = byId("certificate");
let senior = false;
let questions = juniorQuestions;
let questionIndex = 0;
let score = 0;

function makeButton(label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button secondary";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function addText(parent, tag, content, className) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function setLevel(value) {
  senior = value === "senior";
  questions = senior ? seniorQuestions : juniorQuestions;
  byId("level-description").textContent = senior
    ? "Власні запити, перевірка двох джерел і 6 завдань у грі."
    : "Прості приклади, пошук за готовими запитами й 4 завдання у грі.";
  const copy = senior ? seniorCopy : juniorCopy;
  document.querySelectorAll("[data-copy]").forEach(node => { node.textContent = copy[node.dataset.copy]; });
  byId("search-instructions").textContent = senior
    ? "Напиши запит про Місяць, Сонце чи Землю та натисни «Шукати». Можеш також натиснути кнопку з темою."
    : "Натисни кнопку з темою, наприклад «Сонце». З’явиться готовий запит і його результати.";
  byId("search-form").hidden = !senior;
  queryInput.value = "";
  results.hidden = true;
  results.replaceChildren();
  status.textContent = "";
  byId("start").hidden = false;
  byId("question-panel").hidden = true;
  byId("summary").hidden = true;
  topicsBox.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", "false"));
}

topics.forEach(topic => {
  const button = makeButton(topic.label, () => {
    queryInput.value = topic.query;
    showSearch(topic);
  });
  button.setAttribute("aria-pressed", "false");
  topicsBox.append(button);
});

document.querySelectorAll("[name=level]").forEach(radio => {
  radio.addEventListener("change", () => setLevel(radio.value));
});

byId("search-form").addEventListener("submit", event => {
  event.preventDefault();
  const query = queryInput.value.trim();
  const [topic] = topics
    .map(item => ({ item, position: query.search(item.match) }))
    .filter(match => match.position >= 0)
    .sort((left, right) => left.position - right.position)
    .map(match => match.item);
  if (topic) {
    showSearch(topic);
    return;
  }
  results.hidden = true;
  results.replaceChildren();
  topicsBox.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", "false"));
  status.textContent = query
    ? "Для цього запиту в тренажері немає прикладу. Спробуй тему «Місяць», «Сонце» або «Земля»."
    : "Напиши запит або обери тему.";
});

function makeSource(title, publisher, evidence) {
  const source = document.createElement("details");
  addText(source, "summary", title);
  addText(source, "p", publisher, "tag");
  addText(source, "p", evidence);
  addText(source, "p", "Короткий переказ українською для вправи.", "source-note");
  return source;
}

function showSearch(topic) {
  Array.from(topicsBox.children).forEach((button, index) => {
    button.setAttribute("aria-pressed", String(topics[index] === topic));
  });
  status.textContent = "Готовий приклад для запиту «" + topic.query + "»";
  results.replaceChildren();
  results.hidden = false;

  const overview = document.createElement("article");
  overview.className = "sample-ai";
  addText(overview, "p", "Огляд від ШІ · навчальний приклад", "tag");
  addText(overview, "h3", topic.claim);
  addText(overview, "p", senior
    ? "Відкрий обидва джерела нижче й порівняй пояснення з оглядом."
    : "Відкрий джерело нижче й порівняй пояснення з оглядом.");

  const ad = document.createElement("article");
  addText(ad, "p", "Реклама · навчальний приклад", "tag ad");
  addText(ad, "h3", topic.ad);
  const source = makeSource("Відкрити навчальне джерело", topic.source + " · " + topic.publisher, topic.evidence);
  const second = senior
    ? makeSource("Друге незалежне джерело", topic.second.publisher, topic.second.evidence)
    : null;

  const check = document.createElement("article");
  addText(check, "h3", senior ? "Чи підтверджують джерела огляд?" : "Чи підтверджує джерело огляд?");
  const buttons = addText(check, "div", "", "result-buttons");
  const feedback = addText(check, "p", "", "feedback");
  feedback.setAttribute("role", "status");
  ["Так, огляд правильний", "Ні, огляд містить помилку"].forEach((label, index) => {
    buttons.append(makeButton(label, event => {
      const nextSource = [source, second].find(item => item && !item.open);
      if (nextSource) {
        const heading = nextSource.querySelector("summary");
        feedback.textContent = "Спочатку натисни «" + heading.textContent + "» вище та прочитай пояснення.";
        heading.focus();
        return;
      }

      const correct = (index === 0) === topic.confirmed;
      buttons.querySelectorAll("button").forEach(button => {
        delete button.dataset.result;
        button.disabled = correct;
      });
      event.currentTarget.dataset.result = correct ? "correct" : "incorrect";
      feedback.textContent = correct
        ? "Саме так. " + (topic.explanation || topic.evidence) + " Тепер обери іншу тему або переходь до гри."
        : "Спробуй ще раз. У джерелі сказано: " + topic.evidence + " Порівняй це з оглядом.";
      feedback.tabIndex = -1;
      feedback.focus();
    }));
  });
  if (second) results.append(ad, overview, source, second, check);
  else results.append(overview, source, check, ad);
}

function startGame() {
  score = 0;
  questionIndex = 0;
  byId("start").hidden = true;
  byId("summary").hidden = true;
  byId("question-panel").hidden = false;
  showQuestion();
}

function showQuestion() {
  const question = questions[questionIndex];
  byId("progress-text").textContent = "Завдання " + (questionIndex + 1) + " з " + questions.length;
  byId("progress").max = questions.length;
  byId("progress").value = questionIndex;
  byId("question").textContent = question.prompt;
  byId("game-feedback").textContent = "";
  byId("next").hidden = true;
  answersBox.replaceChildren();
  question.answers.forEach((answer, index) => {
    answersBox.append(makeButton(answer, event => answerQuestion(index, event.currentTarget)));
  });
  byId("question").focus();
}

function answerQuestion(index, button) {
  const question = questions[questionIndex];
  const correct = index === question.correct;
  if (correct) score += 1;
  button.dataset.result = correct ? "correct" : "incorrect";
  answersBox.querySelectorAll("button").forEach(answer => { answer.disabled = true; });
  byId("progress").value = questionIndex + 1;
  const solution = correct ? "Саме так. " : "Кращий вибір — «" + question.answers[question.correct] + "». ";
  byId("game-feedback").textContent = solution + question.detail;
  byId("next").textContent = questionIndex + 1 === questions.length ? "Побачити результат" : "Наступне завдання";
  byId("next").hidden = false;
  byId("next").focus();
}

function advanceGame() {
  questionIndex += 1;
  if (questionIndex < questions.length) {
    showQuestion();
    return;
  }
  byId("question-panel").hidden = true;
  byId("score").textContent = "Твій результат — " + score + " з " + questions.length;
  byId("summary-note").textContent = score === questions.length
    ? "Усі ситуації розгадано! Можеш відкрити відзнаку або перейти до пам’ятки."
    : "Можеш зіграти ще раз і застосувати підказки. За проходження гри можна відкрити відзнаку.";
  byId("summary").hidden = false;
  byId("score").focus();
}

byId("start").addEventListener("click", startGame);
byId("restart").addEventListener("click", startGame);
byId("next").addEventListener("click", advanceGame);
byId("show-certificate").addEventListener("click", () => {
  byId("certificate-level").textContent = senior ? "Рівень 3–4 класів" : "Рівень 1–2 класів";
  byId("player-name").value = "";
  byId("certificate-name").textContent = "";
  byId("certificate-name").hidden = true;
  certificate.showModal();
});
byId("player-name").addEventListener("input", event => {
  const name = event.currentTarget.value.trim();
  byId("certificate-name").textContent = name;
  byId("certificate-name").hidden = !name;
});
byId("print-certificate").addEventListener("click", () => window.print());

setLevel(document.querySelector("[name=level]:checked").value);
