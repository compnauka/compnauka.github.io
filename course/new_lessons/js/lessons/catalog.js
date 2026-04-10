import { infoTypesLessonTemplate } from "./info-types-1-2.js";
import { messageActionsLessonTemplate } from "./message-actions-1-2.js";
import { infoHistoryCodingLessonTemplate } from "./info-history-coding-1-2.js";

export const lessonCatalog = [
  {
    id: "info-types-1-2",
    label: "Інформація. Види інформації (1-2 клас)",
    url: "./info-types-1-2.html",
    template: infoTypesLessonTemplate
  },
  {
    id: "message-actions-1-2",
    label: "Повідомлення. Дії з інформацією (1-2 клас)",
    url: "./message-actions-1-2.html",
    template: messageActionsLessonTemplate
  },
  {
    id: "info-history-coding-1-2",
    label: "Історія та кодування інформації (1-2 клас)",
    url: "./info-history-coding-1-2.html",
    template: infoHistoryCodingLessonTemplate
  }
];

export function resolveLessonConfig(lessonId) {
  return lessonCatalog.find((lesson) => lesson.id === lessonId) || lessonCatalog[0];
}
