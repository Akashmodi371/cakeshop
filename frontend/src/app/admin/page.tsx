'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cake, Users, Heart, ShoppingCart, Flag, TrendingUp, Plus, Pin } from 'lucide-react'
import { adminApi } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats().then(s => { setStats(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Cakes', value: stats.cakes?.total, sub: `${stats.cakes?.featured} featured`, icon: Cake, color: 'from-brand-400 to-brand-600', bg: 'bg-brand-50', text: 'text-brand-600' },
    { label: 'Customers', value: stats.users?.customers, sub: `${stats.users?.total} total users`, icon: Users, color: 'from-sky-400 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-600' },
    { label: 'Wishlisted', value: stats.wishlist?.total, sub: 'total saves', icon: Heart, color: 'from-pink-400 to-pink-600', bg: 'bg-pink-50', text: 'text-pink-600' },
    { label: 'Cart Items', value: stats.cart?.total, sub: 'active carts', icon: ShoppingCart, color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Pending Reports', value: stats.reports?.pending, sub: `${stats.reports?.total} total`, icon: Flag, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Pinned Cakes', value: stats.cakes?.pinned, sub: 'on homepage', icon: Pin, color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
  ] : []

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Link href="/admin/cakes/new" className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Cake
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="skeleton h-8 w-16 rounded mb-2" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-card transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value ?? '—'}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/cakes/new', icon: '🎂', label: 'Add New Cake', desc: 'Create a product listing', color: 'border-brand-100 hover:border-brand-200' },
          { href: '/admin/promotions', icon: '🎉', label: 'Manage Promotions', desc: 'Hero banners & offers', color: 'border-sky-100 hover:border-sky-200' },
          { href: '/admin/reports', icon: '🚩', label: 'Review Reports', desc: `${stats?.reports?.pending || 0} pending`, color: 'border-amber-100 hover:border-amber-200' },
          { href: '/admin/settings', icon: '⚙️', label: 'Shop Settings', desc: 'Phone, delivery, pricing', color: 'border-purple-100 hover:border-purple-200' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all hover:shadow-card ${a.color}`}>
            <span className="text-2xl">{a.icon}</span>
            <div>
              <p className="font-medium text-sm text-gray-800">{a.label}</p>
              <p className="text-xs text-gray-400">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
