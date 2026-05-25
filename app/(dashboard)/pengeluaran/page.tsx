import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PengeluaranClient from './PengeluaranClient'

export const dynamic = 'force-dynamic'

export default async function PengeluaranPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: profile }, { data: pengeluaran }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    admin.from('pengeluaran').select('*').order('tanggal', { ascending: false }),
  ])

  return <PengeluaranClient initialData={pengeluaran || []} role={profile?.role || 'mahasiswa'} />
}
