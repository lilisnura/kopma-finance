'use client'

import { useState } from 'react'
import type { Profile } from '@/types'

interface Props {
  initialUsers: Profile[]
  currentUserId: string
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
      background: type === 'success' ? '#0f172a' : '#7f1d1d',
      color: 'white', borderRadius: '12px', padding: '14px 20px',
      fontSize: '14px', fontWeight: '500', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '10px',
      border: `1px solid ${type === 'success' ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {msg}
    </div>
  )
}

function Modal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { email: string; password: string; full_name: string; role: string }) => Promise<string | null>
}) {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'mahasiswa' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await onSave(form)
    if (err) { setError(err); setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>👤 Tambah User Baru</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px',
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>Nama Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" placeholder="Nama lengkap pengguna"
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div>
              <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="email" placeholder="email@kopma.ac.id"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label>Password <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" placeholder="Minimal 6 karakter"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label>Role <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { value: 'mahasiswa', label: '👤 Mahasiswa', desc: 'Hanya bisa lihat' },
                  { value: 'admin', label: '⚡ Admin', desc: 'Akses penuh CRUD' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                    style={{
                      padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                      border: form.role === opt.value ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                      background: form.role === opt.value ? '#eff6ff' : 'white',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: form.role === opt.value ? '#2563eb' : '#1e293b' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Membuat akun...' : '✅ Buat User'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleCreate(data: { email: string; password: string; full_name: string; role: string }): Promise<string | null> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return json.error || 'Gagal membuat user'
    showToast(`User ${data.email} berhasil dibuat`)
    setShowModal(false)
    // Refresh list
    const listRes = await fetch('/api/users')
    const listJson = await listRes.json()
    if (listJson.profiles) setUsers(listJson.profiles)
    return null
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setLoadingId(userId)
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    const json = await res.json()
    if (!res.ok) { showToast(json.error || 'Gagal update role', 'error'); setLoadingId(null); return }
    setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole as 'admin' | 'mahasiswa' } : x))
    showToast('Role berhasil diupdate')
    setLoadingId(null)
  }

  async function handleDelete(userId: string, email: string) {
    if (userId === currentUserId) { showToast('Tidak bisa menghapus akun sendiri', 'error'); return }
    if (!confirm(`Hapus user ${email}? Aksi ini tidak bisa dibatalkan.`)) return
    setLoadingId(userId)
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()
    if (!res.ok) { showToast(json.error || 'Gagal hapus user', 'error'); setLoadingId(null); return }
    setUsers(u => u.filter(x => x.id !== userId))
    showToast(`User ${email} berhasil dihapus`)
    setLoadingId(null)
  }

  const admins = users.filter(u => u.role === 'admin').length
  const mahasiswas = users.filter(u => u.role === 'mahasiswa').length

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            👥 Manajemen User
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Kelola akun pengguna sistem</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
          ➕ Tambah User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total User', value: users.length, color: '#3b82f6', icon: '👥' },
          { label: 'Admin', value: admins, color: '#8b5cf6', icon: '⚡' },
          { label: 'Mahasiswa', value: mahasiswas, color: '#10b981', icon: '👤' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: '14px', padding: '18px 20px',
            border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.color}`,
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <span style={{ fontSize: '28px' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Email</th>
              <th>Role</th>
              <th>Bergabung</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ opacity: loadingId === u.id ? 0.5 : 1 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: u.role === 'admin'
                        ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '14px',
                    }}>
                      {u.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{u.full_name}</div>
                      {u.id === currentUserId && (
                        <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '500' }}>● Akun Anda</span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={u.id === currentUserId || loadingId === u.id}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{
                      width: 'auto', padding: '5px 10px', fontSize: '12px',
                      background: u.role === 'admin' ? '#eff6ff' : '#f0fdf4',
                      color: u.role === 'admin' ? '#2563eb' : '#16a34a',
                      border: `1px solid ${u.role === 'admin' ? '#bfdbfe' : '#bbf7d0'}`,
                      borderRadius: '20px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    <option value="mahasiswa">👤 Mahasiswa</option>
                    <option value="admin">⚡ Admin</option>
                  </select>
                </td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    disabled={u.id === currentUserId || loadingId === u.id}
                    title={u.id === currentUserId ? 'Tidak bisa hapus akun sendiri' : 'Hapus user'}
                    style={{
                      width: '32px', height: '32px', borderRadius: '7px',
                      border: '1px solid #fee2e2', background: '#fff5f5',
                      cursor: u.id === currentUserId ? 'not-allowed' : 'pointer',
                      opacity: u.id === currentUserId ? 0.4 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', margin: '0 auto',
                    }}
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '12px', color: '#94a3b8' }}>
          Total {users.length} pengguna terdaftar
        </div>
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
