import React from "react";
export default function UpdatesSection() {

  return (
    <section className="updates-section">

      <div className="updates-container">

        <h2>Mejoras en la web</h2>

        <div className="updates-table">

          <div className="updates-row header">
            <span className="col date">Fecha</span>
            <span className="col update">Actualización</span>
          </div>

          <div className="updates-row">
            <span className="col date">07/04/2026</span>
            <span className="col update">
              Nueva sección de enciclopedia de jugadores con filtros avanzados.
            </span>
          </div>

          <div className="updates-row">
            <span className="col date">05/04/2026</span>
            <span className="col update">
              Rediseño del módulo de próximos partidos.
            </span>
          </div>

          <div className="updates-row">
            <span className="col date">02/04/2026</span>
            <span className="col update">
              Optimización del sistema de noticias.
            </span>
          </div>

          <div className="updates-row">
            <span className="col date">30/03/2026</span>
            <span className="col update">
              Mejora de rendimiento general.
            </span>
          </div>

        </div>

      </div>

    </section>
  );
}