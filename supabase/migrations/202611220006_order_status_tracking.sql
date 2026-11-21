alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists payment_proof_url text,
  add column if not exists payment_confirmed_at timestamptz;

update public.orders
set status = 'pending'
where lower(status) in ('pending', 'menunggu pembayaran', 'belum bayar');

update public.orders
set status = 'waiting_verification'
where lower(status) in ('waiting_verification', 'menunggu konfirmasi', 'menunggu_konfirmasi');

update public.orders
set status = 'Diproses'
where lower(status) in ('paid', 'diproses', 'diproses');

update public.orders
set status = 'Dikirim'
where lower(status) = 'dikirim';

update public.orders
set status = 'Selesai'
where lower(status) = 'selesai';

update public.orders
set status = 'Dibatalkan'
where lower(status) in ('dibatalkan', 'batal');
