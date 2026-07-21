import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Lock, UserRound } from "lucide-react";
import { FaClock, FaHome, FaPlane } from "react-icons/fa";
import { GiSoccerBall, GiSoccerField, GiSoccerKick } from "react-icons/gi";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./Plantilla.css";

const validTeams = ["first_team", "b_team", "women_team"];

const teamData = {
  first_team: {
    label: "Primer equipo",
    title: "Deportivo Alavés",
    code: "ALA"
  },
  b_team: {
    label: "Equipo B",
    title: "Miniglorias",
    code: "B"
  },
  women_team: {
    label: "Femenino",
    title: "Alavés Gloriosas",
    code: "FEM"
  }
};

const positionOrder = {
  Portero: 1,
  Defensa: 2,
  Mediocentro: 3,
  Extremo: 4,
  Delantero: 5
};

const teamMatchSections = {
  first_team: "first",
  b_team: "reserve",
  women_team: "female"
};

function getPortrait(player) {
  return player?.img_select || "";
}

function formatPlayerName(name = "") {
  return String(name)
    .toLocaleLowerCase("es-ES")
    .replace(/(^|\s|-)(\p{L})/gu, (match, separator, letter) => `${separator}${letter.toLocaleUpperCase("es-ES")}`);
}

function formatContract(value) {
  if (!value) return "Sin datos";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMarketValue(value) {
  if (value === undefined || value === null || value === "") return "--";
  const numberValue = Number(String(value).replace(",", "."));
  if (Number.isNaN(numberValue)) return value;
  return `${Number.isInteger(numberValue) ? numberValue : numberValue.toFixed(1)} M€`;
}

function formatMatchDate(value) {
  if (!value) return "Por confirmar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Por confirmar";

  const day = date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
}

function isAlavesName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("alaves");
}

function getRival(match) {
  const alavesIsHome = isAlavesName(match.home_team);

  return {
    name: alavesIsHome ? match.away_team : match.home_team,
    logo: alavesIsHome ? match.away_logo : match.home_logo
  };
}

