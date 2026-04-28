import React from "react";
import "./Nosotros.css";
import { FaTwitter, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import julenLogo from "../assets/Branding/julen_logo.jpg";

const SobreNosotros = () => {

  const redes = [
    { nombre: "Twitter", icon: <FaTwitter />, seguidores: 12000, descripcion: "Tweets diarios sobre noticias y estadísticas." },
    { nombre: "Instagram", icon: <FaInstagram />, seguidores: 8500, descripcion: "Historias y publicaciones visuales de nuestros eventos." },
    { nombre: "Facebook", icon: <FaFacebook />, seguidores: 7000, descripcion: "Contenido general y enlaces a nuestras noticias." },
    { nombre: "YouTube", icon: <FaYoutube />, seguidores: 4500, descripcion: "Videos de análisis y highlights de partidos." },
  ];

  return (
    <div className="sobre-nosotros">

      {/* HERO */}
      <section className="hero">
        <h1>SOBRE NOSOTROS</h1>
        <p>Adéntrate y conócenos en nuestras profundidades</p>
      </section>

      {/* SECCIÓN SOBRE EL PROYECTO */}
      <section className="main-section">
        <h2>Alavesfera es Analisis, opinión e informaón</h2>
        <p>
          Alavesfera es un proyecto digital innovador que integra noticias actualizadas, datos en tiempo real, estadísticas detalladas de jugadores y contenido
          multimedia de alta calidad, ofreciendo a nuestra audiencia una experiencia informativa, dinámica y completamente accesible. Nuestro objetivo es
          proporcionar un espacio digital donde la información deportiva se presenta de manera clara, confiable y visualmente atractiva, fomentando la interacción
          y el conocimiento profundo de cada evento y desempeño dentro del mundo del fútbol.
        </p>
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

      {/* SECCIÓN NUESTRO CONTENIDO */}
      <section className="section social-section">
        <h2>Nuestro contenido</h2>
        <p>Mantenemos nuestras redes sociales activas y en constante crecimiento:</p>

        <div className="social-rows">
          {redes.map((red) => (
            <div key={red.nombre} className="social-card horizontal">
              <div className="social-icon">{red.icon}</div>
              <h3 className="social-name">{red.nombre}</h3>
              <p className="social-description">{red.descripcion}</p>
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(red.seguidores / 15000 * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="progress-text">{red.seguidores.toLocaleString()} seguidores</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default SobreNosotros;