import React from "react";

export default function ExtraPanels({ setShowSimulator, setShowTransfers }) {
  return (
    <section className="extra-info-section">
      <div className="extra-panels">

        <div
          className="extra-panel"
          onClick={() => setShowSimulator(true)}
        >
          <h3>Simula la temporada</h3>
          <span className="panel-icon">⚽</span>
          <p>
            Pon tus resultados y nuestra clasificación ideal hace la mágia.
          </p>
        </div>

        <div className="extra-panel">
          <h3>Team Form</h3>
          <span className="panel-icon">📈</span>
          <p>
            Recent performance and match results analysis.
          </p>
        </div>

        <div className="extra-panel">
          <h3>Injuries</h3>
          <span className="panel-icon">🩹</span>
          <p>
            Latest injury updates and player availability.
          </p>
        </div>

        <div
          className="extra-panel"
          onClick={() => setShowTransfers(true)}
        >
          <h3>Transfers</h3>
          <span className="panel-icon">🔄</span>
          <p>
            Recent transfer news and rumours.
          </p>
        </div>

      </div>
    </section>
  );
}