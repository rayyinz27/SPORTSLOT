-- =====================================================================
-- SportSlot - Sistem Informasi Reservasi Lapangan Olahraga
-- Jalankan seluruh file ini di Supabase > SQL Editor
-- Data store SRS: D1 = courts, D2 = reservations, D3 = payments
-- =====================================================================
create extension if not exists btree_gist;

-- Staf (admin / pemilik). Pelanggan TIDAK punya akun (sesuai SRS 1.2 poin 3)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin','owner'))
);

-- D1 Data Lapangan (termasuk jadwal operasional & tarif)
create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null default 'Padel',
  city text not null default '',
  surface text not null default 'Grass',
  setting text not null default 'Indoor' check (setting in ('Indoor','Outdoor')),
  description text default '',
  image_url text,
  price_per_hour integer not null check (price_per_hour >= 0),
  weekend_price integer check (weekend_price >= 0),
  open_hour smallint not null default 8,
  close_hour smallint not null default 22,
  rating numeric(2,1) not null default 4.5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (open_hour >= 0 and close_hour <= 24 and open_hour < close_hour)
);

-- D2 Data Reservasi (identitas pemesan disimpan bersama reservasi)
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  court_id uuid not null references public.courts(id) on delete restrict,
  booking_date date not null,
  start_hour smallint not null,
  end_hour smallint not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  total_price integer not null,
  status text not null default 'pending' check (status in ('pending','verified','paid','cancelled')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (start_hour < end_hour),
  -- Mencegah jadwal bentrok di level database
  constraint no_double_booking exclude using gist (
    court_id with =, booking_date with =,
    int4range(start_hour::int, end_hour::int) with &&
  ) where (status <> 'cancelled')
);

-- D3 Data Pembayaran
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  amount integer not null,
  method text not null,
  status text not null default 'paid' check (status in ('paid','failed','pending')),
  gateway_ref text,
  paid_at timestamptz not null default now()
);

-- ------------------------------ Helper role ---------------------------
create or replace function public.is_staff() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()) $$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

-- ------------------------------ RLS -----------------------------------
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles for select using (id = auth.uid());

drop policy if exists "courts_read" on public.courts;
create policy "courts_read" on public.courts for select using (is_active or is_staff());
drop policy if exists "courts_admin_write" on public.courts;
create policy "courts_admin_write" on public.courts for all using (is_admin()) with check (is_admin());

drop policy if exists "reservations_staff_read" on public.reservations;
create policy "reservations_staff_read" on public.reservations for select using (is_staff());
drop policy if exists "reservations_admin_update" on public.reservations;
create policy "reservations_admin_update" on public.reservations for update using (is_admin()) with check (is_admin());

drop policy if exists "payments_staff_read" on public.payments;
create policy "payments_staff_read" on public.payments for select using (is_staff());

-- ------------------------------ Proses 2.0 / 3.0 (RPC) ----------------
-- FR-03: slot terpesan (tanpa membocorkan data pemesan)
create or replace function public.get_booked_slots(p_court uuid, p_date date)
returns table (start_hour int, end_hour int)
language sql security definer stable set search_path = public as
$$ select r.start_hour::int, r.end_hour::int from reservations r
   where r.court_id = p_court and r.booking_date = p_date and r.status <> 'cancelled' $$;

-- FR-04: buat reservasi (validasi jam, jadwal lewat, bentrok, hitung total)
create or replace function public.create_reservation(
  p_court uuid, p_date date, p_start int, p_end int,
  p_name text, p_phone text, p_email text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  c courts%rowtype; v_rate int; v_total int; v_code text; v_id uuid;
  v_now timestamp := (now() at time zone 'Asia/Jakarta');
begin
  select * into c from courts where id = p_court and is_active;
  if not found then raise exception 'Lapangan tidak ditemukan atau tidak aktif'; end if;
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then
    raise exception 'Nama dan kontak pemesan wajib diisi'; end if;
  if p_start >= p_end or p_start < c.open_hour or p_end > c.close_hour then
    raise exception 'Jam di luar jam operasional lapangan'; end if;
  if p_date < v_now::date or (p_date = v_now::date and p_start <= extract(hour from v_now)) then
    raise exception 'Jadwal yang dipilih sudah lewat'; end if;
  if exists (select 1 from reservations where court_id = p_court and booking_date = p_date
             and status <> 'cancelled'
             and int4range(start_hour::int, end_hour::int) && int4range(p_start, p_end)) then
    raise exception 'Jadwal bentrok, silakan pilih jam lain'; end if;

  v_rate  := case when extract(dow from p_date) in (0,6) and c.weekend_price is not null
                  then c.weekend_price else c.price_per_hour end;
  v_total := v_rate * (p_end - p_start);
  v_code  := 'RSV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into reservations (code, court_id, booking_date, start_hour, end_hour,
                            customer_name, customer_phone, customer_email, total_price)
  values (v_code, p_court, p_date, p_start, p_end, trim(p_name), trim(p_phone),
          nullif(trim(coalesce(p_email,'')),''), v_total)
  returning id into v_id;

  return json_build_object('id', v_id, 'code', v_code, 'total_price', v_total);
