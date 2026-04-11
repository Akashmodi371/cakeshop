'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingCart, Plus, Minus, Trash2, Phone } from 'lucide-react'
import { useCartStore } from '@/store'
import { cartApi, imgUrl } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CartDrawer() {
  const { items, total, count, isOpen, closeCart, setCart, setLoading } = useCartStore()
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-9876543210'

  const refresh = () => cartApi.get().then(d => setCart(d.items || [], d.total || 0)).catch(() => {})

  const updateQty = async (id: string, qty: number) => {
    setLoading(true)
    try {
      if (qty < 1) await cartApi.remove(id)
      else await cartApi.update(id, qty)
      await refresh()
    } catch { toast.error('Failed to update cart') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (isOpen) { refresh(); document.body.style.overflow = 'hidden' }
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const delivery = total >= 500 ? 0 : 60
  const grandTotal = total + delivery

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 drawer-overlay" onClick={closeCart} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100 bg-gradient-to-r from-brand-50 to-sky-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-500" />
            <span className="font-display font-semibold text-gray-900 text-lg">Your Cart</span>
            {count > 0 && (
              <span className="badge-pink">{count} {count === 1 ? 'item' : 'items'}</span>
            )}
          </div>
          <button onClick={closeCart} className="btn-icon w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center text-4xl">🎂</div>
              <div>
                <p className="font-display font-semibold text-gray-700 text-lg">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-1">Add some delicious cakes!</p>
              </div>
              <Link href="/cakes" onClick={closeCart} className="btn-primary mt-2">
                Browse Cakes
              </Link>
            </div>
          ) : (
            <div className="space-y-3 px-5">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 p-3 rounded-2xl border border-gray-100 hover:border-brand-100 transition-colors">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50">
                    <img
                      src={imgUrl(item.image_url || '')}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200' }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/cakes/${item.slug}`} onClick={closeCart}
                      className="font-medium text-gray-800 text-sm hover:text-brand-600 transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    {item.weight && <p className="text-xs text-gray-400 mt-0.5">{item.weight}</p>}
                    <div className="flex items-center justify-between mt-2">
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full hover:bg-brand-50 hover:text-brand-500 flex items-center justify-center transition-colors text-gray-500">
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full hover:bg-brand-50 hover:text-brand-500 flex items-center justify-center transition-colors text-gray-500">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-brand-600 font-semibold text-sm">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-pink-100 px-5 py-4 space-y-3 bg-gradient-to-b from-white to-brand-50">
            {/* Delivery */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              {delivery === 0
                ? <span className="text-emerald-600 font-medium">Free 🎉</span>
                : <span className="text-gray-700">₹{delivery}</span>
              }
            </div>
            {delivery > 0 && (
              <div className="bg-amber-50 text-amber-700 text-xs rounded-xl px-3 py-2 text-center">
                Add ₹{(500 - total).toFixed(0)} more for free delivery!
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-pink-100">
              <span>Total</span>
              <span className="text-brand-600">₹{grandTotal.toFixed(0)}</span>
            </div>

            {/* CTA */}
            <a href={`tel:${phone}`} className="btn-primary w-full justify-center gap-2">
              <Phone className="w-4 h-4" />
              Call to Order — {phone}
            </a>
            <p className="text-center text-xs text-gray-400">
              Or <Link href="/cakes" onClick={closeCart} className="text-brand-500 hover:underline">continue shopping</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
