import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Keuangan Kopma - Koperasi Mahasiswa',
  description: 'Sistem Informasi Keuangan Koperasi Mahasiswa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
