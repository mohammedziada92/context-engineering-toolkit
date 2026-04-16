import { redirect } from 'next/navigation'

// Root `/` → always redirect to the dashboard.
// AuthGuard inside the (protected) layout handles the
// unauthenticated case and redirects to /login with ?next=/dashboard.
export default function RootPage() {
  redirect('/dashboard')
}
