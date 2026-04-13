'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Gift, Truck, Clock } from 'lucide-react'
import { cakesApi } from '@/lib/api'

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    cakesApi.promotions().then(data => {
      const ann = data.filter((p: any) => p.section === 'announcement' && p.is_active)
      setAnnouncements(ann.length > 0 ? ann : [
        { title: '🎂 Free delivery on orders above ₹500', button_text: 'Order Now', button_url: '/cakes' },
        { title: '✨ Same day delivery available — Order before 3 PM', button_text: 'Shop Now', button_url: '/cakes' },
        { title: '💕 Custom cakes for every occasion — Call us!', button_text: 'Call Now', button_url: 'tel:+919876543210' },
      ])
    }).catch(() => {
      setAnnouncements([
        { title: '🎂 Free delivery on orders above ₹500', button_text: 'Order Now', button_url: '/cakes' },
      ])
    })
  }, [])

  useEffect(() => {
    if (announcements.length <= 1) return
    const t = setInterval(() => setCurrent(p => (p + 1) % announcements.length), 4000)
    return () => clearInterval(t)
  }, [announcements])

  if (!visible || announcements.length === 0) return null
  const ann = announcements[current]

  return (
    <div className="relative bg-gradient-to-r from-brand-500 via-brand-400 to-sky-500 text-white overflow-hidden">
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative flex items-center justify-between max-w-6xl mx-auto px-4 py-2.5">
        {/* Dots nav */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {announcements.map((_: any, i: number) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={'w-1.5 h-1.5 rounded-full transition-all ' + (i === current ? 'bg-white w-3' : 'bg-white/40')} />
          ))}
        </div>

        {/* Text */}
        <p className="flex-1 text-center text-xs sm:text-sm font-medium">
          {ann.title}
          {ann.button_url && (
            <Link href={ann.button_url}
              className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors">
              {ann.button_text} →
            </Link>
          )}
        </p>

        <button onClick={() => setVisible(false)}
          className="flex-shrink-0 hover:bg-white/20 rounded-full p-0.5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}