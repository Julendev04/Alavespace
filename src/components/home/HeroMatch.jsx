import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaFutbol, FaMapMarkerAlt } from "react-icons/fa";

function extractLogoColor(src, onColor) {
  if (!src) return;

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;

  image.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const size = 32;
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);

      const { data } = context.getImageData(0, 0, size, size);
      const colors = {};

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 120) continue;

        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);

        if (max > 235 || max < 35 || max - min < 28) continue;

        const key = `${Math.round(red / 18) * 18},${Math.round(green / 18) * 18},${Math.round(blue / 18) * 18}`;
        colors[key] = (colors[key] || 0) + max - min + 10;
      }

      const dominant = Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (dominant) onColor(`rgb(${dominant})`);
    } catch {
      // Keep the CSS fallback color if the logo cannot be sampled.
    }
  };
}

export default function HeroMatch({ mainMatch, matchStatus, timeLeft }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const matchDate = mainMatch?.match_date ? new Date(mainMatch.match_date) : null;

  function openMatchPreview() {
    if (!mainMatch?.id) return;
    navigate(`/partido/${mainMatch.id}`, { state: { match: mainMatch } });
  }

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    extractLogoColor(mainMatch?.home_logo, (color) => {
      card.style.setProperty("--home-team-color", color);
    });

    extractLogoColor(mainMatch?.away_logo, (color) => {
      card.style.setProperty("--away-team-color", color);
    });
  }, [mainMatch?.home_logo, mainMatch?.away_logo]);

  return (
    <section className="home-hero">
      <div className="match-card1" ref={cardRef}>
        <div className="match-bg"></div>
        <button
          className="hover-field home-side"
          type="button"
          onClick={openMatchPreview}
          aria-label={`Ver previa de ${mainMatch?.home_team} contra ${mainMatch?.away_team}`}
        ></button>
        <button
          className="hover-field away-side"
          type="button"
          onClick={openMatchPreview}
          aria-label={`Ver previa de ${mainMatch?.home_team} contra ${mainMatch?.away_team}`}
        ></button>
        <div className="team-glow home-side"></div>
        <div className="team-glow away-side"></div>

        <div className="hero-match-topline">
          <div className="competition">
            <FaFutbol />
            <span>{mainMatch?.competitions?.name} - Jornada {mainMatch?.week}</span>
          </div>
        </div>

        <div className="teams">
          <div className="team-block home-team">
            <div className="team-crest">
              <img src={mainMatch?.home_logo} alt={mainMatch?.home_team || ""} />
            </div>
            <span>{mainMatch?.home_team}</span>
          </div>

          <div className="vs-center">
            {matchStatus === "countdown_home" && (
              <div className="match-status countdown_home">
                {timeLeft}
              </div>
            )}

            {matchStatus === "live" && (
              <div className="match-status live">
                EN DIRECTO
              </div>
            )}

            {matchStatus === "finished" && (
              <div className="match-status finished">
                {mainMatch?.home_score} - {mainMatch?.away_score}
              </div>
            )}
          </div>

          <div className="team-block away-team">
            <span>{mainMatch?.away_team}</span>
            <div className="team-crest">
              <img src={mainMatch?.away_logo} alt={mainMatch?.away_team || ""} />
            </div>
          </div>
        </div>

        <div className="details">
          <div>
            <FaCalendarAlt />
            <span>{matchDate ? matchDate.toLocaleDateString("es-ES") : "-"}</span>
          </div>

          <div>
            <FaClock />
            <span>
              {matchDate
                ? matchDate.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "-"}
            </span>
          </div>

          <div>
            <FaMapMarkerAlt />
            <span>{mainMatch?.stadium}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
