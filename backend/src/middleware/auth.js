export async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Valid token required' })
  }
}

export async function authenticateAdmin(request, reply) {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'admin') {
      reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' })
    }
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Valid admin token required' })
  }
}

export async function optionalAuth(request, reply) {
  try {
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await request.jwtVerify()
    }
  } catch (err) {
    // Optional — ignore errors
  }
}
