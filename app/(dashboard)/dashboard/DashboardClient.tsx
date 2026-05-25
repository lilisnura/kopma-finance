'use client'

import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/utils'
import type { Profile, Pemasukan, Pengeluaran } from '@/types'

interface Props {
  profile: Profile | null
  totalPemasukan: number
  totalPengeluaran: number
  totalInvestor: number
  saldo: number
  recentPemasukan: Pemasukan[]
  recentPengeluaran: Pengeluaran[]
  investorCount: number
}

function StatCard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string; color: string; sub?: string
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '44px', height: '44px',
          borderRadius: '12px',
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>
          {icon}
        </div>
        {sub && (
          <span style={{
            background: '#dcfce7', color: '#16a34a',
            fontSize: '11px', fontWeight: '600',
            padding: '2px 8px', borderRadius: '20px',
          }}>{sub}</span>
        )}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{value}</div>
    </div>
  )
}

export default function DashboardClient({
  profile, totalPemasukan, totalPengeluaran, totalInvestor, saldo,
  recentPemasukan, recentPengeluaran, investorCount
}: Props) {
  const [tanggal, setTanggal] = useState('')

  useEffect(() => {
    setTanggal(new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
  }, [])

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
          Selamat Datang, {profile?.full_name || 'Pengguna'} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>{tanggal}</p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <StatCard icon="💳" label="Saldo Koperasi" value={formatRupiah(saldo)} color="#3b82f6" sub="Aktif" />
        <StatCard icon="💰" label="Total Pemasukan" value={formatRupiah(totalPemasukan)} color="#10b981" />
        <StatCard icon="💸" label="Total Pengeluaran" value={formatRupiah(totalPengeluaran)} color="#ef4444" />
        <StatCard icon="🤝" label="Total Investasi" value={formatRupiah(totalInvestor)} color="#8b5cf6" sub={`${investorCount} investor`} />
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Pemasukan */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>💰</span>
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>Pemasukan Terbaru</span>
          </div>
          <div style={{ overflow: 'auto' }}>
            {recentPemasukan.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                Belum ada data pemasukan
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Keterangan</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPemasukan.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{p.keterangan}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                        +{formatRupiah(p.jumlah)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Pengeluaran */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>💸</span>
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>Pengeluaran Terbaru</span>
          </div>
          <div style={{ overflow: 'auto' }}>
            {recentPengeluaran.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                Belum ada data pengeluaran
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Keterangan</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPengeluaran.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{p.keterangan}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(p.tanggal).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>
                        -{formatRupiah(p.jumlah)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
