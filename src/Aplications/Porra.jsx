import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useRef } from "react";
import "./Porra.css";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaBullseye, FaCheckCircle, FaClipboardList, FaEye, FaFutbol, FaHome, FaHourglassHalf, FaPlane, FaTable, FaTrophy, FaUser, FaUsers } from "react-icons/fa";
import porraPrizeImage from "../assets/PubliPremio.jpg";

const jugadoresDisponibles = [
  { nombre: "Antonio Sivera" },
  { nombre: "Facundo Garcés" },
  { nombre: "Youssef Henríquez" },
  { nombre: "Denis Suárez" },
  { nombre: "Jon Pacheco" },
  { nombre: "Ander Guevara" },
  { nombre: "Ángel Perez" },
  { nombre: "Antonio Blanco" },
  { nombre: "Mariano Díaz" },
  { nombre: "Carles Aleñá" },
  { nombre: "Toni Martínez" },
  { nombre: "Raul Fernandez" },
  { nombre: "Nahuel Tenaglia" },
  { nombre: "Lucas Boyé" },
  { nombre: "Jonny Otto" },
  { nombre: "Jon Guridi" },
  { nombre: "Pablo Ibáñez" },
  { nombre: "Calebe Gonçalves" },
  { nombre: "Abde Rebbach" },
  { nombre: "Ibrahim Diabate" },
  { nombre: "Carlos Protesoni" },
  { nombre: "Victor Parada" }
];

const rankingMetrics = [
  {
    key: "exacto",
    label: "Resultados exactos",
    icon: FaBullseye,
    fields: ["exactos", "resultado_exacto", "resultados_exactos", "marcadores_exactos"]
  },
  {
    key: "goleadores",
    label: "Goleadores acertados",
    icon: FaFutbol,
    fields: ["goleadores_acertados", "aciertos_goleadores", "goleadores_ok"]
  },
  {
    key: "racha",
    label: "Jornadas puntuando",
    icon: FaTrophy,
    fields: ["jornadas_puntuando", "racha_puntos", "bonus"]
  }
];

const participationFields = ["participaciones", "predicciones", "jornadas_jugadas", "total_participaciones"];

const porraTabs = [
  { id: "pronostico", label: "Pronostico" },
  { id: "clasificacion", label: "Clasificacion" },
  { id: "partidos", label: "Partidos" },
  { id: "historial", label: "Mis predicciones" }
];

const porraPlaySteps = [
  {
    title: "Escoge tu partido",
    text: "Accede a la jornada disponible y prepara tu prediccion para el Glorioso.",
    icon: FaClipboardList
  },
  {
    title: "Haz tu pronostico",
    text: "Elige marcador y goleadores antes de que arranque el encuentro.",
    icon: FaUser
  },
  {
    title: "Suma puntos",
    text: "Resultado, exacto, goleadores y bonus cuentan para la clasificacion.",
    icon: FaBullseye
  },
  {
    title: "Escala en el ranking",
    text: "Compite jornada a jornada para terminar en lo mas alto de la tabla.",
    icon: FaTrophy
  }
];

function getMetricCount(user, fields) {
  const value = fields.map((field) => user?.[field]).find((item) => item !== undefined && item !== null);
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getMatchdayLabel(match, fallbackIndex) {
  const value =
    match?.jornada ??
    match?.matchday ??
    match?.round ??
    match?.week ??
    match?.fixture_round ??
    match?.match_week;

  if (value === undefined || value === null || value === "") {
    return `Jornada ${fallbackIndex + 1}`;
  }

  const label = String(value).trim();
  return label.toLowerCase().includes("jornada") ? label : `Jornada ${label}`;
}

function getMatchScore(match) {
  const homeScore = Number(match?.home_score);
  const awayScore = Number(match?.away_score);

  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    return null;
  }

  return { homeScore, awayScore };
}

function getAlavesOutcome(match) {
  const score = getMatchScore(match);
  if (!score) return null;

  const isAlavesHome = match?.home_team?.toLowerCase().includes("alav");
  const alavesGoals = isAlavesHome ? score.homeScore : score.awayScore;
  const rivalGoals = isAlavesHome ? score.awayScore : score.homeScore;

  if (alavesGoals > rivalGoals) return "win";
  if (alavesGoals < rivalGoals) return "loss";
  return "draw";
}

