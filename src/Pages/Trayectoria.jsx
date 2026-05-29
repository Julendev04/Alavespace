import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./Trayectoria.css";

const tabs = [
  { id: "calendar", label: "Calendario" },
  { id: "results", label: "Resultados por mes" },
  { id: "standings", label: "Clasificación" }
];

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short"
  });
}

function hasScore(match) {
  return match.home_score != null && match.away_score != null;
}

function isAlaves(teamName = "") {
  return /alav[eé]s|deportivo alav[eé]s/i.test(teamName);
}

function getResultType(match) {
  if (!hasScore(match)) return "pending";

  const homeScore = Number(match.home_score);
  const awayScore = Number(match.away_score);

  if (homeScore === awayScore) return "draw";

  const alavesHome = isAlaves(match.home_team);
  const alavesAway = isAlaves(match.away_team);

  if (alavesHome) return homeScore > awayScore ? "win" : "loss";
  if (alavesAway) return awayScore > homeScore ? "win" : "loss";

  return "played";
}

function getCompetitionMeta(name = "") {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("copa")) {
    return { label: "Copa del Rey", className: "copa" };
  }

  if (normalized.includes("segunda")) {
    return { label: "Segunda Federación", className: "filial" };
  }

  if (normalized.includes("femenina") || normalized.includes("moeve")) {
    return { label: "LIGA F", className: "femenino" };
  }

  if (normalized.includes("laliga") || normalized.includes("liga ea")) {
    return { label: "LALIGA", className: "laliga" };
  }

  return { label: name || "Competición", className: "default" };
}

function getMatchLabel(match) {
  const competition = getCompetitionMeta(match.competitions?.name);
  const round = match.week ? `J${match.week}` : "Partido";

  return { ...competition, round };
}

