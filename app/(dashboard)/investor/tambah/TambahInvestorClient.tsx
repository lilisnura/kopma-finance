'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'

const defaultForm = {
  nama: '', email: '', telepon: '',
  jumlah_investasi: '', tanggal_investasi: new Date().toISOString().split('T')[0],
  status: 'aktif' as 'aktif' | 'tidak_aktif', keterangan: '',
}

export default function TambahInvestorClient() {
  const router = useRouter()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successList, setSuccessList] = useState<{ nama: string; jumlah: number }[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jumlah_investasi: Number(form.jumlah_investasi) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      setSuccessList(p => [{ nama: json.data.nama, jumlah: json.data.jumlah_investasi }, ...p])
      setForm(f => ({ ...defaultForm, tanggal_investasi: f.tanggal_investasi }))
    } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={() => router.push('/investor')}
          style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>
          ← Kembali
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>🤝 Input Investor</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Tambah data investor koperasi</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Nama Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Nama investor..." value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label>Email</label>
                  <input type="email" placeholder="email@..." value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div><label>Telepon</label>
                  <input type="text" placeholder="08xx..." value={form.telepon} onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Jumlah Investasi (Rp) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" min="1" placeholder="0" value={form.jumlah_investasi} onChange={e => setForm(f => ({ ...f, jumlah_investasi: e.target.value }))} required />
                  {Number(form.jumlah_investasi) > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#8b5cf6', fontWeight: '600' }}>= {formatRupiah(Number(form.jumlah_investasi))}</div>
                  )}
                </div>
                <div><label>Tanggal Investasi <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" value={form.tanggal_investasi} onChange={e => setForm(f => ({ ...f, tanggal_investasi: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label>Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'aktif', label: '✅ Aktif', color: '#10b981' },
                    { value: 'tidak_aktif', label: '❌ Tidak Aktif', color: '#ef4444' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, status: opt.value as 'aktif' | 'tidak_aktif' }))}
                      style={{
                        padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                        border: form.status === opt.value ? `2px solid ${opt.color}` : '2px solid #e2e8f0',
                        background: form.status === opt.value ? `${opt.color}15` : 'white',
                        color: form.status === opt.value ? opt.color : '#94a3b8',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><label>Keterangan</label>
                <textarea placeholder="Catatan tambahan..." value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  style={{ minHeight: '72px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setForm(defaultForm)} className="btn-secondary" style={{ flex: 1 }}>Reset</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Menyimpan...' : '💾 Simpan Investor'}
                </button>
              </div>
              <button type="button" onClick={() => router.push('/investor')}
                style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontSize: '13px', cursor: 'pointer' }}>
                📋 Lihat Semua Investor
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
              <div key={i} style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{item.nama}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#8b5cf6', marginTop: '2px' }}>{formatRupiah(item.jumlah)}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
