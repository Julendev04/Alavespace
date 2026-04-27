// src/components/Footer.jsx
import React from "react";
import "./Footer.css";
import { Link } from 'react-router-dom';
import logo from "../assets/Branding/Logo.png"; // tu logo aquí

const Footer = () => {
  return (
    <footer className="footer">
      {/* Bloque superior más claro */}
      <div className="footer-extra">
{/* Fila 1: Logo + nombre + separador + redes */}
<div className="footer-row top-row">
  <div className="brand">
    <img src={logo} alt="Alavesfera Logo" className="footer-logo" />
    <span className="footer-name">Alavesfera</span>
  </div>

  <div className="separator">|</div>

  <div className="social-row">
    <a href="#"><img src="src/assets/RRSS/Discord.png" alt="Discord" /></a>
    <a href="#"><img src="src/assets/RRSS/Twitter.png" alt="Twitter" /></a>
    <a href="#"><img src="src/assets/RRSS/Instagram.png" alt="Instagram" /></a>
    <a href="#"><img src="src/assets/RRSS/Spotify.png" alt="Spotify" /></a>
  </div>
</div>

        {/* Fila 3: Categorías */}
        <div className="footer-row links-row">
          <div className="footer-column">
            <h4>Contacto</h4>
            <a href="#">alavesfera@gmail.com</a>
            <Link to="/contacto">Formulario de contacto</Link>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Aviso legal</a>
            <Link to="/politica-privacidad">Política de privacidad</Link>
            <a href="#">Política de cookies</a>
          </div>

          <div className="footer-column">
            <h4>Proyecto</h4>
            <Link to="/Nosotros">Conoce Alavesfera</Link>
            <a href="#">Sobre mí</a>
          </div>

          <div className="footer-column">
            <h4>Contenido</h4>
            <Link to="/notas">Evalúa al equipo</Link>
            <Link to="/porra">Precide al glorioso</Link>
            <Link to="/pizarra">Plantilla de tácticas</Link>
            <Link to="/lineup">Planifica tu equipo</Link>
          </div>
        </div>
      </div>

      {/* Bloque azul oscuro inferior */}
      <div className="footer-main">
        <p>© 2025 Alavesfera. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
