import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { Download, Pencil, RotateCcw, Search, Trash2, UploadCloud, Users, X } from "lucide-react";
import "./Lineup.css";
import Loader from "../components/Loader.jsx"; // ajusta ruta
import { supabase } from "../services/supabaseClient.js";
import pizarrita from "../assets/Branding/pizarrita.jpg";
import logo2 from "../assets/Branding/Logo2.png";


const formaciones = {
  "4-2-3-1": [
    { top: 85, left: 50 }, { top: 65, left: 15 }, { top: 70, left: 35 },
    { top: 70, left: 65 }, { top: 65, left: 85 }, { top: 52, left: 40 },
    { top: 52, left: 60 }, { top: 35, left: 20 }, { top: 35, left: 50 },
    { top: 35, left: 80 }, { top: 18, left: 50 },
  ],
  "4-3-3": [
    { top: 85, left: 50 }, { top: 65, left: 15 }, { top: 70, left: 35 },
    { top: 70, left: 65 }, { top: 65, left: 85 }, { top: 45, left: 30 },
    { top: 40, left: 50 }, { top: 45, left: 70 }, { top: 25, left: 20 },
    { top: 20, left: 50 }, { top: 25, left: 80 },
  ],
  "4-4-2": [
    { top: 85, left: 50 }, { top: 65, left: 15 }, { top: 70, left: 35 },
    { top: 70, left: 65 }, { top: 65, left: 85 }, { top: 45, left: 40 },
    { top: 45, left: 60 }, { top: 40, left: 80 }, { top: 40, left: 20 },
    { top: 20, left: 40 }, { top: 20, left: 60 },
  ],
  "4-1-3-2": [
    { top: 85, left: 50 }, { top: 65, left: 15 }, { top: 70, left: 35 },
    { top: 70, left: 65 }, { top: 65, left: 85 }, { top: 55, left: 50 },
    { top: 40, left: 25 }, { top: 40, left: 50 }, { top: 40, left: 75 },
    { top: 20, left: 60 }, { top: 20, left: 40 },
  ],
  "1-5-3-2": [
    { top: 90, left: 50 }, { top: 63, left: 10 }, { top: 72, left: 30 },
    { top: 75, left: 50 }, { top: 72, left: 70 }, { top: 63, left: 90 },
    { top: 45, left: 25 }, { top: 52, left: 50 }, { top: 45, left: 75 },
    { top: 25, left: 35 }, { top: 25, left: 65 },
  ],
};

