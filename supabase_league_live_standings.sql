create extension if not exists pgcrypto;

create table if not exists public.league_teams (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  name text not null,
  short_name text null,
  slug text not null,
  logo_url text null,
  created_at timestamptz default now(),
  unique (season, slug)
);

create table if not exists public.league_matches (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  week integer not null,
  match_date timestamptz null,
  home_team_id uuid not null references public.league_teams(id) on delete restrict,
  away_team_id uuid not null references public.league_teams(id) on delete restrict,
  home_score integer null,
  away_score integer null,
  status text not null default 'scheduled',
  created_at timestamptz default now(),

  constraint league_matches_status_check
    check (status in ('scheduled', 'live', 'finished', 'postponed')),

  constraint league_matches_different_teams_check
    check (home_team_id <> away_team_id),

  constraint league_matches_scores_non_negative_check
    check (
      (home_score is null or home_score >= 0)
      and
      (away_score is null or away_score >= 0)
    ),

  constraint league_matches_finished_scores_check
    check (
      status <> 'finished'
      or
      (home_score is not null and away_score is not null)
    )
);

create index if not exists league_teams_season_idx
  on public.league_teams(season);

create index if not exists league_matches_season_week_idx
  on public.league_matches(season, week);

create index if not exists league_matches_status_idx
  on public.league_matches(status);

create index if not exists league_matches_home_team_idx
  on public.league_matches(home_team_id);

create index if not exists league_matches_away_team_idx
  on public.league_matches(away_team_id);

drop view if exists public.league_standings_live;

create view public.league_standings_live as
with team_results as (
  select
    lm.season,
    lm.home_team_id as team_id,
    1 as played,
    case when lm.home_score > lm.away_score then 1 else 0 end as wins,
    case when lm.home_score = lm.away_score then 1 else 0 end as draws,
    case when lm.home_score < lm.away_score then 1 else 0 end as losses,
    lm.home_score as goals_for,
    lm.away_score as goals_against,
    case
      when lm.home_score > lm.away_score then 3
      when lm.home_score = lm.away_score then 1
      else 0
    end as points
  from public.league_matches lm
  where lm.status = 'finished'

  union all

  select
    lm.season,
    lm.away_team_id as team_id,
    1 as played,
    case when lm.away_score > lm.home_score then 1 else 0 end as wins,
    case when lm.away_score = lm.home_score then 1 else 0 end as draws,
    case when lm.away_score < lm.home_score then 1 else 0 end as losses,
    lm.away_score as goals_for,
    lm.home_score as goals_against,
    case
      when lm.away_score > lm.home_score then 3
      when lm.away_score = lm.home_score then 1
      else 0
    end as points
  from public.league_matches lm
  where lm.status = 'finished'
),

standings_base as (
  select
    lt.id,
    lt.season,
    lt.name as team_name,
    lt.logo_url as team_logo,
    coalesce(sum(tr.played), 0)::integer as played,
    coalesce(sum(tr.wins), 0)::integer as wins,
    coalesce(sum(tr.draws), 0)::integer as draws,
    coalesce(sum(tr.losses), 0)::integer as losses,
    coalesce(sum(tr.goals_for), 0)::integer as goals_for,
    coalesce(sum(tr.goals_against), 0)::integer as goals_against,
    (
      coalesce(sum(tr.goals_for), 0)
      -
      coalesce(sum(tr.goals_against), 0)
    )::integer as goal_diff,
    coalesce(sum(tr.points), 0)::integer as points
  from public.league_teams lt
  left join team_results tr
    on tr.team_id = lt.id
    and tr.season = lt.season
  group by lt.id, lt.season, lt.name, lt.logo_url
)

select
  row_number() over (
    partition by season
    order by points desc, goal_diff desc, goals_for desc, team_name asc
  )::integer as position,
  id,
  season,
  team_name,
  team_logo,
  played,
  wins,
  draws,
  losses,
  goals_for,
  goals_against,
  goal_diff,
  points
from standings_base;

-- Example:
-- select *
-- from public.league_standings_live
-- where season = '2025/26'
-- order by position;
