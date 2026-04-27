import React, { useState, useEffect, useRef } from "react";
import "./Landing.css";
import { initParticles } from "/src/Pages/particles.js";
import { FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

const Landing = () => {
  // ✅ Fecha fija (no se recalcula en cada render)
  const launchDateRef = useRef(
    new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).getTime()
  );

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [displayText, setDisplayText] = useState("");

  const messages = ["Coming soon", "Muy pronto"];

  // ✅ refs para typing (no se reinician)
  const messageIndex = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);

  // ⏳ Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDateRef.current - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / 1000 / 60) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🎇 Particles
  useEffect(() => {
    initParticles();
  }, []);

  // ✍️ Typing effect
  useEffect(() => {
    const typingInterval = setInterval(() => {
      const currentMsg = messages[messageIndex.current];

      if (!deleting.current) {
        charIndex.current++;

        if (charIndex.current <= currentMsg.length) {
          setDisplayText(currentMsg.slice(0, charIndex.current));
        } else {
          deleting.current = true;
        }
      } else {
        charIndex.current--;

        if (charIndex.current >= 0) {
          setDisplayText(currentMsg.slice(0, charIndex.current));
        } else {
          deleting.current = false;
          messageIndex.current =
            (messageIndex.current + 1) % messages.length;
        }
      }
    }, 120);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <section className="landing">
      <canvas id="particlesCanvas" className="particles-canvas"></canvas>

      <div className="content">
        <div className="logo-wrapper">
          <img src="/src/assets/Branding/Logo2.png" className="logo" />
        </div>
        <p className="typing">{displayText}</p>

        <h1 className="title">ALAVESFERA</h1>
        <p className="subtitle">
          Próximamente. La revolución digital del Glorioso.
        </p>

        <div className="countdown">
          <div>
            <span>{timeLeft.days}</span>
            <p>Días</p>
          </div>
          <div>
            <span>{timeLeft.hours}</span>
            <p>Horas</p>
          </div>
          <div>
            <span>{timeLeft.minutes}</span>
            <p>Minutos</p>
          </div>
          <div>
            <span>{timeLeft.seconds}</span>
            <p>Segundos</p>
          </div>
        </div>
        <div className="socials">
          <a
            href="https://instagram.com/alavesfera_oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
          >
            <FaInstagram />
            <span>@ALAVESFERA_OFICIAL</span>
          </a>

          <a
            href="https://twitter.com/alavesfera"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
          >
            <FaTwitter />
            <span>@ALAVESFERA</span>
          </a>

          <a
            href="https://youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
          >
            <FaYoutube />
            <span>ALAVESFERA TV</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Landing;