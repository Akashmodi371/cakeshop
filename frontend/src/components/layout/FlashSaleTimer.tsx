'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Props {
  endsAt?: Date
  title?: string
  discount?: string
  link?: string
}

export default function FlashSaleTimer({
  endsAt,
  title = '⚡ Flash Sale — Limited Time!',
  discount = '20% OFF',
  link = '/cakes'
}: Props) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  const [visible, setVisible] = useState(true)

  // Default: sale ends at midnight today
  const saleEnd = endsAt || (() => {
    const d = new Date()
    d.setHours(23, 59, 59, 0)
    return d
  })()

  useEffect(() => {
    const calc = () => {
      const diff = saleEnd.getTime() - Date.now()
      if (diff <= 0) { setVisible(false); return }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [])

  if (!visible) return null

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 fill-white" />
          <span className="text-xs sm:text-sm font-bold">{title}</span>
          <span className="bg-white text-orange-600 text-xs font-black px-2 py-0.5 rounded-full ml-1">
            {discount}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-white/70">Ends in</span>
          {[
            { val: pad(timeLeft.h), label: 'HRS' },
            { val: pad(timeLeft.m), label: 'MIN' },
            { val: pad(timeLeft.s), label: 'SEC' },
          ].map((t, i) => (
            <span key={t.label} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-white/60 font-bold">:</span>}
              <span className="bg-white/20 rounded px-1.5 py-0.5 font-mono font-bold text-sm min-w-[32px] text-center">
                {t.val}
              </span>
              <span className="text-[9px] text-white/60 hidden sm:inline">{t.label}</span>
            </span>
          ))}
        </div>

        <Link href={link}
          className="bg-white text-orange-600 text-xs font-bold px-3 py-1 rounded-full hover:bg-orange-50 transition-colors">
          Shop Now →
        </Link>
      </div>
    </div>
  )
}