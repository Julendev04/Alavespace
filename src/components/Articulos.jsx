// components/Articulos.jsx
import React from "react";
import "./Articulos.css";

const Articulos = ({ titulo, fecha, autor, imagen, introduccion, contenido }) => {
  return (
    <article className="articulo">
      {/* Cabecera */}
      <div className="articulo-header">
        <div className="articulo-imagen">
          <img src={imagen} alt={titulo} />
        </div>

        <div className="articulo-info">
          <h1 className="articulo-titulo">{titulo}</h1>
          <p className="articulo-meta">
            {fecha} • {autor}
          </p>
          <p className="articulo-intro">{introduccion}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="articulo-contenido">
        {contenido.split("\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
};

export default Articulos;
