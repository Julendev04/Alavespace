import React from "react";

const statLabels = {
  goals: "Goles",
  assists: "Asistencias",
  matches: "Partidos"
};

export default function StatsBox({ topStats, activeStat, setActiveStat }) {
  const metricKey = activeStat === "goals"
    ? "goals"
    : activeStat === "assists"
      ? "assists"
      : "matches_played";

  const data = [...topStats]
    .sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0))
    .slice(0, 5);

  const leaderValue = data[0]?.[metricKey] || 1;

  return (
    <section className="stats-box">
      <div className="stats-box-header">
        <div>
          <span className="stats-kicker">Primer equipo</span>
          <h2>Estadísticas destacadas</h2>
        </div>

        <div className="stats-toggle" aria-label="Seleccionar estadística">
          {Object.entries(statLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveStat(key)}
              className={activeStat === key ? "active" : ""}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-block">
        {data.map((player, index) => {
          const value = player[metricKey] || 0;
          const width = `${Math.max((value / leaderValue) * 100, 6)}%`;

          return (
            <article key={player.id} className="stat-row">
              <span className="rank">{index + 1}</span>
              <img src={player.photo_url} alt={player.name} loading="lazy" />

              <div className="stat-player-info">
                <div className="stat-player-line">
                  <span className="name">{player.name}</span>
                  <span className="value">{value}</span>
                </div>
                <div className="bar" aria-hidden="true">
                  <div className="fill" style={{ width }} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
