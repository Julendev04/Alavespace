import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import Loader from "../components/Loader";
import { FaMicrophone, FaPlay, FaTimes } from "react-icons/fa";
import podcastLogo from "../assets/LogoP.png";
import podcastLogoAlt from "../assets/LogoP2.png";

// COMPONENTES
import NewsSection from "../components/home/NewsSection";
import HomeArticlesPanel from "../components/home/HomeArticlesPanel";
import MatchesCalendar from "../components/home/MatchesCalendar";
import SeasonSimulator from "../components/home/SeasonSimulator";
import TransfersPanel from "../components/home/TransfersPanel";
import UpdatesSection from "../components/home/UpdatesSection";
import "./Home.css";

const NEWS_IMAGES_BUCKET = "news-images";
const PODCAST_URL = "https://www.ivoox.com/";

export default function Home() {

  // ================= STATE (TODO IGUAL) =================
  const [loading, setLoading] = useState(true);
  const [showPodcastAd, setShowPodcastAd] = useState(true);

  const [openNews, setOpenNews] = useState(null);
  const [news, setNews] = useState([]);

  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);

  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSavingNews, setIsSavingNews] = useState(false);

  const [categories, setCategories] = useState([]);
  const [showSimulator, setShowSimulator] = useState(false);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [simulatedFixtures, setSimulatedFixtures] = useState([]);
  const [simulatedStandings, setSimulatedStandings] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    content: "",
    image_url: "",
    image_file: null,
    category_id: "",
    published_at: ""
  });

  const matchesRef = useRef(null);

  // ================= EFFECTS =================
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUserId(data.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "admin") setIsAdmin(true);
      }
    };

    getUser();
  }, []);

  async function fetchNews() {
    const { data } = await supabase
      .from("news")
      .select("*, news_categories(*)")
      .order("published_at", { ascending: false });

    setNews(data || []);
  }

  function getStoragePathFromPublicUrl(url) {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);
      const marker = `/object/public/${NEWS_IMAGES_BUCKET}/`;
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      if (markerIndex === -1) return null;

      return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  }

  async function uploadNewsImage(file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    const randomId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const filePath = `news/${randomId}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(NEWS_IMAGES_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(NEWS_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return { publicUrl: data.publicUrl, filePath };
  }

  async function handleSaveNews() {
    if (!formData.title) return;

    setIsSavingNews(true);

    let uploadedImagePath = null;

    try {
      let imageUrl = formData.image_url;

      if (formData.image_file) {
        const uploadedImage = await uploadNewsImage(formData.image_file);
        uploadedImagePath = uploadedImage.filePath;
        imageUrl = uploadedImage.publicUrl;
      }

      const publishedAt = formData.published_at
        ? new Date(formData.published_at).toISOString()
        : new Date().toISOString();

      if (formData.id) {
        const { error } = await supabase
          .from("news")
          .update({
            title: formData.title,
            content: formData.content,
            image_url: imageUrl,
            category_id: formData.category_id,
            published_at: publishedAt
          })
          .eq("id", formData.id);

        if (error) throw error;

        const oldImagePath = getStoragePathFromPublicUrl(formData.image_url);
        if (formData.image_file && oldImagePath && oldImagePath !== uploadedImagePath) {
          await supabase.storage.from(NEWS_IMAGES_BUCKET).remove([oldImagePath]);
        }
      } else {
        const { error } = await supabase
          .from("news")
          .insert([
            {
              title: formData.title,
              content: formData.content,
              image_url: imageUrl,
              category_id: formData.category_id,
              published_at: publishedAt
            }
          ]);

        if (error) throw error;
      }

      setIsEditing(false);
      await fetchNews();
    } catch (error) {
      if (uploadedImagePath) {
        await supabase.storage.from(NEWS_IMAGES_BUCKET).remove([uploadedImagePath]);
      }

      console.error(error);
      alert("No se pudo guardar la noticia.");
    } finally {
      setIsSavingNews(false);
    }
  }

  async function handleDeleteNews(item) {
    if (!item?.id) return;

    const confirmed = window.confirm(`¿Borrar la noticia "${item.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error(error);
      alert("No se pudo borrar la noticia.");
      return;
    }

    const imagePath = getStoragePathFromPublicUrl(item.image_url);
    if (imagePath) {
      await supabase.storage.from(NEWS_IMAGES_BUCKET).remove([imagePath]);
    }

    if (openNews?.id === item.id) {
      setOpenNews(null);
    }

    setIsEditing(false);
    await fetchNews();
  }

  function createNews() {
    setFormData({
      id: null,
      title: "",
      content: "",
      image_url: "",
      image_file: null,
      category_id: "",
      published_at: ""
    });
    setIsEditing(true);
  }
  async function fetchMatches(excludedMatchId) {

    let query = supabase
      .from("matches")
      .select(`
      *,
      competitions (
        name,
        logo_url
      )
    `)
      .order("match_date", { ascending: false });

    if (excludedMatchId) {
      query = query.neq("id", excludedMatchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return;
    }

    setMatches(data || []);
  }

  useEffect(() => {
    async function loadData() {
      const { data: teamsData } = await supabase.from("teams").select("*");
      const { data: fixturesData } = await supabase.from("fixtures").select("*");

      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setFixtures(Array.isArray(fixturesData) ? fixturesData : []);
      setSimulatedFixtures(Array.isArray(fixturesData) ? fixturesData : []);
    }

    loadData();
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data: newsData } = await supabase
        .from("news")
        .select("*, news_categories(*)")
        .order("published_at", { ascending: false });

      setNews(newsData || []);

      await fetchStandings();
      await fetchMatches(null);
      await fetchCategories();

      setLoading(false);
    };

    init();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from("news_categories")
      .select("*");

    setCategories(data || []);
  }

  // ================= FUNCTIONS (SE MANTIENEN IGUAL) =================
  async function fetchStandings() {
    const [{ data: standingsData }, { data: teamsData }] = await Promise.all([
      supabase
        .from("league_standings_live")
        .select("*")
        .eq("season", "2026/27")
        .order("position"),
      supabase
        .from("league_teams")
        .select("id, name, short_name")
        .eq("season", "2026/27")
    ]);

    const teamsById = new Map((teamsData || []).map((team) => [team.id, team]));
    const teamsByName = new Map(
      (teamsData || []).map((team) => [normalizeTeamName(team.name), team])
    );

    const hydratedStandings = (standingsData || []).map((team) => {
      const leagueTeam =
        teamsById.get(team.team_id) ||
        teamsByName.get(normalizeTeamName(team.team_name));

      return {
        ...team,
        team_name: leagueTeam?.short_name || leagueTeam?.name || team.team_name
      };
    });

    setStandings(hydratedStandings);
  }


  function getTeamName(teamId) {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown";
  }

  function normalizeTeamName(name = "") {
    return String(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function updateScore(matchId, side, value) {
    setSimulatedFixtures(prev =>
      prev.map(match => {
        if (match.id !== matchId) return match;

        if (side === "home") {
          return { ...match, home_goals: Number(value) };
        } else {
          return { ...match, away_goals: Number(value) };
        }
      })
    );
  }

  function calculateStandings(fixtures, teams) {

    const table = {};

    teams.forEach(team => {
      table[team.id] = {
        team_id: team.id,
        name: team.name,
        points: 0
      };
    });

    fixtures.forEach(match => {

      if (
        match.home_goals === null ||
        match.away_goals === null ||
        match.home_goals === "" ||
        match.away_goals === ""
      ) return;

      const home = table[match.home_team];
      const away = table[match.away_team];

      if (!home || !away) return;

      if (match.home_goals > match.away_goals) {
        home.points += 3;
      }
      else if (match.home_goals < match.away_goals) {
        away.points += 3;
      }
      else {
        home.points += 1;
        away.points += 1;
      }

    });

    return Object.values(table).sort((a, b) => b.points - a.points);
  }

  useEffect(() => {

    if (!Array.isArray(teams) || !Array.isArray(simulatedFixtures)) return;
    if (!teams.length || !simulatedFixtures.length) return;

    const newStandings = calculateStandings(simulatedFixtures, teams);

    setSimulatedStandings(newStandings);

  }, [simulatedFixtures, teams]);
  if (loading) {
    return <Loader />;
  }

  // ================= RENDER =================
  return (
    <div className="home-page">
      {showPodcastAd && (
        <div className="home-podcast-modal-backdrop" role="presentation">
          <section
            className="home-podcast-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-podcast-modal-title"
          >
            <button
              type="button"
              className="home-podcast-modal-close"
              onClick={() => setShowPodcastAd(false)}
              aria-label="Cerrar anuncio del podcast"
            >
              <FaTimes aria-hidden="true" />
            </button>

            <span className="home-podcast-modal-logo" aria-hidden="true">
              <img className="is-primary" src={podcastLogo} alt="" loading="lazy" />
              <img className="is-secondary" src={podcastLogoAlt} alt="" loading="lazy" />
            </span>

            <span className="home-podcast-modal-wave" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <i key={index} />
              ))}
            </span>

            <p className="home-podcast-modal-kicker">Nuevo podcast de Alavesfera</p>
            <h2 id="home-podcast-modal-title">Sufrir con pasion I</h2>
            <strong>Opinion, actualidad y debate del Glorioso en formato audio.</strong>

            <a
              className="home-podcast-modal-action"
              href={PODCAST_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowPodcastAd(false)}
            >
              <FaMicrophone aria-hidden="true" />
              <span>Temporada 1: escuchar ahora</span>
              <FaPlay aria-hidden="true" />
            </a>

            <span className="home-podcast-modal-words" aria-hidden="true">
              <b>Opinion</b>
              <b>Debate</b>
              <b>Actualidad</b>
            </span>
          </section>
        </div>
      )}

      <NewsSection
        news={news}
        setNews={setNews}
        openNews={openNews}
        setOpenNews={setOpenNews}
        isAdmin={isAdmin}
        categories={categories}
        matches={matches}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        handleSaveNews={handleSaveNews}
        handleDeleteNews={handleDeleteNews}
        onCreateNews={createNews}
        isSavingNews={isSavingNews}
        userId={userId}
      />


      <div className="media-section">
        <div className="media-wrapper">

          <div className="left-column">

            <HomeArticlesPanel isAdmin={isAdmin} />

          </div>

          <div className="right-column">

          <MatchesCalendar
            matches={matches}
            standings={standings}
            isAdmin={isAdmin}
            onMatchCreated={() => fetchMatches(null)}
          />

        </div>

          <TransfersPanel
            inline
            isAdmin={isAdmin}
          />

        </div>
      </div>

      <SeasonSimulator
        showSimulator={showSimulator}
        setShowSimulator={setShowSimulator}
        simulatedFixtures={simulatedFixtures}
        simulatedStandings={simulatedStandings}
        updateScore={updateScore}
        getTeamName={getTeamName}
      />
      <UpdatesSection isAdmin={isAdmin} />

    </div>
  );
}
