alter table public.orders
  alter column user_id drop not null,
  alter column status set default 'pending';

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  bank_name text not null default 'BCA',
  bank_account_name text not null default 'PT Adi Cetak',
  bank_account_number text not null default '1234567890',
  bank_options jsonb not null default '[
    {"bank_name":"BCA","account_name":"PT Adi Cetak","account_number":"1234567890"},
    {"bank_name":"Mandiri","account_name":"PT Adi Cetak","account_number":"9876543210"},
    {"bank_name":"BNI","account_name":"PT Adi Cetak","account_number":"1122334455"},
    {"bank_name":"BRI","account_name":"PT Adi Cetak","account_number":"001122334455"}
  ]'::jsonb,
  shipping_options jsonb not null default '[
    {"name":"JNE Reg","description":"Estimasi 2–3 hari","price":17000},
    {"name":"J&T Express","description":"Estimasi 1–2 hari","price":19000},
    {"name":"Ambil Sendiri","description":"Semarang Store","price":0}
  ]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.store_settings
  add column if not exists bank_options jsonb not null default '[]'::jsonb;

insert into public.store_settings (
  id,
  bank_name,
  bank_account_name,
  bank_account_number,
  bank_options,
  shipping_options
) values (
  1,
  'BCA',
  'PT Adi Cetak',
  '1234567890',
  '[
    {"bank_name":"BCA","account_name":"PT Adi Cetak","account_number":"1234567890"},
    {"bank_name":"Mandiri","account_name":"PT Adi Cetak","account_number":"9876543210"},
    {"bank_name":"BNI","account_name":"PT Adi Cetak","account_number":"1122334455"},
    {"bank_name":"BRI","account_name":"PT Adi Cetak","account_number":"001122334455"}
  ]'::jsonb,
  '[
    {"name":"JNE Reg","description":"Estimasi 2–3 hari","price":17000},
    {"name":"J&T Express","description":"Estimasi 1–2 hari","price":19000},
    {"name":"Ambil Sendiri","description":"Semarang Store","price":0}
  ]'::jsonb
) on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Public read store settings" on public.store_settings;
drop policy if exists "Admins insert store settings" on public.store_settings;
drop policy if exists "Admins update store settings" on public.store_settings;

create policy "Public read store settings"
  on public.store_settings
  for select
  using (true);

create policy "Admins insert store settings"
  on public.store_settings
  for insert
  with check (public.is_admin());

create policy "Admins update store settings"
  on public.store_settings
  for update
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;

alter table public.orders enable row level security;

drop policy if exists "Public insert guest orders" on public.orders;
drop policy if exists "Public insert guest order items" on public.order_items;
drop policy if exists "Public read orders by id" on public.orders;
drop policy if exists "Public read order items by id" on public.order_items;

create policy "Public insert guest orders"
  on public.orders
  for insert
  with check (true);

create policy "Public insert guest order items"
  on public.order_items
  for insert
  with check (true);

create policy "Public read orders by id"
  on public.orders
  for select
  using (true);

create policy "Public read order items by id"
  on public.order_items
  for select
  using (true);

grant insert, select on public.orders to anon, authenticated;
grant update on public.orders to authenticated;
grant insert, select on public.order_items to anon, authenticated;
