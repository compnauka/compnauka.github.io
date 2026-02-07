class App {
    constructor() {
        this.state = {
            currentLessonId: null,
            lessons: [],
            progress: {},
            theme: localStorage.getItem('theme') || 'light' // Завантажуємо збережену тему
        };
        
        // Ініціалізуємо модулі
        this.contentLoader = new ContentLoader();
        this.renderer = new Renderer();
        this.quiz = new Quiz();
    }

    async init() {
        console.log('App initialization started...');
        
        try {
            // 1. Ініціалізація теми (викликаємо першою, щоб уникнути "миготіння")
            this.initTheme();

            // 2. Завантаження структури курсу
            await this.loadCourseStructure();

            // 3. Відновлення прогресу
            this.loadProgress();

            // 4. Обробники подій навігації
            this.initNavigation();

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.renderer.renderError('Не вдалося завантажити курс. Перевірте консоль.');
        }
    }

    initTheme() {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const icon = themeToggleBtn.querySelector('i');
        
        // Функція застосування теми
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Оновлення іконки
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
            this.state.theme = theme;
        };

        // Застосувати початкову тему
        applyTheme(this.state.theme);

        // Обробник кліку
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    async loadCourseStructure() {
        // Припускаємо, що data.js завантажив window.courseData або завантажуємо JSON
        // Якщо використовується contentLoader:
        const structure = await this.contentLoader.getStructure();
        this.state.lessons = structure.lessons;
        this.renderer.renderSidebar(this.state.lessons);
        
        // Завантажити перший урок або останній активний
        if (this.state.lessons.length > 0) {
            this.loadLesson(this.state.lessons[0].id);
        }
    }

    async loadLesson(lessonId) {
        this.renderer.showLoading();
        try {
            const lessonData = await this.contentLoader.getLesson(lessonId);
            this.state.currentLessonId = lessonId;
            this.renderer.renderLesson(lessonData);
            
            // Якщо в уроці є тест, ініціалізуємо його
            if (lessonData.quiz) {
                this.quiz.init(lessonData.quiz, (score) => this.onQuizComplete(lessonId, score));
            }
            
            // Оновлюємо активний стан в меню
            this.renderer.updateActiveSidebarItem(lessonId);
        } catch (error) {
            console.error(`Error loading lesson ${lessonId}:`, error);
            this.renderer.renderError('Помилка завантаження уроку.');
        }
    }

    onQuizComplete(lessonId, score) {
        this.state.progress[lessonId] = { completed: true, score: score };
        this.saveProgress();
        this.renderer.showNotification(`Урок пройдено! Результат: ${score}%`);
        this.renderer.markLessonComplete(lessonId);
    }

    saveProgress() {
        localStorage.setItem('courseProgress', JSON.stringify(this.state.progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('courseProgress');
        if (saved) {
            this.state.progress = JSON.parse(saved);
            // Візуально позначити пройдені уроки
            Object.keys(this.state.progress).forEach(id => {
                if (this.state.progress[id].completed) {
                    this.renderer.markLessonComplete(id);
                }
            });
        }
    }

    initNavigation() {
        // Делегування подій для сайдбару
        document.querySelector('.sidebar').addEventListener('click', (e) => {
            const link = e.target.closest('.lesson-link');
            if (link) {
                e.preventDefault();
                const id = link.dataset.id;
                this.loadLesson(id);
                
                // На мобільних закриваємо меню після кліку
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('active');
                }
            }
        });

        // Мобільне меню
        const menuBtn = document.getElementById('menu-toggle');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }
    }
}
