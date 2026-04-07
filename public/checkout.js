const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    
    const cart = JSON.parse(localStorage.getItem('urban_cart')) || [];
    
    // Se não tiver nada no carrinho, redireciona pra home.
    if (cart.length === 0) {
        window.location.href = '/index.html';
        return;
    }

    // Inicializa a UI do Resumo
    renderSummary();

    // Lida com o Envio do Formulário
    const checkoutForm = document.getElementById('checkoutForm');
    const submitBtn = document.getElementById('submitOrderBtn');

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Mudar botão pra loading
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';
        submitBtn.disabled = true;

        const customerName = document.getElementById('custName').value;
        const customerEmail = document.getElementById('custEmail').value;
        const customerPhone = document.getElementById('custPhone').value;
        
        // (Endereço pode ser enviado no payload futuramente se a API suportar)
        // const zip = document.getElementById('addressZip').value;

        const items = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));

        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Erro ao processar pedido.');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Sucesso
            localStorage.removeItem('urban_cart');
            showSuccessModal(data.order.id);

        } catch (err) {
            console.error('Erro no checkout:', err);
            alert('Erro de conexão. Tente novamente.');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Funções
    function renderSummary() {
        const itemsContainer = document.getElementById('checkoutItems');
        let subtotal = 0;
        let html = '';

        cart.forEach(item => {
            subtotal += (item.price * item.quantity);
            html += `
                <div class="summary-item">
                    <div class="sm-item-img">
                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '<div style="background-color:#eaeaea; width:100%; height:100%;"></div>'}
                        <div class="sm-item-qty">${item.quantity}</div>
                    </div>
                    <div class="sm-item-info">
                        <div class="sm-item-title">${item.name}</div>
                        <div class="sm-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                    </div>
                </div>
            `;
        });

        itemsContainer.innerHTML = html;
        document.getElementById('summarySubtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('summaryTotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }

    function showSuccessModal(orderId) {
        const modalHtml = `
            <div class="success-modal">
                <div class="success-content">
                    <div class="success-icon">✓</div>
                    <h2>Pedido Confirmado!</h2>
                    <p>Obrigado pela sua compra. O número do seu pedido é <strong>#${orderId}</strong>. Enviamos o comprovante para o seu e-mail.</p>
                    <a href="index.html" class="btn-primary">Voltar para a Loja</a>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
});
