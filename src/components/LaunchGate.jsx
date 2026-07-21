import React, { useEffect, useMemo, useState } from "react";
import { Instagram, LockKeyhole, Podcast, Radio } from "lucide-react";
import "./LaunchGate.css";
import logo from "../assets/Branding/Logo2.png";

const LAUNCH_DATE = "2026-07-15T20:00:00+02:00";
const IVOOX_URL = "https://www.ivoox.com/";
const LAUNCH_BACKGROUND = "transp";

const getTimeLeft = () => {
  const distance = Math.max(new Date(LAUNCH_DATE).getTime() - Date.now(), 0);

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    isReady: distance === 0,
  };
};

function LaunchGate() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(
    () => [
      { label: "Dias", value: timeLeft.days },
      { label: "Horas", value: timeLeft.hours },
      { label: "Min", value: timeLeft.minutes },
      { label: "Seg", value: timeLeft.seconds },
    ],
    [timeLeft],
  );

  return (
    <main
      className={`launch-gate launch-gate--${LAUNCH_BACKGROUND}`}
      aria-label="Alavesfera prepara su lanzamiento"
    >
      <div className="launch-gate__grain" />
      <div className="launch-gate__cosmos" />
      <div className="launch-gate__stars launch-gate__stars--near" />
      <div className="launch-gate__stars launch-gate__stars--far" />
      <div className="launch-gate__shooting-stars" aria-hidden="true">
        <span className="launch-gate__shooting-star launch-gate__shooting-star--one" />
        <span className="launch-gate__shooting-star launch-gate__shooting-star--two" />
        <span className="launch-gate__shooting-star launch-gate__shooting-star--three" />
        <span className="launch-gate__shooting-star launch-gate__shooting-star--four" />
      </div>

      <section className="launch-gate__content">
        <div className="launch-gate__brand-row">
          <img src={logo} alt="Alavesfera" className="launch-gate__logo" />
          <span className="launch-gate__status">
            <LockKeyhole size={16} aria-hidden="true" />
            Acceso temporalmente cerrado
          </span>
        </div>

        <div className="launch-gate__copy">
          <h1>
            Algo se avecina en{" "}
            <span className="launch-gate__title-accent">
              la esfera más alavesista.
            </span>
          </h1>
          <p>
            Ultimos retoques antes del lanzamiento: una web mas rapida, mas viva
            y lista para seguir al Glorioso desde dentro.
          </p>
        </div>

        <div className="launch-gate__countdown" aria-live="polite">
          {countdown.map((item) => (
            <div className="launch-gate__time" key={item.label}>
              <strong>{String(item.value).padStart(2, "0")}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="launch-gate__footer">
          <a
            href="https://www.instagram.com/alavesfera/"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir Instagram de Alavesfera"
          >
            <Instagram size={16} aria-hidden="true" />
          </a>
          <a
            href={IVOOX_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir iVoox de Alavesfera"
          >
            <Podcast size={16} aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}

export default LaunchGate;
