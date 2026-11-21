alter table public.products
  add column if not exists pricing_unit text not null default 'pcs'
    check (pricing_unit in ('pcs', 'meter')),
  add column if not exists min_order integer not null default 1,
  add column if not exists allow_custom_size boolean not null default false,
  add column if not exists min_area_sqm numeric not null default 1;
