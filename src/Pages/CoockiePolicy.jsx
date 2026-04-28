import React from "react";
import "./CoockiePolicy.css";

export default function CookiePolicy() {
  return (
    <div className="cp-container">
      <div className="cp-card">
        <header className="cp-header">
          <h1 className="cp-title">Política de Cookies</h1>
          <p className="cp-last-updated">Última actualización: Abril 2026</p>
        </header>

        <section className="cp-section">
          <h2 className="cp-subtitle">Identificación del responsable</h2>
          <div className="cp-info-block">
            <p><span>Titular:</span> AGENCIA DIGITAL ASTATIK, S.L.</p>
            <p><span>Nombre comercial:</span> ATLÉTICO STATS</p>
            <p><span>C.I.F.:</span> B26621318</p>
            <p><span>E-mail:</span> comunicacion@atleticostats.es</p>
          </div>
        </section>

        <section className="cp-section">
          <h2 className="cp-subtitle">¿Qué son las cookies?</h2>
          <p className="cp-text">
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo
            al visitar un sitio web. Se utilizan para mejorar la experiencia del usuario,
            recordar preferencias y analizar el uso del sitio.
          </p>
        </section>

        <section className="cp-section">
          <h2 className="cp-subtitle">Tipos de cookies utilizadas</h2>

          <div className="cp-table-wrapper">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                  <th>Gestión</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Técnicas</td>
                  <td>Funcionamiento básico del sitio</td>
                  <td>Sesión</td>
                  <td>Propias</td>
                </tr>
                <tr>
                  <td>Analíticas</td>
                  <td>Análisis de comportamiento de usuarios</td>
                  <td>Hasta 24 meses</td>
                  <td>Terceros</td>
                </tr>
                <tr>
                  <td>Personalización</td>
                  <td>Preferencias de usuario</td>
                  <td>12 meses</td>
                  <td>Propias</td>
                </tr>
                <tr>
                  <td>Marketing</td>
                  <td>Publicidad y medición de campañas</td>
                  <td>Variable</td>
                  <td>Terceros</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="cp-section">
          <h2 className="cp-subtitle">Finalidad del uso de cookies</h2>
          <p className="cp-text">
            Utilizamos cookies para garantizar el correcto funcionamiento del sitio web,
            mejorar la experiencia de navegación, analizar el tráfico y optimizar nuestros servicios.
          </p>
        </section>

        <section className="cp-section">
          <h2 className="cp-subtitle">Gestión de cookies</h2>
          <p className="cp-text">
            El usuario puede aceptar, rechazar o configurar el uso de cookies mediante su navegador.
            También puede eliminarlas en cualquier momento desde la configuración del dispositivo.
          </p>
        </section>

        <section className="cp-section">
          <h2 className="cp-subtitle">Cookies de terceros</h2>
          <p className="cp-text">
            Este sitio puede utilizar servicios de terceros como herramientas de analítica o
            servicios externos que instalan cookies ajenas al control del titular del sitio web.
          </p>
        </section>

        <section className="cp-section">
          <h2 className="cp-subtitle">Actualización de la política</h2>
          <p className="cp-text">
            Esta política puede actualizarse en cualquier momento para adaptarse a cambios
            normativos o técnicos. Se recomienda revisarla periódicamente.
          </p>
        </section>
      </div>
    </div>
  );
}