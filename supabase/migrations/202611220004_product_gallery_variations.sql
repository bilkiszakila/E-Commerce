alter table public.products
  add column if not exists gallery text[] not null default '{}'::text[],
  add column if not exists variations jsonb not null default '{"materials":[],"sizes":[],"finishings":[]}'::jsonb;
