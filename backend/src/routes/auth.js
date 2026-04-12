import bcrypt from 'bcryptjs'
import { query } from '../db/pool.js'
import { authenticate } from '../middleware/auth.js'
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js'

export default async function authRoutes(fastify) {
  // Register
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          phone: { type: 'string' },
        }
      }
    }
  }, async (request, reply) => {
    const { name, email, password, phone } = request.body
    
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return reply.code(409).send({ error: 'Email already registered' })
    }
    
    const password_hash = await bcrypt.hash(password, 12)
    const { rows } = await query(`
      INSERT INTO users (name, email, password_hash, phone, is_verified)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, email, phone, role, avatar_url, created_at
    `, [name, email, password_hash, phone || null])
    
    const user = rows[0]
    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      { expiresIn: '30d' }
    )
    
    reply.code(201).send({ token, user })
  })

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body
    
    const { rows } = await query(
      'SELECT id, name, email, password_hash, role, avatar_url, phone FROM users WHERE email = $1',
      [email]
    )
    
    if (rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid email or password' })
    }
    
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid email or password' })
    }
    
    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      { expiresIn: '30d' }
    )
    
    delete user.password_hash
    reply.send({ token, user })
  })

// Firebase sync — called after Firebase login/register
fastify.post('/firebase-sync', async (request, reply) => {
  const { firebase_token, name, phone } = request.body

  // Verify Firebase token
  let firebaseUser
  try {
    const admin = (await import('firebase-admin')).default
    firebaseUser = await admin.auth().verifyIdToken(firebase_token)
  } catch {
    return reply.code(401).send({ error: 'Invalid Firebase token' })
  }

  const { uid, email } = firebaseUser

  // Check if user exists
  let { rows } = await query(
    'SELECT * FROM users WHERE firebase_uid = $1 OR email = $2',
    [uid, email]
  )

  let user
  if (rows.length === 0) {
    // New user — create
    const { rows: newRows } = await query(`
      INSERT INTO users (name, email, firebase_uid, phone, role, is_verified)
      VALUES ($1, $2, $3, $4, 'customer', true)
      RETURNING id, name, email, phone, role, avatar_url
    `, [name || email.split('@')[0], email, uid, phone || null])
    user = newRows[0]
  } else {
    // Existing user — update firebase_uid if missing
    const { rows: updRows } = await query(`
      UPDATE users SET firebase_uid = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, phone, role, avatar_url
    `, [uid, rows[0].id])
    user = updRows[0]
  }

  // Generate our JWT
  const token = fastify.jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    { expiresIn: '30d' }
  )

  reply.send({ token, user })
})

  // Get current user
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { rows } = await query(
      'SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = $1',
      [request.user.id]
    )
    if (rows.length === 0) return reply.code(404).send({ error: 'User not found' })
    reply.send(rows[0])
  })

  // Update profile
  fastify.patch('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { name, phone } = request.body
    const { rows } = await query(`
      UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, email, phone, role, avatar_url, created_at
    `, [name, phone, request.user.id])
    reply.send(rows[0])
  })

  // Change password
  fastify.post('/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [request.user.id])
    
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash)
    if (!valid) return reply.code(401).send({ error: 'Current password is incorrect' })
    
    const newHash = await bcrypt.hash(newPassword, 12)
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, request.user.id])
    reply.send({ message: 'Password updated successfully' })
  })
}
