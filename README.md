# 🎂 Sweet Bliss Cakery — Full Stack E-Commerce Platform

A beautiful, production-ready cake shop built with **Next.js 14**, **Fastify**, **PostgreSQL**, and **Docker**.

---

## ✨ Features

### Customer Side
- 🎂 Browse cakes with filters, search, sort, categories
- 🖼️ High-quality image gallery per cake (up to 10 images)
- ❤️ Wishlist — save favourite cakes
- 🛒 Cart with quantity controls + delivery calculation
- 📞 Direct call-to-order button
- ⭐ Ratings & reviews per cake
- 🚩 Report inappropriate cakes
- 👤 User profile — edit info, change password

### Admin Portal
- 📊 Dashboard with live stats
- 🎂 Cake management — create, edit, delete, pin, show/hide
- 🖼️ Multi-image upload (10 images × 10MB each, auto thumbnail)
- 📌 Pin cakes to homepage featured section
- 🗂️ Category management
- 📢 Promotions/banners management
- 🚩 Report review & moderation
- ⚙️ Shop settings (phone, delivery charge, etc.)
- 👥 User management

### Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Backend | Fastify (Node.js) — very fast HTTP server |
| Database | PostgreSQL 16 |
| Auth | JWT (30-day tokens) |
| Images | Sharp (auto-thumbnail), stored in Docker volume |
| State | Zustand |
| Deploy | Docker Compose + Nginx reverse proxy |

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- Docker Desktop installed and running
- Ports 80 free on your machine

### 1. Clone / Download
```bash
# If you have the zip, extract it
unzip cakeshop.zip
cd cakeshop
```

### 2. Start everything
```bash
docker compose up --build
```

First build takes ~3–5 minutes (downloads Node, builds Next.js).

### 3. Open
```
http://localhost
```

### Default accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@cakeshop.com | Admin@123 |
| Customer | priya@example.com | Customer@123 |

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally
- Create database: `CREATE DATABASE cakeshop;`

### Backend
```bash
cd backend
npm install

# Copy and edit env
cp .env.example .env
# Edit DATABASE_URL if your Postgres credentials differ

# Run migrations + seed
node src/db/migrate.js
node src/db/seed.js

# Start dev server (auto-reload)
npm run dev
# Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install

# .env.local already created — edit if needed
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev
# Runs on http://localhost:3000
```

---

## 📁 Project Structure

```
cakeshop/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.js          # PostgreSQL connection pool
│   │   │   ├── migrate.js       # Create all tables
│   │   │   └── seed.js          # Sample data
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # /api/auth/*
│   │   │   ├── cakes.js         # /api/cakes/*
│   │   │   ├── cart.js          # /api/cart/*
│   │   │   ├── wishlist.js      # /api/wishlist/*
│   │   │   └── admin.js         # /api/admin/*
│   │   ├── utils/
│   │   │   └── slug.js          # Auto slug generator
│   │   └── server.js            # Fastify entry point
│   ├── uploads/                 # Image storage (Docker volume)
│   ├── .env                     # Local env (git-ignored)
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Homepage
│   │   │   ├── cakes/page.tsx              # Cake listing
│   │   │   ├── cakes/[id]/page.tsx         # Cake detail
│   │   │   ├── cart/page.tsx               # Cart
│   │   │   ├── wishlist/page.tsx           # Wishlist
│   │   │   ├── profile/page.tsx            # User profile
│   │   │   ├── auth/login/page.tsx         # Login
│   │   │   ├── auth/register/page.tsx      # Register
│   │   │   └── admin/                      # Admin portal
│   │   │       ├── page.tsx                # Dashboard
│   │   │       ├── cakes/page.tsx          # Cake list
│   │   │       ├── cakes/[id]/page.tsx     # Edit cake
│   │   │       ├── cakes/new/page.tsx      # New cake
│   │   │       ├── categories/page.tsx     # Categories
│   │   │       ├── promotions/page.tsx     # Promotions
│   │   │       ├── reports/page.tsx        # Reports
│   │   │       ├── settings/page.tsx       # Settings
│   │   │       └── users/page.tsx          # Users
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── CartDrawer.tsx
│   │   │   ├── cake/
│   │   │   │   ├── CakeCard.tsx
│   │   │   │   └── CakeGrid.tsx
│   │   │   └── admin/
│   │   │       └── CakeForm.tsx
│   │   ├── lib/api.ts            # All API calls
│   │   └── store/index.ts        # Zustand state
│   └── Dockerfile
│
├── nginx/
│   └── default.conf              # Reverse proxy config
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Reference

### Public Endpoints
```
GET  /api/cakes                    # List cakes (filter/search/sort/paginate)
GET  /api/cakes/:slug              # Cake detail
GET  /api/cakes/meta/categories    # All categories
GET  /api/cakes/meta/promotions    # Active promotions
POST /api/auth/register            # Register
POST /api/auth/login               # Login
GET  /health                       # Health check
```

### Authenticated (Bearer token)
```
GET    /api/auth/me                # Current user
PATCH  /api/auth/me                # Update profile
POST   /api/auth/change-password   # Change password
GET    /api/cart                   # Get cart
POST   /api/cart                   # Add to cart
PATCH  /api/cart/:id               # Update quantity
DELETE /api/cart/:id               # Remove item
GET    /api/wishlist               # Get wishlist
POST   /api/wishlist/:cakeId       # Toggle wishlist
POST   /api/cakes/:id/report       # Report a cake
POST   /api/cakes/:id/review       # Add review
```

### Admin Only
```
GET    /api/admin/stats             # Dashboard stats
GET    /api/admin/cakes             # All cakes (incl. hidden)
POST   /api/admin/cakes             # Create cake
GET    /api/admin/cakes/:id         # Get cake detail
PATCH  /api/admin/cakes/:id         # Update cake
DELETE /api/admin/cakes/:id         # Delete cake
PATCH  /api/admin/cakes/:id/pin     # Toggle pin
POST   /api/admin/cakes/:id/images  # Upload images (multipart)
DELETE /api/admin/images/:id        # Delete image
GET    /api/admin/categories        # List categories
POST   /api/admin/categories        # Create category
PATCH  /api/admin/categories/:id    # Update category
DELETE /api/admin/categories/:id    # Delete category
GET    /api/admin/promotions        # List promotions
POST   /api/admin/promotions        # Create promotion
PATCH  /api/admin/promotions/:id    # Update promotion
DELETE /api/admin/promotions/:id    # Delete promotion
GET    /api/admin/reports           # List reports
PATCH  /api/admin/reports/:id       # Update report status
GET    /api/admin/settings          # Get settings
PATCH  /api/admin/settings          # Update settings
GET    /api/admin/users             # List users
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild after code changes
docker compose up --build

