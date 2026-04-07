const { db, initializeDatabase } = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
    initializeDatabase();

    // Limpar dados antigos
    db.exec(`
        DELETE FROM order_items;
        DELETE FROM orders;
        DELETE FROM products;
        DELETE FROM categories;
        DELETE FROM users;
        DELETE FROM newsletter;
    `);

    // --- Categorias ---
    const categories = [
        { name: 'Camisetas', slug: 'camisetas', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' },
        { name: 'Calças', slug: 'calcas', image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80' },
        { name: 'Jaquetas', slug: 'jaquetas', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80' },
        { name: 'Bermudas', slug: 'bermudas', image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80' },
        { name: 'Calçados', slug: 'calcados', image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80' },
        { name: 'Acessórios', slug: 'acessorios', image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80' }
    ];

    const insertCategory = db.prepare(`
        INSERT INTO categories (name, slug, image_url) VALUES (?, ?, ?)
    `);

    const insertCategories = db.transaction(() => {
        for (const cat of categories) {
            insertCategory.run(cat.name, cat.slug, cat.image_url);
        }
    });
    insertCategories();
    console.log(`✅ ${categories.length} categorias inseridas.`);

    // --- Produtos ---
    const insertProduct = db.prepare(`
        INSERT INTO products (name, slug, description, price, price_old, category_id, image_url, stock, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Obter IDs das categorias
    const catCamisetas = db.prepare("SELECT id FROM categories WHERE slug='camisetas'").get().id;
    const catCalcas = db.prepare("SELECT id FROM categories WHERE slug='calcas'").get().id;
    const catJaquetas = db.prepare("SELECT id FROM categories WHERE slug='jaquetas'").get().id;
    const catBermudas = db.prepare("SELECT id FROM categories WHERE slug='bermudas'").get().id;
    const catCalcados = db.prepare("SELECT id FROM categories WHERE slug='calcados'").get().id;
    const catAcessorios = db.prepare("SELECT id FROM categories WHERE slug='acessorios'").get().id;

    const products = [
        {
            name: 'T-Shirt Essential Black',
            slug: 't-shirt-essential-black',
            description: 'Camiseta essencial em algodão premium, corte regular. Confortável e versátil para o dia a dia.',
            price: 129.90,
            price_old: null,
            category_id: catCamisetas,
            image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
            stock: 50,
            featured: 1
        },
        {
            name: 'Jaqueta Couro Biker',
            slug: 'jaqueta-couro-biker',
            description: 'Jaqueta de couro sintético premium com acabamento fosco. Forro interno acolchoado.',
            price: 424.90,
            price_old: 499.90,
            category_id: catJaquetas,
            image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
            stock: 20,
            featured: 1
        },
        {
            name: 'Calça Cargo Chumbo',
            slug: 'calca-cargo-chumbo',
            description: 'Calça modelagem cargo com múltiplos bolsos modulares. Tecido sarja de alta gramatura com elastano.',
            price: 259.90,
            price_old: null,
            category_id: catCalcas,
            image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
            stock: 35,
            featured: 1
        },
        {
            name: 'Sneaker Urban White',
            slug: 'sneaker-urban-white',
            description: 'Tênis casual branco em couro legítimo. Solado texturizado com alta absorção de impacto.',
            price: 389.90,
            price_old: null,
            category_id: catCalcados,
            image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
            stock: 15,
            featured: 1
        },
        {
            name: 'Bermuda Moletom Premium',
            slug: 'bermuda-moletom-premium',
            description: 'Bermuda confortável para looks casuais ou treinos. Ajuste por cordão na cintura.',
            price: 149.90,
            price_old: 169.90,
            category_id: catBermudas,
            image_url: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&q=80',
            stock: 40,
            featured: 1
        },
        {
            name: 'Calça Jeans Slim Preta',
            slug: 'calca-jeans-slim-preta',
            description: 'A peça mais versátil do guarda-roupa. Lavagem preta sólida sem desgaste com modelagem ajustada.',
            price: 219.90,
            price_old: null,
            category_id: catCalcas,
            image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
            stock: 60,
            featured: 1
        },
        {
            name: 'T-Shirt Oversized Branca',
            slug: 't-shirt-oversized-branca',
            description: 'Camiseta modelagem oversized com malha pesada. Estilo streetwear garantido.',
            price: 139.90,
            price_old: null,
            category_id: catCamisetas,
            image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
            stock: 30,
            featured: 0
        },
        {
            name: 'Relógio Minimalist Steel',
            slug: 'relogio-minimalist-steel',
            description: 'Relógio em aço escovado com mostrador limpo. A prova da água 5ATM.',
            price: 459.90,
            price_old: 519.90,
            category_id: catAcessorios,
            image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
            stock: 12,
            featured: 0
        }
    ];

    const insertProducts = db.transaction(() => {
        for (const p of products) {
            insertProduct.run(
                p.name, p.slug, p.description, p.price, p.price_old,
                p.category_id, p.image_url, p.stock, p.featured
            );
        }
    });
    insertProducts();
    console.log(`✅ ${products.length} produtos inseridos.`);

    // --- Usuário Admin ---
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run('Administrador', 'admin@urbanman.com', hashedPassword, 'admin');

    console.log('✅ Usuário admin criado: admin@urbanman.com / admin123');
    console.log('\n🎉 Seed concluído com sucesso!');
}

seed();
