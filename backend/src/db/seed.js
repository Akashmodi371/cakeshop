import { pool } from './pool.js'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

async function seed() {
  console.log('🌱 Seeding database...')
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Admin user
    const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ('Admin', $1, $2, 'admin', true)
      ON CONFLICT (email) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@cakeshop.com', adminHash])

    // Demo customer
    const custHash = await bcrypt.hash('Customer@123', 12)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ('Priya Sharma', 'priya@example.com', $1, 'customer', true)
      ON CONFLICT (email) DO NOTHING
    `, [custHash])

    // Categories
    const categories = [
      { name: 'Birthday Cakes', slug: 'birthday', description: 'Make every birthday magical', order: 1 },
      { name: 'Wedding Cakes', slug: 'wedding', description: 'Elegant cakes for your big day', order: 2 },
      { name: 'Anniversary Cakes', slug: 'anniversary', description: 'Celebrate love with style', order: 3 },
      { name: 'Custom Cakes', slug: 'custom', description: 'Tailored to your imagination', order: 4 },
      { name: 'Cup Cakes', slug: 'cupcakes', description: 'Perfect bite-sized delights', order: 5 },
      { name: 'Cheesecakes', slug: 'cheesecake', description: 'Creamy, dreamy perfection', order: 6 },
    ]

    for (const cat of categories) {
      await client.query(`
        INSERT INTO categories (name, slug, description, display_order)
        VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING
      `, [cat.name, cat.slug, cat.description, cat.order])
    }

    const { rows: cats } = await client.query('SELECT id, slug FROM categories')
    const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]))

    // Sample cakes
    const cakes = [
      {
        name: 'Strawberry Dream Cake',
        slug: 'strawberry-dream-cake',
        short_description: 'Fresh strawberry layers with vanilla cream frosting',
        price: 749, original_price: 899,
        category: 'birthday', weight: '1 Kg', servings: '8-10',
        flavours: ['Strawberry', 'Vanilla'],
        is_featured: true, is_bestseller: true, is_new: true,
        tags: ['popular', 'fruity', 'classic'],
        rating: 4.8, review_count: 124
      },
      {
        name: 'Chocolate Truffle Royale',
        slug: 'chocolate-truffle-royale',
        short_description: 'Rich Belgian chocolate with truffle ganache layers',
        price: 899, original_price: 1099,
        category: 'birthday', weight: '1 Kg', servings: '8-10',
        flavours: ['Dark Chocolate', 'Truffle'],
        is_featured: true, is_bestseller: true,
        tags: ['chocolate-lover', 'rich', 'indulgent'],
        rating: 4.9, review_count: 256
      },
      {
        name: 'Rose & Pistachio Wedding Tier',
        slug: 'rose-pistachio-wedding-tier',
        short_description: 'Elegant 3-tier wedding cake with rose cream and pistachios',
        price: 3499, original_price: 4200,
        category: 'wedding', weight: '3 Kg', servings: '30-35',
        flavours: ['Rose', 'Pistachio', 'Vanilla'],
        is_featured: true, is_pinned: true,
        tags: ['wedding', 'premium', 'elegant'],
        rating: 4.9, review_count: 48
      },
      {
        name: 'Blueberry Cheesecake Classic',
        slug: 'blueberry-cheesecake-classic',
        short_description: 'New York style baked cheesecake with blueberry compote',
        price: 649, original_price: 749,
        category: 'cheesecake', weight: '750 gm', servings: '6-8',
        flavours: ['Blueberry', 'Cream Cheese'],
        is_featured: true, is_new: true,
        tags: ['cheesecake', 'baked', 'fruity'],
        rating: 4.7, review_count: 89
      },
      {
        name: 'Red Velvet Anniversary',
        slug: 'red-velvet-anniversary',
        short_description: 'Velvety red layers with cream cheese frosting and gold accents',
        price: 999, original_price: 1199,
        category: 'anniversary', weight: '1.5 Kg', servings: '12-15',
        flavours: ['Red Velvet', 'Cream Cheese'],
        is_featured: true, is_bestseller: true,
        tags: ['anniversary', 'romantic', 'premium'],
        rating: 4.8, review_count: 167
      },
      {
        name: 'Mango Tango Delight',
        slug: 'mango-tango-delight',
        short_description: 'Alphonso mango mousse cake with fresh mango slices',
        price: 799, original_price: 949,
        category: 'birthday', weight: '1 Kg', servings: '8-10',
        flavours: ['Mango', 'Vanilla'],
        is_new: true,
        tags: ['seasonal', 'mango', 'summer'],
        rating: 4.6, review_count: 43
      },
      {
        name: 'Rainbow Funfetti Cupcakes',
        slug: 'rainbow-funfetti-cupcakes',
        short_description: 'Colorful funfetti cupcakes with rainbow swirl frosting (set of 12)',
        price: 549, original_price: 649,
        category: 'cupcakes', weight: '600 gm', servings: '12 pcs',
        flavours: ['Vanilla', 'Rainbow'],
        is_bestseller: true, is_new: true,
        tags: ['cupcakes', 'kids', 'colorful', 'party'],
        rating: 4.7, review_count: 78
      },
      {
        name: 'Black Forest Supreme',
        slug: 'black-forest-supreme',
        short_description: 'Classic German black forest with kirsch cherries and whipped cream',
        price: 849, original_price: 999,
        category: 'birthday', weight: '1 Kg', servings: '8-10',
        flavours: ['Chocolate', 'Cherry'],
        is_bestseller: true,
        tags: ['classic', 'german', 'chocolate', 'cherry'],
        rating: 4.8, review_count: 192
      },
    ]

    for (const cake of cakes) {
      const { rows } = await client.query(`
        INSERT INTO cakes (
          name, slug, short_description, price, original_price, category_id,
          weight, servings, flavours, is_featured, is_bestseller, is_new,
          is_pinned, tags, rating, review_count,
          description, rich_content
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [
        cake.name, cake.slug, cake.short_description,
        cake.price, cake.original_price || null,
        catMap[cake.category] || null,
        cake.weight, cake.servings,
        cake.flavours,
        cake.is_featured || false, cake.is_bestseller || false,
        cake.is_new || false, cake.is_pinned || false,
        cake.tags,
        cake.rating || 0, cake.review_count || 0,
        `${cake.short_description} Our bakers craft each cake with the finest ingredients, ensuring every slice is a celebration. Made fresh to order with 24-hour prep time.`,
        JSON.stringify({
          headline: cake.name,
          highlights: ['100% Fresh Ingredients', 'Eggless option available', 'Custom message on cake', 'Same-day delivery available'],
          care_instructions: 'Refrigerate below 4°C. Consume within 3 days.'
        })
      ])

      // Seed placeholder images for each cake (real URLs to Unsplash)
      const imageUrls = [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
        'https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=800',
        'https://images.unsplash.com/photo-1464349095431-e9a21285b19c?w=800',
      ]
      for (let i = 0; i < Math.min(3, imageUrls.length); i++) {
        await client.query(`
          INSERT INTO cake_images (cake_id, url, thumbnail_url, alt_text, display_order, is_primary)
          VALUES ($1, $2, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `, [rows[0].id, imageUrls[i], `${cake.name} - image ${i + 1}`, i, i === 0])
      }
    }

    // Promotions
    await client.query(`
      INSERT INTO promotions (title, subtitle, badge_text, button_text, button_url, section, display_order, is_active)
      VALUES 
        ('Celebrate Every Moment', 'Handcrafted cakes made with love — delivered fresh to your door', 'Free Delivery Above ₹500', 'Shop Now', '/cakes', 'hero', 1, true),
        ('20% Off on Wedding Cakes', 'Book your dream wedding cake this month', 'Limited Offer', 'Explore', '/cakes?category=wedding', 'featured', 1, true)
      ON CONFLICT DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('✅ Seeding completed!')
    console.log('  Admin: admin@cakeshop.com / Admin@123')
    console.log('  Customer: priya@example.com / Customer@123')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', err)
    process.exit(1)
  } finally {
    client.release()
  }
}

seed()
