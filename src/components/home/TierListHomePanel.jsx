import React from "react";
import { ArrowUpRight, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";

const previewTiers = ["S", "A", "B", "C"];

export default function TierListHomePanel() {
  return (
    <Link to="/tierlist" className="tierlist-home-panel" aria-label="Abrir tierlist de jugadores">
      <span className="tierlist-home-copy">
        <strong>Tierlist de jugadores</strong>
        <span>Clasifica la plantilla a tu manera.</span>
      </span>

      <span className="tierlist-home-board" aria-hidden="true">
        {previewTiers.map((tier, index) => (
          <span key={tier} className={`tierlist-home-row tier-${index + 1}`}>
            <em>{tier}</em>
            <i />
            <i />
            <GripVertical size={15} />
          </span>
        ))}
      </span>

      <ArrowUpRight className="tierlist-home-arrow" size={22} aria-hidden="true" />
    </Link>
  );
}
