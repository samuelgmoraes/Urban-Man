const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Em produção (Railway com Volume), usa DB_PATH ou /app/data/store.db
// Em dev local, usa o arquivo na raiz do projeto
const productionDbPath = process.env.DB_PATH || '/app/data/store.db';
const localDbPath = path.join(__dirname, '..', '..', 'store.db');
const finalPath = process.env.NODE_ENV === 'production' ? productionDbPath : localDbPath;

// Garantir que o diretório do banco existe (importante para o Volume no Railway)
const dbDir = path.dirname(finalPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(finalPath);

// Habilitar WAL mode para melhor performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
    db.exec(`
        -- Tabela de Categorias
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            image_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Produtos
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            price REAL NOT NULL,
            price_old REAL DEFAULT NULL,
            category_id INTEGER,
            image_url TEXT DEFAULT '',
            stock INTEGER DEFAULT 0,
            featured INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        -- Tabela de Usuários
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Pedidos
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            status TEXT DEFAULT 'pending',
            total REAL NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT DEFAULT '',
            address_street TEXT DEFAULT '',
            address_city TEXT DEFAULT '',
            address_state TEXT DEFAULT '',
            address_zip TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Itens do Pedido
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        -- Newsletter
        CREATE TABLE IF NOT EXISTS newsletter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('✅ Banco de dados inicializado com sucesso.');
}

module.exports = { db, initializeDatabase };
