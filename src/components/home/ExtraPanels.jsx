import React from "react";
import { Shuffle } from "lucide-react";

const panels = [
  {
    className: "extra-panel-transfers",
    title: "Mercado",
    icon: Shuffle,
    action: "transfers"
  }
];

export default function ExtraPanels({ setShowTransfers }) {
  function handlePanelClick(action) {
    if (action === "transfers") setShowTransfers(true);
  }

  return (
    <section className="extra-info-section">
      <div className="extra-panels">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.title}
              type="button"
              className={`extra-panel ${panel.className}`}
              onClick={() => handlePanelClick(panel.action)}
            >
              <span className="panel-icon">
                <Icon size={18} />
              </span>
              <span className="panel-copy">
                <h3>{panel.title}</h3>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
