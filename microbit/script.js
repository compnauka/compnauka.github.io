document.addEventListener('DOMContentLoaded', function() {

    /**
     * Ініціалізація всіх функцій сайту.
     */
    function init() {
        initMobileMenu();
        initScrollAnimations();
        initHeaderScroll();
        initFAQ();
    }

    /**
     * Ініціалізує мобільне меню (бургер).
     */
    function initMobileMenu() {
        const toggle = document.querySelector('.mobile-toggle');
        const navLinks = document.querySelector('.nav-links');

        toggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-active');
            });
        });
    }

    /**
     * Анімація появи елементів при прокрутці.
     */
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.card').forEach(el => observer.observe(el));
    }

    /**
     * Зміна стилю заголовка при прокрутці.
     */
    function initHeaderScroll() {
        // Саме локальна навігація micro:bit, а не спільний хедер сайту (.ss-header)
        const header = document.querySelector('header:not(.ss-header)');
        if (!header) return;
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }


    /**
     * Ініціалізація FAQ секції.
     */
    function initFAQ() {
        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', !expanded);
                btn.parentElement.classList.toggle('open');
            });
        });
    }

    // Запуск
    init();
});