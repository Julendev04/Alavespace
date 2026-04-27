import React, { useState } from "react";
import "./Noticiero.css";

const Noticiero = () => {
  const [filtro, setFiltro] = useState("todas");
  const [overlayNoticia, setOverlayNoticia] = useState(null);

  const noticias = [
    {
      id: 1,
      categoria: "primer",
      titulo: "Kostis sufre una rotura en el ligamento cruzado anterior izquierdo",
      descripcion:
        "El defensa del Glorioso estará de baja varios meses tras lesionarse en un entrenamiento.",
      fecha: "11 octubre 2025",
      etiqueta: "Lesión",
      imagen: "src/photos/FONDO.jpg",
    },
    {
      id: 2,
      categoria: "primer",
      titulo: "El Alavés prepara el derbi con máxima intensidad",
      descripcion:
        "Mendizorroza respira ambiente grande en la previa del encuentro ante la Real Sociedad.",
      fecha: "12 octubre 2025",
      etiqueta: "Noticia",
      imagen: "src/photos/FONDO.jpg",
    },
    {
      id: 3,
      categoria: "academia",
      titulo: "El Miniglorias golea y convence",
      descripcion:
        "El filial se impone con autoridad en Ibaia y se acerca a los puestos de playoff.",
      fecha: "10 octubre 2025",
      etiqueta: "Partido",
      imagen: "src/photos/FONDO.jpg",
    },
    {
      id: 4,
      categoria: "femenino",
      titulo: "Carla: 'El equipo está creciendo cada semana'",
      descripcion:
        "Declaraciones de la capitana tras la gran victoria en casa frente al Zaragoza CFF.",
      fecha: "9 octubre 2025",
      etiqueta: "Declaraciones",
      imagen: "src/photos/FONDO.jpg",
    },
    {
      id: 5,
      categoria: "primer",
      titulo: "El Glorioso lanza nueva equipación solidaria",
      descripcion:
        "Parte de los beneficios irán destinados a proyectos sociales en Vitoria-Gasteiz.",
      fecha: "8 octubre 2025",
      etiqueta: "Info",
      imagen: "src/photos/FONDO.jpg",
    },
  ];

  const categorias = [
    { id: "todas", texto: "Todas", color: "#002f87" },
    { id: "primer", texto: "Primer Equipo", color: "#c40000" },
    { id: "academia", texto: "Cantera", color: "#0033aa" },
    { id: "femenino", texto: "Femenino", color: "#00a6d6" },
  ];

  const colorCategoria = {
    primer: "#c40000",
    academia: "#0033aa",
    femenino: "#00a6d6",
  };

  const nombreCategoria = {
    primer: "Primer Equipo",
    academia: "Cantera",
    femenino: "Femenino",
  };

  const coloresEtiquetas = {
    Info: "#002f87",
    Noticia: "#00a6d6",
    Lesión: "#c40000",
    Declaraciones: "#ffb300",
    Dato: "#4caf50",
    Partido: "#ff5722",
  };

  const noticiasFiltradas = noticias.filter(
    (n) => filtro === "todas" || n.categoria === filtro
  );

  return (
    <section className="noticiero-modern">
      <h1 className="noticiero-titulo">EL NOTICIERO</h1>

      {/* Menú de categorías ancho igual al carrusel */}
      <div className="filtros-wrapper">
        <div className="filtros-modern">
          {categorias.map((c) => (
            <button
              key={c.id}
              className={`filtro-modern ${filtro === c.id ? "activo" : ""}`}
              onClick={() => setFiltro(c.id)}
            >
              <span
                className="filtro-dot"
                style={{ backgroundColor: c.color }}
              ></span>
              {c.texto}
            </button>
          ))}
        </div>
      </div>

      {/* Mostrar carrusel o grid según categoría */}
      {filtro === "todas" ? (
        <div className="carrusel-continuo">
          <div className="carrusel-inner">
            {[...noticiasFiltradas, ...noticiasFiltradas].map((n, i) => (
              <div
                key={i}
                className="noticia-tarjeta"
                onClick={() => setOverlayNoticia(n)}
              >
                <img src={n.imagen} alt={n.titulo} className="noticia-img" />

                <div className="noticia-overlay">
                  <span
                    className="noticia-categoria"
                    style={{ color: colorCategoria[n.categoria] }}
                  >
                    ● {nombreCategoria[n.categoria]}
                  </span>

                  <span
                    className="noticia-etiqueta"
                    style={{ backgroundColor: coloresEtiquetas[n.etiqueta] }}
                  >
                    {n.etiqueta}
                  </span>

                  <h3>{n.titulo}</h3>
                  <p>{n.descripcion}</p>
                  <span className="noticia-fecha">{n.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="noticias-grid">
          {noticiasFiltradas.map((n) => (
            <div
              key={n.id}
              className="noticia-tarjeta"
              onClick={() => setOverlayNoticia(n)}
            >
              <img src={n.imagen} alt={n.titulo} className="noticia-img" />
              <div className="noticia-overlay">
                <span
                  className="noticia-categoria"
                  style={{ color: colorCategoria[n.categoria] }}
                >
                  ● {nombreCategoria[n.categoria]}
                </span>
                <span
                  className="noticia-etiqueta"
                  style={{ backgroundColor: coloresEtiquetas[n.etiqueta] }}
                >
                  {n.etiqueta}
                </span>
                <h3>{n.titulo}</h3>
                <p>{n.descripcion}</p>
                <span className="noticia-fecha">{n.fecha}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overlay */}
      {overlayNoticia && (
        <div className="overlay-fondo" onClick={() => setOverlayNoticia(null)}>
          <div className="overlay-central" onClick={(e) => e.stopPropagation()}>
            <img
              src={overlayNoticia.imagen}
              alt={overlayNoticia.titulo}
              className="overlay-img"
            />
            <h3>{overlayNoticia.titulo}</h3>
            <p>{overlayNoticia.descripcion}</p>
            <span className="noticia-fecha">{overlayNoticia.fecha}</span>
            <button
              className="overlay-cerrar"
              onClick={() => setOverlayNoticia(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Noticiero;
