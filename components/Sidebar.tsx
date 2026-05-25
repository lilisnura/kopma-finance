'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface NavSection {
  title: string
  items: {
    href: string
    icon: string
    label: string
    adminOnly?: boolean
    isSubItem?: boolean
  }[]
}

const sections: NavSection[] = [
  {
    title: 'UTAMA',
    items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    title: 'KEUANGAN',
    items: [
      { href: '/transaksi', icon: '💳', label: 'Transaksi' },
      { href: '/pemasukan', icon: '💰', label: 'Pemasukan' },
      { href: '/pemasukan/tambah', icon: '➕', label: 'Input Pemasukan', adminOnly: true, isSubItem: true },
      { href: '/pengeluaran', icon: '💸', label: 'Pengeluaran' },
      { href: '/pengeluaran/tambah', icon: '➕', label: 'Input Pengeluaran', adminOnly: true, isSubItem: true },
      { href: '/investor', icon: '🤝', label: 'Investor' },
      { href: '/investor/tambah', icon: '➕', label: 'Input Investor', adminOnly: true, isSubItem: true },
    ],
  },
  {
    title: 'LAPORAN',
    items: [
      { href: '/laporan', icon: '📋', label: 'Laporan & Grafik' },
    ],
  },
  {
    title: 'PENGATURAN',
    items: [
      { href: '/users', icon: '👥', label: 'Manajemen User', adminOnly: true },
    ],
  },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile.role === 'admin'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: '260px', minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', flexShrink: 0,
          }}>🏛️</div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>KOPMA Finance</div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>Koperasi Mahasiswa</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {sections.map(section => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} style={{ marginBottom: '16px' }}>
              <div style={{
                color: '#475569', fontSize: '10px', fontWeight: '700',
                padding: '0 8px', marginBottom: '6px', letterSpacing: '0.08em',
              }}>
                {section.title}
              </div>

              {visibleItems.map(item => {
                const isActive = pathname === item.href
                const isSubActive = item.isSubItem && pathname === item.href
                const accent = item.adminOnly ? '#10b981' : '#3b82f6'

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: '10px',
                      padding: item.isSubItem ? '7px 10px 7px 26px' : '10px 10px',
                      borderRadius: '9px', marginBottom: '2px',
                      textDecoration: 'none',
                      background: (isActive || isSubActive)
                        ? `${accent}20`
                        : 'transparent',
                      border: (isActive || isSubActive)
                        ? `1px solid ${accent}35`
                        : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive && !isSubActive)
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive && !isSubActive)
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: item.isSubItem ? '13px' : '16px', lineHeight: 1 }}>
                      {item.icon}
                    </span>
                    <span style={{
                      fontSize: item.isSubItem ? '12px' : '13px',
                      fontWeight: (isActive || isSubActive) ? '600' : '400',
                      color: (isActive || isSubActive) ? accent : item.isSubItem ? '#64748b' : '#94a3b8',
                      flex: 1,
                    }}>
                      {item.label}
                    </span>
                    {(isActive || isSubActive) && (
                      <div style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: accent, flexShrink: 0,
                      }} />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}

        {/* Admin badge */}
        {isAdmin && (
          <div style={{
            marginTop: '8px', padding: '10px 12px',
            background: 'rgba(16, 185, 129, 0.07)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '600', marginBottom: '2px' }}>
              ⚡ MODE ADMIN
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Akses penuh ke semua fitur</div>
          </div>
        )}
      </nav>

      {/* Profile & Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0,
            }}>
              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                color: 'white', fontSize: '13px', fontWeight: '500',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {profile.full_name || 'Pengguna'}
              </div>
              <span style={{
                display: 'inline-flex', padding: '1px 8px',
                borderRadius: '20px', fontSize: '10px', fontWeight: '600',
                background: isAdmin ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                color: isAdmin ? '#60a5fa' : '#34d399',
              }}>
                {isAdmin ? '⚡ Admin' : '👤 Mahasiswa'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
          }}
        >
          🚪 Keluar
        </button>
      </div>
    </aside>
  )
}
