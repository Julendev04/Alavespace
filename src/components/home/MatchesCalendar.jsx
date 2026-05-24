import React from "react";
import { Link } from "react-router-dom";

export default function MatchesCalendar({ matches = [], standings = [] }) {
  const now = new Date();
  const upcomingMatches = matches
    .filter((match) => {
      const matchDate = new Date(match.match_date);
      return matchDate >= now && match.status !== "finished";
    })
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
    .slice(0, 5);
  const visibleMatches = upcomingMatches.length
    ? upcomingMatches
    : [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date)).slice(0, 5);
  const compactStandings = standings.slice(0, 8);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short"
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <section className="matches-calendar full-width">
      <div className="matches-header">
        <h2>Próximos 5 partidos</h2>
        <Link to="/trayectoria" className="season-calendar-label">Calendario completo</Link>
      </div>

      <div className="season-calendar-layout">
        <div className="season-matches-panel">
          {visibleMatches.map((match) => (
            <article key={match.id} className="season-match-row">
              <div className="season-match-date">
                <strong>{formatDate(match.match_date)}</strong>
                <span>Jornada {match.week}</span>
              </div>

              <div className="season-match-main">
                <span className="season-match-week">Próximo partido</span>
                <div className="season-match-teams">
                  <span>{match.home_team}</span>
                  <span>{match.away_team}</span>
                </div>
              </div>

              <strong className="season-match-score">
                {formatTime(match.match_date)}
              </strong>
            </article>
          ))}
        </div>

        <aside className="compact-standings-panel" aria-label="Clasificación compacta">
          <div className="compact-standings-head">
            <span>#</span>
            <span>Equipo</span>
            <span>PG</span>
            <span>Pts</span>
          </div>

          <div className="compact-standings-list">
            {compactStandings.map((team) => (
              <div key={team.id} className="compact-standing-row">
                <span className="compact-standing-position">{team.position}</span>
                <span className="compact-standing-team">
                  {team.team_logo && <img src={team.team_logo} alt="" loading="lazy" />}
                  <span>{team.team_name}</span>
                </span>
                <span className="compact-standing-wins">{team.wins}</span>
                <strong>{team.points}</strong>
              </div>
            ))}
          </div>

          <Link to="/trayectoria?tab=standings" className="full-standings-link">
            Clasificación completa
          </Link>
        </aside>
      </div>
    </section>
  );
}
