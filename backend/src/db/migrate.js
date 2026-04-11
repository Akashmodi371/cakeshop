import { pool } from './pool.js'
import 'dotenv/config'

const migrations = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Categories
  CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Cakes (main product table)
  CREATE TABLE IF NOT EXISTS cakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    rich_content JSONB,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    weight VARCHAR(50),
    servings VARCHAR(50),
    flavours TEXT[],
    allergens TEXT[],
    ingredients TEXT[],
    customization_options JSONB,
    is_featured BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    stock_count INTEGER DEFAULT 100,
    prep_time_hours INTEGER DEFAULT 24,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    tags TEXT[],
    meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_cakes_category ON cakes(category_id);
  CREATE INDEX IF NOT EXISTS idx_cakes_featured ON cakes(is_featured) WHERE is_featured = true;
  CREATE INDEX IF NOT EXISTS idx_cakes_pinned ON cakes(is_pinned) WHERE is_pinned = true;
  CREATE INDEX IF NOT EXISTS idx_cakes_search ON cakes USING gin(to_tsvector('english', name || ' ' || COALESCE(short_description, '')));

  -- Cake images
  CREATE TABLE IF NOT EXISTS cake_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cake_id UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_cake_images_cake ON cake_images(cake_id);

  -- Cart items
  CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    cake_id UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    customization JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);

  -- Wishlist
  CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cake_id UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cake_id)
  );
  CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);

  -- Reports / flags on cakes
  CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cake_id UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
  );

  -- Promotions / banners
  CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    badge_text VARCHAR(50),
    image_url TEXT,
    button_text VARCHAR(100),
    button_url VARCHAR(500),
    bg_color VARCHAR(20) DEFAULT '#fce4ec',
    text_color VARCHAR(20) DEFAULT '#ad1457',
    section VARCHAR(50) DEFAULT 'hero' CHECK (section IN ('hero','featured','banner','popup')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Admin settings (key-value store)
  CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Reviews
  CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cake_id UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    body TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cake_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_cake ON reviews(cake_id);

  -- Function to update updated_at
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS cakes_updated_at ON cakes;
  CREATE TRIGGER cakes_updated_at BEFORE UPDATE ON cakes FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
  DROP TRIGGER IF EXISTS users_updated_at ON users;
  CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
  DROP TRIGGER IF EXISTS cart_updated_at ON cart_items;
  CREATE TRIGGER cart_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

  -- Default admin settings
  INSERT INTO admin_settings (key, value) VALUES
    ('shop_name', '"Sweet Bliss Cakery"'),
    ('shop_phone', '"+91-9876543210"'),
    ('shop_address', '"123 Cake Lane, Indore, MP"'),
    ('currency', '"INR"'),
    ('currency_symbol', '"₹"'),
    ('delivery_charge', '60'),
    ('free_delivery_above', '500'),
    ('min_order', '299')
  ON CONFLICT (key) DO NOTHING;
`

async function migrate() {
  console.log('🎂 Running database migrations...')
  try {
    const client = await pool.connect()
    await client.query(migrations)
    client.release()
    console.log('✅ Migrations completed successfully')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

migrate()
