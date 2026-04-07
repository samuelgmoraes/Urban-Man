const express = require('express');
const { db } = require('../database/db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories — Listar todas as categorias
router.get('/', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
            GROUP BY c.id
            ORDER BY c.name
        `).all();

        res.json({ categories });
    } catch (err) {
        console.error('Erro ao listar categorias:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/categories/:slug — Buscar categoria por slug
router.get('/:slug', (req, res) => {
    try {
        const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
        if (!category) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ category });
    } catch (err) {
        console.error('Erro ao buscar categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/categories — Criar categoria (Admin)
router.post('/', authenticate, isAdmin, (req, res) => {
    try {
        const { name, slug, image_url } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Nome e slug são obrigatórios.' });
        }

        const result = db.prepare(
            'INSERT INTO categories (name, slug, image_url) VALUES (?, ?, ?)'
        ).run(name, slug, image_url || '');

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ message: 'Categoria criada.', category });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Categoria com este nome ou slug já existe.' });
        }
        console.error('Erro ao criar categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT /api/categories/:id — Atualizar categoria (Admin)
router.put('/:id', authenticate, isAdmin, (req, res) => {
    try {
        const { name, slug, image_url } = req.body;
        const { id } = req.params;

        const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        db.prepare(
            'UPDATE categories SET name = ?, slug = ?, image_url = ? WHERE id = ?'
        ).run(name || existing.name, slug || existing.slug, image_url ?? existing.image_url, id);

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        res.json({ message: 'Categoria atualizada.', category });
    } catch (err) {
        console.error('Erro ao atualizar categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// DELETE /api/categories/:id — Deletar categoria (Admin)
router.delete('/:id', authenticate, isAdmin, (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
        res.json({ message: 'Categoria removida.' });
    } catch (err) {
        console.error('Erro ao deletar categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