function getCompetitionClass(match) {
  const competition = String(match.competitions?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (competition.includes("copa")) return "copa";
  if (competition.includes("amist")) return "friendly";
  if (competition.includes("laliga") || competition.includes("liga ea")) return "laliga";
  return "default";
}

function getMatchSide(match) {
  const savedSide = String(match.match_side || "").toUpperCase();
  if (savedSide === "VISITANTE") return "away";
  if (savedSide === "LOCAL") return "home";
  return isAlavesName(match.away_team) ? "away" : "home";
}

function getPlayerStat(player, fields) {
  const value = fields.map((field) => player?.[field]).find((item) => item !== undefined && item !== null && item !== "");
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatStatNumber(value) {
  return Number(value || 0).toLocaleString("es-ES");
}

export default function Plantilla() {
  const [searchParams] = useSearchParams();
  const requestedTeam = searchParams.get("team");
  const [players, setPlayers] = useState([]);
  const [teamFilter, setTeamFilter] = useState(validTeams.includes(requestedTeam) ? requestedTeam : "first_team");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextMatches, setNextMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [performancePage, setPerformancePage] = useState(0);
  const [performanceRowsPerPage, setPerformanceRowsPerPage] = useState(8);

  useEffect(() => {
    if (validTeams.includes(requestedTeam) && requestedTeam !== teamFilter) {
      setTeamFilter(requestedTeam);
    }
  }, [requestedTeam, teamFilter]);

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);

      const { data, error } = await supabase
        .from("jugadores")
        .select("*")
        .eq("team_type", teamFilter);

      if (error) {
        setPlayers([]);
        setSelectedPlayer(null);
        setLoading(false);
        return;
      }

      const sortedPlayers = [...(data || [])].sort((first, second) => {
        const positionDifference = (positionOrder[first.position] || 99) - (positionOrder[second.position] || 99);
        if (positionDifference !== 0) return positionDifference;
        return (Number(first.number) || 99) - (Number(second.number) || 99);
      });

      setPlayers(sortedPlayers);
      setSelectedPlayer(null);
      setLoading(false);
    }

    fetchPlayers();
  }, [teamFilter]);

  useEffect(() => {
    setPerformancePage(0);
  }, [teamFilter, performanceRowsPerPage]);

  useEffect(() => {
    async function fetchNextMatches() {
      setMatchesLoading(true);

      const { data, error } = await supabase
        .from("matches")
        .select("id,home_team,away_team,home_logo,away_logo,match_date,week,team_section,match_side,competitions(name,logo_url)")
        .eq("team_section", teamMatchSections[teamFilter])
        .gte("match_date", new Date().toISOString())
        .order("match_date", { ascending: true })
        .limit(4);

      if (error) {
        setNextMatches([]);
        setMatchesLoading(false);
        return;
      }

      setNextMatches(data || []);
      setMatchesLoading(false);
    }

    fetchNextMatches();
  }, [teamFilter]);

  function selectPlayer(player) {
    setSelectedPlayer(player);
  }

  const team = teamData[teamFilter];
  const performancePlayers = [...players]
    .sort((first, second) => (
      getPlayerStat(second, ["minutes", "minutes_played"]) - getPlayerStat(first, ["minutes", "minutes_played"]) ||
      getPlayerStat(second, ["goals"]) - getPlayerStat(first, ["goals"]) ||
      getPlayerStat(second, ["assists"]) - getPlayerStat(first, ["assists"]) ||
      getPlayerStat(second, ["matches_played", "matches"]) - getPlayerStat(first, ["matches_played", "matches"])
    ));
  const performanceTotalPages = Math.max(1, Math.ceil(performancePlayers.length / performanceRowsPerPage));
  const safePerformancePage = Math.min(performancePage, performanceTotalPages - 1);
  const performanceStart = safePerformancePage * performanceRowsPerPage;
  const performanceEnd = Math.min(performanceStart + performanceRowsPerPage, performancePlayers.length);
  const visiblePerformancePlayers = performancePlayers.slice(performanceStart, performanceEnd);

  return (
    <main className={`squad-select-page squad-theme-${teamFilter}`}>
      <section className="squad-select-layout">
        <section className="squad-roster-panel" aria-label={`Plantilla de ${team.title}`}>
          <div className="squad-roster-heading">
            <div>
              <h2>Plantilla</h2>
            </div>
          </div>

          {loading ? (
            <div className="squad-select-status">Cargando plantilla...</div>
          ) : players.length === 0 ? (
            <div className="squad-select-status">No hay jugadores en esta categoria.</div>
          ) : (
            <div className="squad-roster-table-wrap">
              <table className="squad-roster-table">
                <colgroup>
                  <col className="squad-col-photo" />
                  <col className="squad-col-number" />
                  <col className="squad-col-player" />
                  <col className="squad-col-position" />
                  <col className="squad-col-foot" />
                  <col className="squad-col-height" />
                  <col className="squad-col-nationality" />
                  <col className="squad-col-age" />
                  <col className="squad-col-contract" />
                  <col className="squad-col-value" />
                  <col className="squad-col-status" />
                </colgroup>
                <thead>
                  <tr>
                    <th aria-label="Foto"></th>
                    <th>#</th>
                    <th>Jugador</th>
                    <th>Posicion</th>
                    <th>Pie</th>
                    <th>Altura</th>
                    <th>Nacionalidad</th>
                    <th>Edad</th>
                    <th>Contrato</th>
                    <th>Valor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => {
                    const playerPortrait = getPortrait(player);
                    const isSelected = selectedPlayer?.id === player.id;

                    return (
                      <tr
                        key={player.id}
                        className={isSelected ? "selected" : ""}
                        onClick={() => selectPlayer(player)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectPlayer(player);
                          }
                        }}
                      >
                        <td>
                          <span className="squad-table-photo">
                            {playerPortrait ? (
                              <img src={playerPortrait} alt="" loading="lazy" />
                            ) : (
                              <UserRound aria-hidden="true" />
                            )}
                          </span>
                        </td>
                        <td className="squad-table-number">{player.number || "--"}</td>
                        <td className="squad-table-player-name"><strong>{formatPlayerName(player.name)}</strong></td>
                        <td>{player.position || "Jugador"}</td>
                        <td>{player.pie || player.foot || player.preferred_foot || "--"}</td>
                        <td className="squad-table-height">{player.altura || player.height || player.height_cm || "--"}</td>
                        <td>
                          <span className="squad-table-nationality">
                            {player.nationality_bd && <img src={player.nationality_bd} alt="" />}
                            {player.nationality_name || "Sin datos"}
                          </span>
                        </td>
                        <td>{player.age || "--"}</td>
                        <td>{formatContract(player.contract)}</td>
                        <td className="squad-table-market-value">{formatMarketValue(player.market_value)}</td>
                        <td className="squad-table-status">
                          {player.estado || player.status || player.player_status || <Lock aria-label="Sin estado" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="squad-next-matches" aria-label={`Proximos partidos de ${team.title}`}>
          <h3 className="squad-sidebar-title">Proximos partidos</h3>
          <div className="squad-next-matches-head">
            <CalendarDays aria-hidden="true" />
            <div>
              <span>Calendario</span>
              <h3>Próximos partidos</h3>
            </div>
          </div>

          {matchesLoading ? (
            <div className="squad-next-matches-empty">Cargando partidos...</div>
          ) : nextMatches.length === 0 ? (
            <div className="squad-next-matches-empty">No hay partidos programados.</div>
          ) : (
            <div className="squad-next-matches-list">
              {nextMatches.map((match) => {
                const matchDate = formatMatchDate(match.match_date);
                const rival = getRival(match);
                const SideIcon = getMatchSide(match) === "away" ? FaPlane : FaHome;

                return (
                  <article className={`squad-next-match squad-next-match-${getCompetitionClass(match)}`} key={match.id}>
                    <div className="squad-next-match-rival">
                      <span>
                        {rival.logo && <img src={rival.logo} alt="" loading="lazy" />}
                      </span>
                    </div>
                    <div className="squad-next-match-date">
                      <SideIcon aria-hidden="true" />
                      <span>{matchDate}</span>
                    </div>
                    <div className="squad-next-match-competition">
                      {match.competitions?.logo_url && <img src={match.competitions.logo_url} alt="" loading="lazy" />}
                      {match.week ? <span>J{match.week}</span> : <span>Próximo</span>}
                      {match.competitions?.name && <small>{match.competitions.name}</small>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section className="squad-performance-card" aria-label={`Rendimiento de ${team.title}`}>
            <h3>Rendimiento de jugadores</h3>
            <table className="squad-performance-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>
                    <span className="squad-performance-head-icon" title="Minutos" aria-label="Minutos">
                      <FaClock aria-hidden="true" />
                    </span>
                  </th>
                  <th>
                    <span className="squad-performance-head-icon" title="Goles" aria-label="Goles">
                      <GiSoccerBall aria-hidden="true" />
                    </span>
                  </th>
                  <th>
                    <span className="squad-performance-head-icon" title="Asistencias" aria-label="Asistencias">
                      <GiSoccerKick aria-hidden="true" />
                    </span>
                  </th>
                  <th>
                    <span className="squad-performance-head-icon" title="Partidos" aria-label="Partidos">
                      <GiSoccerField aria-hidden="true" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiblePerformancePlayers.map((player) => (
                  <tr key={`performance-${player.id}`}>
                    <td>{formatPlayerName(player.name)}</td>
                    <td>{formatStatNumber(getPlayerStat(player, ["minutes", "minutes_played"]))}</td>
                    <td>{getPlayerStat(player, ["goals"])}</td>
                    <td>{getPlayerStat(player, ["assists"])}</td>
                    <td>{getPlayerStat(player, ["matches_played", "matches"])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="squad-performance-pagination" aria-label="Paginacion de rendimiento">
              <label>
                <span>Items per page:</span>
                <select
                  value={performanceRowsPerPage}
                  onChange={(event) => setPerformanceRowsPerPage(Number(event.target.value))}
                >
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </label>
              <span className="squad-performance-range">
                {performancePlayers.length === 0 ? "0 de 0" : `${performanceStart + 1} - ${performanceEnd} de ${performancePlayers.length}`}
              </span>
              <div className="squad-performance-pager-buttons">
                <button
                  type="button"
                  onClick={() => setPerformancePage(0)}
                  disabled={safePerformancePage === 0}
                  aria-label="Primera pagina"
                >
                  <ChevronsLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPerformancePage((current) => Math.max(0, current - 1))}
                  disabled={safePerformancePage === 0}
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPerformancePage((current) => Math.min(performanceTotalPages - 1, current + 1))}
                  disabled={safePerformancePage >= performanceTotalPages - 1}
                  aria-label="Pagina siguiente"
                >
                  <ChevronRight aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPerformancePage(performanceTotalPages - 1)}
                  disabled={safePerformancePage >= performanceTotalPages - 1}
                  aria-label="Ultima pagina"
                >
                  <ChevronsRight aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </aside>

      </section>
    </main>
  );
}
