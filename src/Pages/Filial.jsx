import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "./Plantilla.css";

export default function Filial() {

  // 🔹 PARTIDOS (mock)
  const matches = [
    {
      time: "14:00",
      home: "Alavés B",
      away: "CD Alfaro",
      homeLogo: "src/photos/alaves.png",
      awayLogo: "src/photos/alfaro.png",
    },
    {
      time: "16:15",
      home: "SD Logrones",
      away: "Alavés B",
      homeLogo: "src/photos/logrones.png",
      awayLogo: "src/photos/alaves.png",
    },
    {
      time: "18:30",
      home: "Alavés B",
      away: "Mutilvera",
      homeLogo: "src/photos/alaves.png",
      awayLogo: "src/photos/mutilvera.png",
    },
  ];

  // 🔹 PLAYERS
  const [players, setPlayers] = useState([]);

  // 🔹 PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players_b")
      .select("*");

    if (error || !data) return;

    setPlayers(data);
  }

  // 🔹 LÓGICA PAGINACIÓN
  const totalRows = players.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const currentPlayers = players.slice(startIndex, endIndex);

  // 🔹 POSICIONES
  function getPositionClass(position) {
    switch (position) {
      case "Portero":
        return "pos-gk";
      case "Defensa":
        return "pos-def";
      case "Mediocentro":
        return "pos-mid";
      case "Extremo":
        return "ata-ext";
      case "Delantero":
        return "pos-st";
      default:
        return "";
    }
  }

  return (
    <div className="plantilla-wrapper">

      <div className="team-stats">

        <div className="stat-item">
          <span className="stat-number">00</span>
          <span className="stat-label">Victorias</span>
        </div>

        <div className="stat-item">
          <span className="stat-number">00</span>
          <span className="stat-label">Derrotas</span>
        </div>

        <div className="stat-item">
          <span className="stat-number">00</span>
          <span className="stat-label">Empates</span>
        </div>

        <div className="stat-item">
          <span className="stat-number">00</span>
          <span className="stat-label">Partidos</span>
        </div>

        <div className="coach-item">
          <img src="src/photos/MOLO_CASAS.png" alt="Entrenador" />
          <span className="coach-label">Molo Casas</span>
        </div>

      </div>
      <div className="team-subtitle">
        Miniglorias · Temporada 2025/26
      </div>

      <div className="table-container2">

        {/* 🔹 TABLA JUGADORES */}
        <table className="plantilla-table2">

          <thead>
            <tr>
              <th>Jugador</th>
              <th>Posición</th>
              <th>Nacionalidad</th>
              <th>Edad</th>
            </tr>
          </thead>

          <tbody>
            {currentPlayers.map((player) => (
              <tr key={player.id} className="player-row">

                <td className="player-info col-player">
                  {player.photo_url && (
                    <img src={player.photo_url} alt={player.name} />
                  )}
                  <span>{player.name}</span>
                </td>

                <td className="col-position">
                  <span
                    className={`position-badge ${getPositionClass(player.position)}`}
                  >
                    {player.position}
                  </span>
                </td>

                <td className="col-small">
                  <span className="nationality-badge">
                    <img
                      src={`src/assets/Banderas/${player.nationality_bd}.png`}
                      alt={player.nationality_name}
                    />
                    {player.nationality_name}
                  </span>
                </td>

                <td className="col-small">
                  {player.birth}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

        {/* 🔹 PAGINACIÓN */}
        <div className="pagination">

          <div className="rows-selector">
            <span>Filas por página:</span>

            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="pagination-info">
            {totalRows === 0
              ? "0-0 de 0"
              : `${startIndex + 1}–${Math.min(endIndex, totalRows)} de ${totalRows}`}
          </div>

          <div className="pagination-buttons">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              ⏮
            </button>

            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              ◀
            </button>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              ⏭
            </button>
          </div>

        </div>

        {/* 🔹 PARTIDOS */}
        <div className="matches-wrapper">

          <div className="matches-header">
            <h2 className="league-title">LALIGA EA Sports</h2>

            <div className="header-actions">
              <button className="header-btn">Clasificación</button>
              <button className="header-btn">Resultados</button>
            </div>
          </div>

          <div className="matches-list">
            {matches.map((match, index) => (
              <div key={index} className="match-row">

                <div className="match-time">{match.time}</div>

                <div className="match-team">
                  <img src={match.homeLogo} alt={match.home} />
                  <span>{match.home}</span>
                </div>

                <div className="match-score">-</div>

                <div className="match-team">
                  <img src={match.awayLogo} alt={match.away} />
                  <span>{match.away}</span>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}