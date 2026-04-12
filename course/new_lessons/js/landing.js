import { lessonCatalog } from "./lessons/catalog.js";
import { textbookModules } from "./landing-modules.js";
import { ifoByLessonCode } from "./ifo-catalog.js";
import { applyMode, escapeHtml, toggleMode } from "./shared.js";

const lessonDescriptions = {
  "info-types-1-2": "Як ми отримуємо інформацію очима, вухами, носом, язиком і шкірою.",
  "info-presentation-1-2": "У яких формах інформація може бути подана: текст, малюнок, звук, знак або сигнал.",
  "message-actions-1-2": "Що ми робимо з інформацією: отримуємо, передаємо, зберігаємо й упорядковуємо.",
  "objects-models-1-2": "Як описувати об’єкти, їхні властивості та розуміти прості моделі.",
  "info-history-coding-1-2": "Як знаки, цифри, сигнали й піктограми допомагають кодувати зміст.",
  "sources-truth-1-2": "Як розпізнавати джерела інформації та перевіряти, що є правдою.",
  "sets-order-1-2": "Як збирати предмети в групи, порівнювати дві групи і впорядковувати елементи.",
  "simple-tables-1-2": "Як читати прості схеми й таблиці, знаходити рядок, стовпець і потрібну клітинку.",
  "computer-what-is-1-2": "Що таке комп’ютер, де ми його зустрічаємо і як він допомагає людині.",
  "computer-types-1-2": "Які бувають комп’ютери і чим відрізняються настільний комп’ютер, ноутбук, планшет і смартфон.",
  "computer-parts-1-2": "З яких основних частин складається комп’ютер і для чого вони потрібні.",
  "device-purpose-1-2": "Які пристрої допомагають бачити, слухати, вводити, друкувати і говорити.",
  "computer-problems-help-1-2": "Що робити, коли щось не працює: помітити проблему і звернутися по допомогу.",
  "computer-safety-1-2": "Як працювати за комп’ютером безпечно, охайно і дбайливо.",
  "commands-executors-1-2": "Хто такий виконавець і як давати прості точні команди людині або роботу.",
  "action-sequence-1-2": "Як ставити знайомі дії в правильному порядку: спочатку, потім, наприкінці.",
  "everyday-algorithm-1-2": "Як перетворити знайому справу на простий план і помітити в ній повторення.",
  "find-fix-order-1-2": "Як знайти зайвий або переплутаний крок і пояснити, що змінюється через помилку.",
  "algorithm-representation-1-2": "Як один і той самий алгоритм можна подати словами, числами, стрілками або простими малюнками.",
  "draw-in-program-1-2": "Як створити простий цифровий малюнок: обрати інструмент, намалювати і зберегти роботу.",
  "simple-info-product-1-2": "Як із малюнка, кількох слів і мети створити листівку, запрошення або оголошення.",
  "sign-your-work-1-2": "Навіщо підписувати власну роботу, як помічати автора і як поважати авторство інших.",
  "work-alone-together-1-2": "Як працювати самостійно, у парі та в групі, домовлятися про ролі і відповідально виконувати свою частину.",
  "internet-what-for-1-2": "Для чого інтернет допомагає людям: знайти інформацію, подивитися потрібне і передати повідомлення.",
  "search-online-1-2": "Як поставити простий запит, знайти потрібну інформацію онлайн і не натискати навмання.",
  "private-info-1-2": "Як берегти особисту інформацію і чому адресу, пароль та номер телефону не варто повідомляти без дорослого.",
  "kind-online-1-2": "Як чемно спілкуватися онлайн, добирати поважні слова і не ображати інших у повідомленнях.",
  "check-before-share-1-2": "Як перевіряти повідомлення перед тим, як їм вірити або пересилати далі."
};

const lessonById = Object.fromEntries(lessonCatalog.map((lesson) => [lesson.id, lesson]));

function displayLessonTitle(label) {
  return String(label).replace(/\s*\(1-2 клас\)\s*$/u, "").trim();
}

function globalLessonNumber(lessonId) {
  const index = lessonCatalog.findIndex((l) => l.id === lessonId);
  return index >= 0 ? index + 1 : 0;
}

function statusLabel(status) {
  if (status === "full") return "Повне покриття в уроці";
  return "Часткове / підсилення в уроці";
}

function renderOfficialIfoPanel(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return `<p class="landing-muted">У шаблоні уроку не зазначено коди ІФО.</p>`;
  }

  return results
    .map((r) => {
      const code = String(r.code || "").trim();
      if (!code) return "";
      const entry = ifoByLessonCode[code];
      const chipClass = r.status === "full" ? "full" : "partial";
      const chip = `<span class="lesson-card__chip lesson-card__chip--${chipClass}" title="${escapeHtml(statusLabel(r.status))}">${escapeHtml(code)}</span>`;

      if (!entry) {
        return `<div class="landing-ifo-panel__block">
          <div class="landing-ifo-panel__chips">${chip}</div>
          <p class="landing-muted">Для цього коду ще немає сторінки в офіційному довіднику на сайті.</p>
        </div>`;
      }

      const lines = entry.lines
        .map(
          (line) =>
            `<li><span class="landing-ifo-line__code">[${escapeHtml(line.code)}]</span> ${escapeHtml(line.text)}</li>`
        )
        .join("");

      return `<div class="landing-ifo-panel__block">
        <div class="landing-ifo-panel__chips">${chip}</div>
        <p class="landing-ifo-panel__competency">${escapeHtml(entry.competency)}</p>
        <ul class="landing-ifo-panel__list simple-list">${lines}</ul>
      </div>`;
    })
    .join("");
}

