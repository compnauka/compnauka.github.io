import { lessonCatalog } from "./lessons/catalog.js";

const container = document.getElementById("lesson-links");

const lessonDescriptions = {
  "info-types-1-2": "Як ми отримуємо інформацію очима, вухами, носом, язиком і шкірою.",
  "info-presentation-1-2": "У яких формах інформація може бути подана: текст, малюнок, звук, знак або сигнал.",
  "message-actions-1-2": "Що ми робимо з інформацією: отримуємо, передаємо, зберігаємо й упорядковуємо.",
  "objects-models-1-2": "Як описувати об’єкти, їхні властивості та розуміти прості моделі.",
  "info-history-coding-1-2": "Як знаки, цифри, сигнали й піктограми допомагають кодувати зміст.",
  "sources-truth-1-2": "Як розпізнавати джерела інформації та перевіряти, що є правдою.",
  "sets-order-1-2": "Як збирати предмети в групи, порівнювати дві групи і впорядковувати елементи.",
  "simple-tables-1-2": "Як читати прості схеми й таблиці, знаходити рядок, стовпець і потрібну клітинку."
};

if (container) {
  container.innerHTML = lessonCatalog.map((lesson, index) => `
    <article class="lesson-card">
      <div class="lesson-card__top">
        <span class="lesson-card__number">Урок ${index + 1}</span>
        <h3>${lesson.label}</h3>
      </div>
      <p class="lesson-card__text">${lessonDescriptions[lesson.id] || "Інтерактивний урок для 1-2 класу."}</p>
      <div class="lesson-card__meta">
        ${(lesson.template.coverage?.results || []).map((item) => `
          <span class="lesson-card__chip lesson-card__chip--${item.status === "full" ? "full" : "partial"}">${item.code}</span>
        `).join("")}
      </div>
      <a class="primary-button lesson-card__button" href="${lesson.url}">Відкрити урок</a>
    </article>
  `).join("");
}
