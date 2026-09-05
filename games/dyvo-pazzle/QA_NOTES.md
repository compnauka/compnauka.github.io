# QA Notes — Диво-Пазл 2.0

## Закриті P0/P1 проблеми з аудиту

1. **Service Worker cache isolation** — видаляються лише кеші `divo-puzzle-*`.
1a. **Оновлення кешу** — `CACHE_VERSION` = хеш вмісту `APP_SHELL`
    (`tools/stamp-cache-version.mjs`, звіряється в `qa-check.mjs`), а стратегія
    для ассетів — stale-while-revalidate. Раніше був `cacheFirst` із вручну
    закріпленою версією: якщо її забували підняти, постійні гравці діставали
    свіжий `index.html` зі старими JS/CSS і залишалися так назавжди.
2. **Camera async race** — кожний camera request має token; застарілий stream зупиняється.
3. **Capture processing race** — фото, яке завершило обробку після виходу користувача, не може самовільно відкрити crop.
4. **Win timer race** — timer зберігається та скасовується при destroy/leave.
5. **Privacy cleanup** — вихід Home очищає crop/game DOM refs і revoke Object URL.
6. **Image validation** — allow-list, 20 MB, signature sniff, 60 MP guard.
7. **Memory** — Blob URL + нормалізація до 2048 px замість великих Base64 Data URL.
8. **CSP / headers** — meta CSP в `index.html` + блок `/games/dyvo-pazzle/*` у кореневому `_headers` сайту (Cloudflare читає `_headers` лише з кореня).
9. **Contrast** — темний текст на жовтих/світлих кнопках.
10. **Flow** — фото перед складністю.
11. **Crop** — drag + pinch zoom.
12. **Touch ergonomics** — lift above finger + magnetic snap.
13. **Adaptive difficulty** — різний hint/snap/wrong-placement behavior.
14. **Accessibility** — keyboard activation, focus states, reduced motion, safe areas.

## Свідомо не додано у 2.0

### Jigsaw tabs/holes

Не додавалися декоративні виступи/виїмки в цю ітерацію. Причина: правильний jigsaw потребує узгодженої геометрії сусідніх деталей і більших hit zones; проста CSS-маска створила б лише візуальну імітацію та могла б погіршити touch UX. Це краще робити окремою 2.1 після device QA базової механіки.

### Постійне збереження пазлів

Свідомо відсутнє через privacy-модель для спільних шкільних планшетів.

## Що ще обов'язково тестувати на реальних пристроях

Headless/static тести не відтворюють iOS permission UX, camera rotation, HEIC decoder та реальну точність touch. Перед широким використанням потрібен короткий matrix QA на реальному iPad та Android-планшеті.
