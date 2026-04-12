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
              <a href="#" className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 hover:bg-brand-100 transition-colors">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 hover:bg-brand-100 transition-colors">
                <Facebook className="w-3.5 h-3.5" />
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
          <p className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-brand-400 fill-brand-400" /> in India</p>
        </div>
      </div>
    </footer>
  )
}
