const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // MOBILE MENU
    // =============================================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // =============================================
    // CART STATE (LocalStorage)
    // =============================================
    let cart = JSON.parse(localStorage.getItem('urban_cart')) || [];

    function saveCart() {
        localStorage.setItem('urban_cart', JSON.stringify(cart));
        updateCartCount();
        renderCartDrawer();
    }

    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        openCartDrawer();

        // Animação no ícone do carrinho
        const countSpan = document.querySelector('.cart-count');
        if (countSpan) {
            countSpan.style.transform = 'scale(1.5)';
            setTimeout(() => { countSpan.style.transform = 'scale(1)'; }, 200);
        }
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
    }

    function updateQuantity(productId, delta) {
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        saveCart();
    }

    function getCartTotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function updateCartCount() {
        const countSpan = document.querySelector('.cart-count');
        if (countSpan) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            countSpan.textContent = totalItems;
        }
    }

    // =============================================
    // CART DRAWER UI
    // =============================================
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCart');
    const cartToggleBtn = document.getElementById('cartToggle');
    const btnContinueShopping = document.getElementById('btnContinueShopping');

    function openCartDrawer() {
        if (cartOverlay) {
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCartDrawer() {
        if (cartOverlay) {
            cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (cartToggleBtn) cartToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
    });
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
    if (btnContinueShopping) btnContinueShopping.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) closeCartDrawer();
    });

    function renderCartDrawer() {
        const cartBody = document.querySelector('.cart-body');
        if (!cartBody) return;

        if (cart.length === 0) {
            cartBody.innerHTML = `
                <div class="empty-cart-msg">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <p>Seu carrinho está vazio.</p>
                    <button class="btn-primary" onclick="document.getElementById('cartOverlay').classList.remove('active'); document.body.style.overflow='auto';">Continuar Comprando</button>
                </div>
            `;
            return;
        }

        let html = '<div class="cart-items">';
        for (const item of cart) {
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-img">
                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '<div class="cart-item-placeholder"></div>'}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                        <div class="cart-item-qty">
                            <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">&times;</button>
                </div>
            `;
        }
        html += '</div>';

        html += `
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Total:</span>
                    <strong>R$ ${getCartTotal().toFixed(2).replace('.', ',')}</strong>
                </div>
                <button class="btn-primary btn-checkout" id="btnCheckout">Finalizar Pedido</button>
            </div>
        `;

        cartBody.innerHTML = html;

        // Event listeners para botões de quantidade
        cartBody.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.id), -1));
        });
        cartBody.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.id), 1));
        });
        cartBody.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
        });

        // Finalizar pedido
        const checkoutBtn = cartBody.querySelector('#btnCheckout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }
    }

    // =============================================
    // CHECKOUT
    // =============================================
    function handleCheckout() {
        if (cart.length === 0) return;
        window.location.href = '/checkout.html';
    }

    // =============================================
    // SEARCH OVERLAY
    // =============================================
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout = null;

    function openSearch() {
        if (!searchOverlay) return;
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus the input after animation
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 400);
    }

    function closeSearch() {
        if (!searchOverlay) return;
        searchOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (searchInput) searchInput.value = '';
        if (searchResults) {
            searchResults.innerHTML = '<p class="search-hint">Digite para buscar camisetas, calças, jaquetas...</p>';
        }
    }

    if (searchToggle) searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        openSearch();
    });

    if (searchClose) searchClose.addEventListener('click', closeSearch);

    if (searchOverlay) {
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay || e.target.classList.contains('search-overlay-inner')) {
                // Only close if clicking outside the search container
                const container = document.querySelector('.search-container');
                if (container && !container.contains(e.target)) {
                    closeSearch();
                }
            }
        });
    }

    // ESC key to close search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchOverlay && searchOverlay.classList.contains('active')) {
                closeSearch();
            }
            if (authOverlay && authOverlay.classList.contains('active')) {
                closeAuth();
            }
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            
            if (searchTimeout) clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                searchResults.innerHTML = '<p class="search-hint">Digite para buscar camisetas, calças, jaquetas...</p>';
                return;
            }

            searchResults.innerHTML = '<p class="search-hint">Buscando...</p>';

            searchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(query)}&limit=8`);
                    const data = await res.json();

                    if (!data.products || data.products.length === 0) {
                        searchResults.innerHTML = `
                            <div class="search-no-results">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <p>Nenhum produto encontrado para "<strong>${query}</strong>"</p>
                            </div>
                        `;
                        return;
                    }

                    searchResults.innerHTML = `
                        <div class="search-results-grid">
                            ${data.products.map(p => `
                                <a href="index.html?categoria=${p.category_slug || ''}" class="search-result-item" data-product='${JSON.stringify({ id: p.id, name: p.name, price: p.price, image_url: p.image_url })}'>
                                    <div class="search-result-img">
                                        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : ''}
                                    </div>
                                    <div class="search-result-info">
                                        <span class="search-result-category">${p.category_name || ''}</span>
                                        <h4>${p.name}</h4>
                                        <span>R$ ${p.price.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    `;

                    // Add to cart on click
                    searchResults.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            const product = JSON.parse(item.dataset.product);
                            addToCart(product);
                            closeSearch();
                        });
                    });

                } catch (err) {
                    console.error('Erro na busca:', err);
                    searchResults.innerHTML = '<p class="search-hint">Erro ao buscar. Tente novamente.</p>';
                }
            }, 350); // Debounce de 350ms
        });
    }

    // =============================================
    // AUTH MODAL (Login / Register / Logged In)
    // =============================================
    const authOverlay = document.getElementById('authOverlay');
    const authClose = document.getElementById('authClose');
    const userToggle = document.getElementById('userToggle');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loggedInView = document.getElementById('loggedInView');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    function openAuth() {
        if (!authOverlay) return;
        // Check if user is logged in
        const token = localStorage.getItem('urban_token');
        const userData = JSON.parse(localStorage.getItem('urban_user') || 'null');

        if (token && userData) {
            showLoggedInState(userData);
        } else {
            showLoginForm();
        }

        authOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeAuth() {
        if (!authOverlay) return;
        authOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        clearAuthErrors();
    }

    function showLoginForm() {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (loggedInView) loggedInView.style.display = 'none';
    }

    function showRegisterForm() {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (loggedInView) loggedInView.style.display = 'none';
    }

    function showLoggedInState(user) {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        if (loggedInView) loggedInView.style.display = 'block';

        const nameEl = document.getElementById('loggedUserName');
        const emailEl = document.getElementById('loggedUserEmail');
        const adminBtn = document.getElementById('btnAdminPanel');

        if (nameEl) nameEl.textContent = `Olá, ${user.name}!`;
        if (emailEl) emailEl.textContent = user.email;
        if (adminBtn) {
            adminBtn.style.display = user.role === 'admin' ? 'block' : 'none';
        }
    }

    function clearAuthErrors() {
        const loginError = document.getElementById('loginError');
        const registerError = document.getElementById('registerError');
        if (loginError) loginError.textContent = '';
        if (registerError) registerError.textContent = '';
    }

    function updateUserIcon() {
        const btn = document.getElementById('userToggle');
        if (!btn) return;
        const token = localStorage.getItem('urban_token');
        if (token) {
            btn.classList.add('logged-in');
        } else {
            btn.classList.remove('logged-in');
        }
    }

    if (userToggle) userToggle.addEventListener('click', (e) => {
        e.preventDefault();
        openAuth();
    });

    if (authClose) authClose.addEventListener('click', closeAuth);

    if (authOverlay) authOverlay.addEventListener('click', (e) => {
        if (e.target === authOverlay) closeAuth();
    });

    if (showRegister) showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthErrors();
        showRegisterForm();
    });

    if (showLogin) showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthErrors();
        showLoginForm();
    });

    // Login
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorEl = document.getElementById('loginError');

            if (!email || !password) {
                if (errorEl) errorEl.textContent = 'Preencha todos os campos.';
                return;
            }

            btnLogin.textContent = 'Entrando...';
            btnLogin.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('urban_token', data.token);
                    localStorage.setItem('urban_user', JSON.stringify(data.user));
                    showLoggedInState(data.user);
                    updateUserIcon();
                    // Clear inputs
                    document.getElementById('loginEmail').value = '';
                    document.getElementById('loginPassword').value = '';
                } else {
                    if (errorEl) errorEl.textContent = data.error || 'Erro ao fazer login.';
                }
            } catch (err) {
                console.error('Erro no login:', err);
                if (errorEl) errorEl.textContent = 'Erro de conexão. Tente novamente.';
            } finally {
                btnLogin.textContent = 'Entrar';
                btnLogin.disabled = false;
            }
        });
    }

    // Register
    const btnRegister = document.getElementById('btnRegister');
    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const errorEl = document.getElementById('registerError');

            if (!name || !email || !password) {
                if (errorEl) errorEl.textContent = 'Preencha todos os campos.';
                return;
            }

            if (password.length < 6) {
                if (errorEl) errorEl.textContent = 'A senha deve ter pelo menos 6 caracteres.';
                return;
            }

            btnRegister.textContent = 'Criando...';
            btnRegister.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('urban_token', data.token);
                    localStorage.setItem('urban_user', JSON.stringify(data.user));
                    showLoggedInState(data.user);
                    updateUserIcon();
                    // Clear inputs
                    document.getElementById('registerName').value = '';
                    document.getElementById('registerEmail').value = '';
                    document.getElementById('registerPassword').value = '';
                } else {
                    if (errorEl) errorEl.textContent = data.error || 'Erro ao criar conta.';
                }
            } catch (err) {
                console.error('Erro no registro:', err);
                if (errorEl) errorEl.textContent = 'Erro de conexão. Tente novamente.';
            } finally {
                btnRegister.textContent = 'Criar Conta';
                btnRegister.disabled = false;
            }
        });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('urban_token');
            localStorage.removeItem('urban_user');
            updateUserIcon();
            closeAuth();
        });
    }

    // =============================================
    // CARREGAR PRODUTOS DA API (Com Filtros da URL)
    // =============================================
    async function loadProductsGrid() {
        const grid = document.getElementById('productGrid');
        const sectionTitle = document.querySelector('.section-title');
        if (!grid) return;

        // Ler parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const categorySlug = urlParams.get('categoria');
        const showAll = urlParams.get('todos');
        
        let endpoint = `${API_BASE}/products`;
        let titleName = 'TODOS OS PRODUTOS';
        
        if (categorySlug) {
            endpoint += `?category=${categorySlug}`;
            titleName = categorySlug.toUpperCase();
            
            // Focar na tela de produtos após 200ms para UX
            setTimeout(() => {
                document.querySelector('.featured-products').scrollIntoView({ behavior: 'smooth' });
            }, 300);
            
        } else if (showAll) {
            endpoint += `?limit=50`; // Busca mais para visualizar tudo
            setTimeout(() => {
                document.querySelector('.featured-products').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            // Padrão da página inicial (Lançamentos em Destaque)
            endpoint += `?featured=1&limit=8`;
            titleName = 'LANÇAMENTOS';
        }

        if (sectionTitle) sectionTitle.textContent = titleName;

        try {
            const res = await fetch(endpoint);
            const data = await res.json();

            if (!data.products || data.products.length === 0) {
                grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#999;">Nenhum produto cadastrado nesta seção.</p>';
                return;
            }

            grid.innerHTML = data.products.map((product, index) => {
                const hasDiscount = product.price_old && product.price_old > product.price;
                const discountPercent = hasDiscount
                    ? Math.round(((product.price_old - product.price) / product.price_old) * 100)
                    : 0;
                const installments = Math.min(Math.floor(product.price / 30), 12) || 1;
                const installmentValue = (product.price / installments).toFixed(2).replace('.', ',');

                return `
                    <div class="product-card fade-in" style="transition-delay: ${index * 100}ms" data-product-id="${product.id}">
                        <div class="product-img-wrapper">
                            ${product.image_url
                                ? `<img class="product-img" src="${product.image_url}" alt="${product.name}">`
                                : '<div class="img-placeholder"></div>'
                            }
                            ${hasDiscount ? `<div class="badge-discount">-${discountPercent}%</div>` : ''}
                            <button class="btn-quick-buy" data-product='${JSON.stringify({ id: product.id, name: product.name, price: product.price, image_url: product.image_url })}'>Adicionar +</button>
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${product.name}</h3>
                            <div class="product-price-wrapper">
                                ${hasDiscount ? `<span class="product-price-old">R$ ${product.price_old.toFixed(2).replace('.', ',')}</span>` : ''}
                                <span class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <p class="product-installments">${installments}x de R$ ${installmentValue} s/ juros</p>
                        </div>
                    </div>
                `;
            }).join('');

            // Adicionar listeners nos botões de quick buy
            grid.querySelectorAll('.btn-quick-buy').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const product = JSON.parse(btn.dataset.product);
                    addToCart(product);
                });
            });

            if (window.refreshScrollAnimations) window.refreshScrollAnimations();

        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#999;">Erro ao carregar os itens.</p>';
        }
    }

    // =============================================
    // CARREGAR CATEGORIAS DA API
    // =============================================
    async function loadCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE}/categories`);
            const data = await res.json();

            if (!data.categories || data.categories.length === 0) return;

            container.innerHTML = data.categories.map((cat, index) => `
                <a href="index.html?categoria=${cat.slug}" class="circle-item fade-in" style="transition-delay: ${index * 100}ms" data-category="${cat.slug}">
                    <div class="circle-img" ${cat.image_url ? `style="background-image: url('${cat.image_url}')"` : ''}></div>
                    <span>${cat.name}</span>
                </a>
            `).join('');

            if (window.refreshScrollAnimations) window.refreshScrollAnimations();

        } catch (err) {
            console.error('Erro ao carregar categorias:', err);
        }
    }

    // =============================================
    // NEWSLETTER
    // =============================================
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input[type="email"]');
            const email = input.value.trim();

            if (!email) return;

            try {
                const res = await fetch(`${API_BASE}/newsletter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (res.ok) {
                    input.value = '';
                    alert(data.message);
                } else {
                    alert(data.error || 'Erro ao cadastrar.');
                }
            } catch (err) {
                console.error('Erro na newsletter:', err);
                alert('Erro de conexão. Tente novamente.');
            }
        });
    }

    // =============================================
    // INICIALIZAÇÃO E ANIMAÇÃO DE SCROLL
    // =============================================
    updateCartCount();
    renderCartDrawer();
    updateUserIcon();
    loadCategories();
    loadProductsGrid();

    // Intersection Observer (Scroll Animation)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply observer to any elements that exist or will exist dynamically
    function observeFadeElements() {
        document.querySelectorAll('.fade-in').forEach(el => {
            scrollObserver.observe(el);
        });
    }

    // Call directly on load
    observeFadeElements();

    // Export function to global scope so it can be called after fetch
    window.refreshScrollAnimations = observeFadeElements;
});
