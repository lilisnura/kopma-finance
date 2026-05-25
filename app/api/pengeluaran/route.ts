import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('pengeluaran').select('*').order('tanggal', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('pengeluaran').insert(body).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const { id, ...body } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('pengeluaran').update(body).eq('id', id).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 })
  const admin = createAdminClient()
  const { error } = await admin.from('pengeluaran').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
