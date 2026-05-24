import React from "react";

export default function ExtraPanels({ setShowSimulator, setShowTransfers }) {
  return (
    <section className="extra-info-section">
      <div className="extra-panels">
        <div
          className="extra-panel extra-panel-simulator"
          onClick={() => setShowSimulator(true)}
        >
          <h3>Simula la temporada</h3>
        </div>

        <div className="extra-panel extra-panel-form">
          <h3>Estado de forma</h3>
        </div>

        <div className="extra-panel extra-panel-injuries">
          <h3>Lesiones</h3>
        </div>

        <div
          className="extra-panel extra-panel-transfers"
          onClick={() => setShowTransfers(true)}
        >
          <h3>Mercado</h3>
        </div>
      </div>
    </section>
  );
}
