import React from "react";
import "./Contacto.css";

export default function ContactDashboard() {
  return (
    <div className="page-center">
      <div className="layout">
        <div className="contact-wrapper">
          <div className="contact-header">
            <h1>Envíanos un mensaje</h1>
            <p>Te respondremos lo más pronto posible</p>
          </div>

          <form className="contact-form">
            <div className="campo">
              <input type="text" placeholder="Name" />
            </div>

            <div className="campo">
              <input type="email" placeholder="Email" />
            </div>

            <div className="campo">
              <input type="text" placeholder="Subject" />
            </div>

            <div className="campo">
              <textarea placeholder="Message" rows="4"></textarea>
            </div>

            <button className="send-btn">Send Message</button>
          </form>
        </div>

        <div className="image-side"></div>
      </div>

      <div className="info-section">
        <div className="info-box">
          <div className="info-item">
            <h3>Comunicación general</h3>
            <p>comunicacion@atleticostats.es</p>
          </div>

          <div className="info-item">
            <h3>Publicidad y patrocinio</h3>
            <p>marketing@atleticostats.es</p>
          </div>

          <div className="info-item">
            <h3>Ubicación</h3>
            <p>Madrid, España</p>
          </div>
        </div>
      </div>
    </div>
  );
}