import React, { useState, useEffect } from "react";
import "./Notas.css";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";

export default function VotingPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const [jugadores, setJugadores] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [jornadaActual, setJornadaActual] = useState(null);
  const [notas, setNotas] = useState({});

  const [votosGenerales, setVotosGenerales] = useState({});
  const [misVotos, setMisVotos] = useState({});
  const [userId, setUserId] = useState(null);

  const [plantilla, setPlantilla] = useState([]);

  const [loading, setLoading] = useState(true);

  const [votantesCount, setVotantesCount] = useState(0);

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
        fetchConvocados(data[0].id);
        fetchVotantesCount(data[0].id);
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
        if (!votosMap[v.jugador_id]) {
          votosMap[v.jugador_id] = {};
        }

        if (!votosMap[v.jugador_id][v.jornada_id]) {
          votosMap[v.jugador_id][v.jornada_id] = {
            total: 0,
            count: 0,
          };
        }

        votosMap[v.jugador_id][v.jornada_id].total += v.nota;
        votosMap[v.jugador_id][v.jornada_id].count += 1;
      });

      // 🔥 calcular medias + media total
      const mediasMap = {};
      const mediaTotalMap = {};

      Object.keys(votosMap).forEach((jugadorId) => {
        mediasMap[jugadorId] = {};

        let totalGlobal = 0;
        let countGlobal = 0;

        Object.keys(votosMap[jugadorId]).forEach((jornadaId) => {
          const { total, count } = votosMap[jugadorId][jornadaId];

          const media = total / count;

          mediasMap[jugadorId][jornadaId] = media.toFixed(1);

          totalGlobal += total;
          countGlobal += count;
        });

        mediaTotalMap[jugadorId] =
          countGlobal > 0 ? (totalGlobal / countGlobal).toFixed(2) : "-";
      });

      // 🔥 guardamos TODO junto
      setVotosGenerales({
        medias: mediasMap,
        totales: mediaTotalMap,
      });
    }
  };

  // 🔹 CAMBIAR NOTA
  const handleNotaChange = (jugadorId, value) => {
    setNotas({
      ...notas,
      [jugadorId]: value,
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
    if (!jornadaActual) return;

    const { error } = await supabase
      .from("jornadas")
      .update({ [campo]: valor })
      .eq("id", jornadaActual.id);

    if (!error) {
      setJornadaActual({
        ...jornadaActual,
        [campo]: valor,
      });
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
      fetchJornadas();
    }
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

  if (loading) {
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

  return (
    <div className="voting-page">

      {/* 🔹 TOP BAR */}
      <div className="top-bar">
        {isAdmin && (
          <button className="admin-btn" onClick={crearJornada}>
            + Jornada
          </button>
        )}
        <button
          className="general-button"
          onClick={() => {
            setOverlayOpen(true);
            fetchVotosGenerales();
          }}
        >
          General
        </button>

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
              value={jornadaActual?.partido || ""}
              disabled={!isAdmin}
              onChange={(e) =>
                actualizarJornada("partido", e.target.value)
              }
            />
          </div>

          <div className="match-info-box">
            <label>Fecha</label>
            <input
              type="text"
              value={jornadaActual?.fecha || ""}
              disabled={!isAdmin}
              onChange={(e) =>
                actualizarJornada("fecha", e.target.value)
              }
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
          {isAdmin && (
            <div className="admin-add-player">
              <select onChange={(e) => añadirConvocado(e.target.value)}>
                <option value="">+ Añadir jugador</option>
                {plantilla.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {jugadores.length === 0 ? (
            <div className="empty-state">
              <h3>Jornada no disponible</h3>
              <p>
                La convocatoria aún no está disponible.<br />
                Vuelve después del partido para votar a los jugadores.
              </p>
            </div>
          ) : (
            jugadores.map((player) => (
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
                    <input
                      type="number"
                      className="player-score-input"
                      placeholder="Nota"
                      min="0"
                      max="10"
                      value={notas[player.id] || ""}
                      onChange={(e) =>
                        handleNotaChange(player.id, e.target.value)
                      }
                    />
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
            ))
          )}
        </div>
      </div>

      {/* 🔹 BOTÓN */}
      <div className="submit-votes">
        <button onClick={enviarVotos}>
          Enviar Votos
        </button>

        <div className="voters-count">
          👥 {votantesCount} usuarios han votado
        </div>
      </div>

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

            <div className="table-container2">
              <table className="results-table2">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    {jornadas.map((j) => (
                      <th key={j.id}>J{j.numero}</th>
                    ))}
                    <th>Media</th> {/* 👈 NUEVO */}
                  </tr>
                </thead>

                <tbody>
                  {plantillaOrdenada.map((jugador) => (
                    <tr key={jugador.id}>
                      <td>{jugador.name}</td>

                      {jornadas.map((j) => (
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