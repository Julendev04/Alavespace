create extension if not exists unaccent with schema extensions;

create or replace view public.porra_ranking_view as
with prediction_results as (
  select
    p.id,
    p.user_id,
    p.match_id,
    p.goles_alaves,
    p.goles_rival,
    p.goleadores,
    m.status,
    m.home_team,
    m.away_team,
    m.home_score,
    m.away_score,
    m.scorers,
    case
      when lower(coalesce(m.home_team, '')) like '%alav%' then m.home_score
      when lower(coalesce(m.away_team, '')) like '%alav%' then m.away_score
      else null
    end as real_goles_alaves,
    case
      when lower(coalesce(m.home_team, '')) like '%alav%' then m.away_score
      when lower(coalesce(m.away_team, '')) like '%alav%' then m.home_score
      else null
    end as real_goles_rival
  from public.porra_predictions p
  join public.matches m on m.id = p.match_id
),
prediction_scores as (
  select
    pr.*,
    (
      lower(coalesce(pr.status, '')) = 'finished'
      and pr.home_score is not null
      and pr.away_score is not null
    ) as is_finished,
    case
      when lower(coalesce(pr.status, '')) = 'finished'
        and pr.home_score is not null
        and pr.away_score is not null
        and pr.goles_alaves = pr.real_goles_alaves
        and pr.goles_rival = pr.real_goles_rival
      then 1
      else 0
    end as exactos,
    case
      when lower(coalesce(pr.status, '')) = 'finished'
        and pr.home_score is not null
        and pr.away_score is not null
      then (
        select count(*)
        from regexp_split_to_table(coalesce(pr.goleadores, ''), '\s*,\s*') as guessed(name)
        where trim(guessed.name) <> ''
          and exists (
            select 1
            from regexp_split_to_table(coalesce(pr.scorers, ''), '\s*,\s*') as real(name)
            where lower(extensions.unaccent(trim(real.name))) = lower(extensions.unaccent(trim(guessed.name)))
          )
      )::integer
      else 0
    end as goleadores_acertados
  from prediction_results pr
),
scored_predictions as (
  select
    ps.*,
    (ps.exactos * 5) + (ps.goleadores_acertados * 2) as base_points
  from prediction_scores ps
),
ranked_predictions as (
  select
    sp.*,
    case
      when sp.is_finished and sp.base_points > 0 then 1
      else 0
    end as jornadas_puntuando,
    case
      when sp.is_finished and sp.base_points > 0 then sp.base_points + 1
      else sp.base_points
    end as puntos
  from scored_predictions sp
)
select
  u.id,
  u.nombre,
  u.avatar,
  coalesce(sum(rp.puntos), 0)::integer as puntos,
  count(rp.id)::integer as participaciones,
  count(rp.id)::integer as predicciones,
  count(rp.id)::integer as jornadas_jugadas,
  count(rp.id)::integer as total_participaciones,
  coalesce(sum(rp.exactos), 0)::integer as exactos,
  coalesce(sum(rp.exactos), 0)::integer as resultado_exacto,
  coalesce(sum(rp.exactos), 0)::integer as resultados_exactos,
  coalesce(sum(rp.exactos), 0)::integer as marcadores_exactos,
  coalesce(sum(rp.goleadores_acertados), 0)::integer as goleadores_acertados,
  coalesce(sum(rp.goleadores_acertados), 0)::integer as aciertos_goleadores,
  coalesce(sum(rp.goleadores_acertados), 0)::integer as goleadores_ok,
  coalesce(sum(rp.jornadas_puntuando), 0)::integer as jornadas_puntuando,
  coalesce(sum(rp.jornadas_puntuando), 0)::integer as racha_puntos,
  coalesce(sum(rp.jornadas_puntuando), 0)::integer as bonus
from public.porra_users u
left join ranked_predictions rp on rp.user_id = u.id
group by u.id, u.nombre, u.avatar;

grant select on public.porra_ranking_view to anon, authenticated;
