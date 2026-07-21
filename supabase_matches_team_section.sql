alter table public.matches
add column if not exists team_section text not null default 'first';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_team_section_check'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
    add constraint matches_team_section_check
    check (team_section = any (array['first'::text, 'reserve'::text, 'female'::text]));
  end if;
end $$;

update public.matches match
set team_section = 'female'
from public.competitions competition
where match.competition_id = competition.id
  and match.team_section = 'first'
  and (
    lower(coalesce(competition.name, '')) like '%femen%'
    or lower(coalesce(competition.name, '')) like '%moeve%'
    or lower(coalesce(competition.name, '')) like '%liga f%'
    or lower(coalesce(match.home_team, '') || ' ' || coalesce(match.away_team, '')) like '%gloriosas%'
  );

update public.matches match
set team_section = 'reserve'
from public.competitions competition
where match.competition_id = competition.id
  and match.team_section = 'first'
  and (
    lower(coalesce(competition.name, '')) like '%segunda federaci%n%'
    or lower(coalesce(competition.name, '')) like '%2rfef%'
    or lower(coalesce(match.home_team, '') || ' ' || coalesce(match.away_team, '')) like '%filial%'
    or lower(coalesce(match.home_team, '') || ' ' || coalesce(match.away_team, '')) like '%miniglorias%'
    or lower(coalesce(match.home_team, '') || ' ' || coalesce(match.away_team, '')) like '%alav%s b%'
  );
