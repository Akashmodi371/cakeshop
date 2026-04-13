'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { adminApi, imgUrl } from '@/lib/api'
import {
  Cake, Users, Heart, ShoppingCart, Flag, Pin,
  TrendingUp, Plus, ArrowRight, AlertCircle,
  RefreshCw, Package, Eye, Star, ChevronUp, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentCakes, setRecentCakes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [s, cakes] = await Promise.all([
        adminApi.stats(),
        adminApi.cakes({ limit: 5, page: 1 })
      ])
      setStats(s)
      setRecentCakes(cakes.data || [])
    } catch { }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const refresh = () => { setRefreshing(true); load() }

  const statCards = stats ? [
    {
      label: 'Total Cakes', value: stats.cakes?.total, sub: `${stats.cakes?.featured} featured · ${stats.cakes?.pinned} pinned`,
      icon: Cake, bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100',
      href: '/admin/cakes'
    },
    {
      label: 'Customers', value: stats.users?.customers, sub: `${stats.users?.total} total users`,
      icon: Users, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100',
      href: '/admin/users'
    },
    {
      label: 'Wishlist Saves', value: stats.wishlist?.total, sub: 'all time saves',
      icon: Heart, bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100',
      href: '#'
    },
    {
      label: 'Active Carts', value: stats.cart?.total, sub: 'items in carts',
      icon: ShoppingCart, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100',
      href: '#'
    },
    {
      label: 'Pending Reports', value: stats.reports?.pending, sub: `${stats.reports?.total} total`,
      icon: Flag, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100',
      href: '/admin/reports', alert: stats.reports?.pending > 0
    },
    {
      label: 'Pinned Cakes', value: stats.cakes?.pinned, sub: 'shown on homepage',
      icon: Pin, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100',
      href: '/admin/cakes?pinned=true'
    },
  ] : []

  const quickActions = [
    { href: '/admin/cakes/new', icon: '🎂', label: 'Add New Cake', color: 'hover:bg-brand-50 hover:border-brand-200' },
    { href: '/quick-upload', icon: '📸', label: 'Quick Upload', color: 'hover:bg-sky-50 hover:border-sky-200' },
    { href: '/admin/promotions', icon: '📢', label: 'Manage Banners', color: 'hover:bg-amber-50 hover:border-amber-200' },
    { href: '/admin/orders', icon: '📦', label: 'View Orders', color: 'hover:bg-purple-50 hover:border-purple-200' },
    { href: '/admin/reports', icon: '🚩', label: 'Review Reports', color: 'hover:bg-red-50 hover:border-red-200' },
    { href: '/admin/settings', icon: '⚙️', label: 'Settings', color: 'hover:bg-gray-50 hover:border-gray-200' },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={refreshing}
            className="btn-icon w-9 h-9 rounded-xl border border-gray-200">
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
          <Link href="/admin/cakes/new" className="btn-primary gap-2 py-2 px-4 text-sm">
            <Plus className="w-4 h-4" /> Add Cake
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="skeleton h-8 w-12 rounded mb-2" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))
        ) : statCards.map(card => (
          <Link key={card.label} href={card.href}
            className={clsx(
              'bg-white rounded-2xl border p-4 hover:shadow-card transition-all group relative overflow-hidden',
              card.border, card.alert && 'ring-2 ring-red-200'
            )}>
            {card.alert && (
              <div className="absolute top-3 right-3">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              </div>
            )}
            <div className={clsx('inline-flex p-2 rounded-xl mb-3', card.bg)}>
              <card.icon className={clsx('w-4 h-4', card.text)} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value ?? '—'}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}
              className={clsx(
                'bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center gap-2 transition-all group text-center',
                a.color
              )}>
              <span className="text-2xl">{a.icon}</span>
              <p className="text-xs font-medium text-gray-700 leading-tight">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Cakes + Tips */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Cakes */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Recent Cakes</h2>
            <Link href="/admin/cakes" className="text-xs text-sky-500 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-2.5 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : recentCakes.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No cakes yet —{' '}
                <Link href="/admin/cakes/new" className="text-brand-500 hover:underline">Add one</Link>
              </div>
            ) : recentCakes.map(cake => (
              <Link key={cake.id} href={`/admin/cakes/${cake.id}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-50 flex-shrink-0">
                  <img src={imgUrl(cake.primary_image || '')} alt={cake.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=80' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-600">{cake.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-brand-600 font-medium">₹{cake.price}</span>
                    {cake.is_pinned && <span className="text-[9px] badge bg-brand-50 text-brand-500">📌</span>}
                    {cake.is_available
                      ? <span className="text-[9px] text-emerald-500">● Live</span>
                      : <span className="text-[9px] text-gray-400">○ Hidden</span>
                    }
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Tips Panel */}
        <div className="space-y-3">
          {/* Today tip */}
          <div className="bg-gradient-to-br from-brand-500 to-sky-500 rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold opacity-70 mb-1">💡 Pro Tip</p>
            <p className="text-sm font-medium leading-relaxed">
              Pin your best cakes to show them first on homepage. Use Quick Upload 📸 for fast daily uploads from mobile.
            </p>
            <Link href="/quick-upload"
              className="inline-flex items-center gap-1.5 mt-3 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">
              Open Quick Upload →
            </Link>
          </div>

          {/* Pending reports alert */}
          {stats?.reports?.pending > 0 && (
            <Link href="/admin/reports"
              className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 hover:bg-red-100 transition-colors">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {stats.reports.pending} pending report{stats.reports.pending > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-500">Tap to review</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red-400 ml-auto" />
            </Link>
          )}

          {/* Shop status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Shop Status</h3>
            <div className="space-y-2">
              {[
                { label: 'Total Cakes Live', value: stats?.cakes?.total ?? '—', color: 'text-emerald-600' },
                { label: 'Featured Cakes', value: stats?.cakes?.featured ?? '—', color: 'text-brand-600' },
                { label: 'New Arrivals', value: stats?.cakes?.is_new ?? '—', color: 'text-sky-600' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={clsx('text-sm font-bold', item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}