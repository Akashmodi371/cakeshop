import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Auth Store ─────────────────────────────────────────────────────────────
interface AuthState {
  user: any | null
  token: string | null
  setAuth: (user: any, token: string) => void
  logout: () => void
  updateUser: (user: any) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('cs_token', token)
        set({ user, token })
      },
      logout: () => {
          localStorage.removeItem('cs_token')
          localStorage.removeItem('cs_session')
          set({ user: null, token: null })
        },
      updateUser: (user) => set({ user }),
    }),
    { name: 'cs_auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)

// ─── Cart Store ─────────────────────────────────────────────────────────────
interface CartItem {
  id: string
  cake_id: string
  name: string
  slug: string
  price: number
  original_price?: number
  quantity: number
  image_url?: string
  weight?: string
}

interface CartState {
  items: CartItem[]
  total: number
  count: number
  isOpen: boolean
  isLoading: boolean
  setCart: (items: CartItem[], total: number) => void
  openCart: () => void
  closeCart: () => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  count: 0,
  isOpen: false,
  isLoading: false,
  setCart: (items, total) => set({ items, total, count: items.reduce((s, i) => s + i.quantity, 0) }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  setLoading: (v) => set({ isLoading: v }),
  clear: () => set({ items: [], total: 0, count: 0 }),
}))

// ─── Wishlist Store ─────────────────────────────────────────────────────────
interface WishlistState {
  ids: Set<string>
  setIds: (ids: string[]) => void
  toggle: (id: string) => void
  has: (id: string) => boolean
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  setIds: (ids) => set({ ids: new Set(ids) }),
  toggle: (id) => {
    const ids = new Set(get().ids)
    if (ids.has(id)) ids.delete(id)
    else ids.add(id)
    set({ ids })
  },
  has: (id) => get().ids.has(id),
}))
