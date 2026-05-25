'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Pemasukan, Pengeluaran, Role } from '@/types'

async function apiFetch(endpoint: string, method: string, body?: object) {
  const res = await fetch(`/api/${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan')
  return json
}

type Tipe = 'pemasukan' | 'pengeluaran'
type Tab = 'semua' | 'pemasukan' | 'pengeluaran'

type Row = { id: string; tanggal: string; keterangan: string; kategori: string; jumlah: number; tipe: Tipe; created_at: string }

const KAT: Record<Tipe, string[]> = {
  pemasukan: ['Iuran Anggota', 'Penjualan', 'Jasa', 'Donasi', 'Lainnya'],
  pengeluaran: ['Operasional', 'Gaji', 'Pembelian', 'Transportasi', 'Utilitas', 'Lainnya'],
}

interface Props {
  initialPemasukan: Pemasukan[]
  initialPengeluaran: Pengeluaran[]
  role: Role
}

// ── Toast ──────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
      background: type === 'success' ? '#0f172a' : '#7f1d1d',
      color: 'white', borderRadius: '12px', padding: '14px 20px',
      fontSize: '14px', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'slideIn 0.25s ease',
      border: `1px solid ${type === 'success' ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      <span style={{ fontSize: '18px' }}>{type === 'success' ? '✅' : '❌'}</span>
      {msg}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────
function Modal({
  onClose, onSave, editData, defaultTipe,
}: {
  onClose: () => void
  onSave: (tipe: Tipe, form: Omit<Row, 'id' | 'tipe' | 'created_at'>) => Promise<string | null>
  editData?: Row
  defaultTipe: Tipe
}) {
  const [tipe, setTipe] = useState<Tipe>(editData?.tipe ?? defaultTipe)
  const [form, setForm] = useState({
    tanggal: editData?.tanggal?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    keterangan: editData?.keterangan ?? '',
    kategori: editData?.kategori ?? KAT[editData?.tipe ?? defaultTipe][0],
    jumlah: editData?.jumlah?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Saat tipe berubah, reset kategori ke pilihan pertama tipe tersebut
  useEffect(() => {
    if (!editData) setForm(f => ({ ...f, kategori: KAT[tipe][0] }))
  }, [tipe, editData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await onSave(tipe, { ...form, jumlah: Number(form.jumlah) })
    if (err) { setError(err); setLoading(false) }
  }

  const isPemasukan = tipe === 'pemasukan'
  const accent = isPemasukan ? '#10b981' : '#ef4444'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
          background: isPemasukan ? '#f0fdf4' : '#fff1f2',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
            {editData ? '✏️ Edit Transaksi' : `${isPemasukan ? '💰' : '💸'} ${editData ? 'Edit' : 'Tambah'} Transaksi`}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
              padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px',
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Tipe */}
              {!editData && (
                <div>
                  <label>Tipe Transaksi</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(['pemasukan', 'pengeluaran'] as Tipe[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTipe(t)}
                        style={{
                          padding: '10px', borderRadius: '8px', cursor: 'pointer',
                          fontWeight: '600', fontSize: '13px',
                          border: tipe === t
                            ? `2px solid ${t === 'pemasukan' ? '#10b981' : '#ef4444'}`
                            : '2px solid #e2e8f0',
                          background: tipe === t
                            ? t === 'pemasukan' ? '#f0fdf4' : '#fff1f2'
                            : 'white',
                          color: tipe === t
                            ? t === 'pemasukan' ? '#10b981' : '#ef4444'
                            : '#94a3b8',
                          transition: 'all 0.15s',
                        }}
                      >
                        {t === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label>Tanggal</label>
                <input type="date" value={form.tanggal}
                  onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} required />
              </div>

              {/* Keterangan */}
              <div>
                <label>Keterangan</label>
                <input type="text"
                  placeholder={isPemasukan ? 'Contoh: Iuran anggota bulan Januari' : 'Contoh: Sewa tempat bulan Januari'}
                  value={form.keterangan}
                  onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} required />
              </div>

              {/* Kategori */}
              <div>
                <label>Kategori</label>
                <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                  {KAT[tipe].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* Jumlah */}
              <div>
                <label>Jumlah (Rp)</label>
                <input type="number" placeholder="0" min="1" value={form.jumlah}
                  onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))} required />
                {Number(form.jumlah) > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: '600', color: accent }}>
                    = {formatRupiah(Number(form.jumlah))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
                <button
                  type="submit" disabled={loading}
                  style={{
                    flex: 2, padding: '10px 16px', borderRadius: '8px', border: 'none',
                    background: loading ? '#94a3b8' : isPemasukan
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white', fontWeight: '600', fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Menyimpan...' : `💾 Simpan ${isPemasukan ? 'Pemasukan' : 'Pengeluaran'}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────
export default function TransaksiClient({ initialPemasukan, initialPengeluaran, role }: Props) {

  const isAdmin = role === 'admin'

  const [pemasukan, setPemasukan] = useState<Pemasukan[]>(initialPemasukan)
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>(initialPengeluaran)
  const [tab, setTab] = useState<Tab>('semua')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalTipe, setModalTipe] = useState<Tipe>('pemasukan')
  const [editItem, setEditItem] = useState<Row | undefined>()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Gabungkan dan sort semua transaksi
  const allRows: Row[] = [
    ...pemasukan.map(p => ({ ...p, tipe: 'pemasukan' as Tipe })),
    ...pengeluaran.map(p => ({ ...p, tipe: 'pengeluaran' as Tipe })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

  const filtered = allRows.filter(r => {
    const matchTab = tab === 'semua' || r.tipe === tab
    const matchSearch = r.keterangan.toLowerCase().includes(search.toLowerCase()) ||
      r.kategori.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const totalPemasukan = pemasukan.reduce((s, p) => s + p.jumlah, 0)
  const totalPengeluaran = pengeluaran.reduce((s, p) => s + p.jumlah, 0)
  const saldo = totalPemasukan - totalPengeluaran

  async function handleSave(tipe: Tipe, form: Omit<Row, 'id' | 'tipe' | 'created_at'>): Promise<string | null> {
    try {
      if (editItem) {
        const { data: updated } = await apiFetch(tipe, 'PATCH', { id: editItem.id, ...form })
        if (updated) {
          if (tipe === 'pemasukan') setPemasukan(d => d.map(x => x.id === editItem.id ? updated : x))
          else setPengeluaran(d => d.map(x => x.id === editItem.id ? updated : x))
        }
        showToast('Transaksi berhasil diupdate')
      } else {
        const { data: created } = await apiFetch(tipe, 'POST', form)
        if (created) {
          if (tipe === 'pemasukan') setPemasukan(d => [created, ...d])
          else setPengeluaran(d => [created, ...d])
        }
        showToast(`${tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} berhasil disimpan`)
      }
      setShowModal(false)
      setEditItem(undefined)
      return null
    } catch (e) {
      return (e as Error).message
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Hapus "${row.keterangan}"?`)) return
    try {
      await apiFetch(row.tipe, 'DELETE', { id: row.id })
      if (row.tipe === 'pemasukan') setPemasukan(d => d.filter(x => x.id !== row.id))
      else setPengeluaran(d => d.filter(x => x.id !== row.id))
      showToast('Transaksi berhasil dihapus')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  function openAdd(tipe: Tipe) {
    setEditItem(undefined)
    setModalTipe(tipe)
    setShowModal(true)
  }

  function openEdit(row: Row) {
    setEditItem(row)
    setModalTipe(row.tipe)
    setShowModal(true)
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
          💳 Transaksi
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Kelola pemasukan dan pengeluaran koperasi</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Total Pemasukan</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{formatRupiah(totalPemasukan)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{pemasukan.length} transaksi</div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Total Pengeluaran</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{formatRupiah(totalPengeluaran)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{pengeluaran.length} transaksi</div>
        </div>
        <div style={{
          background: saldo >= 0 ? 'linear-gradient(135deg, #1e3a5f, #0f172a)' : 'linear-gradient(135deg, #7f1d1d, #1e293b)',
          borderRadius: '14px', padding: '18px 20px', color: 'white',
        }}>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>Saldo Bersih</div>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatRupiah(Math.abs(saldo))}</div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
            {saldo >= 0 ? '📈 Surplus' : '📉 Defisit'}
          </div>
        </div>
      </div>

      {/* Tabs + Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px', gap: '2px' }}>
          {([
            { key: 'semua', label: '📋 Semua' },
            { key: 'pemasukan', label: '💰 Pemasukan' },
            { key: 'pengeluaran', label: '💸 Pengeluaran' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontWeight: tab === t.key ? '600' : '400',
                fontSize: '13px',
                background: tab === t.key ? '#0f172a' : 'transparent',
                color: tab === t.key ? 'white' : '#64748b',
                transition: 'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Tombol tambah — muncul sesuai tab & role */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {(tab === 'semua' || tab === 'pemasukan') && (
              <button
                onClick={() => openAdd('pemasukan')}
                style={{
                  padding: '9px 16px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', fontWeight: '600', fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                ➕ Tambah Pemasukan
              </button>
            )}
            {(tab === 'semua' || tab === 'pengeluaran') && (
              <button
                onClick={() => openAdd('pengeluaran')}
                style={{
                  padding: '9px 16px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: '600', fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                ➕ Tambah Pengeluaran
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '14px' }}>
        <input
          type="text"
          placeholder="🔍 Cari keterangan atau kategori..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '380px' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Kategori</th>
              <th>Tipe</th>
              <th style={{ textAlign: 'right' }}>Jumlah</th>
              {isAdmin && <th style={{ textAlign: 'center', width: '90px' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '56px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontSize: '14px' }}>Tidak ada transaksi ditemukan</div>
                </td>
              </tr>
            ) : filtered.map(row => (
              <tr key={`${row.tipe}-${row.id}`}>
                <td style={{ color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {formatDate(row.tanggal)}
                </td>
                <td style={{ fontWeight: '500', color: '#1e293b' }}>{row.keterangan}</td>
                <td>
                  <span className={`badge ${row.tipe === 'pemasukan' ? 'badge-green' : 'badge-red'}`}>
                    {row.kategori}
                  </span>
                </td>
                <td>
                  <span className={`badge ${row.tipe === 'pemasukan' ? 'badge-green' : 'badge-red'}`}>
                    {row.tipe === 'pemasukan' ? '💰 Masuk' : '💸 Keluar'}
                  </span>
                </td>
                <td style={{
                  textAlign: 'right', fontWeight: '700',
                  color: row.tipe === 'pemasukan' ? '#10b981' : '#ef4444',
                  whiteSpace: 'nowrap',
                }}>
                  {row.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(row.jumlah)}
                </td>
                {isAdmin && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(row)}
                        title="Edit"
                        style={{
                          width: '32px', height: '32px', borderRadius: '7px', border: '1px solid #e2e8f0',
                          background: 'white', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >✏️</button>
                      {/* Hapus */}
                      <button
                        onClick={() => handleDelete(row)}
                        title="Hapus"
                        style={{
                          width: '32px', height: '32px', borderRadius: '7px', border: '1px solid #fee2e2',
                          background: '#fff5f5', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff5f5')}
                      >🗑️</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #f1f5f9',
            background: '#f8fafc', fontSize: '12px', color: '#94a3b8',
          }}>
            Menampilkan {filtered.length} dari {allRows.length} transaksi
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => { setShowModal(false); setEditItem(undefined) }}
          onSave={handleSave}
          editData={editItem}
          defaultTipe={modalTipe}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
