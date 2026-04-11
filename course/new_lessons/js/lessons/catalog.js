import { infoTypesLessonTemplate } from "./info-types-1-2.js";
import { infoPresentationLessonTemplate } from "./info-presentation-1-2.js";
import { messageActionsLessonTemplate } from "./message-actions-1-2.js";
import { objectsModelsLessonTemplate } from "./objects-models-1-2.js";
import { infoHistoryCodingLessonTemplate } from "./info-history-coding-1-2.js";
import { sourcesTruthLessonTemplate } from "./sources-truth-1-2.js";
import { setsOrderLessonTemplate } from "./sets-order-1-2.js";
import { simpleTablesLessonTemplate } from "./simple-tables-1-2.js";

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
    label: "Дії з інформацією. Що ми робимо з повідомленнями (1-2 клас)",
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
  },
  {
    id: "sets-order-1-2",
    label: "Множини. Групуємо та впорядковуємо (1-2 клас)",
    url: "./sets-order-1-2.html",
    template: setsOrderLessonTemplate
  },
  {
    id: "simple-tables-1-2",
    label: "Прості схеми та таблиці (1-2 клас)",
    url: "./simple-tables-1-2.html",
    template: simpleTablesLessonTemplate
  }
];

export function resolveLessonConfig(lessonId) {
  return lessonCatalog.find((lesson) => lesson.id === lessonId) || lessonCatalog[0];
}
