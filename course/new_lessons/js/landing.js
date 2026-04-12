import { lessonCatalog } from "./lessons/catalog.js";
import { textbookModules } from "./landing-modules.js";
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

function aggregateModuleOutcomes(lessonConfigs) {
  const byCode = new Map();
  for (const lesson of lessonConfigs) {
    const results = lesson.template?.coverage?.results;
    if (!Array.isArray(results)) continue;
    for (const r of results) {
      if (!r?.code) continue;
      if (!byCode.has(r.code)) {
        byCode.set(r.code, { code: r.code, status: r.status || "partial", focuses: [] });
      }
      const entry = byCode.get(r.code);
      if (r.status === "full") entry.status = "full";
      if (r.focus && !entry.focuses.includes(r.focus)) entry.focuses.push(r.focus);
    }
  }
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code, "uk"));
}

function renderStudentModules() {
  return textbookModules
    .map((mod) => {
      const lessons = mod.lessonIds.map((id) => lessonById[id]).filter(Boolean);
      const items = lessons
        .map((lesson) => {
          const n = globalLessonNumber(lesson.id);
          const title = displayLessonTitle(lesson.label);
          const hint = lessonDescriptions[lesson.id] || "Інтерактивний урок.";
          return `
        <li class="landing-lesson-list__item">
          <div class="landing-lesson-list__row">
            <span class="landing-lesson-list__badge" aria-hidden="true">Урок ${n}</span>
            <a class="landing-lesson-list__link primary-button" href="${escapeHtml(lesson.url)}">Відкрити урок</a>
          </div>
          <p class="landing-lesson-list__title">${escapeHtml(title)}</p>
          <p class="landing-lesson-list__hint">${escapeHtml(hint)}</p>
        </li>`;
        })
        .join("");

      return `
    <section class="landing-module section-card" aria-labelledby="landing-mod-${mod.id}-title">
      <header class="landing-module__header">
        <p class="section-label">Модуль ${mod.id}</p>
        <h2 id="landing-mod-${mod.id}-title">${escapeHtml(mod.title)}</h2>
        <p class="landing-module__lead">${escapeHtml(mod.studentLead)}</p>
      </header>
      <ol class="landing-lesson-list" aria-label="Уроки модуля ${mod.id}">
        ${items}
      </ol>
    </section>`;
    })
    .join("");
}

function statusLabel(status) {
  if (status === "full") return "Повне покриття";
  return "Часткове / підсилення";
}

function renderTeacherModules() {
  return textbookModules
    .map((mod) => {
      const lessons = mod.lessonIds.map((id) => lessonById[id]).filter(Boolean);
      const outcomes = aggregateModuleOutcomes(lessons);
      const outcomeBlocks = outcomes
        .map((o) => {
          const focusBlock =
            o.focuses.length > 0
              ? `<ul class="landing-outcome__list simple-list">
            ${o.focuses.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
          </ul>`
              : `<p class="landing-muted landing-outcome__fallback">Детальні формулювання — у картках уроків нижче.</p>`;
          return `
        <article class="info-box landing-outcome">
          <h3 class="landing-outcome__code">[${escapeHtml(o.code)}]</h3>
          <p class="landing-outcome__status landing-coverage__status landing-coverage__status--${o.status === "full" ? "full" : "partial"}">${escapeHtml(statusLabel(o.status))}</p>
          ${focusBlock}
        </article>`;
        })
        .join("");

      const lessonBlocks = lessons
        .map((lesson) => {
          const n = globalLessonNumber(lesson.id);
          const title = displayLessonTitle(lesson.label);
          const tmpl = lesson.template || {};
          const coverage = tmpl.coverage;
          const chips = (coverage?.results || [])
            .map(
              (item) =>
                `<span class="lesson-card__chip lesson-card__chip--${item.status === "full" ? "full" : "partial"}">${escapeHtml(item.code)}</span>`
            )
            .join("");
          const objectives = Array.isArray(tmpl.objectives)
            ? tmpl.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
            : "";
          const cycleNote = coverage?.note ? `<p class="landing-teacher-lesson__note">${escapeHtml(coverage.note)}</p>` : "";

          return `
        <article class="landing-teacher-lesson content-card">
          <div class="landing-teacher-lesson__top">
            <h3 class="landing-teacher-lesson__title"><a href="${escapeHtml(lesson.url)}">${escapeHtml(title)}</a></h3>
            <p class="landing-teacher-lesson__meta">Урок ${n} у загальній лінійці · Модуль ${mod.id}</p>
            <div class="lesson-card__meta" aria-label="Коди результатів за уроком">${chips}</div>
          </div>
          ${cycleNote}
          <div class="landing-teacher-lesson__goal">
            <strong>Мета уроку</strong>
            <p>${escapeHtml(tmpl.goal || "—")}</p>
          </div>
          <div class="landing-teacher-lesson__objectives">
            <strong>Очікувані результати навчання (формулювання для вчителя)</strong>
            <ul class="simple-list">${objectives || "<li>—</li>"}</ul>
          </div>
          <a class="primary-button" href="${escapeHtml(lesson.url)}">Відкрити урок</a>
        </article>`;
        })
        .join("");

      return `
    <section class="landing-module section-card section-card--soft" aria-labelledby="landing-teach-${mod.id}-title">
      <header class="landing-module__header">
        <p class="section-label">Модуль ${mod.id}</p>
        <h2 id="landing-teach-${mod.id}-title">${escapeHtml(mod.title)}</h2>
        <p class="landing-module__lead">${escapeHtml(mod.teacherLead)}</p>
      </header>
      <div class="landing-module__teacher-block">
        <h3 class="landing-subheading">ІФО та фокус модуля</h3>
        <p class="landing-muted">Нижче зведено коди очікуваних результатів (ІФО), які зустрічаються в уроках модуля, з акцентами з шаблонів уроків.</p>
        <div class="landing-outcome-grid">
          ${outcomeBlocks}
        </div>
      </div>
      <h3 class="landing-subheading">Уроки та покриття</h3>
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
  });
  refs.modeTeacher.addEventListener("click", () => {
    toggleMode("teacher", state, refs);
  });
  applyMode(state, refs);
});
