create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  image text,
  thumbnail_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text,
  category text not null,
  price bigint not null,
  old_price bigint,
  image text,
  thumbnail_url text,
  badge text,
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  discount_active boolean not null default false,
  stock integer not null default 0,
  gallery text[] not null default '{}'::text[],
  variations jsonb not null default '{"materials":[],"sizes":[],"finishings":[]}'::jsonb,
  rating numeric(2,1) not null default 0,
  sold integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_banners (
  id text primary key,
  name text,
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('fixed', 'percent')),
  value numeric not null,
  label text,
  minimum_purchase bigint not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  is_admin boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  variants text not null default '',
  unit_price bigint not null,
  unique (user_id, product_id, variants)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id),
  status text not null default 'pending',
  courier text,
  payment text,
  subtotal bigint not null,
  shipping bigint not null default 0,
  discount bigint not null default 0,
  total bigint not null,
  voucher_code text,
  shipping_address jsonb not null,
  payment_proof_url text,
  payment_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  name text not null,
  quantity integer not null,
  unit_price bigint not null,
  variants text not null default ''
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  bank_name text not null default 'BCA',
  bank_account_name text not null default 'PT Adi Cetak',
  bank_account_number text not null default '1234567890',
  bank_options jsonb not null default '[]'::jsonb,
  shipping_options jsonb not null default '[
    {"name":"JNE Reg","description":"Estimasi 2–3 hari","price":17000},
    {"name":"J&T Express","description":"Estimasi 1–2 hari","price":19000},
    {"name":"Ambil Sendiri","description":"Semarang Store","price":0}
  ]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists email text;
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists thumbnail_url text;
alter table public.categories add column if not exists active boolean not null default true;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists thumbnail_url text;
alter table public.products add column if not exists discount_percent integer not null default 0;
alter table public.products add column if not exists discount_active boolean not null default false;
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists gallery text[] not null default '{}'::text[];
alter table public.products add column if not exists variations jsonb not null default '{"materials":[],"sizes":[],"finishings":[]}'::jsonb;
alter table public.vouchers add column if not exists minimum_purchase bigint not null default 0;
alter table public.vouchers add column if not exists usage_limit integer;
alter table public.vouchers add column if not exists used_count integer not null default 0;
alter table public.vouchers add column if not exists starts_at timestamptz;
alter table public.vouchers add column if not exists expires_at timestamptz;
alter table public.store_settings add column if not exists bank_options jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists payment_proof_url text;
alter table public.orders add column if not exists payment_confirmed_at timestamptz;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promo_banners enable row level security;
alter table public.vouchers enable row level security;
alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Public read active banners" on public.promo_banners;
drop policy if exists "Public read active vouchers" on public.vouchers;
drop policy if exists "Public read bank settings" on public.settings;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;

drop policy if exists "Users manage own cart" on public.cart_items;
drop policy if exists "Users manage own wishlist" on public.wishlist_items;
drop policy if exists "Users read own orders" on public.orders;
drop policy if exists "Users create own orders" on public.orders;
drop policy if exists "Users read own order items" on public.order_items;
drop policy if exists "Users create own order items" on public.order_items;

drop policy if exists "Admins manage categories" on public.categories;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Admins manage banners" on public.promo_banners;
drop policy if exists "Admins manage vouchers" on public.vouchers;
drop policy if exists "Admins manage settings" on public.settings;
drop policy if exists "Admins read all orders" on public.orders;
drop policy if exists "Admins update all orders" on public.orders;
drop policy if exists "Admins fallback read all orders" on public.orders;
drop policy if exists "Admins fallback update all orders" on public.orders;
drop policy if exists "Admins read all order items" on public.order_items;
drop policy if exists "Public read store settings" on public.store_settings;
drop policy if exists "Admins insert store settings" on public.store_settings;
drop policy if exists "Admins update store settings" on public.store_settings;
drop policy if exists "Public insert guest orders" on public.orders;
drop policy if exists "Public insert guest order items" on public.order_items;
drop policy if exists "Public read orders by id" on public.orders;
drop policy if exists "Public read order items by id" on public.order_items;
drop policy if exists "Update payment proof" on public.orders;
drop policy if exists "Update payment proof" on public.orders;

drop policy if exists "Public read promo banner files" on storage.objects;
drop policy if exists "Authenticated upload promo banner files" on storage.objects;
drop policy if exists "Authenticated update promo banner files" on storage.objects;
drop policy if exists "Public read product files" on storage.objects;
drop policy if exists "Authenticated upload product files" on storage.objects;
drop policy if exists "Authenticated update product files" on storage.objects;
drop policy if exists "Public read payment proofs" on storage.objects;
drop policy if exists "Guest or user upload payment proofs" on storage.objects;
drop policy if exists "Guest or user update payment proofs" on storage.objects;

