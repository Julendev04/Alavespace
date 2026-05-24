import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";

export default function Competitions({ username = "Usuario", now = new Date() }) {
  const navigate = useNavigate();

  const fecha = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });

  const hora = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid"
  });

  return (
    <section className="competitions-section">
      <div className="home-welcome-copy">
        <strong>
          Bienvenido <span>{username}</span> un dia mas a nuestra web!
        </strong>
        <time>{fecha} - {hora}h</time>
      </div>

      <div className="home-top-actions">
        <button
          type="button"
          className="competition-circle"
          onClick={() => navigate("/plantilla")}
        >
          <span className="circle-bg">
            <FaShieldAlt />
            <span>Nuestros equipos</span>
          </span>
        </button>
      </div>
    </section>
  );
}
