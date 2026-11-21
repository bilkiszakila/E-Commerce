alter table public.orders
  add column if not exists payment_proof_url text,
  add column if not exists payment_confirmed_at timestamptz;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read payment proofs" on storage.objects;
drop policy if exists "Guest or user upload payment proofs" on storage.objects;
drop policy if exists "Guest or user update payment proofs" on storage.objects;

create policy "Public read payment proofs"
  on storage.objects
  for select
  using (bucket_id = 'payment-proofs');

create policy "Guest or user upload payment proofs"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

create policy "Guest or user update payment proofs"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'payment-proofs')
  with check (bucket_id = 'payment-proofs');

drop policy if exists "Update payment proof" on public.orders;

create policy "Update payment proof"
  on public.orders
  for update
  to anon, authenticated
  using (status in ('pending', 'waiting_verification', 'menunggu_konfirmasi'))
  with check (status in ('pending', 'waiting_verification', 'menunggu_konfirmasi', 'diproses', 'paid'));

  grant update on public.orders to anon;
