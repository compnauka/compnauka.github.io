/* =========================================================================
   site-shell.js — спільний хедер + футер для сервісів itnauka.org
   --------------------------------------------------------------------------
   Підключення в будь-якому сервісі (два рядки в <head> або перед </body>):
       <script src="/_shell/site-shell.js" defer></script>
   site-shell.css підвантажується автоматично.

   Налаштування через data-атрибути на тезі <script> (усі необов'язкові):
       data-back   — куди веде кнопка «Назад» (типово "/")
       data-brand  — підпис бренду (типово "Комп'ютерна наука")
       data-title  — назва сервісу (показується як хлібна крихта: Бренд › Назва)
       data-no-footer — наявність атрибута вимикає вставку футера (напр. для повноекранних ігор)
   ========================================================================= */
(function () {
    'use strict';

    var script = document.currentScript;
    var cfg = {
        back: (script && script.dataset.back) || '/',
        brand: (script && script.dataset.brand) || "Комп'ютерна наука",
        title: (script && script.dataset.title) || '',
        noFooter: !!(script && script.hasAttribute('data-no-footer'))
    };

    // Базовий шлях до папки _shell (щоб коректно знайти CSS незалежно від глибини).
    var base = '/_shell/';
    if (script && script.src) {
        base = script.src.replace(/site-shell\.js.*$/, '');
    }

    // --- Підключити стилі shell-а (один раз) ---
    if (!document.querySelector('link[data-ss-css]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = base + 'site-shell.css';
        link.setAttribute('data-ss-css', '');
        document.head.appendChild(link);
    }

    // --- Font Awesome (якщо сервіс його не підключив) ---
    var hasFA = !!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]');
    if (!hasFA) {
        var fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
        document.head.appendChild(fa);
    }

    var SOCIALS = [
        { href: 'https://www.facebook.com/panaptem', icon: 'fa-facebook-f', label: 'Facebook' },
        { href: 'https://instagram.com/pan_aptem', icon: 'fa-instagram', label: 'Instagram' },
        { href: 'https://www.tiktok.com/@pan_aptem', icon: 'fa-tiktok', label: 'TikTok' },
        { href: 'https://www.linkedin.com/in/artemkysliakov/', icon: 'fa-linkedin-in', label: 'LinkedIn' }
    ];

    // Екранування значень конфігу (data-back/brand/title) перед вставкою в innerHTML
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function buildHeader() {
        var header = document.createElement('header');
        header.className = 'ss-header';
        header.innerHTML =
            '<div class="ss-header-left">' +
                '<a class="ss-back" href="' + esc(cfg.back) + '" aria-label="На головну">' +
                    '<i class="fas fa-arrow-left" aria-hidden="true"></i><span>Назад</span>' +
                '</a>' +
                '<a class="ss-brand" href="/" aria-label="Комп\'ютерна наука — на головну">' +
                    '<i class="fas fa-laptop-code ss-brand-icon" aria-hidden="true"></i>' +
                    '<span class="ss-brand-text">' + esc(cfg.brand) + '</span>' +
                '</a>' +
                (cfg.title
                    ? '<span class="ss-sep" aria-hidden="true">›</span>' +
                      '<span class="ss-title">' + esc(cfg.title) + '</span>'
                    : '') +
            '</div>' +
            '<button class="ss-theme-toggle" type="button" aria-label="Змінити тему">' +
                '<i class="fas fa-moon" aria-hidden="true"></i>' +
            '</button>';
        return header;
    }

    function buildFooter() {
        var footer = document.createElement('footer');
        footer.className = 'ss-footer';
        var socials = SOCIALS.map(function (s) {
            return '<a class="ss-social" href="' + s.href + '" target="_blank" rel="noopener" ' +
                'aria-label="' + s.label + '"><i class="fab ' + s.icon + '" aria-hidden="true"></i></a>';
        }).join('');
        var year = new Date().getFullYear();
        footer.innerHTML =
            '<div class="ss-footer-socials">' + socials + '</div>' +
            '<p class="ss-footer-copy">&copy; ' + year +
                ' Комп\'ютерна наука з Паном Артемом. Всі права захищено.</p>';
        return footer;
    }

    function initTheme(toggleBtn) {
        var icon = toggleBtn.querySelector('i');
        function apply(dark) {
            document.body.classList.toggle('dark-mode', dark);
            if (icon) {
                icon.classList.toggle('fa-sun', dark);
                icon.classList.toggle('fa-moon', !dark);
            }
        }
        apply(localStorage.getItem('theme') === 'dark');
        toggleBtn.addEventListener('click', function () {
            var dark = !document.body.classList.contains('dark-mode');
            apply(dark);
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        });
    }

    function mount() {
        if (document.querySelector('.ss-header')) return; // вже змонтовано
        var header = buildHeader();
        document.body.insertBefore(header, document.body.firstChild);
        if (!cfg.noFooter) {
            document.body.appendChild(buildFooter());
        }
        initTheme(header.querySelector('.ss-theme-toggle'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
