-- ============================================================
-- KOPMA FINANCE - SUPABASE SETUP SQL
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

-- 1. TABEL PROFILES (data user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'mahasiswa' CHECK (role IN ('admin', 'mahasiswa')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PEMASUKAN
CREATE TABLE IF NOT EXISTS public.pemasukan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  keterangan TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  jumlah NUMERIC NOT NULL CHECK (jumlah > 0),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PENGELUARAN
CREATE TABLE IF NOT EXISTS public.pengeluaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  keterangan TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  jumlah NUMERIC NOT NULL CHECK (jumlah > 0),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL INVESTOR
CREATE TABLE IF NOT EXISTS public.investor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  email TEXT DEFAULT '',
  telepon TEXT DEFAULT '',
  jumlah_investasi NUMERIC NOT NULL CHECK (jumlah_investasi > 0),
  tanggal_investasi DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif')),
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pemasukan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor ENABLE ROW LEVEL SECURITY;

-- PROFILES: User bisa lihat & edit profil sendiri
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admin bisa lihat semua profil
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PEMASUKAN: Semua yang login bisa baca, hanya admin yang bisa write
CREATE POLICY "pemasukan_select" ON public.pemasukan FOR SELECT TO authenticated USING (true);
CREATE POLICY "pemasukan_insert" ON public.pemasukan FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "pemasukan_update" ON public.pemasukan FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "pemasukan_delete" ON public.pemasukan FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PENGELUARAN: Semua yang login bisa baca, hanya admin yang bisa write
CREATE POLICY "pengeluaran_select" ON public.pengeluaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "pengeluaran_insert" ON public.pengeluaran FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "pengeluaran_update" ON public.pengeluaran FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "pengeluaran_delete" ON public.pengeluaran FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- INVESTOR: Semua yang login bisa baca, hanya admin yang bisa write
CREATE POLICY "investor_select" ON public.investor FOR SELECT TO authenticated USING (true);
CREATE POLICY "investor_insert" ON public.investor FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "investor_update" ON public.investor FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "investor_delete" ON public.investor FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER: Auto-create profile setelah user sign up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mahasiswa')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DATA SAMPLE (opsional - bisa dihapus)
-- ============================================================

-- CATATAN: Buat user dulu via Supabase Auth, lalu jalankan ini
-- dengan mengganti UUID yang sesuai

-- Contoh data pemasukan
INSERT INTO public.pemasukan (tanggal, keterangan, kategori, jumlah) VALUES
('2026-01-15', 'Iuran anggota bulan Januari', 'Iuran Anggota', 2500000),
('2026-01-20', 'Penjualan ATK semester ganjil', 'Penjualan', 1800000),
('2026-02-10', 'Iuran anggota bulan Februari', 'Iuran Anggota', 2500000),
('2026-02-25', 'Jasa fotokopi dan print', 'Jasa', 750000),
('2026-03-05', 'Iuran anggota bulan Maret', 'Iuran Anggota', 2500000),
('2026-03-18', 'Penjualan buku modul kuliah', 'Penjualan', 3200000),
('2026-04-01', 'Iuran anggota bulan April', 'Iuran Anggota', 2500000),
('2026-04-15', 'Donasi alumni', 'Donasi', 5000000);

-- Contoh data pengeluaran
INSERT INTO public.pengeluaran (tanggal, keterangan, kategori, jumlah) VALUES
('2026-01-10', 'Sewa tempat sekretariat Januari', 'Operasional', 800000),
('2026-01-25', 'Pembelian ATK untuk toko', 'Pembelian', 1200000),
('2026-02-10', 'Sewa tempat sekretariat Februari', 'Operasional', 800000),
('2026-02-20', 'Transportasi pengurus rapat', 'Transportasi', 250000),
('2026-03-10', 'Sewa tempat sekretariat Maret', 'Operasional', 800000),
('2026-03-20', 'Listrik dan internet', 'Utilitas', 450000),
('2026-04-10', 'Sewa tempat sekretariat April', 'Operasional', 800000),
('2026-04-20', 'Gaji pengurus aktif', 'Gaji', 1500000);

-- Contoh data investor
INSERT INTO public.investor (nama, email, telepon, jumlah_investasi, tanggal_investasi, status, keterangan) VALUES
('Budi Santoso', 'budi@gmail.com', '081234567890', 10000000, '2026-01-01', 'aktif', 'Alumni angkatan 2020'),
('Siti Rahayu', 'siti@gmail.com', '082345678901', 5000000, '2026-02-01', 'aktif', 'Dosen pembimbing KOPMA'),
('PT Maju Bersama', 'info@majubersama.co.id', '0215678901', 25000000, '2026-01-15', 'aktif', 'Sponsor utama');
