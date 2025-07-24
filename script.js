// script.js

(() => {
    if (typeof CATEGORIES === 'undefined') {
        console.error("Critical Error: CATEGORIES data not found. Ensure data.js is loaded before script.js.");
        document.body.innerHTML = "<p style='text-align:center; padding: 20px; font-size:1.2em; color:red;'>Помилка завантаження даних. Будь ласка, спробуйте оновити сторінку або зверніться до адміністратора.</p>";
        return;
    }

    const IMAGE_LAZY_LOAD_OPTIONS = {
        threshold: 0.1, 
        rootMargin: '0px 0px 50px 0px' 
    };
    let imageObserver; 

    const setupImageObserver = () => {
        const imagesToLazyLoad = document.querySelectorAll('img.service-card__image[data-src]');
        if (!("IntersectionObserver" in window)) {
            imagesToLazyLoad.forEach(img => loadImage(img));
            return;
        }
        if (imageObserver) {
            // imageObserver.disconnect(); // Розкоментуйте, якщо виникають проблеми з повторним додаванням
        }
        imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target); 
                }
            });
        }, IMAGE_LAZY_LOAD_OPTIONS);
        imagesToLazyLoad.forEach(img => imageObserver.observe(img));
    };

    const loadImage = (img) => {
        const src = img.getAttribute("data-src");
        if (src) {
            img.src = src;
            img.onload = () => {
                img.classList.remove("skeleton-loading");
                img.removeAttribute("data-src"); 
            };
            img.onerror = () => { 
                console.error(`Error loading image: ${src}`);
                img.classList.remove("skeleton-loading"); 
                img.removeAttribute("data-src");
            };
        }
    };

    const createServiceCard = (service) => {
        const card = document.createElement("div");
        card.className = "service-card";

        const imageContainer = document.createElement("div");
        imageContainer.className = "service-card__image-container";
        const image = document.createElement("img");
        image.className = "service-card__image skeleton-loading";
        image.alt = service.name;
        if (service.image) { // Перевірка наявності зображення
            image.setAttribute("data-src", service.image);
        }
        image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 
        imageContainer.appendChild(image);

        const content = document.createElement("div");
        content.className = "service-card__content";

        const title = document.createElement("h3");
        title.className = "service-card__title";
        title.textContent = service.name;
        content.appendChild(title);

        const description = document.createElement("p");
        description.className = "service-card__description";
        description.textContent = service.description;
        content.appendChild(description);

        if (service.tags && Array.isArray(service.tags) && service.tags.length > 0) {
            const tagsContainer = document.createElement("div");
            tagsContainer.className = "service-card__tags";
            service.tags.forEach(tagText => {
                const tagElement = document.createElement("span");
                tagElement.className = "service-card__tag";
                tagElement.textContent = tagText;
                tagElement.style.cursor = "pointer";
                tagElement.addEventListener("click", function(e) {
                    e.stopPropagation();
                    filterServicesByTag(tagText);
                });
                tagsContainer.appendChild(tagElement);
            });
            content.appendChild(tagsContainer);
        }

        const link = document.createElement("a");
        link.className = "service-card__link";
        link.href = service.link;
        // Якщо це PDF із offline-activities, робимо зелену кнопку з "Завантажити"
        if (service.link && service.link.endsWith('.pdf') && (service._category === "Безкомп'ютерні активності" || service._category === 'Безкомп\'ютерні активності')) {
            link.textContent = "Завантажити";
            link.style.backgroundColor = '#27ae60';
            link.style.color = '#fff';
            link.style.border = 'none';
            link.style.boxShadow = '0 2px 8px rgba(39, 174, 96, 0.15)';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        } else {
            link.textContent = "Відкрити";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
        content.appendChild(link);

        card.append(imageContainer, content);
        return card;
    };

    const renderServicesForCategory = (categoryId) => {
        const servicesContentArea = document.getElementById("services-content-area");
        if (!servicesContentArea) return;
        
        servicesContentArea.innerHTML = ''; 

        const category = CATEGORIES.find(cat => cat.id === categoryId);
        if (!category) {
            servicesContentArea.innerHTML = "<p>Категорію не знайдено.</p>";
            return;
        }

        const categoryHeader = document.createElement("h2");
        categoryHeader.className = "category-header-main";
        if (category.iconClass) {
            const iconElement = document.createElement("i");
            iconElement.className = category.iconClass; // Наприклад, "fas fa-laptop"
            iconElement.setAttribute("aria-hidden", "true"); // Для доступності
            categoryHeader.appendChild(iconElement);
            // Додаємо невеликий відступ після іконки
            categoryHeader.appendChild(document.createTextNode(" ")); 
        }
        categoryHeader.appendChild(document.createTextNode(category.name)); // Додаємо назву категорії

        servicesContentArea.appendChild(categoryHeader);

        const servicesGrid = document.createElement("div");
        servicesGrid.className = "services-grid";

        if (category.services && category.services.length > 0) {
            const fragment = document.createDocumentFragment();
            category.services.forEach((service) => {
                // Додаємо _category для коректної логіки кнопки
                fragment.appendChild(createServiceCard({...service, _category: category.name}));
            });
            servicesGrid.appendChild(fragment);
        } else {
            servicesGrid.innerHTML = "<p>У цій категорії наразі немає сервісів.</p>";
        }
        servicesContentArea.appendChild(servicesGrid);
        setupImageObserver();
    };

    // --- Фільтрація по тегу ---
    function filterServicesByTag(tag) {
        const servicesContentArea = document.getElementById("services-content-area");
        if (!servicesContentArea) return;
        servicesContentArea.innerHTML = '';

        // Збираємо всі сервіси з усіх категорій
        let allServices = [];
        CATEGORIES.forEach(cat => {
            if (Array.isArray(cat.services)) {
                allServices = allServices.concat(cat.services.map(service => ({...service, _category: cat.name})));
            }
        });
        // Фільтруємо сервіси за тегом
        const filtered = allServices.filter(service => Array.isArray(service.tags) && service.tags.includes(tag));

        // Додаємо заголовок
        const header = document.createElement("h2");
        header.className = "category-header-main";
        header.textContent = `Тег: ${tag}`;
        servicesContentArea.appendChild(header);

        const servicesGrid = document.createElement("div");
        servicesGrid.className = "services-grid";
        if (filtered.length > 0) {
            filtered.forEach(service => {
                servicesGrid.appendChild(createServiceCard(service));
            });
        } else {
            servicesGrid.innerHTML = `<p>Немає карток з тегом "${tag}".</p>`;
        }
        servicesContentArea.appendChild(servicesGrid);
        setupImageObserver();
    }

    const createSidebarNavigation = () => {
        const sidebarNavContainer = document.getElementById("sidebar-categories-nav");
        if (!sidebarNavContainer) return;

        sidebarNavContainer.innerHTML = ''; 
        const navList = document.createElement("ul");
        navList.className = "sidebar-nav__list";

        CATEGORIES.forEach((category) => {
            const listItem = document.createElement("li");
            listItem.className = "sidebar-nav__item";
            const link = document.createElement("a");
            link.href = `#${category.id}`; 
            link.className = "sidebar-nav__link";
            link.setAttribute("data-category-id", category.id);

            if (category.iconClass) {
                const icon = document.createElement("i");
                icon.className = category.iconClass;
                icon.setAttribute("aria-hidden", "true"); // Для доступності
                link.appendChild(icon);
                link.appendChild(document.createTextNode(" " + category.name));
            } else {
                link.textContent = category.name;
            }

            link.addEventListener("click", (event) => {
                event.preventDefault();
                const currentCategoryId = category.id;
                renderServicesForCategory(currentCategoryId);

                document.querySelectorAll('.sidebar-nav__link.active').forEach(activeLink => {
                    activeLink.classList.remove('active');
                });
                link.classList.add('active');
                
                if (history.pushState) {
                    history.pushState({ categoryId: currentCategoryId }, null, `#${currentCategoryId}`);
                } else {
                    window.location.hash = currentCategoryId;
                }
            });
            listItem.appendChild(link);
            navList.appendChild(listItem);
        });
        sidebarNavContainer.appendChild(navList);
    };
    
    const handleNavigation = () => {
        let categoryToDisplay = CATEGORIES[0].id; 
        const hashId = window.location.hash.substring(1);

        if (hashId) {
            const categoryExists = CATEGORIES.find(cat => cat.id === hashId);
            if (categoryExists) {
                categoryToDisplay = hashId;
            } else {
                // Якщо хеш не валідний, встановлюємо хеш першої категорії
                if (history.replaceState) {
                    history.replaceState({ categoryId: CATEGORIES[0].id }, null, `#${CATEGORIES[0].id}`);
                } else {
                    window.location.hash = CATEGORIES[0].id;
                }
            }
        } else if (CATEGORIES.length > 0) {
            // Якщо хешу немає, встановлюємо для першої категорії
            if (history.replaceState) {
                 history.replaceState({ categoryId: CATEGORIES[0].id }, null, `#${CATEGORIES[0].id}`);
            } else {
                 window.location.hash = CATEGORIES[0].id;
            }
        }
        
        renderServicesForCategory(categoryToDisplay);
        
        document.querySelectorAll('.sidebar-nav__link.active').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-nav__link[data-category-id="${categoryToDisplay}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    };

    const initializeApp = () => {
        const sidebarNavContainer = document.getElementById("sidebar-categories-nav");
        const servicesContentArea = document.getElementById("services-content-area");
        const mobileNavToggleButton = document.querySelector(".mobile-nav-toggle");

        if (!sidebarNavContainer || !servicesContentArea) {
            console.error("Critical application containers not found.");
            document.body.innerHTML = "<p style='text-align:center; padding:20px; font-size:1.2em; color:red;'>Помилка завантаження компонентів сторінки.</p>";
            return;
        }
        if (typeof CATEGORIES === 'undefined' || CATEGORIES.length === 0) {
            console.error("CATEGORIES data not found or empty.");
            servicesContentArea.innerHTML = "<p style='text-align:center; padding:20px; font-size:1.2em; color:red;'>Дані категорій не завантажено.</p>";
            return;
        }

        createSidebarNavigation();
        handleNavigation(); // Обробка початкового стану та хешу

        if (mobileNavToggleButton && sidebarNavContainer) {
            mobileNavToggleButton.addEventListener("click", () => {
                const isVisible = sidebarNavContainer.getAttribute("data-visible") === "true";
                sidebarNavContainer.setAttribute("data-visible", !isVisible ? "true" : "false");
                mobileNavToggleButton.setAttribute("aria-expanded", !isVisible ? "true" : "false");
                document.body.classList.toggle("mobile-nav-active", !isVisible);
            });

            sidebarNavContainer.addEventListener('click', (e) => {
                if (e.target.closest('.sidebar-nav__link')) {
                    if (window.innerWidth <= 768 && sidebarNavContainer.getAttribute("data-visible") === "true") { 
                        sidebarNavContainer.setAttribute("data-visible", "false");
                        mobileNavToggleButton.setAttribute("aria-expanded", "false");
                        document.body.classList.remove("mobile-nav-active");
                    }
                }
            });
        }

        window.addEventListener('popstate', (event) => {
             // Якщо є стан в історії (для pushState), використовуємо його, інакше - звичайний hashchange
            if (event.state && event.state.categoryId) {
                handleNavigation();
            } else if (window.location.hash) { // Для сумісності з hashchange
                 handleNavigation();
            }
        });
         // Для першого завантаження, якщо немає pushState, але є hash
        if (!history.pushState && window.location.hash) {
            window.addEventListener('hashchange', handleNavigation);
        } else if (!history.pushState && !window.location.hash && CATEGORIES.length > 0) {
            // Якщо немає ні pushState, ні hash, емулюємо hashchange для першої категорії
            window.location.hash = `#${CATEGORIES[0].id}`; // Це викличе hashchange, якщо слухач вже є
        }
    };

    // Функціонал для помічника (Пана Артема)
    const initializeAssistant = () => {
        const toggleBtn = document.getElementById('assistant-toggle');
        const closeBtn = document.getElementById('assistant-close');
        const assistantBox = document.getElementById('assistant-box');

        // Визначаємо чи має бути асистент відкритий в сесії
        const assistantShown = sessionStorage.getItem('assistantShown');

        // Перевіряємо чи елементи існують
        if (toggleBtn && closeBtn && assistantBox) {
            // Автоматично показуємо новим відвідувачам
            if (!assistantShown) {
                // Затримуємо показ на 2 секунди, щоб не виникав одразу при завантаженні
                setTimeout(() => {
                    assistantBox.classList.add('active');
                    sessionStorage.setItem('assistantShown', 'true');
                }, 2000);
            }

            // Показ асистента при натисканні на кнопку
            toggleBtn.addEventListener('click', () => {
                assistantBox.classList.toggle('active');
            });

            // Закриття асистента при натисканні на хрестик
            closeBtn.addEventListener('click', () => {
                assistantBox.classList.remove('active');
            });

            // Приховуємо асистента при кліку поза його межами
            document.addEventListener('click', (e) => {
                if (assistantBox.classList.contains('active') && 
                    !assistantBox.contains(e.target) && 
                    e.target !== toggleBtn && 
                    !toggleBtn.contains(e.target)) {
                    assistantBox.classList.remove('active');
                }
            });
        } else {
            console.error('Assistant elements not found in DOM');
        }
    };

    // Додаємо ініціалізацію асистента до загальної ініціалізації
    const init = () => {
        initializeApp();
        initializeAssistant();
    };

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();