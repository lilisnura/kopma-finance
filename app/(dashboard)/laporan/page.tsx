import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import LaporanClient from './LaporanClient'

export const dynamic = 'force-dynamic'

export default async function LaporanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: pemasukan }, { data: pengeluaran }, { data: investor }] = await Promise.all([
    admin.from('pemasukan').select('*').order('tanggal', { ascending: true }),
    admin.from('pengeluaran').select('*').order('tanggal', { ascending: true }),
    admin.from('investor').select('*'),
  ])

  return (
    <LaporanClient
      pemasukan={pemasukan || []}
      pengeluaran={pengeluaran || []}
      investor={investor || []}
    />
  )
}