const Lineup = () => {
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fichajes, setFichajes] = useState([]);
  const [showFichajeModal, setShowFichajeModal] = useState(false);
  const [nuevoJugador, setNuevoJugador] = useState("");
  const [nuevoEquipoOrigen, setNuevoEquipoOrigen] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [players, setPlayers] = useState(Array(11).fill(null));
  const [suplentes, setSuplentes] = useState(Array(11).fill(""));
  const [positions, setPositions] = useState(formaciones["4-2-3-1"]);
  const [formacion, setFormacion] = useState("4-2-3-1");
  const [nombrePlantilla, setNombrePlantilla] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [titularTemp, setTitularTemp] = useState(null);
  const [suplenteTemp, setSuplenteTemp] = useState("");
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingMarketValue, setEditingMarketValue] = useState("");
  const [marketCanScrollMore, setMarketCanScrollMore] = useState(false);
  const [draggedPlayerIndex, setDraggedPlayerIndex] = useState(null);
  const [panelView, setPanelView] = useState("planner");
  const [communityLineups, setCommunityLineups] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [publishingLineup, setPublishingLineup] = useState(false);
  const [communityMessage, setCommunityMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(true);
  const [marketSearch, setMarketSearch] = useState("");
  const fieldRef = useRef(null);
  const marketTableBodyRef = useRef(null);

  // Stats dinámicos, inicializados en 0
  const ingresos = salidas
    .filter(j => j.tipoSalida === "Venta")
    .reduce((sum, j) => sum + Number(j.marketValue || 0), 0);
  const gastos = fichajes.reduce((sum, j) => sum + Number(j.marketValue || 0), 0);
  const balance = ingresos - gastos;
  const traspasados = salidas.filter(j => j.tipoSalida === "Venta");
  const cedidos = salidas.filter(j => j.tipoSalida === "Cesion");

  const updateMarketScrollState = () => {
    const body = marketTableBodyRef.current;
    if (!body) return;

    setMarketCanScrollMore(body.scrollTop + body.clientHeight < body.scrollHeight - 2);
  };

  const handleFormacionChange = (e) => {
    const f = e.target.value;
    setFormacion(f);
    setPositions(formaciones[f]);
  };

  const handleAddPlayer = (index) => {
    setSelectedIndex(index);
    setTitularTemp(players[index]);
    setBusqueda(players[index]?.nombre || "");
    setSuplenteTemp(suplentes[index] || "");
    setShowModal(true);
  };

  const handleSelectPlayer = (jugador) => {
    setTitularTemp(jugador);
    setBusqueda(jugador.nombre);
  };

  const handleConfirmPlayerSelection = () => {
    if (selectedIndex === null || !titularTemp) return;

    const updatedPlayers = [...players];
    const updatedSuplentes = [...suplentes];
    updatedPlayers[selectedIndex] = titularTemp;
    updatedSuplentes[selectedIndex] = suplenteTemp;
    setPlayers(updatedPlayers);
    setSuplentes(updatedSuplentes);
    setShowModal(false);
    setBusqueda("");
    setTitularTemp(null);
    setSuplenteTemp("");
  };

  const handleCancelPlayerSelection = () => {
    setShowModal(false);
    setBusqueda("");
    setTitularTemp(null);
    setSuplenteTemp("");
  };

  const handleRemovePlayer = (index) => {
    const updatedPlayers = [...players];
    const updatedSuplentes = [...suplentes];
    updatedPlayers[index] = null;
    updatedSuplentes[index] = "";
    setPlayers(updatedPlayers);
    setSuplentes(updatedSuplentes);
  };

  const handleRecuperar = (jugador) => {
    const { tipoSalida, ...jugadorMercado } = jugador;
    setMarketData(prev => [...prev, jugadorMercado]); // vuelve al mercado
    setSalidas(prev => prev.filter(j => j.id !== jugador.id)); // lo quitamos de salidas
  };

  const handleSalida = (id, tipoSalida) => {
    const jugador = marketData.find(j => j.id === id);

    if (jugador) {
      setSalidas(prev => [...prev, { ...jugador, tipoSalida }]);
    }

    setMarketData(prev => prev.filter(j => j.id !== id));
  };

  const parseMarketValue = (value) => Number(String(value).replace(",", "."));

  const formatMarketAmount = (value) => {
    const numberValue = Number(value || 0);
    return Number.isInteger(numberValue) ? numberValue : numberValue.toFixed(1);
  };

  const handleStartEditValue = (jugador) => {
    setEditingPlayerId(jugador.id);
    setEditingMarketValue(String(jugador.marketValue ?? ""));
  };

  const handleSaveMarketValue = (id) => {
    const parsedValue = parseMarketValue(editingMarketValue);

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setEditingPlayerId(null);
      setEditingMarketValue("");
      return;
    }

    const updateValue = (jugador) =>
      jugador.id === id ? { ...jugador, marketValue: parsedValue } : jugador;

    setMarketData(prev => prev.map(updateValue));
    setJugadoresDisponibles(prev => prev.map(updateValue));
    setEditingPlayerId(null);
    setEditingMarketValue("");
  };

  const handleMarketValueKeyDown = (e, id) => {
    if (e.key === "Enter") {
      handleSaveMarketValue(id);
    }

    if (e.key === "Escape") {
      setEditingPlayerId(null);
      setEditingMarketValue("");
    }
  };

  const limpiarAlineacion = () => {
    setPlayers(Array(11).fill(null));
    setSuplentes(Array(11).fill(""));
  };

  const handleDescargarPlantilla = async () => {
    const canvas = await html2canvas(fieldRef.current, { backgroundColor: null, useCORS: true });
    const link = document.createElement("a");
    link.download = `${nombrePlantilla || "alineacion"}.jpeg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  const fetchCommunityLineups = async () => {
    setCommunityLoading(true);

    const { data, error } = await supabase
      .from("lineup_community")
      .select("id, user_id, title, formation, image_path, image_url, author_name, created_at")
      .order("created_at", { ascending: false });

    if (!error) setCommunityLineups(data || []);
    setCommunityLoading(false);
  };

  const handlePublishLineup = async () => {
    setCommunityMessage("");
    setPublishingLineup(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      setCommunityMessage("Inicia sesion para publicar tu plantilla.");
      setPublishingLineup(false);
      return;
    }

    const canvas = await html2canvas(fieldRef.current, { backgroundColor: null, useCORS: true });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));

    if (!blob) {
      setCommunityMessage("No se pudo preparar la imagen.");
      setPublishingLineup(false);
      return;
    }

    const filePath = `${user.id}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("lineup-community")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      setCommunityMessage("No se pudo subir la plantilla.");
      setPublishingLineup(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("lineup-community")
      .getPublicUrl(filePath);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    const { error: insertError } = await supabase
      .from("lineup_community")
      .insert({
        user_id: user.id,
        title: nombrePlantilla.trim() || "Zure hamaikakoa",
        formation: formacion,
        image_path: filePath,
        image_url: publicData.publicUrl,
        author_name: profile?.username || "Aficionado",
      });

    if (insertError) {
      await supabase.storage.from("lineup-community").remove([filePath]);
      setCommunityMessage("No se pudo publicar la plantilla.");
      setPublishingLineup(false);
      return;
    }

    setCommunityMessage("Plantilla publicada.");
    setPublishingLineup(false);
    await fetchCommunityLineups();
  };

  const handleDeleteCommunityLineup = async (lineup) => {
    if (!currentUserId || lineup.user_id !== currentUserId) return;
    if (!window.confirm(`¿Eliminar la plantilla “${lineup.title}”?`)) return;

    const { error } = await supabase
      .from("lineup_community")
      .delete()
      .eq("id", lineup.id)
      .eq("user_id", currentUserId);

    if (error) {
      setCommunityMessage("No se pudo eliminar la plantilla.");
      return;
    }

    if (lineup.image_path) {
      await supabase.storage.from("lineup-community").remove([lineup.image_path]);
    }

    setCommunityLineups((current) => current.filter((item) => item.id !== lineup.id));
    setCommunityMessage("Plantilla eliminada.");
  };

  const handleAddFichaje = () => {
    if (!nuevoJugador || !nuevoPrecio) return;

    const parsedPrecio = parseMarketValue(nuevoPrecio);
    if (Number.isNaN(parsedPrecio) || parsedPrecio < 0) return;

    const nuevo = {
      id: crypto.randomUUID(),
      nombre: nuevoJugador,
      equipoOrigen: nuevoEquipoOrigen,
      marketValue: parsedPrecio
    };

    setFichajes(prev => [...prev, nuevo]);
    setNuevoJugador("");
    setNuevoEquipoOrigen("");
    setNuevoPrecio("");
    setShowFichajeModal(false);
  };

  const handleRemoveFichaje = (id) => {
    setFichajes(prev => prev.filter(j => j.id !== id));
  };

  const handleMovePlayer = (targetIndex) => {
    if (draggedPlayerIndex === null || draggedPlayerIndex === targetIndex) return;

    setPlayers(prev => {
      const updated = [...prev];
      [updated[draggedPlayerIndex], updated[targetIndex]] = [updated[targetIndex], updated[draggedPlayerIndex]];
      return updated;
    });

    setSuplentes(prev => {
      const updated = [...prev];
      [updated[draggedPlayerIndex], updated[targetIndex]] = [updated[targetIndex], updated[draggedPlayerIndex]];
      return updated;
    });

    setDraggedPlayerIndex(null);
  };

  const renderPosition = (index, top, left) => {
    const player = players[index];
    return (
      <div
        key={index}
        className={`position-wrapper ${draggedPlayerIndex !== null ? "drop-ready" : ""}`}
        style={{ top: `${top}%`, left: `${left}%` }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleMovePlayer(index)}
      >
        {!player ? (
          <div className="position" onClick={() => handleAddPlayer(index)}>+</div>
        ) : (
          <div style={{ textAlign: "center", position: "relative" }}>
            <img
              src={player.carta}
              alt=""
              className="jugador-card"
              draggable
              onClick={() => handleRemovePlayer(index)}
              onDragStart={() => setDraggedPlayerIndex(index)}
              onDragEnd={() => setDraggedPlayerIndex(null)}
            />
            {suplentes[index] && <div className="suplente-text">{suplentes[index]}</div>}
          </div>
        )}
      </div>
    );
  };

  const filteredSuplentes = jugadoresDisponibles.filter(j => j.nombre.toLowerCase().includes(suplenteTemp.toLowerCase()));

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = marketData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(marketData.length / rowsPerPage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchJugadores = async () => {
      const { data, error } = await supabase
        .from("jugadores")
        .select("id,name,card_url, photo_url, market_value")
        .eq("team_type", "first_team");

      if (error) {
        console.error("Error cargando jugadores:", error);
        return;
      }

      const jugadoresFormateados = data.map(j => ({
        id: j.id,
        nombre: j.name,
        carta: j.card_url,
        icono: j.photo_url,
        marketValue: j.market_value, // puedes cambiar esto si luego lo guardas en BD
        estado: "propiedad"
      }));

      setJugadoresDisponibles(jugadoresFormateados);
      setMarketData(jugadoresFormateados);
    };

    fetchJugadores();
  }, []);

  useEffect(() => {
    window.setTimeout(updateMarketScrollState, 0);
  }, [marketData.length]);

  useEffect(() => {
    if (panelView === "community") fetchCommunityLineups();
  }, [panelView]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id || null));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <>

      <div className="alineacion-wrapper">
        <div className="alineacion-contenedor">

          <div className="pizarra-y-acciones">
            <div
              className="field2"
              ref={fieldRef}
              style={{ "--bg-image": `url(${pizarrita})` }}
            >
              <div className="overlay-text-container left-aligned">
                <h2 className="overlay-nombre">{nombrePlantilla || "Zure hamaikakoa"}</h2>
                <div className="overlay-formacion-box">{formacion}</div>
              </div>
              <img className="overlay-board-logo" src={logo2} alt="" />
              {positions.map((pos, index) => renderPosition(index, pos.top, pos.left))}
            </div>

            <div className="buttons-container outside">
              <button className="btn-action" type="button" onClick={limpiarAlineacion}>
                <RotateCcw size={18} />
                <span>Limpiar alineación</span>
              </button>
              <button className="btn-action descargar" type="button" onClick={handleDescargarPlantilla}>
                <Download size={18} />
                <span>Descargar plantilla</span>
              </button>
            </div>
          </div>

          <div className="panel-y-botones">
            <div className="panel-derecho">
              <div className="inputs-row">
                <div className="campo-control campo-formacion">
                  <label>Formación</label>
                  <select value={formacion} onChange={handleFormacionChange}>
                    {Object.keys(formaciones).map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>

                <div className="campo-control campo-nombre">
                  <label>Nombre</label>
                  <input type="text" value={nombrePlantilla} onChange={e => setNombrePlantilla(e.target.value)} />
                </div>

                <button
                  className={`community-tab-button ${panelView === "community" ? "active" : ""}`}
                  type="button"
                  onClick={() => setPanelView((view) => view === "community" ? "planner" : "community")}
                  aria-pressed={panelView === "community"}
                >
                  <Users size={18} aria-hidden="true" />
                  <span>Comunidad</span>
                </button>
              </div>

              {panelView === "planner" ? (
                <div className="lineup-planner-content">
              <div className="mercado-box">
                <div className="tables-wrapper">

                  <section
                    className="market-dropdown"
                    style={{ flex: "0 0 390px", width: "390px", maxWidth: "390px", marginRight: "18px" }}
                    aria-label="Mercado de jugadores"
                  >
                    <button
                      className={`market-dropdown-trigger ${marketDropdownOpen ? "open" : ""}`}
                      type="button"
                      onClick={() => setMarketDropdownOpen((open) => !open)}
                      aria-expanded={marketDropdownOpen}
                    >
                      <span>
                        <strong>Mercado de jugadores</strong>
                        <small>{marketData.filter(j => j.estado === "propiedad").length} disponibles</small>
                      </span>
                      <i aria-hidden="true" />
                    </button>

                    {marketDropdownOpen && (
                      <div
                        className={`market-player-list ${marketCanScrollMore ? "has-scroll-more" : ""}`}
                        ref={marketTableBodyRef}
                        onScroll={updateMarketScrollState}
                      >
                        <label className="market-search">
                          <Search size={14} aria-hidden="true" />
                          <input
                            type="search"
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            placeholder="Buscar jugador"
                          />
                        </label>
                        {marketSearch.trim() && (
                          <div className="market-search-results">
                        {marketData
                          .filter(j => j.estado === "propiedad")
                          .filter(j => j.nombre.toLowerCase().includes(marketSearch.trim().toLowerCase()))
                          .slice(0, 4)
                          .map((j) => (
                            <article key={j.id} className="market-player-row">
                              <div className="market-player-main">
                                {j.icono && <img src={j.icono} alt="" loading="lazy" />}
                                <strong>{j.nombre}</strong>
                              </div>

                              <div className="market-value-cell">
                                {editingPlayerId === j.id ? (
                                  <input
                                    className="market-value-input"
                                    type="text"
                                    inputMode="decimal"
                                    value={editingMarketValue}
                                    onChange={(e) => setEditingMarketValue(e.target.value)}
                                    onBlur={() => handleSaveMarketValue(j.id)}
                                    onKeyDown={(e) => handleMarketValueKeyDown(e, j.id)}
                                    autoFocus
                                  />
                                ) : (
                                  <span>{formatMarketAmount(j.marketValue)} M€</span>
                                )}
                                <button
                                  className="btn-edit-value"
                                  type="button"
                                  onClick={() => handleStartEditValue(j)}
                                  aria-label={`Editar valor de ${j.nombre}`}
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>

                              <div className="market-action-buttons" aria-label={`Opciones de salida para ${j.nombre}`}>
                                <button type="button" className="market-action-btn sale" onClick={() => handleSalida(j.id, "Venta")} title="Venta" aria-label={`Vender a ${j.nombre}`}>V</button>
                                <button type="button" className="market-action-btn loan" onClick={() => handleSalida(j.id, "Cesion")} title="Cesion" aria-label={`Ceder a ${j.nombre}`}>C</button>
                              </div>
                            </article>
                          ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                  {/* TABLA 2 (FICHAJES) */}
                  <div className="table-lineup">
                    <table className="plantilla-table2 fichajes-table">
                      <thead>
                        <tr>
                          <th>Fichaje</th>
                          <th>Origen</th>
                          <th>Coste</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* LISTA DE FICHAJES */}
                        {fichajes.map((j, i) => (
                          <tr key={i} className="player-row">
                            <td>{j.nombre}</td>
                            <td>{j.equipoOrigen || "-"}</td>
                            <td>{formatMarketAmount(j.marketValue)} M€</td>
                            <td>
                              <button
                                className="btn-remove-fichaje"
                                type="button"
                                onClick={() => handleRemoveFichaje(j.id)}
                                aria-label={`Borrar fichaje ${j.nombre}`}
                              >
                                <X size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* FILA PARA AÑADIR UN NUEVO FICHAJE */}
                        <tr className="player-row add-fichaje-row">
                          <td colSpan="4">
                            <div className="add-fichaje-btn" onClick={() => setShowFichajeModal(true)}>+</div>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>

                </div>
                <div className="market-stats">
                  <div>
                    <span className="stat-label">Ingresos:</span>
                    <span className="stat-value">{formatMarketAmount(ingresos)}M€</span>
                  </div>
                  <div>
                    <span className="stat-label">Gastos:</span>
                    <span className="stat-value">{formatMarketAmount(gastos)}M€</span>
                  </div>
                  <div>
                    <span className="stat-label">Balance:</span>
                    <span className={`stat-value ${balance >= 0 ? "positivo" : "negativo"}`}>
                      {formatMarketAmount(balance)} M€
                    </span>
                  </div>
                </div>
              </div>
              <div className="salidas-box">
                <div className="salidas-header">
                  <h3 className="mercado-title">Lista de salidas</h3>
                </div>
                <div className="salidas-lanes">
                  <div className="salida-lane">
                    <div className="salida-lane-title">
                      <span>Traspasados</span>
                    </div>
                    <div className="salidas-list">
                      {traspasados.length > 0 ? (
                        traspasados.map((j, i) => (
                          <button
                            key={j.id || i}
                            className="salida-card"
                            type="button"
                            onClick={() => handleRecuperar(j)}
                            aria-label={`Quitar salida ${j.nombre}`}
                          >
                            <img src={j.carta} alt={j.nombre} />
                            <span>{formatMarketAmount(j.marketValue)} M€</span>
                          </button>
                        ))
                      ) : (
                        <div className="salidas-empty">Sin traspasos</div>
                      )}
                    </div>
                  </div>

                  <div className="salida-lane">
                    <div className="salida-lane-title">
                      <span>Cedidos</span>
                    </div>
                    <div className="salidas-list">
                      {cedidos.length > 0 ? (
                        cedidos.map((j, i) => (
                          <button
                            key={j.id || i}
                            className="salida-card"
                            type="button"
                            onClick={() => handleRecuperar(j)}
                            aria-label={`Quitar salida ${j.nombre}`}
                          >
                            <img src={j.carta} alt={j.nombre} />
                          </button>
                        ))
                      ) : (
                        <div className="salidas-empty">Sin cesiones</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="salidas-legend" aria-label="Leyenda de acciones">
                  <div>
                    <span className="legend-color sale"></span>
                    <strong>Venta</strong>
                  </div>
                  <div>
                    <span className="legend-color loan"></span>
                    <strong>Cesion</strong>
                  </div>
                </div>
              </div>
                </div>
              ) : (
                <section className="lineup-community" aria-label="Plantillas de la comunidad">
                  <div className="lineup-community-header">
                    <div>
                      <span>Alavesfera Team</span>
                      <h2>Plantillas de la comunidad</h2>
                    </div>
                    <button type="button" onClick={handlePublishLineup} disabled={publishingLineup}>
                      <UploadCloud size={17} aria-hidden="true" />
                      {publishingLineup ? "Publicando" : "Publicar la mia"}
                    </button>
                  </div>

                  {communityMessage && <p className="lineup-community-message" role="status">{communityMessage}</p>}

                  {communityLoading ? (
                    <div className="lineup-community-empty">Cargando plantillas...</div>
                  ) : communityLineups.length === 0 ? (
                    <div className="lineup-community-empty">
                      <Users size={28} aria-hidden="true" />
                      <strong>Aun no hay plantillas publicadas</strong>
                      <span>La primera puede ser la tuya.</span>
                    </div>
                  ) : (
                    <div className="lineup-community-grid">
                      {communityLineups.map((lineup) => (
                        <article className="lineup-community-card" key={lineup.id}>
                          {lineup.user_id === currentUserId && (
                            <button
                              className="lineup-community-delete"
                              type="button"
                              onClick={() => handleDeleteCommunityLineup(lineup)}
                              aria-label={`Eliminar ${lineup.title}`}
                              title="Eliminar plantilla"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          )}
                          <a href={lineup.image_url} target="_blank" rel="noreferrer" aria-label={`Ver ${lineup.title}`}>
                            <img src={lineup.image_url} alt={lineup.title} loading="lazy" />
                          </a>
                          <div>
                            <strong>{lineup.title}</strong>
                            <span>{lineup.author_name} · {lineup.formation}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay-lineup">
          <div className="modal-lineup player-picker-modal">
            <div className="player-picker-header">
              <div>
                <h3>Elegir jugador</h3>
              </div>
              <button className="player-picker-close" type="button" onClick={handleCancelPlayerSelection} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="player-picker-field">
              <label>Titular:</label>
              <div className="player-picker-input">
                <Search size={17} />
                <input
                  placeholder="Buscar en plantilla"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setTitularTemp(null);
                  }}
                />
              </div>
              <div className="jugadores-lista-lineup starter-list">
                {busqueda ? (
                  jugadoresDisponibles
                    .filter(j => j.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                    .map((jugador, i) => (
                      <button key={jugador.id || i} className="jugador-opcion-lineup" type="button" onClick={() => handleSelectPlayer(jugador)}>
                        <img src={jugador.icono} className="player-icon-lineup" alt="" />
                        <span>{jugador.nombre}</span>
                      </button>
                    ))
                ) : null}
              </div>
            </div>

            <div className="player-picker-field">
              <label>Suplente:</label>
              <div className="player-picker-input">
                <Search size={17} />
                <input placeholder="Opcional" value={suplenteTemp} onChange={(e) => setSuplenteTemp(e.target.value)} />
              </div>
              <div className="jugadores-lista-lineup bench-list">
                {suplenteTemp ? (
                  jugadoresDisponibles.filter(j => j.nombre.toLowerCase().includes(suplenteTemp.toLowerCase())).map((j, i) => (
                    <button key={j.id || i} className="suplente-opcion" type="button" onClick={() => setSuplenteTemp(j.nombre)}>{j.nombre}</button>
                  ))
                ) : null}
              </div>
            </div>

            <div className="player-picker-actions">
              <button type="button" onClick={handleCancelPlayerSelection}>Cancelar</button>
              <button type="button" onClick={handleConfirmPlayerSelection} disabled={!titularTemp}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {showFichajeModal && (
        <div className="modal-overlay-lineup">
          <div className="modal-lineup">
            <h3 style={{ margin: 0 }}>Fichar jugador</h3>

            <input
              placeholder="Nombre del jugador"
              value={nuevoJugador}
              onChange={(e) => setNuevoJugador(e.target.value)}
            />

            <input
              placeholder="Equipo de origen"
              value={nuevoEquipoOrigen}
              onChange={(e) => setNuevoEquipoOrigen(e.target.value)}
            />

            <input
              placeholder="Precio (M€)"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
            />

            <button className="btn-action" onClick={handleAddFichaje}>
              Añadir fichaje
            </button>

            <button className="btn-cerrar" onClick={() => setShowFichajeModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Lineup;
