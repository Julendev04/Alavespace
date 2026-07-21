import React, { useState } from "react";
import "./Nosotros.css";
import { FaChevronLeft, FaChevronRight, FaFacebook, FaInstagram, FaTiktok, FaTwitch, FaTwitter, FaYoutube } from "react-icons/fa";
import julenLogo from "../assets/Branding/julen_logo.jpg";
import valorSlide1 from "../assets/SLIDE1.jpg";
import valorSlide2 from "../assets/SLIDE2.jpg";
import valorSlide3 from "../assets/SLIDE3.jpg";

const SobreNosotros = () => {

  const [valorActivo, setValorActivo] = useState(0);

  const proyectosValor = [
    {
      titulo: "Temporada 25/26",
      descripcion: "Nuevos formatos, mas analisis y una experiencia pensada para seguir al Glorioso de cerca.",
      imagen: valorSlide1,
    },
    {
      titulo: "Comunidad Alavesfera",
      descripcion: "Espacios para que la aficion participe, vote, compita y forme parte del proyecto.",
      imagen: valorSlide2,
    },
    {
      titulo: "Contenido multimedia",
      descripcion: "Piezas visuales, datos y narrativas propias para explicar mejor cada partido.",
      imagen: valorSlide3,
    },
  ];

  const socialStats = [
    { valor: "33K", etiqueta: "YouTube", icon: <FaYoutube /> },
    { valor: "9K", etiqueta: "Twitch", icon: <FaTwitch /> },
    { valor: "37K", etiqueta: "Twitter / X", icon: <FaTwitter /> },
    { valor: "32K", etiqueta: "Instagram", icon: <FaInstagram /> },
    { valor: "16K", etiqueta: "TikTok", icon: <FaTiktok /> },
    { valor: "5+", etiqueta: "Anos activos", icon: <FaFacebook /> },
  ];

  const cambiarValor = (direccion) => {
    setValorActivo((actual) => (actual + direccion + proyectosValor.length) % proyectosValor.length);
  };

  const proyectoActivo = proyectosValor[valorActivo];

  return (
    <div className="sobre-nosotros">

      {/* HERO */}
      <section className="hero">
        <h1>SOBRE NOSOTROS</h1>
        <p>Adéntrate y conócenos en nuestras profundidades</p>
      </section>

      {/* SECCIÓN SOBRE EL PROYECTO */}
      <section className="main-section">
        <div className="main-intro-grid">
          <div className="main-intro-copy">
            <h2>Alavesfera es Analisis, opinión e informaón</h2>
            <p>
              Alavesfera es un proyecto digital innovador que integra noticias actualizadas, datos en tiempo real, estadísticas detalladas de jugadores y contenido
              multimedia de alta calidad, ofreciendo a nuestra audiencia una experiencia informativa, dinámica y completamente accesible. Nuestro objetivo es
              proporcionar un espacio digital donde la información deportiva se presenta de manera clara, confiable y visualmente atractiva, fomentando la interacción
              y el conocimiento profundo de cada evento y desempeño dentro del mundo del fútbol.
            </p>
          </div>

        </div>
      </section>

      {/* SECCIÓN EL EQUIPO */}
      <section className="section">
        <h2>Hola! Déjame presentarme...</h2>
        <div className="team-profile">

          <div className="team-logo">
            <img src={julenLogo} alt="Julen Ruiz De Viñaspre" />
          </div>

          <div className="team-info">
            <h3>Julen Ruiz De Viñaspre</h3>
            <p>
              Ingeniero informático. Creador digital. Emprendedor. Más de 5 años de experiencia
      en la creación audiovisual y redes sociales. Mi labor es coordinar y aportar las
      herramientas tecnológicas y creativas para mejorar nuestra propuesta de valor.
      Hacer realidad las ideas. Responsable de diseño, producción audiovisual y tecnología
      de la información (TI).
            </p>
          </div>

        </div>
      </section>

      {/* SECCIÓN CONTADORES */}
      <section className="stats-band" aria-label="Contadores de redes sociales">
        <div className="stats-band-inner">
          {socialStats.map((stat) => (
            <div className="stat-item" key={stat.etiqueta}>
              <div className="stat-icon">{stat.icon}</div>
              <strong>{stat.valor}</strong>
              <span>{stat.etiqueta}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section value-section">
        <div className="section-heading-row">
          <h2>Nuestro valor</h2>
          <span>{valorActivo + 1}/{proyectosValor.length}</span>
        </div>

        <div className="value-carousel">
          <button className="value-arrow value-arrow-left" onClick={() => cambiarValor(-1)} aria-label="Proyecto anterior">
            <FaChevronLeft />
          </button>

          <div className="value-slide">
            <img src={proyectoActivo.imagen} alt={proyectoActivo.titulo} />
            <div className="value-slide-copy">
              <h3>{proyectoActivo.titulo}</h3>
              <p>{proyectoActivo.descripcion}</p>
            </div>
          </div>

          <button className="value-arrow value-arrow-right" onClick={() => cambiarValor(1)} aria-label="Proyecto siguiente">
            <FaChevronRight />
          </button>
        </div>
      </section>

    </div>
  );
};

export default SobreNosotros;
