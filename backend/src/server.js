import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import orderRoutes from './routes/orders.js'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import cakeRoutes from './routes/cakes.js'
import cartRoutes from './routes/cart.js'
import wishlistRoutes from './routes/wishlist.js'
import adminRoutes from './routes/admin.js'
import { runStartup } from './db/startup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads')

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined
  },
  trustProxy: true,
  bodyLimit: 1024 * 1024, // 1MB for JSON
})

// ─── Plugins ───────────────────────────────────────────────────────────────
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  sign: { algorithm: 'HS256' }
})

await fastify.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024), // 10MB
    files: 10,
  }
})

// Serve uploaded images
await fastify.register(staticFiles, {
  root: UPLOADS_DIR,
  prefix: '/uploads/',
  decorateReply: false,
})

// ─── Routes ────────────────────────────────────────────────────────────────
await fastify.register(authRoutes, { prefix: '/api/auth' })
await fastify.register(cakeRoutes, { prefix: '/api/cakes' })
await fastify.register(cartRoutes, { prefix: '/api/cart' })
await fastify.register(wishlistRoutes, { prefix: '/api/wishlist' })
await fastify.register(adminRoutes, { prefix: '/api/admin' })
await fastify.register(orderRoutes, { prefix: '/api/orders' })

// Health check
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  service: 'CakeShop API'
}))

// ─── Global error handler ─────────────────────────────────────────────────
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation
    })
  }
  
  if (error.statusCode) {
    return reply.code(error.statusCode).send({ error: error.message })
  }
  
  reply.code(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : error.message
  })
})

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ error: 'Route not found', path: request.url })
})

// ─── Start ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {

    await runStartup()
    const port = parseInt(process.env.PORT || 3001)
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`\n🎂 CakeShop API running on http://0.0.0.0:${port}`)
    console.log(`📁 Uploads served from ${UPLOADS_DIR}`)
    console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}\n`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
