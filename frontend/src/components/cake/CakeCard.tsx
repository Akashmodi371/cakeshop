'use client'
import Link from 'next/link'
import { Heart, Star, ShoppingCart, Badge } from 'lucide-react'
import { cartApi, wishlistApi, imgUrl } from '@/lib/api'
import { useAuthStore, useCartStore, useWishlistStore } from '@/store'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useState } from 'react'

interface Props {
  cake: any
  onWishlistToggle?: () => void
}

export default function CakeCard({ cake, onWishlistToggle }: Props) {
  const { user } = useAuthStore()
  const { openCart, setCart } = useCartStore()
  const { has, toggle } = useWishlistStore()
  const [adding, setAdding] = useState(false)
  const [wishlisting, setWishlisting] = useState(false)

  const inWishlist = has(cake.id)
  const discount = cake.original_price
    ? Math.round((1 - cake.price / cake.original_price) * 100)
    : 0

  const primaryImage = cake.images?.[0]?.url || cake.image_url || ''

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await cartApi.add(cake.id)
      const cart = await cartApi.get()
      setCart(cart.items, cart.total)
      openCart()
      toast.success(`${cake.name} added to cart!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart')
    } finally { setAdding(false) }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in to save cakes'); return }
    setWishlisting(true)
    try {
      const res = await wishlistApi.toggle(cake.id)
      toggle(cake.id)
      toast.success(res.saved ? 'Saved to wishlist 💕' : 'Removed from wishlist')
      onWishlistToggle?.()
    } catch { toast.error('Failed to update wishlist') }
    finally { setWishlisting(false) }
  }

  return (
    <Link href={`/cakes/${cake.slug}`}
      className="group block card overflow-hidden hover:shadow-card-hover transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-brand-50 overflow-hidden">
        <img
          src={imgUrl(primaryImage)}
          alt={cake.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500' }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {cake.is_pinned && (
            <span className="badge bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[10px] shadow-sm">
              ⭐ Featured
            </span>
          )}
          {cake.is_new && !cake.is_pinned && (
            <span className="badge bg-gradient-to-r from-sky-400 to-sky-500 text-white text-[10px] shadow-sm">
              ✨ New
            </span>
          )}
          {cake.is_bestseller && (
            <span className="badge bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] shadow-sm">
              🔥 Bestseller
            </span>
          )}
          {discount >= 10 && (
            <span className="badge bg-emerald-500 text-white text-[10px] shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          disabled={wishlisting}
          className={clsx(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
            inWishlist
              ? 'bg-brand-500 text-white shadow-pink'
              : 'bg-white/90 text-gray-400 hover:text-brand-500 hover:bg-white shadow-sm'
          )}>
          <Heart className={clsx('w-3.5 h-3.5', inWishlist && 'fill-current')} />
        </button>

        {/* Add to cart overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={adding || !cake.is_available}
            className={clsx(
              'w-full py-2 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all',
              cake.is_available
                ? 'bg-white/95 text-brand-600 hover:bg-brand-500 hover:text-white shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}>
            {adding ? (
              <span className="spinner w-3 h-3 border-brand-300 border-t-brand-500" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
            {cake.is_available ? (adding ? 'Adding...' : 'Add to Cart') : 'Unavailable'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {cake.category_name && (
          <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-wider mb-1">
            {cake.category_name}
          </p>
        )}
        <h3 className="font-display font-medium text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
          {cake.name}
        </h3>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
          {cake.short_description}
        </p>

        {/* Rating */}
        {cake.rating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={clsx(
                  'w-3 h-3',
                  i <= Math.round(cake.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
                )} />
              ))}
            </div>
            <span className="text-xs text-gray-400">{cake.rating} ({cake.review_count})</span>
          </div>
        )}

        {/* Price & weight */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 font-semibold">₹{cake.price}</span>
            {cake.original_price && (
              <span className="text-gray-400 text-xs line-through">₹{cake.original_price}</span>
            )}
          </div>
          {cake.weight && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{cake.weight}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
