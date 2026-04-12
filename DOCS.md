# 🎂 Agrawal Cake House — Complete Developer Documentation

> **How to use this doc:** Every section tells you *which file* controls *what*. If you want to change something and don't know where — search this document for the feature name. You'll find the exact file path, what it does, and what you can change inside it.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [How the Stack Fits Together](#3-how-the-stack-fits-together)
4. [Database — Every Table Explained](#4-database--every-table-explained)
5. [Backend Files — Every File Explained](#5-backend-files--every-file-explained)
6. [Frontend Files — Every File Explained](#6-frontend-files--every-file-explained)
7. [Design System — Colors, Fonts, Components](#7-design-system--colors-fonts-components)
8. [State Management](#8-state-management)
9. [API Reference — Every Endpoint](#9-api-reference--every-endpoint)
10. [Docker & Deployment](#10-docker--deployment)
11. [Environment Variables](#11-environment-variables)
12. [Common Change Requests — Where to Go](#12-common-change-requests--where-to-go)
13. [Local Development Setup](#13-local-development-setup)

---

## 1. Project Overview

Agrawal Cake House is a **full-stack e-commerce platform** for a cake shop. It has two sides:

- **Customer side** — Browse cakes, search, filter, save to wishlist, add to cart, view details, write reviews, report cakes, call to order directly
- **Admin side** — Full portal to manage cakes, images, categories, promotions/banners, reports, settings, users

### Tech Stack at a Glance

| What | Technology | Why |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | SSR + file-based routing |
| Frontend language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first, fast |
| Fonts | Cormorant Garamond + DM Sans | Luxury bakery feel |
| State management | Zustand | Simple, no boilerplate |
| Backend framework | Fastify (Node.js) | Very fast, low overhead |
| Database | PostgreSQL 16 | Relational, reliable |
| Auth | JWT (JSON Web Tokens) | Stateless, 30-day tokens |
| Image processing | Sharp | Auto-thumbnails on upload |
| Reverse proxy | Nginx | Routes traffic, serves uploads |
| Containerization | Docker + Docker Compose | One command to run everything |

---

## 2. Folder Structure

```
cakeshop/
│
├── docker-compose.yml          ← Starts all 5 services together
├── README.md                   ← This file
│
├── nginx/
│   └── default.conf            ← Nginx routing rules
│
├── backend/                    ← Fastify API server
│   ├── Dockerfile
│   ├── package.json
│   ├── .env                    ← Local secrets (never commit)
│   ├── .env.example            ← Template for .env
│   └── src/
│       ├── server.js           ← Entry point — starts Fastify
│       ├── db/
│       │   ├── pool.js         ← PostgreSQL connection
│       │   ├── migrate.js      ← Creates all DB tables
│       │   └── seed.js         ← Inserts sample data
│       ├── middleware/
│       │   └── auth.js         ← JWT verification functions
│       ├── routes/
│       │   ├── auth.js         ← /api/auth/* (login, register)
│       │   ├── cakes.js        ← /api/cakes/* (public browsing)
│       │   ├── cart.js         ← /api/cart/*
│       │   ├── wishlist.js     ← /api/wishlist/*
│       │   └── admin.js        ← /api/admin/* (protected)
│       └── utils/
│           └── slug.js         ← Auto slug from cake name
│
└── frontend/                   ← Next.js 14 app
    ├── Dockerfile
    ├── package.json
    ├── next.config.js          ← Next.js configuration
    ├── tailwind.config.js      ← Design tokens, colors, animations
    ├── tsconfig.json           ← TypeScript config
    ├── postcss.config.js       ← PostCSS (needed for Tailwind)
    ├── .env.local              ← Local env vars
    └── src/
        ├── app/                ← Pages (Next.js App Router)
        │   ├── layout.tsx      ← Root layout (Navbar, Footer, Toaster)
        │   ├── globals.css     ← All global CSS + design system
        │   ├── page.tsx        ← Homepage (/)
        │   ├── cakes/
        │   │   ├── page.tsx    ← Cake listing (/cakes)
        │   │   └── [id]/
        │   │       └── page.tsx ← Cake detail (/cakes/strawberry-dream)
        │   ├── auth/
        │   │   ├── login/page.tsx
        │   │   └── register/page.tsx
        │   ├── cart/           ← (folder exists, cart is a drawer)
        │   ├── wishlist/page.tsx
        │   ├── profile/page.tsx
        │   └── admin/          ← Admin portal (protected)
        │       ├── layout.tsx  ← Admin sidebar + auth guard
        │       ├── page.tsx    ← Admin dashboard
        │       ├── cakes/
        │       │   ├── page.tsx        ← Cake list table
        │       │   ├── new/page.tsx    ← Create cake form
        │       │   └── [id]/
        │       │       ├── page.tsx    ← Edit cake (uses CakeForm)
        │       │       └── edit/page.tsx ← Redirect wrapper
        │       ├── categories/page.tsx
        │       ├── promotions/page.tsx
        │       ├── reports/page.tsx
        │       ├── settings/page.tsx
        │       └── users/page.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.tsx      ← Top navigation bar
        │   │   ├── Footer.tsx      ← Site footer
        │   │   └── CartDrawer.tsx  ← Slide-in cart panel
        │   ├── cake/
        │   │   ├── CakeCard.tsx    ← Single product card
        │   │   └── CakeGrid.tsx    ← Responsive grid of cards
        │   └── admin/
        │       └── CakeForm.tsx    ← Shared create/edit form
        ├── lib/
        │   └── api.ts          ← Every API call function
        └── store/
            └── index.ts        ← Zustand stores (auth, cart, wishlist)
```

---

## 3. How the Stack Fits Together

Understanding this flow is the key to knowing where to make any change.

```
Browser
  │
  ▼
Nginx (port 80)
  │
  ├── /api/*    ──────────► Fastify Backend (port 3001)
  │                               │
  ├── /uploads/* ────────────►    │ (static files)
  │                               │
  └── /* (everything else) ──► Next.js Frontend (port 3000)
                                  │
                                  └── calls /api/* relative URLs
                                      (Nginx proxies them to Fastify)
```

**Key insight:** In Docker, `NEXT_PUBLIC_API_URL` is empty (`""`). So when the browser calls `/api/cakes`, that request goes to Nginx, which forwards it to the Fastify backend. This is why there's no CORS issue.

In **local development**, `NEXT_PUBLIC_API_URL=http://localhost:3001` so the browser calls Fastify directly.

---

## 4. Database — Every Table Explained

**File:** `backend/src/db/migrate.js`

All tables are created here. Run with `node src/db/migrate.js`.

---

### `users`
Stores all accounts — both customers and admins.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `name` | VARCHAR(100) | Display name |
| `email` | VARCHAR(255) | Unique, used for login |
| `password_hash` | VARCHAR(255) | bcrypt hashed, never plain text |
| `phone` | VARCHAR(20) | Optional |
| `avatar_url` | TEXT | Optional profile picture URL |
| `role` | VARCHAR(20) | Either `'customer'` or `'admin'` |
| `is_verified` | BOOLEAN | Currently set to `true` on register (no email verification yet) |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-managed |

**To add a new user field** (e.g. `address`): Add column in `migrate.js`, add to `SELECT` in `routes/auth.js`.

---

### `categories`
Cake categories shown in the filter bar and homepage.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | e.g. "Birthday Cakes" |
| `slug` | VARCHAR(100) | e.g. "birthday" — used in URLs |
| `description` | TEXT | Short description |
| `image_url` | TEXT | Optional category image |
| `display_order` | INTEGER | Controls sort order on frontend |
| `is_active` | BOOLEAN | If false, hidden from customers |

---

### `cakes`
The main product table. Most important table in the project.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR(200) | Cake name |
| `slug` | VARCHAR(200) | URL-friendly name, auto-generated, must be unique |
| `short_description` | TEXT | 1–2 lines shown on card |
| `description` | TEXT | Full description on detail page |
| `rich_content` | JSONB | Structured extras — `headline`, `highlights[]`, `care_instructions` |
| `category_id` | UUID | Foreign key → `categories.id` |
| `price` | DECIMAL(10,2) | Current selling price |
| `original_price` | DECIMAL(10,2) | If set, shown as strikethrough — discount calculated automatically |
| `weight` | VARCHAR(50) | e.g. "1 Kg" |
| `servings` | VARCHAR(50) | e.g. "8–10 people" |
| `flavours` | TEXT[] | Array — e.g. `['Strawberry', 'Vanilla']` |
| `allergens` | TEXT[] | Array — e.g. `['Nuts', 'Dairy']` |
| `ingredients` | TEXT[] | Array of ingredients |
| `customization_options` | JSONB | Reserved for future custom order options |
| `is_featured` | BOOLEAN | Shows "Featured" badge |
| `is_bestseller` | BOOLEAN | Shows "Bestseller" 🔥 badge |
| `is_new` | BOOLEAN | Shows "New" ✨ badge |
| `is_available` | BOOLEAN | If false, hidden from customers |
| `is_pinned` | BOOLEAN | Pinned cakes appear first on homepage |
| `stock_count` | INTEGER | Inventory count |
| `prep_time_hours` | INTEGER | Advance booking notice in hours |
| `rating` | DECIMAL(3,2) | Computed from reviews, auto-updated |
| `review_count` | INTEGER | Auto-updated when review added |
| `tags` | TEXT[] | Free-form tags for filtering |
| `meta_data` | JSONB | Reserved for future SEO/extra data |

**`rich_content` JSON structure:**
```json
{
  "headline": "A tagline shown prominently on detail page",
  "highlights": ["100% Fresh", "Eggless option available"],
  "care_instructions": "Refrigerate below 4°C. Consume within 3 days."
}
```

---

### `cake_images`
Each cake can have up to 10 images. First uploaded = primary.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `cake_id` | UUID | Foreign key → `cakes.id` (CASCADE delete) |
| `url` | TEXT | Path like `/uploads/uuid.jpg` |
| `thumbnail_url` | TEXT | Path like `/uploads/thumb_uuid.jpg` (400×400) |
| `alt_text` | VARCHAR(255) | Original filename used as alt |
| `display_order` | INTEGER | Controls image gallery order |
| `is_primary` | BOOLEAN | The main image shown on cards |
| `file_size` | INTEGER | Bytes |
| `width` / `height` | INTEGER | Pixel dimensions |

---

### `cart_items`
Works for both logged-in users (by `user_id`) and guests (by `session_id`).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Nullable — linked to logged-in user |
| `session_id` | VARCHAR(255) | Nullable — for guest carts (stored in localStorage) |
| `cake_id` | UUID | Foreign key → `cakes.id` |
| `quantity` | INTEGER | Min 1 |
| `customization` | JSONB | Future use — custom message, colour etc. |

---

### `wishlists`
Simple join table — one row per saved cake per user.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key → `users.id` |
| `cake_id` | UUID | Foreign key → `cakes.id` |
| UNIQUE | — | One row per (user, cake) pair |

---

### `reports`
Users can flag a cake. Admin reviews these.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `cake_id` | UUID | Which cake was reported |
| `reporter_id` | UUID | Which user reported |
| `reason` | VARCHAR(100) | e.g. "incorrect_info", "wrong_price" |
| `description` | TEXT | Optional details |
| `status` | VARCHAR(20) | `pending` → `reviewed` → `resolved` or `dismissed` |
| `reviewed_at` | TIMESTAMPTZ | When admin acted |
| `reviewed_by` | UUID | Which admin reviewed |

---

### `promotions`
Homepage banners and featured sections, fully managed by admin.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | VARCHAR(200) | Main heading |
| `subtitle` | TEXT | Supporting text |
| `badge_text` | VARCHAR(50) | Small pill label |
| `image_url` | TEXT | Optional background image |
| `button_text` | VARCHAR(100) | CTA button label |
| `button_url` | VARCHAR(500) | Where CTA goes |
| `section` | VARCHAR(50) | `'hero'`, `'featured'`, `'banner'`, `'popup'` |
| `display_order` | INTEGER | Sort order within section |
| `is_active` | BOOLEAN | Toggle visibility |
| `starts_at` / `ends_at` | TIMESTAMPTZ | Optional time window |

---

### `reviews`
Customer reviews with rating. One review per user per cake.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `cake_id` | UUID | Foreign key → `cakes.id` |
| `user_id` | UUID | Foreign key → `users.id` |
| `rating` | INTEGER | 1 to 5 |
| `title` | VARCHAR(200) | Short review headline |
| `body` | TEXT | Full review text |
| `is_verified` | BOOLEAN | Future use — verified purchase |
| UNIQUE | — | One review per (user, cake) |

---

### `admin_settings`
Key-value store for shop configuration. No schema migration needed to add new settings.

| Key | Default Value | What it controls |
|---|---|---|
| `shop_name` | "Agrawal Cake House" | Shown in footer |
| `shop_phone` | "+91-9876543210" | Call button number |
| `shop_address` | "123 Cake Lane..." | Shown in footer |
| `currency` | "INR" | Currency code |
| `currency_symbol` | "₹" | Shown next to prices |
| `delivery_charge` | 60 | Flat delivery fee |
| `free_delivery_above` | 500 | Cart total threshold for free delivery |
| `min_order` | 299 | Minimum order value |

---

## 5. Backend Files — Every File Explained

### `backend/src/server.js`
**The entry point.** Starts Fastify, registers all plugins and routes.

**What's registered here:**
- `@fastify/cors` — allows frontend to call the API (controlled by `FRONTEND_URL` env var)
- `@fastify/jwt` — adds `request.jwtVerify()` and `fastify.jwt.sign()`
- `@fastify/multipart` — enables image file uploads, max 10MB per file, 10 files per request
- `@fastify/static` — serves uploaded files at `/uploads/filename.jpg`
- All 5 route files under their `/api/*` prefixes

**To change the JSON body size limit:** Line with `bodyLimit: 1024 * 1024` — change the number (currently 1MB).

**To add a new route group:**
```js
import myNewRoutes from './routes/myNewRoutes.js'
await fastify.register(myNewRoutes, { prefix: '/api/myroutes' })
```

---

### `backend/src/db/pool.js`
**PostgreSQL connection pool.** Exports `pool` (raw pool) and `query()` (helper).

Every route file imports and uses `query(sql, params)`:
```js
import { query } from '../db/pool.js'
const { rows } = await query('SELECT * FROM cakes WHERE id = $1', [id])
```

**Connection:** Reads `DATABASE_URL` from environment. Pool size: 20 connections.

**Slow query logging:** Automatically logs queries taking over 100ms in development.

---

### `backend/src/db/migrate.js`
**Creates all database tables.** Run once before first use.

```bash
node src/db/migrate.js
```

This file is **idempotent** — uses `CREATE TABLE IF NOT EXISTS` so safe to run multiple times.

**To add a new column to an existing table:** Add an `ALTER TABLE` statement at the end of the `migrations` string.

**To add a completely new table:** Add `CREATE TABLE IF NOT EXISTS ...` block inside the `migrations` string.

---

### `backend/src/db/seed.js`
**Inserts sample data.** Creates admin user, sample categories, 8 sample cakes with images.

```bash
node src/db/seed.js
```

Uses `ON CONFLICT DO NOTHING` so safe to run multiple times. Won't duplicate data.

**To add more sample cakes:** Add objects to the `cakes` array in this file.

**Default accounts created:**
- Admin: `admin@cakeshop.com` / `Admin@123`
- Customer: `priya@example.com` / `Customer@123`

---

### `backend/src/middleware/auth.js`
**Three JWT middleware functions:**

| Function | Use case |
|---|---|
| `authenticate` | Route requires a logged-in user (any role) |
| `authenticateAdmin` | Route requires `role === 'admin'` |
| `optionalAuth` | Route works for both guests and logged-in users |

Used in routes like:
```js
fastify.get('/some-route', { preHandler: [authenticate] }, async (req, reply) => {
  // req.user is now available: { id, email, role, name }
})
```

---

### `backend/src/routes/auth.js`
**Handles:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/me`, `POST /api/auth/change-password`

**How login works:**
1. Find user by email
2. Compare password with `bcrypt.compare()`
3. If valid, sign a JWT with `{ id, email, role, name }`, expires in 30 days
4. Return `{ token, user }` — frontend stores token in `localStorage` as `cs_token`

**To change token expiry:** Find `expiresIn: '30d'` in this file, change to e.g. `'7d'`.

**Password hashing:** Uses `bcrypt` with salt rounds of 12.

---

### `backend/src/routes/cakes.js`
**Handles public cake browsing.** All endpoints here are accessible without login (except report and review which require `authenticate`).

**`GET /api/cakes` — list with filters:**

Accepts query parameters:
- `page`, `limit` — pagination
- `category` — filter by category slug
- `featured=true`, `bestseller=true`, `new=true`, `pinned=true` — boolean flags
- `search` — full-text search using PostgreSQL `tsvector`
- `sort` — `pinned` (default), `price_asc`, `price_desc`, `rating`, `newest`, `popular`
- `minPrice`, `maxPrice` — price range
- `tags` — comma-separated tags

**`GET /api/cakes/meta/categories`** — used to populate the filter bar.

**`GET /api/cakes/meta/promotions`** — used to populate homepage banners.

**`GET /api/cakes/:slug`** — returns full cake detail including images array and 10 most recent reviews.

---

### `backend/src/routes/cart.js`
**Guest carts and user carts both work.**

The cart is identified by either:
- `user_id` from JWT token (logged-in users)
- `session_id` from `x-session-id` request header (guests — generated by frontend and stored in `localStorage` as `cs_session`)

**`POST /api/cart`** — if item already in cart, increments quantity instead of duplicating.

---

### `backend/src/routes/wishlist.js`
**Requires login for all endpoints.**

`POST /api/wishlist/:cakeId` — **toggle** — if not saved, saves it; if already saved, removes it. Returns `{ saved: true/false }`.

---

### `backend/src/routes/admin.js`
**All endpoints require `authenticateAdmin` middleware — admin role only.**

Key operations:

**Image upload (`POST /api/admin/cakes/:id/images`):**
- Accepts multipart form data
- Checks existing image count (max 10 per cake)
- Saves file to `UPLOADS_DIR` with a UUID filename
- Uses Sharp to create a 400×400 thumbnail (prefix `thumb_`)
- Records file size, dimensions in DB
- First image uploaded is automatically set as `is_primary = true`

**Pin a cake (`PATCH /api/admin/cakes/:id/pin`):** Toggles `is_pinned` boolean. Pinned cakes appear first on homepage.

**Settings (`GET/PATCH /api/admin/settings`):** Reads/writes the `admin_settings` key-value table.

---

### `backend/src/utils/slug.js`
**Auto-generates URL-friendly slugs from cake names.**

e.g. `"Strawberry Dream Cake"` → `"strawberry-dream-cake"`

If slug already exists, appends a number: `"strawberry-dream-cake-2"`

---

## 6. Frontend Files — Every File Explained

### `frontend/src/app/layout.tsx`
**Root layout — wraps every single page.**

Contains:
- `<Navbar />` — always visible at top
- `<main>{children}</main>` — page content
- `<Footer />` — always visible at bottom
- `<CartDrawer />` — always present in DOM (hidden until opened)
- `<Toaster />` from `react-hot-toast` — for success/error notifications

**To change the site title or SEO meta:** Edit the `metadata` export at the top of this file.

**To change toast appearance** (position, style): Edit the `<Toaster />` props.

---

### `frontend/src/app/globals.css`
**All global styles, CSS variables, and design system utility classes.**

This is one of the most important files for visual changes.

**Key sections:**
- `:root {}` — CSS variables for colors, shadows, transitions
- `@layer components {}` — reusable classes like `.btn-primary`, `.input`, `.badge-pink`, `.card`
- `@keyframes` — all animations (fadeUp, float, shimmer, etc.)
- `.bg-pattern` — the cream background with subtle radial gradients
- `.hero-glow` — the pink glow behind the hero section

**To change the primary pink color everywhere:** Change `--pink-500: #f72f7a` in `:root` AND `brand.500: '#f72f7a'` in `tailwind.config.js`.

**Font imports:** First line — Google Fonts import for Cormorant Garamond and DM Sans.

---

### `frontend/tailwind.config.js`
**Design tokens for Tailwind CSS.**

**`colors.brand`** — The pink scale. `brand-500` is the main pink used everywhere.

**`colors.sky`** — The blue scale. `sky-500` is the main blue accent.

**`boxShadow`** — `shadow-pink` and `shadow-pink-lg` are the glowing pink shadows on buttons.

**`keyframes` and `animation`** — All named animations available as Tailwind classes like `animate-float`, `animate-fade-up`.

**To add a new color** that's available everywhere in Tailwind:
```js
colors: {
  brand: { ... },
  mycolor: {
    50: '#fff...',
    500: '#abc...',
  }
}
```
Then use it as `bg-mycolor-500`, `text-mycolor-50` etc.

---

### `frontend/src/lib/api.ts`
**Every single API call the frontend makes is in this file.**

Organized into groups:
- `cakesApi` — list, get, categories, promotions, report, review
- `authApi` — register, login, me, updateProfile, changePassword
- `cartApi` — get, add, update, remove, clear
- `wishlistApi` — get, toggle, remove
- `adminApi` — all admin operations
- `uploadCakeImages(cakeId, files)` — multipart upload
- `imgUrl(url)` — converts a `/uploads/...` path to a full URL

**How the base URL works:**
```
Docker (production): API = "" → calls /api/... → Nginx proxies to backend
Local dev:           API = "http://localhost:3001" → calls backend directly
```

**To add a new API call:**
```ts
export const myApi = {
  doSomething: (id: string) => api.post(`/api/something/${id}`, { data: 'value' }),
}
```

---

### `frontend/src/store/index.ts`
**Global state management with Zustand. Three stores:**

#### `useAuthStore`
```ts
const { user, token, setAuth, logout, updateUser } = useAuthStore()
```
- `user` — the logged-in user object (or null)
- `token` — the JWT string
- `setAuth(user, token)` — call after login/register. Saves token to localStorage.
- `logout()` — clears user, token, removes from localStorage

**Persisted to localStorage** as `cs_auth` — survives page refresh.

#### `useCartStore`
```ts
const { items, total, count, isOpen, openCart, closeCart, setCart } = useCartStore()
```
- `items` — array of cart items
- `count` — total quantity (shown as badge on cart icon)
- `isOpen` — controls whether CartDrawer is visible
- `setCart(items, total)` — syncs cart from API response

**Not persisted** — fetched fresh from API on each page load.

#### `useWishlistStore`
```ts
const { ids, has, toggle, setIds } = useWishlistStore()
```
- `ids` — Set of cake IDs the user has wishlisted
- `has(cakeId)` — returns true/false (used to color the heart icon)
- `toggle(cakeId)` — adds/removes locally (API call is separate)

---

### `frontend/src/components/layout/Navbar.tsx`
**The top navigation bar.** Always visible.

**What it contains:**
- Logo (links to homepage)
- Top promo bar with free delivery message and phone number
- Navigation links (Home, All Cakes, Birthday, Wedding, Custom)
- Search icon → goes to `/cakes?search=`
- Wishlist icon (only shown when logged in)
- Cart icon with item count badge
- User menu (avatar → dropdown with profile, admin link, sign out)
- Mobile hamburger menu

**To change nav links:** Edit the `navLinks` array near the top of the component.

**To change the shop phone in the navbar:** Change `NEXT_PUBLIC_SHOP_PHONE` in `.env.local`.

---

### `frontend/src/components/layout/CartDrawer.tsx`
**Slide-in panel from the right side.** Controlled by `useCartStore().isOpen`.

**What it does:**
- Shows all cart items with image, name, weight, quantity controls
- `+/-` buttons call `cartApi.update()` then refreshes cart
- Trash icon appears when quantity is 1
- Shows subtotal, delivery fee, free delivery progress bar
- "Call to Order" button links to `tel:` the shop phone
- Blocks page scroll when open

**To change delivery logic:** The `delivery` and `grandTotal` variables are calculated locally here based on `total`. Change the threshold (currently ₹500) if needed. The *actual* delivery charge comes from the backend `admin_settings` table but this component currently uses a hardcoded ₹60 — to make it dynamic, fetch settings from API.

---

### `frontend/src/components/cake/CakeCard.tsx`
**The product card shown in grids.** Used on homepage, listing page, wishlist.

**Displays:**
- Cake image (hover → zooms in 5%)
- Badges: Featured (purple), New (blue), Bestseller (amber), Discount % (green)
- Heart/wishlist button (top right of image)
- "Add to Cart" button (appears on hover, slides up from bottom)
- Category label, cake name, short description
- Star rating with review count
- Price and original price (with strikethrough)
- Weight label

**To change card dimensions:** The `aspect-[4/3]` class on the image div controls the ratio.

**To change badge colors:** Find the badge `<span>` elements with `bg-gradient-to-r from-brand-500` etc.

---

### `frontend/src/components/cake/CakeGrid.tsx`
**Renders a responsive grid of `CakeCard` components.**

Grid breakpoints: 1 column mobile → 2 sm → 3 lg → 4 xl

Each card fades up with a stagger delay (`animationDelay: i * 60ms`).

---

### `frontend/src/app/page.tsx`
**The homepage.** Server component (runs on server, no `'use client'`).

**Sections in order:**
1. **Hero** — big heading, CTA buttons, floating cake image, trust badges (Star, Clock, Truck)
2. **Feature strip** — 4 icons: Custom Designs, Fresh Ingredients, Same Day Delivery, Eggless Option
3. **Categories** — grid of category icons/emojis
4. **Featured Cakes** — CakeGrid using `?featured=true`
5. **Promo Banner** — from `promotions` table, `section='featured'`
6. **Bestsellers + New Arrivals** — side-by-side list layout
7. **Call to Action** — big phone CTA card at bottom

**Hero content** comes from the first promotion with `section='hero'`. If no promotion exists, fallback text is hardcoded.

**To change the homepage sections order:** Move the JSX blocks around.

---

### `frontend/src/app/cakes/page.tsx`
**Cake listing/browsing page.** Client component (needs `'use client'` for filters).

**URL parameters it reads:**
- `?category=birthday` — filter by category slug
- `?search=chocolate` — text search
- `?sort=price_asc` — sort order
- `?featured=true` / `?bestseller=true` / `?new=true` — flags
- `?page=2` — pagination

**UI elements:**
- Search bar with clear button
- Filter panel (toggle with "Filters" button)
- Category pill row (scrollable horizontal)
- Active filter badges (click to remove)
- Skeleton loading state
- Pagination buttons

**To change items per page:** Change `limit: 12` in the `useEffect` that calls `cakesApi.list()`.

---

### `frontend/src/app/cakes/[id]/page.tsx`
**Individual cake detail page.** The `[id]` here is actually the **slug** (e.g. `strawberry-dream-cake`).

**Sections:**
- Breadcrumb navigation
- Image gallery (large main image + thumbnail row, with prev/next arrows)
- Cake name, headline, rating stars
- Price with discount
- Short description
- Spec grid (Weight, Serves, Prep Time, Flavours)
- Highlights checklist (from `rich_content.highlights`)
- Quantity selector + Add to Cart button
- Wishlist button + Call to Order button
- "Share" and "Report" text links
- Full description + care instructions
- Customer reviews list + Write Review button
- Allergen list (sidebar)
- Contact card (sidebar)

**Report modal** — opens inline. Requires login. Sends to `POST /api/cakes/:id/report`.

**Review modal** — 5-star rating selector + title + body. Sends to `POST /api/cakes/:id/review`.

---

### `frontend/src/app/auth/login/page.tsx`
**Login page.** On success, calls `setAuth(user, token)` from `useAuthStore`, then redirects. Admins go to `/admin`, customers go to `/`.

**Demo credentials box** is shown — remove it in production.

---

### `frontend/src/app/profile/page.tsx`
**User profile page.** Requires login (redirects to `/auth/login` if not logged in).

Two tabs:
1. **Profile** — edit name and phone
2. **Security** — change password (requires current password)

---

### `frontend/src/app/wishlist/page.tsx`
**Saved cakes page.** Requires login.

Loads wishlist from API, shows cake cards with Remove and Add to Cart buttons.

---

### `frontend/src/app/admin/layout.tsx`
**Admin portal layout — sidebar + auth guard.**

**Auth guard:** If `user` is null or `user.role !== 'admin'`, redirects immediately.

**Sidebar navigation links:** Edit the `NAV` array at the top to add/remove sidebar items.

The sidebar shows the logged-in admin's name and email at the bottom, with a Sign Out button.

---

### `frontend/src/app/admin/page.tsx`
**Admin dashboard.** Loads stats from `GET /api/admin/stats`.

Shows 6 stat cards: Total Cakes, Customers, Wishlist Saves, Cart Items, Reports (with alert if pending > 0), Pinned Cakes.

Also shows Quick Actions grid of 6 links.

---

### `frontend/src/app/admin/cakes/page.tsx`
**Cake management table.** Shows all cakes including hidden ones.

**Table columns:** Index, Image+Name, Category, Price, Rating, Status, Flags (pinned/featured/new/bestseller), Actions

**Actions per row:**
- 📌 Pin/Unpin — toggles `is_pinned` in place
- 👁 View — opens cake page in new tab
- ✏️ Edit — goes to `/admin/cakes/:id`
- 🗑 Delete — confirms then deletes

---

### `frontend/src/app/admin/cakes/new/page.tsx` and `frontend/src/app/admin/cakes/[id]/page.tsx`
Both use the shared `CakeForm` component:
```tsx
// new/page.tsx
return <CakeForm />

// [id]/page.tsx
return <CakeForm cakeId={id} />
```

---

### `frontend/src/components/admin/CakeForm.tsx`
**The main cake create/edit form.** 404 lines. Used for both creating and editing.

**Sections:**
1. Basic Info — name, headline, short description, full description, highlights, care instructions
2. Pricing & Details — price, original price, weight, servings, prep time, stock, category
3. Flavours — tag input
4. Allergens — tag input
5. Tags — tag input
6. **Status Flags** (sidebar) — toggle switches for: Available, Pinned, Featured, Bestseller, New
7. **Image upload** (sidebar) — drag to upload, shows thumbnail grid, delete individual images
8. Danger Zone (edit mode only) — delete cake button

**Image upload flow:**
1. User picks files
2. Previews shown immediately (local blob URLs)
3. On form save → if creating new cake, cake is saved first to get an ID, then images uploaded
4. `uploadCakeImages(cakeId, files)` calls `POST /api/admin/cakes/:id/images` as multipart

---

### `frontend/src/app/admin/categories/page.tsx`
CRUD for categories. Inline editing — click Edit to expand a form within the row.

---

### `frontend/src/app/admin/promotions/page.tsx`
CRUD for homepage banners. Each promotion has a section type (`hero`, `featured`, `banner`). The section determines where on the homepage it appears.

---

### `frontend/src/app/admin/reports/page.tsx`
Lists all user reports with cake name, reporter name, reason, description. Admin can change status to `reviewed`, `resolved`, or `dismissed`.

---

### `frontend/src/app/admin/settings/page.tsx`
Edits `admin_settings` key-value store. Currently manages: Shop Name, Phone, Address, Currency, Delivery Charge, Free Delivery Threshold, Min Order.

---

### `frontend/src/app/admin/users/page.tsx`
Read-only list of all users with name, email, phone, role, join date.

---

## 7. Design System — Colors, Fonts, Components

### Colors

**Primary pink (brand):**
| Token | Hex | Used for |
|---|---|---|
| `brand-50` | `#fff0f6` | Hover backgrounds, light fills |
| `brand-100` | `#ffe0ee` | Borders, light badges |
| `brand-200` | `#ffc2dc` | Scrollbar, selection |
| `brand-400` | `#ff5a9a` | Logo gradient start |
| `brand-500` | `#f72f7a` | **Primary buttons, active states** |
| `brand-600` | `#e00d5e` | Button gradient end, prices |

**Accent blue (sky):**
| Token | Hex | Used for |
|---|---|---|
| `sky-50` | `#f0f9ff` | Admin sidebar hovers |
| `sky-500` | `#0ea5e9` | Admin active nav, sky buttons |
| `sky-600` | `#0284c7` | Sky button gradient end |

**Background:** `#fffdf9` (warm cream) — set on `body` in `globals.css`.

### Fonts

| Font | Role | Class |
|---|---|---|
| Cormorant Garamond | Headings, cake names, display text | `font-display` or `font-family: var(--font-display)` |
| DM Sans | Body text, buttons, labels | Default (set on `body`) |

Loaded from Google Fonts. First line of `globals.css`.

### Reusable CSS Classes (defined in `globals.css`)

| Class | What it looks like |
|---|---|
| `.btn-primary` | Pink gradient rounded button with glow shadow |
| `.btn-secondary` | White button with pink border |
| `.btn-ghost` | Transparent button, pink on hover |
| `.btn-sky` | Blue gradient button |
| `.btn-icon` | Square icon button, 40×40, pink on hover |
| `.card` | White rounded-2xl with shadow |
| `.input` | Rounded input with pink focus ring |
| `.label` | Small grey form label |
| `.badge` | Tiny pill label |
| `.badge-pink` | Pink pill |
| `.badge-sky` | Blue pill |
| `.badge-green` | Green pill |
| `.badge-gold` | Amber pill |
| `.section` | `py-16 md:py-20` section spacing |
| `.section-title` | Large display font heading |
| `.container-narrow` | `max-w-6xl mx-auto px-4...` |
| `.skeleton` | Animated shimmer loading state |

---

## 8. State Management

Three Zustand stores in `frontend/src/store/index.ts`:

### Auth Store — persisted to localStorage
```
useAuthStore()
  .user        → { id, name, email, role, phone, avatar_url }
  .token       → JWT string
  .setAuth()   → call after login/register
  .logout()    → clears everything
  .updateUser()→ update user data without new token
```

### Cart Store — in memory only
```
useCartStore()
  .items       → CartItem[]
  .total       → number (sum of price × quantity)
  .count       → number (total item quantity)
  .isOpen      → boolean (drawer visibility)
  .openCart()  → show drawer
  .closeCart() → hide drawer
  .setCart()   → sync from API response
  .clear()     → empty cart
```

### Wishlist Store — in memory only
```
useWishlistStore()
  .ids         → Set<string> of cake IDs
  .has(id)     → boolean
  .toggle(id)  → add or remove id from set
  .setIds([])  → bulk set from API response
```

---

## 9. API Reference — Every Endpoint

### Base URL
- **Docker / Production:** Calls go to `/api/...` (relative) → Nginx proxies to `http://backend:3001`
- **Local development:** `http://localhost:3001`

### Authentication
All protected endpoints need: `Authorization: Bearer <token>` header.
Admin endpoints additionally require the user's `role` to be `'admin'`.

---

### Auth Endpoints

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | `{ name, email, password, phone? }` | `{ token, user }` |
| `POST` | `/api/auth/login` | None | `{ email, password }` | `{ token, user }` |
| `GET` | `/api/auth/me` | User | — | user object |
| `PATCH` | `/api/auth/me` | User | `{ name?, phone? }` | updated user |
| `POST` | `/api/auth/change-password` | User | `{ currentPassword, newPassword }` | `{ message }` |

---

### Cake Endpoints (Public)

| Method | Path | Query Params | Returns |
|---|---|---|---|
| `GET` | `/api/cakes` | `page, limit, category, featured, bestseller, new, pinned, search, sort, minPrice, maxPrice, tags` | `{ data: [], pagination: {} }` |
| `GET` | `/api/cakes/:slug` | — | Full cake object with images and reviews |
| `GET` | `/api/cakes/meta/categories` | — | Array of categories |
| `GET` | `/api/cakes/meta/promotions` | — | Active promotions |
| `POST` | `/api/cakes/:id/report` | — (User auth) | `{ reason, description? }` | `{ message }` |
| `POST` | `/api/cakes/:id/review` | — (User auth) | `{ rating, title?, body? }` | `{ message }` |

---

### Cart Endpoints

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| `GET` | `/api/cart` | Optional | — | `{ items, total, count }` |
| `POST` | `/api/cart` | Optional | `{ cake_id, quantity? }` | cart item |
| `PATCH` | `/api/cart/:id` | Optional | `{ quantity }` | updated item |
| `DELETE` | `/api/cart/:id` | Optional | — | `{ message }` |
| `DELETE` | `/api/cart` | Optional | — | `{ message }` |

Guest carts need `x-session-id` header. Frontend generates this automatically.

---

### Wishlist Endpoints

| Method | Path | Auth | Returns |
|---|---|---|---|
| `GET` | `/api/wishlist` | User | Array of cakes |
| `POST` | `/api/wishlist/:cakeId` | User | `{ saved: bool, message }` |
| `DELETE` | `/api/wishlist/:cakeId` | User | `{ message }` |

---

### Admin Endpoints (Admin role required for all)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard numbers |
| `GET` | `/api/admin/cakes` | All cakes (incl. hidden), paginated |
| `POST` | `/api/admin/cakes` | Create cake |
| `GET` | `/api/admin/cakes/:id` | Get cake by ID |
| `PATCH` | `/api/admin/cakes/:id` | Update cake fields |
| `DELETE` | `/api/admin/cakes/:id` | Delete cake + images |
| `PATCH` | `/api/admin/cakes/:id/pin` | Toggle is_pinned |
| `PATCH` | `/api/admin/cakes/:id/toggle-availability` | Toggle is_available |
| `POST` | `/api/admin/cakes/:id/images` | Upload images (multipart) |
| `DELETE` | `/api/admin/images/:imageId` | Delete one image |
| `PATCH` | `/api/admin/cakes/:id/images/reorder` | Reorder images |
| `GET` | `/api/admin/categories` | List all categories |
| `POST` | `/api/admin/categories` | Create category |
| `PATCH` | `/api/admin/categories/:id` | Update category |
| `DELETE` | `/api/admin/categories/:id` | Delete category |
| `GET` | `/api/admin/promotions` | List all promotions |
| `POST` | `/api/admin/promotions` | Create promotion |
| `PATCH` | `/api/admin/promotions/:id` | Update promotion |
| `DELETE` | `/api/admin/promotions/:id` | Delete promotion |
| `GET` | `/api/admin/reports` | List reports (optional `?status=pending`) |
| `PATCH` | `/api/admin/reports/:id` | Update report status |
| `GET` | `/api/admin/settings` | Get all settings |
| `PATCH` | `/api/admin/settings` | Update settings (pass key-value object) |
| `GET` | `/api/admin/users` | List all users |

---

### Health Check

| Method | Path | Returns |
|---|---|---|
| `GET` | `/health` | `{ status: 'ok', timestamp, version }` |

---

## 10. Docker & Deployment

### The 5 Services in `docker-compose.yml`

| Service | Container Name | Port | What it does |
|---|---|---|---|
| `postgres` | `cakeshop_db` | Internal only | PostgreSQL database |
| `backend` | `cakeshop_api` | Internal 3001 | Fastify API server |
| `migrate` | `cakeshop_migrate` | — | Runs once: creates tables + seeds data |
| `frontend` | `cakeshop_web` | Internal 3000 | Next.js server |
| `nginx` | `cakeshop_nginx` | **80 → public** | Reverse proxy — only service exposed |

### Docker Volumes

| Volume | Mounts to | Purpose |
|---|---|---|
| `postgres_data` | `/var/lib/postgresql/data` | Persists DB between container restarts |
| `uploads_data` | Backend: `/app/uploads`, Nginx: `/var/www/uploads` | Persists uploaded images |

### Startup Order
```
postgres (healthy) → migrate (runs once) → backend (healthy) → frontend → nginx
```

### `nginx/default.conf` — Routing Rules

| URL Pattern | Goes to | Notes |
|---|---|---|
| `/api/*` | `backend:3001` | All API requests |
| `/uploads/*` | `backend:3001` | Uploaded images |
| `/health` | `backend:3001` | Health check |
| `/_next/static/*` | `frontend:3000` | Next.js static assets (cached 365 days) |
| `/*` (everything else) | `frontend:3000` | All page requests |

### Useful Commands

```bash
# Start everything
docker compose up -d --build

# View live logs
docker compose logs -f

# View only backend logs
docker compose logs -f backend

# Restart just one service
docker compose restart backend

# Stop everything (keeps data)
docker compose down

# Stop and DELETE all data (fresh start)
docker compose down -v

# Re-run DB migrations only
docker compose run --rm migrate node src/db/migrate.js

# Re-run seed data
docker compose run --rm migrate node src/db/seed.js

# Open PostgreSQL shell
docker compose exec postgres psql -U cakeshop -d cakeshop

# Open backend shell
docker compose exec backend sh
```

---

## 11. Environment Variables

### Backend — `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://cakeshop:cakeshop123@localhost:5432/cakeshop` | PostgreSQL connection string |
| `JWT_SECRET` | *(must change)* | Secret for signing JWTs — must be 32+ chars |
| `PORT` | `3001` | Fastify listens on this port |
| `NODE_ENV` | `development` | `development` or `production` |
| `UPLOADS_DIR` | `./uploads` | Where image files are stored |
| `MAX_FILE_SIZE` | `10485760` | Max upload size in bytes (10MB) |
| `ADMIN_EMAIL` | `admin@cakeshop.com` | Used by seed.js to create admin |
| `ADMIN_PASSWORD` | `Admin@123` | Used by seed.js to create admin |
| `FRONTEND_URL` | `*` | CORS allowed origin |

### Frontend — `frontend/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend URL. **Empty string `""` in Docker** |
| `NEXT_PUBLIC_SHOP_PHONE` | `+91-9876543210` | Phone shown in Navbar and buttons |

### Docker environment
In `docker-compose.yml`, `NEXT_PUBLIC_API_URL` is set to `""` (empty string). This makes Next.js call `/api/...` relative paths, which Nginx then proxies to the backend.

---

## 12. Common Change Requests — Where to Go

This section answers "I want to change X, which file do I edit?"

---

**Change the shop name**
→ `frontend/src/app/layout.tsx` (metadata title)
→ `frontend/src/components/layout/Navbar.tsx` (logo text)
→ `frontend/src/components/layout/Footer.tsx` (footer brand)
→ `backend/.env` `ADMIN_EMAIL` domain (optional)
→ `docker-compose.yml` admin_settings or re-seed

**Change the shop phone number**
→ `frontend/.env.local` — `NEXT_PUBLIC_SHOP_PHONE`
→ `docker-compose.yml` — `NEXT_PUBLIC_SHOP_PHONE` arg
→ Admin portal → Settings page → "Shop Phone"

**Change the primary pink color**
→ `frontend/src/app/globals.css` — `--pink-500: #f72f7a`
→ `frontend/tailwind.config.js` — `brand.500: '#f72f7a'`
Both must be updated together.

**Change the heading font**
→ `frontend/src/app/globals.css` — first line (Google Fonts import URL) and `--font-display` variable

**Add a new page**
→ Create `frontend/src/app/your-page/page.tsx`
→ Next.js automatically creates route `/your-page`

**Add a new navigation link**
→ `frontend/src/components/layout/Navbar.tsx` — edit `navLinks` array

**Add a new admin sidebar link**
→ `frontend/src/app/admin/layout.tsx` — edit `NAV` array

**Add a new field to cakes** (e.g. `occasion`)
→ `backend/src/db/migrate.js` — add column to `cakes` table
→ `backend/src/routes/cakes.js` — add to SELECT and WHERE clauses
→ `backend/src/routes/admin.js` — add to INSERT/UPDATE in `createCake`/`updateCake`
→ `frontend/src/components/admin/CakeForm.tsx` — add input field
→ `frontend/src/app/cakes/[id]/page.tsx` — display the new field

**Add a new category**
→ Admin portal → Categories → Add Category
→ Or edit `backend/src/db/seed.js` and re-seed

**Change delivery charge logic**
→ `frontend/src/components/layout/CartDrawer.tsx` — `delivery` and `grandTotal` variables
→ `backend/src/db/seed.js` — `free_delivery_above` and `delivery_charge` in admin_settings
→ Admin portal → Settings (live change without deploy)

**Change the homepage hero text**
→ Admin portal → Promotions → Edit the promotion with section = "hero"
→ Or edit fallback text in `frontend/src/app/page.tsx` Hero section

**Add a new homepage section**
→ `frontend/src/app/page.tsx` — add a new `<section>` block

**Change the number of cakes shown per page**
→ `frontend/src/app/cakes/page.tsx` — change `limit: 12`

**Change JWT token expiry**
→ `backend/src/routes/auth.js` — change `expiresIn: '30d'`

**Change max images per cake**
→ `backend/src/routes/admin.js` — change `if (existing >= 10)` check
→ `frontend/src/components/admin/CakeForm.tsx` — change `images.length + uploadFiles.length < 10` check

**Change max image file size**
→ `backend/.env` / `docker-compose.yml` — `MAX_FILE_SIZE` (bytes)
→ `backend/src/server.js` — `fileSize:` in multipart config

**Add a new admin setting**
→ `backend/src/db/seed.js` — add to `admin_settings` INSERT
→ `frontend/src/app/admin/settings/page.tsx` — add field to `groups` array

**Change thumbnail size**
→ `backend/src/routes/admin.js` — find `sharp(filepath).resize(400, 400` and change dimensions

**Add email notifications**
→ Install `nodemailer` in backend
→ Call from `backend/src/routes/auth.js` (on register) or order routes (Phase 2)

**Add payment (Phase 2)**
→ Install Razorpay SDK in backend
→ Create `backend/src/routes/orders.js`
→ Create `frontend/src/app/checkout/page.tsx`

---

## 13. Local Development Setup

### Requirements
- Node.js 20+
- PostgreSQL 16 running locally
- Git

### Step 1 — Database
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE cakeshop;"
psql -U postgres -c "CREATE USER cakeshop WITH PASSWORD 'cakeshop123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cakeshop TO cakeshop;"
```

### Step 2 — Backend
```bash
cd backend
npm install

# Set up environment
cp .env.example .env
# Edit .env if your Postgres credentials differ

# Create tables
node src/db/migrate.js

# Insert sample data
node src/db/seed.js

# Start dev server (auto-restarts on file changes)
npm run dev
# → Running at http://localhost:3001
# → Test: http://localhost:3001/health
```

### Step 3 — Frontend
```bash
cd frontend
npm install

# .env.local is already created with:
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_SHOP_PHONE=+91-9876543210

npm run dev
# → Running at http://localhost:3000
```

### Step 4 — Open
- Customer: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- API: `http://localhost:3001`
- API Health: `http://localhost:3001/health`

### Default Accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@cakeshop.com | Admin@123 |
| Customer | priya@example.com | Customer@123 |

---

*Documentation version 1.0 — matches codebase Phase 1*
