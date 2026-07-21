import React from "react";
import { ArrowLeft, Cake, Shield, TrendingUp } from "lucide-react";

export default function PlayerDetail({ selectedPlayer, setSelectedPlayer }) {
  if (!selectedPlayer) return null;

  const matches = Number(selectedPlayer.matches_played) || 0;
  const goals = Number(selectedPlayer.goals) || 0;
  const assists = Number(selectedPlayer.assists) || 0;
  const yellowCards = Number(selectedPlayer.yellow_cards) || 0;
  const redCards = Number(selectedPlayer.red_cards) || 0;
  const goalRatio = matches ? goals / matches : 0;
  const assistRatio = matches ? assists / matches : 0;
  const displayPosition = selectedPlayer.pos || selectedPlayer.position || "Jugador";
  const portrait = selectedPlayer.photo_url || selectedPlayer.card_url;
  const marketValue = selectedPlayer.market_value;
  const formattedMarketValue = marketValue == null || marketValue === ""
    ? "Sin valorar"
    : `${Number(marketValue).toLocaleString("es-ES", { maximumFractionDigits: 1 })} M€`;

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

        <div className="player-value-strip">
          <span>Valor de mercado</span>
          <strong><TrendingUp size={20} />{formattedMarketValue}</strong>
        </div>
      </section>

      <section className="player-summary-line" aria-label="Resumen de rendimiento">
        <span><strong>{matches}</strong>Partidos</span>
        <span><strong>{goals}</strong>Goles</span>
        <span><strong>{assists}</strong>Asistencias</span>
        <span><strong>{goalRatio.toFixed(2)}</strong>Gol / partido</span>
        <span><strong>{assistRatio.toFixed(2)}</strong>Asist. / partido</span>
        <span><strong>{yellowCards}</strong>Amarillas</span>
        <span><strong>{redCards}</strong>Rojas</span>
      </section>
    </article>
  );
}
