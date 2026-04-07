const jwt = require('jsonwebtoken');

// Middleware: Verifica se o usuário está autenticado
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

// Middleware: Verifica se o usuário é admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    next();
}

module.exports = { authenticate, isAdmin };
