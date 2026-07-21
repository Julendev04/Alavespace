import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Eye,
  Gauge,
  Lock,
  MapPin,
  Shield,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";
import rivalAnalysisImage from "../assets/Analisis_Rivales_Temporada2026_27.jpg";
import "./MatchPreview.css";

const tabItems = [
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "preview", label: "Previa", icon: Eye },
  { id: "rival", label: "El Rival", icon: Shield },
];

const RIVAL_FORMATIONS = {
  "4-2-3-1": [
    { top: 83, left: 50 }, { top: 69, left: 18 }, { top: 71, left: 38 },
    { top: 71, left: 62 }, { top: 69, left: 82 }, { top: 55, left: 39 },
    { top: 55, left: 61 }, { top: 39, left: 22 }, { top: 38, left: 50 },
    { top: 39, left: 78 }, { top: 23, left: 50 },
  ],
  "4-3-3": [
    { top: 83, left: 50 }, { top: 69, left: 18 }, { top: 71, left: 38 },
    { top: 71, left: 62 }, { top: 69, left: 82 }, { top: 52, left: 30 },
    { top: 48, left: 50 }, { top: 52, left: 70 }, { top: 31, left: 22 },
    { top: 26, left: 50 }, { top: 31, left: 78 },
  ],
  "4-4-2": [
    { top: 83, left: 50 }, { top: 69, left: 18 }, { top: 71, left: 38 },
    { top: 71, left: 62 }, { top: 69, left: 82 }, { top: 51, left: 22 },
    { top: 52, left: 40 }, { top: 52, left: 60 }, { top: 51, left: 78 },
    { top: 29, left: 40 }, { top: 29, left: 60 },
  ],
  "3-5-2": [
    { top: 83, left: 50 }, { top: 70, left: 30 }, { top: 72, left: 50 },
    { top: 70, left: 70 }, { top: 54, left: 16 }, { top: 55, left: 35 },
    { top: 53, left: 50 }, { top: 55, left: 65 }, { top: 54, left: 84 },
    { top: 30, left: 40 }, { top: 30, left: 60 },
  ],
  "5-3-2": [
    { top: 83, left: 50 }, { top: 67, left: 13 }, { top: 71, left: 30 },
    { top: 73, left: 50 }, { top: 71, left: 70 }, { top: 67, left: 87 },
    { top: 51, left: 31 }, { top: 48, left: 50 }, { top: 51, left: 69 },
    { top: 30, left: 40 }, { top: 30, left: 60 },
  ],
};

const DEFAULT_RIVAL_FORMATION = "4-2-3-1";

