'use client'
import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Star, ShoppingCart, Heart, Phone, Share2, Flag, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { cakesApi, cartApi, wishlistApi, imgUrl } from '@/lib/api'
import { useAuthStore, useCartStore, useWishlistStore } from '@/store'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import DeliveryDatePicker from '@/components/cake/DeliveryDatePicker'

export default function CakeDetailPage() {
  const { id: slug } = useParams()
  const { user } = useAuthStore()
  const { openCart, setCart } = useCartStore()
  const { has, toggle } = useWishlistStore()

  const [cake, setCake] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-9876543210'



  function ImageLightbox({ images, startIndex, onClose }: { images: any[], startIndex: number, onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent(p => (p + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrent(p => (p - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [])

  useEffect(() => { setZoom(1) }, [current])

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/60 text-sm">{current + 1} / {images.length}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(p => Math.min(3, parseFloat((p + 0.5).toFixed(1))))}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-lg font-bold"
          >+</button>
          <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(p => Math.max(1, parseFloat((p - 0.5).toFixed(1))))}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-lg font-bold"
          >−</button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="flex-1 overflow-auto flex items-center justify-center relative">
        {images.length > 1 && (
          <button
            onClick={() => setCurrent(p => (p - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <img
          src={imgUrl(images[current]?.url || '')}
          alt=""
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease', cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
          onClick={() => setZoom(p => p > 1 ? 1 : 2)}
          className="max-h-[80vh] max-w-[90vw] object-contain select-none"
          onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800' }}
        />

        {images.length > 1 && (
          <button
            onClick={() => setCurrent(p => (p + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 flex-shrink-0">
          {images.map((img: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={'w-12 h-12 rounded-lg overflow-hidden transition-all flex-shrink-0 ' +
                (i === current ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-black opacity-100' : 'opacity-50 hover:opacity-80')}
            >
              <img
                src={imgUrl(img.thumbnail_url || img.url)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}




  useEffect(() => {
    if (!slug) return
    setLoading(true)
    cakesApi.get(slug as string).then(d => {
      setCake(d)
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="container-narrow py-12">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 rounded w-3/4" />
          <div className="skeleton h-4 rounded w-full" />
          <div className="skeleton h-4 rounded w-2/3" />
        </div>
      </div>
    </div>
  )

  if (!cake) return (
    <div className="container-narrow py-24 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="font-display text-2xl text-gray-700">Cake not found</h2>
      <Link href="/cakes" className="btn-primary mt-6 inline-flex">Browse all cakes</Link>
    </div>
  )

  const images = cake.images?.length ? cake.images : [{ url: '', alt_text: cake.name }]
  const inWishlist = has(cake.id)
  const discount = cake.original_price
    ? Math.round((1 - cake.price / cake.original_price) * 100) : 0
  const richContent = cake.rich_content || {}

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      for (let i = 0; i < qty; i++) await cartApi.add(cake.id)
      const cart = await cartApi.get()
      setCart(cart.items, cart.total)
      openCart()
      toast.success(`${cake.name} added to cart!`)
    } catch (err: any) { toast.error(err.message) }
    finally { setAdding(false) }
  }

  const handleWishlist = async () => {
    if (!user) { toast.error('Please sign in first'); return }
    try {
      const res = await wishlistApi.toggle(cake.id)
      toggle(cake.id)
      toast.success(res.saved ? 'Saved to wishlist 💕' : 'Removed from wishlist')
      setCake((p: any) => ({ ...p, in_wishlist: res.saved }))
    } catch { toast.error('Failed to update wishlist') }
  }

  const handleReport = async () => {
    if (!reportReason) { toast.error('Please select a reason'); return }
    setSubmitting(true)
    try {
      await cakesApi.report(cake.id, { reason: reportReason, description: reportDesc })
      toast.success('Report submitted. Thank you!')
      setShowReport(false)
    } catch { toast.error('Failed to submit report') }
    finally { setSubmitting(false) }
  }

  const handleReview = async () => {
    if (!user) { toast.error('Please sign in to review'); return }
    setSubmitting(true)
    try {
      await cakesApi.review(cake.id, { rating: reviewRating, title: reviewTitle, body: reviewBody })
      toast.success('Review submitted!')
      setShowReview(false)
    } catch { toast.error('Failed to submit review') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="bg-pattern">
      <div className="container-narrow py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-brand-500">Home</Link>
          <span>/</span>
          <Link href="/cakes" className="hover:text-brand-500">Cakes</Link>
          {cake.category_name && <>
            <span>/</span>
            <Link href={`/cakes?category=${cake.category_slug}`} className="hover:text-brand-500">{cake.category_name}</Link>
          </>}
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[200px]">{cake.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Images ──────────────────────────────────────── */}
          <div>
            {/* Main image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-brand-50 mb-3">
              <img
                src={imgUrl(images[activeImage]?.url || '')}
                alt={images[activeImage]?.alt_text || cake.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700' }}
              />

              {/* Fullscreen button */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                title="View fullscreen"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Nav arrows */}
              {images.length > 1 && <>
                <button onClick={() => setActiveImage(p => (p - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveImage(p => (p + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {cake.is_pinned && <span className="badge bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm">⭐ Featured</span>}
                {cake.is_new && <span className="badge bg-sky-500 text-white shadow-sm">✨ New</span>}
                {cake.is_bestseller && <span className="badge bg-amber-500 text-white shadow-sm">🔥 Bestseller</span>}
                {discount >= 10 && <span className="badge bg-emerald-500 text-white shadow-sm">{discount}% OFF</span>}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={clsx(
                      'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all',
                      activeImage === i ? 'ring-2 ring-brand-400 ring-offset-2' : 'opacity-60 hover:opacity-100'
                    )}>
                    <img
                      src={imgUrl(images[activeImage]?.url || '')}
                      alt={images[activeImage]?.alt_text || cake.name}
                      className="w-full h-full object-cover"
                      decoding="async"
                      onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ─────────────────────────────────────── */}
          <div>
            {cake.category_name && (
              <Link href={`/cakes?category=${cake.category_slug}`}
                className="text-xs font-semibold text-sky-500 uppercase tracking-wider hover:text-sky-600">
                {cake.category_name}
              </Link>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 mt-1 leading-snug">
              {cake.name}
            </h1>
            {richContent.headline && richContent.headline !== cake.name && (
              <p className="text-brand-500 font-medium mt-1">{richContent.headline}</p>
            )}

            {/* Rating */}
            {cake.rating > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={clsx('w-4 h-4', i <= Math.round(cake.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{cake.rating} ({cake.review_count} reviews)</span>
                <button onClick={() => setShowReview(true)} className="text-xs text-brand-500 hover:underline ml-1">
                  Write a review
                </button>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-semibold text-brand-600">₹{cake.price}</span>
              {cake.original_price && (
                <>
                  <span className="text-gray-400 text-lg line-through">₹{cake.original_price}</span>
                  <span className="badge-green text-xs">Save ₹{cake.original_price - cake.price}</span>
                </>
              )}
            </div>

            <p className="text-gray-500 mt-4 leading-relaxed">{cake.short_description}</p>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {cake.weight && (
                <div className="bg-brand-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Weight</p>
                  <p className="font-medium text-gray-800 text-sm">{cake.weight}</p>
                </div>
              )}
              {cake.servings && (
                <div className="bg-sky-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Serves</p>
                  <p className="font-medium text-gray-800 text-sm">{cake.servings}</p>
                </div>
              )}
              {cake.prep_time_hours && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Prep Time</p>
                  <p className="font-medium text-gray-800 text-sm">{cake.prep_time_hours}h advance</p>
                </div>
              )}
              {cake.flavours?.length > 0 && (
                <div className="bg-pink-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Flavours</p>
                  <p className="font-medium text-gray-800 text-sm">{cake.flavours.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Highlights */}
            {richContent.highlights?.length > 0 && (
              <div className="mt-5 space-y-2">
                {richContent.highlights.map((h: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Qty + Cart */}
            {cake.is_available ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                    <button onClick={() => setQty(p => Math.max(1, p - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-brand-50 hover:text-brand-500 transition-colors text-gray-600">
                      −
                    </button>
                    <span className="w-8 text-center font-medium text-gray-800">{qty}</span>
                    <button onClick={() => setQty(p => p + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-brand-50 hover:text-brand-500 transition-colors text-gray-600">
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">
                    Total: <span className="font-semibold text-gray-700">₹{(cake.price * qty).toFixed(0)}</span>
                  </span>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleAddToCart} disabled={adding}
                    className="btn-primary flex-1 py-3.5 text-base">
                    {adding ? <span className="spinner" /> : <ShoppingCart className="w-4 h-4" />}
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <DeliveryDatePicker prepHours={cake.prep_time_hours || 24} />
                  <button onClick={handleWishlist}
                    className={clsx('btn-icon w-12 h-12 rounded-xl border transition-all',
                      inWishlist ? 'border-brand-200 bg-brand-50 text-brand-500' : 'border-gray-200 hover:border-brand-200 hover:text-brand-500')}>
                    <Heart className={clsx('w-5 h-5', inWishlist && 'fill-current')} />
                  </button>
                </div>

                <a href={`tel:${phone}`} className="btn-sky w-full justify-center gap-2 py-3.5">
                  <Phone className="w-4 h-4" />
                  Call to Order Directly
                </a>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-center">
                <p className="text-gray-500 font-medium">Currently unavailable</p>
                <a href={`tel:${phone}`} className="btn-primary mt-3 inline-flex gap-2">
                  <Phone className="w-4 h-4" /> Call for availability
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => { navigator.share?.({ title: cake.name, url: window.location.href }) || navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!')) }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button onClick={() => user ? setShowReport(true) : toast.error('Sign in to report')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500">
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
            </div>
          </div>
        </div>

        {/* ── Description + Reviews ──────────────────────────── */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {cake.description && (
              <div className="bg-white rounded-2xl p-6 border border-pink-100 mb-6">
                <h3 className="font-display text-xl font-semibold mb-4 text-gray-900">About this Cake</h3>
                <p className="text-gray-600 leading-relaxed">{cake.description}</p>
                {richContent.care_instructions && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Storage & Care</p>
                    <p className="text-xs text-amber-600">{richContent.care_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {cake.recent_reviews?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-pink-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-xl font-semibold text-gray-900">Customer Reviews</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{cake.rating}</span>
                    <span className="text-gray-400 text-sm">({cake.review_count})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {cake.recent_reviews.map((r: any) => (
                    <div key={r.id} className="p-4 bg-brand-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-200 flex items-center justify-center text-xs font-bold text-brand-700">
                            {r.user_name?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{r.user_name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={clsx('w-3 h-3', i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
                          ))}
                        </div>
                      </div>
                      {r.title && <p className="text-sm font-medium text-gray-800">{r.title}</p>}
                      {r.body && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.body}</p>}
                    </div>
                  ))}
                </div>
                <button onClick={() => user ? setShowReview(true) : toast.error('Sign in to review')}
                  className="btn-secondary w-full mt-4">Write a Review</button>
              </div>
            )}
          </div>

          {/* Side info */}
          <div className="space-y-4">
            {cake.allergens?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-amber-100">
                <h4 className="font-semibold text-sm text-gray-800 mb-3">⚠️ Allergens</h4>
                <div className="flex flex-wrap gap-1.5">
                  {cake.allergens.map((a: string) => (
                    <span key={a} className="badge bg-amber-50 text-amber-700 text-xs">{a}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-5 border border-pink-100">
              <h4 className="font-semibold text-sm text-gray-800 mb-4">Need help?</h4>
              <a href={`tel:${phone}`} className="btn-primary w-full justify-center gap-2 py-3">
                <Phone className="w-4 h-4" /> {phone}
              </a>
              <p className="text-xs text-gray-400 text-center mt-2">Mon–Sun, 9 AM – 9 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Report Modal ──────────────────────────────────────── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 drawer-overlay" onClick={() => setShowReport(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h3 className="font-display text-xl font-semibold mb-4">Report Cake</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Reason</label>
                <select className="input" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  <option value="incorrect_info">Incorrect information</option>
                  <option value="offensive_content">Offensive content</option>
                  <option value="wrong_price">Wrong pricing</option>
                  <option value="unavailable">Item not available</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input" rows={3} value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                  placeholder="Provide more details..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReport(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReport} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ──────────────────────────────────────── */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 drawer-overlay" onClick={() => setShowReview(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h3 className="font-display text-xl font-semibold mb-4">Write a Review</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Your Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setReviewRating(i)}>
                      <Star className={clsx('w-7 h-7 transition-colors', i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" placeholder="Summary of your review" value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Review</label>
                <textarea className="input" rows={3} placeholder="Tell others about this cake..."
                  value={reviewBody} onChange={e => setReviewBody(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReview(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReview} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          startIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

    </div>
  )
}
