'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Cake, Tag, Megaphone, Flag, Settings, Users, LogOut, ChevronRight, ShieldCheck, Menu, X, Package } from 'lucide-react'
import { useAuthStore } from '@/store'
import clsx from 'clsx'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/cakes', label: 'Cakes', icon: Cake },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/orders', label: 'Orders', icon: Package },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    if (user && user.role !== 'admin') { router.push('/'); return }
  }, [user])

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner w-8 h-8" />
    </div>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Admin Portal</p>
              <p className="text-xs text-gray-400">Agrawal Cake House</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button onClick={() => setSidebarOpen(false)}
            className="md:hidden btn-icon w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}>
              <Icon className={clsx('w-4 h-4 flex-shrink-0', active ? 'text-sky-500' : 'text-gray-400 group-hover:text-gray-600')} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-sky-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-sky-400 flex items-center justify-center text-white text-xs font-bold">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/') }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

  {/* ── Mobile overlay ── */}
  {sidebarOpen && (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-[101] flex flex-col">
        <SidebarContent />
      </aside>
    </div>
  )}

  {/* ── Desktop sidebar ── */}
  <aside className="hidden md:flex md:w-60 bg-white border-r border-gray-100 flex-col flex-shrink-0">
    <SidebarContent />
  </aside>

  {/* ── Main content ── */}
  <div className="flex-1 flex flex-col overflow-hidden min-w-0">
    {/* Mobile top bar */}
    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
      <button
        onClick={() => setSidebarOpen(true)}
        className="btn-icon w-9 h-9 rounded-xl border border-gray-200 flex-shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm truncate">Admin Portal</span>
      </div>
    </div>

    {/* Page content */}
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>

</div>
  )
}