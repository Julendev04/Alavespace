create extension if not exists pgcrypto;

create table if not exists public.laliga_guide_teams (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  sort_order integer not null,
  name text not null,
  display_name text not null,
  slug text not null,
  city text null,
  stadium text null,
  stadium_capacity integer null,
  founded_year integer null,
  nickname text null,
  primary_color text not null default '#0a4c8b',
  secondary_color text not null default '#ffffff',
  logo_url text null,
  short_description text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (season, slug),
  unique (season, sort_order)
);

create index if not exists laliga_guide_teams_season_order_idx
  on public.laliga_guide_teams(season, sort_order);

alter table public.laliga_guide_teams enable row level security;

drop policy if exists "Public can read laliga guide teams" on public.laliga_guide_teams;
create policy "Public can read laliga guide teams"
on public.laliga_guide_teams
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert laliga guide teams" on public.laliga_guide_teams;
create policy "Admins can insert laliga guide teams"
on public.laliga_guide_teams
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

drop policy if exists "Admins can update laliga guide teams" on public.laliga_guide_teams;
create policy "Admins can update laliga guide teams"
on public.laliga_guide_teams
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

insert into public.laliga_guide_teams (
  season,
  sort_order,
  name,
  display_name,
  slug,
  city,
  stadium,
  stadium_capacity,
  founded_year,
  nickname,
  primary_color,
  secondary_color,
  logo_url,
  short_description
)
values
  ('2026/27', 1, 'Deportivo Alaves', 'Deportivo Alaves', 'deportivo-alaves', 'Vitoria-Gasteiz', 'Mendizorrotza', 19840, 1921, 'El Glorioso', '#0057b8', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Deportivo%20Alaves%20logo%20%282020%29.svg', 'El equipo de Vitoria-Gasteiz y el foco natural de la mirada Alavesfera en Primera.'),
  ('2026/27', 2, 'Getafe CF', 'Getafe CF', 'getafe-cf', 'Getafe', 'Coliseum', 16800, 1983, 'Azulones', '#0055a4', '#f3c500', 'https://commons.wikimedia.org/wiki/Special:FilePath/Getafe%20CF%20logo.svg', 'Un rival competitivo, reconocible por su intensidad y su casa en el sur de Madrid.'),
  ('2026/27', 3, 'Atletico de Madrid', 'Atletico de Madrid', 'atletico-madrid', 'Madrid', 'Metropolitano', 70460, 1903, 'Colchoneros', '#d71920', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Atletico%20Madrid%20logo.svg', 'Uno de los grandes del campeonato, con una identidad marcada por competitividad y solidez.'),
  ('2026/27', 4, 'Malaga CF', 'Malaga CF', 'malaga-cf', 'Malaga', 'La Rosaleda', 30044, 1904, 'Boquerones', '#00a3e0', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Malaga%20CF%20logo.svg', 'Histórico andaluz de vuelta a la elite con La Rosaleda como gran punto de encuentro.'),
  ('2026/27', 5, 'Celta de Vigo', 'Celta de Vigo', 'celta-vigo', 'Vigo', 'Balaidos', 24791, 1923, 'Celestes', '#8fd8f8', '#c8102e', 'https://commons.wikimedia.org/wiki/Special:FilePath/RC%20Celta%20de%20Vigo%20logo.svg', 'El club vigués mantiene una identidad técnica y ofensiva muy reconocible en LaLiga.'),
  ('2026/27', 6, 'CA Osasuna', 'CA Osasuna', 'osasuna', 'Pamplona', 'El Sadar', 23516, 1920, 'Rojillos', '#ce1126', '#001f5b', 'https://commons.wikimedia.org/wiki/Special:FilePath/CA%20Osasuna%20logo.svg', 'El Sadar y la energía rojilla convierten cada visita a Pamplona en una prueba exigente.'),
  ('2026/27', 7, 'Deportivo de La Coruna', 'Deportivo de La Coruna', 'deportivo-la-coruna', 'A Coruna', 'Riazor', 32912, 1906, 'Branquiazuis', '#0067b1', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Deportivo%20de%20La%20Coruna%20logo.svg', 'Un histórico gallego que regresa al primer plano con Riazor como motor emocional.'),
  ('2026/27', 8, 'Elche CF', 'Elche CF', 'elche-cf', 'Elche', 'Martinez Valero', 33732, 1923, 'Franjiverdes', '#00843d', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Elche%20CF%20logo.svg', 'El conjunto franjiverde aporta tradición, resistencia y un estadio de gran escala.'),
  ('2026/27', 9, 'RCD Espanyol', 'RCD Espanyol', 'espanyol', 'Barcelona', 'RCDE Stadium', 40500, 1900, 'Pericos', '#0072ce', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/RCD%20Espanyol%20logo.svg', 'Club barcelonés con historia centenaria y una afición de fuerte personalidad.'),
  ('2026/27', 10, 'Levante UD', 'Levante UD', 'levante-ud', 'Valencia', 'Ciutat de Valencia', 26354, 1909, 'Granotas', '#003a70', '#a6192e', 'https://commons.wikimedia.org/wiki/Special:FilePath/Levante%20UD%20logo.svg', 'El Levante vuelve a medir su proyecto en Primera desde el Ciutat de Valencia.'),
  ('2026/27', 11, 'FC Barcelona', 'FC Barcelona', 'fc-barcelona', 'Barcelona', 'Camp Nou', 99354, 1899, 'Cules', '#a50044', '#004d98', 'https://commons.wikimedia.org/wiki/Special:FilePath/FC%20Barcelona%20%28crest%29.svg', 'Gigante historico de LaLiga, asociado a cantera, posesion y ambicion permanente.'),
  ('2026/27', 12, 'Athletic Club', 'Athletic Club', 'athletic-club', 'Bilbao', 'San Mames', 53289, 1898, 'Leones', '#ee2523', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Athletic%20Club%20Bilbao%20logo.svg', 'Un club singular por filosofia, historia y una de las atmosferas mas potentes de la liga.'),
  ('2026/27', 13, 'Racing de Santander', 'Racing de Santander', 'racing-santander', 'Santander', 'El Sardinero', 22222, 1913, 'Racinguistas', '#007a3d', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Real%20Racing%20Club%20de%20Santander%20logo.svg', 'Otro historico del norte que devuelve El Sardinero al mapa de Primera.'),
  ('2026/27', 14, 'Villarreal CF', 'Villarreal CF', 'villarreal-cf', 'Villarreal', 'Estadio de la Ceramica', 23500, 1923, 'Submarino Amarillo', '#ffe500', '#0057b8', 'https://commons.wikimedia.org/wiki/Special:FilePath/Villarreal%20CF%20logo.svg', 'Proyecto estable y europeo, con una identidad de juego reconocible desde hace anos.'),
  ('2026/27', 15, 'Real Madrid', 'Real Madrid', 'real-madrid', 'Madrid', 'Santiago Bernabeu', 83000, 1902, 'Merengues', '#ffffff', '#febd11', 'https://commons.wikimedia.org/wiki/Special:FilePath/Real%20Madrid%20CF.svg', 'El club con mayor palmares liguero y una exigencia maxima en cada temporada.'),
  ('2026/27', 16, 'Real Sociedad', 'Real Sociedad', 'real-sociedad', 'Donostia', 'Reale Arena', 39500, 1909, 'Txuri-urdin', '#0067b1', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Real%20Sociedad%20logo.svg', 'Rival vasco de enorme estructura, cantera fuerte y una idea futbolistica muy asentada.'),
  ('2026/27', 17, 'Sevilla FC', 'Sevilla FC', 'sevilla-fc', 'Sevilla', 'Ramon Sanchez-Pizjuan', 43883, 1890, 'Nervionenses', '#d71920', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sevilla%20FC%20logo.svg', 'Un historico andaluz con peso europeo y una grada especialmente exigente.'),
  ('2026/27', 18, 'Rayo Vallecano', 'Rayo Vallecano', 'rayo-vallecano', 'Madrid', 'Vallecas', 14708, 1924, 'Franjirrojos', '#ffffff', '#e30613', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rayo%20Vallecano%20logo.svg', 'Vallecas representa una de las identidades barriales mas reconocibles del futbol espanol.'),
  ('2026/27', 19, 'Valencia CF', 'Valencia CF', 'valencia-cf', 'Valencia', 'Mestalla', 49430, 1919, 'Ches', '#ffffff', '#f58220', 'https://commons.wikimedia.org/wiki/Special:FilePath/Valencia%20CF%20logo.svg', 'Mestalla y su historia convierten al Valencia en uno de los grandes nombres del torneo.'),
  ('2026/27', 20, 'Real Betis', 'Real Betis', 'real-betis', 'Sevilla', 'La Cartuja', 57619, 1907, 'Verdiblancos', '#00954c', '#ffffff', 'https://commons.wikimedia.org/wiki/Special:FilePath/Real%20Betis%20logo.svg', 'Equipo de gran masa social, caracter ofensivo y una presencia muy viva en Sevilla.')
on conflict (season, slug) do update
set
  sort_order = excluded.sort_order,
  name = excluded.name,
  display_name = excluded.display_name,
  city = excluded.city,
  stadium = excluded.stadium,
  stadium_capacity = excluded.stadium_capacity,
  founded_year = excluded.founded_year,
  nickname = excluded.nickname,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  logo_url = excluded.logo_url,
  short_description = excluded.short_description,
  updated_at = now();