exception when exclusion_violation then
  raise exception 'Jadwal bentrok, silakan pilih jam lain';
end $$;

-- Cek reservasi berdasarkan kode (konfirmasi, tagihan, invoice)
create or replace function public.get_reservation(p_code text)
returns json language sql security definer stable set search_path = public as $$
  select json_build_object(
    'id', r.id, 'code', r.code, 'status', r.status,
    'booking_date', r.booking_date, 'start_hour', r.start_hour, 'end_hour', r.end_hour,
    'customer_name', r.customer_name, 'customer_phone', r.customer_phone,
    'customer_email', r.customer_email, 'total_price', r.total_price,
    'verified_at', r.verified_at, 'created_at', r.created_at,
    'court_name', c.name, 'court_city', c.city,
    'payment', (select row_to_json(x) from (
        select pay.invoice_no, pay.amount, pay.method, pay.status, pay.paid_at, pay.gateway_ref
        from payments pay where pay.reservation_id = r.id) x))
  from reservations r join courts c on c.id = r.court_id
  where r.code = upper(trim(p_code)) $$;

-- FR-07/08: pembayaran (disimulasikan sebagai Layanan Pembayaran / payment gateway)
create or replace function public.pay_reservation(p_code text, p_method text)
returns json language plpgsql security definer set search_path = public as $$
declare r reservations%rowtype; v_inv text;
begin
  select * into r from reservations where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Reservasi tidak ditemukan'; end if;
  if r.status = 'paid' then raise exception 'Reservasi ini sudah dibayar'; end if;
  if r.status <> 'verified' then
    raise exception 'Reservasi belum diverifikasi admin atau sudah dibatalkan'; end if;
  if p_method not in ('QRIS','Virtual Account','E-Wallet','Transfer Bank') then
    raise exception 'Metode pembayaran tidak valid'; end if;

  v_inv := 'INV-' || to_char(now() at time zone 'Asia/Jakarta','YYYYMMDD') || '-' ||
           upper(substr(md5(random()::text), 1, 5));
  insert into payments (invoice_no, reservation_id, amount, method, status, gateway_ref)
  values (v_inv, r.id, r.total_price, p_method, 'paid',
          'PG-' || upper(substr(md5(clock_timestamp()::text), 1, 10)));
  update reservations set status = 'paid' where id = r.id;
  return get_reservation(r.code);
end $$;

grant execute on function public.get_booked_slots(uuid, date) to anon, authenticated;
grant execute on function public.create_reservation(uuid, date, int, int, text, text, text) to anon, authenticated;
grant execute on function public.get_reservation(text) to anon, authenticated;
grant execute on function public.pay_reservation(text, text) to anon, authenticated;

-- ------------------------------ Data contoh ---------------------------
insert into public.courts (name, sport, city, surface, setting, description, price_per_hour, weekend_price, open_hour, close_hour, rating) values
('Southside Padel', 'Padel', 'Yogyakarta', 'Grass', 'Outdoor', 'Fasilitas padel modern dengan lapangan berkualitas tinggi dan dinding kaca, cocok untuk semua level pemain.', 150000, 180000, 8, 23, 4.8),
('Hyena Sports Arena', 'Futsal', 'Bandung', 'Grass', 'Indoor', 'Lapangan futsal indoor dengan rumput sintetis, pencahayaan terang, dan ruang ganti bersih.', 100000, 130000, 8, 24, 4.4),
('Padel Hero', 'Padel', 'Jakarta', 'Grass', 'Outdoor', 'Lapangan padel di pusat kota, tersedia sewa raket dan area istirahat.', 120000, 150000, 7, 22, 4.5),
('Sekawan Court', 'Badminton', 'Bali', 'Vinyl', 'Indoor', 'Lapangan badminton standar turnamen dengan lantai vinyl anti-slip.', 80000, 100000, 8, 22, 4.7),
('Sumatra Padel Hall', 'Padel', 'Medan', 'Grass', 'Outdoor', 'Hall padel luas dengan beberapa lapangan dan kantin.', 60000, 80000, 9, 22, 4.3),
('Garuda Mini Soccer', 'Mini Soccer', 'Jakarta', 'Grass', 'Outdoor', 'Lapangan mini soccer rumput sintetis dengan lampu sorot malam hari.', 250000, 300000, 15, 24, 4.6);

-- ------------------------------ Akun staf -----------------------------
-- 1) Buat user di Supabase > Authentication > Users (centang Auto Confirm)
-- 2) Ganti email lalu jalankan:
-- insert into public.profiles (id, full_name, role)
--   select id, 'Admin Lapangan', 'admin' from auth.users where email = 'admin@contoh.com';
-- insert into public.profiles (id, full_name, role)
--   select id, 'Pemilik Usaha', 'owner' from auth.users where email = 'owner@contoh.com';
