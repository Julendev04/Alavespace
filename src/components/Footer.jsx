// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import logo from "../assets/Branding/Logo.png";
import discord from "../assets/RRSS/Discord.png";
import twitter from "../assets/RRSS/Twitter.png";
import instagram from "../assets/RRSS/Instagram.png";
import spotify from "../assets/RRSS/Spotify.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-extra">
        <div className="footer-row top-row">
          <div className="brand">
            <img src={logo} alt="Alavesfera Logo" className="footer-logo" />
            <span className="footer-name">Alavesfera</span>
          </div>

          <div className="separator">|</div>

          <div className="social-row">
            <a href="#"><img src={discord} alt="Discord" /></a>
            <a href="https://x.com/Alavesfera"><img src={twitter} alt="Twitter" /></a>
            <a href="https://www.instagram.com/alavesfera_oficial/?next=%2F"><img src={instagram} alt="Instagram" /></a>
            <a href="https://www.youtube.com/@AlavesferaTV"><img src={spotify} alt="Youtube" /></a>
          </div>
        </div>

        <div className="footer-row links-row">
          <div className="footer-column">
            <h4>Contacto</h4>
            <a href="mailto:alavesfera@gmail.com">alavesfera@gmail.com</a>
            <Link to="/contacto">Formulario de contacto</Link>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Aviso legal</a>
            <Link to="/politica-privacidad">Politica de privacidad</Link>
            <a href="/coockies">Politica de cookies</a>
          </div>

          <div className="footer-column footer-dropdown-column">
            <h4>Contenido</h4>
            <Link to="/notas">Evalua al equipo</Link>
            <Link to="/porra">Predice al glorioso</Link>
            <Link to="/pizarra">Plantilla de tacticas</Link>
            <Link to="/lineup">Planifica tu equipo</Link>
          </div>
        </div>
      </div>

      <div className="footer-main">
        <p>© 2025 Alavesfera. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
