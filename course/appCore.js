import { renderSidebar, renderWelcomeScreen, renderLesson } from './renderers.js';
import { loadCourseData } from './contentLoader.js';
import { updateProgress } from './utils.js';

export default class AppCore {
    constructor() {
        this.courseData = null;
        this.currentLessonId = null;
    }

    init() {
        this.initializeTheme();
        this.loadCourseData();
        this.setupNavigation();
    }

    initializeTheme() {
        // 1. Завантаження збереженої теми
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // 2. Налаштування кнопки
        const themeToggle = document.getElementById('theme-toggle');
        
        if (themeToggle) {
            // Клонуємо кнопку, щоб видалити старі слухачі подій (prevent multiple bindings)
            const newToggle = themeToggle.cloneNode(true);
            themeToggle.parentNode.replaceChild(newToggle, themeToggle);

            newToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
    }

    async loadCourseData() {
        try {
            this.courseData = await loadCourseData();
            this.renderSidebar();
            this.renderWelcomeScreen();
        } catch (error) {
            console.error('Failed to load course data:', error);
            document.querySelector('main').innerHTML = '<p class="error">Помилка завантаження курсу. Перевірте консоль.</p>';
        }
    }

    renderSidebar() {
        if (!this.courseData) return;
        renderSidebar(this.courseData, (lessonId) => this.navigateToLesson(lessonId));
    }

    renderWelcomeScreen() {
        renderWelcomeScreen(this.courseData);
    }

    navigateToLesson(lessonId) {
        this.currentLessonId = lessonId;
        
        // Знаходимо урок в структурі
        let foundLesson = null;
        this.courseData.modules.some(module => {
            const lesson = module.lessons.find(l => l.id === lessonId);
            if (lesson) {
                foundLesson = lesson;
                return true;
            }
            return false;
        });

        if (foundLesson) {
            renderLesson(foundLesson, this.courseData);
            updateProgress(lessonId);
            
            // Оновлення активного стану в сайдбарі
            document.querySelectorAll('.lesson-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.id === lessonId) {
                    link.classList.add('active');
                }
            });

            // Мобільна адаптація: закрити сайдбар при виборі уроку
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar')?.classList.remove('active');
            }
        }
    }

    setupNavigation() {
        // Делегування подій для навігації
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-button')) {
                const lessonId = e.target.dataset.id;
                if (lessonId) {
                    this.navigateToLesson(lessonId);
                }
            }
        });
        
        // Тогл сайдбару для мобільних
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle && sidebar) {
             menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }
}
