'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updatePreferences, UserPreferences } from '@/lib/api/settings'
import { Label } from '@/components/ui/label'

const TIMEZONES = ['Asia/Riyadh', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']
const DATE_FORMATS = [
  { value: 'MMM D, YYYY', label: 'Apr 9, 2026' },
  { value: 'DD/MM/YYYY', label: '09/04/2026' },
  { value: 'MM/DD/YYYY', label: '04/09/2026' },
]

interface Props {
  preferences?: UserPreferences
}

export function PreferencesForm({ preferences }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<UserPreferences>()

  useEffect(() => {
    if (preferences) reset(preferences)
  }, [preferences, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] })
      toast.success('Preferences saved')
    },
    onError: () => toast.error('Failed to save preferences'),
  })

  const selectClass = 'w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500'

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-5">Preferences</h2>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Theme</Label>
            <select {...register('theme')} className={selectClass}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Language</Label>
            <select {...register('language')} className={selectClass}>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Timezone</Label>
            <select {...register('timezone')} className={selectClass}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Date Format</Label>
            <select {...register('date_format')} className={selectClass}>
              {DATE_FORMATS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isDirty || isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Preferences
          </button>
        </div>
      </form>
    </section>
  )
}
