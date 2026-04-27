import React from "react";
import PlayerDetail from "./PlayerDetail";

export default function PlayerSearch({
  search,
  setSearch,
  teamFilter,
  setTeamFilter,
  positionFilter,
  setPositionFilter,
  results,
  selectedPlayer,
  setSelectedPlayer
}) {

  return (
    <div className="player-search-box">

      <h2>Enciclopedia de jugadores</h2>

      <div className="search-controls">

        <input
          type="text"
          placeholder="Buscar jugador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="all">Todos los equipos</option>
          <option value="first_team">Primer equipo</option>
          <option value="b_team">Equipo B</option>
          <option value="women_team">Femenino</option>
        </select>

        <select onChange={(e) => setPositionFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="Portero">Portero</option>
          <option value="Defensa">Defensa</option>
          <option value="Mediocentro">Mediocentro</option>
          <option value="Extremo">Extremo</option>
          <option value="Delantero">Delantero</option>
        </select>

      </div>

      <div className="search-results-wrapper">

        {selectedPlayer ? (

          <PlayerDetail
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
          />

        ) : (

          <div className="search-results">

            {results.length > 0 ? results.map((player) => (
              <div
                key={player.id}
                className="search-card"
                onClick={() => setSelectedPlayer(player)}
              >
                <img src={player.photo_url} />
                <div>
                  <h4>{player.name}</h4>
                  <span>{player.position}</span>
                </div>
              </div>
            )) : (
              <div className="no-results">
                Introduce algún filtro para ver jugadores
              </div>
            )}

          </div>

        )}

      </div>
    </div>
  );
}