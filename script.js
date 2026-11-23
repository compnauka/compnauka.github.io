// --- ПРИБИРАННЯ ЗАСТАРІЛИХ COOKIE GOOGLE ANALYTICS ---
// GA4 і Plausible прибрані з сайту, але кукі _ga / _ga_* лишилися в браузерах
// постійних відвідувачів і живуть до двох років. Вони вже мертві — читати їх
// нема кому, — та для дитячого сайту зайвих слідів Google краще не лишати.
// Кукі виставлені на весь домен, тож достатньо одного спрацювання на будь-якій
// сторінці. Той самий блок продубльовано в _shell/site-shell.js, бо спільного
// скрипта на всіх сторінках сайту немає.
(function dropLegacyAnalyticsCookies() {
    var stale = document.cookie.split(';')
        .map(function (pair) { return pair.split('=')[0].trim(); })
        .filter(function (name) { return /^_ga(_|$)/.test(name) || name === '_gid' || /^_gat/.test(name); });
    if (!stale.length) return;

    // GA пише кукі на батьківський домен, тому пробуємо всі варіанти Domain:
    // без атрибута, поточний хост і кожен його батьківський домен із крапкою.
    var host = location.hostname;
    var parts = host.split('.');
    var domains = [null, host];
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));

    stale.forEach(function (name) {
        domains.forEach(function (domain) {
            document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '');
        });
    });
})();

