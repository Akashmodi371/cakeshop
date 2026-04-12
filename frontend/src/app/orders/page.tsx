'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { ordersApi, imgUrl } from '@/lib/api'
import { Package, Clock, CheckCircle, Truck } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '💳' },
  payment_received: { label: 'Payment Received', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: '✅' },
  confirmed: { label: 'Confirmed', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🎉' },
  baking: { label: 'Baking', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '🎂' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🚚' },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🎊' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: '❌' },
}

export default function OrdersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    ordersApi.myOrders().then(d => { setOrders(d); setLoading(false) }).catch(() => setLoading(false))
  }, [user, router])

  if (loading) return (
    <div className="container-narrow py-16 text-center">
      <div className="spinner w-8 h-8 mx-auto" />
    </div>
  )

  return (
    <div className="bg-pattern min-h-screen">
      <div className="container-narrow py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-6 h-6 text-brand-500" />
          <h1 className="section-title">My Orders</h1>
          <span className="badge-pink">{orders.length}</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-pink-100">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="font-display text-2xl font-semibold text-gray-700">No orders yet</h3>
            <p className="text-gray-400 mt-2">Book your first cake!</p>
            <Link href="/cakes" className="btn-primary mt-6 inline-flex">Browse Cakes</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-pink-100 shadow-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-50 flex-shrink-0">
                        <img
                          src={imgUrl(order.cake_image || '')}
                          alt={order.cake_name}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100' }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-800">{order.cake_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">#{order.order_number}</p>
                          </div>
                          <span className={'badge border text-xs ' + st.color}>
                            {st.icon} {st.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                          <div>
                            <p className="text-[10px] text-gray-400">Total</p>
                            <p className="text-sm font-semibold text-gray-800">₹{order.total_amount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Advance Due</p>
                            <p className="text-sm font-semibold text-brand-600">₹{order.advance_amount}</p>
                          </div>
                          {order.delivery_date && (
                            <div>
                              <p className="text-[10px] text-gray-400">Delivery Date</p>
                              <p className="text-xs font-medium text-gray-700">{order.delivery_date}</p>
                            </div>
                          )}
                          {order.delivery_time && (
                            <div>
                              <p className="text-[10px] text-gray-400">Time Slot</p>
                              <p className="text-xs font-medium text-gray-700">{order.delivery_time}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status timeline */}
                    {order.history && order.history.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Order Timeline</p>
                        <div className="space-y-1.5">
                          {order.history.map((h: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 font-medium">
                                {STATUS_CONFIG[h.status]?.label || h.status}
                              </span>
                              {h.note && <span className="text-xs text-gray-400">— {h.note}</span>}
                              <span className="text-[10px] text-gray-300 ml-auto">
                                {new Date(h.created_at).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending payment action */}
                    {order.status === 'pending_payment' && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl">
                        <p className="text-xs text-amber-700 font-medium">
                          ⏳ Call us to pay ₹{order.advance_amount} advance and confirm your order
                        </p>
                        <a
                          href={'tel:' + (process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-9876543210')}
                          className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                        >
                          📞 Call Now
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}