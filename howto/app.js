// Глобальні змінні
let topics = [];
let dataVersion = null;
const cardsGrid = document.getElementById('cardsGrid');
const searchInput = document.getElementById('searchInput');
const homeView = document.getElementById('homeView');
const detailView = document.getElementById('detailView');
const detailContent = document.getElementById('detailContent');
const noResults = document.getElementById('noResults');
const loadingState = document.getElementById('loadingState');

// Функція для безпечного відображення HTML (використовується селективно)
function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

// Функція для безпечної валідації URL (для iframe src)
function sanitizeURL(url) {
    try {
        const urlObj = new URL(url);
        // Дозволяємо тільки безпечні протоколи
        const allowedProtocols = ['https:', 'http:'];
        const allowedDomains = ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];

        if (!allowedProtocols.includes(urlObj.protocol)) {
            console.warn('⚠️ Небезпечний протокол:', urlObj.protocol);
            return 'about:blank';
        }

        // Перевірка домену для YouTube (опціонально)
        const hostname = urlObj.hostname;
        const isYouTube = allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));

        if (!isYouTube) {
            console.warn('⚠️ URL не є YouTube:', hostname);
            // Можна або заблокувати, або дозволити (залежить від потреб)
            // return 'about:blank'; // щоб заблокувати
        }

        // Повертаємо оригінальний URL без змін
        return url;
    } catch (e) {
        console.error('❌ Невалідний URL:', url);
        return 'about:blank';
    }
}

// Завантаження даних при старті
async function loadTopics() {
    try {
        // Розумний cache busting: тільки для розробки
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const cacheParam = isDev ? Date.now() : '1.0';

        const response = await fetch(`topics.json?v=${cacheParam}`);
        if (!response.ok) throw new Error('Не вдалося завантажити дані');

        const data = await response.json();

        // Підтримка старого та нового формату
        if (Array.isArray(data)) {
            topics = data;
        } else if (data.topics) {
            topics = data.topics;
            dataVersion = data.version;
            console.log('📚 Версія даних:', dataVersion, '| Оновлено:', data.lastUpdated);
        }

        loadingState.classList.add('hidden');
        cardsGrid.classList.remove('hidden');
        renderCards();
    } catch (error) {
        loadingState.innerHTML = `
            <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
            <p class="text-red-600 mt-4">Помилка завантаження: ${sanitizeHTML(error.message)}</p>
            <p class="text-gray-500 text-sm mt-2">Перевір, чи файл topics.json знаходиться в тій же папці.</p>
            <p class="text-gray-400 text-xs mt-4">💡 Для локального тестування використовуй веб-сервер:<br>
            <code class="bg-gray-100 px-2 py-1 rounded">python -m http.server 8000</code></p>
        `;
        console.error('❌ Помилка:', error);
    }
}

// Відображення карток
function renderCards(filterText = "") {
    cardsGrid.innerHTML = "";

    const filtered = topics.filter(t =>
        t.title.toLowerCase().includes(filterText.toLowerCase()) ||
        t.category.toLowerCase().includes(filterText.toLowerCase()) ||
        t.short.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
        cardsGrid.classList.add('hidden');
    } else {
        noResults.classList.add('hidden');
        cardsGrid.classList.remove('hidden');
    }

    filtered.forEach(topic => {
        const card = document.createElement('div');
        card.className = "topic-card";
        card.onclick = () => showDetail(topic.id);

        // Для контрольованого джерела санітизація не обов'язкова
        // але залишаємо для іконки (може містити некоректні класи)
        card.innerHTML = `
            <div class="flex items-center justify-between mb-5">
                <div class="w-14 h-14 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl">
                    <i class="fas ${topic.icon} text-2xl"></i>
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full">${topic.category}</span>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2 leading-tight">${topic.title}</h3>
            <p class="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">${topic.short}</p>
            <div class="flex items-center text-indigo-600 font-bold text-sm">
                Розповісти більше <i class="fas fa-arrow-right ml-2 text-xs"></i>
            </div>
        `;
        cardsGrid.appendChild(card);
    });
}

// Відображення детальної інформації
function showDetail(id) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Валідуємо URL для iframe (НЕ екрануємо спецсимволи!)
    const videoUrl = sanitizeURL(topic.video);

    detailContent.innerHTML = `
        <div class="mb-8">
            <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">${topic.title}</h1>
            <p class="text-indigo-500 font-medium">${topic.short}</p>
        </div>

        <div class="mb-10 aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
            <iframe 
                class="w-full h-full" 
                src="${videoUrl}" 
                frameborder="0" 
                allowfullscreen
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-presentation">
            </iframe>
        </div>

        <div class="prose prose-indigo max-w-none">
            <div class="text-gray-800 text-lg leading-relaxed">
                ${topic.text}
            </div>
        </div>

        <div class="mt-10 p-6 bg-indigo-600 text-white rounded-3xl shadow-lg relative overflow-hidden">
            <i class="fas fa-lightbulb absolute -right-4 -bottom-4 text-8xl opacity-10"></i>
            <h4 class="font-bold text-xl mb-2 italic">Маленька порада:</h4>
            <p class="text-indigo-100">Не бійся експериментувати! Головне — пам'ятай про Кошик, він завжди підстрахує.</p>
        </div>
    `;

    homeView.classList.add('hidden');
    detailView.classList.remove('hidden');
}

// Повернення на головну
function showHome() {
    detailView.classList.add('hidden');
    homeView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Обробка пошуку
searchInput.addEventListener('input', (e) => {
    showHome();
    renderCards(e.target.value);
});

// Запуск при завантаженні сторінки
loadTopics();