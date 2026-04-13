'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Zap, Gift } from 'lucide-react'
import { cakesApi } from '@/lib/api'

export default function WelcomePopup() {
  const [popup, setPopup] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 30, s: 0 })

  useEffect(() => {
    const dismissed = sessionStorage.getItem('popup_dismissed')
    if (dismissed) return

    cakesApi.promotions().then(data => {
      const p = data.find((p: any) => p.section === 'popup' && p.is_active)
      if (p) {
        setPopup(p)
        setTimeout(() => setShow(true), 1000)
      }
    }).catch(() => {})
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!show) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 }
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 }
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(t)
  }, [show])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('popup_dismissed', '1')
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  if (!show || !popup) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Full screen overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      {/* Popup */}
      <div className="relative w-full max-w-md animate-scale-in">
        {/* Close button */}
        <button onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-700" />
        </button>

        {/* Main card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Top — gradient with offer */}
          <div className="relative bg-gradient-to-br from-brand-500 via-brand-400 to-sky-400 p-8 text-white text-center overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

            {/* Badge */}
            {popup.badge_text && (
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
                <Zap className="w-3 h-3 fill-white" />
                {popup.badge_text}
              </div>
            )}

            <div className="text-5xl mb-3">🎂</div>
            <h2 className="font-display text-3xl font-semibold leading-tight">{popup.title}</h2>
            {popup.subtitle && (
              <p className="text-white/80 text-sm mt-2 leading-relaxed">{popup.subtitle}</p>
            )}

            {/* Timer */}
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="text-white/70 text-xs">Offer ends in:</span>
              {[
                { val: pad(timeLeft.h), label: 'HR' },
                { val: pad(timeLeft.m), label: 'MIN' },
                { val: pad(timeLeft.s), label: 'SEC' },
              ].map((t, i) => (
                <span key={t.label} className="flex items-center gap-1">
                  {i > 0 && <span className="text-white/50 font-bold text-lg">:</span>}
                  <span className="flex flex-col items-center">
                    <span className="bg-white/20 backdrop-blur-sm font-mono font-bold text-lg px-2 py-1 rounded-lg min-w-[40px] text-center">
                      {t.val}
                    </span>
                    <span className="text-[9px] text-white/60 mt-0.5">{t.label}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Bottom — CTA */}
          <div className="p-6 space-y-3 bg-gradient-to-b from-white to-brand-50">
            {popup.button_url && (
              <Link href={popup.button_url} onClick={handleClose}
                className="btn-primary w-full justify-center py-4 text-base">
                {popup.button_text || 'Shop Now'} →
              </Link>
            )}
            <button onClick={handleClose}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
              No thanks, continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}