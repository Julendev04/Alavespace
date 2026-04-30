import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import TransfersAdminPanel from "./TransfersAdminPanel";

export default function TransfersPanel({ showTransfers, setShowTransfers, isAdmin }) {

    // 🔥 FILTROS
    const [teamFilter, setTeamFilter] = useState("all");
    const [positionFilter, setPositionFilter] = useState("all");
    const [probFilter, setProbFilter] = useState("all");

    // 🔥 DATA
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showAdmin, setShowAdmin] = useState(false);

    // ⏱ tiempo relativo
    function getTimeAgo(timestamp) {
        const diff = Math.floor((Date.now() - timestamp) / 1000);

        const mins = Math.floor(diff / 60);
        const hours = Math.floor(diff / 3600);

        if (mins < 60) return `${mins} min ago`;
        return `${hours} h ago`;
    }

    // 🔄 FETCH DATA
    const fetchTransfers = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("transfers")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Error fetching transfers:", error);
        } else {
            setTransfers(data || []);
        }

        setLoading(false);
    };

    // 🚀 CARGA INICIAL
    useEffect(() => {
        if (showTransfers) {
            fetchTransfers();
        }
    }, [showTransfers]);

    // ⚡ REALTIME
    useEffect(() => {
        const channel = supabase
            .channel("transfers-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "transfers" },
                () => {
                    fetchTransfers(); // 🔥 refresca en tiempo real
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 🔍 FILTRADO
    const filteredTransfers = useMemo(() => {
        return transfers.filter(t => {
            return (
                (teamFilter === "all" || t.team === teamFilter) &&
                (positionFilter === "all" || t.position === positionFilter) &&
                (probFilter === "all" || t.probability === probFilter)
            );
        });
    }, [teamFilter, positionFilter, probFilter, transfers]);

    // 🎯 FILTROS DINÁMICOS
    const teams = [...new Set(transfers.map(t => t.team))];
    const positions = [...new Set(transfers.map(t => t.position))];
    const probabilities = [...new Set(transfers.map(t => t.probability))];

    if (!showTransfers) return null;

    return (
        <div className="simulator-overlay">
            <div className="simulator-modal">

                {/* ❌ CERRAR */}
                <button
                    className="close-btn"
                    onClick={() => setShowTransfers(false)}
                >
                    ✕
                </button>

                <h2 style={{ marginTop: "-5px", marginBottom: "10px" }}>
                    Nuestro mercado de Transferencias
                </h2>

                {showAdmin && (
                    <div className="admin-panel-wrapper">
                        <TransfersAdminPanel />
                    </div>
                )}


                {/* 🔍 FILTROS */}
                <div className="transfers-filters">

                    <select onChange={(e) => setTeamFilter(e.target.value)}>
                        <option value="all">All Teams</option>
                        {teams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>

                    <select onChange={(e) => setPositionFilter(e.target.value)}>
                        <option value="all">All Positions</option>
                        {positions.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>

                    <select onChange={(e) => setProbFilter(e.target.value)}>
                        <option value="all">All Probabilities</option>
                        {probabilities.map(prob => (
                            <option key={prob} value={prob}>{prob}</option>
                        ))}
                    </select>
                    {isAdmin && (
                        <button
                            className="admin-btn"
                            onClick={() => setShowAdmin(true)}
                        >
                            ⚙️ Admin
                        </button>
                    )}

                </div>

                <div className="transfers-table-wrapper">

                    {loading ? (
                        <p style={{ textAlign: "center" }}>
                            Loading transfers...
                        </p>
                    ) : (
                        <table className="transfers-table">

                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Team</th>
                                    <th>Pos</th>
                                    <th>Value</th>
                                    <th>Source</th>
                                    <th>Updated</th>
                                    <th>Prob</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTransfers.map((t) => (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{t.team}</td>
                                        <td>{t.position}</td>
                                        <td>{t.value}</td>
                                        <td>{t.source}</td>

                                        <td className="updated">
                                            {getTimeAgo(new Date(t.updated_at).getTime())}
                                        </td>

                                        <td>
                                            <span className={`prob ${t.probability.toLowerCase()}`}>
                                                {t.probability}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`status ${t.status.toLowerCase()}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    )}

                </div>

            </div>
        </div>
    );
}