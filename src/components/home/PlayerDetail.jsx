import React from "react";
import { ArrowLeft, Cake, Flag, Shield, Sparkles, Trophy } from "lucide-react";

function clampPercent(value) {
  return `${Math.max(6, Math.min(100, value || 0))}%`;
}

export default function PlayerDetail({ selectedPlayer, setSelectedPlayer }) {
  if (!selectedPlayer) return null;

  const matches = Number(selectedPlayer.matches_played) || 0;
  const goals = Number(selectedPlayer.goals) || 0;
  const assists = Number(selectedPlayer.assists) || 0;
  const yellowCards = Number(selectedPlayer.yellow_cards) || 0;
  const redCards = Number(selectedPlayer.red_cards) || 0;
  const goalRatio = matches ? goals / matches : 0;
  const assistRatio = matches ? assists / matches : 0;
  const disciplineScore = Math.max(0, 100 - yellowCards * 8 - redCards * 22);
  const displayPosition = selectedPlayer.pos || selectedPlayer.position || "Jugador";
  const portrait = selectedPlayer.card_url || selectedPlayer.photo_url;

  return (
    <article className="player-detail player-detail-dashboard">
      <button
        className="player-detail-back"
        type="button"
        onClick={() => setSelectedPlayer(null)}
        aria-label="Volver a la lista de jugadores"
      >
        <ArrowLeft size={17} />
      </button>

      <section className="player-dashboard-hero">
        <div className="player-dashboard-bg" aria-hidden="true" />

        <div className="player-portrait-wrap">
          <img
            src={portrait}
            className="players-avatar"
            alt={selectedPlayer.name}
          />
        </div>

        <div className="player-dashboard-main">
          <span className="player-dashboard-label">Ficha de plantilla</span>
          <h3>{selectedPlayer.name}</h3>

          <div className="player-dashboard-chips">
            <span><Shield size={14} />{displayPosition}</span>
            {selectedPlayer.nationality_bd && (
              <span className="flag-chip">
                <img src={selectedPlayer.nationality_bd} alt="" />
                Nacionalidad
              </span>
            )}
            {selectedPlayer.age && <span><Cake size={14} />{selectedPlayer.age}</span>}
          </div>
        </div>
      </section>

      <section className="player-kpis">
        <div className="kpi">
          <span className="kpi-value">{matches}</span>
          <span className="kpi-label">Partidos</span>
        </div>
        <div className="kpi highlight">
          <span className="kpi-value">{goals}</span>
          <span className="kpi-label">Goles</span>
        </div>
        <div className="kpi">
          <span className="kpi-value">{assists}</span>
          <span className="kpi-label">Asistencias</span>
        </div>
      </section>

      <section className="player-performance-panel">
        <div className="performance-header">
          <div>
            <span>Dashboard</span>
            <h4>Rendimiento</h4>
          </div>
          <Sparkles size={18} />
        </div>

        <div className="performance-row">
          <div>
            <span>Gol por partido</span>
            <strong>{goalRatio.toFixed(2)}</strong>
          </div>
          <div className="performance-track">
            <div style={{ width: clampPercent(goalRatio * 100) }} />
          </div>
        </div>

        <div className="performance-row">
          <div>
            <span>Asistencia por partido</span>
            <strong>{assistRatio.toFixed(2)}</strong>
          </div>
          <div className="performance-track">
            <div style={{ width: clampPercent(assistRatio * 100) }} />
          </div>
        </div>

        <div className="performance-row">
          <div>
            <span>Control disciplinario</span>
            <strong>{disciplineScore}%</strong>
          </div>
          <div className="performance-track">
            <div style={{ width: clampPercent(disciplineScore) }} />
          </div>
        </div>
      </section>

      <section className="player-stats-grid">
        <div className="stat-box">
          <Flag size={17} />
          <h4>Disciplina</h4>
          <div>Amarillas: {yellowCards}</div>
          <div>Rojas: {redCards}</div>
        </div>

        <div className="stat-box stat-box-accent">
          <Trophy size={17} />
          <h4>Impacto</h4>
          <div>{goals + assists} acciones de gol</div>
          <div>{matches ? `${Math.round(((goals + assists) / matches) * 100)}% por partido` : "Sin minutos"}</div>
        </div>
      </section>
    </article>
  );
}
