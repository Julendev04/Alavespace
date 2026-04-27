import React from "react";
import { useParams, Link } from "react-router-dom";
import "./Ficha.css";

// Datos de jugadores
const jugadores = [
  {
    id: 1,
    nombre: "Antonio Sivera",
    posicion: "Portero",
    edad: 29,
    altura: "170 cm",
    pie: "Izquierdo",
    dorsal: 1,
    equipo: "Deportivo Alavés",
    nacionalidad: "España",
    valor: "110 mil €",
    nacimiento: "7 oct 2005",
    imagen: "/CARTAS/SIVERA.png",
    estadisticas: {
      goles: 0,
      asistencias: 0,
      comenzado: 2,
      partidos: 5,
      minutos: 223,
      puntuacion: 6.63,
      amarillas: 1,
      rojas: 0,
    },
  },
  {
    id: 2,
    nombre: "Youssef Enriquez",
    posicion: "Lateral Izquierdo",
    edad: 20,
    altura: "170 cm",
    pie: "Izquierdo",
    dorsal: 3,
    equipo: "Deportivo Alavés",
    nacionalidad: "España",
    valor: "110 mil €",
    nacimiento: "7 oct 2005",
    imagen: "/CARTAS/YUSI.png",
    estadisticas: {
      goles: 0,
      asistencias: 0,
      comenzado: 2,
      partidos: 5,
      minutos: 223,
      puntuacion: 6.63,
      amarillas: 1,
      rojas: 0,
    },
  },
  {
    id: 3,
    nombre: "Denis Suárez",
    posicion: "Mediocentro",
    edad: 31,
    altura: "170 cm",
    pie: "Izquierdo",
    dorsal: 3,
    equipo: "Deportivo Alavés",
    nacionalidad: "España",
    valor: "110 mil €",
    nacimiento: "7 oct 2005",
    imagen: "/CARTAS/DENIS.png",
    estadisticas: {
      goles: 0,
      asistencias: 0,
      comenzado: 2,
      partidos: 5,
      minutos: 223,
      puntuacion: 6.63,
      amarillas: 1,
      rojas: 0,
    },
  },
];

const Ficha = () => {
  const { id } = useParams();
  const jugador = jugadores.find((j) => j.id === parseInt(id));

  if (!jugador) {
    return (
      <div className="ficha-error">
        <p>⚠️ Jugador no encontrado</p>
        <Link to="/" className="volver-btn">Volver al inicio</Link>
      </div>
    );
  }

  const stats = jugador.estadisticas;

  return (
    <div className="ficha-container">
      {/* CABECERA */}
      <div className="ficha-header">
        <div className="ficha-header-info">
          <img src={jugador.imagen} alt={jugador.nombre} className="ficha-foto" />
          <div>
            <h1>{jugador.nombre}</h1>
            <p className="equipo">{jugador.equipo}</p>
          </div>
        </div>
      </div>

      {/* INFO PRINCIPAL */}
      <div className="ficha-datos">
        <div className="columna">
          <p><strong>{jugador.altura}</strong><br />Altura</p>
          <p><strong>{jugador.dorsal}</strong><br />Camiseta</p>
          <p><strong>{jugador.edad} años</strong><br />{jugador.nacimiento}</p>
        </div>

        <div className="columna">
          <p><strong>{jugador.pie}</strong><br />Pie preferido</p>
          <p><strong>{jugador.nacionalidad}</strong><br />País</p>
          <p><strong>{jugador.valor}</strong><br />Valor de mercado</p>
        </div>

        <div className="columna posicion">
          <p><strong>Primaria</strong></p>
          <p className="posicion-texto">{jugador.posicion}</p>
          <div className="campo-posicion">LI</div>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="ficha-stats">
        <h3>LaLiga 2025/2026</h3>
        <div className="stats-grid">
          <div><strong>{stats.goles}</strong><p>Goles</p></div>
          <div><strong>{stats.asistencias}</strong><p>Asistencias</p></div>
          <div><strong>{stats.comenzado}</strong><p>Comenzado</p></div>
          <div><strong>{stats.partidos}</strong><p>Partidos</p></div>
          <div><strong>{stats.minutos}</strong><p>Minutos jugados</p></div>
          <div className="puntuacion">
            <strong>{stats.puntuacion}</strong><p>Puntuación</p>
          </div>
          <div><strong>{stats.amarillas}</strong><p>Tarjetas amarillas</p></div>
          <div><strong>{stats.rojas}</strong><p>Tarjetas rojas</p></div>
        </div>
      </div>

      <Link to="/" className="volver-btn">← Volver al inicio</Link>
    </div>
  );
};

export default Ficha;
