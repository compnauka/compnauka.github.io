import { lessonCatalog } from "./lessons/catalog.js";

const container = document.getElementById("lesson-links");

if (container) {
  container.innerHTML = lessonCatalog.map((lesson) => `
    <article class="content-card">
      <h3>${lesson.label}</h3>
      <p>Окрема сторінка уроку для поширення, аналітики та SEO.</p>
      <p><a class="primary-button" href="${lesson.url}">Відкрити урок</a></p>
    </article>
  `).join("");
}
