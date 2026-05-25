export type Role = 'admin' | 'mahasiswa'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
}

export interface Pemasukan {
  id: string
  tanggal: string
  keterangan: string
  kategori: string
  jumlah: number
  created_by: string
  created_at: string
}

export interface Pengeluaran {
  id: string
  tanggal: string
  keterangan: string
  kategori: string
  jumlah: number
  created_by: string
  created_at: string
}

export interface Investor {
  id: string
  nama: string
  email: string
  telepon: string
  jumlah_investasi: number
  tanggal_investasi: string
  status: 'aktif' | 'tidak_aktif'
  keterangan: string
  created_at: string
}