function getCalendarDays(activeMonthKey) {
  const [year, month] = activeMonthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < leadingEmptyDays; i += 1) {
    const date = new Date(year, month - 1, i - leadingEmptyDays + 1);
    days.push({ date, currentMonth: false });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push({ date: new Date(year, month - 1, day), currentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - leadingEmptyDays - lastDay.getDate() + 1;
    days.push({ date: new Date(year, month, nextDay), currentMonth: false });
  }

  return days;
}

function getStandingZone(position) {
  if (position <= 5) return "zone-blue";
  if (position === 6) return "zone-orange";
  if (position === 7 || position === 8) return "zone-green";
  if (position >= 18) return "zone-red";
  return "";
}

export default function Trayectoria() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "calendar"
  );
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [activeMonth, setActiveMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrajectoryData() {
      setLoading(true);

      const [{ data: matchesData }, { data: standingsData }] = await Promise.all([
        supabase
          .from("matches")
          .select("*, competitions(name, logo_url)")
          .order("match_date", { ascending: true }),
        supabase
          .from("standings")
          .select("*")
          .order("position", { ascending: true })
      ]);

      setMatches(matchesData || []);
      setStandings(standingsData || []);
      setLoading(false);
    }

    loadTrajectoryData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const months = useMemo(() => {
    const keys = [...new Set(matches.map((match) => monthKey(match.match_date)))];
    return keys.length ? keys : [monthKey(new Date())];
  }, [matches]);

  useEffect(() => {
    if (activeMonth || months.length === 0) return;

    const currentMonth = monthKey(new Date());
    setActiveMonth(months.includes(currentMonth) ? currentMonth : months[0]);
  }, [activeMonth, months]);

  const matchesByMonth = useMemo(() => {
    return matches.reduce((acc, match) => {
      const key = monthKey(match.match_date);
      acc[key] = acc[key] || [];
      acc[key].push(match);
      return acc;
    }, {});
  }, [matches]);

  const playedMonths = useMemo(() => {
    return months
      .map((key) => ({
        key,
        matches: (matchesByMonth[key] || []).filter(hasScore)
      }))
      .filter((group) => group.matches.length > 0)
      .reverse();
  }, [matchesByMonth, months]);

  const calendarDays = activeMonth ? getCalendarDays(activeMonth) : [];
  const activeMonthIndex = months.indexOf(activeMonth);

  function changeMonth(direction) {
    const nextIndex = activeMonthIndex + direction;
    if (nextIndex < 0 || nextIndex >= months.length) return;
    setActiveMonth(months[nextIndex]);
  }

  function monthlyRecord(monthMatches) {
    return monthMatches.reduce(
      (record, match) => {
        const result = getResultType(match);
        if (result === "win") record.wins += 1;
        if (result === "draw") record.draws += 1;
        if (result === "loss") record.losses += 1;
        return record;
      },
      { wins: 0, draws: 0, losses: 0 }
    );
  }

  return (
    <main className="trajectory-page">
      <section className="trajectory-header">
        <span>Temporada 2025/26</span>
        <h1>Trayectoria</h1>
      </section>

      <nav className="trajectory-tabs" aria-label="Secciones de trayectoria">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="trajectory-loading">Cargando trayectoria...</div>
      ) : (
        <>
          {activeTab === "calendar" && (
            <section className="trajectory-card">
              <div className="calendar-toolbar">
                <button type="button" onClick={() => changeMonth(-1)} disabled={activeMonthIndex <= 0}>
                  <ChevronLeft size={26} />
                  <span>Anterior</span>
                </button>
                <h2>{activeMonth ? monthLabel(activeMonth) : ""}</h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  disabled={activeMonthIndex === months.length - 1}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={26} />
                </button>
              </div>

              <div className="month-calendar">
                {weekDays.map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}

                {calendarDays.map((calendarDay, index) => {
                  const dayMatches = matches.filter(
                    (match) => new Date(match.match_date).toDateString() === calendarDay.date.toDateString()
                  );

                  return (
                    <div
                      key={`${activeMonth}-${index}`}
                      className={`calendar-day ${calendarDay.currentMonth ? "" : "muted"}`}
                    >
                      <span className="calendar-day-number">{calendarDay.date.getDate()}</span>

                      <div className="calendar-match-list">
                        {dayMatches.map((match) => {
                          const matchLabel = getMatchLabel(match);

                          return (
                            <div
                              key={match.id}
                              className={`calendar-match competition-${matchLabel.className}`}
                              title={matchLabel.label}
                            >
                              <span className="calendar-match-round">{matchLabel.round}</span>
                              {match.competitions?.logo_url && (
                                <img src={match.competitions.logo_url} alt="" loading="lazy" />
                              )}
                              <strong>{matchLabel.label}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="calendar-legend" aria-label="Leyenda de competiciones y eventos">
                <h3>Leyenda de las competiciones y eventos</h3>
                <div className="calendar-legend-items">
                  <span><i className="competition-laliga"></i>LaLiga EA Sports</span>
                  <span><i className="competition-copa"></i>Copa del Rey</span>
                  <span><i className="competition-filial"></i>Segunda Federación</span>
                  <span><i className="competition-femenino"></i>Liga Femenina Moeve</span>
                  <span><i className="competition-default"></i>Otros eventos</span>
                </div>
              </div>
            </section>
          )}

          {activeTab === "results" && (
            <section className="trajectory-results">
              {playedMonths.length === 0 ? (
                <div className="trajectory-empty">Todavía no hay resultados registrados.</div>
              ) : (
                playedMonths.map((group) => {
                  const record = monthlyRecord(group.matches);

                  return (
                    <article key={group.key} className="result-month-card">
                      <header>
                        <h2>{monthLabel(group.key)}</h2>
                        <div className="month-record">
                          <span>{record.wins}V</span>
                          <span>{record.draws}E</span>
                          <span>{record.losses}D</span>
                        </div>
                      </header>

                      <div className="result-list">
                        {group.matches.map((match) => (
                          <div key={match.id} className="result-row">
                            <span className="result-date">{formatShortDate(match.match_date)}</span>
                            <span className="result-team">{match.home_team}</span>
                            <strong>{match.home_score} - {match.away_score}</strong>
                            <span className="result-team">{match.away_team}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          )}

          {activeTab === "standings" && (
            <section className="trajectory-card standings-card">
              <div className="trajectory-standings">
                <div className="trajectory-standing-row header">
                  <span></span>
                  <span>Equipo</span>
                  <span>PJ</span>
                  <span>PG</span>
                  <span>PE</span>
                  <span>PP</span>
                  <span>GF</span>
                  <span>GC</span>
                  <span>DG</span>
                  <span>Pts</span>
                </div>

                {standings.map((team) => (
                  <div
                    key={team.id}
                    className={`trajectory-standing-row ${getStandingZone(team.position)}`}
                  >
                    <span>{team.position}</span>
                    <span className="trajectory-team">
                      {team.team_logo && <img src={team.team_logo} alt="" loading="lazy" />}
                      <span>{team.team_name}</span>
                    </span>
                    <span>{team.played}</span>
                    <span>{team.wins}</span>
                    <span>{team.draws}</span>
                    <span>{team.losses}</span>
                    <span>{team.goals_for}</span>
                    <span>{team.goals_against}</span>
                    <span>{team.goal_diff}</span>
                    <strong>{team.points}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
