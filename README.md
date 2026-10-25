# SportSlot – Sistem Informasi Reservasi Lapangan Olahraga

Next.js 14 (App Router) + Tailwind CSS + Supabase. Responsif untuk mobile, tablet, dan desktop.

## Cara menjalankan
1. Buat project di https://supabase.com
2. Buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql` (tabel, RLS, fungsi, data contoh).
3. Buat akun staf di **Authentication → Users** (centang *Auto Confirm User*), lalu jalankan di SQL Editor:
   ```sql
   insert into public.profiles (id, full_name, role)
     select id, 'Admin Lapangan', 'admin' from auth.users where email = 'EMAIL_ADMIN';
   insert into public.profiles (id, full_name, role)
     select id, 'Pemilik Usaha', 'owner' from auth.users where email = 'EMAIL_PEMILIK';
   ```
4. Salin `.env.example` menjadi `.env.local`, isi URL dan anon key (Project Settings → API).
5. Jalankan:
   ```bash
   npm install
   npm run dev      # http://localhost:3000
   ```
6. Deploy: push ke GitHub lalu import ke Vercel, isi 2 environment variable yang sama.

## Alur & pemetaan ke SRS
| Proses DFD | Halaman | FR |
|---|---|---|
| 1.0 Kelola Data Lapangan & Jadwal (D1) | `/admin/courts` | FR-01, FR-02 |
| 2.0 Proses Reservasi (D2) | `/` , `/courts/[id]`, `/admin/reservations`, `/reservasi` | FR-03 – FR-06 |
| 3.0 Pembayaran & Laporan (D3) | `/reservasi` (bayar + invoice), `/admin/payments`, `/admin` (laporan) | FR-07 – FR-10 |

Status reservasi: `pending` (menunggu verifikasi) → `verified` (dikonfirmasi, tagihan terbit) → `paid` (lunas + invoice) / `cancelled`.

Entitas eksternal: **Pelanggan** (tanpa akun, cukup nama & kontak), **Admin**, **Pemilik** (hanya lihat laporan), **Layanan Pembayaran** (disimulasikan di fungsi `pay_reservation`; ganti dengan Midtrans/Xendit bila perlu).

Jadwal bentrok dicegah di dua lapis: validasi di fungsi `create_reservation` dan *exclusion constraint* `no_double_booking` pada tabel `reservations`.
