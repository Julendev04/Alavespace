import { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaFutbol,
  FaHandPaper,
  FaRunning,
  FaShieldAlt,
  FaUsers
} from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./LaLigaGuide.css";

const GUIDE_SEASON = "2026/27";
const PLAYER_PHOTOS_BUCKET = "laliga-player-photos";
const PLAYER_POSITIONS = [
  { value: "goalkeeper", label: "Porteros" },
  { value: "defender", label: "Defensas" },
  { value: "midfielder", label: "Medios" },
  { value: "forward", label: "Delanteros" }
];
const PLAYER_FILTER_OPTIONS = [
  { value: "all", label: "Todos", icon: FaUsers },
  { value: "goalkeeper", label: "Porteros", icon: FaHandPaper },
  { value: "defender", label: "Defensas", icon: FaShieldAlt },
  { value: "midfielder", label: "Medios", icon: FaFutbol },
  { value: "forward", label: "Delanteros", icon: FaRunning }
];
const initialPlayerForm = {
  name: "",
  teamId: "",
  country: "",
  position: "forward",
  photoFile: null
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter((word) => !["de", "la", "cf", "fc", "rcd", "ud", "ca"].includes(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

function formatCapacity(capacity) {
  if (!capacity) return "Por confirmar";
  return new Intl.NumberFormat("es-ES").format(capacity);
}

export default function LaLigaGuide() {
  const [searchParams] = useSearchParams();
  const requestedTeamSlug = searchParams.get("equipo");
  const [teams, setTeams] = useState([]);
  const [playersByTeam, setPlayersByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [brokenCrests, setBrokenCrests] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerForm, setPlayerForm] = useState(initialPlayerForm);
  const [playerMessage, setPlayerMessage] = useState("");
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [activePosition, setActivePosition] = useState("all");

  useEffect(() => {
    async function fetchGuideData() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("laliga_guide_teams")
        .select("*")
        .eq("season", GUIDE_SEASON)
        .order("sort_order", { ascending: true });

      if (fetchError) {
        setTeams([]);
        setError("No se han podido cargar los equipos de LaLiga.");
        setLoading(false);
        return;
      }

      const guideTeams = data || [];
      setTeams(guideTeams);

      if (guideTeams.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from("laliga_guide_players")
          .select("*")
          .in("team_id", guideTeams.map((team) => team.id))
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (!playersError) {
          setPlayersByTeam(groupPlayersByTeam(playersData || []));
        }
      }

      setLoading(false);
    }

    fetchGuideData();
  }, []);

  useEffect(() => {
    async function fetchAdminStatus() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    }

    fetchAdminStatus();
  }, []);

  useEffect(() => {
    if (!requestedTeamSlug || teams.length === 0) return;

    const requestedTeam = teams.find((team) => team.slug === requestedTeamSlug);
    if (requestedTeam && selectedTeam?.id !== requestedTeam.id) {
      setSelectedTeam(requestedTeam);
    }
  }, [requestedTeamSlug, selectedTeam?.id, teams]);

  useEffect(() => {
    if (!selectedTeam) return undefined;
    setPlayerForm((current) => ({ ...current, teamId: selectedTeam.id }));
    setPlayerMessage("");
    setActivePosition("all");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedTeam(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedTeam]);

  const selectedTeamPlayers = selectedTeam ? playersByTeam[selectedTeam.id] || [] : [];
  const filteredTeamPlayers = activePosition === "all"
    ? selectedTeamPlayers
    : selectedTeamPlayers.filter((player) => player.position === activePosition);
  const visiblePlayerCards = filteredTeamPlayers.length > 1
    ? [...filteredTeamPlayers, ...filteredTeamPlayers]
    : filteredTeamPlayers;
  const activePositionIndex = Math.max(
    0,
    PLAYER_FILTER_OPTIONS.findIndex((position) => position.value === activePosition)
  );
  const activePositionOption = PLAYER_FILTER_OPTIONS[activePositionIndex] || PLAYER_FILTER_OPTIONS[0];
  const ActivePositionIcon = activePositionOption.icon || FaFutbol;

  function rotatePosition(direction) {
    const nextIndex =
      (activePositionIndex + direction + PLAYER_FILTER_OPTIONS.length) % PLAYER_FILTER_OPTIONS.length;

    setActivePosition(PLAYER_FILTER_OPTIONS[nextIndex].value);
  }

  async function handleCreatePlayer(event) {
    event.preventDefault();
    if (!isAdmin || isSavingPlayer) return;

    const cleanName = playerForm.name.trim();
    const cleanCountry = playerForm.country.trim();
    const cleanPosition = playerForm.position || "forward";
    const teamId = playerForm.teamId || selectedTeam?.id;

    if (!cleanName || !teamId || !playerForm.photoFile) {
      setPlayerMessage("Completa nombre, equipo y foto del jugador.");
      return;
    }

    setIsSavingPlayer(true);
    setPlayerMessage("");

    const safeName = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const extension = playerForm.photoFile.name.split(".").pop() || "png";
    const filePath = `${teamId}/${Date.now()}-${safeName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PLAYER_PHOTOS_BUCKET)
      .upload(filePath, playerForm.photoFile, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      setPlayerMessage("No se ha podido subir la foto.");
      setIsSavingPlayer(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PLAYER_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    const currentTeamPlayers = playersByTeam[teamId] || [];
    const { data: createdPlayer, error: insertError } = await supabase
      .from("laliga_guide_players")
      .insert({
        team_id: teamId,
        name: cleanName,
        country: cleanCountry || null,
        position: cleanPosition,
        photo_url: publicUrlData.publicUrl,
        photo_path: filePath,
        sort_order: currentTeamPlayers.length + 1
      })
      .select("*")
      .single();

    if (insertError) {
      await supabase.storage.from(PLAYER_PHOTOS_BUCKET).remove([filePath]);
      setPlayerMessage("No se ha podido guardar la carta.");
      setIsSavingPlayer(false);
      return;
    }

    setPlayersByTeam((current) => ({
      ...current,
      [teamId]: [...(current[teamId] || []), createdPlayer]
    }));
    setPlayerForm({ ...initialPlayerForm, teamId });
    setPlayerMessage("Carta creada correctamente.");
    setIsSavingPlayer(false);
  }

  return (
    <main className="laliga-guide-page">
      {loading && <div className="laliga-guide-state">Cargando equipos...</div>}
      {!loading && error && <div className="laliga-guide-state">{error}</div>}
      {!loading && !error && teams.length === 0 && (
        <div className="laliga-guide-state">No hay equipos configurados para esta temporada.</div>
      )}

      {!loading && !error && teams.length > 0 && (
        <section className="laliga-team-grid" aria-label="Equipos de LaLiga">
          {teams.map((team) => (
            <button
              className="laliga-team-card"
              key={team.id}
              type="button"
              style={{
                "--team-primary": team.primary_color,
                "--team-secondary": team.secondary_color
              }}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="laliga-crest-wrap">
                {team.logo_url && !brokenCrests[team.id] ? (
                  <img
                    src={team.logo_url}
                    alt={`Escudo de ${team.display_name}`}
                    loading="lazy"
                    onError={() => setBrokenCrests((current) => ({ ...current, [team.id]: true }))}
                  />
                ) : (
                  <strong className="laliga-crest-fallback">{getInitials(team.display_name)}</strong>
                )}
              </div>

              <div className="laliga-team-copy">
                <h2>{team.display_name}</h2>
                <span>{team.stadium}</span>
              </div>
            </button>
          ))}
        </section>
      )}

      {selectedTeam && (
        <div className="laliga-team-overlay" role="dialog" aria-modal="true" aria-label={selectedTeam.display_name}>
          <button
            className="laliga-team-overlay-backdrop"
            type="button"
            aria-label="Cerrar ficha"
            onClick={() => setSelectedTeam(null)}
          />

          <article
            className="laliga-team-modal"
            style={{
              "--team-primary": selectedTeam.primary_color,
              "--team-secondary": selectedTeam.secondary_color
            }}
          >
            <button className="laliga-modal-close" type="button" onClick={() => setSelectedTeam(null)}>
              Cerrar
            </button>

            <div className="laliga-modal-hero">
              <div className="laliga-modal-crest">
                {selectedTeam.logo_url && !brokenCrests[`modal-${selectedTeam.id}`] ? (
                  <img
                    src={selectedTeam.logo_url}
                    alt={`Escudo de ${selectedTeam.display_name}`}
                    onError={() => setBrokenCrests((current) => ({ ...current, [`modal-${selectedTeam.id}`]: true }))}
                  />
                ) : (
                  <strong className="laliga-crest-fallback">{getInitials(selectedTeam.display_name)}</strong>
                )}
              </div>

              <div>
                <h2>{selectedTeam.display_name}</h2>
                <p>{selectedTeam.short_description}</p>
              </div>
            </div>

            <dl className="laliga-modal-facts">
              <div>
                <dt>Ciudad</dt>
                <dd>{selectedTeam.city || "Por confirmar"}</dd>
              </div>
              <div>
                <dt>Estadio</dt>
                <dd>{selectedTeam.stadium || "Por confirmar"}</dd>
              </div>
              <div>
                <dt>Aforo</dt>
                <dd>{formatCapacity(selectedTeam.stadium_capacity)}</dd>
              </div>
              <div>
                <dt>Fundacion</dt>
                <dd>{selectedTeam.founded_year || "Por confirmar"}</dd>
              </div>
              <div>
                <dt>Apodo</dt>
                <dd>{selectedTeam.nickname || "Por confirmar"}</dd>
              </div>
            </dl>

            <section className="laliga-player-section">
              <div className="laliga-player-section-head">
                <div className="laliga-player-position-carousel" aria-label="Filtrar jugadores por posicion">
                  <button
                    className="laliga-player-position-arrow"
                    type="button"
                    onClick={() => rotatePosition(-1)}
                    aria-label="Posicion anterior"
                  >
                    <FaChevronLeft aria-hidden="true" />
                  </button>

                  <div className="laliga-player-position-current" aria-live="polite">
                    <span
                      className="laliga-player-position-icon"
                      style={{ backgroundColor: selectedTeam.primary_color }}
                      aria-hidden="true"
                    >
                      <ActivePositionIcon />
                    </span>
                    <span>{activePositionOption.label}</span>
                  </div>

                  <button
                    className="laliga-player-position-arrow"
                    type="button"
                    onClick={() => rotatePosition(1)}
                    aria-label="Posicion siguiente"
                  >
                    <FaChevronRight aria-hidden="true" />
                  </button>
                </div>
                <span>{filteredTeamPlayers.length} jugadores</span>
              </div>

              {filteredTeamPlayers.length > 0 ? (
                <div className="laliga-player-carousel">
                  <div className={`laliga-player-card-track${filteredTeamPlayers.length <= 1 ? " is-static" : ""}`}>
                    {visiblePlayerCards.map((player, index) => (
                      <article className="laliga-player-card" key={`${player.id}-${index}`}>
                        <div className="laliga-player-card-mark">
                          {player.country && (
                            <img
                              className="laliga-player-flag"
                              src={player.country}
                              alt=""
                              loading="lazy"
                              aria-hidden="true"
                            />
                          )}
                          {selectedTeam.logo_url && (
                            <img
                              className="laliga-player-team-badge"
                              src={selectedTeam.logo_url}
                              alt=""
                              loading="lazy"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        {player.photo_url && (
                          <img src={player.photo_url} alt={player.name} loading="lazy" />
                        )}
                        <div className="laliga-player-card-footer">
                          <strong>{player.name}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="laliga-player-empty">Todavia no hay cartas guardadas para esta posicion.</p>
              )}
            </section>

            {isAdmin && (
              <form className="laliga-player-admin" onSubmit={handleCreatePlayer}>
                <div className="laliga-player-admin-head">
                  <strong>Nueva carta</strong>
                  <span>Solo administradores</span>
                </div>

                <label>
                  Nombre
                  <input
                    type="text"
                    value={playerForm.name}
                    onChange={(event) => setPlayerForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Satrustegui"
                  />
                </label>

                <label>
                  Equipo
                  <select
                    value={playerForm.teamId || selectedTeam.id}
                    onChange={(event) => setPlayerForm((current) => ({ ...current, teamId: event.target.value }))}
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.display_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Pais
                  <input
                    type="text"
                    value={playerForm.country}
                    onChange={(event) => setPlayerForm((current) => ({ ...current, country: event.target.value }))}
                    placeholder="URL de la bandera"
                  />
                </label>

                <label>
                  Posicion
                  <select
                    value={playerForm.position}
                    onChange={(event) => setPlayerForm((current) => ({ ...current, position: event.target.value }))}
                  >
                    {PLAYER_POSITIONS.map((position) => (
                      <option key={position.value} value={position.value}>
                        {position.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPlayerForm((current) => ({
                      ...current,
                      photoFile: event.target.files?.[0] || null
                    }))}
                  />
                </label>

                <button type="submit" disabled={isSavingPlayer}>
                  {isSavingPlayer ? "Guardando..." : "Crear carta"}
                </button>

                {playerMessage && <p className="laliga-player-admin-message">{playerMessage}</p>}
              </form>
            )}
          </article>
        </div>
      )}
    </main>
  );
}

function groupPlayersByTeam(players) {
  return players.reduce((acc, player) => {
    if (!acc[player.team_id]) acc[player.team_id] = [];
    acc[player.team_id].push(player);
    return acc;
  }, {});
}
