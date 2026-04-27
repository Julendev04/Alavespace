import React from "react";
import { Cake } from "lucide-react";

export default function PlayerDetail({ selectedPlayer, setSelectedPlayer }) {

    if (!selectedPlayer) return null;

    return (

        <div className="player-detail">

            <button
                className="back-btn"
                onClick={() => setSelectedPlayer(null)}
            >
                ✕
            </button>

            <div className="players-header">

                <img
                    src={selectedPlayer.card_url}
                    className="players-avatar"
                />

                <div className="players-info">

                    <div className="players-name">
                        {selectedPlayer.name}
                    </div>

                    <div className="players-meta">

                        <div className="pos-badge">
                            {selectedPlayer.pos}
                        </div>

                        <img
                            src={selectedPlayer.nationality_bd}
                            className="nationality-flag"
                        />

                        <Cake className="meta-icon" />

                        <span>{selectedPlayer.age}</span>

                    </div>

                </div>

            </div>

            <div className="player-kpis">

                <div className="kpi">
                    <span className="kpi-value">
                        {selectedPlayer.matches_played}
                    </span>
                    <span className="kpi-label"> Partidos</span>
                </div>

                <div className="kpi highlight">
                    <span className="kpi-value">
                        {selectedPlayer.goals}
                    </span>
                    <span className="kpi-label"> Goles</span>
                </div>

                <div className="kpi">
                    <span className="kpi-value">
                        {selectedPlayer.assists}
                    </span>
                    <span className="kpi-label"> Asistencias</span>
                </div>

            </div>

            <div className="player-stats-grid">

                <div className="stat-box">
                    <h4>Disciplina</h4>
                    <div>Amarillas: {selectedPlayer.yellow_cards}</div>
                    <div>Rojas: {selectedPlayer.red_cards}</div>
                </div>

                <div className="stat-box">
                    <h4>Rendimiento</h4>

                    <div className="bar-row">
                        <span>Gol/Partido</span>

                        <div className="mini-bar">
                            <div
                                style={{
                                    width: selectedPlayer.matches_played
                                        ? `${(selectedPlayer.goals / selectedPlayer.matches_played) * 100}%`
                                        : "0%"
                                }}
                            />
                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}