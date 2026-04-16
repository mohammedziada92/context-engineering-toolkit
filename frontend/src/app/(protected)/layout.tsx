import { AuthGuard } from '@/components/shell/AuthGuard'
import { AppShell }  from '@/components/shell/AppShell'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
