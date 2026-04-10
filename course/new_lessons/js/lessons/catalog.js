import { infoTypesLessonTemplate } from "./info-types-1-2.js";
import { infoPresentationLessonTemplate } from "./info-presentation-1-2.js";
import { messageActionsLessonTemplate } from "./message-actions-1-2.js";
import { objectsModelsLessonTemplate } from "./objects-models-1-2.js";
import { infoHistoryCodingLessonTemplate } from "./info-history-coding-1-2.js";
import { sourcesTruthLessonTemplate } from "./sources-truth-1-2.js";

export const lessonCatalog = [
  {
    id: "info-types-1-2",
    label: "Інформація. Як ми сприймаємо інформацію (1-2 клас)",
    url: "./info-types-1-2.html",
    template: infoTypesLessonTemplate
  },
  {
    id: "info-presentation-1-2",
    label: "Види інформації та способи подання (1-2 клас)",
    url: "./info-presentation-1-2.html",
    template: infoPresentationLessonTemplate
  },
  {
    id: "message-actions-1-2",
    label: "Дії з інформацією. Інформаційний процес (1-2 клас)",
    url: "./message-actions-1-2.html",
    template: messageActionsLessonTemplate
  },
  {
    id: "objects-models-1-2",
    label: "Об’єкти, властивості, моделі (1-2 клас)",
    url: "./objects-models-1-2.html",
    template: objectsModelsLessonTemplate
  },
  {
    id: "info-history-coding-1-2",
    label: "Кодування інформації (1-2 клас)",
    url: "./info-history-coding-1-2.html",
    template: infoHistoryCodingLessonTemplate
  },
  {
    id: "sources-truth-1-2",
    label: "Джерела інформації. Правдиве і неправдиве (1-2 клас)",
    url: "./sources-truth-1-2.html",
    template: sourcesTruthLessonTemplate
  }
];

export function resolveLessonConfig(lessonId) {
  return lessonCatalog.find((lesson) => lesson.id === lessonId) || lessonCatalog[0];
}
