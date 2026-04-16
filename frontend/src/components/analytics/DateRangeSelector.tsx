'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const PRESETS = [
  { label: 'Today', value: '1d' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'Custom', value: 'custom' },
]

interface DateRangeSelectorProps {
  range: string
  from?: string
  to?: string
  onChange: (key: string, value: string | null) => void
  onBatchChange?: (updates: Record<string, string | null>) => void
}

export function DateRangeSelector({ range, from, to, onChange, onBatchChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(from ?? '')
  const [customTo, setCustomTo] = useState(to ?? '')

  function shiftPeriod(direction: 'prev' | 'next') {
    const days = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90
    const fromDate = from ? new Date(from) : (() => {
      const d = new Date()
      d.setDate(d.getDate() - days)
      return d
    })()
    const toDate = to ? new Date(to) : new Date()
    const shift = direction === 'prev' ? -days : days
    fromDate.setDate(fromDate.getDate() + shift)
    toDate.setDate(toDate.getDate() + shift)
    if (onBatchChange) {
      const updates: Record<string, string | null> = {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      }
      if (range !== 'custom') updates.range = 'custom'
      onBatchChange(updates)
    } else {
      onChange('from', fromDate.toISOString().split('T')[0])
      onChange('to', toDate.toISOString().split('T')[0])
      if (range !== 'custom') onChange('range', 'custom')
    }
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    if (onBatchChange) {
      onBatchChange({ range: 'custom', from: customFrom, to: customTo })
    } else {
      onChange('from', customFrom)
      onChange('to', customTo)
      onChange('range', 'custom')
    }
    setShowCustom(false)
  }

  function handlePreset(value: string) {
    if (value === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    if (onBatchChange) {
      onBatchChange({ range: value, from: null, to: null })
    } else {
      onChange('range', value)
      onChange('from', null)
      onChange('to', null)
    }
  }

  const displayRange = from && to
    ? `${new Date(from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : null

  return (
    <div className="relative flex items-center gap-1">
      {/* Prev arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-500 hover:text-zinc-200"
        onClick={() => shiftPeriod('prev')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Preset tabs */}
      <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5 gap-0.5">
        {PRESETS.map((p) => {
          const isActive = p.value === 'custom'
            ? range === 'custom'
            : range === p.value && !from
          return (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.value === 'custom' && <Calendar className="h-3 w-3" />}
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Display range */}
      {displayRange && (
        <span className="text-xs text-zinc-500 ml-1">{displayRange}</span>
      )}

      {/* Next arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-500 hover:text-zinc-200"
        onClick={() => shiftPeriod('next')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Custom date picker dropdown */}
      {showCustom && (
        <div className="absolute top-full left-0 mt-1 z-50 flex items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">From</label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 w-36 bg-zinc-800 border-zinc-700 text-zinc-200 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">To</label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 w-36 bg-zinc-800 border-zinc-700 text-zinc-200 text-xs"
            />
          </div>
          <Button
            size="sm"
            className="h-8 bg-violet-600 hover:bg-violet-500 text-white text-xs"
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-zinc-400 text-xs"
            onClick={() => setShowCustom(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
