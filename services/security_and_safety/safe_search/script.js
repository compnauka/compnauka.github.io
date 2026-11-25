const byId = id => document.getElementById(id);

const seniorCopy = {
  query: "Назви тему й уточни, що саме хочеш дізнатися. Підійдуть і ключові слова «Місяць відбите світло», і запитання «Чому світить Місяць?».",
  ad: "Шукай позначку «Реклама» або «Спонсоровано». Місце в результатах пошуку саме по собі не підтверджує правдивість інформації.",
  source: "Перевір автора чи організацію, дату, докази та посилання. Кінець адреси може підказати тип сайту. Важливий факт звір у двох незалежних джерелах.",
  regular: "Пошуковик добирає сторінки до запиту й може показувати короткі уривки. Відкрий джерело, щоб прочитати матеріал у контексті.",
  ai: "Пошуковик іноді показує огляд, створений ШІ на основі вебсторінок. Деякі чатботи теж можуть шукати в інтернеті й давати посилання. Здатність шукати залежить від сервісу й увімкнених функцій.",
  verify: "ШІ може пропустити важливу деталь, неправильно пояснити джерело або вигадати факт. Відкрий посилання, знайди саме це твердження на сторінці й звір його з іншим незалежним джерелом.",
  "check-one": "Сформулюй точний запит без особистих даних.",
  "check-two": "Зауваж, хто опублікував матеріал, коли й на чому ґрунтуються його твердження.",
  "check-three": "Відкрий джерела огляду чи відповіді ШІ та звір важливий факт у двох незалежних джерелах."
};

const topics = [
  {
    label: "🌙 Місяць", query: "Чому світить Місяць?", match: /місяц|місяч|moon/iu,
    confirmed: false,
    claim: "Місяць світиться сам, як лампа.",
    source: "Матеріал про місячне світло",
    publisher: "NASA Science",
    evidence: "Місяць відбиває світло Сонця. Саме це світло ми бачимо із Землі.",
    second: "Для другої перевірки знайди в шкільному підручнику пояснення, чому видно освітлений Сонцем Місяць.",
    ad: "Замов нічник у формі Місяця!"
  },
  {
    label: "☀️ Сонце", query: "Чи є Сонце зорею?", match: /сонц|соняч|sun/iu,
    confirmed: true,
    claim: "Сонце — найближча до Землі зоря.",
    source: "Навчальний матеріал про Сонце",
    publisher: "NASA Science",
    evidence: "Сонце — зоря. Воно ближче до Землі за інші зорі.",
    second: "Для другої перевірки знайди у шкільній енциклопедії розділ про Сонячну систему.",
    ad: "Купи набір наліпок із зорями!"
  },
  {
    label: "🌍 Земля", query: "За скільки днів Земля обертається навколо Сонця?", match: /земл|365|тривалість року/iu,
    confirmed: true,
    claim: "Земля робить оберт навколо Сонця приблизно за 365 днів.",
    source: "Словничок про рух Землі",
    publisher: "NOAA, наукова установа США",
    evidence: "Один оберт Землі навколо Сонця триває приблизно 365 і чверть доби.",
    second: "Для другої перевірки пошукай у підручнику пояснення, скільки триває рік і чому бувають високосні роки.",
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
    ? "Власні запити, перевірка джерел і 6 завдань."
    : "Готові запити, короткі пояснення і 4 завдання.";
  const copy = senior ? seniorCopy : juniorCopy;
  document.querySelectorAll("[data-copy]").forEach(node => { node.textContent = copy[node.dataset.copy]; });
  byId("search-instructions").textContent = senior
    ? "Обери тему або напиши свій запит про Місяць, Сонце чи Землю."
    : "Обери, про що хочеш дізнатися.";
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

function showSearch(topic) {
  Array.from(topicsBox.children).forEach((button, index) => {
    button.setAttribute("aria-pressed", String(topics[index] === topic));
  });
  status.textContent = "Навчальний приклад. Запит — " + topic.query;
  results.replaceChildren();
  results.hidden = false;

  const overview = document.createElement("article");
  overview.className = "sample-ai";
  addText(overview, "p", "Змодельований огляд від ШІ", "tag");
  addText(overview, "h3", topic.claim);
  addText(overview, "p", "Нижче відкрий навчальне джерело й порівняй пояснення з оглядом.");

  const ad = document.createElement("article");
  addText(ad, "p", "Реклама · навчальний приклад", "tag ad");
  addText(ad, "h3", topic.ad);
  const source = document.createElement("details");
  addText(source, "summary", "Відкрити навчальне джерело");
  addText(source, "p", topic.source + " · " + topic.publisher);
  addText(source, "p", topic.evidence);
  if (senior) addText(source, "p", topic.second);

  const check = document.createElement("article");
  addText(check, "h3", "Чи підтвердило джерело огляд?");
  const buttons = addText(check, "div", "", "result-buttons");
  const feedback = addText(check, "p", "", "feedback");
  feedback.setAttribute("role", "status");
  ["Так, твердження збігається", "Ні, огляд містить помилку"].forEach((label, index) => {
    buttons.append(makeButton(label, event => {
      if (!source.open) {
        feedback.textContent = "Спочатку відкрий навчальне джерело вище.";
        source.querySelector("summary").focus();
        return;
      }

      const correct = (index === 0) === topic.confirmed;
      event.currentTarget.dataset.result = correct ? "correct" : "incorrect";
      feedback.textContent = (correct ? "Саме так. " : "Звірмо ще раз. ") + topic.evidence;
      buttons.querySelectorAll("button").forEach(button => { button.disabled = true; });
      feedback.tabIndex = -1;
      feedback.focus();
    }));
  });
  if (senior) results.append(ad, overview, source, check);
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
    ? "Усі ситуації розгадано!"
    : "Можеш зіграти ще раз і застосувати поради з гри.";
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
