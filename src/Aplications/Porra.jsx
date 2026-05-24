import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useRef } from "react";
import "./Porra.css";
import { FaCheckCircle, FaChessKnight, FaEye, FaInfo, FaMagic, FaUser } from "react-icons/fa";

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
  const OUR_TEAM = "Deportivo Alavés";
  const myRowRef = useRef(null);
  const displayRanking =
    fakeRanking.length > 0
      ? [...fakeRanking, ...ranking]
      : ranking;

  function getOpponent(match) {
    if (!match) return null;

    const isHome = match.home_team === OUR_TEAM;

    return {
      name: isHome ? match.away_team : match.home_team,
      logo: isHome ? match.away_logo : match.home_logo,
    };
  }

  function getMatchPickStatus(match) {
    if (!match) return "Partido";
    if (match.status === "finished") return "Porra cerrada";

    const now = new Date();
    return new Date(match.match_date) > now ? "Prediccion abierta" : "En juego";
  }

  async function fetchMisPredicciones() {
    const { data } = await supabase
      .from("porra_predictions")
      .select(`
      *,
      match:match_id (*)
    `)
      .eq("user_id", userId);

    const enriched = await Promise.all(
      (data || []).map(async (p) => {
        const { data: detalle } = await supabase.rpc(
          "calcular_puntos_pro_detalle",
          { pred_id: p.id }
        );

        return {
          ...p,
          detalle: detalle
        };
      })
    );

    setMisPredicciones(enriched);
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
      const tableContainer = document.querySelector(".table-scroll");

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
    }));

    setFakeRanking(fakeUsers);
  }

  // Fetches
  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*, competitions(name, logo_url)")
      .order("match_date", { ascending: true })
      .limit(10);

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
    const { data, error } = await supabase
      .from("ranking")
      .select("*")
      .order("puntos", { ascending: false });

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
      {activeMatch && (
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
            <div className="porra-spell">
              <FaMagic />
              <span>{getMatchPickStatus(activeMatch)}</span>
              <FaChessKnight />
            </div>

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

      <div className="prediction-ranking-wrapper">

        {/* PREDICCIÓN */}
        <div className={`prediction-card ${timeLeft === "Cerrado" ? "disabled" : ""} ${prediccionHecha ? "prediction-locked" : ""}`}>
          <h2 className="titulo1">PRONOSTICA YA</h2>
          <h2 className="titulo2">ESTE PARTIDO</h2>

          {saveNotice && (
            <div className={`save-notice ${saveNotice.type}`} role="status">
              <FaCheckCircle />
              <div>
                <strong>{saveNotice.title}</strong>
                <span>{saveNotice.text}</span>
              </div>
            </div>
          )}

          {prediccionHecha && !saveNotice && (
            <div className="prediction-state-message" role="status">
              <FaCheckCircle />
              <span>Ya has hecho tu prediccion. Espera a los resultados finales para ver tus puntos.</span>
            </div>
          )}

          <div className="score-inputs">
            <label className="score-field">
              <span>{activeMatch?.home_team || "Alaves"}</span>
              <input type="number" value={golesA} onChange={e => setGolesA(e.target.value)} disabled={timeLeft === "Cerrado" || prediccionHecha} />
            </label>
            <span className="score-versus">VS</span>
            <label className="score-field">
              <span>{activeMatch?.away_team || "Rival"}</span>
              <input type="number" value={golesR} onChange={e => setGolesR(e.target.value)} disabled={timeLeft === "Cerrado" || prediccionHecha} />
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
          </div>

          <button className="btn-save" onClick={guardarPronostico} disabled={timeLeft === "Cerrado" || !userId || prediccionHecha}>
            {timeLeft === "Cerrado" || prediccionHecha ? "Pronóstico cerrado" : "Guardar pronóstico"}
          </button>

          <div className="info-btn" tabIndex="0" aria-label="Informacion de puntuacion">
            <FaInfo />
            <div className="info-tooltip" role="tooltip">
              <strong>Como se puntua</strong>
              <span>Acertar resultado, ganar o empatar, suma +1 punto.</span>
              <span>Cada goleador acertado suma +1 punto adicional.</span>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="table-container3 porra-ranking-table3">
          <button className="btn-me" onClick={scrollToMe}>
            <FaEye style={{ marginRight: "8px" }} />
            Encontrar mi posición
          </button>
          <div className="table-scroll">
            <table className="plantilla-table3">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {displayRanking.map((user, index) => (
                  <tr
                    key={user.id}
                    ref={user.id === userId ? myRowRef : null}
                    className={`player-row ${user.id === userId ? "me" : ""}`}
                  >
                    <td className="col-small bold">{index + 1}</td>
                    <td className="player-info col-player">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.nombre} />
                      ) : (
                        <span className="ranking-avatar-fallback" aria-hidden="true">
                          <FaUser />
                        </span>
                      )}
                      <span>{user.nombre}</span>
                    </td>
                    <td className="col-small bold">{user.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PRÓXIMOS PARTIDOS */}
      <div className="next-matches">
        <h2>Próximos partidos</h2>

        <div className="matches-scroll">
          {matches
            .filter(m => m.id !== activeMatch?.id && new Date(m.match_date) > new Date())
            .map(m => {
              return (
                <div key={m.id} className="match-card">

                  <div className="next-teams">
                    <img src={m.home_logo} alt={m.home_team} />
                    <span>vs</span>
                    <img src={m.away_logo} alt={m.away_team} />
                  </div>

                  <span>{m.home_team} - {m.away_team}</span>

                  <small>
                    {new Date(m.match_date).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short"
                    })}
                  </small>

                </div>
              );
            })}
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="history">
        <h2>Mis predicciones</h2>

        <div className="history-grid">
          {misPredicciones.map(p => (
            <div key={p.id} className="history-card-modern">

              {/* FILA PRINCIPAL */}
              <div className="history-row">

                <div className="history-left">
                  <span className="match-title">
                    {p.match?.home_team} vs {p.match?.away_team}
                  </span>

                  <span className="score">
                    {p.goles_alaves} - {p.goles_rival}
                  </span>

                  <span className="goleadores">
                    ⚽ {p.goleadores || "Sin goleadores"}
                  </span>
                </div>

                <div className="history-right">

                  {p.match?.status !== "finished" ? (

                    <div className="pending">
                      ⏳ Esperando resultados...
                    </div>

                  ) : (

                    <>
                      <div className="points-row">
                        <button
                          className="toggle-breakdown"
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
                          Ver desglose
                        </button>

                        <div className="total-points">
                          {p.detalle?.total ?? 0}
                        </div>
                      </div>

                      <div className="label">puntos</div>
                    </>

                  )}

                </div>

              </div>

              {/* DESGLOSE */}
              {p.open && p.detalle && (
                <div className="breakdown">
                  <span>✔ Resultado del partido: +{p.detalle.resultado}</span>
                  <span>🎯 Con marcador exacto: +{p.detalle.exacto}</span>
                  <span>⚽ Puntos por goleador: +{p.detalle.goleadores}</span>
                  <span>⏱ Bonus por anticipación: +{p.detalle.bonus}</span>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
