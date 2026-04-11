'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [newCat, setNewCat] = useState({ name: '', description: '', display_order: '0' })
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => adminApi.categories().then(d => { setCats(d); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.createCategory({ ...newCat, display_order: parseInt(newCat.display_order) })
      toast.success('Category created!')
      setNewCat({ name: '', description: '', display_order: '0' })
      setShowNew(false)
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      await adminApi.updateCategory(id, {
        name: editing.name, description: editing.description,
        display_order: parseInt(editing.display_order), is_active: editing.is_active
      })
      toast.success('Updated!')
      setEditing(null)
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Cakes will be uncategorized.`)) return
    try { await adminApi.deleteCategory(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-gray-900">Categories</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* New category form */}
      {showNew && (
        <form onSubmit={handleCreate} className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-5 animate-scale-in">
          <h3 className="font-semibold text-sm text-sky-800 mb-3">New Category</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Category name" value={newCat.name}
              onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} required />
            <input className="input" placeholder="Display order (0=first)" type="number"
              value={newCat.display_order}
              onChange={e => setNewCat(p => ({ ...p, display_order: e.target.value }))} />
            <input className="input col-span-2" placeholder="Description (optional)"
              value={newCat.description}
              onChange={e => setNewCat(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={saving} className="btn-primary py-2 px-4">
              {saving ? <span className="spinner" /> : 'Create'}
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="btn-secondary py-2 px-4">Cancel</button>
          </div>
        </form>
      )}

      {/* Categories list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : cats.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No categories yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cats.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-4 py-3">
                {editing?.id === cat.id ? (
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input className="input py-1.5 text-sm" value={editing.name}
                      onChange={e => setEditing((p: any) => ({ ...p, name: e.target.value }))} />
                    <input className="input py-1.5 text-sm" value={editing.display_order}
                      type="number"
                      onChange={e => setEditing((p: any) => ({ ...p, display_order: e.target.value }))} />
                    <input className="input py-1.5 text-sm" value={editing.description || ''}
                      placeholder="Description"
                      onChange={e => setEditing((p: any) => ({ ...p, description: e.target.value }))} />
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800">{cat.name}</span>
                      {!cat.is_active && <span className="badge bg-gray-100 text-gray-500 text-[10px]">Hidden</span>}
                      <span className="text-xs text-gray-400">#{cat.display_order}</span>
                    </div>
                    {cat.description && <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-0.5">{cat.cake_count || 0} cakes · /{cat.slug}</p>
                  </div>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                  {editing?.id === cat.id ? (
                    <>
                      <button onClick={() => handleUpdate(cat.id)} disabled={saving}
                        className="btn-icon w-7 h-7 text-emerald-500 hover:bg-emerald-50">
                        {saving ? <span className="spinner w-3 h-3" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="btn-icon w-7 h-7 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing({ ...cat, display_order: cat.display_order?.toString() || '0' })}
                        className="btn-icon w-7 h-7 text-gray-400 hover:text-sky-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)}
                        className="btn-icon w-7 h-7 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
