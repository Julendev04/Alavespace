import React from "react";
import { FaFutbol, FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";


export default function HeroMatch({ mainMatch, matchStatus, timeLeft }) {
  return (
    <section className="home-hero">

      <div className="match-card1">
        <div className="match-bg"></div>

        <div className="competition">
          <FaFutbol />
          <span>{mainMatch?.competitions?.name} · Jornada {mainMatch?.week}</span>
        </div>

        <div className="teams">

          <div className="team-block">
            <img src={mainMatch?.home_logo} alt="" />
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
                🔴 EN DIRECTO
              </div>
            )}

            {matchStatus === "finished" && (
              <div className="match-status finished">
                {mainMatch?.home_score} - {mainMatch?.away_score}
              </div>
            )}

          </div>

          <div className="team-block">
            <img src={mainMatch?.away_logo} alt="" />
            <span>{mainMatch?.away_team}</span>
          </div>

        </div>

        <div className="details">
          <div>
            <FaCalendarAlt />
            <span>
              {mainMatch?.match_date
                ? new Date(mainMatch.match_date).toLocaleDateString("es-ES")
                : "-"}
            </span>
          </div>

          <div>
            <FaClock />
            {mainMatch?.match_date
              ? new Date(mainMatch.match_date).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "-"}
          </div>

          <div>
            <FaMapMarkerAlt />
            {mainMatch?.stadium}
          </div>
        </div>
      </div>

    </section>
  );
}