import { useEffect, useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import "./Enciclopedia.css";

const positionOrder = {
  Portero: 1,
  Defensa: 2,
  Mediocentro: 3,
  Extremo: 4,
  Delantero: 5
};

function compareSeasons(first, second) {
  return String(second).localeCompare(String(first), "es", { numeric: true });
}

function sortPlayers(first, second) {
  const positionDifference = (positionOrder[first.position] || 99) - (positionOrder[second.position] || 99);
  if (positionDifference !== 0) return positionDifference;
  return (Number(first.number) || 99) - (Number(second.number) || 99);
}

export default function Enciclopedia() {
  const [players, setPlayers] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("jugadores")
        .select("*")
        .eq("team_type", "first_team")
        .order("season", { ascending: false })
        .order("number", { ascending: true });

      if (fetchError) {
        setPlayers([]);
        setError("No se ha podido cargar la enciclopedia de jugadores.");
        setLoading(false);
        return;
      }

      const squadPlayers = data || [];
      setPlayers(squadPlayers);
      setSelectedSeason((currentSeason) => {
        if (currentSeason && squadPlayers.some((player) => player.season === currentSeason)) return currentSeason;
        return [...new Set(squadPlayers.map((player) => player.season).filter(Boolean))].sort(compareSeasons)[0] || "";
      });
      setLoading(false);
    }

    fetchPlayers();
  }, []);

  const seasons = useMemo(
    () => [...new Set(players.map((player) => player.season).filter(Boolean))].sort(compareSeasons),
    [players]
  );

  const visiblePlayers = useMemo(
    () => players.filter((player) => player.season === selectedSeason).sort(sortPlayers),
    [players, selectedSeason]
  );

  return (
    <main className="encyclopedia-page">
      <header className="encyclopedia-header">
        <div>
          <h1>HISTORIAL ALAVESPEDIA</h1>
        </div>

        <label className="season-filter">
          <span>Temporada</span>
          <select
            value={selectedSeason}
            onChange={(event) => setSelectedSeason(event.target.value)}
            disabled={loading || seasons.length === 0}
          >
            {seasons.length === 0 ? (
              <option value="">Sin temporadas</option>
            ) : (
              seasons.map((season) => (
                <option value={season} key={season}>
                  {season}
                </option>
              ))
            )}
          </select>
        </label>
      </header>

      {loading && <div className="encyclopedia-state">Cargando cartas...</div>}
      {!loading && error && <div className="encyclopedia-state">{error}</div>}
      {!loading && !error && visiblePlayers.length === 0 && (
        <div className="encyclopedia-state">No hay cartas guardadas para esta temporada.</div>
      )}

      {!loading && !error && visiblePlayers.length > 0 && (
        <section className="player-card-grid" aria-label={`Cartas de jugadores ${selectedSeason}`}>
          {visiblePlayers.map((player) => (
            <article className="player-card-tile" key={player.id}>
              {player.card_url ? (
                <img src={player.card_url} alt={player.name} loading="lazy" />
              ) : (
                <div className="player-card-placeholder">
                  <UserRound />
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
