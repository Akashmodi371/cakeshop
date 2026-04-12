import { query } from '../db/pool.js'
import { authenticateAdmin } from '../middleware/auth.js'
import { createSlug } from '../utils/slug.js'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads'

export default async function adminRoutes(fastify) {
  // Dashboard stats
  fastify.get('/stats', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const [cakes, users, wishlistCount, cartCount, reports] = await Promise.all([
      query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_featured) AS featured, COUNT(*) FILTER (WHERE is_new) AS is_new, COUNT(*) FILTER (WHERE is_pinned) AS pinned FROM cakes'),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE role='customer') AS customers FROM users"),
      query('SELECT COUNT(*) AS total FROM wishlists'),
      query('SELECT COUNT(*) AS total FROM cart_items'),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='pending') AS pending FROM reports"),
    ])
    reply.send({
      cakes: cakes.rows[0],
      users: users.rows[0],
      wishlist: wishlistCount.rows[0],
      cart: cartCount.rows[0],
      reports: reports.rows[0],
    })
  })

  // List all cakes (admin view - includes unavailable)
  fastify.get('/cakes', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { page = 1, limit = 20, search, category } = request.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = []
    const conditions = []
    let p = 1

    if (search) {
      conditions.push(`(c.name ILIKE $${p} OR c.slug ILIKE $${p})`)
      params.push(`%${search}%`)
      p++
    }
    if (category) {
      conditions.push(`cat.slug = $${p++}`)
      params.push(category)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await query(
      `SELECT COUNT(DISTINCT c.id) FROM cakes c LEFT JOIN categories cat ON c.category_id = cat.id ${where}`,
      params
    )

    params.push(parseInt(limit), offset)
    const { rows } = await query(`
      SELECT c.id, c.name, c.slug, c.price, c.original_price, c.rating, c.review_count,
        c.is_featured, c.is_bestseller, c.is_new, c.is_available, c.is_pinned,
        c.stock_count, c.created_at, c.updated_at,
        cat.name AS category_name,
        (SELECT url FROM cake_images WHERE cake_id = c.id AND is_primary = true LIMIT 1) AS primary_image,
        (SELECT COUNT(*) FROM cake_images WHERE cake_id = c.id) AS image_count
      FROM cakes c LEFT JOIN categories cat ON c.category_id = cat.id
      ${where}
      GROUP BY c.id, cat.id
      ORDER BY c.is_pinned DESC, c.created_at DESC
      LIMIT $${p++} OFFSET $${p++}
    `, params)

    reply.send({
      data: rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countRes.rows[0].count) / parseInt(limit))
      }
    })
  })

  // Create cake
  fastify.post('/cakes', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const body = request.body
    const slug = await createSlug(body.name)

    const { rows } = await query(`
      INSERT INTO cakes (
        name, slug, short_description, description, rich_content,
        category_id, price, original_price, weight, servings,
        flavours, allergens, ingredients, customization_options,
        is_featured, is_bestseller, is_new, is_available, is_pinned,
        stock_count, prep_time_hours, tags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [
      body.name, body.slug || slug, body.short_description, body.description,
      body.rich_content ? JSON.stringify(body.rich_content) : null,
      body.category_id || null,
      body.price, body.original_price || null,
      body.weight || null, body.servings || null,
      body.flavours || [], body.allergens || [],
      body.ingredients || [],
      body.customization_options ? JSON.stringify(body.customization_options) : null,
      body.is_featured || false, body.is_bestseller || false,
      body.is_new || false,
      body.is_available !== false,
      body.is_pinned || false,
      body.stock_count || 100,
      body.prep_time_hours || 24,
      body.tags || []
    ])

    reply.code(201).send(rows[0])
  })

  // Get single cake (admin)
  fastify.get('/cakes/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query(`
      SELECT c.*,
        cat.name AS category_name, cat.slug AS category_slug,
        COALESCE(json_agg(
          json_build_object('id', ci.id, 'url', ci.url, 'thumbnail_url', ci.thumbnail_url,
            'alt_text', ci.alt_text, 'is_primary', ci.is_primary, 'display_order', ci.display_order,
            'file_size', ci.file_size, 'width', ci.width, 'height', ci.height)
          ORDER BY ci.is_primary DESC, ci.display_order
        ) FILTER (WHERE ci.id IS NOT NULL), '[]') AS images
      FROM cakes c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN cake_images ci ON ci.cake_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, cat.id
    `, [request.params.id])

    if (rows.length === 0) return reply.code(404).send({ error: 'Cake not found' })
    reply.send(rows[0])
  })

  // Update cake
  fastify.patch('/cakes/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const body = request.body
    const fields = []
    const values = []
    let p = 1

    const updateable = [
      'name', 'slug', 'short_description', 'description', 'category_id',
      'price', 'original_price', 'weight', 'servings', 'flavours', 'allergens',
      'ingredients', 'is_featured', 'is_bestseller', 'is_new', 'is_available',
      'is_pinned', 'stock_count', 'prep_time_hours', 'tags'
    ]

    for (const field of updateable) {
      if (body[field] !== undefined) {
        fields.push(`${field} = $${p++}`)
        values.push(body[field])
      }
    }

    if (body.rich_content !== undefined) {
      fields.push(`rich_content = $${p++}`)
      values.push(JSON.stringify(body.rich_content))
    }

    if (fields.length === 0) return reply.code(400).send({ error: 'No fields to update' })

    fields.push(`updated_at = NOW()`)
    values.push(request.params.id)

    const { rows } = await query(
      `UPDATE cakes SET ${fields.join(', ')} WHERE id = $${p} RETURNING *`,
      values
    )
    if (rows.length === 0) return reply.code(404).send({ error: 'Cake not found' })
    reply.send(rows[0])
  })

  // Delete cake
  fastify.delete('/cakes/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    // Delete associated images from filesystem
    const imgs = await query('SELECT url FROM cake_images WHERE cake_id = $1', [request.params.id])
    for (const img of imgs.rows) {
      try {
        const filePath = path.join(UPLOADS_DIR, path.basename(img.url))
        await fs.unlink(filePath)
      } catch { /* file might not exist */ }
    }

    await query('DELETE FROM cakes WHERE id = $1', [request.params.id])
    reply.send({ message: 'Cake deleted successfully' })
  })

  // Pin/unpin cake
  fastify.patch('/cakes/:id/pin', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query(
      'UPDATE cakes SET is_pinned = NOT is_pinned, updated_at = NOW() WHERE id = $1 RETURNING id, is_pinned',
      [request.params.id]
    )
    reply.send(rows[0])
  })

  // Toggle availability
  fastify.patch('/cakes/:id/toggle-availability', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query(
      'UPDATE cakes SET is_available = NOT is_available, updated_at = NOW() WHERE id = $1 RETURNING id, is_available',
      [request.params.id]
    )
    reply.send(rows[0])
  })

  // Upload images for a cake (up to 10 images, 10MB each)
  fastify.post('/cakes/:id/images', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const cakeId = request.params.id

    // Check existing image count
    const countRes = await query('SELECT COUNT(*) FROM cake_images WHERE cake_id = $1', [cakeId])
    const existing = parseInt(countRes.rows[0].count)
    if (existing >= 10) {
      return reply.code(400).send({ error: 'Maximum 10 images per cake allowed' })
    }

    const parts = request.parts()
    const uploaded = []

    for await (const part of parts) {
      if (part.type !== 'file') continue
      if (existing + uploaded.length >= 10) break

      const ext = path.extname(part.filename).toLowerCase()
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif']
      if (!allowed.includes(ext)) continue

      const filename = `${uuidv4()}${ext}`
      const filepath = path.join(UPLOADS_DIR, filename)

      // Ensure uploads dir exists
      await fs.mkdir(UPLOADS_DIR, { recursive: true })

      // Save the file
      const buffer = await part.toBuffer()
      if (buffer.length > parseInt(process.env.MAX_FILE_SIZE || 10485760)) {
        continue // Skip files over 10MB
      }
      await fs.writeFile(filepath, buffer)

      // Try to get image dimensions with sharp (optional)
      let width, height
      try {
        const sharp = (await import('sharp')).default
        const meta = await sharp(filepath).metadata()
        width = meta.width
        height = meta.height

        // Generate thumbnail
        const thumbName = `thumb_${filename}`
        const thumbPath = path.join(UPLOADS_DIR, thumbName)
        await sharp(filepath)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 95, progressive: true })
        .toFile(thumbPath)
      } catch { /* sharp optional */ }

      const url = `/uploads/${filename}`
      const thumbUrl = width ? `/uploads/thumb_${filename}` : url

      const isPrimary = existing === 0 && uploaded.length === 0
      const order = existing + uploaded.length

      const { rows } = await query(`
        INSERT INTO cake_images (cake_id, url, thumbnail_url, alt_text, display_order, is_primary, file_size, width, height)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [cakeId, url, thumbUrl, part.filename, order, isPrimary, buffer.length, width || null, height || null])

      uploaded.push(rows[0])
    }

    reply.code(201).send({ uploaded, count: uploaded.length })
  })

  // Delete image
  fastify.delete('/images/:imageId', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query('SELECT * FROM cake_images WHERE id = $1', [request.params.imageId])
    if (rows.length === 0) return reply.code(404).send({ error: 'Image not found' })

    // Delete files
    try {
      await fs.unlink(path.join(UPLOADS_DIR, path.basename(rows[0].url)))
      if (rows[0].thumbnail_url !== rows[0].url) {
        await fs.unlink(path.join(UPLOADS_DIR, path.basename(rows[0].thumbnail_url)))
      }
    } catch { /* ignore */ }

    await query('DELETE FROM cake_images WHERE id = $1', [request.params.imageId])

    // If deleted primary, make first remaining primary
    if (rows[0].is_primary) {
      await query(`
        UPDATE cake_images SET is_primary = true
        WHERE id = (SELECT id FROM cake_images WHERE cake_id = $1 ORDER BY display_order LIMIT 1)
      `, [rows[0].cake_id])
    }

    reply.send({ message: 'Image deleted' })
  })

  // Reorder images
  fastify.patch('/cakes/:id/images/reorder', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { order } = request.body // array of { id, display_order, is_primary }
    for (const img of order) {
      await query(
        'UPDATE cake_images SET display_order = $1, is_primary = $2 WHERE id = $3 AND cake_id = $4',
        [img.display_order, img.is_primary || false, img.id, request.params.id]
      )
    }
    reply.send({ message: 'Image order updated' })
  })

  // Categories CRUD
  fastify.get('/categories', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query('SELECT * FROM categories ORDER BY display_order')
    reply.send(rows)
  })

  fastify.post('/categories', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { name, description, display_order } = request.body
    const slug = await createSlug(name)
    const { rows } = await query(
      'INSERT INTO categories (name, slug, description, display_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, slug, description, display_order || 0]
    )
    reply.code(201).send(rows[0])
  })

  fastify.patch('/categories/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { name, description, display_order, is_active } = request.body
    const { rows } = await query(`
      UPDATE categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active)
      WHERE id = $5 RETURNING *
    `, [name, description, display_order, is_active, request.params.id])
    reply.send(rows[0])
  })

  fastify.delete('/categories/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    await query("UPDATE cakes SET category_id = NULL WHERE category_id = $1", [request.params.id])
    await query('DELETE FROM categories WHERE id = $1', [request.params.id])
    reply.send({ message: 'Category deleted' })
  })

  // Promotions CRUD
  fastify.get('/promotions', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query('SELECT * FROM promotions ORDER BY section, display_order')
    reply.send(rows)
  })

  fastify.post('/promotions', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const p = request.body
    const { rows } = await query(`
      INSERT INTO promotions (title, subtitle, badge_text, button_text, button_url, section, display_order, is_active, bg_color, text_color, starts_at, ends_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [p.title, p.subtitle, p.badge_text, p.button_text, p.button_url,
        p.section || 'hero', p.display_order || 0, p.is_active !== false,
        p.bg_color || '#fce4ec', p.text_color || '#ad1457',
        p.starts_at || null, p.ends_at || null])
    reply.code(201).send(rows[0])
  })

  fastify.patch('/promotions/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const p = request.body
    const { rows } = await query(`
      UPDATE promotions SET
        title = COALESCE($1, title), subtitle = COALESCE($2, subtitle),
        badge_text = COALESCE($3, badge_text), button_text = COALESCE($4, button_text),
        button_url = COALESCE($5, button_url), is_active = COALESCE($6, is_active),
        display_order = COALESCE($7, display_order)
      WHERE id = $8 RETURNING *
    `, [p.title, p.subtitle, p.badge_text, p.button_text, p.button_url, p.is_active, p.display_order, request.params.id])
    reply.send(rows[0])
  })

  fastify.delete('/promotions/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    await query('DELETE FROM promotions WHERE id = $1', [request.params.id])
    reply.send({ message: 'Promotion deleted' })
  })

  // Reports management
  fastify.get('/reports', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { status } = request.query
    const { rows } = await query(`
      SELECT r.*, c.name AS cake_name, c.slug AS cake_slug, u.name AS reporter_name
      FROM reports r
      JOIN cakes c ON r.cake_id = c.id
      LEFT JOIN users u ON r.reporter_id = u.id
      ${status ? 'WHERE r.status = $1' : ''}
      ORDER BY r.created_at DESC
    `, status ? [status] : [])
    reply.send(rows)
  })

  fastify.patch('/reports/:id', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { status } = request.body
    const { rows } = await query(`
      UPDATE reports SET status = $1, reviewed_at = NOW(), reviewed_by = $2
      WHERE id = $3 RETURNING *
    `, [status, request.user.id, request.params.id])
    reply.send(rows[0])
  })

  // Settings
  fastify.get('/settings', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query('SELECT key, value FROM admin_settings')
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
    reply.send(settings)
  })

  fastify.patch('/settings', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const updates = request.body
    for (const [key, value] of Object.entries(updates)) {
      await query(`
        INSERT INTO admin_settings (key, value, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
      `, [key, JSON.stringify(value)])
    }
    reply.send({ message: 'Settings updated' })
  })

  // Users list (admin)
  fastify.get('/users', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query(`
      SELECT id, name, email, phone, role, is_verified, created_at
      FROM users ORDER BY created_at DESC
    `)
    reply.send(rows)
  })
}
