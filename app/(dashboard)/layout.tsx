import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/Sidebar'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Gunakan admin client agar bypass RLS — selalu dapat data yang benar
  const admin = createAdminClient()
  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Auto-create jika benar-benar belum ada (jangan pakai upsert)
  if (!profile) {
    await admin.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Pengguna',
      role: 'mahasiswa',
    })
    const { data: fresh } = await admin
      .from('profiles').select('*').eq('id', user.id).maybeSingle()
    profile = fresh
  }

  const safeProfile: Profile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: user.email?.split('@')[0] ?? 'Pengguna',
    role: 'mahasiswa',
    created_at: new Date().toISOString(),
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar profile={safeProfile} />
      <main style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
        {children}
      </main>
    </div>
  )
}
