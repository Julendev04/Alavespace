import ScoreAxisTable from "../components/ScoreAxisTable";
import React, { useRef, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "./Home.css";
import { FaFutbol, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const navigate = useNavigate();
  const videoScrollRef = useRef(null);

  const [openNews, setOpenNews] = useState(null);
  const [news, setNews] = useState([]);

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [results, setResults] = useState([]);

  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);

  // 🔥 NUEVO
  const [mainMatch, setMainMatch] = useState(null);
  const [matchStatus, setMatchStatus] = useState("countdown");
  const [timeLeft, setTimeLeft] = useState("");

  const competitions = [
  { name: "LALIGA EA SPORTS", img: "src/assets/Competiciones/IconoLiga.png", route: "/plantilla" },
  { name: "Segunda Federación", img: "src/assets/Competiciones/Icono2rfef.png", route: "/Filial" },
  { name: "Primera Federación Femenina", img: "src/assets/Competiciones/IconoFem.png", route: "/plantilla" }
];

  // ---------------- FETCHES ----------------

  useEffect(() => {
    fetchStandings();
    fetchMatches();
    fetchMainMatch();
  }, []);

  async function fetchStandings() {
    const { data } = await supabase
      .from("standings")
      .select("*")
      .order("position", { ascending: true });

    if (data) setStandings(data);
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select(`
        *,
        competitions (
          name,
          logo_url
        )
      `)
      .eq("status", "upcoming")
      .order("match_date", { ascending: true })
      .limit(5);

    if (data) setMatches(data);
  }

  // 🔥 HERO DINÁMICO
  async function fetchMainMatch() {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("matches")
    .select(`
      *,
      competitions (
        name,
        logo_url
      )
    `)
    .gte("match_date", now)
    .order("match_date", { ascending: true })
    .limit(1);

  if (data && data.length > 0) {
    setMainMatch(data[0]);
  }
}
  // ---------------- CONTADOR ----------------

  const matchDateTime = mainMatch ? new Date(mainMatch.match_date) : null;

  useEffect(() => {
    if (!matchDateTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = matchDateTime - now;

      if (diff > 0) {
        setMatchStatus("countdown");

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);

      } else {
        const matchEnd = new Date(matchDateTime.getTime() + 105 * 60000);

        if (now < matchEnd) {
          setMatchStatus("live");
        } else {
          setMatchStatus("finished");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchDateTime]);

  // ---------------- NEWS ----------------

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(20);

      if (data) setNews(data);
    };

    fetchNews();
  }, []);

  useEffect(() => {
    if (openNews) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [openNews]);

  // ---------------- BUSCADOR ----------------

  useEffect(() => {
    fetchJugadores();
  }, [search, teamFilter, positionFilter]);

  async function fetchJugadores() {
    if (!search && teamFilter === "all" && positionFilter === "all") {
      setResults([]);
      return;
    }

    let query = supabase.from("jugadores").select("*");

    if (search) query = query.ilike("name", `%${search}%`);
    if (teamFilter !== "all") query = query.eq("team_type", teamFilter);
    if (positionFilter !== "all") query = query.eq("position", positionFilter);

    const { data } = await query.limit(10);
    if (data) setResults(data);
  }

  // ---------------- UI ----------------

  return (
    <div className="home-page">

      {/* COMPETICIONES */}
      <section className="competitions-section">
        {competitions.map((comp, i) => (
          <div key={i} className="competition-circle" onClick={() => navigate(comp.route)}>
            <div className="circle-bg">
              <img src={comp.img} alt={comp.name} />
            </div>
          </div>
        ))}
      </section>

      {/* HERO */}
      <section className="home-hero">

        <div className="match-card1">
          <div className="match-bg"></div>

          <div className={`live-indicator ${matchStatus}`}>
            <span className="pulse"></span>
            {matchStatus === "countdown" && "Próximo Partido"}
            {matchStatus === "live" && "En directo"}
            {matchStatus === "finished" && "Finalizado"}
          </div>

          <div className="competition">
            <FaFutbol />
            <span>{mainMatch?.competitions?.name}</span>
          </div>

          <div className="teams">

            <div className="team-block">
              <img src={mainMatch?.home_logo} alt="" />
              <span>{mainMatch?.home_team}</span>
            </div>

            <div className="vs-center">

              {matchStatus === "countdown" && (
                <div className="match-status countdown">
                  ⏳ {timeLeft}
                </div>
              )}

              {matchStatus === "live" && (
                <div className="match-status live">
                  🔴 EN DIRECTO
                </div>
              )}

              {matchStatus === "finished" && (
                <div className="match-status finished">
                  {mainMatch?.home_team} {mainMatch?.home_score} - {mainMatch?.away_score} {mainMatch?.away_team}
                </div>
              )}

            </div>

            <div className="team-block">
              <img src={mainMatch?.away_logo} alt="" />
              <span>{mainMatch?.away_team}</span>
            </div>

          </div>

          <div className="details">
            <div>
              <FaCalendarAlt />
              {mainMatch && new Date(mainMatch.match_date).toLocaleDateString("es-ES")}
            </div>

            <div>
              <FaClock />
              {mainMatch && new Date(mainMatch.match_date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>

            <div>
              <FaMapMarkerAlt />
              {mainMatch?.stadium}
            </div>
          </div>
        </div>

        {/* NEWS */}
        <div className="news-scroll-wrapper">
          <div className="news-scroll">
            {news.map((item) => (
              <div key={item.id} className="news-card" onClick={() => setOpenNews(item)}>
                <div className="news-image">
                  <img src={item.image_url} alt={item.title} />
                </div>
                <div className="news-content">
                  <h4>{item.title}</h4>
                  <span>
                    {new Date(item.published_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long"
                    })} · {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {openNews && (
          <div className="news-overlay">
            <div className="news-modal">
              <button className="news-close" onClick={() => setOpenNews(null)}>✕</button>
              {openNews.category && <span className="news-category">{openNews.category}</span>}
              {openNews.image_url && <img src={openNews.image_url} className="news-overlay-image" />}
              <h2 className="news-overlay-title">{openNews.title}</h2>
              <span className="news-overlay-date">
                {new Date(openNews.published_at).toLocaleDateString("es-ES")}
              </span>
              <div className="news-overlay-text">
                <ReactMarkdown>{openNews.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* MEDIA */}
      <section className="media-section">
        <div className="media-wrapper">
          <div className="left-column">

            {/* 🔍 ENCICLOPEDIA */}
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
                {results.length > 0 ? (
                  <div className="search-results">
                    {results.map((player) => (
                      <div key={player.id} className="search-card">
                        {player.photo_url && <img src={player.photo_url} alt={player.name} />}
                        <div>
                          <h4>{player.name}</h4>
                          <span>{player.position} · {player.nationality_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">Introduce algún filtro para ver jugadores</div>
                )}
              </div>
            </div>
            {/* PROMOS */}
            <div className="promo-stack">

              <div className="promo-card">
                <img src="src/assets/SLIDE1.jpg" alt="promo1" />
              </div>

              <div className="promo-card">
                <img src="src/assets/SLIDE2.jpg" alt="promo2" />
              </div>
            </div>
          </div>
          {/* DERECHA - CLASIFICACIÓN */}
          <div className="right-column">
            <div className="standings-box">
              <h2>Clasificación</h2>

              <div className="standings-table">

                {/* HEADER */}
                <div className="standing-row header">
                  <span className="col pos">#</span>
                  <span className="col team">Equipo</span>
                  <span className="col">PJ</span>
                  <span className="col">G</span>
                  <span className="col">E</span>
                  <span className="col">P</span>
                  <span className="col">GF</span>
                  <span className="col">GC</span>
                  <span className="col">DG</span>
                  <span className="col pts">Pts</span>
                </div>

                {/* FILAS */}
                {standings.map((team) => (
                  <div key={team.id} className="standing-row">

                    <span className="col pos">{team.position}</span>
                    <div className="col team">
                      <div className="team-info">
                        <img src={team.team_logo} />
                        <span>{team.team_name}</span>
                      </div>
                    </div>

                    <span className="col">{team.played}</span>
                    <span className="col">{team.wins}</span>
                    <span className="col">{team.draws}</span>
                    <span className="col">{team.losses}</span>
                    <span className="col">{team.goals_for}</span>
                    <span className="col">{team.goals_against}</span>
                    <span className="col">{team.goal_diff}</span>

                    <span className="col pts">{team.points}</span>

                  </div>
                ))}

              </div>
            </div>
            {/* 🔥 CALENDARIO FULL WIDTH */}
            <div className="matches-calendar full-width">
              <h2>Próximos partidos</h2>

              <div className="matches-grid">
                {matches.map((match) => (
                  <div key={match.id} className="match-card-mini">

                    {/* COMPETICION */}
                    {match.competitions && (
                      <div className="match-competition">
                        <img
                          src={match.competitions.logo_url}
                          alt={match.competitions.name}
                        />
                        <span>{match.competitions.name}</span>
                      </div>
                    )}

                    {/* EQUIPOS */}
                    <span className="match-teams">
                      Jornada {match.week}: {match.home_team} vs {match.away_team}
                    </span>

                    {/* FECHA + HORA */}
                    <span className="match-datetime">
                      {new Date(match.match_date).toLocaleDateString()} ·{" "}
                      {new Date(match.match_date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 🔥 MEJORAS WEB */}
      <section className="updates-section">
        <div className="updates-container">
          <h2>Mejoras en la web</h2>

          <div className="updates-table">
            {/* HEADER */}
            <div className="updates-row header">
              <span className="col date">Fecha</span>
              <span className="col update">Actualización</span>
            </div>

            {/* FILAS */}
            <div className="updates-row">
              <span className="col date">07/04/2026</span>
              <span className="col update">
                Nueva sección de enciclopedia de jugadores con filtros avanzados y mejora de rendimiento.
              </span>
            </div>

            <div className="updates-row">
              <span className="col date">05/04/2026</span>
              <span className="col update">
                Rediseño completo del módulo de próximos partidos con datos en tiempo real.
              </span>
            </div>

            <div className="updates-row">
              <span className="col date">02/04/2026</span>
              <span className="col update">
                Optimización del sistema de noticias y nuevo visor en overlay con Markdown.
              </span>
            </div>

            <div className="updates-row">
              <span className="col date">30/03/2026</span>
              <span className="col update">
                Mejora de rendimiento general y ajustes visuales en dispositivos móviles.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}