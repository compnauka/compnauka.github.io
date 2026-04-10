import { escapeHtml, renderRichText } from "./shared.js";

function resolveAudienceClass(audience) {
  if (audience === "teacher") return "teacher-only";
  if (audience === "student") return "student-only";
  return "";
}

export function renderSections(container, sections) {
  container.innerHTML = sections.map((section) => {
    const cardsMarkup = section.cards
      ? `<div class="info-grid">${section.cards.map((card) => `<article class="info-box"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></article>`).join("")}</div>`
      : "";
    const bulletsMarkup = section.bullets
      ? `<ul class="simple-list">${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";
    const audienceClass = resolveAudienceClass(section.audience);
    const teacherTipMarkup = section.teacherTip
      ? `<div class="teacher-only method-box">${renderRichText(section.teacherTip)}</div>`
      : "";

    return `
      <article class="section-block ${audienceClass}">
        <div class="section-block__header">
          <h3>${escapeHtml(section.title)}</h3>
        </div>
        <div class="section-block__content">
          <p>${escapeHtml(section.intro)}</p>
          ${cardsMarkup}
          ${bulletsMarkup}
          ${teacherTipMarkup}
        </div>
      </article>
    `;
  }).join("");
}

export function renderOverview(container, overview, sectionRefs = {}) {
  if (!container || !sectionRefs.section) return;

  if (!overview) {
    sectionRefs.section.hidden = true;
    container.innerHTML = "";
    return;
  }

  sectionRefs.section.hidden = false;
  if (sectionRefs.label) sectionRefs.label.textContent = overview.label;
  if (sectionRefs.title) sectionRefs.title.textContent = overview.title;

  container.innerHTML = overview.cards.map((card) => {
    const audienceClass = resolveAudienceClass(card.audience);
    const bodyMarkup = Array.isArray(card.items) && card.items.length > 0
      ? `<ul class="simple-list">${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : `<p>${escapeHtml(card.text || "")}</p>`;

    return `
      <article class="info-box ${audienceClass}">
        <h3>${escapeHtml(card.title)}</h3>
        ${bodyMarkup}
      </article>
    `;
  }).join("");
}
