import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Pencil, X } from "lucide-react";
import { FaHome, FaPlane } from "react-icons/fa";
import { Link } from "react-router-dom";
import HomePollPanel from "./HomePollPanel";
import { supabase } from "../../services/supabaseClient";

const MATCH_FILTERS = [
  { id: "first", label: "Primer equipo" },
  { id: "female", label: "Femenino" },
  { id: "reserve", label: "Filial" }
];

const TEAM_SECTIONS = MATCH_FILTERS;

const EMPTY_MATCH_FORM = {
  home_team: "Deportivo Alaves",
  away_team: "",
  match_date: "",
  week: "",
  team_section: "first",
  competition_id: "",
  stadium: "",
  match_side: "LOCAL",
  home_logo: "",
  away_logo: "",
  home_score: "",
  away_score: "",
  status: "upcoming",
  scorers: "",
  rival_title: "",
  rival_description: "",
  rival_image_url: "",
  rival_title_color: "#0f5ca3",
  preview_title: "",
  preview_intro: "",
  preview_content: "",
  preview_image_url: "",
  preview_tags: ""
};

export default function MatchesCalendar({
  matches = [],
  standings = [],
  isAdmin = false,
  onMatchCreated
}) {
  const [activeFilter, setActiveFilter] = useState("first");
  const [standingsPage, setStandingsPage] = useState(0);
  const [visibleMatchSlots, setVisibleMatchSlots] = useState(5);
  const [isMatchEditorOpen, setIsMatchEditorOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [matchForm, setMatchForm] = useState(EMPTY_MATCH_FORM);
  const [competitions, setCompetitions] = useState([]);
  const [matchEditorMessage, setMatchEditorMessage] = useState("");
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const matchesPanelRef = useRef(null);
  const now = new Date();
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => getMatchTeamType(match) === activeFilter);
  }, [matches, activeFilter]);
  const finishedMatches = filteredMatches
    .filter((match) => hasScore(match))
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
  const upcomingMatches = filteredMatches
    .filter((match) => {
      const matchDate = new Date(match.match_date);
      return matchDate >= now && match.status !== "finished";
    })
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const visibleMatches = finishedMatches.length ? finishedMatches : upcomingMatches;
  const shouldScrollMatches = visibleMatches.length > visibleMatchSlots;
  const scrollingMatches = shouldScrollMatches
    ? [...visibleMatches, ...visibleMatches]
    : visibleMatches;
  const compactStandings = standings.slice(0, 20);
  const standingsPages = Math.max(1, Math.ceil(compactStandings.length / 10));
  const visibleStandings = compactStandings.slice(standingsPage * 10, standingsPage * 10 + 10);

  useEffect(() => {
    if (standingsPage > standingsPages - 1) {
      setStandingsPage(Math.max(0, standingsPages - 1));
    }
  }, [standingsPage, standingsPages]);

  useEffect(() => {
    const updateVisibleSlots = () => {
      const panelWidth = matchesPanelRef.current?.clientWidth || 0;
      const matchCardWidth = 150;
      const slots = panelWidth ? Math.floor(panelWidth / matchCardWidth) : 5;
      setVisibleMatchSlots(Math.max(1, slots));
    };

    updateVisibleSlots();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateVisibleSlots)
      : null;

    if (resizeObserver && matchesPanelRef.current) {
      resizeObserver.observe(matchesPanelRef.current);
    }

    window.addEventListener("resize", updateVisibleSlots);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateVisibleSlots);
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let ignore = false;

    async function loadCompetitions() {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, name")
        .order("name", { ascending: true });

      if (ignore) return;

      if (error) {
        console.error("Error cargando competiciones:", error);
        return;
      }

      setCompetitions(data || []);
    }

    loadCompetitions();

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  function handleMatchFormChange(field, value) {
    setMatchForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function resetMatchForm() {
    setMatchForm(EMPTY_MATCH_FORM);
    setMatchEditorMessage("");
    setEditingMatchId(null);
  }

  function openCreateEditor() {
    setEditingMatchId(null);
    setMatchForm(EMPTY_MATCH_FORM);
    setMatchEditorMessage("");
    setIsMatchEditorOpen(true);
  }

  function openEditEditor(event, match) {
    event.preventDefault();
    event.stopPropagation();
    setEditingMatchId(match.id);
    setMatchForm(matchToForm(match));
    setMatchEditorMessage("");
    setIsMatchEditorOpen(true);
  }

  async function saveMatch(event) {
    event.preventDefault();
    setMatchEditorMessage("");

    if (!matchForm.home_team.trim() || !matchForm.away_team.trim() || !matchForm.match_date) {
      setMatchEditorMessage("Completa equipos y fecha.");
      return;
    }

    if (
      matchForm.status === "finished" &&
      (matchForm.home_score === "" || matchForm.away_score === "")
    ) {
      setMatchEditorMessage("Un partido finalizado necesita ambos marcadores.");
      return;
    }

    setIsSavingMatch(true);

    const payload = {
      home_team: matchForm.home_team.trim(),
      away_team: matchForm.away_team.trim(),
      match_date: new Date(matchForm.match_date).toISOString(),
      week: matchForm.week === "" ? null : Number(matchForm.week),
      team_section: matchForm.team_section || "first",
      competition_id: matchForm.competition_id || null,
      stadium: matchForm.stadium.trim() || null,
      match_side: matchForm.match_side || null,
      home_logo: matchForm.home_logo.trim() || null,
      away_logo: matchForm.away_logo.trim() || null,
      home_score: matchForm.home_score === "" ? null : Number(matchForm.home_score),
      away_score: matchForm.away_score === "" ? null : Number(matchForm.away_score),
      status: matchForm.status,
      scorers: matchForm.scorers.trim() || null,
      rival_title: matchForm.rival_title.trim() || null,
      rival_description: matchForm.rival_description.trim() || null,
      rival_image_url: matchForm.rival_image_url.trim() || null,
      rival_title_color: matchForm.rival_title_color.trim() || "#0f5ca3",
      preview_title: matchForm.preview_title.trim() || null,
      preview_intro: matchForm.preview_intro.trim() || null,
      preview_content: matchForm.preview_content.trim() || null,
      preview_image_url: matchForm.preview_image_url.trim() || null,
      preview_tags: parsePreviewTags(matchForm.preview_tags)
    };

    const query = editingMatchId
      ? supabase.from("matches").update(payload).eq("id", editingMatchId)
      : supabase.from("matches").insert(payload);

    const { error } = await query;

    setIsSavingMatch(false);

    if (error) {
      console.error("Error guardando partido:", error);
      setMatchEditorMessage(error.message || "No se pudo guardar el partido.");
      return;
    }

    setMatchEditorMessage(editingMatchId ? "Partido actualizado." : "Partido guardado.");
    resetMatchForm();
    setIsMatchEditorOpen(false);
    await onMatchCreated?.();
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short"
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <section className="matches-calendar full-width">
      <div className="matches-header">
        <div className="matches-title-block">
          <h2>Ultimos partidos</h2>
        </div>

        <div className="matches-header-controls">
          {isAdmin && (
            <button
              className="matches-add-btn"
              type="button"
              onClick={openCreateEditor}
              aria-label="Anadir partido"
              title="Anadir partido"
            >
              +
            </button>
          )}

          <div className="matches-team-filters" aria-label="Filtrar partidos por equipo">
            {MATCH_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={activeFilter === filter.id ? "active" : ""}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <Link to="/trayectoria" className="season-calendar-label">
          <CalendarDays size={16} aria-hidden="true" />
          <span>Calendario completo</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="season-calendar-layout">
        <div className="season-matches-column">
          <div
            ref={matchesPanelRef}
            className={`season-matches-panel ${shouldScrollMatches ? "is-scrollable" : ""}`}
          >
            <div className={`season-matches-track ${shouldScrollMatches ? "is-animated" : ""}`}>
              {scrollingMatches.map((match, index) => (
                <Link
                  key={`${match.id}-${index}`}
                  to={`/partido/${match.id}`}
                  state={{ match }}
                  className={`season-match-row season-match-row-${getMatchTeamType(match)}`}
                  aria-hidden={index >= visibleMatches.length}
                >
                  {isAdmin && index < visibleMatches.length && (
                    <button
                      className="season-match-edit-btn"
                      type="button"
                      onClick={(event) => openEditEditor(event, match)}
                      aria-label={`Editar partido ${match.home_team} contra ${match.away_team}`}
                      title="Editar partido"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                  )}

                  <div className="season-match-date">
                    <strong>{formatDate(match.match_date)}</strong>
                    <span>{formatTime(match.match_date)}</span>
                  </div>

                  <div className="season-match-main">
                    <TeamLine
                      logo={match.home_logo}
                      name={match.home_team}
                      score={match.home_score}
                      isFinished={hasScore(match)}
                    />
                    <TeamLine
                      logo={match.away_logo}
                      name={match.away_team}
                      score={match.away_score}
                      isFinished={hasScore(match)}
                    />
                  </div>

                  <div className="season-match-footer">
                    <span className="season-match-competition">
                      {match.competitions?.logo_url && (
                        <img
                          src={match.competitions.logo_url}
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <span>{getMatchRoundLabel(match)}</span>
                    </span>
                    <MatchSideIcon side={match.match_side} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <HomePollPanel />
        </div>

        <aside className="compact-standings-panel" aria-label="Clasificacion compacta">
          <div className="compact-standings-head">
            <span>Equipo</span>
            <span>PG</span>
            <span>Pts</span>
          </div>

          <div className="compact-standings-list">
            {visibleStandings.map((team, index) => {
              const absoluteIndex = standingsPage * 10 + index;
              const isRelegationZone = absoluteIndex >= compactStandings.length - 3;

              return (
              <div
                key={team.id}
                className={`compact-standing-row ${isRelegationZone ? "is-danger-zone" : ""}`}
              >
                <span className="compact-standing-team">
                  {team.team_logo && <img src={team.team_logo} alt="" loading="lazy" />}
                  <span>{team.team_name}</span>
                </span>
                <span className="compact-standing-wins">{team.wins}</span>
                <strong>
                  <span className="compact-standing-badge compact-standing-points">{team.points}</span>
                </strong>
              </div>
              );
            })}
          </div>

          {standingsPages > 1 && (
            <div className="compact-standings-pager" aria-label="Cambiar tramo de clasificacion">
              {Array.from({ length: standingsPages }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={standingsPage === index ? "active" : ""}
                  onClick={() => setStandingsPage(index)}
                  aria-label={index === 0 ? "Ver puestos 1 al 10" : "Ver puestos 11 al 20"}
                  aria-current={standingsPage === index ? "page" : undefined}
                />
              ))}
            </div>
          )}
        </aside>
      </div>

      {isMatchEditorOpen && (
        <div className="match-editor-overlay" role="dialog" aria-modal="true" aria-label={editingMatchId ? "Editar partido" : "Nuevo partido"}>
          <form className="match-editor-modal" onSubmit={saveMatch}>
            <button
              className="match-editor-close"
              type="button"
              onClick={() => {
                setIsMatchEditorOpen(false);
                resetMatchForm();
              }}
              aria-label="Cerrar formulario"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <h3>{editingMatchId ? "Editar partido" : "Nuevo partido"}</h3>

            <div className="match-editor-grid">
              <label>
                Equipo local
                <input
                  type="text"
                  value={matchForm.home_team}
                  onChange={(event) => handleMatchFormChange("home_team", event.target.value)}
                  required
                />
              </label>

              <label>
                Equipo visitante
                <input
                  type="text"
                  value={matchForm.away_team}
                  onChange={(event) => handleMatchFormChange("away_team", event.target.value)}
                  required
                />
              </label>

              <label>
                Escudo local
                <input
                  type="url"
                  value={matchForm.home_logo}
                  onChange={(event) => handleMatchFormChange("home_logo", event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label>
                Escudo visitante
                <input
                  type="url"
                  value={matchForm.away_logo}
                  onChange={(event) => handleMatchFormChange("away_logo", event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="match-editor-wide">
                Fecha y hora
                <input
                  type="datetime-local"
                  value={matchForm.match_date}
                  onChange={(event) => handleMatchFormChange("match_date", event.target.value)}
                  required
                />
              </label>

              <label>
                Jornada
                <input
                  type="number"
                  min="1"
                  value={matchForm.week}
                  onChange={(event) => handleMatchFormChange("week", event.target.value)}
                />
              </label>

              <label>
                Seccion Alaves
                <select
                  value={matchForm.team_section}
                  onChange={(event) => handleMatchFormChange("team_section", event.target.value)}
                >
                  {TEAM_SECTIONS.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Competicion
                <select
                  value={matchForm.competition_id}
                  onChange={(event) => handleMatchFormChange("competition_id", event.target.value)}
                >
                  <option value="">Sin competicion</option>
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>
                      {competition.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Campo
                <input
                  type="text"
                  value={matchForm.stadium}
                  onChange={(event) => handleMatchFormChange("stadium", event.target.value)}
                />
              </label>

              <label>
                Condicion Alaves
                <select
                  value={matchForm.match_side}
                  onChange={(event) => handleMatchFormChange("match_side", event.target.value)}
                >
                  <option value="LOCAL">Local</option>
                  <option value="VISITANTE">Visitante</option>
                </select>
              </label>

              <label>
                Goles local
                <input
                  type="number"
                  min="0"
                  value={matchForm.home_score}
                  onChange={(event) => handleMatchFormChange("home_score", event.target.value)}
                />
              </label>

              <label>
                Goles visitante
                <input
                  type="number"
                  min="0"
                  value={matchForm.away_score}
                  onChange={(event) => handleMatchFormChange("away_score", event.target.value)}
                />
              </label>

              <label>
                Estado
                <select
                  value={matchForm.status}
                  onChange={(event) => handleMatchFormChange("status", event.target.value)}
                >
                  <option value="upcoming">Proximo</option>
                  <option value="scheduled">Programado</option>
                  <option value="live">En directo</option>
                  <option value="finished">Finalizado</option>
                  <option value="postponed">Aplazado</option>
                </select>
              </label>

              <label className="match-editor-wide">
                Goleadores
                <input
                  type="text"
                  value={matchForm.scorers}
                  onChange={(event) => handleMatchFormChange("scorers", event.target.value)}
                  placeholder="Ej. Guridi 24', Kike 77'"
                />
              </label>

              <label>
                Titulo rival
                <input
                  type="text"
                  value={matchForm.rival_title}
                  onChange={(event) => handleMatchFormChange("rival_title", event.target.value)}
                />
              </label>

              <label>
                Imagen rival
                <input
                  type="url"
                  value={matchForm.rival_image_url}
                  onChange={(event) => handleMatchFormChange("rival_image_url", event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="match-editor-wide">
                Descripcion rival
                <textarea
                  value={matchForm.rival_description}
                  onChange={(event) => handleMatchFormChange("rival_description", event.target.value)}
                  rows={3}
                />
              </label>

              <label>
                Color titulo rival
                <input
                  type="text"
                  value={matchForm.rival_title_color}
                  onChange={(event) => handleMatchFormChange("rival_title_color", event.target.value)}
                  placeholder="#0f5ca3"
                />
              </label>

              <label>
                Imagen previa
                <input
                  type="url"
                  value={matchForm.preview_image_url}
                  onChange={(event) => handleMatchFormChange("preview_image_url", event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="match-editor-wide">
                Titulo previa
                <input
                  type="text"
                  value={matchForm.preview_title}
                  onChange={(event) => handleMatchFormChange("preview_title", event.target.value)}
                />
              </label>

              <label className="match-editor-wide">
                Intro previa
                <textarea
                  value={matchForm.preview_intro}
                  onChange={(event) => handleMatchFormChange("preview_intro", event.target.value)}
                  rows={2}
                />
              </label>

              <label className="match-editor-wide">
                Contenido previa
                <textarea
                  value={matchForm.preview_content}
                  onChange={(event) => handleMatchFormChange("preview_content", event.target.value)}
                  rows={5}
                />
              </label>

              <label className="match-editor-wide">
                Etiquetas previa
                <input
                  type="text"
                  value={matchForm.preview_tags}
                  onChange={(event) => handleMatchFormChange("preview_tags", event.target.value)}
                  placeholder="Separadas por comas"
                />
              </label>
            </div>

            <div className="match-editor-footer">
              {matchEditorMessage && <span>{matchEditorMessage}</span>}
              <button type="submit" disabled={isSavingMatch}>
                {isSavingMatch ? "Guardando..." : editingMatchId ? "Actualizar partido" : "Guardar partido"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function matchToForm(match) {
  return {
    home_team: match.home_team || "",
    away_team: match.away_team || "",
    match_date: formatDateTimeLocal(match.match_date),
    week: match.week == null ? "" : String(match.week),
    team_section: getMatchTeamType(match),
    competition_id: match.competition_id || "",
    stadium: match.stadium || "",
    match_side: match.match_side || "LOCAL",
    home_logo: match.home_logo || "",
    away_logo: match.away_logo || "",
    home_score: match.home_score == null ? "" : String(match.home_score),
    away_score: match.away_score == null ? "" : String(match.away_score),
    status: match.status || "upcoming",
    scorers: match.scorers || "",
    rival_title: match.rival_title || "",
    rival_description: match.rival_description || "",
    rival_image_url: match.rival_image_url || "",
    rival_title_color: match.rival_title_color || "#0f5ca3",
    preview_title: match.preview_title || "",
    preview_intro: match.preview_intro || "",
    preview_content: match.preview_content || "",
    preview_image_url: match.preview_image_url || "",
    preview_tags: Array.isArray(match.preview_tags) ? match.preview_tags.join(", ") : ""
  };
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function parsePreviewTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getMatchRoundLabel(match) {
  const competition = normalizeText(match.competitions?.name || "");

  if (competition.includes("amistoso") || competition.includes("friendly")) {
    return "AMISTOSO";
  }

  return match.week ? `J${match.week}` : "J-";
}

function getMatchTeamType(match) {
  if (["first", "female", "reserve"].includes(match.team_section)) {
    return match.team_section;
  }

  const competition = normalizeText(match.competitions?.name || "");
  const text = normalizeText(`${match.home_team || ""} ${match.away_team || ""} ${competition}`);

  if (
    text.includes("femen") ||
    text.includes("moeve") ||
    text.includes("liga f") ||
    text.includes("gloriosas")
  ) {
    return "female";
  }

  if (
    text.includes("filial") ||
    text.includes("segunda federacion") ||
    text.includes("2rfef") ||
    text.includes("miniglorias") ||
    text.includes("alaves b")
  ) {
    return "reserve";
  }

  return "first";
}

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function TeamLine({ logo, name, score, isFinished }) {
  return (
    <div className="season-team-line">
      <span className="season-team-identity">
        {logo && <img src={logo} alt="" loading="lazy" />}
        <strong title={name}>{abbreviateTeam(name)}</strong>
      </span>
      {isFinished && <span className="season-team-score">{score}</span>}
    </div>
  );
}

function MatchSideIcon({ side }) {
  const isAway = String(side || "").toUpperCase() === "VISITANTE";
  const Icon = isAway ? FaPlane : FaHome;
  const label = isAway ? "Visitante" : "Local";

  return (
    <strong className="season-match-side" aria-label={label} title={label}>
      <Icon aria-hidden="true" />
    </strong>
  );
}

function abbreviateTeam(name = "") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
}

function hasScore(match) {
  return match.status === "finished" && match.home_score != null && match.away_score != null;
}
