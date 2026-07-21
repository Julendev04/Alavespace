alter table public.jugadores
add column if not exists season text;

create index if not exists jugadores_team_type_season_idx
on public.jugadores (team_type, season);
