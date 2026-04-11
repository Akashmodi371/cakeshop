'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { wishlistApi, cartApi, imgUrl } from '@/lib/api'
import { useAuthStore, useCartStore, useWishlistStore } from '@/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { user } = useAuthStore()
  const { openCart, setCart } = useCartStore()
  const { setIds, toggle } = useWishlistStore()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    wishlistApi.get().then(d => {
      setItems(d)
      setIds(d.map((i: any) => i.id))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const handleRemove = async (item: any) => {
    await wishlistApi.remove(item.id)
    toggle(item.id)
    setItems(p => p.filter(i => i.id !== item.id))
    toast.success('Removed from wishlist')
  }

  const handleAddToCart = async (item: any) => {
    await cartApi.add(item.id)
    const cart = await cartApi.get()
    setCart(cart.items, cart.total)
    openCart()
    toast.success(`${item.name} added to cart!`)
  }

  if (loading) return <div className="container-narrow py-16 text-center"><div className="spinner mx-auto" /></div>

  return (
    <div className="bg-pattern min-h-screen">
      <div className="container-narrow py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-brand-500 fill-brand-500" />
          <h1 className="section-title">My Wishlist</h1>
          <span className="badge-pink">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💕</div>
            <h3 className="font-display text-2xl font-semibold text-gray-700">Your wishlist is empty</h3>
            <p className="text-gray-400 mt-2">Save your favourite cakes here</p>
            <Link href="/cakes" className="btn-primary mt-6 inline-flex">Browse Cakes</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => (
              <div key={item.wishlist_id} className="card overflow-hidden group animate-fade-up">
                <Link href={`/cakes/${item.slug}`} className="block relative aspect-[4/3] bg-brand-50 overflow-hidden">
                  <img
                    src={imgUrl(item.image_url || '')}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500' }}
                  />
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="badge bg-gray-500 text-white">Unavailable</span>
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link href={`/cakes/${item.slug}`}
                    className="font-medium text-gray-800 hover:text-brand-600 transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-brand-600 font-semibold">₹{item.price}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRemove(item)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {item.is_available && (
                        <button onClick={() => handleAddToCart(item)}
                          className="btn-primary py-1.5 px-3 text-xs gap-1">
                          <ShoppingCart className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
