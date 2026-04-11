import { pool } from './pool.js'
import 'dotenv/config'

export async function runStartup() {
  console.log('🔄 Running migrations...')
  
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
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

    CREATE TABLE IF NOT EXISTS wishlists (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cake_id UUID NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, cake_id)
    );

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
      section VARCHAR(50) DEFAULT 'hero',
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

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
  `)

  console.log('✅ Migrations done.')

  // Seed admin user
  const bcrypt = (await import('bcryptjs')).default
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12)
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role, is_verified)
    VALUES ('Admin', $1, $2, 'admin', true)
    ON CONFLICT (email) DO NOTHING
  `, [process.env.ADMIN_EMAIL || 'admin@cakeshop.com', adminHash])

  // Seed categories
  const categories = [
    ['Birthday Cakes', 'birthday', 'Make every birthday magical', 1],
    ['Wedding Cakes', 'wedding', 'Elegant cakes for your big day', 2],
    ['Anniversary Cakes', 'anniversary', 'Celebrate love with style', 3],
    ['Custom Cakes', 'custom', 'Tailored to your imagination', 4],
    ['Cup Cakes', 'cupcakes', 'Perfect bite-sized delights', 5],
    ['Cheesecakes', 'cheesecake', 'Creamy, dreamy perfection', 6],
  ]
  for (const [name, slug, desc, order] of categories) {
    await pool.query(
      'INSERT INTO categories (name, slug, description, display_order) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO NOTHING',
      [name, slug, desc, order]
    )
  }

  // Seed promotions
  await pool.query(`
    INSERT INTO promotions (title, subtitle, badge_text, button_text, button_url, section, display_order, is_active)
    VALUES 
      ('Celebrate Every Moment', 'Handcrafted cakes made with love — delivered fresh to your door', 'Free Delivery Above ₹500', 'Shop Now', '/cakes', 'hero', 1, true),
      ('20% Off on Wedding Cakes', 'Book your dream wedding cake this month', 'Limited Offer', 'Explore', '/cakes?category=wedding', 'featured', 1, true)
    ON CONFLICT DO NOTHING
  `)


  // Seed cakes
  const { rows: cats } = await pool.query('SELECT id, slug FROM categories')
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]))

  const cakes = [
    ['Strawberry Dream Cake', 'strawberry-dream-cake', 'Fresh strawberry layers with vanilla cream frosting', 749, 899, 'birthday', '1 Kg', '8-10', ['Strawberry','Vanilla'], true, true, true, ['popular','fruity'], 4.8, 124],
    ['Chocolate Truffle Royale', 'chocolate-truffle-royale', 'Rich Belgian chocolate with truffle ganache layers', 899, 1099, 'birthday', '1 Kg', '8-10', ['Dark Chocolate','Truffle'], true, true, false, ['chocolate-lover','rich'], 4.9, 256],
    ['Rose & Pistachio Wedding Tier', 'rose-pistachio-wedding-tier', 'Elegant 3-tier wedding cake with rose cream and pistachios', 3499, 4200, 'wedding', '3 Kg', '30-35', ['Rose','Pistachio'], true, false, false, ['wedding','premium'], 4.9, 48],
    ['Blueberry Cheesecake Classic', 'blueberry-cheesecake-classic', 'New York style baked cheesecake with blueberry compote', 649, 749, 'cheesecake', '750 gm', '6-8', ['Blueberry','Cream Cheese'], true, false, true, ['cheesecake','baked'], 4.7, 89],
    ['Red Velvet Anniversary', 'red-velvet-anniversary', 'Velvety red layers with cream cheese frosting and gold accents', 999, 1199, 'anniversary', '1.5 Kg', '12-15', ['Red Velvet','Cream Cheese'], true, true, false, ['anniversary','romantic'], 4.8, 167],
    ['Mango Tango Delight', 'mango-tango-delight', 'Alphonso mango mousse cake with fresh mango slices', 799, 949, 'birthday', '1 Kg', '8-10', ['Mango','Vanilla'], false, false, true, ['seasonal','mango'], 4.6, 43],
    ['Rainbow Funfetti Cupcakes', 'rainbow-funfetti-cupcakes', 'Colorful funfetti cupcakes with rainbow swirl frosting (set of 12)', 549, 649, 'cupcakes', '600 gm', '12 pcs', ['Vanilla','Rainbow'], false, true, true, ['cupcakes','kids'], 4.7, 78],
    ['Black Forest Supreme', 'black-forest-supreme', 'Classic German black forest with kirsch cherries and whipped cream', 849, 999, 'birthday', '1 Kg', '8-10', ['Chocolate','Cherry'], false, true, false, ['classic','chocolate'], 4.8, 192],
  ]

  for (const [name, slug, short_desc, price, orig_price, cat, weight, servings, flavours, is_featured, is_bestseller, is_new, tags, rating, review_count] of cakes) {
    const { rows } = await pool.query(`
      INSERT INTO cakes (name, slug, short_description, price, original_price, category_id, weight, servings, flavours, is_featured, is_bestseller, is_new, is_pinned, tags, rating, review_count, is_available, description, rich_content)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,$13,$14,$15,true,$16,$17)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `, [name, slug, short_desc, price, orig_price, catMap[cat], weight, servings, flavours, is_featured, is_bestseller, is_new, tags, rating, review_count,
        `${short_desc} Our bakers craft each cake with the finest ingredients, ensuring every slice is a celebration.`,
        JSON.stringify({ headline: name, highlights: ['100% Fresh Ingredients','Eggless option available','Custom message on cake','Same-day delivery available'], care_instructions: 'Refrigerate below 4°C. Consume within 3 days.' })
    ])

    // Add sample image for each cake
    if (rows.length > 0) {
      await pool.query(`
        INSERT INTO cake_images (cake_id, url, thumbnail_url, alt_text, display_order, is_primary)
        VALUES ($1, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', $2, 0, true)
        ON CONFLICT DO NOTHING
      `, [rows[0].id, name])
    }
  }

  console.log('✅ Cakes seeded.')
}