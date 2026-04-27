import { useState } from "react";
import "./Matches.css";

export default function Matches() {

  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="matchcenter-page">

      {/* BANNER PARTIDO */}

      <div className="mc-banner">

        <div className="mc-team">
          <img src="/src/photos/alaves.png" />
          <span>Alavés</span>
        </div>

        <div className="mc-match">
          <span className="mc-date">20 Abril 2026</span>
          <span className="mc-vs">VS</span>
          <span className="mc-competition">LaLiga</span>
        </div>

        <div className="mc-team">
          <img src="/src/photos/betis.png" />
          <span>Betis</span>
        </div>

      </div>


      {/* SUBMENU */}

      <div className="mc-tabs">

        <button
          className={activeTab === "info" ? "active" : ""}
          onClick={() => setActiveTab("info")}
        >
          Información
        </button>

        <button
          className={activeTab === "lineups" ? "active" : ""}
          onClick={() => setActiveTab("lineups")}
        >
          Alineaciones
        </button>

        <button
          className={activeTab === "stats" ? "active" : ""}
          onClick={() => setActiveTab("stats")}
        >
          Stats
        </button>

        <button
          className={activeTab === "rival" ? "active" : ""}
          onClick={() => setActiveTab("rival")}
        >
          Rival
        </button>

      </div>


      {/* CONTENIDO */}

      <div className="mc-content">

        {activeTab === "info" && (
          <div>
            <h2>Información del partido</h2>
            <p>Estadio: Mendizorroza</p>
            <p>Árbitro: por confirmar</p>
            <p>Competición: LaLiga</p>
            <p>Hora: 18:30</p>
          </div>
        )}

        {activeTab === "lineups" && (
          <div className="lineups-wrapper">

            <div className="lineups-header">

              <div className="formation">
                <span>Alavés</span>
                <span className="formation-num">4-2-3-1</span>
              </div>

              <div className="lineups-title">
                Alineación probable
              </div>

              <div className="formation">
                <span className="formation-num">4-3-3</span>
                <span>Betis</span>
              </div>

            </div>


            <div className="pitch">

              <div className="box left"></div>
              <div className="box right"></div>


              {/* ALAVES */}

              <div className="team team-left">

                <div className="col">
                  <span><b>1</b> Sivera</span>
                </div>

                <div className="col">
                  <span><b>27</b> Javi López</span>
                  <span><b>3</b> Duarte</span>
                  <span><b>5</b> Abqar</span>
                  <span><b>14</b> Tenaglia</span>
                </div>

                <div className="col">
                  <span><b>8</b> Blanco</span>
                  <span><b>23</b> Benavidez</span>
                </div>

                <div className="col">
                  <span><b>11</b> Rioja</span>
                  <span><b>18</b> Guridi</span>
                  <span><b>21</b> Rebbach</span>
                </div>

                <div className="col">
                  <span><b>15</b> Kike García</span>
                </div>

              </div>


              {/* BETIS */}

              <div className="team team-right">

                <div className="col">
                  <span><b>13</b> Rui Silva</span>
                </div>

                <div className="col">
                  <span><b>3</b> Abner</span>
                  <span><b>16</b> Pezzella</span>
                  <span><b>5</b> Bartra</span>
                  <span><b>2</b> Bellerín</span>
                </div>

                <div className="col">
                  <span><b>22</b> Isco</span>
                  <span><b>14</b> Guido</span>
                  <span><b>8</b> Fekir</span>
                </div>

                <div className="col">
                  <span><b>12</b> Willian José</span>
                  <span><b>10</b> Ayoze</span>
                  <span><b>7</b> Luiz Henrique</span>
                </div>

              </div>

            </div>

          </div>
        )}

        {activeTab === "stats" && (

          <div className="stats-layout">

            {/* NOTAS JUGADORES */}

            <div className="player-ratings">

              <h3 className="ratings-title">Notas Alavés</h3>

              <PlayerRating name="Sivera" rating="7.2" />
              <PlayerRating name="Javi López" rating="6.8" />
              <PlayerRating name="Duarte" rating="7.0" />
              <PlayerRating name="Abqar" rating="6.9" />
              <PlayerRating name="Tenaglia" rating="7.4" />
              <PlayerRating name="Blanco" rating="6.7" />
              <PlayerRating name="Benavidez" rating="7.1" />
              <PlayerRating name="Rioja" rating="7.8" />
              <PlayerRating name="Guridi" rating="7.3" />
              <PlayerRating name="Rebbach" rating="6.6" />
              <PlayerRating name="Kike García" rating="8.1" />

            </div>


            {/* ESTADÍSTICAS */}

            <div className="stats-wrapper">

              <h2 className="stats-title">Estadísticas del partido</h2>

              <div className="stats-grid">

                <StatBar label="Posesión (%)" left={49} right={51} />
                <StatBar label="Goles esperados (xG)" left={2.48} right={1.31} />
                <StatBar label="Saques de esquina" left={10} right={6} />
                <StatBar label="Pases precisos (%)" left={85} right={79} />

              </div>

              <StatBar
                label="Disparos"
                left={22}
                right={17}
                leftDetail="5 a puerta"
                rightDetail="7 a puerta"
              />

              <StatRow label="Fueras de juego" left={1} right={1} />
              <StatRow label="Recuperaciones" left={50} right={45} />
              <StatRow label="Paradas portero" left={5} right={3} />
              <StatRow label="Faltas cometidas" left={14} right={16} />
              <StatRow label="Duelos ganados" left={55} right={62} />

            </div>

          </div>

        )}

        {activeTab === "rival" && (
          <div>
            <h2>Información del rival</h2>
            <p>El Real Betis llega tras ganar 2-0...</p>
          </div>
        )}

      </div>

    </div>
  );
}

function StatBar({ label, left, right, leftDetail, rightDetail }) {

  const total = left + right
  const leftPercent = (left / total) * 100
  const rightPercent = (right / total) * 100

  return (
    <div className="statbar">

      <div className="statbar-label">
        {label}
      </div>

      <div className="statbar-values">
        <span className="left">{left}</span>
        <span className="right">{right}</span>
      </div>

      <div className="statbar-track">

        <div
          className="statbar-left"
          style={{ width: `${leftPercent}%` }}
        />

        <div
          className="statbar-right"
          style={{ width: `${rightPercent}%` }}
        />

      </div>

      {(leftDetail || rightDetail) && (
        <div className="statbar-detail">
          <span>{leftDetail}</span>
          <span>{rightDetail}</span>
        </div>
      )}

    </div>
  )
}

function StatRow({ label, left, right }) {

  const total = left + right
  const leftPercent = (left / total) * 100

  return (
    <div className="statrow">

      <div className="statrow-bar">
        <div
          className="statrow-fill"
          style={{ width: `${leftPercent}%` }}
        />
      </div>

      <div className="statrow-info">
        <span className="left">{left}</span>
        <span className="label">{label}</span>
        <span className="right">{right}</span>
      </div>

    </div>
  )
}

function PlayerRating({ name, rating }) {
  return (
    <div className="player-rating">

      <span className="player-name">{name}</span>

      <span className="player-score">
        {rating}
      </span>

    </div>
  )
}