alter table public.profiles
  add column if not exists full_name text,
  add column if not exists address jsonb not null default '{}'::jsonb,
  add column if not exists avatar_url text,
  add column if not exists role text not null default 'user';

create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid()
) ;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Authenticated upload avatars" on storage.objects;
drop policy if exists "Authenticated update avatars" on storage.objects;

create policy "Public read avatars"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "Authenticated upload avatars"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "Authenticated update avatars"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name_value text;
begin
  full_name_value := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    ''
  );

  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    address,
    avatar_url,
    role,
    name,
    is_admin
  )
  values (
    new.id,
    full_name_value,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    '{}'::jsonb,
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    'user',
    full_name_value,
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    name = coalesce(public.profiles.name, excluded.name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
