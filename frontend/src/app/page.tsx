import Link from 'next/link'
import { Phone, Star, ChevronRight, Sparkles, Clock, Award, Truck } from 'lucide-react'
import CakeGrid from '@/components/cake/CakeGrid'
import { cakesApi } from '@/lib/api'

async function getData() {
  try {
    const [featured, bestsellers, newArrivals, categories, promotions] = await Promise.all([
      cakesApi.list({ featured: 'true', limit: 8 }),
      cakesApi.list({ bestseller: 'true', limit: 4 }),
      cakesApi.list({ new: 'true', limit: 4 }),
      cakesApi.categories(),
      cakesApi.promotions(),
    ])
    return { featured, bestsellers, newArrivals, categories, promotions }
  } catch {
    return { featured: { data: [] }, bestsellers: { data: [] }, newArrivals: { data: [] }, categories: [], promotions: [] }
  }
}

export default async function HomePage() {
  const { featured, bestsellers, newArrivals, categories, promotions } = await getData()
  const hero = promotions?.find((p: any) => p.section === 'hero')
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-9876543210'

  return (
    <div className="bg-pattern">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        <div className="container-narrow py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {hero?.badge_text && (
                <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fade-up">
                  <Sparkles className="w-3 h-3" />
                  {hero.badge_text}
                </div>
              )}
              <h1 className="font-display text-5xl md:text-6xl font-semibold text-gray-900 leading-[1.1] animate-fade-up delay-100">
                  {hero?.title || 'Barwaha Ki'}{' '}
                  <span className="bg-gradient-to-r from-brand-500 to-sky-500 bg-clip-text text-transparent">
                    {hero?.title ? '' : 'Sabse Meethi Bakery'}
                  </span>
                </h1>
              <p className="text-gray-500 text-lg mt-5 leading-relaxed animate-fade-up delay-200">
                {hero?.subtitle || 'Agrawal Cake House — Barwaha mein handcrafted cakes, fresh daily, delivered with love. 🎂'}
              </p>

              <div className="flex flex-wrap gap-3 mt-8 animate-fade-up delay-300">
                <Link href="/cakes" className="btn-primary text-base px-8 py-3.5">
                  Shop Now
                </Link>
                <a href={`tel:${phone}`} className="btn-secondary text-base px-8 py-3.5 gap-2">
                  <Phone className="w-4 h-4" />
                  Call to Order
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 mt-8 animate-fade-up delay-400">
                {[
                  { icon: Star, text: '4.9★ Rating', color: 'text-amber-500' },
                  { icon: Clock, text: 'Fresh Daily', color: 'text-sky-500' },
                  { icon: Truck, text: 'Free above ₹500', color: 'text-emerald-500' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative flex justify-center animate-fade-up delay-200">
              <div className="relative w-80 h-80 md:w-96 md:h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-sky-100 rounded-full animate-float" />
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
                  alt="Beautiful cake"
                  className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover rounded-full border-4 border-white shadow-pink-lg"
                />
                {/* Floating mini cards */}
                <div className="absolute -left-4 top-12 bg-white rounded-2xl shadow-card px-3 py-2 flex items-center gap-2 animate-float">
                  <span className="text-xl">🎂</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Fresh Baked</p>
                    <p className="text-[10px] text-gray-400">Daily</p>
                  </div>
                </div>
                <div className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-card px-3 py-2 flex items-center gap-2 animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-xl">⭐</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">500+ Reviews</p>
                    <p className="text-[10px] text-gray-400">4.9 Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="border-y border-pink-100 bg-white">
        <div className="container-narrow py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🎨', title: 'Custom Designs', desc: 'Any theme, any shape' },
              { icon: '🌿', title: 'Fresh Ingredients', desc: 'No preservatives' },
              { icon: '🚚', title: 'Same Day Delivery', desc: 'Order by 3 PM' },
              { icon: '💝', title: '100% Eggless Option', desc: 'Available on all cakes' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="text-2xl">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="section container-narrow">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Find the perfect cake for every occasion</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat: any) => (
              <Link key={cat.id} href={`/cakes?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-transparent hover:border-brand-100 hover:bg-white hover:shadow-pink transition-all duration-200">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {['🎂','💍','💕','✨','🧁','🍰'][categories.indexOf(cat) % 6]}
                </div>
                <p className="text-xs font-medium text-gray-700 text-center group-hover:text-brand-600 transition-colors">
                  {cat.name}
                </p>
                <p className="text-[10px] text-gray-400">{cat.cake_count} cakes</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Cakes ──────────────────────────────────── */}
      {featured?.data?.length > 0 && (
        <section className="section container-narrow">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-1 rounded-full bg-brand-400" />
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Editor's Pick</span>
              </div>
              <h2 className="section-title">Featured Cakes</h2>
              <p className="section-subtitle">Our most loved creations</p>
            </div>
            <Link href="/cakes?featured=true"
              className="hidden sm:flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <CakeGrid cakes={featured.data} />
          <div className="text-center mt-8 sm:hidden">
            <Link href="/cakes?featured=true" className="btn-secondary">View all cakes</Link>
          </div>
        </section>
      )}

      {/* ── Promo Banner ────────────────────────────────────── */}
      {promotions?.find((p: any) => p.section === 'featured') && (() => {
        const promo = promotions.find((p: any) => p.section === 'featured')
        return (
          <section className="container-narrow mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-sky-500 p-8 md:p-12 text-white">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }} />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  {promo.badge_text && (
                    <span className="inline-block bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
                      {promo.badge_text}
                    </span>
                  )}
                  <h3 className="font-display text-3xl font-semibold">{promo.title}</h3>
                  {promo.subtitle && <p className="text-white/80 mt-2 text-sm">{promo.subtitle}</p>}
                </div>
                <Link href={promo.button_url || '/cakes'}
                  className="flex-shrink-0 bg-white text-brand-600 font-semibold px-8 py-3 rounded-full hover:bg-brand-50 transition-colors shadow-lg">
                  {promo.button_text || 'Shop Now'}
                </Link>
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── Bestsellers & New Arrivals ──────────────────────── */}
      <section className="section container-narrow">
        <div className="grid md:grid-cols-2 gap-12">
          {bestsellers?.data?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-gray-900">🔥 Bestsellers</h2>
                <Link href="/cakes?bestseller=true" className="text-xs text-brand-500 font-medium hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {bestsellers.data.slice(0, 4).map((cake: any, i: number) => (
                  <Link key={cake.id} href={`/cakes/${cake.slug}`}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-card transition-all duration-200 group">
                    <span className="text-xl font-display font-bold text-brand-100 w-7 text-center">
                      {i + 1}
                    </span>
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50">
                      <img
                        src={cake.images?.[0]?.url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'}
                        alt={cake.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate group-hover:text-brand-600">{cake.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-400">{cake.rating} · {cake.review_count} reviews</span>
                      </div>
                    </div>
                    <span className="text-brand-600 font-semibold text-sm">₹{cake.price}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {newArrivals?.data?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-gray-900">✨ New Arrivals</h2>
                <Link href="/cakes?new=true" className="text-xs text-brand-500 font-medium hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {newArrivals.data.slice(0, 4).map((cake: any) => (
                  <Link key={cake.id} href={`/cakes/${cake.slug}`}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-card transition-all duration-200 group">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-sky-50">
                      <img
                        src={cake.images?.[0]?.url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'}
                        alt={cake.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate group-hover:text-brand-600">{cake.name}</p>
                      <p className="text-xs text-gray-400 truncate">{cake.short_description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-600 font-semibold text-sm">₹{cake.price}</p>
                      <span className="badge-sky text-[9px] mt-1">New</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Call to action ──────────────────────────────────── */}
      <section className="section container-narrow">
        <div className="text-center bg-white rounded-3xl border border-pink-100 p-10 shadow-card">
          <div className="text-5xl mb-4">📞</div>
          <h2 className="font-display text-3xl font-semibold text-gray-900">Want a Custom Cake?</h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            Call us directly and our bakers will craft the cake of your dreams — any design, any flavour, any occasion.
          </p>
          <a href={`tel:${phone}`} className="btn-primary inline-flex mt-6 text-base px-8 py-3.5 gap-2">
            <Phone className="w-5 h-5" />
            Call Now: {phone}
          </a>
        </div>
      </section>
    </div>
  )
}
