import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return data?.role === 'admin'
}

// GET — daftar semua user
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ profiles: profiles || [] })
}

// POST — tambah user baru
export async function POST(request: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { email, password, full_name, role } = await request.json()
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password, dan nama wajib diisi' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // Update profile dengan role yang benar
  await admin.from('profiles').update({ full_name, role }).eq('id', data.user.id)
  return NextResponse.json({ success: true })
}

// PATCH — update role user
export async function PATCH(request: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { userId, role } = await request.json()
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// DELETE — hapus user
export async function DELETE(request: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { userId } = await request.json()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
