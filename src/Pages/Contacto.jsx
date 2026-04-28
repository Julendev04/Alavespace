import React from "react";
import "./Contacto.css";
import anuncioFlyer from "../assets/anuncioFlyer.jpg";

export default function ContactDashboard() {
  return (
    <div className="contact-page">
      {/* LEFT IMAGE */}
      <div className="contact-left">
        <img src={anuncioFlyer} alt="contact" />
      </div>

      {/* RIGHT FORM */}
      <div className="contact-right">
        <div className="contact-content">
          <div className="contact-header">
            <h2>Envíanos un mensaje</h2>
            <p>Te responderemos lo antes posible</p>
          </div>

          <form className="contact-form">
            <div className="form-row">
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
            </div>

            <input type="text" placeholder="Subject" />

            {/* SELECT */}
            <select className="contact-select" defaultValue="">
              <option value="" disabled>
                Tipo de consulta
              </option>
              <option value="colaboracion">Propuesta de colaboración</option>
              <option value="publicidad">Publicidad y patrocinio</option>
              <option value="prensa">Prensa y medios</option>
              <option value="contenido">Solicitud de contenido</option>
              <option value="otro">Otro</option>
            </select>

            <textarea placeholder="Message" rows="6"></textarea>

            <button className="send-btn">Send Message</button>
          </form>

          <div className="contact-info">
            <div>
              <h4>General</h4>
              <p>comunicacion@atleticostats.es</p>
            </div>

            <div>
              <h4>Marketing</h4>
              <p>marketing@atleticostats.es</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}