require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./src/database/db');

// Inicializar banco de dados
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares Globais ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Servir uploads de imagens (do Volume em produção ou pasta local em dev)
const productionUploadsPath = process.env.UPLOADS_PATH || '/app/data/uploads';
const localUploadsPath = path.join(__dirname, 'uploads');
const uploadsPath = process.env.NODE_ENV === 'production' ? productionUploadsPath : localUploadsPath;
app.use('/uploads', express.static(uploadsPath));

// --- Rotas da API ---
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/newsletter', require('./src/routes/newsletter'));

// --- Rota de saúde da API ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        message: 'Urban Man API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// --- Fallback: Qualquer rota não-API retorna o index.html ---
app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Tratamento de erros global ---
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
});

// --- Iniciar servidor ---
app.listen(PORT, () => {
    console.log(`\n🚀 Urban Man Server rodando em http://localhost:${PORT}`);
    console.log(`📦 API disponível em http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponível em http://localhost:${PORT}\n`);
});
