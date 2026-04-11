'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cakesApi } from '@/lib/api'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  const [current, setCurrent] = useState(0)
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    cakesApi.promotions().then(data => {
      const ann = data.filter((p: any) => p.section === 'announcement' && p.is_active)
      if (ann.length > 0) setAnnouncements(ann)
      else setAnnouncements([
        { title: '🎂 Free delivery on orders above ₹500', button_text: 'Order Now', button_url: '/cakes' },
        { title: '✨ Fresh cakes baked daily — order by 3 PM for same day', button_text: 'Shop Now', button_url: '/cakes' },
      ])
    }).catch(() => {
      setAnnouncements([
        { title: '🎂 Free delivery on orders above ₹500', button_text: 'Order Now', button_url: '/cakes' },
      ])
    })
  }, [])

  useEffect(() => {
    if (announcements.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(p => (p + 1) % announcements.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [announcements])

  if (!visible || announcements.length === 0) return null

  const ann = announcements[current]

  return (
    <div className="bg-gradient-to-r from-brand-500 to-sky-500 text-white text-xs py-2 px-4 relative">
      <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto">
        {announcements.length > 1 && (
          <button onClick={() => setCurrent(p => (p - 1 + announcements.length) % announcements.length)}
            className="hidden sm:flex hover:bg-white/20 rounded-full p-0.5 transition-colors flex-shrink-0">
            <ChevronLeft className="w-3 h-3" />
          </button>
        )}

        <p className="text-center flex-1">
          {ann.title}
          {ann.button_url && (
            <Link href={ann.button_url} className="ml-2 underline font-semibold hover:text-white/80">
              {ann.button_text || 'View'} →
            </Link>
          )}
        </p>

        {announcements.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {announcements.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={'w-1.5 h-1.5 rounded-full transition-all ' + (i === current ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
        )}

        {announcements.length > 1 && (
          <button onClick={() => setCurrent(p => (p + 1) % announcements.length)}
            className="hidden sm:flex hover:bg-white/20 rounded-full p-0.5 transition-colors flex-shrink-0">
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        <button onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-0.5 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}