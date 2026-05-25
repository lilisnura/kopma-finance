import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PemasukanClient from './PemasukanClient'

export const dynamic = 'force-dynamic'

export default async function PemasukanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: profile }, { data: pemasukan }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    admin.from('pemasukan').select('*').order('tanggal', { ascending: false }),
  ])

  return <PemasukanClient initialData={pemasukan || []} role={profile?.role || 'mahasiswa'} />
}
