import React, { useState } from "react";
import "./Calendario.css"; // Importamos el archivo CSS

const Calendario = () => {
  const [categoriaActiva, setCategoriaActiva] = useState("Primer Equipo");

  const partidos = [
    {
      categoria: "Primer Equipo",
      partidos: [
        { 
          id: 1, 
          jornada: "JORNADA 1", 
          equipo: "RCD Mallorca", 
          fecha: "30/08/2025 · 19:00", 
          icono: "src/photos/top.png", 
          escudo: "src/photos/Mallorca.png", 
          tipoPartido: "local" 
        },
        { 
          id: 2, 
          jornada: "JORNADA 2", 
          equipo: "Real Madrid CF", 
          fecha: "30/08/2025 · 19:00", 
          icono: "src/photos/top.png", 
          escudo: "src/photos/Atletico.png", 
          tipoPartido: "visitante" 
        },
        { 
          id: 2, 
          jornada: "JORNADA 3", 
          equipo: "Real Madrid CF", 
          fecha: "30/08/2025 · 19:00", 
          icono: "src/photos/top.png", 
          escudo: "src/photos/Atletico.png", 
          tipoPartido: "visitante" 
        },
        { 
          id: 2, 
          jornada: "JORNADA 4", 
          equipo: "Real Madrid CF", 
          fecha: "30/08/2025 · 19:00", 
          icono: "src/photos/top.png", 
          escudo: "src/photos/Atletico.png", 
          tipoPartido: "visitante" 
        },
      ],
    },
    {
      categoria: "La Academia",
      partidos: [
        { 
          id: 3, 
          jornada: "JORNADA 1", 
          equipo: "Academia 1", 
          fecha: "01/09", 
          icono: "src/photos/min.png", 
          escudo: "src/photos/escudo_academia1.png", 
          tipoPartido: "local" 
        },
        { 
          id: 4, 
          jornada: "JORNADA 2", 
          equipo: "Academia 2", 
          fecha: "05/09", 
          icono: "src/photos/min.png", 
          escudo: "src/photos/escudo_academia2.png", 
          tipoPartido: "visitante" 
        },
        { 
          id: 4, 
          jornada: "JORNADA 3", 
          equipo: "Academia 2", 
          fecha: "05/09", 
          icono: "src/photos/min.png", 
          escudo: "src/photos/escudo_academia2.png", 
          tipoPartido: "visitante" 
        },
        { 
          id: 4, 
          jornada: "JORNADA 4", 
          equipo: "Academia 2", 
          fecha: "05/09", 
          icono: "src/photos/min.png", 
          escudo: "src/photos/escudo_academia2.png", 
          tipoPartido: "visitante" 
        },
      ],
    },
    {
      categoria: "Femenino",
      partidos: [
        { 
          id: 5, 
          jornada: "J 1", 
          equipo: "Levante UD Femenino", 
          fecha: "14/09", 
          icono: "src/photos/fem.png", 
          escudo: "src/photos/escudo_levante.png", 
          tipoPartido: "local" 
        },
        { 
          id: 6, 
          jornada: "J2/", 
          equipo: "Real Betis Femenino", 
          fecha: "21/09", 
          icono: "src/photos/fem.png", 
          escudo: "src/photos/escudo_betis.png", 
          tipoPartido: "visitante" 
        },
        { 
          id: 6, 
          jornada: "J2/", 
          equipo: "Real Betis Femenino", 
          fecha: "21/09", 
          icono: "src/photos/fem.png", 
          escudo: "src/photos/escudo_betis.png", 
          tipoPartido: "visitante" 
        },
        { 
          id: 6, 
          jornada: "J2/", 
          equipo: "Real Betis Femenino", 
          fecha: "21/09", 
          icono: "src/photos/fem.png", 
          escudo: "src/photos/escudo_betis.png", 
          tipoPartido: "visitante" 
        },
      ],
    },
  ];

  return (
    <div className="calendario-container">
      <h1 className="calendario-title"></h1>

      {/* Categorías en fila */}
      <div className="categorias">
        {partidos.map((seccion) => (
          <button
            key={seccion.categoria}
            className={`categoria-btn ${categoriaActiva === seccion.categoria ? "active" : ""}`}
            onClick={() => setCategoriaActiva(seccion.categoria)}
          >
            {seccion.categoria}
          </button>
        ))}
      </div>

      {/* Mostramos la sección activa */}
      {partidos.map(
        (seccion) =>
          categoriaActiva === seccion.categoria && (
            <div key={seccion.categoria} className="partidos-list">
              {seccion.partidos.map((partido) => (
                <div className="partido-card2" key={partido.id}>
                  <img src={partido.icono} alt="Icono liga" className="partido-icon" />

                  <div className="partido-details">
                    <div className="partido-info">
                      <img src={partido.escudo} alt="Escudo equipo" className="escudo-icon" />
                      <span className="jornada2">{partido.jornada}</span>
                      <span className="equipo">{partido.equipo}</span>
                    </div>
                  </div>

                  <div className="partido-footer">
                    <span className="fecha">{partido.fecha}</span>
                    <img 
                      src={partido.tipoPartido === "local" ? "src/photos/home.png" : "src/photos/plane.png"} 
                      alt={partido.tipoPartido} 
                      className="tipo-partido-icon" 
                    />
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
};

export default Calendario;
