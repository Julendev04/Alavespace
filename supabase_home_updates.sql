create table if not exists public.home_updates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.home_updates enable row level security;

drop policy if exists "home_updates_select_all" on public.home_updates;
create policy "home_updates_select_all"
on public.home_updates
for select
using (true);

drop policy if exists "home_updates_admin_insert" on public.home_updates;
create policy "home_updates_admin_insert"
on public.home_updates
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
