'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EMPTY = {
  title: '', subtitle: '', badge_text: '', button_text: 'Shop Now',
  button_url: '/cakes', section: 'hero', display_order: '0',
  is_active: true, bg_color: '#fce4ec', text_color: '#ad1457'
}

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const load = () => adminApi.promotions().then(d => { setPromos(d); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await adminApi.createPromotion({ ...form, display_order: parseInt(form.display_order) })
      toast.success('Promotion created!'); setShowNew(false); setForm({ ...EMPTY }); load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleUpdate = async () => {
  setSaving(true)
  try {
    await adminApi.updatePromotion(editing.id, {
      ...editing,
      display_order: parseInt(editing.display_order) || 0
    })
    toast.success('Updated!'); setEditing(null); load()
  } catch (err: any) { toast.error(err.message) }
  finally { setSaving(false) }
}

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await adminApi.updatePromotion(id, { is_active: !is_active })
      setPromos(p => p.map(x => x.id === id ? { ...x, is_active: !is_active } : x))
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return
    try { await adminApi.deletePromotion(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
  }

  const PromoForm = ({ data, onChange, onSubmit, onCancel, label }: any) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input className="input" value={data.title} onChange={e => onChange('title', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className="label">Subtitle</label>
          <input className="input" value={data.subtitle || ''} onChange={e => onChange('subtitle', e.target.value)} />
        </div>
        <div>
          <label className="label">Badge Text</label>
          <input className="input" value={data.badge_text || ''} placeholder="e.g. Free Delivery" onChange={e => onChange('badge_text', e.target.value)} />
        </div>
        <div>
          <label className="label">Section</label>
          <select className="input" value={data.section} onChange={e => onChange('section', e.target.value)}>
            <option value="hero">Hero (top)</option>
            <option value="featured">Featured Banner</option>
            <option value="banner">Mid-page Banner</option>
            <option value="announcement">Announcement Bar</option>
             <option value="popup">Popup</option>
          </select>
        </div>
        <div>
          <label className="label">Button Text</label>
          <input className="input" value={data.button_text || ''} onChange={e => onChange('button_text', e.target.value)} />
        </div>
        <div>
          <label className="label">Button URL</label>
          <input className="input" value={data.button_url || ''} onChange={e => onChange('button_url', e.target.value)} />
        </div>
        <div>
          <label className="label">Display Order</label>
          <input className="input" type="number" value={data.display_order} onChange={e => onChange('display_order', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="btn-primary py-2 px-4">
          {saving ? <span className="spinner" /> : label}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary py-2 px-4">Cancel</button>
      </div>
    </form>
  )

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">Promotions</h1>
          <p className="text-gray-400 text-sm">Manage hero banners and featured offers</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Promotion
        </button>
      </div>

      {showNew && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 mb-5 animate-scale-in">
          <h3 className="font-semibold text-sky-800 mb-4">New Promotion</h3>
          <PromoForm data={form} onChange={set}
            onSubmit={handleCreate} onCancel={() => setShowNew(false)} label="Create" />
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : promos.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No promotions yet
          </div>
        ) : promos.map(promo => (
          <div key={promo.id} className={clsx('bg-white rounded-2xl border p-4 transition-colors',
            promo.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60')}>
            {editing?.id === promo.id ? (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-3">Editing: {promo.title}</h4>
                <PromoForm
                  data={editing}
                  onChange={(k: string, v: any) => setEditing((p: any) => ({ ...p, [k]: v }))}
                  onSubmit={async (e: any) => { e.preventDefault(); await handleUpdate() }}
                  onCancel={() => setEditing(null)}
                  label="Save" />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{promo.title}</span>
                    <span className={clsx('badge text-[10px]',
                      promo.section === 'hero' ? 'badge-pink' : promo.section === 'featured' ? 'badge-sky' : 'badge-gold')}>
                      {promo.section}
                    </span>
                    {promo.badge_text && <span className="badge badge-green text-[10px]">{promo.badge_text}</span>}
                    {!promo.is_active && <span className="badge bg-gray-100 text-gray-400 text-[10px]">Hidden</span>}
                  </div>
                  {promo.subtitle && <p className="text-xs text-gray-500 mt-1">{promo.subtitle}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">
                    → {promo.button_text || 'Button'} · {promo.button_url} · order #{promo.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(promo.id, promo.is_active)}
                    className={clsx('btn-icon w-7 h-7', promo.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-emerald-500')}>
                    {promo.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEditing({ ...promo, display_order: promo.display_order?.toString() || '0' })}
                    className="btn-icon w-7 h-7 text-gray-400 hover:text-sky-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(promo.id)}
                    className="btn-icon w-7 h-7 text-gray-400 hover:text-red-500">
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
