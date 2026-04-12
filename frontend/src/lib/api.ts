const API = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== '') ? process.env.NEXT_PUBLIC_API_URL : (typeof window !== 'undefined' ? '' : 'http://localhost:3001')

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cs_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const sessionId = typeof window !== 'undefined'
    ? (localStorage.getItem('cs_session') || (() => {
        const id = Math.random().toString(36).slice(2)
        localStorage.setItem('cs_session', id)
        return id
      })())
    : ''
  if (sessionId) headers['x-session-id'] = sessionId

  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Cakes
export const cakesApi = {
  list: (params?: Record<string, string | number | boolean>) => {
    const q = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : ''
    return api.get<any>(`/api/cakes${q}`)
  },
  get: (slug: string) => api.get<any>(`/api/cakes/${slug}`),
  categories: () => api.get<any[]>('/api/cakes/meta/categories'),
  promotions: () => api.get<any[]>('/api/cakes/meta/promotions'),
  report: (id: string, body: { reason: string; description?: string }) =>
    api.post(`/api/cakes/${id}/report`, body),
  review: (id: string, body: { rating: number; title?: string; body?: string }) =>
    api.post(`/api/cakes/${id}/review`, body),
}

// Auth
export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    api.post<{ token: string; user: any }>('/api/auth/register', body),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/api/auth/login', { email, password }),
  me: () => api.get<any>('/api/auth/me'),
  updateProfile: (body: { name?: string; phone?: string }) =>
    api.patch('/api/auth/me', body),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
}

// Cart
export const cartApi = {
  get: () => api.get<any>('/api/cart'),
  add: (cake_id: string, quantity = 1) => api.post('/api/cart', { cake_id, quantity }),
  update: (id: string, quantity: number) => api.patch(`/api/cart/${id}`, { quantity }),
  remove: (id: string) => api.delete(`/api/cart/${id}`),
  clear: () => api.delete('/api/cart'),
}

// Wishlist
export const wishlistApi = {
  get: () => api.get<any[]>('/api/wishlist'),
  toggle: (cakeId: string) => api.post<{ saved: boolean }>(`/api/wishlist/${cakeId}`, {}),
  remove: (cakeId: string) => api.delete(`/api/wishlist/${cakeId}`),
}

// Admin
export const adminApi = {
  stats: () => api.get<any>('/api/admin/stats'),
  cakes: (params?: any) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.get<any>(`/api/admin/cakes${q}`)
  },
  getCake: (id: string) => api.get<any>(`/api/admin/cakes/${id}`),
  createCake: (body: any) => api.post<any>('/api/admin/cakes', body),
  updateCake: (id: string, body: any) => api.patch<any>(`/api/admin/cakes/${id}`, body),
  deleteCake: (id: string) => api.delete(`/api/admin/cakes/${id}`),
  pinCake: (id: string) => api.patch<any>(`/api/admin/cakes/${id}/pin`),
  toggleAvailability: (id: string) => api.patch<any>(`/api/admin/cakes/${id}/toggle-availability`, {}),
  deleteImage: (imageId: string) => api.delete(`/api/admin/images/${imageId}`),
  categories: () => api.get<any[]>('/api/admin/categories'),
  createCategory: (body: any) => api.post('/api/admin/categories', body),
  updateCategory: (id: string, body: any) => api.patch(`/api/admin/categories/${id}`, body),
  deleteCategory: (id: string) => api.delete(`/api/admin/categories/${id}`),
  promotions: () => api.get<any[]>('/api/admin/promotions'),
  createPromotion: (body: any) => api.post('/api/admin/promotions', body),
  updatePromotion: (id: string, body: any) => api.patch(`/api/admin/promotions/${id}`, body),
  deletePromotion: (id: string) => api.delete(`/api/admin/promotions/${id}`),
  reports: (status?: string) => api.get<any[]>(`/api/admin/reports${status ? '?status=' + status : ''}`),
  updateReport: (id: string, status: string) => api.patch(`/api/admin/reports/${id}`, { status }),
  settings: () => api.get<any>('/api/admin/settings'),
  updateSettings: (body: any) => api.patch('/api/admin/settings', body),
  users: () => api.get<any[]>('/api/admin/users'),
}

// Upload images (multipart)
export async function uploadCakeImages(cakeId: string, files: File[]) {
  const token = getToken()
  const formData = new FormData()
  files.forEach(f => formData.append('images', f))

  const res = await fetch(`${API}/api/admin/cakes/${cakeId}/images`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}

export function imgUrl(url: string) {
  if (!url) return '/placeholder-cake.jpg'
  if (url.startsWith('http')) return url
  return `${API}${url}`
}
