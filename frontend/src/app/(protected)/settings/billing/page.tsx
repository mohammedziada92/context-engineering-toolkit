import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsNav } from '@/components/settings/settings-nav'
import { BillingPlanCard } from '@/components/settings/billing/billing-plan-card'
import { BillingQuotas } from '@/components/settings/billing/billing-quotas'
import { BillingLLMCosts } from '@/components/settings/billing/billing-llm-costs'
import { BillingHistory } from '@/components/settings/billing/billing-history'
import { BillingV2Preview } from '@/components/settings/billing/billing-v2-preview'

export default async function BillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-[680px] mx-auto px-6 py-8 space-y-8">
      <SettingsNav />

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Plan & Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          CET is free. Your LLM costs go directly to your OpenRouter account.
        </p>
      </div>

      <BillingPlanCard memberSince={user.created_at} />
      <BillingQuotas />
      <BillingLLMCosts />
      <BillingHistory />
      <BillingV2Preview userEmail={user.email ?? ''} />
    </div>
  )
}
