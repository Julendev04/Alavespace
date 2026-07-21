import React, { useMemo, useRef, useState, useEffect } from "react";
import "./Notas.css";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

export default function VotingPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const [jugadores, setJugadores] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [jornadaActual, setJornadaActual] = useState(null);
  const [notas, setNotas] = useState({});

  const [votosGenerales, setVotosGenerales] = useState({});
  const [votosRanking, setVotosRanking] = useState([]);
  const [rankingPeriod, setRankingPeriod] = useState("season");
  const [rankingMinVotes, setRankingMinVotes] = useState("1");
  const [seasonCarouselIndex, setSeasonCarouselIndex] = useState(0);
  const [seasonCarouselMotion, setSeasonCarouselMotion] = useState({ direction: "next", step: 0 });
  const [generalJornadaId, setGeneralJornadaId] = useState("");
  const [misVotos, setMisVotos] = useState({});
  const [userId, setUserId] = useState(null);
  const [jornadaMenuOpen, setJornadaMenuOpen] = useState(false);
  const [jornadaDraft, setJornadaDraft] = useState({ partido: "", fecha: "" });

  const [plantilla, setPlantilla] = useState([]);

  const [loading, setLoading] = useState(true);

  const [votantesCount, setVotantesCount] = useState(0);
  const generalTableRef = useRef(null);

  useEffect(() => {
    const rawDate = jornadaActual?.fecha || "";
    setJornadaDraft({
      partido: jornadaActual?.partido || "",
      fecha: rawDate ? String(rawDate).slice(0, 10) : "",
    });
  }, [jornadaActual]);

  // 🔹 OBTENER USUARIO
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUserId(data.user.id);

        // 🔥 CONSULTA A PROFILES
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (!error && profile?.role === "admin") {
          setIsAdmin(true);
        }
      }
    };

    getUser();
  }, []);

  // 🔹 CARGAR JORNADAS
  useEffect(() => {
    fetchJornadas();
    fetchPlantilla();
  }, []);

  useEffect(() => {
    fetchVotosRanking();
  }, []);

  useEffect(() => {
    if (!overlayOpen) return;

    const table = generalTableRef.current;
    if (!table) return;

    table.scrollLeft = 0;

    const startDelay = window.setTimeout(() => {
      const maxScroll = table.scrollWidth - table.clientWidth;
      if (maxScroll <= 0) return;

      const duration = Math.max(9000, maxScroll * 32);
      const start = performance.now();

      function animate(now) {
        const progress = Math.min((now - start) / duration, 1);
        table.scrollLeft = maxScroll * progress;

        if (progress < 1 && generalTableRef.current) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }, 450);

    return () => window.clearTimeout(startDelay);
  }, [overlayOpen, jornadas.length]);

  const fetchVotantesCount = async (jornadaId) => {
    const { data, error } = await supabase
      .from("votos")
      .select("user_id")
      .eq("jornada_id", jornadaId);

    if (!error && data) {
      const uniqueUsers = new Set(data.map((v) => v.user_id));
      setVotantesCount(uniqueUsers.size);
    } else {
      setVotantesCount(0);
    }
  };
  const fetchPlantilla = async () => {
    const { data, error } = await supabase
      .from("jugadores")
      .select("*")
      .eq("team_type", "first_team")
      .order("name", { ascending: true });

    if (!error && data) {
      setPlantilla(data);
    }
  };

  const fetchJornadas = async () => {
    const { data, error } = await supabase
      .from("jornadas")
      .select("*")
      .order("numero", { ascending: false });

    if (!error && data) {
      setJornadas(data);

      if (data.length > 0) {
        setJornadaActual(data[0]);
        setGeneralJornadaId((current) => data.some((jornada) => jornada.id === current) ? current : data[0].id);
        fetchConvocados(data[0].id);
        fetchVotantesCount(data[0].id);
      } else {
        setJornadaActual(null);
        setGeneralJornadaId("");
        setJugadores([]);
        setVotantesCount(0);
      }

      setLoading(false); // 🔥 AQUÍ
    }
  };

  // 🔹 CARGAR CONVOCADOS
  const fetchConvocados = async (jornadaId) => {
    const { data, error } = await supabase
      .from("convocatorias")
      .select("jugador_id, jugadores(id, name, card_url)")
      .eq("jornada_id", jornadaId);

    if (!error && data) {
      const jugadoresConvocados = data
        .map((row) => row.jugadores)
        .filter(Boolean);

      setJugadores(jugadoresConvocados);
      setNotas({});

      if (userId) {
        fetchMisVotos(jornadaId, userId);
      }
    }
  };

  // 🔹 MIS VOTOS (para bloquear inputs)
  const fetchMisVotos = async (jornadaId, userId) => {
    const { data } = await supabase
      .from("votos")
      .select("jugador_id, nota")
      .eq("jornada_id", jornadaId)
      .eq("user_id", userId);

    const votosMap = {};
    data?.forEach((v) => {
      votosMap[v.jugador_id] = v.nota; // 🔥 guardamos la nota
    });

    setMisVotos(votosMap);
  };

  // 🔹 VOTOS GENERALES (overlay)
  const fetchVotosGenerales = async () => {
    const { data, error } = await supabase
      .from("votos")
      .select("jugador_id, jornada_id, nota");

    if (!error && data) {
      const votosMap = {};

      data.forEach((v) => {
        const nota = Number(v.nota);
        if (!Number.isFinite(nota)) return;

        if (!votosMap[v.jugador_id]) {
          votosMap[v.jugador_id] = {};
        }

        if (!votosMap[v.jugador_id][v.jornada_id]) {
          votosMap[v.jugador_id][v.jornada_id] = {
            total: 0,
            count: 0,
          };
        }

        votosMap[v.jugador_id][v.jornada_id].total += nota;
        votosMap[v.jugador_id][v.jornada_id].count += 1;
      });

      // 🔥 calcular medias + media total
      const mediasMap = {};
      const mediaTotalMap = {};
      const countsMap = {};

      Object.keys(votosMap).forEach((jugadorId) => {
        mediasMap[jugadorId] = {};
        countsMap[jugadorId] = {};

        let totalGlobal = 0;
        let countGlobal = 0;

        Object.keys(votosMap[jugadorId]).forEach((jornadaId) => {
          const { total, count } = votosMap[jugadorId][jornadaId];

          const media = total / count;

          mediasMap[jugadorId][jornadaId] = media.toFixed(1);
          countsMap[jugadorId][jornadaId] = count;

          totalGlobal += total;
          countGlobal += count;
        });

        mediaTotalMap[jugadorId] =
          countGlobal > 0 ? (totalGlobal / countGlobal).toFixed(2) : "-";
      });

      // 🔥 guardamos TODO junto
      setVotosGenerales({
        medias: mediasMap,
        counts: countsMap,
        totales: mediaTotalMap,
      });
    }
  };

  const fetchVotosRanking = async () => {
    const { data, error } = await supabase
      .from("votos")
      .select("jugador_id, jornada_id, nota");

    if (!error && data) {
      setVotosRanking(data);
    }
  };

  // 🔹 CAMBIAR NOTA
  const adjustNota = (jugadorId, direction) => {
    setNotas((current) => {
      const rawValue = current[jugadorId];
      const currentValue = rawValue === "" || rawValue === undefined ? 0 : Number(rawValue);
      const nextValue = Math.min(10, Math.max(0, currentValue + direction));

      return {
        ...current,
        [jugadorId]: String(nextValue),
      };
    });
  };

  // 🔹 ENVIAR VOTOS
  const enviarVotos = async () => {
    if (!jornadaActual || !userId) return;

    const votosArray = Object.entries(notas)
      .filter(([_, nota]) => nota !== "")
      .map(([jugador_id, nota]) => ({
        jornada_id: jornadaActual.id,
        jugador_id,
        user_id: userId,
        nota: parseFloat(nota),
      }));

    if (votosArray.length === 0) return;

    const { error } = await supabase
      .from("votos")
      .upsert(votosArray, {
        onConflict: ["user_id", "jornada_id", "jugador_id"],
      });

    if (!error) {
      alert("✅ Votos guardados");

      // 🔥 refresca bloqueo
      fetchMisVotos(jornadaActual.id, userId);
      fetchVotantesCount(jornadaActual.id);
      fetchVotosRanking();
    } else {
      console.log(error);
    }
  };

  // 🔹 CAMBIAR JORNADA
  const handleJornadaChange = (e) => {
    const nuevaJornada = jornadas.find(
      (j) => j.id === e.target.value
    );

    setJornadaActual(nuevaJornada);

    if (nuevaJornada) {
      fetchConvocados(nuevaJornada.id);
      fetchVotantesCount(nuevaJornada.id);
    }

  };

  const actualizarJornada = async (campo, valor) => {
    if (!isAdmin || !jornadaActual || jornadaActual[campo] === valor) return;

    const { error } = await supabase
      .from("jornadas")
      .update({ [campo]: valor })
      .eq("id", jornadaActual.id);

    if (!error) {
      setJornadaActual((current) => current ? { ...current, [campo]: valor } : current);
      setJornadas((current) => current.map((jornada) =>
        jornada.id === jornadaActual.id ? { ...jornada, [campo]: valor } : jornada
      ));
    }
  };

  const crearJornada = async () => {
    const nuevaNumero = (jornadas[0]?.numero || 0) + 1;

    const { error } = await supabase
      .from("jornadas")
      .insert([
        {
          numero: nuevaNumero,
          partido: "Nuevo partido",
          fecha: new Date().toISOString(),
        },
      ]);

    if (!error) {
      setJornadaMenuOpen(false);
      fetchJornadas();
    }
  };

  const eliminarJornada = async () => {
    if (!isAdmin || !jornadaActual) return;

    const confirmed = window.confirm(
      `¿Eliminar la Jornada ${jornadaActual.numero}? También se borrarán su convocatoria y sus votos.`
    );
    if (!confirmed) return;

    const { error: votosError } = await supabase
      .from("votos")
      .delete()
      .eq("jornada_id", jornadaActual.id);

    if (votosError) {
      window.alert("No se pudieron eliminar los votos de la jornada.");
      return;
    }

    const { error: convocatoriaError } = await supabase
      .from("convocatorias")
      .delete()
      .eq("jornada_id", jornadaActual.id);

    if (convocatoriaError) {
      window.alert("No se pudo eliminar la convocatoria de la jornada.");
      return;
    }

    const { error } = await supabase
      .from("jornadas")
      .delete()
      .eq("id", jornadaActual.id);

    if (error) {
      window.alert("No se pudo eliminar la jornada.");
      return;
    }

    setJornadaMenuOpen(false);
    await fetchJornadas();
    fetchVotosRanking();
  };

  const añadirConvocado = async (jugadorId) => {
    if (!jugadorId || !jornadaActual) return;

    await supabase.from("convocatorias").insert([
      {
        jornada_id: jornadaActual.id,
        jugador_id: jugadorId,
      },
    ]);

    fetchConvocados(jornadaActual.id);
  };

  const eliminarConvocado = async (jugadorId) => {
    const { error } = await supabase
      .from("convocatorias")
      .delete()
      .eq("jugador_id", jugadorId) // ✅ string UUID correcto
      .eq("jornada_id", jornadaActual.id);

    if (error) {
      console.log(error); // 🔥 IMPORTANTE para debug
    }

    fetchConvocados(jornadaActual.id);
  };

  if (false && loading) {
    return (
      <div className="loading-screen">
        <div className="loader-wrapper">

          <div className="spinner-ring"></div>

          <img
            src="src/assets/Branding/logo2.png" // 👈 pon aquí tu ruta real
            alt="Logo"
            className="loader-logo"
          />

        </div>
      </div>
    );
  }
  const plantillaOrdenada = [...plantilla].sort((a, b) => {
    const mediaA = parseFloat(votosGenerales.totales?.[a.id]) || 0;
    const mediaB = parseFloat(votosGenerales.totales?.[b.id]) || 0;

    return mediaB - mediaA; // de mayor a menor
  });

  const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long" });

  const rankingPeriodOptions = useMemo(() => {
    const monthMap = new Map();

    jornadas.forEach((jornada) => {
      if (!jornada.fecha) return;
      const date = new Date(jornada.fecha);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = monthFormatter.format(date);

      if (!monthMap.has(key)) {
        monthMap.set(key, label.charAt(0).toUpperCase() + label.slice(1));
      }
    });

    return [
      { key: "season", label: "Temporada" },
      ...Array.from(monthMap, ([key, label]) => ({ key, label }))
    ];
  }, [jornadas]);

  const topRanking = useMemo(() => {
    const jornadasById = new Map(jornadas.map((jornada) => [jornada.id, jornada]));
    const playersById = new Map(plantilla.map((player) => [player.id, player]));
    const selectedJornadaIds = new Set(
      jornadas
        .filter((jornada) => {
          if (rankingPeriod === "season") return true;
          if (!jornada.fecha) return false;
          const date = new Date(jornada.fecha);
          if (Number.isNaN(date.getTime())) return false;

          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          return key === rankingPeriod;
        })
        .map((jornada) => jornada.id)
    );
    const minMatches = Number(rankingMinVotes);
    const stats = new Map();

    votosRanking.forEach((voto) => {
      if (!selectedJornadaIds.has(voto.jornada_id)) return;
      if (!jornadasById.has(voto.jornada_id)) return;

      const nota = Number(voto.nota);
      if (!Number.isFinite(nota)) return;

      const current = stats.get(voto.jugador_id) || { jornadas: new Map(), count: 0 };
      const jornadaStats = current.jornadas.get(voto.jornada_id) || { total: 0, count: 0 };

      jornadaStats.total += nota;
      jornadaStats.count += 1;
      current.count += 1;

      current.jornadas.set(voto.jornada_id, jornadaStats);
      stats.set(voto.jugador_id, current);
    });

    return Array.from(stats, ([playerId, stat]) => {
      const player = playersById.get(playerId);
      if (!player) return null;

      const jornadaAverages = Array.from(stat.jornadas.values())
        .filter((jornada) => jornada.count > 0)
        .map((jornada) => jornada.total / jornada.count);

      if (!jornadaAverages.length) return null;
      if (jornadaAverages.length < minMatches) return null;

      return {
        id: playerId,
        name: player.name,
        cardUrl: player.card_url,
        average: jornadaAverages.reduce((sum, average) => sum + average, 0) / jornadaAverages.length,
        playedMatches: jornadaAverages.length
      };
    })
      .filter(Boolean)
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
  }, [jornadas, plantilla, rankingMinVotes, rankingPeriod, votosRanking]);

  useEffect(() => {
    setSeasonCarouselIndex(0);
  }, [rankingMinVotes, rankingPeriod]);

  useEffect(() => {
    if (seasonCarouselIndex >= topRanking.length) {
      setSeasonCarouselIndex(0);
    }
  }, [seasonCarouselIndex, topRanking.length]);

  const moveSeasonCarousel = (direction) => {
    if (!topRanking.length) return;
    setSeasonCarouselMotion((motion) => ({
      direction: direction > 0 ? "next" : "prev",
      step: motion.step + 1
    }));
    setSeasonCarouselIndex((current) => (current + direction + topRanking.length) % topRanking.length);
  };

  const selectSeasonCarouselPlayer = (playerIndex, offset = 0) => {
    if (playerIndex === seasonCarouselIndex) return;

    setSeasonCarouselMotion((motion) => ({
      direction: offset >= 0 ? "next" : "prev",
      step: motion.step + 1
    }));
    setSeasonCarouselIndex(playerIndex);
  };

  const seasonCarouselSlots = [-2, -1, 0, 1, 2]
    .slice(0, Math.min(5, topRanking.length))
    .map((offset) => {
      const playerIndex = (seasonCarouselIndex + offset + topRanking.length) % topRanking.length;
      const player = topRanking[playerIndex];
      const rank = topRanking.findIndex((item) => item.id === player.id) + 1;

      return {
        offset,
        distance: Math.abs(offset),
        isActive: offset === 0,
        isWrapped:
          (seasonCarouselMotion.direction === "next" && offset === 2) ||
          (seasonCarouselMotion.direction === "prev" && offset === -2),
        player,
        playerIndex,
        rank
      };
    });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-wrapper">
          <div className="spinner-ring"></div>
          <img
            src="src/assets/Branding/logo2.png"
            alt="Logo"
            className="loader-logo"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">

      {/* 🔹 TOP BAR */}
      <div className="top-bar">
        <div className="top-bar-actions">
          <button
            className="general-button"
            onClick={() => {
              setOverlayOpen(true);
              fetchVotosGenerales();
            }}
          >
            General
          </button>

          {isAdmin && (
            <div className="admin-actions">
              <div className="admin-jornada-control">
                <button
                  className="admin-btn"
                  type="button"
                  onClick={() => setJornadaMenuOpen((open) => !open)}
                  aria-expanded={jornadaMenuOpen}
                >
                  + Jornada
                </button>

                {jornadaMenuOpen && (
                  <div className="admin-jornada-menu">
                    <button type="button" onClick={crearJornada}>
                      Crear nueva jornada
                    </button>
                    <button
                      className="delete-jornada-btn"
                      type="button"
                      onClick={eliminarJornada}
                      disabled={!jornadaActual}
                    >
                      Eliminar Jornada {jornadaActual?.numero || ""}
                    </button>
                  </div>
                )}
              </div>

              <select className="admin-add-player-select" onChange={(e) => añadirConvocado(e.target.value)}>
                <option value="">+ Añadir jugador</option>
                {plantilla.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="match-info">

          <div className="match-info-box select-box">
            <label>Jornada</label>
            <select
              value={jornadaActual?.id || ""}
              onChange={handleJornadaChange}
            >
              {jornadas.map((j) => (
                <option key={j.id} value={j.id}>
                  Jornada {j.numero}
                </option>
              ))}
            </select>
          </div>

          <div className="match-info-box">
            <label>Partido</label>
            <input
              type="text"
              value={jornadaDraft.partido}
              disabled={!isAdmin}
              onChange={(e) => setJornadaDraft((current) => ({ ...current, partido: e.target.value }))}
              onBlur={() => actualizarJornada("partido", jornadaDraft.partido.trim())}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </div>

          <div className="match-info-box">
            <label>Fecha</label>
            <input
              type="date"
              value={jornadaDraft.fecha}
              disabled={!isAdmin}
              onChange={(e) => setJornadaDraft((current) => ({ ...current, fecha: e.target.value }))}
              onBlur={() => actualizarJornada("fecha", jornadaDraft.fecha)}
            />
          </div>

        </div>
      </div>
      <div className="players-container">
        {/* 🔒 OVERLAY SOLO EN ESTA SECCIÓN */}
        {!userId && (
          <div className="section-overlay">
            <div className="section-overlay-content">
              <h3>Acceso restringido</h3>
              <p>Inicia sesión para votar y participar</p>
              <Link to="/auth" className="auth-btn">
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
        {/* 🔹 CARTAS */}
        <div className="players-grid2">
          {jugadores.length === 0 ? (
            <div className="empty-state">
              <h3>Jornada no disponible</h3>
              <p>
                La convocatoria aún no está disponible.<br />
                Vuelve después del partido para votar a los jugadores.
              </p>
            </div>
          ) : (
            jugadores.map((player) => {
              const scoreValue = Number(notas[player.id] || 0);

              return (
              <div className="voting-player-card-wrapper" key={player.id}>
                <img
                  src={player.card_url}
                  alt={player.name}
                  className="voting-player-card"
                />

                {!userId ? null : (
                  misVotos[player.id] !== undefined ? (
                    <div className="user-vote">
                      Tu nota: {misVotos[player.id]}
                    </div>
                  ) : (
                    <div className={`score-stepper ${notas[player.id] ? "has-score" : ""}`}>
                      <button
                        type="button"
                        aria-label={`Bajar nota de ${player.name}`}
                        disabled={scoreValue <= 0}
                        onClick={() => adjustNota(player.id, -1)}
                      >
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                      <span aria-label={`Nota de ${player.name}`}>
                        {notas[player.id] || "0"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Subir nota de ${player.name}`}
                        disabled={scoreValue >= 10}
                        onClick={() => adjustNota(player.id, 1)}
                      >
                        <ChevronUp size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )
                )}
                {isAdmin && (
                  <button
                    className="remove-player-btn"
                    onClick={() => eliminarConvocado(player.id)}
                  >
                    ✕
                  </button>
                )}

              </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🔹 BOTÓN */}
      <div className="submit-votes">
        <div className="submit-votes-panel">
          <button onClick={enviarVotos}>
            Enviar Votos
          </button>

          <div className="voters-count">
            <Users size={18} aria-hidden="true" />
            <strong>{votantesCount}</strong>
            <em>{votantesCount === 1 ? "usuario ha votado" : "usuarios han votado"}</em>
          </div>
        </div>
      </div>

      <section className="season-notes-section" aria-labelledby="season-notes-title">
        <div className="season-notes-header">
          <h2 id="season-notes-title">Las notas de la temporada</h2>

          <div className="season-notes-controls" aria-label="Filtros del ranking">
            <div className="season-period-tabs">
              {rankingPeriodOptions.map((option) => (
                <button
                  key={option.key}
                  className={rankingPeriod === option.key ? "active" : ""}
                  type="button"
                  onClick={() => setRankingPeriod(option.key)}
                >
                  {rankingPeriod === option.key && <span aria-hidden="true">✓</span>}
                  {option.label}
                </button>
              ))}
            </div>

            <label className="season-min-votes">
              <span>Filtros</span>
              <select
                value={rankingMinVotes}
                onChange={(e) => setRankingMinVotes(e.target.value)}
              >
                <option value="1">Min. 1 partido</option>
                <option value="3">Min. 3 partidos</option>
                <option value="5">Min. 5 partidos</option>
              </select>
            </label>

          </div>
        </div>

        {topRanking.length > 0 && (
          <div className="season-podium-list">
            {topRanking.map((player, index) => {
              const rank = index + 1;

              return (
                <article key={player.id} className={`season-podium-card rank-${rank}`}>
                  <strong>{player.average.toFixed(2).replace(".", ",")}</strong>
                  <em>
                    {player.playedMatches} {player.playedMatches === 1 ? "partido" : "partidos"}
                  </em>
                  {player.cardUrl ? (
                    <img src={player.cardUrl} alt={player.name} />
                  ) : (
                    <div className="season-podium-placeholder">{player.name?.charAt(0)}</div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {topRanking.length > 0 ? (
          <div className="season-podium-carousel">
            <button
              type="button"
              className="season-podium-nav season-podium-prev"
              onClick={() => moveSeasonCarousel(-1)}
              aria-label="Ver jugador anterior"
            >
              ‹
            </button>

            <div className={`season-podium direction-${seasonCarouselMotion.direction}`}>
            {seasonCarouselSlots.map(({ player, playerIndex, rank, offset, distance, isActive, isWrapped }) => {
              return (
                <article
                  key={isWrapped ? `${player.id}-wrap-${seasonCarouselMotion.step}` : player.id}
                  className={`season-podium-card rank-${rank} ${isActive ? "is-active" : "is-muted"} ${isWrapped ? "is-wrapped" : ""}`}
                  style={{ "--podium-offset": offset, "--podium-distance": distance }}
                  onClick={() => selectSeasonCarouselPlayer(playerIndex, offset)}
                >
                  <strong>{player.average.toFixed(2).replace(".", ",")}</strong>
                  <em>
                    {player.playedMatches} {player.playedMatches === 1 ? "partido" : "partidos"}
                  </em>
                  {player.cardUrl ? (
                    <img src={player.cardUrl} alt={player.name} />
                  ) : (
                    <div className="season-podium-placeholder">{player.name?.charAt(0)}</div>
                  )}
                  <span>{rank}º</span>
                </article>
              );
            })}
            </div>

            <button
              type="button"
              className="season-podium-nav season-podium-next"
              onClick={() => moveSeasonCarousel(1)}
              aria-label="Ver jugador siguiente"
            >
              ›
            </button>
          </div>
        ) : (
          <div className="season-notes-empty">
            Aún no hay votos suficientes para construir el top 5.
          </div>
        )}
      </section>

      <section className="notes-info-section" aria-labelledby="notes-info-title">
        <h2 id="notes-info-title">
          <span aria-hidden="true">i</span>
          ¿Cómo funciona?
        </h2>

        <div className="notes-info-grid">
          <article className="notes-info-free">
            <strong>{"Votaci\u00f3n libre despu\u00e9s de los partidos"}</strong>
            <p>Disponible para todos los usuarios registrados</p>
          </article>

          <article className="notes-info-score">
            <strong>Base Estadística</strong>
            <p>100% de la media de todos los votos de los usuarios registrados en Alavesfera</p>
          </article>
        </div>
      </section>

      {/* 🔹 OVERLAY */}
      {overlayOpen && (
        <div
          className="overlay"
          onClick={() => setOverlayOpen(false)}
        >
          <div
            className="overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setOverlayOpen(false)}
            >
              ✕
            </button>

            <h2>Estadísticas Generales</h2>

            <div className="general-table-toolbar">
              <label>
                Jornada
                <select
                  value={generalJornadaId || jornadaActual?.id || ""}
                  onChange={(e) => setGeneralJornadaId(e.target.value)}
                >
                  {jornadas.map((j) => (
                    <option key={j.id} value={j.id}>
                      Jornada {j.numero}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="table-container2" ref={generalTableRef}>
              <table className="results-table2">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Media</th>
                    <th>
                      {jornadas.find((j) => j.id === (generalJornadaId || jornadaActual?.id))?.numero
                        ? `J${jornadas.find((j) => j.id === (generalJornadaId || jornadaActual?.id))?.numero}`
                        : "Jornada"}
                    </th>
                    <th>Partidos</th>
                    <th>Votantes</th>
                    {[].map((j) => (
                      <th key={j.id}>J{j.numero}</th>
                    ))}
                    <th>Media</th> {/* 👈 NUEVO */}
                  </tr>
                </thead>

                <tbody>
                  {plantillaOrdenada.map((jugador) => (
                    <tr key={jugador.id}>
                      <td>{jugador.name}</td>
                      <td>
                        {votosGenerales.totales?.[jugador.id] ?? "-"}
                      </td>
                      <td>
                        {votosGenerales.medias?.[jugador.id]?.[generalJornadaId || jornadaActual?.id] ?? "-"}
                      </td>
                      <td>
                        {Object.values(votosGenerales.counts?.[jugador.id] || {})
                          .filter((count) => Number(count) > 0).length}
                      </td>
                      <td>
                        {votosGenerales.counts?.[jugador.id]?.[generalJornadaId || jornadaActual?.id] ?? 0}
                      </td>

                      {[].map((j) => (
                        <td key={j.id}>
                          {votosGenerales.medias?.[jugador.id]?.[j.id] ?? "-"}
                        </td>
                      ))}

                      <td>
                        {votosGenerales.totales?.[jugador.id] ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

          </div>
        </div>
      )}

    </div>


  );
}
