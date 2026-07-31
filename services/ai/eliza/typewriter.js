/**
 * typewriter.js — ефект друкарської машинки.
 *
 * У старій версії текст друкувався без можливості зупинити чи пропустити:
 * поки Еліза «набирає», поле вводу заблоковане, і якщо десь трапиться
 * помилка — воно лишиться заблокованим назавжди. Тут друк завжди можна
 * завершити достроково: клацнути по чату, натиснути Enter або викликати
 * finish() програмно.
 */

const prefersReducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {HTMLElement} element — куди друкувати
 * @param {string} text — що друкувати
 * @param {{speed?: number, onTick?: Function, onDone?: Function}} options
 * @returns {{finish: Function, isDone: Function}}
 */
export function typeText(element, text, { speed = 24, onTick, onDone } = {}) {
  let index = 0;
  let timer = null;
  let done = false;

  function complete() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    element.textContent = text;
    if (onTick) onTick();
    if (onDone) onDone();
  }

  function step() {
    if (index >= text.length) {
      complete();
      return;
    }
    element.textContent += text.charAt(index);
    index += 1;
    if (onTick) onTick();
    timer = setTimeout(step, speed + Math.random() * speed);
  }

  element.textContent = '';

  // Якщо користувач просив менше анімації — показуємо текст одразу.
  if (prefersReducedMotion || text.length === 0) {
    complete();
  } else {
    timer = setTimeout(step, speed);
  }

  return {
    finish: complete,
    isDone: () => done
  };
}