function renderStudentModules() {
  return textbookModules
    .map((mod) => {
      const emoji = mod.emoji ? `<span class="landing-module__emoji" aria-hidden="true">${mod.emoji}</span>` : "";
      const lessons = mod.lessonIds.map((id) => lessonById[id]).filter(Boolean);
      const items = lessons
        .map((lesson) => {
          const n = globalLessonNumber(lesson.id);
          const title = displayLessonTitle(lesson.label);
          const hint = lessonDescriptions[lesson.id] || "Інтерактивний урок.";
          return `
        <li class="landing-lesson-row">
          <div class="landing-lesson-row__main">
            <span class="landing-lesson-row__badge">Урок ${n}</span>
            <h3 class="landing-lesson-row__title">${escapeHtml(title)}</h3>
            <p class="landing-lesson-row__hint">${escapeHtml(hint)}</p>
          </div>
          <div class="landing-lesson-row__action">
            <a class="primary-button landing-lesson-row__button" href="${escapeHtml(lesson.url)}">Відкрити урок</a>
          </div>
        </li>`;
        })
        .join("");

      return `
    <section class="landing-module section-card" aria-labelledby="landing-mod-${mod.id}-title">
      <header class="landing-module__header landing-module__header--with-emoji">
        <p class="section-label">Модуль ${mod.id}</p>
        <h2 id="landing-mod-${mod.id}-title" class="landing-module__title-row">${emoji}<span>${escapeHtml(mod.title)}</span></h2>
        <p class="landing-module__lead">${escapeHtml(mod.studentLead)}</p>
      </header>
      <ul class="landing-lesson-rows" aria-label="Уроки модуля ${mod.id}">
        ${items}
      </ul>
    </section>`;
    })
    .join("");
}

function renderTeacherModules() {
  return textbookModules
    .map((mod) => {
      const lessons = mod.lessonIds.map((id) => lessonById[id]).filter(Boolean);
      const lessonBlocks = lessons
        .map((lesson) => {
          const n = globalLessonNumber(lesson.id);
          const title = displayLessonTitle(lesson.label);
          const tmpl = lesson.template || {};
          const coverage = tmpl.coverage;
          const results = coverage?.results || [];
          const objectives = Array.isArray(tmpl.objectives)
            ? tmpl.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
            : "";

          return `
        <article class="landing-teacher-lesson content-card">
          <div class="landing-teacher-lesson__grid">
            <div class="landing-teacher-lesson__main">
              <h3 class="landing-teacher-lesson__title"><a href="${escapeHtml(lesson.url)}">${escapeHtml(title)}</a></h3>
              <p class="landing-teacher-lesson__meta">Урок ${n} · Модуль ${mod.id}</p>
              <div class="landing-teacher-lesson__goal">
                <strong>Мета уроку</strong>
                <p>${escapeHtml(tmpl.goal || "—")}</p>
              </div>
              <div class="landing-teacher-lesson__objectives">
                <strong>Орієнтири з шаблону уроку</strong>
                <ul class="simple-list">${objectives || "<li>—</li>"}</ul>
              </div>
              <a class="primary-button landing-teacher-lesson__cta" href="${escapeHtml(lesson.url)}">Відкрити урок</a>
            </div>
            <aside class="landing-teacher-lesson__ifo" aria-label="Очікувані результати за стандартом">
              <h4 class="landing-ifo-panel__heading">ІФО (офіційні формулювання)</h4>
              ${renderOfficialIfoPanel(results)}
            </aside>
          </div>
        </article>`;
        })
        .join("");

      const emoji = mod.emoji ? `<span class="landing-module__emoji" aria-hidden="true">${mod.emoji}</span>` : "";

      return `
    <section class="landing-module section-card section-card--soft" aria-labelledby="landing-teach-${mod.id}-title">
      <header class="landing-module__header landing-module__header--with-emoji">
        <p class="section-label">Модуль ${mod.id}</p>
        <h2 id="landing-teach-${mod.id}-title" class="landing-module__title-row">${emoji}<span>${escapeHtml(mod.title)}</span></h2>
        <p class="landing-module__lead">${escapeHtml(mod.teacherLead)}</p>
      </header>
      <div class="landing-teacher-lesson-stack">
        ${lessonBlocks}
      </div>
    </section>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const studentRoot = document.getElementById("landing-student-modules");
  const teacherRoot = document.getElementById("landing-teacher-modules");
  if (studentRoot) studentRoot.innerHTML = renderStudentModules();
  if (teacherRoot) teacherRoot.innerHTML = renderTeacherModules();

  const refs = {
    body: document.body,
    modeStudent: document.getElementById("mode-student"),
    modeTeacher: document.getElementById("mode-teacher")
  };

  if (!refs.modeStudent || !refs.modeTeacher) return;

  const state = { mode: document.body.classList.contains("teacher-mode") ? "teacher" : "student" };

  refs.modeStudent.addEventListener("click", () => {
    toggleMode("student", state, refs);
    sessionStorage.setItem("lesson-mode", "student");
  });
  refs.modeTeacher.addEventListener("click", () => {
    toggleMode("teacher", state, refs);
    sessionStorage.setItem("lesson-mode", "teacher");
  });
  applyMode(state, refs);
});
