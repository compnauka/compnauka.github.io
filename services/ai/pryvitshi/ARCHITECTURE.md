# ARCHITECTURE.md — архітектура "Привіт, ШІ!"

## 1. Поточна архітектура

Статичний браузерний застосунок без бекенду. Усі файли — локальні.

```text
index.html
  ├─ підключає Google Fonts (CDN), style.css
  └─ підключає main.js як ES-модуль

main.js
  ├─ імпортує bookSections, validateSections, saveProgress, loadSavedIndex
  ├─ імпортує initMenu, renderNav, appendMessage
  ├─ формує список розділів із Object.keys(bookSections)
  ├─ керує навігацією (prevBtn, nextBtn, sidebar)
  ├─ запускає стаггеровані таймери для появи повідомлень
  ├─ зберігає/відновлює прогрес через storage.js
  └─ анімація переходу між розділами (exit → enter)

renderers.js
  ├─ appendMessage(msg, chatWindow, onStart) — публічне API
  ├─ buildCover / buildDialogBubble / buildNarrator — типи повідомлень
  ├─ renderBlock — рендер блоків: paragraph, list, ordered-list,
  │               quote, heading, definition, highlight, table
  └─ рендеринг виключно через DOM API (createElement, textContent)

quiz.js
  ├─ buildQuizElement(quiz, checkAnswer) — DOM-рендер квізу
  └─ checkAnswer — логіка перевірки відповіді

navigation.js   — renderNav: бокове меню із підсвіченням активного розділу
menu.js         — initMenu: відкриття/закриття sidebar + overlay
storage.js      — saveProgress / loadSavedIndex через sessionStorage
validator.js    — validateSections: перевірка структури при старті

bookSections.js — увесь контент: 15 розділів, структуровані об'єкти
```

## 2. Що добре в поточній архітектурі

- Немає серверної частини — менше ризиків для дитячого продукту
- ES-модулі: кожен файл відповідає за одну зону
- Контент повністю відокремлений у `bookSections.js` без HTML
- Весь рендеринг — DOM API, не `innerHTML`
- Валідатор структури контенту при старті
- `innerHTML` залишено тільки для очищення контейнерів: `chatWindow.innerHTML = ''`, `navContainer.innerHTML = ''`

## 3. Залишкові архітектурні ризики

### 3.1. ~~`localStorage`~~ — вирішено ✅

Прогрес зберігається в `sessionStorage` як `aiBookProgress`. Після закриття вкладки автоматично скидається — кожен учень починає з початку.

### 3.2. Google Fonts через CDN

Шрифт Nunito підключено через Google Fonts CDN. Це:
- залежність від доступності сервісу (не працює офлайн)
- privacy: браузер робить запит до Google при кожному відкритті

**Варіант вирішення:** завантажити woff2-файли локально та підключити через `@font-face`.

### 3.3. Google Analytics

Єдиний трекер, що залишився. Рішення — на розсуд власника продукту.

### 3.4. Немає PWA

Відсутні `manifest.json`, `sw.js`, `offline.html`. Книга не працює без інтернету.

## 4. Модель даних розділу

```js
{
  title: 'Розділ N: Назва',
  messages: [
    { type: 'narrator', blocks: [...] },           // проза
    { type: 'user',     content: '...' },           // репліка Тимка
    { type: 'ai',       content: '...', image?, alt? }, // репліка Розумка
    { type: 'note',     blocks: [...] },            // інфо-картка
    { type: 'activity', activityType: 'classifier', content: { ... } }, // вправа
  ],
  quizzes: [
    {
      question: '...',
      options: [{ text: '...', correct: true }, ...],
      explanation: '...'
    }
  ]
}
```

## 5. Типи контентних блоків

```js
{ type: 'paragraph',    text, bold?: true }
{ type: 'list',         items }           // item: string | Segment[]
{ type: 'ordered-list', items }
{ type: 'quote',        lines }           // масив рядків
{ type: 'heading',      text }
{ type: 'definition',   term, text }
{ type: 'highlight',    text }            // акцентний параграф (indigo)
{ type: 'table',        headers[], rows[][] }

// Segment: { text } | { bold: true, text } | { link: true, href, text }
```

Довільний HTML у контенті заборонено. Для нового типу форматування — спочатку додати `case` в `renderBlock` (`renderers.js`).

## 6. Таймери повідомлень

`messageTimers` — масив id, який очищається при кожному `loadSection`. Це запобігає накопиченню таймерів при швидкій навігації. Логіку очищення зберігати.

## 7. Навігація

Порядок розділів визначається `Object.keys(bookSections)`. JS-рушії гарантують порядок для рядкових ключів у сучасних браузерах, але явний масив був би надійнішим.

## 8. Стан застосунку

```js
let currentSectionIndex = 0;  // main.js
let messageTimers = [];        // main.js
```

Мінімальний стан, достатній для поточного масштабу.

## 9. Критерії приймання будь-яких змін

- Усі розділи відкриваються
- Квізи працюють
- Мобільне меню працює
- Консоль без помилок
- `node --check *.js` проходить для всіх JS-файлів
- Новий контент додається без HTML
