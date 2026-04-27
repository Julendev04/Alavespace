import React from "react";
import { useNavigate } from "react-router-dom";

export default function Competitions() {
  const navigate = useNavigate();

  const competitions = [
    { name: "Nuestros equipos", img: "src/assets/Competiciones/IconoLiga.png", route: "/plantilla" },
  ];

  return (
    <section className="competitions-section">
      {competitions.map((comp, i) => (
        <div key={i} className="competition-circle" onClick={() => navigate(comp.route)}>
          <div className="circle-bg">
            <img src={comp.img} alt={comp.name} />
            <span>{comp.name}</span>
          </div>
        </div>
      ))}
    </section>
  );
}