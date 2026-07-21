alter table public.matches enable row level security;

drop policy if exists "Public can read matches" on public.matches;
create policy "Public can read matches"
on public.matches
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert matches" on public.matches;
create policy "Admins can insert matches"
on public.matches
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
