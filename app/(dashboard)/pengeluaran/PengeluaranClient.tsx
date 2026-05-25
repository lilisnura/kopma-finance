'use client'

import { useState } from 'react'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Pengeluaran, Role } from '@/types'

const KATEGORI = ['Operasional', 'Gaji', 'Pembelian', 'Transportasi', 'Utilitas', 'Lainnya']

interface Props { initialData: Pengeluaran[]; role: Role }

async function apiFetch(method: string, body?: object) {
  const res = await fetch('/api/pengeluaran', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan')
  return json
}

function Modal({ onClose, onSave, editData }: {
  onClose: () => void
  onSave: (d: Omit<Pengeluaran, 'id' | 'created_by' | 'created_at'>) => Promise<string | null>
  editData?: Pengeluaran
}) {
  const [form, setForm] = useState({
    tanggal: editData?.tanggal?.split('T')[0] || new Date().toISOString().split('T')[0],
    keterangan: editData?.keterangan || '',
    kategori: editData?.kategori || KATEGORI[0],
    jumlah: editData?.jumlah?.toString() || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const err = await onSave({ ...form, jumlah: Number(form.jumlah) })
    if (err) { setError(err); setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {editData ? '✏️ Edit Pengeluaran' : '➕ Tambah Pengeluaran'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label>Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} required /></div>
            <div><label>Keterangan</label><input type="text" placeholder="Keterangan pengeluaran..." value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} required /></div>
            <div><label>Kategori</label>
              <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                {KATEGORI.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label>Jumlah (Rp)</label>
              <input type="number" min="1" placeholder="0" value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))} required />
              {Number(form.jumlah) > 0 && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '600' }}>= {formatRupiah(Number(form.jumlah))}</div>}
            </div>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Menyimpan...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PengeluaranClient({ initialData, role }: Props) {
  const [data, setData] = useState<Pengeluaran[]>(initialData)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Pengeluaran | undefined>()
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  const isAdmin = role === 'admin'
  const filtered = data.filter(d => d.keterangan.toLowerCase().includes(search.toLowerCase()) || d.kategori.toLowerCase().includes(search.toLowerCase()))
  const total = filtered.reduce((s, d) => s + d.jumlah, 0)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave(form: Omit<Pengeluaran, 'id' | 'created_by' | 'created_at'>): Promise<string | null> {
    try {
      if (editItem) {
        const { data: updated } = await apiFetch('PATCH', { id: editItem.id, ...form })
        if (updated) setData(d => d.map(x => x.id === editItem.id ? updated : x))
        showToast('Pengeluaran berhasil diupdate')
      } else {
        const { data: created } = await apiFetch('POST', form)
        if (created) setData(d => [created, ...d])
        showToast('Pengeluaran berhasil disimpan')
      }
      setShowModal(false); setEditItem(undefined)
      return null
    } catch (e) {
      return (e as Error).message
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus data ini?')) return
    try {
      await apiFetch('DELETE', { id })
      setData(d => d.filter(x => x.id !== id))
      showToast('Pengeluaran berhasil dihapus')
    } catch (e) { alert((e as Error).message) }
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>💸 Pengeluaran</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Kelola data pengeluaran koperasi</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(undefined); setShowModal(true) }}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            ➕ Tambah Pengeluaran
          </button>
        )}
      </div>

      <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>Total Pengeluaran</div>
          <div style={{ fontSize: '26px', fontWeight: '700' }}>{formatRupiah(total)}</div>
        </div>
        <div style={{ fontSize: '40px', opacity: 0.3 }}>💸</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input type="text" placeholder="🔍 Cari keterangan atau kategori..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '360px' }} />
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th><th>Keterangan</th><th>Kategori</th>
              <th style={{ textAlign: 'right' }}>Jumlah</th>
              {isAdmin && <th style={{ textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Belum ada data pengeluaran</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id}>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{formatDate(item.tanggal)}</td>
                <td style={{ fontWeight: '500' }}>{item.keterangan}</td>
                <td><span className="badge badge-red">{item.kategori}</span></td>
                <td style={{ textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>{formatRupiah(item.jumlah)}</td>
                {isAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => { setEditItem(item); setShowModal(true) }}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                      <button onClick={() => handleDelete(item.id)}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <Modal onClose={() => { setShowModal(false); setEditItem(undefined) }} onSave={handleSave} editData={editItem} />}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, background: '#0f172a', color: 'white', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          ✅ {toast}
        </div>
      )}
    </div>
  )
}
