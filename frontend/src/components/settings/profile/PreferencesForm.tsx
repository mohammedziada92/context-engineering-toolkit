'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updatePreferences, UserPreferences } from '@/lib/api/settings'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
  const { setTheme } = useTheme()
  const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<UserPreferences>()

  const { mutate, isPending } = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] })
      toast.success('Preferences saved')
    },
    onError: () => toast.error('Failed to save preferences'),
  })

  // Sync backend preferences → form + theme
  useEffect(() => {
    if (preferences) {
      reset(preferences)
      if (preferences.theme) setTheme(preferences.theme)
    }
  }, [preferences, reset, setTheme])

  // Instant theme preview + auto-save on dropdown change
  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name === 'theme' && formValues.theme) {
        setTheme(formValues.theme)
        mutate({ theme: formValues.theme } as UserPreferences)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setTheme, mutate])

  const selectClass = 'select-native w-full'

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-5">Preferences</h2>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Theme</Label>
            <div className="space-y-1.5">
              {([
                { value: 'dark', label: 'Dark', disabled: false },
                { value: 'light', label: 'Light', disabled: true },
                { value: 'system', label: 'System', disabled: true },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors',
                    opt.disabled
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                  )}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('theme')}
                    disabled={opt.disabled}
                    className="accent-violet-500"
                  />
                  {opt.label}
                  {opt.disabled && (
                    <span className="ml-auto text-[10px] font-medium text-zinc-600 bg-zinc-800 rounded px-1.5 py-0.5">v2</span>
                  )}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Timezone</Label>
            <select {...register('timezone')} className={selectClass}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
