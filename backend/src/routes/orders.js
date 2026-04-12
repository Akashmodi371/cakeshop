import { query } from '../db/pool.js'
import { authenticate, authenticateAdmin } from '../middleware/auth.js'

function generateOrderNumber() {
  const date = new Date()
  const d = date.toISOString().slice(2,10).replace(/-/g,'')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `ACH-${d}-${rand}`
}

export default async function orderRoutes(fastify) {

  // ── Customer: Place order ────────────────────────────────────────
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const {
      cake_id, quantity = 1, delivery_date, delivery_time,
      delivery_address, special_instructions
    } = request.body

    // Get cake details
    const cakeRes = await query('SELECT id, name, price, is_available FROM cakes WHERE id = $1', [cake_id])
    if (cakeRes.rows.length === 0) return reply.code(404).send({ error: 'Cake not found' })
    const cake = cakeRes.rows[0]
    if (!cake.is_available) return reply.code(400).send({ error: 'Cake not available' })

    const total_amount = parseFloat(cake.price) * quantity
    const advance_amount = parseFloat((total_amount * 0.5).toFixed(2))
    const order_number = generateOrderNumber()

    const { rows } = await query(`
      INSERT INTO orders (
        order_number, user_id, cake_id, quantity, cake_name, cake_price,
        total_amount, advance_amount, delivery_date, delivery_time,
        delivery_address, special_instructions, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending_payment')
      RETURNING *
    `, [
      order_number, request.user.id, cake_id, quantity,
      cake.name, cake.price, total_amount, advance_amount,
      delivery_date || null, delivery_time || null,
      delivery_address || null, special_instructions || null
    ])

    // Add to status history
    await query(`
      INSERT INTO order_status_history (order_id, status, note, updated_by)
      VALUES ($1, 'pending_payment', 'Order placed, awaiting advance payment', $2)
    `, [rows[0].id, request.user.id])

    reply.code(201).send(rows[0])
  })

  // ── Customer: My orders ──────────────────────────────────────────
  fastify.get('/my', { preHandler: [authenticate] }, async (request, reply) => {
    const { rows } = await query(`
      SELECT o.*,
        (SELECT url FROM cake_images WHERE cake_id = o.cake_id AND is_primary = true LIMIT 1) AS cake_image,
        (SELECT json_agg(
          json_build_object('status', h.status, 'note', h.note, 'created_at', h.created_at)
          ORDER BY h.created_at ASC
        ) FROM order_status_history h WHERE h.order_id = o.id) AS history
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [request.user.id])
    reply.send(rows)
  })

  // ── Customer: Single order ───────────────────────────────────────
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { rows } = await query(`
      SELECT o.*,
        (SELECT url FROM cake_images WHERE cake_id = o.cake_id AND is_primary = true LIMIT 1) AS cake_image,
        (SELECT json_agg(
          json_build_object('status', h.status, 'note', h.note, 'created_at', h.created_at)
          ORDER BY h.created_at ASC
        ) FROM order_status_history h WHERE h.order_id = o.id) AS history
      FROM orders o
      WHERE o.id = $1 AND o.user_id = $2
    `, [request.params.id, request.user.id])
    if (rows.length === 0) return reply.code(404).send({ error: 'Order not found' })
    reply.send(rows[0])
  })

  // ── Admin: All orders ────────────────────────────────────────────
  fastify.get('/admin/all', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { status, page = 1, limit = 20 } = request.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const where = status ? `WHERE o.status = $1` : ''
    const params = status ? [status, parseInt(limit), offset] : [parseInt(limit), offset]
    const p = status ? 4 : 3

    const { rows } = await query(`
      SELECT o.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
        (SELECT url FROM cake_images WHERE cake_id = o.cake_id AND is_primary = true LIMIT 1) AS cake_image
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}
    `, params)

    const countRes = await query(
      `SELECT COUNT(*) FROM orders o ${where}`,
      status ? [status] : []
    )

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

  // ── Admin: Update order status ───────────────────────────────────
  fastify.patch('/admin/:id/status', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { status, note } = request.body

    const { rows } = await query(`
      UPDATE orders SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [status, note, request.params.id])

    if (rows.length === 0) return reply.code(404).send({ error: 'Order not found' })

    await query(`
      INSERT INTO order_status_history (order_id, status, note, updated_by)
      VALUES ($1, $2, $3, $4)
    `, [request.params.id, status, note || null, request.user.id])

    reply.send(rows[0])
  })

  // ── Admin: Confirm payment received ─────────────────────────────
  fastify.patch('/admin/:id/confirm-payment', { preHandler: [authenticateAdmin] }, async (request, reply) => {
    const { rows } = await query(`
      UPDATE orders SET status = 'payment_received', updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [request.params.id])

    await query(`
      INSERT INTO order_status_history (order_id, status, note, updated_by)
      VALUES ($1, 'payment_received', 'Advance payment confirmed by admin', $2)
    `, [request.params.id, request.user.id])

    reply.send(rows[0])
  })
}