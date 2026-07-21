alter table public.league_matches enable row level security;
alter table public.league_teams enable row level security;

drop policy if exists "Public can read league matches" on public.league_matches;
create policy "Public can read league matches"
on public.league_matches
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read league teams" on public.league_teams;
create policy "Public can read league teams"
on public.league_teams
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert league matches" on public.league_matches;
create policy "Admins can insert league matches"
on public.league_matches
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

drop policy if exists "Admins can update league matches" on public.league_matches;
create policy "Admins can update league matches"
on public.league_matches
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
