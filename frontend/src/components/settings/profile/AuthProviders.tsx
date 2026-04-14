import { Chrome, Github, Mail } from 'lucide-react'

interface Identity {
  provider: 'google' | 'github' | 'email'
  email: string
}

interface Props {
  identities: Identity[]
  loading: boolean
}

const PROVIDER_META = {
  google: { label: 'Google', icon: Chrome, iconClass: 'text-blue-400' },
  github: { label: 'GitHub', icon: Github, iconClass: 'text-zinc-300' },
  email: { label: 'Email OTP', icon: Mail, iconClass: 'text-violet-400' },
}

export function AuthProviders({ identities, loading }: Props) {
  if (!loading && identities.length === 0) return null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-1">Auth Providers</h2>
      <p className="text-xs text-zinc-500 mb-4">Connected sign-in methods</p>

      <div className="space-y-3">
        {identities.map(({ provider, email }) => {
          const meta = PROVIDER_META[provider]
          const Icon = meta.icon
          return (
            <div key={provider} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/60">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-zinc-700 ${meta.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-200">{meta.label}</p>
                <p className="text-xs text-zinc-500">{email}</p>
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                Connected
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
