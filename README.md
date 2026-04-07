# 🏙️ Urban Man — E-commerce Masculino

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Deploy](https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

**Loja virtual fullstack de moda masculina — Backend + Frontend integrados.**

</div>

---

## 📋 Sobre o Projeto

**Urban Man** é um e-commerce completo de roupas masculinas desenvolvido com **Node.js** e **Express** no backend, **SQLite** como banco de dados e um frontend vanilla (HTML, CSS, JavaScript) totalmente integrado à API REST.

O projeto foi construído com foco em demonstrar uma arquitetura fullstack funcional, com autenticação JWT, painel administrativo, carrinho de compras e sistema de pedidos.

---

## ✨ Funcionalidades

### 🛍️ Loja (Frontend)
- Hero banner com imagem de destaque
- Categorias dinâmicas em carrossel circular
- Grid de produtos com filtros por categoria
- Carrinho lateral (drawer) com LocalStorage
- Cálculo de parcelas sem juros
- Badge de desconto automático
- Newsletter com validação
- Animações de scroll (Intersection Observer)
- Design responsivo (mobile-first)

### 🛒 Checkout
- Formulário de dados pessoais e endereço
- Resumo do pedido em tempo real
- Envio do pedido para a API
- Modal de confirmação com número do pedido
- Validação de estoque no backend

### 🔐 Painel Admin (`/admin.html`)
- Login com autenticação JWT
- Listagem de todos os produtos
- Criação de produtos com upload de imagem
- Geração automática de slug
- Exclusão de produtos
- Rotas protegidas por middleware

### ⚙️ API REST (Backend)
- **Auth** — Registro, Login e dados do usuário (`/api/auth`)
- **Produtos** — CRUD completo com filtros e paginação (`/api/products`)
- **Categorias** — CRUD com contagem de produtos (`/api/categories`)
- **Pedidos** — Criação com transação atômica e controle de estoque (`/api/orders`)
- **Newsletter** — Cadastro de emails (`/api/newsletter`)
- **Health Check** — Status da API (`/api/health`)

---

## 🏗️ Arquitetura

```
Urban-Man/
├── server.js                  # Servidor Express (entry point)
├── package.json
├── .env                       # Variáveis de ambiente (local)
├── .gitignore
│
├── src/
│   ├── database/
│   │   ├── db.js              # Conexão SQLite + schema
│   │   └── seed.js            # Dados iniciais (categorias, produtos, admin)
│   ├── middleware/
│   │   └── auth.js            # JWT authenticate + isAdmin
│   └── routes/
│       ├── auth.js            # Registro, Login, /me
│       ├── products.js        # CRUD + Multer upload
│       ├── categories.js      # CRUD categorias
│       ├── orders.js          # Pedidos + estoque
│       └── newsletter.js      # Cadastro newsletter
│
├── public/                    # Frontend (servido pelo Express)
│   ├── index.html             # Página principal da loja
│   ├── style.css              # Estilos globais
│   ├── script.js              # Lógica do frontend (carrinho, API, UI)
│   ├── checkout.html          # Página de checkout
│   ├── checkout.css
│   ├── checkout.js
│   ├── admin.html             # Painel administrativo
│   ├── admin.css
│   ├── admin.js
│   └── assets/                # Imagens estáticas
│
└── uploads/                   # Imagens de produtos (upload via admin)
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18 ou superior

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/samuelgmoraes/Urban-Man.git
cd Urban-Man

# 2. Instalar dependências
npm install

# 3. Criar ficheiro .env
echo "PORT=3000" > .env
echo "JWT_SECRET=sua_chave_secreta_aqui" >> .env

# 4. Popular o banco de dados
npm run seed

# 5. Iniciar o servidor
npm start
```

O servidor estará disponível em **http://localhost:3000**

### Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor em produção |
| `npm run dev` | Inicia com hot-reload (--watch) |
| `npm run seed` | Popula o banco com dados iniciais |

---

## 🔑 Credenciais do Admin

Após rodar o seed, use as seguintes credenciais no painel admin (`/admin.html`):

| Campo | Valor |
|---|---|
| Email | `admin@urbanman.com` |
| Senha | `admin123` |

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Login (retorna JWT) | ❌ |
| GET | `/api/auth/me` | Dados do usuário logado | ✅ |

### Produtos
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/products` | Listar produtos (filtros: category, featured, search, sort, page) | ❌ |
| GET | `/api/products/:slug` | Buscar produto por slug | ❌ |
| POST | `/api/products` | Criar produto (multipart/form-data) | 🔒 Admin |
| PUT | `/api/products/:id` | Atualizar produto | 🔒 Admin |
| DELETE | `/api/products/:id` | Remover produto | 🔒 Admin |

### Categorias
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/categories` | Listar categorias | ❌ |
| GET | `/api/categories/:slug` | Buscar por slug | ❌ |
| POST | `/api/categories` | Criar categoria | 🔒 Admin |
| PUT | `/api/categories/:id` | Atualizar categoria | 🔒 Admin |
| DELETE | `/api/categories/:id` | Remover categoria | 🔒 Admin |

### Pedidos
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/orders` | Criar pedido | ❌ |
| GET | `/api/orders` | Listar pedidos do usuário | ✅ |
| GET | `/api/orders/:id` | Detalhes do pedido | ✅ |
| PUT | `/api/orders/:id/status` | Atualizar status | 🔒 Admin |

### Outros
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/newsletter` | Cadastrar email | ❌ |
| GET | `/api/health` | Status da API | ❌ |

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express 5 |
| **Banco de Dados** | SQLite (better-sqlite3) |
| **Autenticação** | JWT (jsonwebtoken) + bcryptjs |
| **Upload** | Multer |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Tipografia** | Google Fonts (Inter) |
| **Deploy** | Railway |

---

## ☁️ Deploy (Railway)

O projeto está configurado para deploy no Railway com volume persistente:

- **Banco de dados** → `/app/data/store.db`
- **Uploads** → `/app/data/uploads`
- **Auto-seed** → O banco é populado automaticamente no primeiro deploy

### Variáveis de Ambiente no Railway

```
NODE_ENV=production
JWT_SECRET=sua_chave_forte_aqui
DB_PATH=/app/data/store.db
UPLOAD_PATH=/app/data/uploads
```

---

## 📄 Licença

Este projeto está sob a licença ISC.

---

<div align="center">

Feito por [Samuel Moraes](https://github.com/samuelgmoraes) 🚀

</div>
