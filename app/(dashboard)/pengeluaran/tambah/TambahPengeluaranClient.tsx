'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'

const KATEGORI = ['Operasional', 'Gaji', 'Pembelian', 'Transportasi', 'Utilitas', 'Lainnya']
const defaultForm = { tanggal: new Date().toISOString().split('T')[0], keterangan: '', kategori: KATEGORI[0], jumlah: '' }

export default function TambahPengeluaranClient() {
  const router = useRouter()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successList, setSuccessList] = useState<{ keterangan: string; jumlah: number }[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jumlah: Number(form.jumlah) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      setSuccessList(p => [{ keterangan: json.data.keterangan, jumlah: json.data.jumlah }, ...p])
      setForm(f => ({ ...defaultForm, tanggal: f.tanggal, kategori: f.kategori }))
    } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '760px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={() => router.push('/pengeluaran')}
          style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>
          ← Kembali
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>💸 Input Pengeluaran</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Tambah data pengeluaran koperasi</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label>Tanggal <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} required />
              </div>
              <div><label>Keterangan <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Contoh: Sewa tempat bulan Januari" value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} required />
              </div>
              <div><label>Kategori</label>
                <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                  {KATEGORI.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label>Jumlah (Rp) <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" min="1" placeholder="0" value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))} required />
                {Number(form.jumlah) > 0 && <div style={{ marginTop: '5px', fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>= {formatRupiah(Number(form.jumlah))}</div>}
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setForm(defaultForm)} className="btn-secondary" style={{ flex: 1 }}>Reset</button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Menyimpan...' : '💾 Simpan Pengeluaran'}
                </button>
              </div>
              <button type="button" onClick={() => router.push('/pengeluaran')}
                style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontSize: '13px', cursor: 'pointer' }}>
                📋 Lihat Semua Pengeluaran
              </button>
            </div>
          </form>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>Tersimpan ({successList.length})</span>
          </div>
          {successList.length === 0
            ? <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Belum ada yang disimpan</div>
            : successList.map((item, i) => (
              <div key={i} style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{item.keterangan}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', whiteSpace: 'nowrap', marginLeft: '10px' }}>-{formatRupiah(item.jumlah)}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
