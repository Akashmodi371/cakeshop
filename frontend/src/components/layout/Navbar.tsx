'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Heart, User, Search, Menu, X, Phone, Cake, Package } from 'lucide-react'
import { useAuthStore, useCartStore } from '@/store'
import { cartApi } from '@/lib/api'
import clsx from 'clsx'
import SearchBar from './SearchBar'
import AnnouncementBar from './AnnouncementBar'
import FlashSaleTimer from './FlashSaleTimer'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { count, setCart, openCart } = useCartStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-8966889637'

  // Fetch cart on mount
  useEffect(() => {
    cartApi.get().then(d => setCart(d.items || [], d.total || 0)).catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/cakes', label: 'All Cakes' },
    { href: '/cakes?category=birthday', label: 'Birthday' },
    { href: '/cakes?category=wedding', label: 'Wedding' },
    { href: '/cakes?category=custom', label: 'Custom' },
  ]

  return (
    <>
      {/* Top bar */}
      <AnnouncementBar />
      <FlashSaleTimer
        title="⚡ Special Offer Today!"
        discount="FREE DELIVERY"
        link="/cakes"
      />
      
{/* Main navbar */}
      <nav className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100'
          : 'bg-white/90 backdrop-blur-sm'
      )}>
        <div className="container-narrow">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white shadow-pink group-hover:shadow-pink-lg transition-shadow">
                <Image
                  src="/images/logo.jpg"
                  alt="Agrawal Cake logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-display font-semibold text-gray-900 leading-none text-lg">Agrawal Cake</div>
                <div className="text-xs text-brand-500 font-medium tracking-wide">House</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={clsx(
                    'px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
                  )}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
            <div className="hidden md:block">
              <SearchBar />
            </div>
              
              {/* Wishlist */}
              {user && (
                <Link href="/wishlist" className="btn-icon hidden sm:flex" title="Wishlist">
                  <Heart className="w-4.5 h-4.5" />
                </Link>
              )}

              {/* Cart */}
              <button onClick={openCart} className="btn-icon relative" title="Cart">
                <ShoppingCart className="w-4.5 h-4.5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(p => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-sky-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[80px] truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-card-hover border border-pink-100 py-2 z-20 animate-scale-in">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {user.role === 'admin' && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 transition-colors">
                            ⚙️ Admin Dashboard
                          </Link>
                        )}
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition-colors">
                          <User className="w-4 h-4" /> My Profile
                        </Link>
                        <Link href="/orders" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition-colors">
                          <Package className="w-4 h-4" /> My Orders
                        </Link>
                        <Link href="/wishlist" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition-colors">
                          <Heart className="w-4 h-4" /> Wishlist
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={() => { logout(); setUserMenuOpen(false) }}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="btn-primary py-2 px-4 text-xs hidden sm:inline-flex">
                  Sign In
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button onClick={() => setMobileOpen(p => !p)} className="btn-icon md:hidden ml-1">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-pink-100 bg-white animate-fade-up">
            <div className="container-narrow py-4 space-y-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    pathname === link.href ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-brand-50'
                  )}>
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="block btn-primary mt-3 text-center">
                  Sign In
                </Link>
              )}
              <a href={`tel:${phone}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-brand-500" /> {phone}
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
