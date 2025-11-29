// --- APP LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const sidebarNav = document.getElementById("sidebarNav");
    const contentArea = document.getElementById("contentArea");
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("mobileOverlay");
    const assistantToggle = document.getElementById("assistantToggle");
    const assistantBox = document.getElementById("assistantBox");
    const assistantClose = document.getElementById("assistantClose");
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = themeToggle.querySelector("i");
    
    // Track active category to return to it after clearing filter
    let currentActiveCategory = CATEGORIES[0].id;

    // --- THEME LOGIC ---
    // Check for saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeIcon.classList.replace("fa-moon", "fa-sun");
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        
        // Switch Icon
        if (isDark) {
            themeIcon.classList.replace("fa-moon", "fa-sun");
            localStorage.setItem("theme", "dark");
        } else {
            themeIcon.classList.replace("fa-sun", "fa-moon");
            localStorage.setItem("theme", "light");
        }
    });

    // --- NAVIGATION RENDERING ---
    const renderSidebar = () => {
        const ul = document.createElement("ul");
        CATEGORIES.forEach(cat => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${cat.id}`;
            a.className = "nav-link";
            a.dataset.id = cat.id;
            // Add style to icon directly
            a.innerHTML = `<i class="${cat.iconClass}" style="color: ${cat.color}"></i> ${cat.name}`;
            
            a.addEventListener("click", (e) => {
                e.preventDefault();
                setActiveCategory(cat.id);
                // Close mobile menu if open
                closeMobileMenu();
            });

            li.appendChild(a);
            ul.appendChild(li);
        });
        sidebarNav.innerHTML = '';
        sidebarNav.appendChild(ul);
    };

    // --- CONTENT RENDERING ---
    const renderCategory = (categoryId) => {
        const category = CATEGORIES.find(c => c.id === categoryId);
        if (!category) return;

        // Create Header
        const header = document.createElement("div");
        header.className = "category-header";
        header.innerHTML = `<i class="${category.iconClass}" style="color: ${category.color}"></i> ${category.name}`;

        // Create Grid
        const grid = document.createElement("div");
        grid.className = "services-grid";

        if (category.services.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary);">Сервіси в цій категорії скоро з\'являться.</p>';
        } else {
            category.services.forEach(service => createServiceCard(service, grid));
        }

        // Render to DOM with fade effect
        updateContentArea(header, grid);
    };

    const createServiceCard = (service, container) => {
        const card = document.createElement("div");
        card.className = "card";
        
        // Image Handling
        const imgWrapper = document.createElement("div");
        imgWrapper.className = "card-img-wrapper skeleton"; // Add skeleton class initially
        const img = document.createElement("img");
        img.className = "card-img";
        img.alt = service.name;
        
        // Lazy load simulation / Loading handler
        const tempImg = new Image();
        tempImg.src = service.image;
        tempImg.onload = () => {
            img.src = service.image;
            imgWrapper.classList.remove("skeleton");
        };
        tempImg.onerror = () => {
            // Placeholder if image missing
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23e2e8f0"><rect width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%2394a3b8">No Image</text></svg>';
            imgWrapper.classList.remove("skeleton");
        };

        imgWrapper.appendChild(img);

        // Content
        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h3");
        title.className = "card-title";
        title.textContent = service.name;

        const desc = document.createElement("p");
        desc.className = "card-desc";
        desc.textContent = service.description;

        body.appendChild(title);
        body.appendChild(desc);

        // Tags
        if (service.tags && service.tags.length > 0) {
            const tagsDiv = document.createElement("div");
            tagsDiv.className = "card-tags";
            service.tags.forEach(tag => {
                const span = document.createElement("span");
                span.className = "tag";
                span.textContent = tag;
                span.onclick = (e) => {
                    e.stopPropagation(); // prevent card click if we add that later
                    filterByTag(tag);
                };
                tagsDiv.appendChild(span);
            });
            body.appendChild(tagsDiv);
        }

        // Button
        const btn = document.createElement("a");
        btn.href = service.link;
        btn.target = "_blank";
        
        // Special styling for PDFs
        if (service.link && service.link.endsWith('.pdf')) {
            btn.className = "btn btn-success";
            btn.innerHTML = '<i class="fas fa-file-download" style="margin-right:8px;"></i> Завантажити';
        } else {
            btn.className = "btn btn-primary";
            btn.innerHTML = 'Відкрити';
        }
        
        body.appendChild(btn);

        card.appendChild(imgWrapper);
        card.appendChild(body);
        container.appendChild(card);
    };

    const filterByTag = (tagName) => {
         // Close mobile menu if needed
         closeMobileMenu();

        // Flatten all services
        let allServices = [];
        CATEGORIES.forEach(cat => {
            allServices = [...allServices, ...cat.services];
        });

        const filtered = allServices.filter(s => s.tags && s.tags.includes(tagName));
        
        // Header with Badge Chip
        const header = document.createElement("div");
        header.className = "category-header";
        
        const chip = document.createElement("div");
        chip.className = "filter-chip";
        chip.innerHTML = `<span>${tagName}</span>`;
        
        const closeBtn = document.createElement("div");
        closeBtn.className = "filter-chip-close";
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.title = "Скинути фільтр";
        closeBtn.onclick = () => {
            // Reset to previous category
            setActiveCategory(currentActiveCategory);
        };
        
        chip.appendChild(closeBtn);
        header.appendChild(chip);

        const grid = document.createElement("div");
        grid.className = "services-grid";

        if (filtered.length === 0) {
            grid.innerHTML = '<p>Нічого не знайдено.</p>';
        } else {
            filtered.forEach(service => createServiceCard(service, grid));
        }
        
        updateContentArea(header, grid);

         // Update Active State in Sidebar (remove all active)
         document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    };

    const updateContentArea = (header, grid) => {
        contentArea.style.opacity = '0';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'auto' });
        
        setTimeout(() => {
            contentArea.innerHTML = '';
            contentArea.appendChild(header);
            contentArea.appendChild(grid);
            contentArea.style.opacity = '1';
        }, 200);
    };

    const setActiveCategory = (id) => {
        // Update tracker
        currentActiveCategory = id;
        
        // Update Sidebar UI
        document.querySelectorAll(".nav-link").forEach(l => {
            l.classList.remove("active");
            if (l.dataset.id === id) l.classList.add("active");
        });

        // Render Content
        renderCategory(id);

        // Update URL Hash
        if(history.pushState) {
            history.pushState(null, null, `#${id}`);
        } else {
            window.location.hash = id;
        }
    };

    // --- MOBILE MENU LOGIC ---
    const openMobileMenu = () => {
        sidebar.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent scrolling
    };

    const closeMobileMenu = () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    };

    menuToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("active")) closeMobileMenu();
        else openMobileMenu();
    });

    overlay.addEventListener("click", closeMobileMenu);

    // --- ASSISTANT LOGIC ---
    assistantToggle.addEventListener("click", () => {
        assistantBox.classList.toggle("open");
    });

    assistantClose.addEventListener("click", () => {
        assistantBox.classList.remove("open");
    });

    // Using localStorage instead of sessionStorage for persistent memory across sessions
    const ASST_KEY = "assistantShown_v2";
    if (!localStorage.getItem(ASST_KEY)) {
        setTimeout(() => {
            assistantBox.classList.add("open");
            localStorage.setItem(ASST_KEY, "true");
        }, 2500);
    }

    // --- INITIALIZATION ---
    renderSidebar();
    
    // Check hash or default to first category
    const hash = window.location.hash.substring(1);
    if (hash && CATEGORIES.some(c => c.id === hash)) {
        setActiveCategory(hash);
    } else if (CATEGORIES.length > 0) {
        setActiveCategory(CATEGORIES[0].id);
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const h = window.location.hash.substring(1);
        if (h && CATEGORIES.some(c => c.id === h)) {
            setActiveCategory(h);
        }
    });
});
