alter table public.matches
add column if not exists match_side text null;

alter table public.matches
drop constraint if exists matches_match_side_check;

alter table public.matches
add constraint matches_match_side_check
check (match_side is null or match_side in ('LOCAL', 'VISITANTE'));