export default function MatchPreview() {
  const { id } = useParams();
  const location = useLocation();
  const [match, setMatch] = useState(location.state?.match || null);
  const [loading, setLoading] = useState(!location.state?.match);
  const [activeTab, setActiveTab] = useState("rival");
  const [isAdmin, setIsAdmin] = useState(false);
  const [rivalForm, setRivalForm] = useState({
    title: "",
    description: "",
    titleColor: "#0f5ca3",
    playerIds: [],
    playerSlots: [],
    formation: DEFAULT_RIVAL_FORMATION,
  });
  const [rivalMessage, setRivalMessage] = useState("");
  const [rivalGuideTeam, setRivalGuideTeam] = useState(null);
  const [rivalGuidePlayers, setRivalGuidePlayers] = useState([]);
  const [rivalGuideMessage, setRivalGuideMessage] = useState("");
  const [draggedRivalPlayerId, setDraggedRivalPlayerId] = useState("");
  const [savingRival, setSavingRival] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewComments, setPreviewComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [previewForm, setPreviewForm] = useState({
    title: "",
    intro: "",
    content: "",
    imageUrl: "",
    tags: "",
    published: false,
  });
  const [previewMessage, setPreviewMessage] = useState("");
  const [savingPreview, setSavingPreview] = useState(false);
  const rivalInfo = useMemo(() => getMatchRivalInfo(match), [match]);

  useEffect(() => {
    if (match || !id) return;

    async function loadMatch() {
      setLoading(true);
      const { data } = await supabase
        .from("matches")
        .select("*, competitions(name, logo_url)")
        .eq("id", id)
        .single();

      setMatch(data || null);
      setLoading(false);
    }

    loadMatch();
  }, [id, match]);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setCurrentUser(user || null);
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    }

    checkAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!match) return;

    setRivalForm({
      title: getMatchRivalTitle(match, rivalInfo.name),
      description: match.rival_description || "",
      titleColor: match.rival_title_color || "#0f5ca3",
      playerIds: Array.isArray(match.rival_player_ids) ? match.rival_player_ids : [],
      playerSlots: normalizeRivalPlayerSlots(match),
      formation: getRivalFormation(match),
    });
    setRivalMessage("");
    setPreviewForm({
      title: match.preview_title || `Previa: ${match.home_team || "Local"} vs ${match.away_team || "Visitante"}`,
      intro:
        match.preview_intro ||
        `${match.home_team || "El local"} y ${match.away_team || "el visitante"} se citan en ${match.stadium || "estadio por confirmar"} en una cita marcada por el contexto, la forma reciente y los detalles tacticos.`,
      content:
        match.preview_content ||
        "Escribe aqui tu previa completa: lectura del momento de ambos equipos, claves tacticas, nombres propios, posibles onces, ambiente del partido y todo lo que ayude a presentar el encuentro con mirada Alavesfera.",
      imageUrl: match.preview_image_url || match.rival_image_url || match.away_logo || match.home_logo || "",
      tags: normalizePreviewTags(match.preview_tags || [
        match.competitions?.name,
        match.week ? `Jornada ${match.week}` : null,
        isUpcoming ? "Por jugar" : "Postpartido"
      ]).join(", "),
      published: Boolean(match.preview_published),
    });
    setPreviewMessage("");
  }, [match, rivalInfo.name]);

  const matchDate = match?.match_date ? new Date(match.match_date) : null;
  const isUpcoming = ["upcoming", "scheduled"].includes(String(match?.status || "").toLowerCase());
  const hasScore =
    !isUpcoming &&
    match?.home_score !== null &&
    match?.home_score !== undefined &&
    match?.away_score !== null &&
    match?.away_score !== undefined;
  const scoreLabel = hasScore ? `${match.home_score} - ${match.away_score}` : "VS";
  const eyebrow = `${match?.competitions?.name || "Competicion"} · Jornada ${match?.week || "-"}`;
  const pageTitle = match ? `${match.home_team} vs ${match.away_team}` : "Partido";
  const rivalName = rivalInfo.name;
  const rivalTitle = getMatchRivalTitle(match, rivalName);
  const rivalDescription =
    match?.rival_description ||
    "Zona reservada para el analisis del rival: jugadores importantes, estilo de juego, puntos fuertes y detalles a vigilar antes del encuentro.";
  const rivalTitleColor = match?.rival_title_color || "#0f5ca3";
  const isPlayed = !isUpcoming && hasScore;
  const previewTitle = match?.preview_title || `Previa: ${pageTitle}`;
  const previewIntro =
    match?.preview_intro ||
    `${match?.home_team || "El local"} y ${match?.away_team || "el visitante"} se citan en ${match?.stadium || "estadio por confirmar"} en una cita marcada por el contexto, la forma reciente y los detalles tacticos.`;
  const previewBody =
    match?.preview_content ||
    "Escribe aqui tu previa completa: lectura del momento de ambos equipos, claves tacticas, nombres propios, posibles onces, ambiente del partido y todo lo que ayude a presentar el encuentro con mirada Alavesfera.\n\nPuedes usar parrafos largos para construir un articulo editorial amplio antes del partido.";
  const previewImageUrl = match?.preview_image_url || match?.rival_image_url || match?.away_logo || match?.home_logo || "";
  const previewUpdatedAt = match?.preview_updated_at || match?.updated_at || match?.created_at || match?.match_date;
  const previewIsPublished = Boolean(match?.preview_published);
  const isFemaleMatch = isFemaleCompetition(match?.competitions?.name);
  const visibleTabItems = useMemo(
    () => tabItems.filter((tab) => !isFemaleMatch || tab.id !== "rival"),
    [isFemaleMatch]
  );
  const previewTags = useMemo(() => {
    return normalizePreviewTags(match?.preview_tags || [
      match?.competitions?.name,
      match?.week ? `Jornada ${match.week}` : null,
      isUpcoming ? "Por jugar" : "Postpartido"
    ]);
  }, [match?.preview_tags, match?.competitions?.name, match?.week, isUpcoming]);
  const matchStats = useMemo(() => buildMatchStats(match), [match]);
  const statsGroups = useMemo(() => buildStatsGroups(matchStats), [matchStats]);
  const selectedRivalPlayers = useMemo(() => {
    const selectedIds = Array.isArray(match?.rival_player_slots)
      ? match.rival_player_slots.map((slot) => slot.playerId || slot.player_id).filter(Boolean)
      : Array.isArray(match?.rival_player_ids) ? match.rival_player_ids : [];
    const selectedSet = new Set(selectedIds.map(String));

    return rivalGuidePlayers.filter((player) => selectedSet.has(String(player.id)));
  }, [match?.rival_player_ids, match?.rival_player_slots, rivalGuidePlayers]);
  const rivalPlayersById = useMemo(() => {
    return rivalGuidePlayers.reduce((acc, player) => {
      acc[String(player.id)] = player;
      return acc;
    }, {});
  }, [rivalGuidePlayers]);

  useEffect(() => {
    if (isFemaleMatch && activeTab === "rival") {
      setActiveTab(isPlayed ? "stats" : "preview");
    }
  }, [activeTab, isFemaleMatch, isPlayed]);

  function isTabLocked(tabId) {
    if (tabId === "stats") return isUpcoming;
    if (tabId === "preview") return isPlayed;
    return false;
  }

  function getLockedTabLabel(tabId) {
    if (tabId === "stats") return "Stats disponibles cuando se juegue el partido";
    if (tabId === "preview") return "Previa cerrada tras disputarse el partido";
    return "";
  }

  useEffect(() => {
    if (!match?.id) return;

    let ignore = false;

    async function loadPreviewComments() {
      setCommentMessage("");

      const { data, error } = await supabase
        .from("match_preview_comments")
        .select("id, match_id, user_id, content, created_at")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false });

      if (ignore) return;

      if (error) {
        setPreviewComments([]);
        setCommentMessage("Los comentarios aun no estan configurados.");
        return;
      }

      const userIds = [...new Set((data || []).map((comment) => comment.user_id).filter(Boolean))];
      let profilesById = {};

      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        profilesById = (profiles || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      setPreviewComments((data || []).map((comment) => ({
        ...comment,
        username: profilesById[comment.user_id]?.username || "Usuario Alavesfera"
      })));
    }

    loadPreviewComments();

    return () => {
      ignore = true;
    };
  }, [match?.id]);

  useEffect(() => {
    if (!match) return;
    if (isFemaleMatch) {
      setRivalGuideTeam(null);
      setRivalGuidePlayers([]);
      setRivalGuideMessage("");
      return;
    }

    let ignore = false;

    async function loadRivalGuidePlayers() {
      setRivalGuideTeam(null);
      setRivalGuidePlayers([]);
      setRivalGuideMessage("");

      const { data: teams, error: teamsError } = await supabase
        .from("laliga_guide_teams")
        .select("id, name, display_name, slug, primary_color, logo_url")
        .order("sort_order", { ascending: true });

      if (ignore) return;

      if (teamsError) {
        setRivalGuideMessage("No se han podido cargar los equipos de la guia.");
        return;
      }

      const guideTeam = findGuideTeamForMatch(teams || [], match);

      if (!guideTeam) {
        setRivalGuideMessage("No he encontrado este rival en LaLiga Guia.");
        return;
      }

      const { data: players, error: playersError } = await supabase
        .from("laliga_guide_players")
        .select("id, team_id, name, country, position, photo_url, sort_order")
        .eq("team_id", guideTeam.id)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (ignore) return;

      if (playersError) {
        setRivalGuideMessage("No se han podido cargar las cartas del rival.");
        return;
      }

      setRivalGuideTeam(guideTeam);
      setRivalGuidePlayers(players || []);
    }

    loadRivalGuidePlayers();

    return () => {
      ignore = true;
    };
  }, [match, isFemaleMatch]);

  async function submitPreviewComment(event) {
    event.preventDefault();
    if (!currentUser || !match?.id || !commentText.trim() || !previewIsPublished) return;

    setSavingComment(true);
    setCommentMessage("");

    const payload = {
      match_id: match.id,
      user_id: currentUser.id,
      content: commentText.trim()
    };

    const { data, error } = await supabase
      .from("match_preview_comments")
      .insert(payload)
      .select("id, match_id, user_id, content, created_at")
      .single();

    setSavingComment(false);

    if (error) {
      setCommentMessage(error.message || "No se pudo publicar el comentario.");
      return;
    }

    const username = currentUser.user_metadata?.username || currentUser.email?.split("@")[0] || "Usuario Alavesfera";
    setPreviewComments((comments) => [{ ...data, username }, ...comments]);
    setCommentText("");
  }

  async function savePreviewContent(event, nextPublished = previewForm.published) {
    event.preventDefault();
    if (!isAdmin || !match?.id) return;

    setSavingPreview(true);
    setPreviewMessage("");

    const tags = normalizePreviewTags(previewForm.tags);
    const wasPublished = Boolean(match.preview_published);
    const now = new Date().toISOString();
    const payload = {
      preview_title: previewForm.title.trim() || null,
      preview_intro: previewForm.intro.trim() || null,
      preview_content: previewForm.content.trim() || null,
      preview_image_url: previewForm.imageUrl.trim() || null,
      preview_tags: tags,
      preview_updated_at: now,
      preview_published: nextPublished,
      preview_published_at: nextPublished
        ? match.preview_published_at || now
        : null,
    };

    const { data, error } = await supabase
      .from("matches")
      .update(payload)
      .eq("id", match.id)
      .select("preview_title, preview_intro, preview_content, preview_image_url, preview_tags, preview_updated_at, preview_published, preview_published_at")
      .single();

    setSavingPreview(false);

    if (error) {
      setPreviewMessage(error.message || "No se pudo guardar la previa.");
      return;
    }

    setMatch((current) => ({ ...current, ...data }));
    setPreviewForm((current) => ({
      ...current,
      published: Boolean(data.preview_published),
    }));
    setPreviewMessage(nextPublished && !wasPublished ? "Previa publicada." : "Previa guardada.");
  }

  async function saveRivalContent(event) {
    event.preventDefault();
    if (!isAdmin || !match?.id) return;

    setSavingRival(true);
    setRivalMessage("");

    const payload = {
      rival_title: rivalForm.title.trim() || rivalName,
      rival_description: rivalForm.description.trim(),
      rival_title_color: rivalForm.titleColor || "#0f5ca3",
      rival_player_ids: rivalForm.playerSlots.map((slot) => slot.playerId),
      rival_player_slots: rivalForm.playerSlots,
      rival_formation: rivalForm.formation || DEFAULT_RIVAL_FORMATION,
    };

    const { data, error } = await supabase
      .from("matches")
      .update(payload)
      .eq("id", match.id)
      .select("rival_title, rival_description, rival_title_color, rival_player_ids, rival_player_slots, rival_formation")
      .single();

    if (error) {
      setRivalMessage(error.message || "No se pudo guardar el contenido.");
      setSavingRival(false);
      return;
    }

    setMatch((current) => ({ ...current, ...data }));
    setRivalForm((current) => ({
      ...current,
      playerIds: Array.isArray(data.rival_player_ids) ? data.rival_player_ids : [],
      playerSlots: Array.isArray(data.rival_player_slots) ? data.rival_player_slots : [],
      formation: data.rival_formation || DEFAULT_RIVAL_FORMATION,
    }));
    setRivalMessage("Contenido del rival guardado.");
    setSavingRival(false);
  }

  function toggleRivalPlayer(playerId) {
    setRivalForm((current) => {
      const playerIdText = String(playerId);
      const currentIds = current.playerSlots.map((slot) => String(slot.playerId));
      const exists = currentIds.includes(playerIdText);

      if (exists) {
        const nextSlots = current.playerSlots.filter((slot) => String(slot.playerId) !== playerIdText);

        return {
          ...current,
          playerIds: nextSlots.map((slot) => slot.playerId),
          playerSlots: nextSlots,
        };
      }

      const usedSlots = new Set(current.playerSlots.map((slot) => Number(slot.slotIndex)));
      const currentFormationSlots = RIVAL_FORMATIONS[current.formation] || RIVAL_FORMATIONS[DEFAULT_RIVAL_FORMATION];
      const firstFreeSlot = currentFormationSlots.findIndex((_slot, index) => !usedSlots.has(index));

      if (firstFreeSlot === -1) return current;

      const nextSlots = [
        ...current.playerSlots,
        { playerId: playerIdText, slotIndex: firstFreeSlot },
      ];

      return {
        ...current,
        playerIds: nextSlots.map((slot) => slot.playerId),
        playerSlots: nextSlots,
      };
    });
  }

  function handleDropRivalPlayer(slotIndex) {
    if (!draggedRivalPlayerId) return;

    setRivalForm((current) => {
      const playerIdText = String(draggedRivalPlayerId);
      const nextSlots = current.playerSlots
        .filter((slot) => String(slot.playerId) !== playerIdText && Number(slot.slotIndex) !== slotIndex)
        .concat({ playerId: playerIdText, slotIndex });

      return {
        ...current,
        playerIds: nextSlots.map((slot) => slot.playerId),
        playerSlots: nextSlots,
      };
    });
    setDraggedRivalPlayerId("");
  }

  function removeRivalPlayerFromSlot(slotIndex) {
    setRivalForm((current) => {
      const nextSlots = current.playerSlots.filter((slot) => Number(slot.slotIndex) !== slotIndex);

      return {
        ...current,
        playerIds: nextSlots.map((slot) => slot.playerId),
        playerSlots: nextSlots,
      };
    });
  }

  if (loading) {
    return (
      <main className="match-preview-page">
        <div className="match-preview-loading">Cargando partido...</div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="match-preview-page">
        <div className="match-preview-loading">No se ha encontrado el partido.</div>
      </main>
    );
  }

  return (
    <main className="match-preview-page">
      <div className="match-preview-bg" aria-hidden="true" />

      <section className="match-arena">
        <div className="match-preview-top">
          <Link className="match-back-link" to="/trayectoria">
            <ArrowLeft size={17} />
            Volver al calendario
          </Link>
        </div>

        <section className="match-detail-hero">
          <div className="match-detail-eyebrow">{eyebrow}</div>

          <div className="match-detail-scoreboard">
            <div className="match-detail-team">
              {match.home_logo && <img src={match.home_logo} alt="" />}
              <strong>{match.home_team}</strong>
            </div>

            <div className="match-detail-score">
              <strong>{scoreLabel}</strong>
              {isUpcoming && <span className="match-detail-status">Por jugar</span>}
            </div>

            <div className="match-detail-team">
              {match.away_logo && <img src={match.away_logo} alt="" />}
              <strong>{match.away_team}</strong>
            </div>
          </div>

          <h1>{pageTitle}</h1>

          <div className="match-detail-meta">
            <span>
              <CalendarDays size={15} />
              {matchDate
                ? matchDate.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })
                : "Fecha por confirmar"}
            </span>
            <span>
              <Gauge size={15} />
              {matchDate ? matchDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </span>
            <span>
              <MapPin size={15} />
              {match.stadium || "Estadio por confirmar"}
            </span>
          </div>
        </section>

        <nav className="match-detail-tabs" aria-label="Aspectos del partido">
          {visibleTabItems.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            const isLocked = isTabLocked(tab.id);

            return (
              <button
                key={tab.id}
                type="button"
                className={`${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`.trim()}
                onClick={() => {
                  if (!isLocked) setActiveTab(tab.id);
                }}
                aria-pressed={isActive}
                aria-disabled={isLocked}
                title={isLocked ? getLockedTabLabel(tab.id) : undefined}
              >
                <TabIcon size={16} />
                {tab.label}
                {isLocked && <Lock className="match-tab-lock" size={13} aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <section className="match-tab-panel" aria-live="polite">
          {activeTab === "stats" && (
            <section className="match-stats-section" aria-label="Stats del partido">
              <header className="match-stats-head">
                <h2>Stats del partido</h2>
              </header>

              <div className="match-stats-table">
                <div className="match-stats-table-head">
                  <div>
                    {match.home_logo && <img src={match.home_logo} alt="" />}
                    <strong>{formatTeamNameTitle(match.home_team)}</strong>
                  </div>
                  <span>Stats</span>
                  <div>
                    {match.away_logo && <img src={match.away_logo} alt="" />}
                    <strong>{formatTeamNameTitle(match.away_team)}</strong>
                  </div>
                </div>

                {statsGroups.map((group) => (
                  <section className="match-stat-group" key={group.title}>
                    <h3>{group.title}</h3>

                    {group.rows.map((row) => {
                      const maxValue = Math.max(Number(row.home) || 0, Number(row.away) || 0, 1);

                      return (
                        <div className="match-stat-row" key={`${group.title}-${row.label}`}>
                          <strong>{formatStatValue(row.home, row.type)}</strong>
                          <div className="match-stat-row-center">
                            <span>{row.label}</span>
                            <div className="match-stat-bars" aria-hidden="true">
                              <i style={{ width: `${((Number(row.home) || 0) / maxValue) * 100}%` }} />
                              <i style={{ width: `${((Number(row.away) || 0) / maxValue) * 100}%` }} />
                            </div>
                          </div>
                          <strong>{formatStatValue(row.away, row.type)}</strong>
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>
            </section>
          )}

          {activeTab === "preview" && (
            <article className="match-preview-article">
              {!previewIsPublished && !isAdmin ? (
                <section className="preview-unpublished" aria-label="Previa no publicada">
                  <span>Previa</span>
                  <h2>Esta previa aun no ha sido publicada</h2>
                  <p>
                    La redaccion esta preparando el articulo del partido. En cuanto este confirmado,
                    aparecera aqui con el texto completo y los comentarios abiertos.
                  </p>
                </section>
              ) : (
                <>
                  {isAdmin && (
                    <form className="preview-admin-panel" onSubmit={(event) => savePreviewContent(event)}>
                      <div className="preview-admin-head">
                        <div>
                          <span>Editor admin</span>
                          <strong>{previewIsPublished ? "Previa publicada" : "Borrador de previa"}</strong>
                        </div>
                        <div className="preview-admin-actions">
                          <button type="submit" disabled={savingPreview}>
                            {savingPreview ? "Guardando..." : "Guardar borrador"}
                          </button>
                          <button
                            type="button"
                            className={previewIsPublished ? "secondary" : "publish"}
                            disabled={savingPreview}
                            onClick={(event) => savePreviewContent(event, !previewIsPublished)}
                          >
                            {previewIsPublished ? "Ocultar previa" : "Publicar previa"}
                          </button>
                        </div>
                      </div>

                      <div className="preview-admin-grid">
                        <label>
                          Titular
                          <input
                            type="text"
                            value={previewForm.title}
                            onChange={(event) =>
                              setPreviewForm((current) => ({ ...current, title: event.target.value }))
                            }
                          />
                        </label>
                        <label>
                          Tags separados por comas
                          <input
                            type="text"
                            value={previewForm.tags}
                            onChange={(event) =>
                              setPreviewForm((current) => ({ ...current, tags: event.target.value }))
                            }
                          />
                        </label>
                        <label>
                          URL de imagen cuadrada
                          <input
                            type="url"
                            value={previewForm.imageUrl}
                            onChange={(event) =>
                              setPreviewForm((current) => ({ ...current, imageUrl: event.target.value }))
                            }
                          />
                        </label>
                        <label className="wide">
                          Introduccion
                          <textarea
                            value={previewForm.intro}
                            onChange={(event) =>
                              setPreviewForm((current) => ({ ...current, intro: event.target.value }))
                            }
                            rows={3}
                          />
                        </label>
                        <label className="wide">
                          Articulo
                          <textarea
                            value={previewForm.content}
                            onChange={(event) =>
                              setPreviewForm((current) => ({ ...current, content: event.target.value }))
                            }
                            rows={10}
                          />
                        </label>
                      </div>
                      {previewMessage && <small>{previewMessage}</small>}
                    </form>
                  )}

                  <header className="preview-article-hero">
                    <div className="preview-article-copy">
                      <span>Previa</span>
                      <h2>{previewTitle}</h2>
                      <p>{previewIntro}</p>

                      <div className="preview-article-meta">
                        <time dateTime={previewUpdatedAt || match.match_date}>
                          Ultima modificacion: {formatPreviewDate(previewUpdatedAt || match.match_date)}
                        </time>
                        <div className="preview-article-tags" aria-label="Etiquetas de la previa">
                          {previewTags.map((tag) => `#${tag}`).join(", ")}
                        </div>
                      </div>
                    </div>

                    <figure className="preview-article-image">
                      {previewImageUrl ? (
                        <img src={previewImageUrl} alt="" loading="lazy" />
                      ) : (
                        <span>Imagen de previa</span>
                      )}
                    </figure>
                  </header>

                  <div className="preview-article-body">
                    <ReactMarkdown>{previewBody}</ReactMarkdown>
                  </div>

                  {previewIsPublished ? (
                    <section className="preview-comments" aria-label="Comentarios de la previa">
                      <div className="preview-comments-head">
                        <span>Comunidad</span>
                        <h3>Comentarios</h3>
                      </div>

                      {currentUser ? (
                        <form className="preview-comment-form" onSubmit={submitPreviewComment}>
                          <textarea
                            value={commentText}
                            onChange={(event) => setCommentText(event.target.value)}
                            placeholder="Escribe tu comentario sobre la previa..."
                            rows={4}
                          />
                          <button type="submit" disabled={savingComment || !commentText.trim()}>
                            {savingComment ? "Publicando..." : "Publicar comentario"}
                          </button>
                        </form>
                      ) : (
                        <div className="preview-comments-login">
                          Inicia sesion para comentar esta previa.
                        </div>
                      )}

                      {commentMessage && <p className="preview-comments-message">{commentMessage}</p>}

                      <div className="preview-comments-list">
                        {previewComments.map((comment) => (
                          <article className="preview-comment" key={comment.id}>
                            <div className="preview-comment-avatar" aria-hidden="true">
                              {comment.username.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <header>
                                <strong>{comment.username}</strong>
                                <time dateTime={comment.created_at}>{formatPreviewDate(comment.created_at)}</time>
                              </header>
                              <p>{comment.content}</p>
                            </div>
                          </article>
                        ))}

                        {!previewComments.length && (
                          <div className="preview-comments-empty">
                            Todavia no hay comentarios en esta previa.
                          </div>
                        )}
                      </div>
                    </section>
                  ) : (
                    <div className="preview-comments-closed">
                      Publica la previa para abrir los comentarios a los usuarios registrados.
                    </div>
                  )}
                </>
              )}
            </article>
          )}

          {!isFemaleMatch && activeTab === "rival" && (
            <div className="match-rival-layout">
              <div className="match-rival-board">
                <div className="match-rival-photo">
                  <img src={rivalAnalysisImage} alt="" />
                  <div className="match-rival-board-title" aria-hidden="true">
                    {rivalGuideTeam?.logo_url || rivalInfo.logo ? (
                      <img src={rivalGuideTeam?.logo_url || rivalInfo.logo} alt="" />
                    ) : (
                      <span />
                    )}
                    <strong>{rivalTitle}</strong>
                  </div>
                  <div className="match-rival-slot-layer" aria-label="Cartas colocadas sobre el analisis del rival">
                    {(RIVAL_FORMATIONS[isAdmin ? rivalForm.formation : getRivalFormation(match)] || RIVAL_FORMATIONS[DEFAULT_RIVAL_FORMATION]).map((slot, slotIndex) => {
                      const placedSlot = (isAdmin ? rivalForm.playerSlots : normalizeRivalPlayerSlots(match))
                        .find((item) => Number(item.slotIndex) === slotIndex);
                      const placedPlayer = placedSlot ? rivalPlayersById[String(placedSlot.playerId)] : null;

                      return (
                        <div
                          key={slotIndex}
                          className={`match-rival-slot ${placedPlayer ? "has-player" : ""} ${draggedRivalPlayerId ? "is-drop-ready" : ""}`}
                          style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
                          onDragOver={(event) => {
                            if (isAdmin) event.preventDefault();
                          }}
                          onDrop={() => isAdmin && handleDropRivalPlayer(slotIndex)}
                        >
                          {placedPlayer && rivalGuideTeam ? (
                            <button
                              type="button"
                              className="match-rival-slot-card"
                              onClick={() => isAdmin && removeRivalPlayerFromSlot(slotIndex)}
                              title={isAdmin ? "Quitar carta" : placedPlayer.name}
                            >
                              <RivalPlayerCard player={placedPlayer} team={rivalGuideTeam} compact />
                            </button>
                          ) : isAdmin ? (
                            <span>+</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isAdmin && (
                  <label className="match-rival-formation-control">
                    <select
                      aria-label="Seleccionar formacion"
                      value={rivalForm.formation}
                      onChange={(event) =>
                        setRivalForm((current) => ({
                          ...current,
                          formation: event.target.value,
                          playerSlots: current.playerSlots.filter((slot) =>
                            Number(slot.slotIndex) < RIVAL_FORMATIONS[event.target.value].length
                          ),
                        }))
                      }
                    >
                      {Object.keys(RIVAL_FORMATIONS).map((formation) => (
                        <option key={formation} value={formation}>{formation}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="match-rival-copy">
                <span>El Rival</span>
                <h2 style={{ color: rivalTitleColor }}>{rivalTitle}</h2>
                <p>{rivalDescription}</p>

                {isAdmin && (
                  <form className="match-rival-admin" onSubmit={saveRivalContent}>
                    <label>
                      Titulo
                      <input
                        type="text"
                        value={rivalForm.title}
                        onChange={(event) =>
                          setRivalForm((current) => ({ ...current, title: event.target.value }))
                        }
                      />
                    </label>

                    <label>
                      Color del titulo
                      <input
                        type="color"
                        value={rivalForm.titleColor}
                        onChange={(event) =>
                          setRivalForm((current) => ({ ...current, titleColor: event.target.value }))
                        }
                      />
                    </label>

                    <label>
                      Parrafo
                      <textarea
                        value={rivalForm.description}
                        onChange={(event) =>
                          setRivalForm((current) => ({ ...current, description: event.target.value }))
                        }
                        />
                    </label>

                    <div className="match-rival-player-picker">
                      <div className="match-rival-player-picker-head">
                        <strong>Cartas de {rivalGuideTeam?.display_name || rivalName}</strong>
                        <span>{rivalForm.playerIds.length} elegidas</span>
                      </div>

                      {rivalGuidePlayers.length > 0 && rivalGuideTeam ? (
                        <div className="match-rival-player-picker-grid" style={{ "--team-primary": rivalGuideTeam.primary_color }}>
                          {rivalGuidePlayers.map((player) => {
                            const isSelected = rivalForm.playerIds.map(String).includes(String(player.id));

                            return (
                              <button
                                key={player.id}
                                type="button"
                                className={isSelected ? "is-selected" : ""}
                                draggable
                                onDragStart={() => setDraggedRivalPlayerId(String(player.id))}
                                onDragEnd={() => setDraggedRivalPlayerId("")}
                                onClick={() => toggleRivalPlayer(player.id)}
                              >
                                <RivalPlayerCard player={player} team={rivalGuideTeam} variant="picker" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p>{rivalGuideMessage || "Todavia no hay cartas para este equipo en LaLiga Guia."}</p>
                      )}
                    </div>

                    <button type="submit" disabled={savingRival}>
                      {savingRival ? "Guardando..." : "Guardar contenido"}
                    </button>
                    {rivalMessage && <small>{rivalMessage}</small>}
                  </form>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function RivalPlayerCard({ player, team, compact = false, variant = "" }) {
  const className = [
    "match-rival-player-card",
    compact ? "is-compact" : "",
    variant ? `is-${variant}` : "",
  ].filter(Boolean).join(" ");

  return (
    <article className={className}>
      <div className="match-rival-player-card-mark">
        {player.country && (
          <img
            className="match-rival-player-flag"
            src={player.country}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
        )}
        {team.logo_url && (
          <img
            className="match-rival-player-team-badge"
            src={team.logo_url}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
        )}
      </div>

      {player.photo_url && (
        <img src={player.photo_url} alt={player.name} loading="lazy" />
      )}

      <div className="match-rival-player-card-footer">
        <strong>{player.name}</strong>
      </div>
    </article>
  );
}

function findGuideTeamForMatch(teams, match) {
  const rivalInfo = getMatchRivalInfo(match);
  const rivalTitle = getMatchRivalTitle(match, rivalInfo.name);
  const rivalText = normalizeTeamName(`${rivalInfo.name || ""} ${rivalTitle || ""}`);

  return teams.find((team) => {
    const names = [
      team.name,
      team.display_name,
      team.slug,
    ].map(normalizeTeamName);

    return (
      (team.logo_url && rivalInfo.logo && team.logo_url === rivalInfo.logo) ||
      names.some((name) => name && (name === rivalText || rivalText.includes(name) || name.includes(rivalText)))
    );
  });
}

function getMatchRivalInfo(match) {
  if (!match) {
    return { name: "El rival", logo: "" };
  }

  const homeIsAlaves = isAlavesTeamName(match.home_team);
  const awayIsAlaves = isAlavesTeamName(match.away_team);

  if (homeIsAlaves && !awayIsAlaves) {
    return {
      name: match.away_team || "El rival",
      logo: match.away_logo || "",
    };
  }

  if (awayIsAlaves && !homeIsAlaves) {
    return {
      name: match.home_team || "El rival",
      logo: match.home_logo || "",
    };
  }

  return {
    name: match.away_team || match.home_team || "El rival",
    logo: match.away_logo || match.home_logo || "",
  };
}

function getMatchRivalTitle(match, fallbackName = "El rival") {
  const savedTitle = String(match?.rival_title || "").trim();

  if (savedTitle && !isAlavesTeamName(savedTitle)) {
    return savedTitle;
  }

  return fallbackName || "El rival";
}

function isAlavesTeamName(value = "") {
  const normalized = normalizeTeamName(value);
  return normalized.includes("alaves") || normalized === "ala";
}

function isFemaleCompetition(value = "") {
  const normalized = normalizeTeamName(value);
  return (
    normalized.includes("femenina") ||
    normalized.includes("femenino") ||
    normalized.includes("ligaf") ||
    normalized.includes("female")
  );
}

function normalizeRivalPlayerSlots(match) {
  if (Array.isArray(match?.rival_player_slots) && match.rival_player_slots.length) {
    return match.rival_player_slots
      .map((slot) => ({
        playerId: String(slot.playerId || slot.player_id || ""),
        slotIndex: Number(slot.slotIndex ?? slot.slot_index),
      }))
      .filter((slot) => slot.playerId && Number.isInteger(slot.slotIndex));
  }

  if (Array.isArray(match?.rival_player_ids)) {
    return match.rival_player_ids
      .slice(0, RIVAL_FORMATIONS[getRivalFormation(match)].length)
      .map((playerId, slotIndex) => ({
        playerId: String(playerId),
        slotIndex,
      }));
  }

  return [];
}

function getRivalFormation(match) {
  return RIVAL_FORMATIONS[match?.rival_formation]
    ? match.rival_formation
    : DEFAULT_RIVAL_FORMATION;
}

function normalizeTeamName(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(cf|fc|sad|club|de|la|el|ud|rcd|ca)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizePreviewTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean).map(String).slice(0, 6);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  return [];
}

function formatPreviewDate(date) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function buildMatchStats(match) {
  const homeScore = Number(match?.home_score || 0);
  const awayScore = Number(match?.away_score || 0);
  const homeSeed = teamSeed(match?.home_team || "local") + homeScore * 11;
  const awaySeed = teamSeed(match?.away_team || "visitante") + awayScore * 13;
  const possessionBase = 46 + (homeSeed % 12) - (awaySeed % 8) + (homeScore - awayScore) * 2;
  const homePossession = clamp(possessionBase, 38, 62);

  const home = buildTeamMatchStats(homeSeed, homeScore, awayScore, homePossession);
  const away = buildTeamMatchStats(awaySeed, awayScore, homeScore, 100 - homePossession);

  home.saves = Math.max(0, away.shotsOnTarget - awayScore);
  away.saves = Math.max(0, home.shotsOnTarget - homeScore);

  return { home, away };
}

function buildTeamMatchStats(seed, goalsFor, goalsAgainst, possession) {
  const shots = 8 + (seed % 9) + goalsFor * 2;
  const shotsOnTarget = Math.min(shots, Math.max(goalsFor, 2 + (seed % 5) + goalsFor));
  const xg = Number((0.58 + shots * 0.09 + goalsFor * 0.22 + (seed % 5) * 0.08).toFixed(2));
  const xgot = Number((Math.max(0.18, xg - 0.18 + shotsOnTarget * 0.07 - (seed % 3) * 0.05)).toFixed(2));
  const passAccuracy = clamp(76 + (possession - 50) * 0.32 + (seed % 7), 70, 91);

  return {
    possession,
    shots,
    shotsOnTarget,
    xg,
    xgot,
    bigChances: Math.max(1, goalsFor + (seed % 3)),
    passes: Math.round(310 + possession * 5.4 + (seed % 55)),
    passAccuracy,
    finalThirdPasses: Math.round(42 + possession * 0.82 + goalsFor * 8 + (seed % 18)),
    crosses: 10 + (seed % 15),
    corners: 2 + (seed % 7) + Math.max(0, goalsFor - goalsAgainst),
    offsides: seed % 4,
    fouls: 9 + (seed % 9),
    recoveries: 42 + (seed % 26),
    tackles: 12 + (seed % 12),
    clearances: 14 + goalsAgainst * 3 + (seed % 12),
    saves: 0,
    yellowCards: 1 + (seed % 4),
    redCards: seed % 11 === 0 ? 1 : 0,
  };
}

function buildStatsGroups(stats) {
  return [
    {
      title: "Remates",
      rows: [
        { label: "Remates totales", home: stats.home.shots, away: stats.away.shots },
        { label: "Remates a puerta", home: stats.home.shotsOnTarget, away: stats.away.shotsOnTarget },
        { label: "xG (goles esperados)", home: stats.home.xg, away: stats.away.xg, type: "decimal" },
        { label: "xGOT", home: stats.home.xgot, away: stats.away.xgot, type: "decimal" },
        { label: "Grandes ocasiones", home: stats.home.bigChances, away: stats.away.bigChances },
      ],
    },
    {
      title: "Pases",
      rows: [
        { label: "Pases totales", home: stats.home.passes, away: stats.away.passes },
        { label: "Precision de pase", home: stats.home.passAccuracy, away: stats.away.passAccuracy, type: "percent" },
        { label: "Pases en ultimo tercio", home: stats.home.finalThirdPasses, away: stats.away.finalThirdPasses },
        { label: "Centros al area", home: stats.home.crosses, away: stats.away.crosses },
      ],
    },
    {
      title: "Control",
      rows: [
        { label: "Posesion", home: stats.home.possession, away: stats.away.possession, type: "percent" },
        { label: "Corners", home: stats.home.corners, away: stats.away.corners },
        { label: "Fueras de juego", home: stats.home.offsides, away: stats.away.offsides },
        { label: "Faltas cometidas", home: stats.home.fouls, away: stats.away.fouls },
      ],
    },
    {
      title: "Defensa",
      rows: [
        { label: "Recuperaciones", home: stats.home.recoveries, away: stats.away.recoveries },
        { label: "Entradas", home: stats.home.tackles, away: stats.away.tackles },
        { label: "Despejes", home: stats.home.clearances, away: stats.away.clearances },
        { label: "Paradas", home: stats.home.saves, away: stats.away.saves },
      ],
    },
    {
      title: "Disciplina",
      rows: [
        { label: "Tarjetas amarillas", home: stats.home.yellowCards, away: stats.away.yellowCards },
        { label: "Tarjetas rojas", home: stats.home.redCards, away: stats.away.redCards },
      ],
    },
  ];
}

function teamSeed(name = "") {
  return [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatStatValue(value, type) {
  if (type === "percent") return `${value}%`;
  if (type === "decimal") return Number(value).toFixed(2);
  return value;
}

function formatTeamNameTitle(name = "") {
  return String(name)
    .toLocaleLowerCase("es-ES")
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es-ES"));
}
