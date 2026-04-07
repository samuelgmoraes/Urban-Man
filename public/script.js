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
