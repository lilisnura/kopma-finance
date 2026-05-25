import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TransaksiClient from './TransaksiClient'

export const dynamic = 'force-dynamic'

export default async function TransaksiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: profile }, { data: pemasukan }, { data: pengeluaran }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    admin.from('pemasukan').select('*').order('tanggal', { ascending: false }),
    admin.from('pengeluaran').select('*').order('tanggal', { ascending: false }),
  ])

  return (
    <TransaksiClient
      initialPemasukan={pemasukan || []}
      initialPengeluaran={pengeluaran || []}
      role={profile?.role || 'mahasiswa'}
    />
  )
}
