import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TambahPengeluaranClient from './TambahPengeluaranClient'

export default async function TambahPengeluaranPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/pengeluaran')

  return <TambahPengeluaranClient />
}
