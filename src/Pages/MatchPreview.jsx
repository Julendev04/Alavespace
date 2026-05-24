import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Gauge, MapPin, Trophy } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import homePlayer from "../assets/Plantilla/sivera.png";
import awayPlayer from "../assets/Plantilla/boye.png";
import "./MatchPreview.css";

function teamSeed(name = "") {
  return [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildTeamStats(name, side) {
  const seed = teamSeed(name) + (side === "home" ? 13 : 31);
  return {
    conceded: 22 + (seed % 15),
    scored: 24 + ((seed * 3) % 18),
    shots: 104 + ((seed * 5) % 58),
    cleanSheets: 5 + ((seed * 7) % 9),
    possession: 42 + ((seed * 11) % 18),
  };
}

function comparisonRows(homeStats, awayStats) {
  return [
    ["Goles encajados", homeStats.conceded, awayStats.conceded],
    ["Goles provocados", homeStats.scored, awayStats.scored],
    ["Tiros totales", homeStats.shots, awayStats.shots],
    ["Porterias a cero", homeStats.cleanSheets, awayStats.cleanSheets],
    ["Posesion media", `${homeStats.possession}%`, `${awayStats.possession}%`],
  ];
}

export default function MatchPreview() {
  const { id } = useParams();
  const location = useLocation();
  const [match, setMatch] = useState(location.state?.match || null);
  const [loading, setLoading] = useState(!location.state?.match);

  useEffect(() => {
    if (match || !id) return;

    async function loadMatch() {
      setLoading(true);
      const { data } = await supabase
        .from("matches")
        .select("*, competitions(name, logo_url)")
        .eq("id", id)
        .single();

      setMatch(data || null);
      setLoading(false);
    }

    loadMatch();
  }, [id, match]);

  const matchDate = match?.match_date ? new Date(match.match_date) : null;

  const homeStats = useMemo(() => buildTeamStats(match?.home_team, "home"), [match?.home_team]);
  const awayStats = useMemo(() => buildTeamStats(match?.away_team, "away"), [match?.away_team]);
  const rows = useMemo(() => comparisonRows(homeStats, awayStats), [homeStats, awayStats]);

  if (loading) {
    return (
      <main className="match-preview-page">
        <div className="match-preview-loading">Cargando previa...</div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="match-preview-page">
        <div className="match-preview-loading">No se ha encontrado el partido.</div>
      </main>
    );
  }

  return (
    <main className="match-preview-page">
      <div className="match-preview-bg" aria-hidden="true" />

      <section className="match-arena">
        <div className="match-preview-top">
          <Link className="match-back-link" to="/home">
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        <div className="match-comparison-stage">
          <img className="side-player side-player-home" src={homePlayer} alt="" />
          <img className="side-player side-player-away" src={awayPlayer} alt="" />

          <div className="team-side team-side-home">
            <div className="team-title-row">
              <img src={match.home_logo} alt="" />
              <div>
                <span>Local</span>
                <h1>{match.home_team}</h1>
              </div>
            </div>
          </div>

          <section className="comparison-core" aria-label="Comparacion entre equipos">
            <div className="comparison-title">
              <span>Match preview</span>
              <strong>VS</strong>
              <p>
                {matchDate
                  ? matchDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                  : "--"}
              </p>
            </div>

            <div className="comparison-table">
              {rows.map(([label, homeValue, awayValue]) => (
                <div className="comparison-row" key={label}>
                  <strong>{homeValue}</strong>
                  <span>{label}</span>
                  <strong>{awayValue}</strong>
                </div>
              ))}
            </div>
          </section>

          <div className="team-side team-side-away">
            <div className="team-title-row">
              <img src={match.away_logo} alt="" />
              <div>
                <span>Visitante</span>
                <h1>{match.away_team}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="match-footer-info">
          <div className="match-preview-competition">
            <Trophy size={16} />
            <span>{match.competitions?.name || "Competicion"} · Jornada {match.week || "-"}</span>
          </div>

          <div className="match-intel-row">
            <div className="match-intel-item">
              <CalendarDays size={18} />
              <span>Fecha</span>
              <strong>
                {matchDate
                  ? matchDate.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })
                  : "-"}
              </strong>
            </div>

            <div className="match-intel-item">
              <Gauge size={18} />
              <span>Hora</span>
              <strong>
                {matchDate
                  ? matchDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                  : "-"}
              </strong>
            </div>

            <div className="match-intel-item">
              <MapPin size={18} />
              <span>Estadio</span>
              <strong>{match.stadium || "Por confirmar"}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
