'use client'
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.settings().then(d => { setSettings(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const set = (k: string, v: any) => setSettings((p: any) => ({ ...p, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await adminApi.updateSettings(settings)
      toast.success('Settings saved!')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const fields = [
    { key: 'shop_name', label: 'Shop Name', type: 'text' },
    { key: 'shop_phone', label: 'Phone Number', type: 'text' },
    { key: 'shop_address', label: 'Shop Address', type: 'text' },
    { key: 'currency_symbol', label: 'Currency Symbol', type: 'text' },
    { key: 'delivery_charge', label: 'Delivery Charge (₹)', type: 'number' },
    { key: 'free_delivery_above', label: 'Free Delivery Above (₹)', type: 'number' },
    { key: 'min_order', label: 'Minimum Order Amount (₹)', type: 'number' },
  ]

  if (loading) return <div className="p-6 text-center text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-display font-semibold text-gray-900 mb-6">Shop Settings</h1>
      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type={f.type} className="input"
                value={settings[f.key] ?? ''}
                onChange={e => set(f.key, f.type === 'number' ? parseFloat(e.target.value) : e.target.value)} />
            </div>
          ))}
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            {saving ? <span className="spinner" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
