const API_BASE = '/api';
let authToken = localStorage.getItem('urban_token');

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Login Form Submit
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.token) {
                // Checar se é admin na API /me seria ideal, mas iremos apenas testar salvar
                // (No backend, a flag hasRole isAdmin será validada nos endpoints)
                localStorage.setItem('urban_token', data.token);
                authToken = data.token;
                errorDiv.textContent = '';
                checkAuth();
            } else {
                errorDiv.textContent = data.error || 'Credenciais inválidas';
            }
        } catch (err) {
            errorDiv.textContent = 'Erro de conexão no servidor.';
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('urban_token');
        authToken = null;
        checkAuth();
    });

    // Modal Control
    document.getElementById('btnNewProduct').addEventListener('click', () => {
        document.getElementById('productForm').reset();
        document.getElementById('productModal').classList.add('active');
    });
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('productModal').classList.remove('active');
    });

    // Form Nova Criação de Produto (Upload de Arquivo c/ API Fetch multipart)
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const statusDiv = document.getElementById('modalStatus');
        statusDiv.textContent = 'Salvando produto...';
        statusDiv.style.color = '#000';

        const formData = new FormData();
        formData.append('name', document.getElementById('prodName').value);
        formData.append('description', document.getElementById('prodDesc').value);
        formData.append('price', document.getElementById('prodPrice').value);
        formData.append('category_id', document.getElementById('prodCategory').value);
        formData.append('stock', document.getElementById('prodStock').value);
        
        const priceOld = document.getElementById('prodPriceOld').value;
        if(priceOld) formData.append('price_old', priceOld);
        
        formData.append('featured', document.getElementById('prodFeatured').checked ? '1' : '0');

        const imageFile = document.getElementById('prodImage').files[0];
        if(imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const res = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                    // Não enviar Content-Type. O navegador vai setar `multipart/form-data; boundary=...` sozinho!
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                statusDiv.textContent = '✅ Produto criado com sucesso!';
                statusDiv.style.color = 'green';
                setTimeout(() => {
                    document.getElementById('productModal').classList.remove('active');
                    loadProducts();
                }, 1000);
            } else {
                statusDiv.textContent = '❌ Erro: ' + (data.error || 'Falha ao salvar.');
                statusDiv.style.color = 'red';
            }

        } catch (err) {
            console.error(err);
            statusDiv.textContent = '❌ Erro de rota: ' + err.message;
        }
    });
});

// Checa estado
function checkAuth() {
    const loginView = document.getElementById('loginView');
    const adminView = document.getElementById('adminView');

    if (authToken) {
        loginView.classList.remove('active');
        adminView.classList.add('active');
        loadProducts(); // Load default view
    } else {
        loginView.classList.add('active');
        adminView.classList.remove('active');
    }
}

// Carregar linha de produtos
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        
        const tbody = document.getElementById('productsTableBody');
        
        if (!data.products || data.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum produto cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.products.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td><img src="${p.image_url || ''}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\'></svg>'"></td>
                <td><strong>${p.name}</strong></td>
                <td>R$ ${p.price.toFixed(2).replace('.',',')}</td>
                <td>${p.stock} un.</td>
                <td>${p.category_name || '-'}</td>
                <td>
                    <button class="btn-danger" onclick="deleteProduct(${p.id})">Excluir</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Erro loadProducts', err);
    }
}

// Deletar
async function deleteProduct(id) {
    if(!confirm(`Tem certeza que deseja excluir o produto #${id}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (res.ok) {
            loadProducts();
        } else {
            const data = await res.json();
            alert('Erro: ' + (data.error || 'Não autorizado'));
        }
    } catch(e) {
        alert('Erro ao excluir produto');
    }
}
