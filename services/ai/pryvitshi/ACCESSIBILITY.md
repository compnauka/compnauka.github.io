# ACCESSIBILITY.md — доступність інтерактивної книги

## 1. Мета

Книга має бути зручною для дітей, учителів і батьків на різних пристроях. Доступність тут не є додатковою опцією: це базова вимога для освітнього продукту.

## 2. Поточні проблеми

1. У `index.html` заблоковано масштабування сторінки.
2. Немає skip-link до основного контенту.
3. Мобільне меню не має повного ARIA-стану.
4. Escape не закриває меню.
5. Немає focus trap для відкритого мобільного меню.
6. Анімації не враховують `prefers-reduced-motion`.
7. Зображення мають загальний `alt="Ілюстрація"`.
8. Аудіо має controls, але не має текстового опису/транскрипту.
9. Частина повідомлень з’являється із затримкою, що може бути незручно для screen reader і дітей, які хочуть швидко прочитати розділ.

## 3. Обов’язкові виправлення

### 3.1. Viewport

Було:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

Має бути:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 3.2. Skip-link

Додати відразу після відкриття `<body>`:

```html
<a href="#main-content" class="skip-link">Перейти до змісту</a>
```

Основному блоку додати id:

```html
<main id="main-content">
```

CSS:

```css
.skip-link {
  position: absolute;
  left: 1rem;
  top: 1rem;
  transform: translateY(-200%);
  background: #fff;
  color: #1e1b4b;
  padding: 0.75rem 1rem;
  border: 2px solid #4f46e5;
  border-radius: 0.75rem;
  z-index: 100;
  font-weight: 800;
}
.skip-link:focus { transform: translateY(0); }
```

### 3.3. Мобільне меню

Кнопка меню має мати:

```html
<button id="menuBtn" aria-label="Відкрити меню навігації" aria-controls="sidebar" aria-expanded="false">
```

При відкритті:

```js
menuBtn.setAttribute("aria-expanded", "true");
```

При закритті:

```js
menuBtn.setAttribute("aria-expanded", "false");
menuBtn.focus();
```

Escape:

```js
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
```

### 3.4. Reduced motion

Додати в `style.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

У JS бажано не запускати каскадні затримки, якщо користувач просить зменшити рух.

## 4. Alt-тексти

Поточний варіант `alt="Ілюстрація"` недостатній.

Кожне зображення має мати конкретний опис:

```js
image: {
  src: "005.webp",
  alt: "Плакат Тимка з прикладами ШІ навколо нас: телефон, навігатор, робот-пилосос і рекомендації мультфільмів."
}
```

Якщо зображення суто декоративне, використовувати `alt=""`. У цій книзі більшість зображень змістові, тому їм потрібен опис.

## 5. Аудіо

Для `AI_SONG.mp3` додати:

- назву;
- короткий опис;
- текст або стислий зміст пісні.

Приклад моделі:

```js
audio: {
  src: "AI_SONG.mp3",
  title: "Пісенька про ШІ",
  description: "Коротка пісенька про те, що ШІ може допомагати в навчанні й творчості.",
  transcript: "..."
}
```

## 6. Клавіатурна навігація

Користувач має могти:

- перейти до основного контенту через skip-link;
- відкрити меню кнопкою Enter/Space;
- закрити меню Escape;
- перейти по пунктах меню Tab;
- відповідати на квізи клавіатурою;
- натискати “Назад” і “Далі” клавіатурою;
- бачити focus outline на всіх активних елементах.

Не прибирати `outline`, якщо не додано рівноцінний `:focus-visible` стиль.

## 7. Live region

`chatWindow` має `aria-live="polite"`. Це добре, але через послідовне додавання багатьох повідомлень screen reader може отримати забагато оновлень.

Рекомендації:

- або рендерити весь розділ одразу;
- або додати кнопку “Показати весь розділ”;
- або вимикати каскадну анімацію для screen reader/reduced motion.

## 8. Accessibility checklist

- [ ] Zoom не заблоковано.
- [ ] Є skip-link.
- [ ] Усі кнопки мають зрозумілі назви.
- [ ] Мобільне меню має `aria-expanded`.
- [ ] Escape закриває меню.
- [ ] Фокус повертається на кнопку меню після закриття.
- [ ] Видимий focus є на всіх кнопках.
- [ ] Усі зображення мають змістовні alt.
- [ ] Аудіо має опис/транскрипт.
- [ ] Є reduced motion.
- [ ] Квізи доступні з клавіатури.
- [ ] Немає горизонтального скролу на 320px.
- [ ] Сторінка читається при zoom 200%.
