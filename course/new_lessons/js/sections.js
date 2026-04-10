import { escapeHtml } from "./shared.js";

export function renderSections(container, sections) {
  container.innerHTML = sections.map((section) => {
    const cardsMarkup = section.cards
      ? `<div class="info-grid">${section.cards.map((card) => `<article class="info-box"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></article>`).join("")}</div>`
      : "";
    const bulletsMarkup = section.bullets
      ? `<ul class="simple-list">${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";
    return `
      <article class="section-block">
        <div class="section-block__header">
          <h3>${escapeHtml(section.title)}</h3>
        </div>
        <div class="section-block__content">
          <p>${escapeHtml(section.intro)}</p>
          ${cardsMarkup}
          ${bulletsMarkup}
          <div class="teacher-only method-box">${escapeHtml(section.teacherTip)}</div>
        </div>
      </article>
    `;
  }).join("");
}
