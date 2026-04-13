'use client'
import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, Check, Loader } from 'lucide-react'
import { adminApi, uploadCakeImages } from '@/lib/api'
import { useAuthStore } from '@/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function QuickUploadPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'details' | 'done'>('upload')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/')
    if (!user) router.push('/auth/login')
  }, [user])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0, 5)
    setImages(arr)
    setPreviews(arr.map(f => URL.createObjectURL(f)))
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Cake ka naam likhna zaroori hai'); return }
    setLoading(true)
    try {
      // Create cake with minimal info
      const cake = await adminApi.createCake({
        name: name.trim(),
        price: parseFloat(price) || 0,
        short_description: '',
        is_available: true,
        is_new: true,
        flavours: [],
        allergens: [],
        tags: [],
      })

      // Upload images
      if (images.length > 0) {
        await uploadCakeImages(cake.id, images)
      }

      setStep('done')
      toast.success('Cake add ho gaya! 🎂')
    } catch (err: any) {
      toast.error(err.message || 'Kuch galat hua')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-sky-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <span className="text-white text-sm">🎂</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Agrawal Cake House</p>
          <p className="text-xs text-gray-400">Quick Cake Upload</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* Step 1 — Upload */}
        {step === 'upload' && (
          <div className="w-full max-w-sm space-y-4 animate-fade-up">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📸</div>
              <h1 className="font-display text-2xl font-semibold text-gray-900">Cake Photo Upload</h1>
              <p className="text-gray-400 text-sm mt-1">Photo lo ya gallery se choose karo</p>
            </div>

            {/* Camera button */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white flex items-center justify-center gap-3 shadow-pink-lg active:scale-95 transition-all text-lg font-semibold">
              <Camera className="w-6 h-6" />
              Abhi Photo Lo
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={e => handleFiles(e.target.files)} />

            {/* Gallery button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-5 rounded-2xl bg-white border-2 border-brand-200 text-brand-600 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg font-semibold">
              <Upload className="w-6 h-6" />
              Gallery se Choose Karo
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple
              className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 'details' && (
          <div className="w-full max-w-sm space-y-4 animate-fade-up">
            <div className="text-center mb-4">
              <h1 className="font-display text-2xl font-semibold text-gray-900">Cake ki Details</h1>
              <p className="text-gray-400 text-sm mt-1">Bas naam aur price likhna hai</p>
            </div>

            {/* Image previews */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previews.map((src, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-brand-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <button onClick={() => setStep('upload')}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 text-xs text-center">
                + Add More
              </button>
            </div>

            {/* Name input */}
            <div>
              <label className="label text-base">Cake ka Naam *</label>
              <input
                className="input text-lg py-4"
                placeholder="e.g. Chocolate Cake"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Price input */}
            <div>
              <label className="label text-base">Price (₹)</label>
              <input
                className="input text-lg py-4"
                type="number"
                placeholder="e.g. 750"
                value={price}
                onChange={e => setPrice(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-lg font-semibold flex items-center justify-center gap-3 shadow-pink-lg active:scale-95 transition-all disabled:opacity-50">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : '🎂'}
              {loading ? 'Upload ho raha hai...' : 'Upload Karo!'}
            </button>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 'done' && (
          <div className="w-full max-w-sm text-center animate-scale-in space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-gray-900">Ho Gaya! 🎉</h1>
            <p className="text-gray-400">Cake successfully add ho gaya website pe</p>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => { setStep('upload'); setImages([]); setPreviews([]); setName(''); setPrice('') }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-base font-semibold">
                ➕ Aur Cake Add Karo
              </button>
              <button onClick={() => router.push('/admin/cakes')}
                className="w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-600 text-base font-semibold">
                Admin Panel Dekho
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom tip */}
      {step === 'upload' && (
        <div className="p-4 text-center">
          <p className="text-xs text-gray-400">💡 Baaki details baad mein admin panel se edit kar sakte hain</p>
        </div>
      )}
    </div>
  )
}