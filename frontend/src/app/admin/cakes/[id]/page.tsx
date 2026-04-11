'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi, uploadCakeImages, imgUrl } from '@/lib/api'
import {
  ArrowLeft, Save, Upload, Trash2, Star,
  Pin, PinOff, Eye, EyeOff, Plus, X, GripVertical
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EMPTY_CAKE = {
  name: '', short_description: '', description: '',
  price: '', original_price: '', weight: '', servings: '',
  category_id: '', prep_time_hours: 24, stock_count: 100,
  flavours: [] as string[], allergens: [] as string[], tags: [] as string[],
  is_featured: false, is_bestseller: false, is_new: false,
  is_available: true, is_pinned: false,
  rich_content: { headline: '', highlights: [''], care_instructions: '' }
}

export default function AdminCakeEditPage() {
  const { id } = useParams()
  const router = useRouter()
  const isNew = id === 'new'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<any>(EMPTY_CAKE)
  const [images, setImages] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cakeId, setCakeId] = useState<string | null>(isNew ? null : id as string)
  const [tagInput, setTagInput] = useState('')
  const [flavourInput, setFlavourInput] = useState('')
  const [allergenInput, setAllergenInput] = useState('')

  useEffect(() => {
    adminApi.categories().then(setCategories).catch(() => {})
    if (!isNew) {
      adminApi.getCake(id as string).then(cake => {
        setForm({
          name: cake.name || '',
          short_description: cake.short_description || '',
          description: cake.description || '',
          price: cake.price || '',
          original_price: cake.original_price || '',
          weight: cake.weight || '',
          servings: cake.servings || '',
          category_id: cake.category_id || '',
          prep_time_hours: cake.prep_time_hours || 24,
          stock_count: cake.stock_count || 100,
          flavours: cake.flavours || [],
          allergens: cake.allergens || [],
          tags: cake.tags || [],
          is_featured: cake.is_featured || false,
          is_bestseller: cake.is_bestseller || false,
          is_new: cake.is_new || false,
          is_available: cake.is_available !== false,
          is_pinned: cake.is_pinned || false,
          rich_content: cake.rich_content || EMPTY_CAKE.rich_content,
        })
        setImages(cake.images || [])
        setLoading(false)
      }).catch(() => { toast.error('Failed to load cake'); setLoading(false) })
    }
  }, [id])

  const set = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }))
  const setRC = (key: string, val: any) => setForm((p: any) => ({
    ...p, rich_content: { ...p.rich_content, [key]: val }
  }))

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        prep_time_hours: parseInt(form.prep_time_hours),
        stock_count: parseInt(form.stock_count),
      }
      if (isNew) {
        const cake = await adminApi.createCake(body)
        setCakeId(cake.id)
        toast.success('Cake created! Now you can add images.')
        router.replace(`/admin/cakes/${cake.id}`)
      } else {
        await adminApi.updateCake(cakeId!, body)
        toast.success('Cake updated!')
      }
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleImageUpload = async (files: FileList) => {
    if (!cakeId) { toast.error('Save the cake first before uploading images'); return }
    if (images.length >= 10) { toast.error('Maximum 10 images per cake'); return }
    const remaining = 10 - images.length
    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const res = await uploadCakeImages(cakeId, toUpload)
      setImages(p => [...p, ...res.uploaded])
      toast.success(`${res.count} image(s) uploaded!`)
    } catch (err: any) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  const handleDeleteImage = async (imgId: string) => {
    try {
      await adminApi.deleteImage(imgId)
      setImages(p => p.filter(i => i.id !== imgId))
      toast.success('Image deleted')
    } catch { toast.error('Failed to delete image') }
  }

  const addTag = (val: string, field: 'tags' | 'flavours' | 'allergens', setter: (v: string) => void) => {
    const trimmed = val.trim()
    if (!trimmed) return
    if (!form[field].includes(trimmed)) set(field, [...form[field], trimmed])
    setter('')
  }

  const removeTag = (val: string, field: 'tags' | 'flavours' | 'allergens') =>
    set(field, form[field].filter((t: string) => t !== val))

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="spinner w-8 h-8" />
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/cakes" className="btn-icon w-9 h-9 rounded-xl border border-gray-200 hover:border-gray-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-semibold text-gray-900">
              {isNew ? 'Add New Cake' : `Edit: ${form.name}`}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Link href={`/cakes/${form.slug || ''}`} target="_blank"
              className="btn-secondary py-2 px-4 text-xs gap-2">
              <Eye className="w-3.5 h-3.5" /> Preview
            </Link>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
            {saving ? <span className="spinner w-3.5 h-3.5" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : isNew ? 'Create Cake' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Form ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Basic Information</h2>

            <div>
              <label className="label">Cake Name *</label>
              <input className="input" placeholder="e.g. Strawberry Dream Cake"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div>
              <label className="label">Rich Headline <span className="text-gray-400 font-normal">(shown prominently on detail page)</span></label>
              <input className="input" placeholder="A tagline for this cake"
                value={form.rich_content?.headline || ''}
                onChange={e => setRC('headline', e.target.value)} />
            </div>

            <div>
              <label className="label">Short Description *</label>
              <textarea className="input" rows={2}
                placeholder="1–2 sentence summary shown in listings"
                value={form.short_description}
                onChange={e => set('short_description', e.target.value)} />
            </div>

            <div>
              <label className="label">Full Description</label>
              <textarea className="input" rows={4}
                placeholder="Detailed description of the cake, ingredients, occasion suitability..."
                value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>

            {/* Highlights */}
            <div>
              <label className="label">Highlights <span className="text-gray-400 font-normal">(shown as ✓ checkmarks)</span></label>
              <div className="space-y-2">
                {(form.rich_content?.highlights || ['']).map((h: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <input className="input flex-1 text-sm py-2" placeholder={`Highlight ${i + 1}`}
                      value={h} onChange={e => {
                        const arr = [...(form.rich_content?.highlights || [])]
                        arr[i] = e.target.value
                        setRC('highlights', arr)
                      }} />
                    <button onClick={() => {
                      const arr = (form.rich_content?.highlights || []).filter((_: any, j: number) => j !== i)
                      setRC('highlights', arr.length ? arr : [''])
                    }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setRC('highlights', [...(form.rich_content?.highlights || []), ''])}
                  className="text-xs text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add highlight
                </button>
              </div>
            </div>

            <div>
              <label className="label">Care / Storage Instructions</label>
              <textarea className="input" rows={2}
                placeholder="e.g. Refrigerate below 4°C. Consume within 3 days."
                value={form.rich_content?.care_instructions || ''}
                onChange={e => setRC('care_instructions', e.target.value)} />
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Pricing & Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price (₹) *</label>
                <input className="input" type="number" min="0" step="0.01"
                  placeholder="749" value={form.price}
                  onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                <label className="label">Original Price (₹) <span className="text-gray-400 font-normal">for discount</span></label>
                <input className="input" type="number" min="0" step="0.01"
                  placeholder="899" value={form.original_price}
                  onChange={e => set('original_price', e.target.value)} />
              </div>
              <div>
                <label className="label">Weight</label>
                <input className="input" placeholder="1 Kg"
                  value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
              <div>
                <label className="label">Serves</label>
                <input className="input" placeholder="8–10 people"
                  value={form.servings} onChange={e => set('servings', e.target.value)} />
              </div>
              <div>
                <label className="label">Prep Time (hours)</label>
                <input className="input" type="number" min="0"
                  value={form.prep_time_hours}
                  onChange={e => set('prep_time_hours', e.target.value)} />
              </div>
              <div>
                <label className="label">Stock Count</label>
                <input className="input" type="number" min="0"
                  value={form.stock_count}
                  onChange={e => set('stock_count', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id}
                onChange={e => set('category_id', e.target.value)}>
                <option value="">No category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          {[
            { label: 'Flavours', field: 'flavours' as const, input: flavourInput, setInput: setFlavourInput, placeholder: 'Strawberry, Vanilla...' },
            { label: 'Allergens', field: 'allergens' as const, input: allergenInput, setInput: setAllergenInput, placeholder: 'Nuts, Dairy...' },
            { label: 'Tags', field: 'tags' as const, input: tagInput, setInput: setTagInput, placeholder: 'popular, fruity...' },
          ].map(({ label, field, input, setInput, placeholder }) => (
            <div key={field} className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">{label}</h2>
              <div className="flex gap-2 mb-3">
                <input className="input flex-1 text-sm py-2" placeholder={placeholder}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input, field, setInput) } }} />
                <button onClick={() => addTag(input, field, setInput)}
                  className="btn-secondary py-2 px-3 text-xs">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form[field].map((tag: string) => (
                  <span key={tag}
                    className="badge badge-pink flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors"
                    onClick={() => removeTag(tag, field)}>
                    {tag} <X className="w-2.5 h-2.5" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          {/* Status flags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Status & Flags</h2>
            <div className="space-y-3">
              {[
                { key: 'is_available', label: 'Available for purchase', icon: '🛒' },
                { key: 'is_pinned', label: 'Pin to homepage', icon: '📌' },
                { key: 'is_featured', label: 'Featured', icon: '⭐' },
                { key: 'is_bestseller', label: 'Bestseller badge', icon: '🔥' },
                { key: 'is_new', label: 'New arrival badge', icon: '✨' },
              ].map(({ key, label, icon }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => set(key, !form[key])}
                    className={clsx(
                      'w-10 h-6 rounded-full transition-colors relative flex-shrink-0',
                      form[key] ? 'bg-brand-500' : 'bg-gray-200'
                    )}>
                    <div className={clsx(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      form[key] ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className="text-sm text-gray-700">{icon} {label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Images</h2>
              <span className="text-xs text-gray-400">{images.length}/10</span>
            </div>

            {isNew && !cakeId ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-700">💡 Save the cake first, then upload images</p>
              </div>
            ) : (
              <>
                {/* Upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-xl p-5 text-center cursor-pointer transition-colors hover:bg-brand-50 mb-3">
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="spinner" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-brand-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · Max 10MB · Up to 10 images</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files && handleImageUpload(e.target.files)}
                />

                {/* Image grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img: any, i) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={imgUrl(img.thumbnail_url || img.url)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200' }}
                        />
                        {img.is_primary && (
                          <div className="absolute top-1 left-1">
                            <span className="badge bg-brand-500 text-white text-[9px]">Main</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 text-[9px] text-white/70">{i + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Danger */}
          {!isNew && (
            <div className="bg-white rounded-2xl border border-red-100 p-5">
              <h2 className="font-semibold text-red-700 text-sm mb-2">Danger Zone</h2>
              <button
                onClick={async () => {
                  if (!confirm('Delete this cake permanently?')) return
                  await adminApi.deleteCake(cakeId!)
                  toast.success('Cake deleted')
                  router.push('/admin/cakes')
                }}
                className="w-full py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors">
                Delete This Cake
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
