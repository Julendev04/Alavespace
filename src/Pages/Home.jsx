import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../services/supabaseClient";
import Loader from "../components/Loader";

// COMPONENTES
import HeroMatch from "../components/home/HeroMatch";
import NewsSection from "../components/home/NewsSection";
import PlayerSearch from "../components/home/PlayerSearch";
import StatsBox from "../components/home/StatsBox";
import MatchesCalendar from "../components/home/MatchesCalendar";
import ExtraPanels from "../components/home/ExtraPanels";
import SeasonSimulator from "../components/home/SeasonSimulator";
import TransfersPanel from "../components/home/TransfersPanel";
import TransfersAdminPanel from "../components/home/TransfersAdminPanel";
import UpdatesSection from "../components/home/UpdatesSection";
import VideoBanner from "../components/home/VideoBanner";
import "./Home.css";

export default function Home() {

  // ================= STATE (TODO IGUAL) =================
  const [loading, setLoading] = useState(true);
  const [topStats, setTopStats] = useState([]);
  const [activeStat, setActiveStat] = useState("goals");

  const [openNews, setOpenNews] = useState(null);
  const [news, setNews] = useState([]);

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [results, setResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);

  const [mainMatch, setMainMatch] = useState(null);
  const [matchStatus, setMatchStatus] = useState("countdown");
  const [timeLeft, setTimeLeft] = useState("");

  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [categories, setCategories] = useState([]);
  const [showSimulator, setShowSimulator] = useState(false);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [simulatedFixtures, setSimulatedFixtures] = useState([]);
  const [simulatedStandings, setSimulatedStandings] = useState([]);
  const [showTransfers, setShowTransfers] = useState(false);
  const [showAdminTransfers, setShowAdminTransfers] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    content: "",
    image_url: "",
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

  async function handleSaveNews() {
    if (!formData.title) return;

    if (formData.id) {
      await supabase
        .from("news")
        .update({
          title: formData.title,
          content: formData.content,
          image_url: formData.image_url,
          category_id: formData.category_id,
          published_at: formData.published_at
        })
        .eq("id", formData.id);
    } else {
      await supabase
        .from("news")
        .insert([
          {
            title: formData.title,
            content: formData.content,
            image_url: formData.image_url,
            category_id: formData.category_id,
            published_at: new Date(formData.published_at).toISOString()
          }
        ]);
    }

    setIsEditing(false);

    const { data } = await supabase
      .from("news")
      .select("*, news_categories(*)")
      .order("published_at", { ascending: false });

    setNews(data || []);
  }

  function createNews() {
    setFormData({
      id: null,
      title: "",
      content: "",
      image_url: "",
      category_id: "",
      published_at: ""
    });
    setIsEditing(true);
  }
  async function fetchMatches(mainMatchId) {

    let query = supabase
      .from("matches")
      .select(`
      *,
      competitions (
        name,
        logo_url
      )
    `)
      .order("match_date", { ascending: false })
      .limit(20);

    if (mainMatchId) {
      query = query.neq("id", mainMatchId);
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

      setTeams(teamsData);
      setFixtures(fixturesData);
      setSimulatedFixtures(fixturesData);
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
      await fetchTopStats();
      await fetchMatches(null);
      await fetchCategories();

      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    fetchJugadores();
  }, [search, teamFilter, positionFilter]);

  async function fetchCategories() {
    const { data } = await supabase
      .from("news_categories")
      .select("*");

    setCategories(data || []);
  }

  async function fetchMainMatch() {
    const { data } = await supabase
      .from("matches")
      .select("*, competitions(name, logo_url)")
      .order("match_date", { ascending: true })
      .limit(10);

    if (!data || data.length === 0) return;

    const now = new Date();

    const liveMatch = data.find(match => {
      const start = new Date(match.match_date);
      const end = new Date(start.getTime() + 30 * 1000);
      return now >= start && now < end && match.status !== "finished";
    });

    const nextMatch = data.find(match =>
      new Date(match.match_date) > now && match.status === "upcoming"
    );

    const selected = liveMatch || nextMatch || data[0];

    setMainMatch(selected);

    if (liveMatch) setMatchStatus("live");
    else if (nextMatch) setMatchStatus("countdown_home");
    else setMatchStatus("finished");
  }

  useEffect(() => {
    fetchMainMatch();
  }, []);


  useEffect(() => {
    if (!mainMatch) return;

    const interval = setInterval(() => {
      const now = new Date();
      const matchDate = new Date(mainMatch.match_date);

      const diff = matchDate - now;

      if (diff > 0) {
        setMatchStatus("countdown_home");

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        // aquí podrías mejorar con lógica real de "live"
        setMatchStatus("live");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mainMatch]);
  // ================= FUNCTIONS (SE MANTIENEN IGUAL) =================
  async function fetchTopStats() {
    const { data } = await supabase
      .from("jugadores")
      .select("*")
      .eq("team_type", "first_team");

    if (data) setTopStats(data);
  }

  async function fetchStandings() {
    const { data } = await supabase
      .from("standings")
      .select("*")
      .order("position");

    setStandings(data);
  }


  async function fetchJugadores() {
    let query = supabase.from("jugadores").select("*");

    if (search) query = query.ilike("name", `%${search}%`);
    if (teamFilter !== "all") query = query.eq("team_type", teamFilter);
    if (positionFilter !== "all") query = query.eq("position", positionFilter);

    const { data } = await query.limit(10);
    setResults(data || []);
  }

  function getTeamName(teamId) {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown";
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

    if (!teams.length || !simulatedFixtures.length) return;

    const newStandings = calculateStandings(simulatedFixtures, teams);

    setSimulatedStandings(newStandings);

  }, [simulatedFixtures, teams]);
  if (loading) return <Loader />;

  // ================= RENDER =================
  return (
    <div className="home-page">
      {mainMatch ? (
        <HeroMatch
          mainMatch={mainMatch}
          matchStatus={matchStatus}
          timeLeft={timeLeft}
        />
      ) : (
        <div className="hero-placeholder">
          Cargando partido...
        </div>
      )}

      <NewsSection
        news={news}
        setNews={setNews}
        openNews={openNews}
        setOpenNews={setOpenNews}
        isAdmin={isAdmin}
        categories={categories}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        formData={formData}
        setFormData={setFormData}
        handleSaveNews={handleSaveNews}
        onCreateNews={createNews}
        userId={userId}
      />


      <div className="media-section">
        <div className="media-wrapper">

          <div className="left-column">

            <PlayerSearch
              search={search}
              setSearch={setSearch}
              teamFilter={teamFilter}
              setTeamFilter={setTeamFilter}
              positionFilter={positionFilter}
              setPositionFilter={setPositionFilter}
              results={results}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
            />

            <StatsBox
              topStats={topStats}
              activeStat={activeStat}
              setActiveStat={setActiveStat}
            />

          </div>

          <div className="right-column">

            <VideoBanner />

            <MatchesCalendar matches={matches} standings={standings} />

          </div>

        </div>
      </div>

      <ExtraPanels
        setShowSimulator={setShowSimulator}
        setShowTransfers={setShowTransfers}
      />

      <SeasonSimulator
        showSimulator={showSimulator}
        setShowSimulator={setShowSimulator}
        simulatedFixtures={simulatedFixtures}
        simulatedStandings={simulatedStandings}
        updateScore={updateScore}
        getTeamName={getTeamName}
      />
      <TransfersPanel
        showTransfers={showTransfers}
        setShowTransfers={setShowTransfers}
        isAdmin={isAdmin}
      />
      {showAdminTransfers && (
        <div className="simulator-overlay">
          <div className="simulator-modal">

            <button
              className="close-btn"
              onClick={() => setShowAdminTransfers(false)}
            >
              ✕
            </button>

            <TransfersAdminPanel />

          </div>
        </div>
      )}

      <UpdatesSection />

    </div>
  );
}
