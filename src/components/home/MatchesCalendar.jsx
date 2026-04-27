import React, { useRef, useEffect } from "react";
import { FaMouse } from "react-icons/fa";

export default function MatchesCalendar({ matches = [] }) {

    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handler = (e) => {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener("wheel", handler, { passive: false });

        return () => el.removeEventListener("wheel", handler);
    }, []);

    return (
        <div className="matches-calendar full-width">

            {/* HEADER */}
            <div className="matches-header">
                <h2>Próximos partidos</h2>

                <div className="scroll-indicator">
                    <FaMouse />
                    <span>Scroll</span>
                </div>
            </div>

            {/* GRID HORIZONTAL */}
            <div className="matches-grid" ref={ref}>

                {matches.map((match) => (
                    <div key={match.id} className="match-card-mini">

                        {/* COMPETICIÓN */}
                        {match.competitions?.logo_url && (
                            <div className="match-competition">
                                <img
                                    src={match.competitions.logo_url}
                                    alt={match.competitions?.name || "Competición"}
                                    loading="lazy"
                                />
                            </div>
                        )}

                        {/* JORNADA + EQUIPOS */}
                        <div className="match-teams-vertical">
                            <span className="match-teams">
                                Jornada {match.week}
                            </span>

                            <div>{match.home_team}</div>
                            <div>{match.away_team}</div>
                        </div>

                        {/* FECHA Y HORA */}
                        <span className="match-datetime">
                            {new Date(match.match_date).toLocaleDateString()} ·{" "}
                            {new Date(match.match_date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                        </span>

                    </div>
                ))}

            </div>
        </div>
    );
}