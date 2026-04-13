'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EMPTY = {
  title: '', subtitle: '', badge_text: '', button_text: 'Shop Now',
  button_url: '/cakes', section: 'hero', display_order: '0',
  is_active: true,
}

const SECTIONS = [
  { value: 'hero', label: 'Hero (top)' },
  { value: 'featured', label: 'Featured Banner' },
  { value: 'banner', label: 'Mid-page Banner' },
  { value: 'announcement', label: 'Announcement Bar' },
  { value: 'popup', label: 'Popup' },
]

// ── Form outside component to prevent remount on re-render ──
function PromoForm({ data, onChange, onSubmit, onCancel, label, saving }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input className="input" value={data.title || ''}
            onChange={e => onChange('title', e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Subtitle</label>
          <input className="input" value={data.subtitle || ''}
            onChange={e => onChange('subtitle', e.target.value)} />
        </div>
        <div>
          <label className="label">Badge Text</label>
          <input className="input" value={data.badge_text || ''}
            placeholder="e.g. Free Delivery"
            onChange={e => onChange('badge_text', e.target.value)} />
        </div>
        <div>
          <label className="label">Section</label>
          <select className="input" value={data.section || 'hero'}
            onChange={e => onChange('section', e.target.value)}>
            {SECTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Button Text</label>
          <input className="input" value={data.button_text || ''}
            onChange={e => onChange('button_text', e.target.value)} />
        </div>
        <div>
          <label className="label">Button URL</label>
          <input className="input" value={data.button_url || ''}
            onChange={e => onChange('button_url', e.target.value)} />
        </div>
        <div>
          <label className="label">Display Order</label>
          <input className="input" type="number"
            value={data.display_order || '0'}
            onChange={e => onChange('display_order', e.target.value)} />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => onChange('is_active', !data.is_active)}
              className={clsx('w-10 h-6 rounded-full transition-colors relative flex-shrink-0',
                data.is_active ? 'bg-brand-500' : 'bg-gray-200')}>
              <div className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                data.is_active ? 'translate-x-4' : 'translate-x-0.5')} />
            </div>
            <span className="text-sm text-gray-600">Active</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="btn-primary py-2 px-5 gap-2">
          {saving ? <span className="spinner w-3.5 h-3.5" /> : null}
          {saving ? 'Saving...' : label}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary py-2 px-4">Cancel</button>
      </div>
    </form>
  )
}

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  const load = () => {
    adminApi.promotions()
      .then(d => { setPromos(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const setNew = useCallback((k: string, v: any) => {
    setNewForm(p => ({ ...p, [k]: v }))
  }, [])

  const setEdit = useCallback((k: string, v: any) => {
    setEditForm((p: any) => ({ ...p, [k]: v }))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.createPromotion({
        ...newForm,
        display_order: parseInt(newForm.display_order) || 0
      })
      toast.success('Promotion created!')
      setShowNew(false)
      setNewForm({ ...EMPTY })
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.updatePromotion(editingId!, {
        ...editForm,
        display_order: parseInt(editForm.display_order) || 0
      })
      toast.success('Updated!')
      setEditingId(null)
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await adminApi.updatePromotion(id, { is_active: !is_active })
      setPromos(p => p.map(x => x.id === id ? { ...x, is_active: !is_active } : x))
      toast.success(is_active ? 'Hidden' : 'Activated')
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return
    try {
      await adminApi.deletePromotion(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed') }
  }

  const startEdit = (promo: any) => {
    setEditingId(promo.id)
    setEditForm({ ...promo, display_order: promo.display_order?.toString() || '0' })
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">Promotions</h1>
          <p className="text-gray-400 text-sm">Manage banners, announcements and popups</p>
        </div>
        <button onClick={() => { setShowNew(true); setEditingId(null) }}
          className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Promotion
        </button>
      </div>

      {/* New form */}
      {showNew && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 mb-5 animate-scale-in">
          <h3 className="font-semibold text-sky-800 mb-4">New Promotion</h3>
          <PromoForm
            data={newForm}
            onChange={setNew}
            onSubmit={handleCreate}
            onCancel={() => setShowNew(false)}
            label="Create"
            saving={saving}
          />
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : promos.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No promotions yet
          </div>
        ) : promos.map(promo => (
          <div key={promo.id} className={clsx(
            'bg-white rounded-2xl border p-4 transition-all',
            promo.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'
          )}>
            {editingId === promo.id ? (
              <div>
                <p className="font-medium text-sm text-gray-600 mb-3">
                  Editing: <span className="text-gray-900">{promo.title}</span>
                </p>
                <PromoForm
                  data={editForm}
                  onChange={setEdit}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  label="Save Changes"
                  saving={saving}
                />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 truncate">{promo.title}</span>
                    <span className={clsx('badge text-[10px]',
                      promo.section === 'hero' ? 'badge-pink'
                      : promo.section === 'popup' ? 'bg-purple-50 text-purple-600'
                      : promo.section === 'announcement' ? 'badge-sky'
                      : 'badge-gold')}>
                      {SECTIONS.find(s => s.value === promo.section)?.label || promo.section}
                    </span>
                    {promo.badge_text && (
                      <span className="badge badge-green text-[10px]">{promo.badge_text}</span>
                    )}
                    {!promo.is_active && (
                      <span className="badge bg-gray-100 text-gray-400 text-[10px]">Hidden</span>
                    )}
                  </div>
                  {promo.subtitle && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{promo.subtitle}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Button: {promo.button_text || '—'} → {promo.button_url || '—'} · Order: {promo.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(promo.id, promo.is_active)}
                    title={promo.is_active ? 'Hide' : 'Activate'}
                    className={clsx('btn-icon w-7 h-7 rounded-lg',
                      promo.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-emerald-500')}>
                    {promo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => startEdit(promo)}
                    className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-sky-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(promo.id)}
                    className="btn-icon w-7 h-7 rounded-lg text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}