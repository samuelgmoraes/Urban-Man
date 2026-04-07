const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register — Cadastrar novo usuário
router.post('/register', (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        // Verificar se email já existe
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const result = db.prepare(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
        ).run(name, email, hashedPassword, 'customer');

        const token = jwt.sign(
            { id: result.lastInsertRowid, email, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Conta criada com sucesso!',
            token,
            user: { id: result.lastInsertRowid, name, email, role: 'customer' }
        });
    } catch (err) {
        console.error('Erro no registro:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/auth/login — Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/auth/me — Dados do usuário logado
router.get('/me', authenticate, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.json({ user });
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
