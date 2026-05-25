import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TambahPemasukanClient from './TambahPemasukanClient'

export default async function TambahPemasukanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/pemasukan')

  return <TambahPemasukanClient />
}
