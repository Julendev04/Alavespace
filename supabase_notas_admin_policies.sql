alter table public.jornadas enable row level security;
alter table public.convocatorias enable row level security;
alter table public.votos enable row level security;

drop policy if exists "Admins can manage jornadas" on public.jornadas;
create policy "Admins can manage jornadas"
on public.jornadas
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete jornada convocatorias" on public.convocatorias;
create policy "Admins can delete jornada convocatorias"
on public.convocatorias
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete jornada votos" on public.votos;
create policy "Admins can delete jornada votos"
on public.votos
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
