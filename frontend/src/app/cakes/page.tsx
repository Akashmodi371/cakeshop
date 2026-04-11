'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import CakeGrid from '@/components/cake/CakeGrid'
import { cakesApi } from '@/lib/api'
import clsx from 'clsx'

const SORT_OPTIONS = [
  { value: 'pinned', label: 'Featured' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

function CakesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [cakes, setCakes] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({})
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'pinned'
  const featured = searchParams.get('featured') || ''
  const bestseller = searchParams.get('bestseller') || ''
  const isNew = searchParams.get('new') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const [searchInput, setSearchInput] = useState(search)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/cakes?${params.toString()}`)
  }

  useEffect(() => {
    setLoading(true)
    const params: any = { page, limit: 12, sort }
    if (category) params.category = category
    if (search) params.search = search
    if (featured) params.featured = featured
    if (bestseller) params.bestseller = bestseller
    if (isNew) params.new = isNew

    cakesApi.list(params).then(d => {
      setCakes(d.data || [])
      setPagination(d.pagination || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [searchParams.toString()])

  useEffect(() => {
    cakesApi.categories().then(setCategories).catch(() => {})
  }, [])

  const activeFilters = [
    category && { label: categories.find(c => c.slug === category)?.name || category, key: 'category' },
    featured && { label: 'Featured', key: 'featured' },
    bestseller && { label: 'Bestsellers', key: 'bestseller' },
    isNew && { label: 'New Arrivals', key: 'new' },
    search && { label: `"${search}"`, key: 'search' },
  ].filter(Boolean) as { label: string; key: string }[]

  const pageTitle = category
    ? categories.find(c => c.slug === category)?.name || 'Cakes'
    : featured ? 'Featured Cakes'
    : bestseller ? 'Bestsellers'
    : isNew ? 'New Arrivals'
    : search ? `Results for "${search}"`
    : 'All Cakes'

  return (
    <div className="bg-pattern min-h-screen">
      <div className="container-narrow py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">{pageTitle}</h1>
          {pagination.total > 0 && (
            <p className="text-gray-400 text-sm mt-1">{pagination.total} cakes found</p>
          )}
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setParam('search', searchInput)}
              placeholder="Search cakes..."
              className="input pl-11"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setParam('search', '') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-6 h-6">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setParam('search', searchInput)} className="btn-primary px-5">
            Search
          </button>
          <button onClick={() => setShowFilters(p => !p)}
            className={clsx('btn-secondary px-4 gap-2', showFilters && 'bg-brand-50 border-brand-300')}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <select
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
            className="input w-auto min-w-[140px] cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-pink-100 p-5 mb-6 animate-scale-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Categories */}
              <div>
                <h4 className="label">Category</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setParam('category', '')}
                    className={clsx('badge cursor-pointer', !category ? 'bg-brand-500 text-white' : 'badge-pink')}>
                    All
                  </button>
                  {categories.map((cat: any) => (
                    <button key={cat.slug} onClick={() => setParam('category', cat.slug)}
                      className={clsx('badge cursor-pointer transition-colors', category === cat.slug ? 'bg-brand-500 text-white' : 'badge-pink hover:bg-brand-100')}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick filters */}
              <div>
                <h4 className="label">Quick Filters</h4>
                <div className="space-y-2">
                  {[
                    { key: 'featured', value: featured, label: '⭐ Featured' },
                    { key: 'bestseller', value: bestseller, label: '🔥 Bestsellers' },
                    { key: 'new', value: isNew, label: '✨ New Arrivals' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!f.value}
                        onChange={e => setParam(f.key, e.target.checked ? 'true' : '')}
                        className="accent-brand-500"
                      />
                      <span className="text-sm text-gray-700">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-xs text-gray-400">Active:</span>
            {activeFilters.map(f => (
              <span key={f.key}
                className="badge-pink flex items-center gap-1 cursor-pointer hover:bg-brand-100"
                onClick={() => setParam(f.key, '')}>
                {f.label}
                <X className="w-2.5 h-2.5" />
              </span>
            ))}
            <button onClick={() => router.push('/cakes')}
              className="text-xs text-red-400 hover:text-red-600 font-medium ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Categories row */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button onClick={() => setParam('category', '')}
            className={clsx('flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all',
              !category ? 'bg-brand-500 text-white shadow-pink' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-600')}>
            All
          </button>
          {categories.map((cat: any) => (
            <button key={cat.slug} onClick={() => setParam('category', cat.slug)}
              className={clsx('flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all',
                category === cat.slug ? 'bg-brand-500 text-white shadow-pink' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-600')}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 rounded w-2/3" />
                  <div className="skeleton h-3 rounded w-full" />
                  <div className="skeleton h-4 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CakeGrid cakes={cakes} />
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setParam('page', p.toString())}
                className={clsx('w-9 h-9 rounded-full text-sm font-medium transition-all',
                  page === p ? 'bg-brand-500 text-white shadow-pink' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300')}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CakesPage() {
  return <Suspense><CakesContent /></Suspense>
}
