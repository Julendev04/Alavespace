import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { Download, Pencil, RotateCcw, Search, X } from "lucide-react";
import "./Lineup.css";
import Loader from "../components/Loader.jsx"; // ajusta ruta
import { supabase } from "../services/supabaseClient.js";
import pizarrita from "../assets/Branding/pizarrita.jpg";


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
  const [suplenteTemp, setSuplenteTemp] = useState("");
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingMarketValue, setEditingMarketValue] = useState("");
  const [draggedPlayerIndex, setDraggedPlayerIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const fieldRef = useRef(null);

  // Stats dinámicos, inicializados en 0
  const ingresos = salidas
    .filter(j => j.tipoSalida === "Venta")
    .reduce((sum, j) => sum + Number(j.marketValue || 0), 0);
  const gastos = fichajes.reduce((sum, j) => sum + Number(j.marketValue || 0), 0);
  const balance = ingresos - gastos;
  const traspasados = salidas.filter(j => j.tipoSalida === "Venta");
  const cedidos = salidas.filter(j => j.tipoSalida === "Cesion");

  const handleFormacionChange = (e) => {
    const f = e.target.value;
    setFormacion(f);
    setPositions(formaciones[f]);
  };

  const handleAddPlayer = (index) => {
    setSelectedIndex(index);
    setSuplenteTemp("");
    setShowModal(true);
  };

  const handleSelectPlayer = (jugador) => {
    const updatedPlayers = [...players];
    const updatedSuplentes = [...suplentes];
    updatedPlayers[selectedIndex] = jugador;
    updatedSuplentes[selectedIndex] = suplenteTemp;
    setPlayers(updatedPlayers);
    setSuplentes(updatedSuplentes);
    setShowModal(false);
    setBusqueda("");
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

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="titulo-coluna">Mi planificación</h1>
        <h2 className="subtitulo-montserrat">
          Crea tus plantillas y compártelas en redes sociales mencionando a <strong>Alavesfera Team</strong>
        </h2>
      </div>

      <div className="alineacion-wrapper">
        <div className="alineacion-contenedor">

          <div className="pizarra-y-acciones">
            <div
              className="field2"
              ref={fieldRef}
              style={{ "--bg-image": `url(${pizarrita})` }}
            >
              <div className="overlay-text-container left-aligned">
                <h2 className="overlay-nombre">{nombrePlantilla || "El once del Glorioso"}</h2>
                <div className="overlay-formacion-box">{formacion}</div>
              </div>
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
                <div className="campo-control">
                  <label>Formación</label>
                  <select value={formacion} onChange={handleFormacionChange}>
                    {Object.keys(formaciones).map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>

                <div className="campo-control">
                  <label>Nombre</label>
                  <input type="text" value={nombrePlantilla} onChange={e => setNombrePlantilla(e.target.value)} />
                </div>
              </div>

              <div className="mercado-box">
                <h3 className="mercado-title">Mercado de jugadores</h3>
                <div className="tables-wrapper">

                  {/* TABLA 1 */}
                  <div className="table-lineup">
                    <table className="plantilla-table2 market-table">
                      <thead>
                        <tr>
                          <th>Jugador</th>
                          <th>Valor</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketData
                          .filter(j => j.estado === "propiedad")
                          .map((j, i) => (
                            <tr key={i} className="player-row">
                              <td>{j.nombre}</td>
                              <td>
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
                              </td>
                              <td>
                                <select
                                  className="salida-select"
                                  value=""
                                  onChange={(e) => handleSalida(j.id, e.target.value)}
                                  aria-label={`Opciones de salida para ${j.nombre}`}
                                >
                                  <option value="" disabled>Elige</option>
                                  <option value="Venta">Vender</option>
                                  <option value="Cesion">Ceder</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
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
                    <span className="stat-value">{formatMarketAmount(ingresos)}M€</span>
                    <span className="stat-label">Ingresos</span>
                  </div>
                  <div>
                    <span className="stat-value">{formatMarketAmount(gastos)}M€</span>
                    <span className="stat-label">Gastos</span>
                  </div>
                  <div>
                    <span className={`stat-value ${balance >= 0 ? "positivo" : "negativo"}`}>
                      {formatMarketAmount(balance)} M€
                    </span>
                    <span className="stat-label">Balance</span>
                  </div>
                </div>
              </div>
              <div className="salidas-box">
                <div className="salidas-header">
                  <h3 className="mercado-title">Lista de salidas</h3>
                  <span>{salidas.length}</span>
                </div>
                <div className="salidas-lanes">
                  <div className="salida-lane">
                    <div className="salida-lane-title">
                      <span>Traspasados</span>
                      <strong>{traspasados.length}</strong>
                    </div>
                    <div className="salidas-list">
                      {traspasados.length > 0 ? (
                        traspasados.map((j, i) => (
                          <div key={j.id || i} className="salida-card">
                            <img src={j.carta} alt={j.nombre} />
                            <span>{formatMarketAmount(j.marketValue)} M€</span>
                            <button type="button" onClick={() => handleRecuperar(j)} aria-label={`Quitar salida ${j.nombre}`}>
                              <X size={15} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="salidas-empty">Sin traspasos</div>
                      )}
                    </div>
                  </div>

                  <div className="salida-lane">
                    <div className="salida-lane-title">
                      <span>Cedidos</span>
                      <strong>{cedidos.length}</strong>
                    </div>
                    <div className="salidas-list">
                      {cedidos.length > 0 ? (
                        cedidos.map((j, i) => (
                          <div key={j.id || i} className="salida-card">
                            <img src={j.carta} alt={j.nombre} />
                            <button type="button" onClick={() => handleRecuperar(j)} aria-label={`Quitar salida ${j.nombre}`}>
                              <X size={15} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="salidas-empty">Sin cesiones</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay-lineup">
          <div className="modal-lineup player-picker-modal">
            <div className="player-picker-header">
              <div>
                <span className="player-picker-kicker">Posicion {selectedIndex !== null ? selectedIndex + 1 : ""}</span>
                <h3>Elegir jugador</h3>
              </div>
              <button className="player-picker-close" type="button" onClick={() => setShowModal(false)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="player-picker-field">
              <label>Jugador titular</label>
              <div className="player-picker-input">
                <Search size={17} />
                <input placeholder="Buscar en plantilla" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
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
                ) : (
                  <div className="player-picker-empty">Busca y selecciona el titular</div>
                )}
              </div>
            </div>

            <div className="player-picker-field">
              <label>Suplente asociado</label>
              <div className="player-picker-input">
                <Search size={17} />
                <input placeholder="Opcional" value={suplenteTemp} onChange={(e) => setSuplenteTemp(e.target.value)} />
              </div>
              <div className="jugadores-lista-lineup bench-list">
                {suplenteTemp ? (
                  jugadoresDisponibles.filter(j => j.nombre.toLowerCase().includes(suplenteTemp.toLowerCase())).map((j, i) => (
                    <button key={j.id || i} className="suplente-opcion" type="button" onClick={() => setSuplenteTemp(j.nombre)}>{j.nombre}</button>
                  ))
                ) : (
                  <div className="player-picker-empty compact">Sin suplente seleccionado</div>
                )}
              </div>
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
