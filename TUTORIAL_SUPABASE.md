# 📚 Tutorial Setup Supabase — KOPMA Finance

---

## LANGKAH 1: Buat Project Supabase

1. Buka **https://supabase.com** → klik **"Start your project"**
2. Login dengan akun GitHub atau Google
3. Klik **"New Project"**
4. Isi form:
   - **Organization**: pilih atau buat baru
   - **Name**: `kopma-finance`
   - **Database Password**: buat password kuat, **SIMPAN BAIK-BAIK!**
   - **Region**: pilih yang terdekat (misal: Singapore)
5. Klik **"Create new project"** → tunggu ~2 menit

---

## LANGKAH 2: Ambil API Keys

1. Di sidebar Supabase, klik **Settings** (ikon gear)
2. Pilih **API**
3. Copy 2 nilai ini:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon / public key** → string panjang

4. Buka file `.env.local` di project kamu:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## LANGKAH 3: Setup Database (Tabel & Keamanan)

1. Di Supabase, klik **SQL Editor** di sidebar kiri
2. Klik **"New query"**
3. Copy SEMUA isi file `supabase-setup.sql` dari project ini
4. Paste ke SQL Editor
5. Klik **"Run"** (atau tekan Ctrl+Enter)
6. Pastikan muncul **"Success. No rows returned"**

> ✅ Ini akan membuat: tabel profiles, pemasukan, pengeluaran, investor + keamanan RLS + trigger otomatis

---

## LANGKAH 4: Buat User Admin

### Cara A: Via Supabase Dashboard (Recommended)

1. Di sidebar Supabase → klik **Authentication**
2. Klik tab **Users**
3. Klik **"Add user"** → **"Create new user"**
4. Isi:
   - **Email**: `admin@kopma.ac.id`
   - **Password**: `Admin123!`
   - Centang ✅ **"Auto Confirm User"**
5. Klik **"Create User"**

6. Setelah user terbuat, kita perlu set role-nya ke **admin**:
   - Klik **SQL Editor** → buat query baru
   - Jalankan SQL ini (ganti email jika berbeda):

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Administrator KOPMA'
WHERE email = 'admin@kopma.ac.id';
```

---

## LANGKAH 5: Buat User Mahasiswa

1. Kembali ke **Authentication → Users**
2. Klik **"Add user"** → **"Create new user"**
3. Isi:
   - **Email**: `mahasiswa@kopma.ac.id`
   - **Password**: `Mhs123!`
   - Centang ✅ **"Auto Confirm User"**
4. Klik **"Create User"**

5. Profil mahasiswa sudah otomatis dibuat dengan `role = 'mahasiswa'` lewat trigger.
   Verifikasi dengan SQL:

```sql
SELECT * FROM public.profiles;
```

Hasilnya harus tampil 2 baris dengan role berbeda.

---

## LANGKAH 6: Jalankan Aplikasi

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

### Login Admin:
- Email: `admin@kopma.ac.id`
- Password: `Admin123!`

### Login Mahasiswa:
- Email: `mahasiswa@kopma.ac.id`
- Password: `Mhs123!`

---

## LANGKAH 7: Tambah User Baru (Opsional)

Untuk menambah user mahasiswa baru, ulangi langkah 5.

Untuk menjadikan user sebagai admin, jalankan SQL:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'email_baru@kopma.ac.id';
```

---

## Troubleshooting

### ❌ Error "relation profiles does not exist"
→ Jalankan ulang `supabase-setup.sql` di SQL Editor

### ❌ Error saat login "Invalid login credentials"
→ Pastikan user sudah di-confirm di **Authentication → Users**
→ Cek email & password sudah benar

### ❌ Data tidak muncul setelah tambah
→ Cek policy RLS sudah dibuat — jalankan:
```sql
SELECT * FROM pg_policies WHERE tablename = 'pemasukan';
```

### ❌ Error 406 / 403 saat fetch data
→ Pastikan RLS policy untuk SELECT sudah ada di semua tabel

---

## Struktur Role

| Fitur | Admin | Mahasiswa |
|-------|-------|-----------|
| Dashboard | ✅ Lihat | ✅ Lihat |
| Pemasukan | ✅ CRUD | 👁️ Lihat |
| Pengeluaran | ✅ CRUD | 👁️ Lihat |
| Investor | ✅ CRUD | 👁️ Lihat |
| Laporan + Grafik | ✅ Lihat + Export PDF | ✅ Lihat + Export PDF |
