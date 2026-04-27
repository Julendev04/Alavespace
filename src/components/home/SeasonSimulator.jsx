import React from "react";

export default function SeasonSimulator({
  showSimulator,
  setShowSimulator,
  simulatedFixtures,
  simulatedStandings,
  updateScore,
  getTeamName
}) {

  if (!showSimulator) return null;

  return (

    <div className="simulator-overlay">

      <div className="simulator-modal">

        <button
          className="close-btn"
          onClick={() => setShowSimulator(false)}
        >
          ✕
        </button>

        <h2>Simulador de temporada</h2>

        <div className="simulator-layout">

          <div className="fixtures-column">

            {simulatedFixtures.map(match => (

              <div key={match.id} className="fixture-row">

                <span>{getTeamName(match.home_team)}</span>

                <input
                  type="number"
                  min="0"
                  value={match.home_goals ?? ""}
                  onChange={(e) =>
                    updateScore(match.id, "home", e.target.value)
                  }
                />

                <span>-</span>

                <input
                  type="number"
                  min="0"
                  value={match.away_goals ?? ""}
                  onChange={(e) =>
                    updateScore(match.id, "away", e.target.value)
                  }
                />

                <span>{getTeamName(match.away_team)}</span>

              </div>

            ))}

          </div>

          <div className="standings-column">

            <table>

              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>Pts</th>
                </tr>
              </thead>

              <tbody>

                {simulatedStandings.map((team, i) => (

                  <tr key={team.team_id}>
                    <td>{i + 1}</td>
                    <td>{team.name}</td>
                    <td>{team.points}</td>
                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>

  );
}