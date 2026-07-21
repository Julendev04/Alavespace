import React from "react";
import { Handshake, Trophy } from "lucide-react";

const sections = [
  { key: "goals", label: "Goleadores", icon: Trophy },
  { key: "assists", label: "Asistentes", icon: Handshake },
];

export default function StatsBox({ topStats = [] }) {
  const getRanking = (metricKey) => [...topStats]
    .sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0))
    .slice(0, 6);

  return (
    <section className="stats-box simple-stats-box">
      <div className="simple-stats-list">
        {sections.map(({ key, label, icon: Icon }) => (
          <section key={key} className="simple-stats-section">
            <header className="simple-stats-title">
              <Icon size={18} aria-hidden="true" />
              <h3>{label}</h3>
            </header>

            <div className="simple-stats-ranking">
              {getRanking(key).map((player, index) => (
                <article key={`${key}-${player.id}`} className="simple-stat-row">
                  <span className="simple-stat-rank">{index + 1}</span>
                  <strong>{player.name}</strong>
                  <span>{player[key] || 0}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

    </section>
  );
}
