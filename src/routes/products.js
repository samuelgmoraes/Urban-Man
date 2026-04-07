const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Caminho de uploads: Volume no Railway ou pasta local
const productionUploadsPath = process.env.UPLOADS_PATH || '/app/data/uploads';
const localUploadsPath = path.join(__dirname, '..', '..', 'uploads');
const uploadsPath = process.env.NODE_ENV === 'production' ? productionUploadsPath : localUploadsPath;

// Garantir que o diretório de uploads existe
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeValid = allowed.test(file.mimetype);
        if (extValid && mimeValid) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens JPG, PNG e WebP são permitidas.'));
        }
    }
});

// GET /api/products — Listar produtos (com filtros)
router.get('/', (req, res) => {
    try {
        const { category, featured, search, page = 1, limit = 20, sort = 'newest' } = req.query;

        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.active = 1
        `;
        const params = [];

        if (category) {
            query += ' AND c.slug = ?';
            params.push(category);
        }

        if (featured === '1' || featured === 'true') {
            query += ' AND p.featured = 1';
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Ordenação
        switch (sort) {
            case 'price_asc':
                query += ' ORDER BY p.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY p.price DESC';
                break;
            case 'name':
                query += ' ORDER BY p.name ASC';
                break;
            default:
                query += ' ORDER BY p.created_at DESC';
        }

        // Paginação
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const products = db.prepare(query).all(...params);

        // Total para paginação
        let countQuery = 'SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = 1';
        const countParams = [];

        if (category) {
            countQuery += ' AND c.slug = ?';
            countParams.push(category);
        }
        if (featured === '1' || featured === 'true') {
            countQuery += ' AND p.featured = 1';
        }
        if (search) {
            countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Erro ao listar produtos:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/products/:slug — Buscar produto por slug
router.get('/:slug', (req, res) => {
    try {
        const product = db.prepare(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ?
        `).get(req.params.slug);

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        res.json({ product });
    } catch (err) {
        console.error('Erro ao buscar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/products — Criar produto (Admin)
router.post('/', authenticate, isAdmin, upload.single('image'), (req, res) => {
    try {
        const { name, slug, description, price, price_old, category_id, stock, featured } = req.body;

        if (!name || !slug || !price) {
            return res.status(400).json({ error: 'Nome, slug e preço são obrigatórios.' });
        }

        const image_url = req.file ? `/uploads/${req.file.filename}` : '';

        const result = db.prepare(`
            INSERT INTO products (name, slug, description, price, price_old, category_id, image_url, stock, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name, slug, description || '', parseFloat(price),
            price_old ? parseFloat(price_old) : null,
            category_id ? parseInt(category_id) : null,
            image_url, parseInt(stock) || 0, featured === '1' || featured === 'true' ? 1 : 0
        );

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ message: 'Produto criado.', product });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Já existe um produto com este slug.' });
        }
        console.error('Erro ao criar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/products/:id — Atualizar produto (Admin)
router.put('/:id', authenticate, isAdmin, upload.single('image'), (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

        if (!existing) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        const { name, slug, description, price, price_old, category_id, stock, featured, active } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : existing.image_url;

        db.prepare(`
            UPDATE products SET
                name = ?, slug = ?, description = ?, price = ?, price_old = ?,
                category_id = ?, image_url = ?, stock = ?, featured = ?, active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name || existing.name,
            slug || existing.slug,
            description ?? existing.description,
            price ? parseFloat(price) : existing.price,
            price_old !== undefined ? (price_old ? parseFloat(price_old) : null) : existing.price_old,
            category_id !== undefined ? (category_id ? parseInt(category_id) : null) : existing.category_id,
            image_url,
            stock !== undefined ? parseInt(stock) : existing.stock,
            featured !== undefined ? (featured === '1' || featured === 'true' ? 1 : 0) : existing.featured,
            active !== undefined ? (active === '1' || active === 'true' ? 1 : 0) : existing.active,
            id
        );

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        res.json({ message: 'Produto atualizado.', product });
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// DELETE /api/products/:id — Deletar produto (Admin)
router.delete('/:id', authenticate, isAdmin, (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ message: 'Produto removido.' });
    } catch (err) {
        console.error('Erro ao deletar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
