# Міграція курсу

Новий URL: skill.html?skill=KEY. Номер показує порядок, не ідентичність. skill.html?order=N дозволяє явно відкрити новий номер. Старі skill.html?id=N та lesson-NN.html зберігають історичне значення. Старі 06 → classification, 13/14 → commands-route.

Сховище digital-minimum-progress-v2 залишається незмінним. Нове — digital-superpowers-progress-v3. Старі перевірки дозволяли підказані повтори, тому старий статус є історією, а активність переноситься як «Тренуюся», без автоматичного «Вмію». Нові чотири навички починаються з «Нове».

У межах assessmentVersion зберігається найкращий статус: 4/4 — Вмію, 3/4 — Майже, 0–2/4 — Тренуюся. Зміна версії вимагає нового контролю, попередній статус зберігається в history. Скидання прогресу ставить migrated=true, тому старі дані не відновлюються після перезавантаження.

| Старий ID | skillKey | Новий № |
|---|---|---|
| 1 | device-choice | 1 |
| 2 | device-control | 2 |
| 3 | keyboard-input | 3 |
| 4 | info-types | 4 |
| 5 | classification | 5 |
| 6 | classification | 5 |
| 7 | save-find | 10 |
| 8 | browser-navigation | 11 |
| 9 | online-search | 12 |
| 10 | personal-privacy | 13 |
| 11 | online-response | 15 |
| 12 | password-safety | 14 |
| 13 | commands-route | 16 |
| 14 | commands-route | 16 |
| 15 | algorithm-debugging | 17 |
| 16 | algorithm-repeat | 18 |