create policy "Public read categories" on public.categories for select using (true);
create policy "Public read products" on public.products for select using (active = true);
create policy "Public read active banners" on public.promo_banners for select using (active = true);
create policy "Public read active vouchers" on public.vouchers for select using (active = true);
create policy "Public read bank settings" on public.settings for select using (key = 'bank');

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users manage own cart" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own wishlist" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users create own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Users create own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant usage on schema public to authenticated;
grant usage on schema public to anon;
grant select on public.categories to anon;
grant select on public.products to anon;
grant select on public.promo_banners to anon;
grant select on public.vouchers to anon;
grant select on public.settings to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.promo_banners to authenticated;
grant select, insert, update, delete on public.vouchers to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;
grant insert, select on public.orders to anon, authenticated;
grant update on public.orders to anon;
grant insert, select on public.order_items to anon, authenticated;

create policy "Admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage banners" on public.promo_banners for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage vouchers" on public.vouchers for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins read all orders" on public.orders for select using (public.is_admin());
create policy "Admins update all orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins read all order items" on public.order_items for select using (public.is_admin());

create policy "Public read store settings" on public.store_settings for select using (true);
create policy "Admins insert store settings" on public.store_settings for insert with check (public.is_admin());
create policy "Admins update store settings" on public.store_settings for update using (public.is_admin()) with check (public.is_admin());

create policy "Public insert guest orders" on public.orders for insert with check (true);
create policy "Public insert guest order items" on public.order_items for insert with check (true);
create policy "Public read orders by id" on public.orders for select using (true);
create policy "Public read order items by id" on public.order_items for select using (true);
create policy "Update payment proof" on public.orders for update to anon, authenticated
using (status in ('pending', 'waiting_verification', 'menunggu_konfirmasi'))
with check (status in ('pending', 'waiting_verification', 'menunggu_konfirmasi', 'diproses', 'paid'));

create policy "Admins fallback read all orders" on public.orders for select using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  )
);

create policy "Admins fallback update all orders" on public.orders for update using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  )
) with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  )
);

insert into storage.buckets (id, name, public)
values ('promo-banners', 'promo-banners', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

create policy "Public read promo banner files" on storage.objects
for select using (bucket_id = 'promo-banners');

create policy "Authenticated upload promo banner files" on storage.objects
for insert to authenticated with check (bucket_id = 'promo-banners');

create policy "Authenticated update promo banner files" on storage.objects
for update to authenticated using (bucket_id = 'promo-banners');

create policy "Public read product files" on storage.objects
for select using (bucket_id = 'products');

create policy "Authenticated upload product files" on storage.objects
for insert to authenticated with check (bucket_id = 'products');

create policy "Authenticated update product files" on storage.objects
for update to authenticated using (bucket_id = 'products');

create policy "Public read payment proofs" on storage.objects
for select using (bucket_id = 'payment-proofs');

create policy "Guest or user upload payment proofs" on storage.objects
for insert to anon, authenticated with check (bucket_id = 'payment-proofs');

create policy "Guest or user update payment proofs" on storage.objects
for update to anon, authenticated using (bucket_id = 'payment-proofs') with check (bucket_id = 'payment-proofs');

insert into public.categories (name, image, sort_order) values
  ('Banner & Spanduk', 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=500&q=80', 1),
  ('Cetak Digital', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=500&q=80', 2),
  ('Stiker', 'https://images.unsplash.com/photo-1613909207039-6b173b755cc1?auto=format&fit=crop&w=500&q=80', 3),
  ('Papan & Stand', 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=500&q=80', 4),
  ('Merchandise', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80', 5),
  ('Undangan', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=500&q=80', 6)
on conflict (name) do update set image = excluded.image, sort_order = excluded.sort_order;

insert into public.products (id, name, category, price, old_price, image, badge, rating, sold) values
  ('banner-flexi', 'Banner / Flexy Outdoor', 'Banner & Spanduk', 25000, 32000, 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=900&q=85', 'TERLARIS', 4.9, 1280),
  ('stiker-vinyl', 'Stiker Vinyl A3+', 'Stiker', 18000, 24000, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=85', 'FLASH SALE', 4.8, 964),
  ('poster-a3', 'Cetak Poster A3 Art Carton', 'Cetak Digital', 12000, null, 'https://images.unsplash.com/photo-1613909207039-6b173b755cc1?auto=format&fit=crop&w=900&q=85', null, 4.7, 850),
  ('x-banner', 'X-Banner 60 x 160 cm', 'Papan & Stand', 85000, 110000, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=85', 'HEMAT 22%', 4.9, 620),
  ('kaos-sablon', 'Kaos Sablon 1 Warna', 'Merchandise', 45000, null, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', null, 4.8, 540),
  ('buku-menu', 'Cetak Menu & Brosur Lipat', 'Cetak Digital', 22000, null, 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=900&q=85', null, 4.6, 410),
  ('kartu-nama', 'Cetak Kartu Nama Premium', 'Cetak Digital', 35000, 45000, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=85', 'BEST SELLER', 4.9, 2100),
  ('oneway-vision', 'One Way Vision Kaca', 'Stiker', 95000, null, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85', null, 4.7, 332)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  old_price = excluded.old_price,
  image = excluded.image,
  badge = excluded.badge,
  rating = excluded.rating,
  sold = excluded.sold;

insert into public.vouchers (code, type, value, label)
values ('ADICETAK10', 'percent', 10, 'Diskon 10%')
on conflict (code) do update set type = excluded.type, value = excluded.value, label = excluded.label;

alter table public.orders alter column user_id drop not null;
alter table public.orders alter column status set default 'pending';

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
