'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cakesApi, imgUrl } from '@/lib/api'
import Link from 'next/link'

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await cakesApi.list({ search: query, limit: 6 })
        setResults(res.data || [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push('/cakes?search=' + encodeURIComponent(query))
  }

  const handleSelect = () => {
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search cakes..."
            className="w-full pl-10 pr-8 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 focus:bg-white transition-all"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-hover border border-pink-100 overflow-hidden z-50">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No cakes found for &quot;{query}&quot;
            </div>
          ) : (
            <>
              <div className="p-2 space-y-0.5">
                {results.map(cake => (
                  <Link key={cake.id} href={'/cakes/' + cake.slug} onClick={handleSelect}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-50 flex-shrink-0">
                      <img
                        src={imgUrl(cake.images?.[0]?.url || '')}
                        alt={cake.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=80' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-600">
                        {cake.name}
                      </p>
                      <p className="text-xs text-gray-400">{cake.category_name || ''} · ₹{cake.price}</p>
                    </div>
                    {cake.is_bestseller && (
                      <span className="badge bg-amber-50 text-amber-600 text-[9px] flex-shrink-0">🔥</span>
                    )}
                  </Link>
                ))}
              </div>
              <div className="border-t border-gray-100 px-3 py-2">
                <button onClick={handleSubmit as any}
                  className="w-full text-xs text-brand-500 hover:text-brand-600 font-medium py-1 text-center">
                  See all results for &quot;{query}&quot; →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}