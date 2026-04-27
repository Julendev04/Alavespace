import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "./Plantilla.css";

export default function Plantilla() {
  const [players, setPlayers] = useState([]);
  const [teamFilter, setTeamFilter] = useState("first_team");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchPlayers();
  }, [teamFilter]);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("jugadores")
      .select("*")
      .eq("team_type", teamFilter);

    if (error || !data) return;

    // 🔥 ORDEN POR POSICIÓN + DORSAL
    const order = {
      Portero: 1,
      Defensa: 2,
      Mediocentro: 3,
      Extremo: 4,
      Delantero: 5,
    };

    const sorted = data.sort((a, b) => {
      if (order[a.position] !== order[b.position]) {
        return order[a.position] - order[b.position];
      }
      return a.number - b.number;
    });

    setPlayers(sorted);
  }

  function handleSort(field) {

    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }

  }

  const teamTitles = {
    first_team: "DEPORTIVO ALAVÉS",
    b_team: "MINIGLORIAS",
    women_team: "ALAVÉS FEM",
  };


  let sortedPlayers = [...players];

  if (sortField) {
    sortedPlayers.sort((a, b) => {

      if (a[sortField] < b[sortField]) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (a[sortField] > b[sortField]) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  function groupByPosition() {
    return {
      Porteros: sortedPlayers.filter(p => p.position === "Portero"),
      Defensas: sortedPlayers.filter(p => p.position === "Defensa"),
      Mediocentros: sortedPlayers.filter(p => p.position === "Mediocentro"),
      Atacantes: sortedPlayers.filter(p =>
        p.position === "Extremo" || p.position === "Delantero"
      ),
    };
  }

  const grouped = groupByPosition();

  return (
    <div className="plantilla-wrapper">
      <h1 className="plantilla-title">
        {teamTitles[teamFilter]}
      </h1>

      {/* FILTRO */}
      <div className="team-filter">
        <button
          className={`filter-btn ${teamFilter === "first_team" ? "active" : ""}`}
          onClick={() => setTeamFilter("first_team")}
        >
          Primer equipo
        </button>

        <button
          className={`filter-btn ${teamFilter === "b_team" ? "active" : ""}`}
          onClick={() => setTeamFilter("b_team")}
        >
          Equipo B
        </button>

        <button
          className={`filter-btn ${teamFilter === "women_team" ? "active" : ""}`}
          onClick={() => setTeamFilter("women_team")}
        >
          Femenino
        </button>
      </div>

      {/* BLOQUES POR POSICIÓN */}
      {Object.entries(grouped).map(([groupName, groupPlayers]) => (
        groupPlayers.length > 0 && (
          <div key={groupName} className="position-block">
            <h2 className="position-title">{groupName}</h2>
            <div className="table-wrapper">
              <table className="squad-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jugador</th>
                    <th>Posición</th>
                    <th>Nacionalidad</th>
                    <th onClick={() => handleSort("age")}>Edad</th>
                    <th onClick={() => handleSort("matches_played")}>PJ</th>
                    <th onClick={() => handleSort("goals")}>G</th>
                    <th onClick={() => handleSort("assists")}>A</th>
                    <th>Contrato</th>
                  </tr>
                </thead>

                <tbody>
                  {groupPlayers.map(player => (
                    <tr key={player.id}>

                      <td className="number">{player.number}</td>

                      <td className="player-cell">
                        <img src={player.photo_url} alt={player.name} />
                        {player.name}
                      </td>

                      <td>{player.position}</td>
                      <td className="nationality-cell">
                        <img
                          src={player.nationality_bd}
                          alt={player.nationality_name}
                          className="flag"
                        />
                        {player.nationality_name}
                      </td>
                      <td>{player.age}</td>
                      <td>{player.matches_played}</td>
                      <td>{player.goals}</td>
                      <td>{player.assists}</td>

                      <td className="contract">
                        {player.contract}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )
      ))}
    </div>
  );
}