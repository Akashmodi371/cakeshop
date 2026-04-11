import { query } from '../db/pool.js'
import { authenticate } from '../middleware/auth.js'

export default async function wishlistRoutes(fastify) {
  // Get wishlist
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { rows } = await query(`
      SELECT w.id AS wishlist_id, w.created_at AS saved_at,
        c.id, c.name, c.slug, c.price, c.original_price, c.rating, c.review_count,
        c.short_description, c.is_available, c.is_new, c.is_bestseller,
        (SELECT url FROM cake_images WHERE cake_id = c.id AND is_primary = true LIMIT 1) AS image_url
      FROM wishlists w
      JOIN cakes c ON w.cake_id = c.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [request.user.id])
    reply.send(rows)
  })

  // Toggle wishlist
  fastify.post('/:cakeId', { preHandler: [authenticate] }, async (request, reply) => {
    const { cakeId } = request.params
    const existing = await query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND cake_id = $2',
      [request.user.id, cakeId]
    )

    if (existing.rows.length > 0) {
      await query('DELETE FROM wishlists WHERE user_id = $1 AND cake_id = $2',
        [request.user.id, cakeId])
      return reply.send({ saved: false, message: 'Removed from wishlist' })
    }

    await query('INSERT INTO wishlists (user_id, cake_id) VALUES ($1, $2)',
      [request.user.id, cakeId])
    reply.code(201).send({ saved: true, message: 'Added to wishlist' })
  })

  // Remove from wishlist
  fastify.delete('/:cakeId', { preHandler: [authenticate] }, async (request, reply) => {
    await query('DELETE FROM wishlists WHERE user_id = $1 AND cake_id = $2',
      [request.user.id, request.params.cakeId])
    reply.send({ message: 'Removed from wishlist' })
  })
}