# Stop everything
docker compose down

# Stop and remove all data (CAUTION: deletes database!)
docker compose down -v

# Re-run migrations only
docker compose run --rm migrate node src/db/migrate.js

# Re-seed data
docker compose run --rm migrate node src/db/seed.js

# Shell into backend
docker compose exec backend sh

# Shell into database
docker compose exec postgres psql -U cakeshop -d cakeshop
```

---

## 🌐 Free Deployment Options

### Option 1: Railway (Easiest — Recommended)
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL service from Railway marketplace
4. Set env vars: `DATABASE_URL`, `JWT_SECRET`
5. Deploy! Railway auto-detects Docker.

### Option 2: Render
1. Push to GitHub
2. New Web Service → Connect repo
3. Add PostgreSQL on Render
4. Set env vars and deploy

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)
```bash
# On the VPS (Ubuntu 22.04+)
sudo apt update && sudo apt install -y docker.io docker-compose-v2
git clone <your-repo> cakeshop
cd cakeshop

# Edit docker-compose.yml → change JWT_SECRET and ADMIN_PASSWORD!
docker compose up -d --build

# For a real domain + HTTPS, add Certbot + nginx SSL config
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🎨 Design System

The design uses a **luxury pink & sky blue** theme:
- **Primary**: `#f72f7a` (deep rose pink) 
- **Accent**: `#0ea5e9` (sky blue)
- **Typography**: Cormorant Garamond (display) + DM Sans (body)
- **Background**: Warm cream `#fffdf9` with subtle radial gradients

---

## 📅 Phase Roadmap

| Phase | Status | Features |
|---|---|---|
| **Phase 1** | ✅ **Complete** | Catalog, cart, wishlist, admin portal, Docker |
| **Phase 2** | 🔜 Next | Razorpay payments, order tracking, email notifications |
| **Phase 3** | 🔜 Future | AI recommendations, semantic search, analytics |
| **Phase 4** | 🔜 Future | Multi-vendor, React Native app, loyalty points |

---

## 🔒 Security Notes

Before going to production:
1. **Change `JWT_SECRET`** in docker-compose.yml to a random 64-char string
2. **Change `ADMIN_PASSWORD`** from `Admin@123`
3. **Change PostgreSQL password** from `cakeshop123`
4. Consider adding HTTPS via Certbot or Cloudflare
5. Restrict `FRONTEND_URL` in backend to your domain

---

## 🆘 Troubleshooting

**Port 80 in use?**
```bash
# Change nginx port in docker-compose.yml
ports:
  - "8080:80"
# Then open http://localhost:8080
```

**Database connection error?**
```bash
docker compose logs postgres  # Check if postgres started
docker compose restart backend  # Restart backend
```

**Images not loading?**
```bash
# Check uploads volume is mounted
docker compose exec nginx ls /var/www/uploads/
```

**Frontend build fails?**
```bash
# Check Node memory
docker compose build --no-cache frontend
```

---

Made with ❤️ in Indore, India 🇮🇳
