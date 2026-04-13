import Link from 'next/link'
import { Cake, Phone, MapPin, Mail, Heart, Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-9876543210'

  return (
    <footer className="bg-white border-t border-pink-100 mt-16">
      <div className="container-narrow py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <Cake className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-display font-semibold text-gray-900">Agrawal Cake House</div>
                <div className="text-[10px] text-brand-500 tracking-widest font-medium">CAKERY</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Handcrafted cakes made with the finest ingredients, baked fresh daily with love and care.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.instagram.com/agrawalcakehouse/" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/agrawalcakehouse/" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                { href: '/cakes', label: 'All Cakes' },
                { href: '/cakes?category=birthday', label: 'Birthday Cakes' },
                { href: '/cakes?category=wedding', label: 'Wedding Cakes' },
                { href: '/cakes?category=custom', label: 'Custom Orders' },
                { href: '/cakes?featured=true', label: 'Featured' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-500 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                { href: '/auth/login', label: 'Sign In' },
                { href: '/auth/register', label: 'Create Account' },
                { href: '/profile', label: 'My Profile' },
                { href: '/wishlist', label: 'Wishlist' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-500 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-brand-500 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                  {phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>1, Lodhi Mohalla Barwaha, Madhya Pradesh, 451115</span>
              </li>
              <li>
                <a href="mailto:priyankagarg371@gmail.com" className="flex items-center gap-2 hover:text-brand-500 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                  hello@agrawalcakehouse.com
                </a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-brand-50 rounded-xl">
              <p className="text-xs font-medium text-brand-600">Open Daily</p>
              <p className="text-xs text-gray-500 mt-0.5">9:00 AM – 9:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-pink-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Agrawal Cake House Cakery. All rights reserved.</p>
        </div>
      </div>

    </footer>
  )
}
