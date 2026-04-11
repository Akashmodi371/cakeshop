'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, Lock, LogOut, CheckCircle } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { user, setAuth, logout, token } = useAuthStore()
  const [form, setForm] = useState({ name: '', phone: '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [tab, setTab] = useState<'profile' | 'security'>('profile')

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    setForm({ name: user.name || '', phone: user.phone || '' })
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await authApi.updateProfile(form)
      setAuth(updated, token!)
      toast.success('Profile updated!')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirm) {
      toast.error('Passwords do not match'); return
    }
    if (passForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters'); return
    }
    setSavingPass(true)
    try {
      await authApi.changePassword(passForm.currentPassword, passForm.newPassword)
      toast.success('Password changed successfully!')
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err: any) { toast.error(err.message) }
    finally { setSavingPass(false) }
  }

  if (!user) return null

  return (
    <div className="bg-pattern min-h-screen">
      <div className="container-narrow py-10 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-sky-400 flex items-center justify-center text-white text-2xl font-display font-bold shadow-pink">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-gray-900">{user.name}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <span className={`badge mt-1 ${user.role === 'admin' ? 'badge-sky' : 'badge-pink'}`}>
              {user.role === 'admin' ? '⚙️ Admin' : '👤 Customer'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6">
          {(['profile', 'security'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 shadow-card p-6">
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-1">Personal Information</h2>

              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input pl-10" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name" />
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input pl-10 bg-gray-50 cursor-not-allowed"
                    value={user.email} disabled />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input pl-10" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91-XXXXXXXXXX" type="tel" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
                  {saving ? <span className="spinner" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { logout(); router.push('/') }}
                  className="btn-ghost text-red-500 hover:bg-red-50 gap-2 px-5">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-1">Change Password</h2>

              {[
                { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 characters' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" className="input pl-10"
                      placeholder={f.placeholder}
                      value={(passForm as any)[f.key]}
                      onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                </div>
              ))}

              <button type="submit" disabled={savingPass} className="btn-primary w-full py-3">
                {savingPass ? <span className="spinner" /> : <Lock className="w-4 h-4" />}
                {savingPass ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[
            { href: '/wishlist', icon: '💕', label: 'My Wishlist', desc: 'Saved cakes' },
            { href: '/cakes', icon: '🎂', label: 'Browse Cakes', desc: 'Discover more' },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="bg-white rounded-2xl border border-pink-100 p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-pink transition-all">
              <span className="text-2xl">{l.icon}</span>
              <div>
                <p className="font-medium text-sm text-gray-800">{l.label}</p>
                <p className="text-xs text-gray-400">{l.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
