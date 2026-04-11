'use client'
import { useState } from 'react'
import { Calendar, Clock, CheckCircle } from 'lucide-react'

export default function DeliveryDatePicker({ prepHours = 24 }: { prepHours?: number }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // Minimum date = today + prep time
  const minDate = new Date()
  minDate.setHours(minDate.getHours() + prepHours)
  const minDateStr = minDate.toISOString().split('T')[0]

  // Max date = 30 days from now
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const timeSlots = [
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
  ]

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="bg-gradient-to-br from-brand-50 to-sky-50 border border-brand-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold text-gray-800 text-sm">Choose Delivery Date & Time</h3>
      </div>

      {/* Date picker */}
      <div>
        <label className="label text-xs">Delivery Date</label>
        <input
          type="date"
          min={minDateStr}
          max={maxDateStr}
          value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setSelectedTime('') }}
          className="input text-sm"
        />
        {selectedDate && (
          <p className="text-xs text-brand-600 mt-1 font-medium">
            📅 {formatDate(selectedDate)}
          </p>
        )}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <label className="label text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" /> Delivery Time Slot
          </label>
          <div className="grid grid-cols-1 gap-2">
            {timeSlots.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={'w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all ' +
                  (selectedTime === slot
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50'
                  )
                }
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation */}
      {selectedDate && selectedTime && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-emerald-700">Delivery Scheduled!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {formatDate(selectedDate)} · {selectedTime}
            </p>
          </div>
        </div>
      )}

      {/* Prep time note */}
      <p className="text-[10px] text-gray-400">
        * Minimum {prepHours}h advance booking required. Dates shown accordingly.
      </p>
    </div>
  )
}