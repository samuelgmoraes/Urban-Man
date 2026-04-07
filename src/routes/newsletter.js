const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

// POST /api/newsletter — Cadastrar email na newsletter
router.post('/', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório.' });
        }

        // Validação básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }

        const existing = db.prepare('SELECT id FROM newsletter WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Este email já está cadastrado na newsletter.' });
        }

        db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email);

        res.status(201).json({ message: 'Email cadastrado com sucesso! Você receberá 10% off na primeira compra.' });
    } catch (err) {
        console.error('Erro na newsletter:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
