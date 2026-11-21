alter table public.products
  add column if not exists variations jsonb not null default '{"groups":[]}'::jsonb;

alter table public.profiles
  add column if not exists member_code text,
  add column if not exists member_discount_percent integer not null default 0;
