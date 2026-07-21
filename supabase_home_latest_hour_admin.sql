alter table public.home_latest_hour enable row level security;

drop policy if exists "Admins can insert home latest hour" on public.home_latest_hour;
create policy "Admins can insert home latest hour"
on public.home_latest_hour
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

drop policy if exists "Admins can update home latest hour" on public.home_latest_hour;
create policy "Admins can update home latest hour"
on public.home_latest_hour
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
