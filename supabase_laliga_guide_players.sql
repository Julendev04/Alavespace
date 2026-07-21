create extension if not exists pgcrypto;

create table if not exists public.laliga_guide_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.laliga_guide_teams(id) on delete cascade,
  name text not null,
  country text null,
  position text null,
  photo_url text null,
  photo_path text null,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.laliga_guide_players
  add column if not exists position text null;

create index if not exists laliga_guide_players_team_order_idx
  on public.laliga_guide_players(team_id, sort_order, name);

create index if not exists laliga_guide_players_team_position_idx
  on public.laliga_guide_players(team_id, position, sort_order, name);

alter table public.laliga_guide_players enable row level security;

drop policy if exists "Public can read laliga guide players" on public.laliga_guide_players;
create policy "Public can read laliga guide players"
on public.laliga_guide_players
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert laliga guide players" on public.laliga_guide_players;
create policy "Admins can insert laliga guide players"
on public.laliga_guide_players
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update laliga guide players" on public.laliga_guide_players;
create policy "Admins can update laliga guide players"
on public.laliga_guide_players
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete laliga guide players" on public.laliga_guide_players;
create policy "Admins can delete laliga guide players"
on public.laliga_guide_players
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

insert into storage.buckets (id, name, public)
values ('laliga-player-photos', 'laliga-player-photos', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Anyone can read laliga player photos" on storage.objects;
create policy "Anyone can read laliga player photos"
on storage.objects
for select
using (bucket_id = 'laliga-player-photos');

drop policy if exists "Admins can upload laliga player photos" on storage.objects;
create policy "Admins can upload laliga player photos"
on storage.objects
for insert
with check (
  bucket_id = 'laliga-player-photos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update laliga player photos" on storage.objects;
create policy "Admins can update laliga player photos"
on storage.objects
for update
using (
  bucket_id = 'laliga-player-photos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'laliga-player-photos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete laliga player photos" on storage.objects;
create policy "Admins can delete laliga player photos"
on storage.objects
for delete
using (
  bucket_id = 'laliga-player-photos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
