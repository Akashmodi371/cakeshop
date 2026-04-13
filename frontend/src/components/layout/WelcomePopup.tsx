'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cakesApi } from '@/lib/api'

export default function WelcomePopup() {
  const [popup, setPopup] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show only once per session
    const dismissed = sessionStorage.getItem('popup_dismissed')
    if (dismissed) return

    cakesApi.promotions().then(data => {
      const p = data.find((p: any) => p.section === 'popup' && p.is_active)
      if (p) {
        setPopup(p)
        setTimeout(() => setShow(true), 1500) // Show after 1.5s
      }
    }).catch(() => {})
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('popup_dismissed', '1')
  }

  if (!show || !popup) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Popup */}
      <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        {/* Close */}
        <button onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm">
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Top gradient */}
        <div className="bg-gradient-to-br from-brand-400 to-sky-500 p-6 text-white text-center">
          <div className="text-4xl mb-2">🎂</div>
          {popup.badge_text && (
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {popup.badge_text}
            </span>
          )}
          <h2 className="font-display text-2xl font-semibold mt-3">{popup.title}</h2>
          {popup.subtitle && (
            <p className="text-white/80 text-sm mt-2">{popup.subtitle}</p>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="p-5 text-center space-y-3">
          {popup.button_url && (
            <Link href={popup.button_url} onClick={handleClose}
              className="btn-primary w-full justify-center py-3">
              {popup.button_text || 'Shop Now'} →
            </Link>
          )}
          <button onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            No thanks, continue browsing
          </button>
        </div>
      </div>
    </div>
  )
}