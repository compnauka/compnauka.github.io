import { safeHttpUrl } from './utils.js';

const FALLBACK_QUIZ = { question: "Матеріал засвоєно?", options: ["Ні", "Так", "Частково"], correct: 1 };

function sessionKeyForLesson(id) {
  return `cs_lesson_content_${id}`;
}

function safeStr(v) { return typeof v === 'string' ? v : ''; }
function safeArr(a) { return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; }

function normalizeLessonContent(obj, baseLesson) {
  const quizObj = obj?.quiz && typeof obj.quiz === 'object' ? obj.quiz : null;

  const quizQuestion = safeStr(quizObj?.question) || FALLBACK_QUIZ.question;
  const quizOptions = Array.isArray(quizObj?.options)
    ? quizObj.options.filter(x => typeof x === 'string')
    : FALLBACK_QUIZ.options;

  const quizCorrectRaw = Number.isInteger(quizObj?.correct) ? quizObj.correct : FALLBACK_QUIZ.correct;
  const correctClamped = Math.min(Math.max(0, quizCorrectRaw), Math.max(0, (quizOptions?.length || 1) - 1));

  const videoUrlRaw = safeStr(obj?.video?.url);
  const videoUrlSafe = videoUrlRaw ? safeHttpUrl(videoUrlRaw) : null;

  return {
    id: safeStr(obj?.id) || baseLesson?.id || '',
    title: safeStr(obj?.title) || safeStr(baseLesson?.title) || baseLesson?.id || '',
    theory: safeArr(obj?.theory),
    key_terms: Array.isArray(obj?.key_terms)
      ? obj.key_terms
          .filter(it => it && typeof it === 'object')
          .map(it => ({ term: safeStr(it.term), definition: safeStr(it.definition) }))
          .filter(it => it.term || it.definition)
      : [],
    examples: safeArr(obj?.examples),
    mini_tasks: safeArr(obj?.mini_tasks),
    reflection: safeArr(obj?.reflection),
    callout: safeStr(obj?.callout) || '',
    quiz: {
      question: quizQuestion,
      options: quizOptions?.length ? quizOptions : FALLBACK_QUIZ.options,
      correct: correctClamped
    },
    video: {
      url: videoUrlSafe,
      title: safeStr(obj?.video?.title) || safeStr(obj?.title) || safeStr(baseLesson?.title) || baseLesson?.id || ''
    }
  };
}

export async function loadLessonContent({ lessonId, baseLesson, cacheMap }) {
  if (cacheMap.has(lessonId)) return cacheMap.get(lessonId);

  // sessionStorage cache
  try {
    const cached = sessionStorage.getItem(sessionKeyForLesson(lessonId));
    if (cached) {
      const parsed = JSON.parse(cached);
      const normalized = normalizeLessonContent(parsed, baseLesson);
      cacheMap.set(lessonId, normalized);
      return normalized;
    }
  } catch {}

  const url = `./content/lessons/${encodeURIComponent(lessonId)}.json`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const normalized = normalizeLessonContent(data, baseLesson);
    cacheMap.set(lessonId, normalized);

    try { sessionStorage.setItem(sessionKeyForLesson(lessonId), JSON.stringify(data)); } catch {}
    return normalized;
  } catch {
    // Friendly fallback (keeps UI stable)
    const normalized = normalizeLessonContent({}, baseLesson);
    normalized.theory = [
      "Матеріали цього уроку ще не додані або тимчасово недоступні.",
      `Додай файл: content/lessons/${lessonId}.json`
    ];
    normalized.callout = "Порада: перевір, що сайт запущений через сервер (не file://), і файл JSON існує.";
    cacheMap.set(lessonId, normalized);
    return normalized;
  }
}
