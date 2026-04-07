const express = require('express');
const { db } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — Criar pedido
router.post('/', (req, res) => {
    try {
        const { items, customer_name, customer_email, customer_phone, address_street, address_city, address_state, address_zip } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'O pedido deve conter pelo menos um item.' });
        }

        if (!customer_name || !customer_email) {
            return res.status(400).json({ error: 'Nome e email do cliente são obrigatórios.' });
        }

        // Validar os produtos e calcular o total
        let total = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.product_id);
            if (!product) {
                return res.status(400).json({ error: `Produto ID ${item.product_id} não encontrado ou indisponível.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}` });
            }
            total += product.price * item.quantity;
            validatedItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Extrair user_id do token se fornecido
        let user_id = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                user_id = decoded.id;
            } catch (e) {
                // Token inválido — prosseguir sem user_id
            }
        }

        // Criar pedido em transação
        const createOrder = db.transaction(() => {
            const orderResult = db.prepare(`
                INSERT INTO orders (user_id, total, customer_name, customer_email, customer_phone, address_street, address_city, address_state, address_zip)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                user_id, total, customer_name, customer_email,
                customer_phone || '', address_street || '', address_city || '',
                address_state || '', address_zip || ''
            );

            const orderId = orderResult.lastInsertRowid;

            const insertItem = db.prepare(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
            );

            const updateStock = db.prepare(
                'UPDATE products SET stock = stock - ? WHERE id = ?'
            );

            for (const item of validatedItems) {
                insertItem.run(orderId, item.product_id, item.quantity, item.price);
                updateStock.run(item.quantity, item.product_id);
            }

            return orderId;
        });

        const orderId = createOrder();

        // Buscar o pedido completo
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        const orderItems = db.prepare(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `).all(orderId);

        res.status(201).json({
            message: 'Pedido realizado com sucesso!',
            order: { ...order, items: orderItems }
        });
    } catch (err) {
        console.error('Erro ao criar pedido:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/orders — Listar pedidos do usuário logado
router.get('/', authenticate, (req, res) => {
    try {
        let orders;

        if (req.user.role === 'admin') {
            orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
        } else {
            orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        }

        // Incluir itens em cada pedido
        const getItems = db.prepare(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `);

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: getItems.all(order.id)
        }));

        res.json({ orders: ordersWithItems });
    } catch (err) {
        console.error('Erro ao listar pedidos:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/orders/:id — Buscar pedido por ID
router.get('/:id', authenticate, (req, res) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Se não é admin, só pode ver seus próprios pedidos
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const items = db.prepare(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `).all(order.id);

        res.json({ order: { ...order, items } });
    } catch (err) {
        console.error('Erro ao buscar pedido:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/orders/:id/status — Atualizar status do pedido (Admin)
router.put('/:id/status', authenticate, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso restrito a administradores.' });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` });
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

        res.json({ message: 'Status atualizado.', order: { ...order, status } });
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
