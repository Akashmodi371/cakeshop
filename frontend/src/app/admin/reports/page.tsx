'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flag, Check, X, Eye } from 'lucide-react'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  reviewed: 'bg-sky-50 text-sky-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const load = (s = filter) => {
    setLoading(true)
    adminApi.reports(s || undefined).then(d => { setReports(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateReport(id, status)
      setReports(p => p.map(r => r.id === id ? { ...r, status } : r))
      toast.success(`Report marked as ${status}`)
    } catch { toast.error('Failed to update') }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Flag className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-display font-semibold text-gray-900">Reports</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5">
        {['pending', 'reviewed', 'resolved', 'dismissed', ''].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize',
              filter === s ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Flag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">No reports found</p>
          </div>
        ) : reports.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={clsx('badge text-xs capitalize', STATUS_COLORS[r.status] || STATUS_COLORS.pending)}>
                    {r.status}
                  </span>
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{r.reason?.replace(/_/g, ' ')}</span>
                  <Link href={`/cakes/${r.cake_slug}`} target="_blank"
                    className="text-xs text-sky-500 hover:underline">
                    {r.cake_name}
                  </Link>
                </div>
                {r.description && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  By {r.reporter_name || 'Anonymous'} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.status === 'pending' && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateStatus(r.id, 'reviewed')}
                    className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-sky-500" title="Mark reviewed">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => updateStatus(r.id, 'resolved')}
                    className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-emerald-500" title="Resolve">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => updateStatus(r.id, 'dismissed')}
                    className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-red-500" title="Dismiss">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
