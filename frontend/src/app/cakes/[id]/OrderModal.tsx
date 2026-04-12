'use client'
import { useState } from 'react'
import { X, Phone, CheckCircle, Clock, CreditCard } from 'lucide-react'
import { ordersApi } from '@/lib/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  cake: any
  onClose: () => void
}

const STATUS_STEPS = [
  { key: 'pending_payment', label: 'Pending Payment', icon: '💳', desc: 'Pay 50% advance' },
  { key: 'payment_received', label: 'Payment Received', icon: '✅', desc: 'Admin confirmed' },
  { key: 'confirmed', label: 'Order Confirmed', icon: '🎉', desc: 'We are on it!' },
  { key: 'baking', label: 'Baking', icon: '🎂', desc: 'Your cake is baking' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', desc: 'On the way!' },
  { key: 'delivered', label: 'Delivered', icon: '🎊', desc: 'Enjoy your cake!' },
]

export default function OrderModal({ cake, onClose }: Props) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'confirm' | 'placed'>('details')
  const [form, setForm] = useState({
    quantity: 1,
    delivery_date: '',
    delivery_time: '',
    delivery_address: '',
    special_instructions: '',
  })
  const [placedOrder, setPlacedOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE || '+91-9876543210'

  const total = parseFloat(cake.price) * form.quantity
  const advance = (total * 0.5).toFixed(2)

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handlePlace = async () => {
    if (!user) { toast.error('Please login first'); return }
    setLoading(true)
    try {
      const order = await ordersApi.place({
        cake_id: cake.id,
        ...form,
        delivery_date: form.delivery_date || null,
        delivery_time: form.delivery_time || null,
      })
      setPlacedOrder(order)
      setStep('placed')
      toast.success('Order placed successfully! 🎂')
    } catch (err: any) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display text-xl font-semibold text-gray-900">
            {step === 'placed' ? '🎉 Order Placed!' : 'Book This Cake'}
          </h2>
          <button onClick={onClose} className="btn-icon w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step: Details */}
        {step === 'details' && (
          <div className="p-5 space-y-4">
            {/* Cake summary */}
            <div className="flex gap-3 p-3 bg-brand-50 rounded-2xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                <img src={cake.images?.[0]?.url || ''} alt={cake.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as any).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100' }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{cake.name}</p>
                <p className="text-brand-600 font-bold">₹{cake.price} per cake</p>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <button onClick={() => set('quantity', Math.max(1, form.quantity - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-50 transition-colors">−</button>
                <span className="w-8 text-center font-semibold">{form.quantity}</span>
                <button onClick={() => set('quantity', form.quantity + 1)}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-50 transition-colors">+</button>
              </div>
            </div>

            {/* Delivery date & time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Delivery Date</label>
                <input type="date" className="input text-sm"
                  min={new Date(Date.now() + cake.prep_time_hours * 3600000).toISOString().split('T')[0]}
                  value={form.delivery_date}
                  onChange={e => set('delivery_date', e.target.value)} />
              </div>
              <div>
                <label className="label">Time Slot</label>
                <select className="input text-sm" value={form.delivery_time}
                  onChange={e => set('delivery_time', e.target.value)}>
                  <option value="">Select</option>
                  <option>10 AM - 12 PM</option>
                  <option>12 PM - 2 PM</option>
                  <option>2 PM - 4 PM</option>
                  <option>4 PM - 6 PM</option>
                  <option>6 PM - 8 PM</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="label">Delivery Address</label>
              <textarea className="input text-sm" rows={2}
                placeholder="Enter full delivery address..."
                value={form.delivery_address}
                onChange={e => set('delivery_address', e.target.value)} />
            </div>

            {/* Special instructions */}
            <div>
              <label className="label">Special Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="input text-sm" rows={2}
                placeholder="Message on cake, special design requests..."
                value={form.special_instructions}
                onChange={e => set('special_instructions', e.target.value)} />
            </div>

            <button onClick={() => setStep('confirm')} className="btn-primary w-full py-3">
              Continue to Payment Info →
            </button>
          </div>
        )}

        {/* Step: Confirm + Payment info */}
        {step === 'confirm' && (
          <div className="p-5 space-y-4">
            {/* Order summary */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{cake.name} × {form.quantity}</span>
                <span className="font-medium">₹{total.toFixed(0)}</span>
              </div>
              {form.delivery_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium">{form.delivery_date} · {form.delivery_time}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="text-brand-600">₹{total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Payment instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-800 text-sm">Advance Payment Required</h3>
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl p-3">
                <span className="text-sm text-gray-600">50% Advance to pay now</span>
                <span className="text-xl font-bold text-brand-600">₹{advance}</span>
              </div>
              <p className="text-xs text-amber-700">
                Pay ₹{advance} via UPI/Cash and call us to confirm. Remaining ₹{(total - parseFloat(advance)).toFixed(0)} on delivery.
              </p>
              <a href={'tel:' + phone}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                <Phone className="w-4 h-4" />
                Call to Pay — {phone}
              </a>
            </div>

            {/* How it works */}
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
              <h3 className="font-semibold text-sky-800 text-sm mb-2">How it works</h3>
              <div className="space-y-2">
                {[
                  'Place your order below',
                  'Call us and pay ₹' + advance + ' advance',
                  'We confirm & start baking',
                  'Track your order in My Orders',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs text-sky-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="btn-secondary flex-1">Back</button>
              <button onClick={handlePlace} disabled={loading} className="btn-primary flex-1 py-3">
                {loading ? <span className="spinner" /> : '✓ Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Placed */}
        {step === 'placed' && placedOrder && (
          <div className="p-5 space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎂</div>
              <h3 className="font-display text-2xl font-semibold text-gray-900">Order Placed!</h3>
              <p className="text-gray-500 text-sm mt-1">Order #{placedOrder.order_number}</p>
            </div>

            {/* Status steps */}
            <div className="space-y-2">
              {STATUS_STEPS.map((s, i) => {
                const currentIdx = STATUS_STEPS.findIndex(x => x.key === placedOrder.status)
                const isDone = i <= currentIdx
                const isCurrent = i === currentIdx
                return (
                  <div key={s.key} className={'flex items-center gap-3 p-3 rounded-xl ' + (isCurrent ? 'bg-brand-50 border border-brand-100' : '')}>
                    <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ' +
                      (isDone ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400')}>
                      {isDone ? '✓' : s.icon}
                    </div>
                    <div>
                      <p className={'text-sm font-medium ' + (isCurrent ? 'text-brand-700' : isDone ? 'text-gray-700' : 'text-gray-400')}>
                        {s.label}
                      </p>
                      {isCurrent && <p className="text-xs text-brand-500">{s.desc}</p>}
                    </div>
                    {isCurrent && <div className="ml-auto"><div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" /></div>}
                  </div>
                )
              })}
            </div>

            {/* Next step */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-amber-800">Next Step</p>
              <p className="text-xs text-amber-700 mt-1">Call us now and pay ₹{placedOrder.advance_amount} advance to confirm your order</p>
              <a href={'tel:' + phone}
                className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                <Phone className="w-4 h-4" /> Call Now — {phone}
              </a>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Close</button>
              <button onClick={() => { onClose(); router.push('/orders') }}
                className="btn-primary flex-1">
                View My Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}