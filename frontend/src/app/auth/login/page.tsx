'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Cake, Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login(email, password)
      setAuth(user, token)
      toast.success(`Welcome back, ${user.name?.split(' ')[0]}! 🎂`)
      router.push(user.role === 'admin' ? '/admin' : '/')
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 bg-pattern">
      <div className="w-full max-w-md animate-fade-up">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card-hover border border-pink-100 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-pink mb-3">
              <Cake className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-gray-900">Welcome Back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your Sweet Bliss account</p>
          </div>

          {/* Demo credentials */}
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-6">
            <p className="text-xs font-semibold text-sky-700 mb-1">Demo Credentials</p>
            <p className="text-xs text-sky-600">Admin: admin@cakeshop.com / Admin@123</p>
            <p className="text-xs text-sky-600">Customer: priya@example.com / Customer@123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10"
                  placeholder="Your password" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="divider my-6 text-xs text-gray-400">or</div>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-brand-500 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
