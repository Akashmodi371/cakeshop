'use client'
import { useState, useEffect } from 'react'
import { ordersApi, imgUrl } from '@/lib/api'
import { Package, CheckCircle, Clock, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUSES = [
  { value: '', label: 'All Orders' },
  { value: 'pending_payment', label: '💳 Pending Payment' },
  { value: 'payment_received', label: '✅ Payment Received' },
  { value: 'confirmed', label: '🎉 Confirmed' },
  { value: 'baking', label: '🎂 Baking' },
  { value: 'out_for_delivery', label: '🚚 Out for Delivery' },
  { value: 'delivered', label: '🎊 Delivered' },
  { value: 'cancelled', label: '❌ Cancelled' },
]

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-700',
  payment_received: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-purple-50 text-purple-700',
  baking: 'bg-orange-50 text-orange-700',
  out_for_delivery: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default function AdminOrdersPage() {
  const [data, setData] = useState<any>({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [newStatus, setNewStatus] = useState('')

  const load = (status = statusFilter) => {
    setLoading(true)
    ordersApi.adminAll(status ? { status } : {})
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const handleUpdateStatus = async (orderId: string) => {
    if (!newStatus) { toast.error('Select a status'); return }
    setUpdating(orderId)
    try {
      await ordersApi.updateStatus(orderId, newStatus, noteInput)
      toast.success('Order status updated!')
      setExpandedId(null)
      setNoteInput('')
      setNewStatus('')
      load()
    } catch { toast.error('Failed to update') }
    finally { setUpdating(null) }
  }

  const handleConfirmPayment = async (orderId: string) => {
    setUpdating(orderId)
    try {
      await ordersApi.confirmPayment(orderId)
      toast.success('Payment confirmed! 🎉')
      load()
    } catch { toast.error('Failed') }
    finally { setUpdating(null) }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data.pagination?.total || 0} total orders</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(s.value)}
            className={clsx('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              statusFilter === s.value ? 'bg-sky-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300')}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="skeleton h-4 rounded w-1/3 mb-2" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          ))
        ) : data.data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            No orders found
          </div>
        ) : data.data.map((order: any) => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-50 flex-shrink-0">
                  <img src={imgUrl(order.cake_image || '')} alt={order.cake_name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800">{order.cake_name}</p>
                      <p className="text-xs text-gray-400">#{order.order_number}</p>
                    </div>
                    <span className={'badge text-xs ' + (STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600')}>
                      {STATUSES.find(s => s.value === order.status)?.label || order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-gray-400">Customer</p>
                      <p className="text-xs font-medium text-gray-700">{order.user_name}</p>
                      <p className="text-[10px] text-gray-400">{order.user_phone || order.user_email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Total · Advance</p>
                      <p className="text-xs font-semibold text-brand-600">₹{order.total_amount}</p>
                      <p className="text-[10px] text-gray-500">50% = ₹{order.advance_amount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Delivery</p>
                      <p className="text-xs font-medium text-gray-700">{order.delivery_date || '—'}</p>
                      <p className="text-[10px] text-gray-400">{order.delivery_time || ''}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Quantity · Date</p>
                      <p className="text-xs font-medium text-gray-700">{order.quantity} cake(s)</p>
                      <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <p className="text-xs text-gray-500 mt-1.5">📍 {order.delivery_address}</p>
                  )}
                  {order.special_instructions && (
                    <p className="text-xs text-gray-500 mt-0.5">📝 {order.special_instructions}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {order.status === 'pending_payment' && (
                  <button onClick={() => handleConfirmPayment(order.id)}
                    disabled={updating === order.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                    {updating === order.id ? <span className="spinner w-3 h-3" /> : '✅'}
                    Confirm Payment Received
                  </button>
                )}
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors">
                  {expandedId === order.id ? 'Cancel' : '✏️ Update Status'}
                </button>
              </div>

              {/* Status update panel */}
              {expandedId === order.id && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-2">
                  <select className="input text-sm" value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}>
                    <option value="">Select new status...</option>
                    {STATUSES.filter(s => s.value).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <input className="input text-sm" placeholder="Add a note (optional)"
                    value={noteInput} onChange={e => setNoteInput(e.target.value)} />
                  <button onClick={() => handleUpdateStatus(order.id)}
                    disabled={updating === order.id}
                    className="btn-primary w-full py-2 text-sm">
                    {updating === order.id ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}