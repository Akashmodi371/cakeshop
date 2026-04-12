import { query } from '../db/pool.js'
import { optionalAuth, authenticate } from '../middleware/auth.js'

const CAKE_SELECT = `
  c.id, c.name, c.slug, c.short_description, c.price, c.original_price,
  c.weight, c.servings,
  COALESCE(c.flavours, ARRAY[]::text[]) as flavours,
  COALESCE(c.allergens, ARRAY[]::text[]) as allergens,
  COALESCE(c.ingredients, ARRAY[]::text[]) as ingredients,
  c.customization_options, c.is_featured, c.is_bestseller, c.is_new,
  c.is_available, c.is_pinned, c.stock_count, c.prep_time_hours,
  c.rating, c.review_count, c.tags, c.rich_content, c.description,
  c.created_at, c.updated_at,
  cat.name AS category_name, cat.slug AS category_slug,
  COALESCE(
    json_agg(
      json_build_object('id', ci.id, 'url', ci.url, 'thumbnail_url', ci.thumbnail_url,
        'alt_text', ci.alt_text, 'is_primary', ci.is_primary, 'display_order', ci.display_order)
      ORDER BY ci.is_primary DESC, ci.display_order ASC
    ) FILTER (WHERE ci.id IS NOT NULL), '[]'
  ) AS images
`

const CAKE_FROM = `
  FROM cakes c
  LEFT JOIN categories cat ON c.category_id = cat.id
  LEFT JOIN cake_images ci ON ci.cake_id = c.id
`

export default async function cakeRoutes(fastify) {

  // ── IMPORTANT: Static routes BEFORE /:slug ──────────────────────

  // Get categories
  fastify.get('/meta/categories', async (request, reply) => {
    const { rows } = await query(`
      SELECT cat.*, COUNT(c.id) FILTER (WHERE c.is_available = true) AS cake_count
      FROM categories cat
      LEFT JOIN cakes c ON c.category_id = cat.id
      WHERE cat.is_active = true
      GROUP BY cat.id
      ORDER BY cat.display_order
    `)
    reply.send(rows)
  })

  // Get promotions/banners
  fastify.get('/meta/promotions', async (request, reply) => {
    const { rows } = await query(`
      SELECT * FROM promotions
      WHERE is_active = true
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY section, display_order
    `)
    reply.send(rows)
  })

  // ── List cakes ───────────────────────────────────────────────────
  fastify.get('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const {
      page = 1, limit = 12, category, featured, bestseller,
      new: isNew, pinned, search, sort = 'pinned', minPrice, maxPrice,
      tags
    } = request.query

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conditions = ['c.is_available = true']
    const params = []
    let p = 1

    if (category) { conditions.push(`cat.slug = $${p++}`); params.push(category) }
    if (featured === 'true') { conditions.push('c.is_featured = true') }
    if (bestseller === 'true') { conditions.push('c.is_bestseller = true') }
    if (isNew === 'true') { conditions.push('c.is_new = true') }
    if (pinned === 'true') { conditions.push('c.is_pinned = true') }
    if (minPrice) { conditions.push(`c.price >= $${p++}`); params.push(minPrice) }
    if (maxPrice) { conditions.push(`c.price <= $${p++}`); params.push(maxPrice) }
    if (tags) { conditions.push(`c.tags && $${p++}`); params.push(tags.split(',')) }
    if (search) {
      conditions.push(`(
        to_tsvector('english', c.name || ' ' || COALESCE(c.short_description,'')) @@ plainto_tsquery('english', $${p})
        OR c.name ILIKE $${p + 1}
      )`)
      params.push(search, `%${search}%`)
      p += 2
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const sortMap = {
      pinned: 'c.is_pinned DESC, c.is_featured DESC, c.rating DESC',
      price_asc: 'c.price ASC',
      price_desc: 'c.price DESC',
      rating: 'c.rating DESC, c.review_count DESC',
      newest: 'c.created_at DESC',
      popular: 'c.review_count DESC, c.rating DESC',
    }
    const orderBy = sortMap[sort] || sortMap.pinned

    const countRes = await query(
      `SELECT COUNT(DISTINCT c.id) FROM cakes c LEFT JOIN categories cat ON c.category_id = cat.id ${where}`,
      params
    )
    const total = parseInt(countRes.rows[0].count)

    params.push(parseInt(limit), offset)
    const { rows } = await query(`
      SELECT ${CAKE_SELECT}
      ${CAKE_FROM}
      ${where}
      GROUP BY c.id, cat.id
      ORDER BY ${orderBy}
      LIMIT $${p++} OFFSET $${p++}
    `, params)

    reply.send({
      data: rows,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  })

  // ── Get single cake by slug ───────────────────────────────────────
  fastify.get('/:slug', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { rows } = await query(`
      SELECT ${CAKE_SELECT},
        (SELECT json_agg(
          json_build_object('id', r.id, 'rating', r.rating, 'title', r.title, 'body', r.body,
            'created_at', r.created_at, 'user_name', u.name)
          ORDER BY r.created_at DESC LIMIT 10
        ) FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.cake_id = c.id) AS recent_reviews
      ${CAKE_FROM}
      WHERE c.slug = $1
      GROUP BY c.id, cat.id
    `, [request.params.slug])

    if (rows.length === 0) return reply.code(404).send({ error: 'Cake not found' })

    let inWishlist = false
    if (request.user) {
      const wl = await query(
        'SELECT id FROM wishlists WHERE user_id = $1 AND cake_id = $2',
        [request.user.id, rows[0].id]
      )
      inWishlist = wl.rows.length > 0
    }

    reply.send({ ...rows[0], in_wishlist: inWishlist })
  })

  // ── Report a cake ─────────────────────────────────────────────────
  fastify.post('/:id/report', { preHandler: [authenticate] }, async (request, reply) => {
    const { reason, description } = request.body
    await query(`
      INSERT INTO reports (cake_id, reporter_id, reason, description)
      VALUES ($1, $2, $3, $4)
    `, [request.params.id, request.user.id, reason, description])
    reply.code(201).send({ message: 'Report submitted successfully' })
  })

  // ── Add review ────────────────────────────────────────────────────
  fastify.post('/:id/review', { preHandler: [authenticate] }, async (request, reply) => {
    const { rating, title, body } = request.body
    await query(`
      INSERT INTO reviews (cake_id, user_id, rating, title, body)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cake_id, user_id) DO UPDATE SET rating=$3, title=$4, body=$5
    `, [request.params.id, request.user.id, rating, title, body])

    await query(`
      UPDATE cakes SET
        rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE cake_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE cake_id = $1)
      WHERE id = $1
    `, [request.params.id])

    reply.code(201).send({ message: 'Review submitted' })
  })
}