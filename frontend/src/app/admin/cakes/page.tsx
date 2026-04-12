'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Pin, Eye, EyeOff, Star } from 'lucide-react'
import { adminApi, imgUrl } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminCakesPage() {
  const [cakes, setCakes] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = (p = page, s = search) => {
    setLoading(true)
    adminApi.cakes({ page: p, limit: 15, ...(s ? { search: s } : {}) })
      .then(d => { setCakes(d.data || []); setPagination(d.pagination || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setPage(1); load(1, search)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await adminApi.deleteCake(id)
      toast.success('Cake deleted')
      load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(null) }
  }

  const handlePin = async (id: string) => {
    try {
      const res = await adminApi.pinCake(id)
      setCakes(p => p.map(c => c.id === id ? { ...c, is_pinned: res.is_pinned } : c))
      toast.success(res.is_pinned ? 'Cake pinned!' : 'Cake unpinned')
    } catch { toast.error('Failed to update') }
  }

  const handleToggleAvail = async (id: string) => {
    try {
      const res = await adminApi.toggleAvailability(id)
      setCakes(p => p.map(c => c.id === id ? { ...c, is_available: res.is_available } : c))
      toast.success(res.is_available ? 'Cake is now available' : 'Cake hidden')
    } catch { toast.error('Failed to update') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">Cakes</h1>
          <p className="text-gray-400 text-sm">{pagination.total || 0} cakes total</p>
        </div>
        <Link href="/admin/cakes/new" className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Cake
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Search cakes..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-secondary px-4">Search</button>
      </form>

      {/* Table */}
      {/* Desktop Table */}
<div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-100 bg-gray-50">
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cake</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <tr key={i} className="border-b border-gray-50">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="skeleton w-10 h-10 rounded-lg" /><div className="skeleton h-4 w-32 rounded" /></div></td>
            <td className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>
            <td className="px-4 py-3"><div className="skeleton h-4 w-16 rounded" /></td>
            <td className="px-4 py-3"><div className="skeleton h-5 w-20 rounded-full" /></td>
            <td className="px-4 py-3"><div className="skeleton h-4 w-12 rounded" /></td>
            <td className="px-4 py-3"><div className="skeleton h-8 w-20 rounded ml-auto" /></td>
          </tr>
        ))
      ) : cakes.length === 0 ? (
        <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No cakes found</td></tr>
      ) : cakes.map(cake => (
        <tr key={cake.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-50 flex-shrink-0">
                <img src={imgUrl(cake.primary_image || '')} alt={cake.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100' }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate max-w-[160px]">{cake.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {cake.is_pinned && <span className="badge bg-brand-100 text-brand-600 text-[9px]">📌</span>}
                  {cake.is_bestseller && <span className="badge bg-amber-100 text-amber-700 text-[9px]">🔥</span>}
                  {cake.is_new && <span className="badge bg-sky-100 text-sky-600 text-[9px]">✨</span>}
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><span className="text-xs text-gray-500">{cake.category_name || '—'}</span></td>
          <td className="px-4 py-3">
            <span className="font-semibold text-gray-800">₹{cake.price}</span>
            {cake.original_price && <span className="text-xs text-gray-400 line-through ml-1">₹{cake.original_price}</span>}
          </td>
          <td className="px-4 py-3">
            <span className={clsx('badge text-xs', cake.is_available ? 'badge-green' : 'bg-gray-100 text-gray-500')}>
              {cake.is_available ? '✓ Available' : '✗ Hidden'}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-gray-600">{cake.rating} ({cake.review_count})</span>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => handlePin(cake.id)} title="Pin/Unpin"
                className={clsx('btn-icon w-7 h-7 rounded-lg', cake.is_pinned ? 'bg-brand-50 text-brand-500' : 'text-gray-400 hover:text-brand-500')}>
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleToggleAvail(cake.id)} title="Toggle availability"
                className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-sky-500">
                {cake.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <Link href={`/admin/cakes/${cake.id}/edit`}
                className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-sky-600">
                <Pencil className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => handleDelete(cake.id, cake.name)}
                disabled={deleting === cake.id}
                className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-red-500">
                {deleting === cake.id ? <span className="spinner w-3 h-3" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* Mobile Cards */}
<div className="md:hidden space-y-3">
  {loading ? (
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-3">
          <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2" />
            <div className="skeleton h-3 rounded w-1/3" />
          </div>
        </div>
      </div>
    ))
  ) : cakes.length === 0 ? (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
      No cakes found
    </div>
  ) : cakes.map(cake => (
    <div key={cake.id} className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-50 flex-shrink-0">
          <img src={imgUrl(cake.primary_image || '')} alt={cake.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{cake.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{cake.category_name || 'No category'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-brand-600 text-sm">₹{cake.price}</span>
            {cake.original_price && (
              <span className="text-xs text-gray-400 line-through">₹{cake.original_price}</span>
            )}
            <span className={clsx('badge text-[10px]', cake.is_available ? 'badge-green' : 'bg-gray-100 text-gray-500')}>
              {cake.is_available ? 'Available' : 'Hidden'}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {cake.is_pinned && <span className="badge bg-brand-100 text-brand-600 text-[9px]">📌 Pinned</span>}
            {cake.is_bestseller && <span className="badge bg-amber-100 text-amber-700 text-[9px]">🔥 Best</span>}
            {cake.is_new && <span className="badge bg-sky-100 text-sky-600 text-[9px]">✨ New</span>}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        <button onClick={() => handlePin(cake.id)}
          className={clsx('flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
            cake.is_pinned ? 'bg-brand-50 text-brand-600' : 'bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600')}>
          <Pin className="w-3.5 h-3.5" />
          {cake.is_pinned ? 'Unpin' : 'Pin'}
        </button>

        <button onClick={() => handleToggleAvail(cake.id)}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 hover:bg-sky-50 hover:text-sky-600 transition-colors">
          {cake.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {cake.is_available ? 'Hide' : 'Show'}
        </button>

        <Link href={`/admin/cakes/${cake.id}/edit`}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 hover:bg-sky-50 hover:text-sky-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>

        <button onClick={() => handleDelete(cake.id, cake.name)}
          disabled={deleting === cake.id}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors">
          {deleting === cake.id ? <span className="spinner w-3 h-3" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete
        </button>
      </div>
    </div>
  ))}
</div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={clsx('w-8 h-8 rounded-lg text-sm font-medium transition-all',
                page === p ? 'bg-sky-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300')}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
