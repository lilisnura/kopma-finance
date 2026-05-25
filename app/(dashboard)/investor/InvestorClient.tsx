'use client'

import { useState } from 'react'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Investor, Role } from '@/types'

interface Props {
  initialData: Investor[]
  role: Role
}

async function apiFetch(method: string, body?: object) {
  const res = await fetch('/api/investor', {
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
  onSave: (data: Omit<Investor, 'id' | 'created_at'>) => Promise<string | null>
  editData?: Investor
}) {
  const [form, setForm] = useState({
    nama: editData?.nama || '',
    email: editData?.email || '',
    telepon: editData?.telepon || '',
    jumlah_investasi: editData?.jumlah_investasi?.toString() || '',
    tanggal_investasi: editData?.tanggal_investasi?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: (editData?.status || 'aktif') as 'aktif' | 'tidak_aktif',
    keterangan: editData?.keterangan || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const err = await onSave({ ...form, jumlah_investasi: Number(form.jumlah_investasi) })
    if (err) { setError(err); setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {editData ? '✏️ Edit Investor' : '➕ Tambah Investor'}
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
            <div><label>Nama Lengkap</label><input type="text" placeholder="Nama investor..." value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label>Email</label><input type="email" placeholder="email@..." value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label>Telepon</label><input type="text" placeholder="08xx..." value={form.telepon} onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label>Jumlah Investasi (Rp)</label><input type="number" min="1" placeholder="0" value={form.jumlah_investasi} onChange={e => setForm(f => ({ ...f, jumlah_investasi: e.target.value }))} required /></div>
              <div><label>Tanggal Investasi</label><input type="date" value={form.tanggal_investasi} onChange={e => setForm(f => ({ ...f, tanggal_investasi: e.target.value }))} required /></div>
            </div>
            <div><label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'aktif' | 'tidak_aktif' }))}>
                <option value="aktif">✅ Aktif</option>
                <option value="tidak_aktif">❌ Tidak Aktif</option>
              </select>
            </div>
            <div><label>Keterangan</label><textarea placeholder="Catatan tambahan..." value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} style={{ minHeight: '72px' }} /></div>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Menyimpan...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InvestorClient({ initialData, role }: Props) {
  const [data, setData] = useState<Investor[]>(initialData)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Investor | undefined>()
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  const isAdmin = role === 'admin'
  const filtered = data.filter(d => d.nama.toLowerCase().includes(search.toLowerCase()))
  const totalInvestasi = data.filter(d => d.status === 'aktif').reduce((s, d) => s + d.jumlah_investasi, 0)
  const investorAktif = data.filter(d => d.status === 'aktif').length

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave(form: Omit<Investor, 'id' | 'created_at'>): Promise<string | null> {
    try {
      if (editItem) {
        const { data: updated } = await apiFetch('PATCH', { id: editItem.id, ...form })
        if (updated) setData(d => d.map(x => x.id === editItem.id ? updated : x))
        showToast('Investor berhasil diupdate')
      } else {
        const { data: created } = await apiFetch('POST', form)
        if (created) setData(d => [created, ...d])
        showToast('Investor berhasil disimpan')
      }
      setShowModal(false)
      setEditItem(undefined)
      return null
    } catch (e) { return (e as Error).message }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus data investor ini?')) return
    try {
      await apiFetch('DELETE', { id })
      setData(d => d.filter(x => x.id !== id))
      showToast('Investor berhasil dihapus')
    } catch (e) { alert((e as Error).message) }
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>🤝 Investor</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Kelola data investor koperasi</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setEditItem(undefined); setShowModal(true) }}>
            ➕ Tambah Investor
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total Investasi Aktif', value: formatRupiah(totalInvestasi), color: '#8b5cf6', icon: '💼' },
          { label: 'Investor Aktif', value: `${investorAktif} Orang`, color: '#10b981', icon: '✅' },
          { label: 'Total Investor', value: `${data.length} Orang`, color: '#3b82f6', icon: '👥' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'white', borderRadius: '14px', padding: '18px 20px',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: item.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{item.label}</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input type="text" placeholder="🔍 Cari nama investor..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '360px' }} />
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kontak</th>
              <th>Jumlah Investasi</th>
              <th>Tanggal</th>
              <th>Status</th>
              {isAdmin && <th style={{ textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                Belum ada data investor
              </td></tr>
            ) : filtered.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.nama}</div>
                  {item.keterangan && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.keterangan}</div>}
                </td>
                <td>
                  <div style={{ fontSize: '13px' }}>{item.email || '-'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.telepon || '-'}</div>
                </td>
                <td style={{ fontWeight: '600', color: '#8b5cf6' }}>{formatRupiah(item.jumlah_investasi)}</td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{formatDate(item.tanggal_investasi)}</td>
                <td>
                  <span className={`badge ${item.status === 'aktif' ? 'badge-green' : 'badge-red'}`}>
                    {item.status === 'aktif' ? '✅ Aktif' : '❌ Tidak Aktif'}
                  </span>
                </td>
                {isAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => { setEditItem(item); setShowModal(true) }}
                        title="Edit"
                        style={{ width: '32px', height: '32px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                      <button onClick={() => handleDelete(item.id)}
                        title="Hapus"
                        style={{ width: '32px', height: '32px', borderRadius: '7px', border: '1px solid #fee2e2', background: '#fff5f5', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditItem(undefined) }} onSave={handleSave} editData={editItem} />
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, background: '#0f172a', color: 'white', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          ✅ {toast}
        </div>
      )}
    </div>
  )
}
