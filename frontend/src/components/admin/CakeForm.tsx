'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, GripVertical, Star, Check, Image as ImgIcon, Plus, Minus } from 'lucide-react'
import { adminApi, uploadCakeImages, imgUrl } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Props {
  cakeId?: string // if editing
}

const EMPTY_FORM = {
  name: '', short_description: '', description: '',
  category_id: '', price: '', original_price: '',
  weight: '', servings: '', prep_time_hours: '24',
  stock_count: '100',
  flavours: '', allergens: '', tags: '',
  is_featured: false, is_bestseller: false, is_new: false,
  is_available: true, is_pinned: false,
  rich_headline: '', rich_highlights: '', rich_care: '',
}

export default function CakeForm({ cakeId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [categories, setCategories] = useState<any[]>([])
  const [images, setImages] = useState<any[]>([])
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(!!cakeId)

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggle = (k: string) => setForm(p => ({ ...p, [k]: !(p as any)[k] }))

  useEffect(() => {
    adminApi.categories().then(setCategories).catch(() => {})
    if (cakeId) {
      adminApi.getCake(cakeId).then(cake => {
        setForm({
          name: cake.name || '',
          short_description: cake.short_description || '',
          description: cake.description || '',
          category_id: cake.category_id || '',
          price: cake.price?.toString() || '',
          original_price: cake.original_price?.toString() || '',
          weight: cake.weight || '',
          servings: cake.servings || '',
          prep_time_hours: cake.prep_time_hours?.toString() || '24',
          stock_count: cake.stock_count?.toString() || '100',
          flavours: cake.flavours?.join(', ') || '',
          allergens: cake.allergens?.join(', ') || '',
          tags: cake.tags?.join(', ') || '',
          is_featured: cake.is_featured || false,
          is_bestseller: cake.is_bestseller || false,
          is_new: cake.is_new || false,
          is_available: cake.is_available !== false,
          is_pinned: cake.is_pinned || false,
          rich_headline: cake.rich_content?.headline || '',
          rich_highlights: cake.rich_content?.highlights?.join('\n') || '',
          rich_care: cake.rich_content?.care_instructions || '',
        })
        setImages(cake.images || [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [cakeId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const allowed = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    const tooLarge = files.filter(f => f.size > 10 * 1024 * 1024)
    if (tooLarge.length) toast.error(`${tooLarge.length} file(s) exceed 10MB limit`)
    const maxNew = 10 - images.length - uploadFiles.length
    const toAdd = allowed.slice(0, maxNew)
    setUploadFiles(p => [...p, ...toAdd])
    toAdd.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setUploadPreviews(p => [...p, e.target!.result as string])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const removeUploadPreview = (i: number) => {
    setUploadFiles(p => p.filter((_, j) => j !== i))
    setUploadPreviews(p => p.filter((_, j) => j !== i))
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      await adminApi.deleteImage(imageId)
      setImages(p => p.filter(i => i.id !== imageId))
      toast.success('Image deleted')
    } catch { toast.error('Failed to delete image') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        short_description: form.short_description,
        description: form.description,
        category_id: form.category_id || null,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        weight: form.weight || null,
        servings: form.servings || null,
        prep_time_hours: parseInt(form.prep_time_hours) || 24,
        stock_count: parseInt(form.stock_count) || 100,
        flavours: form.flavours ? form.flavours.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergens: form.allergens ? form.allergens.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_new: form.is_new,
        is_available: form.is_available,
        is_pinned: form.is_pinned,
        rich_content: {
          headline: form.rich_headline || form.name,
          highlights: form.rich_highlights
            ? form.rich_highlights.split('\n').map(s => s.trim()).filter(Boolean)
            : [],
          care_instructions: form.rich_care || null,
        },
      }

      let id = cakeId
      if (cakeId) {
        await adminApi.updateCake(cakeId, payload)
        toast.success('Cake updated!')
      } else {
        const res = await adminApi.createCake(payload)
        id = res.id
        toast.success('Cake created!')
      }

      // Upload new images
      if (uploadFiles.length > 0 && id) {
        setUploading(true)
        try {
          await uploadCakeImages(id, uploadFiles)
          toast.success(`${uploadFiles.length} image(s) uploaded!`)
        } catch (err: any) { toast.error('Some images failed: ' + err.message) }
        finally { setUploading(false) }
      }

      router.push('/admin/cakes')
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner w-8 h-8" />
    </div>
  )

  const toggleFlags = [
    { key: 'is_featured', label: 'Featured', color: 'brand' },
    { key: 'is_bestseller', label: 'Bestseller', color: 'amber' },
    { key: 'is_new', label: 'New', color: 'sky' },
    { key: 'is_available', label: 'Available', color: 'emerald' },
    { key: 'is_pinned', label: 'Pinned on Home', color: 'purple' },
  ]

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">
            {cakeId ? 'Edit Cake' : 'Add New Cake'}
          </h1>
          <p className="text-gray-400 text-sm">{cakeId ? 'Update product details' : 'Create a new cake listing'}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="btn-primary gap-2">
            {(saving || uploading) ? <span className="spinner" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : uploading ? 'Uploading...' : (cakeId ? 'Save Changes' : 'Create Cake')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Basic Information</h3>
            <div>
              <label className="label">Cake Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Strawberry Dream Cake" required />
            </div>
            <div>
              <label className="label">Short Description</label>
              <input className="input" value={form.short_description}
                onChange={e => set('short_description', e.target.value)}
                placeholder="Brief tagline shown on cards (max 120 chars)" maxLength={120} />
            </div>
            <div>
              <label className="label">Full Description</label>
              <textarea className="input" rows={4} value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Detailed description of the cake..." />
            </div>
          </div>

          {/* Rich content */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Rich Content (Detail Page)</h3>
            <div>
              <label className="label">Hero Headline</label>
              <input className="input" value={form.rich_headline}
                onChange={e => set('rich_headline', e.target.value)}
                placeholder="Tagline shown prominently on product page" />
            </div>
            <div>
              <label className="label">Highlights (one per line)</label>
              <textarea className="input" rows={4} value={form.rich_highlights}
                onChange={e => set('rich_highlights', e.target.value)}
                placeholder={"100% Fresh Ingredients\nEggless option available\nCustom message included"} />
              <p className="text-xs text-gray-400 mt-1">Each line becomes a ✓ bullet on the product page</p>
            </div>
            <div>
              <label className="label">Storage & Care Instructions</label>
              <textarea className="input" rows={2} value={form.rich_care}
                onChange={e => set('rich_care', e.target.value)}
                placeholder="e.g. Refrigerate below 4°C. Consume within 3 days." />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Pricing & Specs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price (₹) *</label>
                <input className="input" type="number" min="0" step="0.01"
                  value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
              <div>
                <label className="label">Original Price (₹)</label>
                <input className="input" type="number" min="0" step="0.01"
                  value={form.original_price} onChange={e => set('original_price', e.target.value)}
                  placeholder="For showing discount" />
              </div>
              <div>
                <label className="label">Weight</label>
                <input className="input" value={form.weight} onChange={e => set('weight', e.target.value)}
                  placeholder="e.g. 1 Kg, 500 gm" />
              </div>
              <div>
                <label className="label">Serves</label>
                <input className="input" value={form.servings} onChange={e => set('servings', e.target.value)}
                  placeholder="e.g. 8-10 persons" />
              </div>
              <div>
                <label className="label">Prep Time (hours)</label>
                <input className="input" type="number" min="0"
                  value={form.prep_time_hours} onChange={e => set('prep_time_hours', e.target.value)} />
              </div>
              <div>
                <label className="label">Stock Count</label>
                <input className="input" type="number" min="0"
                  value={form.stock_count} onChange={e => set('stock_count', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Tags and flavours */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Tags & Attributes</h3>
            <div>
              <label className="label">Flavours</label>
              <input className="input" value={form.flavours} onChange={e => set('flavours', e.target.value)}
                placeholder="Chocolate, Vanilla, Strawberry (comma separated)" />
            </div>
            <div>
              <label className="label">Allergens</label>
              <input className="input" value={form.allergens} onChange={e => set('allergens', e.target.value)}
                placeholder="Gluten, Dairy, Nuts (comma separated)" />
            </div>
            <div>
              <label className="label">Tags</label>
              <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="popular, fruity, premium (comma separated)" />
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-5">
          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Category</h3>
            <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">No category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Flags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Flags</h3>
            <div className="space-y-2.5">
              {toggleFlags.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                  <button type="button" onClick={() => toggle(key)}
                    className={clsx(
                      'relative w-9 h-5 rounded-full transition-colors',
                      (form as any)[key] ? 'bg-sky-500' : 'bg-gray-200'
                    )}>
                    <span className={clsx(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                      (form as any)[key] ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">Images</h3>
              <span className="text-xs text-gray-400">{images.length + uploadFiles.length}/10</span>
            </div>

            {/* Existing images */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img: any) => (
                  <div key={img.id} className="relative group aspect-square">
                    <img
                      src={imgUrl(img.thumbnail_url || img.url)}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200' }}
                    />
                    {img.is_primary && (
                      <div className="absolute top-1 left-1 bg-brand-500 text-white text-[9px] px-1 rounded">Primary</div>
                    )}
                    <button type="button" onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New upload previews */}
            {uploadPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {uploadPreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute top-1 left-1 bg-sky-500 text-white text-[9px] px-1 rounded">New</div>
                    <button type="button" onClick={() => removeUploadPreview(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {images.length + uploadFiles.length < 10 && (
              <>
                <input
                  type="file" ref={fileInputRef} accept="image/*"
                  multiple className="hidden" onChange={handleFileSelect}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-brand-300 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-brand-400" />
                  <p className="text-xs text-gray-400 group-hover:text-brand-500 text-center">
                    Click to upload images<br />
                    <span className="text-[10px]">Max 10MB each · JPG, PNG, WebP</span>
                  </p>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