function getOutcomeLabel(outcome) {
  if (outcome === "win") return "Victoria";
  if (outcome === "loss") return "Derrota";
  return "Empate";
}

function normalizeScorerName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function splitScorers(value) {
  return String(value || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function calculatePredictionDetail(prediction) {
  const match = prediction?.match;
  const score = getMatchScore(match);
  const isFinished = match?.status === "finished" && !!score;

  if (!isFinished) {
    return {
      exacto: 0,
      goleadores: 0,
      bonus: 0,
      total: 0
    };
  }

  const isAlavesHome = match?.home_team?.toLowerCase().includes("alav");
  const realGolesAlaves = isAlavesHome ? score.homeScore : score.awayScore;
  const realGolesRival = isAlavesHome ? score.awayScore : score.homeScore;
  const exactos =
    Number(prediction?.goles_alaves) === realGolesAlaves &&
    Number(prediction?.goles_rival) === realGolesRival
      ? 1
      : 0;

  const realScorers = new Set(splitScorers(match?.scorers).map(normalizeScorerName));
  const guessedScorers = splitScorers(prediction?.goleadores);
  const goleadoresAcertados = guessedScorers.filter((name) => realScorers.has(normalizeScorerName(name))).length;

  const exactoPoints = exactos * 5;
  const goleadoresPoints = goleadoresAcertados * 2;
  const basePoints = exactoPoints + goleadoresPoints;
  const bonus = basePoints > 0 ? 1 : 0;

  return {
    exacto: exactoPoints,
    goleadores: goleadoresPoints,
    bonus,
    total: basePoints + bonus
  };
}

function PorraSectionTitle({ children }) {
  const titleRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={titleRef} className={`porra-section-title ${isVisible ? "is-visible" : ""}`}>
      <span className="porra-title-rule porra-title-rule-left" aria-hidden="true" />
      <h2>{children}</h2>
      <span className="porra-title-rule porra-title-rule-right" aria-hidden="true" />
    </div>
  );
}

export default function PorraAlaves() {
  const [matches, setMatches] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [fakeRanking, setFakeRanking] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);

  const [golesA, setGolesA] = useState("");
  const [golesR, setGolesR] = useState("");
  const [goleadoresInput, setGoleadoresInput] = useState("");
  const [goleadoresSeleccionados, setGoleadoresSeleccionados] = useState([]);
  const [jugadoresFiltrados, setJugadoresFiltrados] = useState([]);

  const [timeLeft, setTimeLeft] = useState("");
  const [misPredicciones, setMisPredicciones] = useState([]);
  const [prediccionHecha, setPrediccionHecha] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("pronostico");
  const [selectedMatchResults, setSelectedMatchResults] = useState(null);
  const [matchResultsLoading, setMatchResultsLoading] = useState(false);
  const myRowRef = useRef(null);
  const displayRanking =
    fakeRanking.length > 0
      ? [...fakeRanking, ...ranking]
      : ranking;
  const porraTimelineMatches = matches;
  const currentPorraMatchId = porraTimelineMatches.find(match => match.status !== "finished")?.id;
  const porraCompetition = matches.find(match => match.competitions)?.competitions;

  function getOpponent(match) {
    if (!match) return null;

    const isHome = match.home_team?.toLowerCase().includes("alav");

    return {
      name: isHome ? match.away_team : match.home_team,
      logo: isHome ? match.away_logo : match.home_logo,
    };
  }

  async function fetchMisPredicciones() {
    const { data } = await supabase
      .from("porra_predictions")
      .select(`
      *,
      match:match_id (*)
    `)
      .eq("user_id", userId);

    const enriched = (data || []).map((p) => ({
      ...p,
      detalle: calculatePredictionDetail(p)
    }));

    setMisPredicciones(enriched);
  }

  async function openMatchResults(match) {
    if (!match) return;

    if (selectedMatchResults?.match?.id === match.id) {
      setSelectedMatchResults(null);
      setMatchResultsLoading(false);
      return;
    }

    setSelectedMatchResults({ match, rows: [] });
    setMatchResultsLoading(true);

    const { data, error } = await supabase
      .from("porra_predictions")
      .select("*")
      .eq("match_id", match.id);

    if (error) {
      console.error(error);
      setMatchResultsLoading(false);
      return;
    }

    const predictions = data || [];
    const userIds = [...new Set(predictions.map((prediction) => prediction.user_id).filter(Boolean))];
    let usersById = new Map();

    if (userIds.length) {
      const { data: users } = await supabase
        .from("porra_users")
        .select("id, nombre, avatar")
        .in("id", userIds);

      usersById = new Map((users || []).map((user) => [user.id, user]));
    }

    const rows = predictions
      .map((prediction) => {
        const user = usersById.get(prediction.user_id);
        const detail = calculatePredictionDetail({ ...prediction, match });

        return {
          ...prediction,
          user,
          detail,
          participantName: user?.nombre || "Usuario",
          participantAvatar: user?.avatar || null
        };
      })
      .sort((a, b) => (b.detail?.total || 0) - (a.detail?.total || 0));

    setSelectedMatchResults({ match, rows });
    setMatchResultsLoading(false);
  }

  // Obtener usuario
  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) return console.error(error);
      if (data?.user) {
        setUserId(data.user.id);
      }
    }
    getUser();
  }, []);

  // Fetch inicial
  useEffect(() => {
    async function init() {
      await fetchMatches();
      await fetchRanking(); // 🔥 IMPORTANTE
    }

    init();
  }, []);

  // Fetch predicciones propias
  useEffect(() => {
    if (userId) fetchMisPredicciones();
  }, [userId]);

  useEffect(() => {
    if (!saveNotice) return undefined;

    const timeout = setTimeout(() => setSaveNotice(null), 4200);
    return () => clearTimeout(timeout);
  }, [saveNotice]);

  // Filtrar goleadores
  useEffect(() => {
    const filtro = jugadoresDisponibles.filter(
      j =>
        j.nombre.toLowerCase().includes(goleadoresInput.toLowerCase()) &&
        !goleadoresSeleccionados.some(sel => sel.nombre === j.nombre)
    );
    setJugadoresFiltrados(filtro);
  }, [goleadoresInput, goleadoresSeleccionados]);

  // Contador
  useEffect(() => {
    if (!activeMatch) return;

    const interval = setInterval(() => {
      const now = new Date();
      const matchDate = new Date(activeMatch.match_date);
      const diff = matchDate - now;

      if (diff <= 0) {
        setTimeLeft("Cerrado");
        clearInterval(interval);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMatch]);

  // Comprobar si ya hay predicción para el partido activo
  useEffect(() => {
    if (userId && activeMatch) {
      async function checkPrediccionExistente() {
        const { data } = await supabase
          .from("porra_predictions")
          .select("*")
          .eq("user_id", userId)
          .eq("match_id", activeMatch.id)
          .maybeSingle();
        setPrediccionHecha(!!data);
        if (data) {
          setGolesA(data.goles_alaves ?? "");
          setGolesR(data.goles_rival ?? "");
          setGoleadoresSeleccionados(
            data.goleadores
              ? data.goleadores.split(", ").map(nombre => ({ nombre }))
              : []
          );
        } else {
          setGolesA("");
          setGolesR("");
          setGoleadoresSeleccionados([]);
        }
      }
      checkPrediccionExistente();
    }
  }, [userId, activeMatch]);


  function scrollToMe() {
    if (myRowRef.current) {
      const tableContainer = document.querySelector(".porra-ranking-table3 .table-scroll");

      if (tableContainer) {
        const row = myRowRef.current;

        const offsetTop =
          row.offsetTop - tableContainer.offsetHeight / 2 + row.offsetHeight / 2;

        tableContainer.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    }
  }

  function generateFakeUsers(count = 100) {
    const fakeUsers = Array.from({ length: count }).map((_, i) => ({
      id: `fake-${i}`,
      nombre: `Jugador ${i + 1}`,
      puntos: Math.floor(Math.random() * 300),
      avatar: null,
      exactos: Math.floor(Math.random() * 8),
      goleadores_acertados: Math.floor(Math.random() * 14),
      jornadas_puntuando: Math.floor(Math.random() * 10),
      participaciones: Math.floor(Math.random() * 18),
    }));

    setFakeRanking(fakeUsers);
  }

  // Fetches
  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*, competitions!inner(name, logo_url)")
      .ilike("competitions.name", "%laliga%")
      .order("match_date", { ascending: true })
      .limit(20);

    setMatches(data || []);

    if (!data || data.length === 0) return;

    const now = new Date();
    const liveMatch = data.find(match => {
      const start = new Date(match.match_date);
      const end = new Date(start.getTime() + 30 * 1000);
      return now >= start && now < end && match.status !== "finished";
    });

    const nextMatch = data.find(match =>
      new Date(match.match_date) > now && match.status === "upcoming"
    );

    setActiveMatch(liveMatch || nextMatch || data[0]);
  }

  async function fetchRanking() {
    let { data, error } = await supabase
      .from("porra_ranking_view")
      .select("*")
      .order("puntos", { ascending: false });

    if (error) {
      const fallback = await supabase
        .from("ranking")
        .select("*")
        .order("puntos", { ascending: false });

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error(error);
      return;
    }

    const rows = data || [];
    const ids = rows.map((item) => item.id).filter(Boolean);

    if (!ids.length) {
      setRanking(rows);
      return;
    }

    const { data: users } = await supabase
      .from("porra_users")
      .select("id, avatar, nombre")
      .in("id", ids);

    const usersById = new Map((users || []).map((user) => [user.id, user]));

    setRanking(
      rows.map((row) => {
        const user = usersById.get(row.id);
        return {
          ...row,
          avatar: row.avatar || user?.avatar || null,
          nombre: row.nombre || user?.nombre || "Usuario"
        };
      })
    );
  }
  // Goleadores
  function agregarGoleador(jugador) {
    setGoleadoresSeleccionados([...goleadoresSeleccionados, jugador]);
    setGoleadoresInput("");
  }
  function eliminarGoleador(jugador) {
    setGoleadoresSeleccionados(
      goleadoresSeleccionados.filter(j => j.nombre !== jugador.nombre)
    );
  }

  function adjustScore(side, amount) {
    const setter = side === "home" ? setGolesA : setGolesR;
    const currentValue = side === "home" ? golesA : golesR;
    const nextValue = Math.max(0, Number(currentValue || 0) + amount);

    setter(String(nextValue));
  }

  // Guardar pronóstico
  async function guardarPronostico() {
    if (!activeMatch) {
      setSaveNotice({ type: "error", title: "Partido no disponible", text: "No hay partido activo para guardar el pronostico." });
      return;
    }
    if (!userId) {
      setSaveNotice({ type: "error", title: "Sesion no cargada", text: "Espera unos segundos y vuelve a intentarlo." });
      return;
    }

    // Validar que userId exista en porra_users
    const { data: userCheck } = await supabase
      .from("porra_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!userCheck) {
      setSaveNotice({ type: "error", title: "Registro incompleto", text: "Tu usuario no aparece en la porra. Vuelve a registrarte para participar." });
      return;
    }

    // Buscar predicción existente
    const { data: existing, error: fetchError } = await supabase
      .from("porra_predictions")
      .select("*")
      .eq("user_id", userId)
      .eq("match_id", activeMatch.id)
      .maybeSingle();
    if (fetchError) {
      setSaveNotice({ type: "error", title: "No se pudo comprobar", text: "Ha habido un problema revisando tu prediccion previa." });
      return;
    }

    let error;
    if (existing) {
      const res = await supabase
        .from("porra_predictions")
        .update({
          goles_alaves: parseInt(golesA),
          goles_rival: parseInt(golesR),
          goleadores: goleadoresSeleccionados.map(j => j.nombre).join(", ")
        })
        .eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from("porra_predictions")
        .insert({
          user_id: userId,
          match_id: activeMatch.id,
          goles_alaves: parseInt(golesA),
          goles_rival: parseInt(golesR),
          goleadores: goleadoresSeleccionados.map(j => j.nombre).join(", ")
        });
      error = res.error;
    }

    if (error) {
      console.error(error);
      setSaveNotice({ type: "error", title: "No se pudo guardar", text: "Revisa tu conexion y vuelve a intentarlo." });
    } else {
      setSaveNotice({
        type: "success",
        title: existing ? "Pronostico actualizado" : "Pronostico registrado",
        text: `${activeMatch.home_team} ${golesA || 0} - ${golesR || 0} ${activeMatch.away_team}. Tu prediccion queda sellada en la Porra Alavesfera.`
      });

      await fetchMisPredicciones();
      setPrediccionHecha(true);
      await fetchRanking();
    }

  }

  return (
    <div className="porra-page">
      {/* HERO */}
      {false && activeMatch && (
        <div className="hero-match">
          <div className="magic-particles" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index}></span>
            ))}
          </div>
          <div className="porra-hero-orb left"></div>
          <div className="porra-hero-orb right"></div>

          {/* HOME */}
          <div className="escudo home-crest">
            <img src={activeMatch.home_logo} alt={activeMatch.home_team} />
          </div>

          <div className="match-banner">
            <h2>
              {activeMatch.home_team} vs {activeMatch.away_team}
            </h2>

            <div className="countdown">
              El oraculo se cierra en <strong>{timeLeft}</strong>
            </div>
          </div>

          {/* AWAY */}
          <div className="escudo away-crest">
            <img src={activeMatch.away_logo} alt={activeMatch.away_team} />
          </div>

        </div>
      )}

      <section className="porra-intro" aria-labelledby="porra-intro-title">
        <h1 id="porra-intro-title">LaLiga que se juega entre aficionados como tu</h1>
        <p>Haz tu pronostico cada jornada, compite con otros alavesistas y demuestra cuanto sabes del Glorioso.</p>
      </section>

      <div className="porra-main-grid">
      <section className="porra-tabs-shell" aria-label="Secciones de la porra">
        <div className="porra-tabs" role="tablist" aria-label="Secciones de la porra">
          {porraTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`porra-tab-panel porra-tab-panel-${activeTab}`} role="tabpanel">
      {activeTab === "pronostico" && (
      <section className="porra-prediction-section">
        <PorraSectionTitle>Haz tu porra</PorraSectionTitle>

        {/* PREDICCIÓN */}
        <div className={`prediction-card ${timeLeft === "Cerrado" ? "disabled" : ""} ${prediccionHecha ? "prediction-locked" : ""}`}>
          <div className="prediction-form-panel">
            <div className="prediction-form-copy">
              <span>Formulario de la jornada</span>
              <p>Marca el resultado y elige goleadores antes de que arranque el partido.</p>
            </div>

          <div className="prediction-entry-row">
          <div className="score-inputs">
            <label className="score-field">
              <span>{activeMatch?.home_team || "Alaves"}</span>
              <div className={`porra-score-stepper ${golesA !== "" ? "has-score" : ""}`}>
                <button
                  type="button"
                  aria-label="Bajar goles del equipo local"
                  disabled={timeLeft === "Cerrado" || prediccionHecha || Number(golesA || 0) <= 0}
                  onClick={() => adjustScore("home", -1)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <span>{golesA || "0"}</span>
                <button
                  type="button"
                  aria-label="Subir goles del equipo local"
                  disabled={timeLeft === "Cerrado" || prediccionHecha}
                  onClick={() => adjustScore("home", 1)}
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
              </div>
            </label>
            <span className="score-versus">VS</span>
            <label className="score-field">
              <span>{activeMatch?.away_team || "Rival"}</span>
              <div className={`porra-score-stepper ${golesR !== "" ? "has-score" : ""}`}>
                <button
                  type="button"
                  aria-label="Bajar goles del equipo visitante"
                  disabled={timeLeft === "Cerrado" || prediccionHecha || Number(golesR || 0) <= 0}
                  onClick={() => adjustScore("away", -1)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <span>{golesR || "0"}</span>
                <button
                  type="button"
                  aria-label="Subir goles del equipo visitante"
                  disabled={timeLeft === "Cerrado" || prediccionHecha}
                  onClick={() => adjustScore("away", 1)}
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
              </div>
            </label>
          </div>

          <div className="goleadores-autocomplete">
            <span className="field-label">Goleadores del Glorioso</span>
            <div className="tags">
              {goleadoresSeleccionados.map(j => (
                <span className="tag" key={j.nombre}>
                  {j.nombre} <button onClick={() => eliminarGoleador(j)} disabled={prediccionHecha}>×</button>
                </span>
              ))}
              <input
                value={goleadoresInput}
                onChange={e => setGoleadoresInput(e.target.value)}
                placeholder="Busca goleadores"
                disabled={timeLeft === "Cerrado" || prediccionHecha}
              />
            </div>

            {goleadoresInput !== "" && jugadoresFiltrados.length > 0 && (
              <div className="suggestions">
                {jugadoresFiltrados.map(j => (
                  <div key={j.nombre} className="suggestion" onClick={() => agregarGoleador(j)}>
                    {j.nombre}
                  </div>
                ))}
              </div>
            )}

            {goleadoresSeleccionados.length > 0 && (
              <div className="selected-scorers">
                <FaFutbol />
                <span>{goleadoresSeleccionados.map(j => j.nombre).join(", ")}</span>
              </div>
            )}
          </div>
          </div>

          <button className="btn-save" onClick={guardarPronostico} disabled={timeLeft === "Cerrado" || !userId || prediccionHecha}>
            {timeLeft === "Cerrado" || prediccionHecha ? "Pronóstico cerrado" : "Guardar pronóstico"}
          </button>

          {activeMatch && (
            <aside className="porra-match-tag" aria-label="Partido activo">
              <span className="porra-match-tag-shield porra-match-tag-shield-home">
                <img src={activeMatch.home_logo} alt={activeMatch.home_team} />
              </span>

              <span className="porra-match-tag-countdown">
                <small>Cierre en:</small>
                <strong>{timeLeft}</strong>
              </span>

              <span className="porra-match-tag-shield porra-match-tag-shield-rival">
                <img src={activeMatch.away_logo} alt={activeMatch.away_team} />
              </span>
            </aside>
          )}

        </div>

          <aside className="porra-prize-panel" aria-label="Premio de la porra">
            <img src={porraPrizeImage} alt="Premio de la porra" />
          </aside>

          {prediccionHecha && (
            <div className="prediction-locked-overlay" role="status">
              <div className="prediction-locked-message">
                <FaCheckCircle />
                <strong>{saveNotice?.title || "Pronostico enviado"}</strong>
                <span>{saveNotice?.text || "Tu prediccion queda guardada. Podras ver tus puntos cuando termine el partido."}</span>
                <button
                  type="button"
                  className="prediction-edit-button"
                  onClick={() => {
                    setPrediccionHecha(false);
                    setSaveNotice(null);
                  }}
                  disabled={timeLeft === "Cerrado"}
                >
                  Editar pronostico
                </button>
              </div>
            </div>
          )}
        </div>

      </section>
      )}

      {activeTab === "clasificacion" && (
      <section className="porra-ranking-section">
        {/* TABLA */}
        <PorraSectionTitle>Clasificación</PorraSectionTitle>

        <div className="table-container3 porra-ranking-table3 porra-ranking-original">
          <button className="btn-me" onClick={scrollToMe}>
            <FaEye style={{ marginRight: "8px" }} />
            Encontrar mi posición
          </button>
          <div className="table-scroll">
            <table className="plantilla-table3">
              <thead>
                <tr>
                  <th className="rank-position-heading">
                    <button className="btn-me btn-me-table" onClick={scrollToMe} title="Encontrar mi posicion" aria-label="Encontrar mi posicion">
                      <FaEye />
                    </button>
                  </th>
                  <th className="ranking-user-heading">Usuario</th>
                  <th className="points-heading">Puntos</th>
                  <th className="participation-heading" title="Participaciones">
                    Partidos
                  </th>
                  {rankingMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <th key={metric.key} className={`metric-heading metric-${metric.key}`} title={metric.label}>
                        <Icon />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayRanking.map((user, index) => (
                  <tr
                    key={user.id}
                    ref={user.id === userId ? myRowRef : null}
                    className={`player-row ${user.id === userId ? "me" : ""}`}
                  >
                    <td className="col-small bold rank-position-cell">{index + 1}</td>
                    <td className="player-info col-player ranking-user-cell">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.nombre} />
                      ) : (
                        <span className="ranking-avatar-fallback" aria-hidden="true">
                          <FaUser />
                        </span>
                      )}
                      <span>{user.nombre}</span>
                    </td>
                    <td className="col-small bold points-cell">{user.puntos}</td>
                    <td className="participation-cell" title="Participaciones">
                      {getMetricCount(user, participationFields)}
                    </td>
                    {rankingMetrics.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <td key={metric.key} className={`metric-cell metric-${metric.key}`} title={metric.label}>
                          <Icon />
                          <span>{getMetricCount(user, metric.fields)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="porra-scoring-strip" aria-label="Criterios de puntuacion">
          <span><strong>+5</strong> resultado exacto</span>
          <span><strong>+1</strong> cada goleador acertado</span>
          <span><strong>+1</strong> regularidad por puntuar una nueva jornada</span>
        </div>
      </section>

      )}

      {activeTab === "partidos" && (
      <div className="next-matches">
        <PorraSectionTitle>Próximos partidos</PorraSectionTitle>

        {porraCompetition && (
          <div className="porra-competition-badge" aria-label="Competicion">
            {porraCompetition.logo_url && <img src={porraCompetition.logo_url} alt="" aria-hidden="true" />}
            <span>{porraCompetition.name}</span>
          </div>
        )}

        <div className="matches-carousel" aria-label="Proximos partidos">
          <div className="matches-scroll">
            {porraTimelineMatches.map((m, index) => {
              const opponent = getOpponent(m);
              const isPlayed = m.status === "finished" && getMatchScore(m);
              const isCurrentMatch = !isPlayed && m.id === currentPorraMatchId;
              return (
                <div key={m.id} className={`match-card ${isPlayed ? "match-card-played" : ""} ${isCurrentMatch ? "match-card-current" : ""}`}>
                  {isPlayed && (
                    <button
                      type="button"
                      className="match-results-corner"
                      title="Ver resultados de la jornada"
                      aria-label="Ver resultados de la jornada"
                      onClick={(event) => {
                        event.stopPropagation();
                        openMatchResults(m);
                      }}
                    >
                      <FaTable />
                    </button>
                  )}
                  <span className="match-card-crest-row">
                    <img src={opponent?.logo} alt={opponent?.name || "Rival"} />
                  </span>
                  <span>{opponent?.name || "Rival"}</span>
                  <small className="match-card-date-row">
                    <MatchSideIcon side={m.match_side} />
                    <span>
                      {new Date(m.match_date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short"
                      })}
                    </span>
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        {selectedMatchResults && (
          <div className="porra-match-results-panel">
            <div className="porra-match-results-header">
              <div className="porra-results-title-block">
                {!matchResultsLoading && (
                  <div className="porra-results-participants">
                    <FaUsers aria-hidden="true" />
                    <span>Participantes</span>
                    <strong>{selectedMatchResults.rows.length}</strong>
                  </div>
                )}
                <h3>Puntuaciones de la {getMatchdayLabel(selectedMatchResults.match, 0).toLowerCase()}</h3>
              </div>
              <div className="porra-results-actions">
                <button
                  type="button"
                  className="porra-results-close"
                  onClick={() => setSelectedMatchResults(null)}
                  aria-label="Cerrar puntuaciones de la jornada"
                  title="Cerrar"
                >
                  ×
                </button>
                <div className="porra-results-score-card" aria-label="Resultado del partido">
                  <span className="porra-results-team porra-results-team-home">
                    {selectedMatchResults.match.home_logo ? (
                      <img src={selectedMatchResults.match.home_logo} alt="" aria-hidden="true" />
                    ) : (
                      <span>{selectedMatchResults.match.home_team?.slice(0, 1)}</span>
                    )}
                  </span>
                  <strong>
                    {getMatchScore(selectedMatchResults.match)
                      ? `${getMatchScore(selectedMatchResults.match).homeScore} - ${getMatchScore(selectedMatchResults.match).awayScore}`
                      : "-"}
                  </strong>
                  <span className="porra-results-team porra-results-team-away">
                    {selectedMatchResults.match.away_logo ? (
                      <img src={selectedMatchResults.match.away_logo} alt="" aria-hidden="true" />
                    ) : (
                      <span>{selectedMatchResults.match.away_team?.slice(0, 1)}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {matchResultsLoading ? (
              <div className="porra-results-empty">Cargando resultados...</div>
            ) : selectedMatchResults.rows.length === 0 ? (
              <div className="porra-results-empty">Aun no hay predicciones registradas para este partido.</div>
            ) : (
              <>
                <div className="porra-results-table" role="table" aria-label="Resultados de participantes">
                  <div className="porra-results-row porra-results-head" role="row">
                    <span>Usuario</span>
                    <span>Aciertos</span>
                    <span>Pts</span>
                  </div>
                  {selectedMatchResults.rows.map((row) => (
                    <div key={row.id} className="porra-results-row" role="row">
                      <span className="porra-results-user">
                        {row.participantAvatar ? (
                          <img src={row.participantAvatar} alt="" aria-hidden="true" />
                        ) : (
                          <span className="porra-results-avatar-fallback" aria-hidden="true">
                            <FaUser />
                          </span>
                        )}
                        <span>{row.participantName}</span>
                      </span>
                      <span className="porra-results-hits">
                        {row.detail?.exacto > 0 && <FaBullseye className="hit-exacto" title="Resultado exacto" />}
                        {row.detail?.goleadores > 0 && <FaFutbol className="hit-goleadores" title="Goleadores acertados" />}
                        {row.detail?.bonus > 0 && <FaTrophy className="hit-bonus" title="Regularidad" />}
                        {(row.detail?.total || 0) === 0 && <span className="porra-results-no-hit">Sin puntos</span>}
                      </span>
                      <strong>{row.detail?.total || 0}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      )}

      {activeTab === "historial" && (
      <section className="porra-dashboard">

      {/* HISTORIAL */}
      <div className="history">
        <PorraSectionTitle>Mis predicciones</PorraSectionTitle>

        <div className="history-table-classic">
          {misPredicciones.length === 0 ? (
            <div className="empty-predictions empty-predictions-simple">
              <strong>No has realizado hasta el momento ni una prediccion</strong>
            </div>
          ) : (
            <>
              <div className="history-table-row history-table-head">
                <span>Partido</span>
                <span>Marcador</span>
                <span>Goleadores</span>
                <span>Estado</span>
                <span>Pts</span>
              </div>
              {misPredicciones.map(p => {
                const isFinished = p.match?.status === "finished";
                const totalPoints = p.detalle?.total ?? 0;

                return (
                  <React.Fragment key={p.id}>
                    <div className="history-table-row history-table-body-row">
                      <span className="history-table-match">
                        {p.match?.home_team} vs {p.match?.away_team}
                      </span>
                      <span className="history-table-score" aria-label="Marcador pronosticado">
                        <strong>{p.goles_alaves ?? 0}</strong>
                        <small>-</small>
                        <strong>{p.goles_rival ?? 0}</strong>
                      </span>
                      <span className="history-table-scorers">
                        <FaFutbol aria-hidden="true" />
                        <span>{p.goleadores || "Sin goleadores"}</span>
                      </span>
                      <span className="history-table-status">
                        {!isFinished ? (
                          <>
                            <FaHourglassHalf aria-hidden="true" />
                            <span>Pendiente</span>
                          </>
                        ) : (
                          <button
                            className="history-table-breakdown"
                            onClick={() => {
                              setMisPredicciones(prev =>
                                prev.map(item =>
                                  item.id === p.id
                                    ? { ...item, open: !item.open }
                                    : item
                                )
                              );
                            }}
                          >
                            {p.open ? "Ocultar" : "Desglose"}
                          </button>
                        )}
                      </span>
                      <strong className="history-table-points">{isFinished ? totalPoints : "-"}</strong>
                    </div>

                    {p.open && p.detalle && (
                      <div className="history-table-breakdown-row">
                        <span className="history-breakdown-exacto">
                          <FaBullseye aria-hidden="true" />
                          Marcador exacto: +{p.detalle.exacto}
                        </span>
                        <span className="history-breakdown-goleadores">
                          <FaFutbol aria-hidden="true" />
                          Goleadores: +{p.detalle.goleadores}
                        </span>
                        <span className="history-breakdown-bonus">
                          <FaTrophy aria-hidden="true" />
                          Bonus por puntuar: +{p.detalle.bonus}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      </div>
      </section>

      )}

        </div>
      </section>
      </div>

      <section className="porra-play-guide" aria-labelledby="porra-play-guide-title">
        <div className="porra-play-guide-heading">
          <h2 id="porra-play-guide-title">Juega a la Porra</h2>
          <p>Podras participar en cada partido y competir con el resto de la comunidad.</p>
        </div>

        <div className="porra-play-guide-grid">
          {porraPlaySteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article className="porra-play-step" key={step.title}>
                <div className={`porra-play-illustration porra-play-illustration-${index + 1}`} aria-hidden="true">
                  <span className="porra-play-shape porra-play-shape-back" />
                  <span className="porra-play-shape porra-play-shape-front" />
                  <Icon />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MatchSideIcon({ side }) {
  const isAway = String(side || "").toUpperCase() === "VISITANTE";
  const Icon = isAway ? FaPlane : FaHome;
  const label = isAway ? "Visitante" : "Local";

  return (
    <span className="porra-match-side-icon" aria-label={label} title={label}>
      <Icon aria-hidden="true" />
    </span>
  );
}
