import { query } from '../db/pool.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'

export default async function cartRoutes(fastify) {
  // Get cart
  fastify.get('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const userId = request.user?.id
    const sessionId = request.headers['x-session-id']

    if (!userId && !sessionId) return reply.send({ items: [], total: 0 })

    const condition = userId ? 'ci.user_id = $1' : 'ci.session_id = $1'
    const param = userId || sessionId

    const { rows } = await query(`
      SELECT ci.id, ci.quantity, ci.customization,
        c.id AS cake_id, c.name, c.slug, c.price, c.original_price,
        c.weight, c.is_available, c.stock_count,
        (SELECT url FROM cake_images WHERE cake_id = c.id AND is_primary = true LIMIT 1) AS image_url
      FROM cart_items ci
      JOIN cakes c ON ci.cake_id = c.id
      WHERE ${condition}
      ORDER BY ci.created_at DESC
    `, [param])

    const total = rows.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    reply.send({ items: rows, total: parseFloat(total.toFixed(2)), count: rows.length })
  })

  // Add to cart
  fastify.post('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { cake_id, quantity = 1, customization = {} } = request.body
    const userId = request.user?.id
    const sessionId = request.headers['x-session-id']

    // Check cake availability
    const cakeRes = await query('SELECT id, is_available, stock_count FROM cakes WHERE id = $1', [cake_id])
    if (cakeRes.rows.length === 0) return reply.code(404).send({ error: 'Cake not found' })
    if (!cakeRes.rows[0].is_available) return reply.code(400).send({ error: 'Cake is not available' })

    const condition = userId ? 'user_id = $1 AND cake_id = $2' : 'session_id = $1 AND cake_id = $2'
    const param = userId || sessionId

    const existing = await query(
      `SELECT id, quantity FROM cart_items WHERE ${condition}`,
      [param, cake_id]
    )

    if (existing.rows.length > 0) {
      const newQty = existing.rows[0].quantity + quantity
      const { rows } = await query(
        'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newQty, existing.rows[0].id]
      )
      return reply.send(rows[0])
    }

    const { rows } = await query(`
      INSERT INTO cart_items (user_id, session_id, cake_id, quantity, customization)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [userId || null, sessionId || null, cake_id, quantity, JSON.stringify(customization)])

    reply.code(201).send(rows[0])
  })

  // Update cart item
  fastify.patch('/:id', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { quantity } = request.body
    if (quantity < 1) {
      await query('DELETE FROM cart_items WHERE id = $1', [request.params.id])
      return reply.send({ message: 'Item removed' })
    }
    const { rows } = await query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [quantity, request.params.id]
    )
    reply.send(rows[0])
  })

  // Remove from cart
  fastify.delete('/:id', { preHandler: [optionalAuth] }, async (request, reply) => {
    await query('DELETE FROM cart_items WHERE id = $1', [request.params.id])
    reply.send({ message: 'Item removed from cart' })
  })

  // Clear cart
  fastify.delete('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const userId = request.user?.id
    const sessionId = request.headers['x-session-id']
    const param = userId || sessionId
    const field = userId ? 'user_id' : 'session_id'
    await query(`DELETE FROM cart_items WHERE ${field} = $1`, [param])
    reply.send({ message: 'Cart cleared' })
  })
}