// --- QR MODAL ---
function openQrModal(title, url) {
    const overlay = document.getElementById("qrModalOverlay");
    const canvas = document.getElementById("qrModalCanvas");
    const titleEl = document.getElementById("qrModalTitle");
    const urlEl = document.getElementById("qrModalUrl");
    const preview = document.getElementById("qrModalPreview");

    document.getElementById("qrGeneratorForm").hidden = true;
    overlay.classList.remove("is-generator");
    preview.hidden = true;
    document.getElementById("qrModalHint").hidden = true;

    canvas.innerHTML = "";
    titleEl.textContent = title;
    urlEl.textContent = url;
    urlEl.hidden = false;

    new QRCode(canvas, {
        text: url,
        width: 512,
        height: 512,
        colorDark: "#1e293b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });

    canvas.dataset.value = url;
    preview.hidden = false;
    document.getElementById("qrModalHint").hidden = false;
    document.getElementById("qrModalHint").textContent = "Натисніть на QR-код, щоб збільшити";
    document.body.classList.add("qr-modal-open");
    overlay.classList.add("open");
}

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
    const selectedGrades = new Map();
    const categoryViews = new Map();
    const isGradeTag = tag => tag === "Дошкілля" || /^\d+\s*[-–]\s*\d+\s+класи$/.test(tag);

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
    const applyGradeFilter = (view, grade) => {
        const animate = view.grid.isConnected && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const previousPositions = new Map();
        if (animate) {
            view.items.forEach(({ element }) => {
                element.getAnimations().forEach(animation => animation.cancel());
                if (!element.hidden) previousPositions.set(element, element.getBoundingClientRect());
            });
        }
        view.items.forEach(({ service, element }) => {
            element.hidden = Boolean(grade && !service.tags?.includes(grade));
        });
        view.header.querySelectorAll('.grade-filter').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.grade === grade));
        });
        if (animate) {
            view.items.forEach(({ element }) => {
                if (element.hidden) return;
                const before = previousPositions.get(element);
                const after = element.getBoundingClientRect();
                let x = before ? before.left - after.left : 0;
                let y = before ? before.top - after.top : 6;
                // Cards from lower rows should appear here, not travel through an empty viewport.
                if (Math.abs(x) > 80 || Math.abs(y) > 80) { x = 0; y = 6; }
                if (!before || x || y) {
                    element.animate([
                        { transform: `translate(${x}px, ${y}px)`, opacity: before ? 1 : .85 },
                        { transform: 'translate(0, 0)', opacity: 1 }
                    ], { duration: 200, easing: 'ease-out' });
                }
            });
        }
    };

    const renderCategory = (categoryId) => {
        const category = CATEGORIES.find(c => c.id === categoryId);
        if (!category) return;
        const selectedGrade = selectedGrades.get(categoryId) || "";
        const existingView = categoryViews.get(categoryId);
        if (existingView) {
            applyGradeFilter(existingView, selectedGrade);
            updateContentArea(existingView.header, existingView.grid);
            return;
        }

        // Create Header
        const header = document.createElement("div");
        header.className = "category-header";
        const heading = document.createElement("h2");
        heading.className = "category-title";
        heading.innerHTML = `<i class="${category.iconClass}" style="color: ${category.color}"></i> ${category.name}`;
        header.appendChild(heading);

        const grades = [...new Set(category.services.flatMap(service => service.tags || []).filter(isGradeTag))]
            .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0) || a.localeCompare(b, "uk"));
        if (grades.length) {
            const filters = document.createElement("div");
            filters.className = "grade-filters";
            filters.setAttribute("role", "group");
            filters.setAttribute("aria-label", "Фільтр за класами");
            ["", ...grades].forEach(grade => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "grade-filter";
                button.dataset.grade = grade;
                button.textContent = grade || "Усі класи";
                button.setAttribute("aria-pressed", String(grade === selectedGrade));
                button.addEventListener("click", () => {
                    if ((selectedGrades.get(categoryId) || "") === grade) return;
                    selectedGrades.set(categoryId, grade);
                    renderCategory(categoryId);
                });
                filters.appendChild(button);
            });
            header.appendChild(filters);
        }

        // Create Grid
        const grid = document.createElement("div");
        grid.className = "services-grid";

        const items = [];
        if (category.services.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary);">Сервіси в цій категорії скоро з\'являться.</p>';
        } else {
            category.services.forEach(service => {
                items.push({ service, element: createServiceCard(service, grid) });
            });
        }

        const view = { header, grid, items };
        categoryViews.set(categoryId, view);
        applyGradeFilter(view, selectedGrade);
        updateContentArea(header, grid);
    };

    const createServiceCard = (service, container) => {
        const card = document.createElement("div");
        card.className = "card";
        const isSupportCard = service.secondLink === "support.html";
        if (isSupportCard) {
            card.classList.add("support-card");
        }
        
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
        // Buttons
        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";
        actions.style.flexWrap = "nowrap";
        actions.style.alignItems = "center";

        const btn = document.createElement("a");
        btn.href = service.link;
        btn.target = service.linkTarget || "_blank";
        if (btn.target === "_blank") btn.rel = "noopener noreferrer";
        btn.style.flex = "1";
        btn.style.whiteSpace = "nowrap";

        // Special styling for PDFs
        if (service.link && service.link.endsWith('.pdf') && !service.primaryLabel) {
            btn.className = "btn btn-success";
            btn.innerHTML = '<i class="fas fa-file-download" style="margin-right:8px;"></i> Завантажити';
        } else {
            btn.className = "btn btn-primary";
            btn.innerHTML = service.primaryLabel || 'Відкрити';
        }
        actions.appendChild(btn);

        // Copy link & QR buttons (icon-only, не для картки підтримки)
        if (!isSupportCard) {
            const fullUrl = new URL(service.link, window.location.href).href;

            const copyBtn = document.createElement("button");
            copyBtn.className = "btn btn-icon";
            copyBtn.title = "Скопіювати посилання";
            copyBtn.setAttribute("aria-label", "Скопіювати посилання");
            copyBtn.innerHTML = '<i class="fas fa-link"></i>';
            copyBtn.addEventListener("click", (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(fullUrl).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.classList.add("btn-icon--copied");
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-link"></i>';
                        copyBtn.classList.remove("btn-icon--copied");
                    }, 1500);
                });
            });
            actions.appendChild(copyBtn);

            const qrBtn = document.createElement("button");
            qrBtn.className = "btn btn-icon";
            qrBtn.title = "Показати QR-код";
            qrBtn.setAttribute("aria-label", "Показати QR-код");
            qrBtn.innerHTML = '<i class="fas fa-qrcode"></i>';
            qrBtn.addEventListener("click", (e) => {
                e.preventDefault();
                openQrModal(service.name, fullUrl);
            });
            actions.appendChild(qrBtn);
        }

        if (service.secondLink) {
            const secondBtn = document.createElement("a");
            secondBtn.href = service.secondLink;
            secondBtn.target = service.secondLinkTarget || "_self";
            if (secondBtn.target === "_blank") secondBtn.rel = "noopener noreferrer";
            secondBtn.className = "btn btn-success";
            secondBtn.style.flex = "1";
            secondBtn.style.whiteSpace = "nowrap";
            secondBtn.textContent = service.secondLabel || "Докладніше";
            actions.appendChild(secondBtn);
        }

        body.appendChild(actions);

        card.appendChild(imgWrapper);
        card.appendChild(body);
        container.appendChild(card);
        return card;
    };

    const filterByTag = (tagName) => {
        if (isGradeTag(tagName)) {
            selectedGrades.set(currentActiveCategory, tagName);
            setActiveCategory(currentActiveCategory);
            return;
        }
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
        // Grade filters reuse the mounted cards and leave the controls and scroll position intact.
        if (contentArea.firstElementChild === header) return;
        contentArea.replaceChildren(header, grid);
        window.scrollTo({ top: 0, behavior: 'auto' });
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

    // --- QR MODAL CLOSE ---
    const qrOverlay = document.getElementById("qrModalOverlay");
    const qrForm = document.getElementById("qrGeneratorForm");
    const qrInput = document.getElementById("qrGeneratorInput");
    const qrPreview = document.getElementById("qrModalPreview");
    const qrZoom = document.getElementById("qrZoomOverlay");
    const qrZoomClose = document.getElementById("qrZoomClose");
    let qrTrigger;
    const closeQrZoom = () => {
        qrZoom.hidden = true;
        qrOverlay.removeAttribute("inert");
        qrPreview.focus();
    };
    const closeQrModal = () => {
        qrZoom.hidden = true;
        qrOverlay.removeAttribute("inert");
        qrOverlay.classList.remove("open");
        document.body.classList.remove("qr-modal-open");
        qrTrigger?.focus();
    };
    document.getElementById("qrGeneratorToggle").addEventListener("click", () => {
        document.getElementById("qrModalTitle").textContent = "Генератор QR-кодів";
        document.getElementById("qrModalCanvas").innerHTML = "";
        qrPreview.hidden = true;
        document.getElementById("qrModalHint").hidden = true;
        document.getElementById("qrModalUrl").textContent = "";
        qrForm.hidden = false;
        qrOverlay.classList.add("is-generator");
        document.body.classList.add("qr-modal-open");
        qrOverlay.classList.add("open");
        qrInput.focus();
    });
    qrForm.addEventListener("submit", e => {
        e.preventDefault();
        const value = qrInput.value.trim();
        if (!value) {
            qrInput.setCustomValidity("Введіть посилання або текст");
            qrInput.reportValidity();
            return;
        }
        try {
            openQrModal("Генератор QR-кодів", value);
        } catch (error) {
            const hint = document.getElementById("qrModalHint");
            hint.textContent = "Не вдалося створити QR-код. Спробуйте скоротити текст або перезавантажити сторінку.";
            hint.hidden = false;
        }
        qrForm.hidden = false;
        qrOverlay.classList.add("is-generator");
        document.getElementById("qrModalUrl").hidden = true;
        if (!qrPreview.hidden) qrPreview.focus();
        else qrInput.focus();
    });
    qrInput.addEventListener("input", () => qrInput.setCustomValidity(""));
    qrPreview.addEventListener("click", () => {
        const value = document.getElementById("qrModalCanvas").dataset.value;
        if (!value) return;
        const zoomCanvas = document.getElementById("qrZoomCanvas");
        zoomCanvas.innerHTML = "";
        new QRCode(zoomCanvas, {
            text: value, width: 1024, height: 1024,
            colorDark: "#1e293b", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
        qrZoom.hidden = false;
        qrOverlay.setAttribute("inert", "");
        qrZoomClose.focus();
    });
    qrZoomClose.addEventListener("click", closeQrZoom);
    qrZoom.addEventListener("click", e => {
        if (!document.getElementById("qrZoomCanvas").contains(e.target)) closeQrZoom();
    });
    document.addEventListener("click", e => {
        if (qrOverlay.classList.contains("open") && !qrOverlay.contains(e.target) && !qrZoom.contains(e.target)) {
            qrTrigger = e.target.closest("button");
            if (qrForm.hidden) document.getElementById("qrModalClose").focus();
        }
    });
    document.getElementById("qrModalClose").addEventListener("click", closeQrModal);
    qrOverlay.addEventListener("click", e => { if (e.target === qrOverlay) closeQrModal(); });
    document.addEventListener("keydown", e => {
        if (!qrOverlay.classList.contains("open")) return;
        if (!qrZoom.hidden) {
            if (e.key === "Escape") { e.preventDefault(); closeQrZoom(); }
            if (e.key === "Tab") { e.preventDefault(); qrZoomClose.focus(); }
            return;
        }
        if (e.key === "Escape") { e.preventDefault(); closeQrModal(); }
        if (e.key === "Tab") {
            const controls = [...qrOverlay.querySelectorAll("button, input")].filter(el => el.getClientRects().length);
            const first = controls[0], last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const h = window.location.hash.substring(1);
        if (h && CATEGORIES.some(c => c.id === h)) {
            setActiveCategory(h);
        }
    });
});

