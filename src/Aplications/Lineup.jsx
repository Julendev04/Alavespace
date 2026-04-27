import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
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
  const [vendidos, setVendidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fichajes, setFichajes] = useState([]);
  const [showFichajeModal, setShowFichajeModal] = useState(false);
  const [nuevoJugador, setNuevoJugador] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const fieldRef = useRef(null);

  // Stats dinámicos, inicializados en 0
  const [ingresos, setIngresos] = useState(0);
  const gastos = fichajes.reduce((sum, j) => sum + Number(j.marketValue), 0);
  const balance = ingresos - gastos;

  const handleFormacionChange = (e) => {
    const f = e.target.value;
    setFormacion(f);
    setPositions(formaciones[f]);
    setPlayers(Array(11).fill(null));
    setSuplentes(Array(11).fill(""));
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
    setMarketData(prev => [...prev, jugador]); // vuelve al mercado
    setVendidos(prev => prev.filter(j => j.id !== jugador.id)); // lo quitamos de vendidos
    setIngresos(prev => prev - Number(jugador.marketValue)); // ajustamos ingresos
  };

  const handleVender = (id) => {
    const jugador = marketData.find(j => j.id === id);

    if (jugador) {
      setIngresos(prev => prev + Number(jugador.marketValue));
      setVendidos(prev => [...prev, jugador]); // 👈 guardar vendido
    }

    setMarketData(prev => prev.filter(j => j.id !== id));
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

    const nuevo = {
      nombre: nuevoJugador,
      marketValue: Number(nuevoPrecio)
    };

    setFichajes(prev => [...prev, nuevo]);
    setNuevoJugador("");
    setNuevoPrecio("");
    setShowFichajeModal(false);
  };

  const renderPosition = (index, top, left) => {
    const player = players[index];
    return (
      <div key={index} className="position-wrapper" style={{ top: `${top}%`, left: `${left}%` }}>
        {!player ? (
          <div className="position" onClick={() => handleAddPlayer(index)}>+</div>
        ) : (
          <div style={{ textAlign: "center", position: "relative" }}>
            <img src={player.carta} alt="" className="jugador-card" onClick={() => handleRemovePlayer(index)} />
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
        .select("id,name,card_url,market_value")
        .eq("team_type", "first_team");

      if (error) {
        console.error("Error cargando jugadores:", error);
        return;
      }

      const jugadoresFormateados = data.map(j => ({
        id: j.id,
        nombre: j.name,
        carta: j.card_url,
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
        <h1 className="titulo-coluna">ALINEOMETRO</h1>
        <h2 className="subtitulo-montserrat">
          Crea tus plantillas y compártelas en redes sociales mencionando a <strong>Alavesfera Team</strong>
        </h2>
      </div>

      <div className="alineacion-wrapper">
        <div className="alineacion-contenedor">

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
                    <table className="plantilla-table2">
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
                              <td>{j.marketValue} M€</td>
                              <td>
                                <button className="btn-vender" onClick={() => handleVender(j.id)}>
                                  Vender
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {/* TABLA 2 (FICHAJES) */}
                  <div className="table-lineup">
                    <table className="plantilla-table2">
                      <thead>
                        <tr>
                          <th>Fichaje</th>
                          <th>Coste</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* LISTA DE FICHAJES */}
                        {fichajes.map((j, i) => (
                          <tr key={i} className="player-row">
                            <td>{j.nombre}</td>
                            <td>{j.marketValue} M€</td>
                          </tr>
                        ))}
                        {/* FILA PARA AÑADIR UN NUEVO FICHAJE */}
                        <tr className="player-row add-fichaje-row">
                          <td colSpan="2">
                            <div className="add-fichaje-btn" onClick={() => setShowFichajeModal(true)}>+</div>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>

                </div>
                {vendidos.length > 0 && (
                  <div className="vendidos-container">
                    {vendidos.map((j, i) => (
                      <div key={i} className="vendido-tag">
                        {j.nombre}
                        <span onClick={() => handleRecuperar(j)}>×</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="market-stats">
                  <div>
                    <span className="stat-value">{ingresos}M€</span>
                    <span className="stat-label">Ingresos</span>
                  </div>
                  <div>
                    <span className="stat-value">{gastos}M€</span>
                    <span className="stat-label">Gastos</span>
                  </div>
                  <div>
                    <span className={`stat-value ${balance >= 0 ? "positivo" : "negativo"}`}>
                      {balance} M€
                    </span>
                    <span className="stat-label">Balance</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="buttons-container outside">
              <button className="btn-action" onClick={limpiarAlineacion}>Limpiar alineación</button>
              <button className="btn-action descargar" onClick={handleDescargarPlantilla}>Descargar plantilla</button>
            </div>

          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay-lineup">
          <div className="modal-lineup">
            <input placeholder="Buscar jugador..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <div className="jugadores-lista-lineup">
              {busqueda && jugadoresDisponibles
                .filter(j => j.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                .map((jugador, i) => (
                  <div key={i} className="jugador-opcion-lineup" onClick={() => handleSelectPlayer(jugador)}>
                    <img src={jugador.carta} width="40" alt="" />
                    <span>{jugador.nombre}</span>
                  </div>
                ))
              }
            </div>

            <input placeholder="Nombre suplente" value={suplenteTemp} onChange={(e) => setSuplenteTemp(e.target.value)} />
            <div className="jugadores-lista-lineup">
              {suplenteTemp && jugadoresDisponibles.filter(j => j.nombre.toLowerCase().includes(suplenteTemp.toLowerCase())).map((j, i) => (
                <div key={i} className="suplente-opcion" onClick={() => setSuplenteTemp(j.nombre)}>{j.nombre}</div>
              ))}
            </div>

            <button className="btn-cerrar" onClick={() => setShowModal(false)}>Cerrar</button>
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