'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatRupiah } from '@/lib/utils'
import type { Pemasukan, Pengeluaran, Investor } from '@/types'

interface Props {
  pemasukan: Pemasukan[]
  pengeluaran: Pengeluaran[]
  investor: Investor[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function formatRupiahShort(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`
  return val.toString()
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: '600', marginBottom: '6px', color: '#1e293b', fontSize: '13px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: '13px', color: p.color, margin: '2px 0' }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function LaporanClient({ pemasukan, pengeluaran, investor }: Props) {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  const totalPemasukan = pemasukan.reduce((s, p) => s + p.jumlah, 0)
  const totalPengeluaran = pengeluaran.reduce((s, p) => s + p.jumlah, 0)
  const totalInvestasi = investor.filter(i => i.status === 'aktif').reduce((s, i) => s + i.jumlah_investasi, 0)
  const saldo = totalPemasukan - totalPengeluaran + totalInvestasi

  const years = useMemo(() => {
    const all = [...pemasukan, ...pengeluaran].map(d => new Date(d.tanggal).getFullYear())
    return [...new Set(all)].sort((a, b) => b - a)
  }, [pemasukan, pengeluaran])

  const monthlyData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const masuk = pemasukan
        .filter(p => new Date(p.tanggal).getFullYear() === filterYear && new Date(p.tanggal).getMonth() === idx)
        .reduce((s, p) => s + p.jumlah, 0)
      const keluar = pengeluaran
        .filter(p => new Date(p.tanggal).getFullYear() === filterYear && new Date(p.tanggal).getMonth() === idx)
        .reduce((s, p) => s + p.jumlah, 0)
      return { month, pemasukan: masuk, pengeluaran: keluar, saldo: masuk - keluar }
    })
  }, [pemasukan, pengeluaran, filterYear])

  const kategoriPemasukan = useMemo(() => {
    const map: Record<string, number> = {}
    pemasukan.filter(p => new Date(p.tanggal).getFullYear() === filterYear).forEach(p => {
      map[p.kategori] = (map[p.kategori] || 0) + p.jumlah
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [pemasukan, filterYear])

  const kategoriPengeluaran = useMemo(() => {
    const map: Record<string, number> = {}
    pengeluaran.filter(p => new Date(p.tanggal).getFullYear() === filterYear).forEach(p => {
      map[p.kategori] = (map[p.kategori] || 0) + p.jumlah
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [pengeluaran, filterYear])

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    // Header
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageW, 40, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('LAPORAN KEUANGAN KOPERASI MAHASISWA', pageW / 2, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode Tahun ${filterYear}`, pageW / 2, 28, { align: 'center' })
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW / 2, 35, { align: 'center' })

    let y = 52

    // Summary
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('RINGKASAN KEUANGAN', 14, y)
    y += 8

    const summaryData = [
      ['Total Pemasukan', formatRupiah(totalPemasukan), ''],
      ['Total Pengeluaran', formatRupiah(totalPengeluaran), ''],
      ['Total Investasi Aktif', formatRupiah(totalInvestasi), ''],
      ['SALDO BERSIH', formatRupiah(saldo), saldo >= 0 ? 'SURPLUS' : 'DEFISIT'],
    ]

    autoTable(doc, {
      startY: y,
      head: [['Keterangan', 'Jumlah', 'Status']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

    // Pemasukan Table
    if (pemasukan.length > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('DATA PEMASUKAN', 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [['No', 'Tanggal', 'Keterangan', 'Kategori', 'Jumlah']],
        body: pemasukan.map((p, i) => [
          i + 1,
          new Date(p.tanggal).toLocaleDateString('id-ID'),
          p.keterangan,
          p.kategori,
          formatRupiah(p.jumlah),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: { 4: { halign: 'right' } },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
    }

    // Pengeluaran Table
    if (pengeluaran.length > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('DATA PENGELUARAN', 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [['No', 'Tanggal', 'Keterangan', 'Kategori', 'Jumlah']],
        body: pengeluaran.map((p, i) => [
          i + 1,
          new Date(p.tanggal).toLocaleDateString('id-ID'),
          p.keterangan,
          p.kategori,
          formatRupiah(p.jumlah),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: { 4: { halign: 'right' } },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
    }

    // Investor Table
    if (investor.length > 0) {
      if (y > 220) { doc.addPage(); y = 20 }
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('DATA INVESTOR', 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [['No', 'Nama', 'Jumlah Investasi', 'Tanggal', 'Status']],
        body: investor.map((inv, i) => [
          i + 1,
          inv.nama,
          formatRupiah(inv.jumlah_investasi),
          new Date(inv.tanggal_investasi).toLocaleDateString('id-ID'),
          inv.status === 'aktif' ? 'Aktif' : 'Tidak Aktif',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: { 2: { halign: 'right' } },
      })
    }

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(`Halaman ${i} dari ${totalPages} — KOPMA Finance — Dokumen Rahasia`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    }

    doc.save(`Laporan_Keuangan_KOPMA_${filterYear}.pdf`)
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>📋 Laporan Keuangan</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Grafik dan ringkasan keuangan koperasi</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            style={{ width: 'auto', padding: '8px 14px', fontSize: '14px' }}
          >
            {(years.length ? years : [new Date().getFullYear()]).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={exportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Pemasukan', value: formatRupiah(totalPemasukan), color: '#10b981', icon: '💰' },
          { label: 'Total Pengeluaran', value: formatRupiah(totalPengeluaran), color: '#ef4444', icon: '💸' },
          { label: 'Total Investasi', value: formatRupiah(totalInvestasi), color: '#8b5cf6', icon: '🤝' },
          { label: 'Saldo Bersih', value: formatRupiah(saldo), color: saldo >= 0 ? '#3b82f6' : '#ef4444', icon: '💳' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'white', borderRadius: '14px', padding: '18px 20px',
            border: '1px solid #e2e8f0', borderLeft: `4px solid ${item.color}`,
          }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart - Pemasukan vs Pengeluaran */}
      <div style={{
        background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
        padding: '24px', marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
          📊 Pemasukan vs Pengeluaran per Bulan ({filterYear})
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
            <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart - Saldo */}
      <div style={{
        background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
        padding: '24px', marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
          📈 Grafik Saldo Bulanan ({filterYear})
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
            <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Kategori Pemasukan */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            🥧 Kategori Pemasukan
          </h3>
          {kategoriPemasukan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kategoriPemasukan} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {kategoriPemasukan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => formatRupiah(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Kategori Pengeluaran */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            🥧 Kategori Pengeluaran
          </h3>
          {kategoriPengeluaran.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kategoriPengeluaran} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {kategoriPengeluaran.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => formatRupiah(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
