import { query } from '../db/pool.js'

export async function createSlug(name) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')

  // Ensure uniqueness
  const { rows } = await query(
    "SELECT slug FROM cakes WHERE slug LIKE $1 ORDER BY slug",
    [`${slug}%`]
  )
  
  if (rows.length === 0) return slug
  
  const existing = rows.map(r => r.slug)
  if (!existing.includes(slug)) return slug
  
  let counter = 2
  while (existing.includes(`${slug}-${counter}`)) counter++
  return `${slug}-${counter}`
}
