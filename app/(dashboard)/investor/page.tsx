import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import InvestorClient from './InvestorClient'

export const dynamic = 'force-dynamic'

export default async function InvestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: profile }, { data: investor }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    admin.from('investor').select('*').order('tanggal_investasi', { ascending: false }),
  ])

  return <InvestorClient initialData={investor || []} role={profile?.role || 'mahasiswa'} />
}
