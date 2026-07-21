import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip
} from "chart.js";
import { Activity, CalendarDays, ChevronsUpDown, ChevronLeft, ChevronRight, Download, Flag, House, Plane, Plus, Table2, Trash2, Trophy, X } from "lucide-react";
import { FaHome, FaPlane } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import calendarDownloadTemplate from "../assets/Plantilla_calen_descargable.jpg";
import { supabase } from "../services/supabaseClient";
import "./Trayectoria.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const LEAGUE_SEASON = "2026/27";
const MATCH_TEAM_SECTIONS = [
  { id: "first", label: "Primer equipo" },
  { id: "reserve", label: "Filial" },
  { id: "female", label: "Femenino" }
];

const tabIcons = {
  calendar: CalendarDays,
  results: Activity,
  standings: Table2
};

function getTrajectoryTabLabel(id) {
  if (id === "results") return "Din\u00e1mica";
  if (id === "standings") return "Clasificaci\u00f3n";
  return "Calendario";
}

function isAlavesTeamName(name = "") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("alaves");
}

function normalizeTeamName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function slugifyTeamName(name = "") {
  return normalizeTeamName(name)
    .replace(/\b(cf|fc|rcd|rc|ud|ca)\b/g, "")
    .replace(/\b(de|del|la|el)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const LALIGA_GUIDE_SLUGS = {
  "atletico-madrid": "atletico-madrid",
  "athletic-club": "athletic-club",
  "barcelona": "fc-barcelona",
  "betis": "real-betis",
  "celta-vigo": "celta-vigo",
  "deportivo-alaves": "deportivo-alaves",
  "alaves": "deportivo-alaves",
  "deportivo-coruna": "deportivo-la-coruna",
  "espanyol": "espanyol",
  "getafe": "getafe-cf",
  "malaga": "malaga-cf",
  "osasuna": "osasuna",
  "racing-santander": "racing-santander",
  "rayo-vallecano": "rayo-vallecano",
  "real-madrid": "real-madrid",
  "real-sociedad": "real-sociedad",
  "sevilla": "sevilla-fc",
  "valencia": "valencia-cf",
  "villarreal": "villarreal-cf"
};

const tabs = [
  { id: "calendar", label: "Calendario" },
  { id: "results", label: "Dinámica" },
  { id: "standings", label: "Clasificación" }
];

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("es-ES", {
    month: "long"
  });

  return `${monthName} ${year}`;
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short"
  });
}

function hasScore(match) {
  return match.home_score != null && match.away_score != null;
}

function isAlaves(teamName = "") {
  return /alav[eé]s|deportivo alav[eé]s/i.test(teamName);
}

function getResultType(match) {
  if (!hasScore(match)) return "pending";

  const homeScore = Number(match.home_score);
  const awayScore = Number(match.away_score);

  if (homeScore === awayScore) return "draw";

  const alavesHome = isAlaves(match.home_team);
  const alavesAway = isAlaves(match.away_team);

  if (alavesHome) return homeScore > awayScore ? "win" : "loss";
  if (alavesAway) return awayScore > homeScore ? "win" : "loss";

  return "played";
}

function getResultLabel(result) {
  if (result === "win") return "Victoria";
  if (result === "loss") return "Derrota";
  if (result === "draw") return "Empate";
  return "Jugado";
}

function getAlavesOpponent(match) {
  const alavesHome = isAlaves(match.home_team);

  return {
    name: alavesHome ? match.away_team : match.home_team,
    logo: alavesHome ? match.away_logo : match.home_logo
  };
}

function getCompetitionMeta(name = "") {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("copa")) {
    return { label: "Copa del Rey", className: "copa" };
  }

  if (normalized.includes("segunda")) {
    return { label: "Segunda Federación", className: "filial" };
  }

  if (normalized.includes("femenina") || normalized.includes("moeve")) {
    return { label: "LIGA F", className: "femenino" };
  }

  if (normalized.includes("laliga") || normalized.includes("liga ea")) {
    return { label: "LALIGA", className: "laliga" };
  }

  return { label: name || "Competición", className: "default" };
}

function getMatchLabel(match) {
  const competition = getCompetitionMeta(match.competitions?.name);
  const normalizedCompetition = (match.competitions?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const round = normalizedCompetition.includes("amistoso") || normalizedCompetition.includes("friendly")
    ? "AMISTOSO"
    : match.week
      ? `J${match.week}`
      : "";

  return { ...competition, round };
}

function getMatchRivalInfo(match) {
  const homeIsAlaves = isAlaves(match.home_team);
  const awayIsAlaves = isAlaves(match.away_team);

  if (homeIsAlaves && !awayIsAlaves) {
    return { name: match.away_team || "Rival", logo: match.away_logo || "" };
  }

  if (awayIsAlaves && !homeIsAlaves) {
    return { name: match.home_team || "Rival", logo: match.home_logo || "" };
  }

  return {
    name: match.away_team || match.home_team || "Rival",
    logo: match.away_logo || match.home_logo || ""
  };
}

function getCalendarMatchText(matchLabel) {
  if (matchLabel.round?.startsWith("J")) {
    return `JORNADA ${matchLabel.round.slice(1)}`;
  }

  return matchLabel.round || matchLabel.label;
}

function getCalendarExportMatchText(matchLabel) {
  if (matchLabel.round?.startsWith("J")) {
    return `J${matchLabel.round.slice(1)}`;
  }

  return matchLabel.round || matchLabel.label;
}

function CalendarMatchSideIcon({ side }) {
  const isAway = String(side || "").toUpperCase() === "VISITANTE";
  const Icon = isAway ? FaPlane : FaHome;
  const label = isAway ? "Visitante" : "Local";

  return (
    <span className="calendar-match-side" aria-label={label} title={label}>
      <Icon aria-hidden="true" />
    </span>
  );
}

function getCalendarDays(activeMonthKey) {
  const [year, month] = activeMonthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < leadingEmptyDays; i += 1) {
    const date = new Date(year, month - 1, i - leadingEmptyDays + 1);
    days.push({ date, currentMonth: false });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push({ date: new Date(year, month - 1, day), currentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - leadingEmptyDays - lastDay.getDate() + 1;
    days.push({ date: new Date(year, month, nextDay), currentMonth: false });
  }

  return days;
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawDiagonalRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function fitCanvasText(ctx, text, maxWidth) {
  const value = String(text || "");
  if (ctx.measureText(value).width <= maxWidth) return value;

  let trimmed = value;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return `${trimmed.trim()}...`;
}

function drawCanvasImageCover(ctx, image, x, y, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;

  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

function drawCanvasImageContain(ctx, image, x, y, width, height) {
  const ratio = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;

  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

function drawCanvasImageWhite(ctx, image, x, y, width, height) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");

  drawCanvasImageContain(maskCtx, image, 0, 0, width, height);
  maskCtx.globalCompositeOperation = "source-in";
  maskCtx.fillStyle = "#ffffff";
  maskCtx.fillRect(0, 0, width, height);

  ctx.drawImage(maskCanvas, x, y, width, height);
}

function drawCanvasImageCoverFadeRight(ctx, image, x, y, width, height, fadeWidth = 12) {
  const buffer = document.createElement("canvas");
  buffer.width = Math.ceil(width);
  buffer.height = Math.ceil(height);
  const bufferCtx = buffer.getContext("2d");

  drawCanvasImageCover(bufferCtx, image, 0, 0, buffer.width, buffer.height);

  const gradient = bufferCtx.createLinearGradient(buffer.width - fadeWidth, 0, buffer.width, 0);
  gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  bufferCtx.globalCompositeOperation = "destination-in";
  bufferCtx.fillStyle = gradient;
  bufferCtx.fillRect(0, 0, buffer.width, buffer.height);

  ctx.drawImage(buffer, x, y, width, height);
}

function drawCanvasHouseIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(size * 0.08, size * 0.48);
  ctx.lineTo(size * 0.5, size * 0.12);
  ctx.lineTo(size * 0.92, size * 0.48);
  ctx.lineTo(size * 0.82, size * 0.6);
  ctx.lineTo(size * 0.78, size * 0.56);
  ctx.lineTo(size * 0.78, size * 0.88);
  ctx.lineTo(size * 0.58, size * 0.88);
  ctx.lineTo(size * 0.58, size * 0.64);
  ctx.lineTo(size * 0.42, size * 0.64);
  ctx.lineTo(size * 0.42, size * 0.88);
  ctx.lineTo(size * 0.22, size * 0.88);
  ctx.lineTo(size * 0.22, size * 0.56);
  ctx.lineTo(size * 0.18, size * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.rect(size * 0.66, size * 0.18, size * 0.12, size * 0.2);
  ctx.fill();
  ctx.restore();
}

function drawCanvasPlaneIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.translate(-size / 2, -size / 2);
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.03);
  ctx.bezierCurveTo(size * 0.58, size * 0.03, size * 0.62, size * 0.1, size * 0.62, size * 0.18);
  ctx.lineTo(size * 0.62, size * 0.42);
  ctx.lineTo(size * 0.95, size * 0.62);
  ctx.lineTo(size * 0.95, size * 0.76);
  ctx.lineTo(size * 0.62, size * 0.68);
  ctx.lineTo(size * 0.62, size * 0.83);
  ctx.lineTo(size * 0.76, size * 0.92);
  ctx.lineTo(size * 0.76, size * 0.99);
  ctx.lineTo(size * 0.5, size * 0.92);
  ctx.lineTo(size * 0.24, size * 0.99);
  ctx.lineTo(size * 0.24, size * 0.92);
  ctx.lineTo(size * 0.38, size * 0.83);
  ctx.lineTo(size * 0.38, size * 0.68);
  ctx.lineTo(size * 0.05, size * 0.76);
  ctx.lineTo(size * 0.05, size * 0.62);
  ctx.lineTo(size * 0.38, size * 0.42);
  ctx.lineTo(size * 0.38, size * 0.18);
  ctx.bezierCurveTo(size * 0.38, size * 0.1, size * 0.42, size * 0.03, size * 0.5, size * 0.03);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function getStandingZone(position) {
  if (position <= 5) return "zone-blue";
  if (position === 6) return "zone-orange";
  if (position === 7 || position === 8) return "zone-green";
  if (position >= 18) return "zone-red";
  return "";
}

export default function Trayectoria() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabs.some((tab) => tab.id === requestedTab) ? requestedTab : "calendar"
  );
  const [matches, setMatches] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [standings, setStandings] = useState([]);
  const [leagueMatches, setLeagueMatches] = useState([]);
  const [leagueTeams, setLeagueTeams] = useState([]);
  const [activeLeagueWeek, setActiveLeagueWeek] = useState(null);
  const [activeMonth, setActiveMonth] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [leagueAdminMessage, setLeagueAdminMessage] = useState("");
  const [editingLeagueMatchId, setEditingLeagueMatchId] = useState(null);
  const [isLeagueCreateOpen, setIsLeagueCreateOpen] = useState(false);
  const [isCalendarExporting, setIsCalendarExporting] = useState(false);
  const [isStandingsExporting, setIsStandingsExporting] = useState(false);
  const standingsExportRef = useRef(null);
  const [newLeagueMatch, setNewLeagueMatch] = useState({
    week: "",
    match_date: "",
    home_team_id: "",
    away_team_id: "",
    home_score: "",
    away_score: "",
    status: "scheduled"
  });
  const [loading, setLoading] = useState(true);
  const [isCalendarAdminOpen, setIsCalendarAdminOpen] = useState(false);
  const [calendarAdminMessage, setCalendarAdminMessage] = useState("");
  const [newCalendarMatch, setNewCalendarMatch] = useState({
    home_team: "Deportivo Alavés",
    away_team: "",
    match_date: "",
    week: "",
    team_section: "first",
    competition_id: "",
    stadium: "",
    match_side: "LOCAL",
    home_score: "",
    away_score: "",
    status: "upcoming"
  });

  async function loadTrajectoryData() {
    setLoading(true);

    const [
      { data: matchesData },
      { data: standingsData },
      { data: leagueMatchesData },
      { data: leagueTeamsData },
      { data: competitionsData }
    ] = await Promise.all([
      supabase
        .from("matches")
        .select("*, competitions(name, logo_url)")
        .order("match_date", { ascending: true }),
      supabase
        .from("league_standings_live")
        .select("*")
        .eq("season", LEAGUE_SEASON)
        .order("position", { ascending: true }),
      supabase
        .from("league_matches")
        .select("*")
        .eq("season", LEAGUE_SEASON)
        .order("week", { ascending: true })
        .order("match_date", { ascending: true }),
      supabase
        .from("league_teams")
        .select("id, name, short_name, logo_url")
        .eq("season", LEAGUE_SEASON)
        .order("name", { ascending: true }),
      supabase
        .from("competitions")
        .select("id, name, logo_url")
        .order("name", { ascending: true })
    ]);

    const leagueTeams = leagueTeamsData || [];
    const leagueTeamsById = new Map(leagueTeams.map((team) => [team.id, team]));
    const leagueTeamsByName = new Map(
      leagueTeams.map((team) => [normalizeTeamName(team.name), team])
    );
    const hydratedLeagueMatches = (leagueMatchesData || []).map((match) => ({
      ...match,
      home_team: leagueTeamsById.get(match.home_team_id) || null,
      away_team: leagueTeamsById.get(match.away_team_id) || null
    }));
    const hydratedStandings = (standingsData || [])
      .map((team) => {
        const leagueTeam =
          leagueTeamsById.get(team.team_id) ||
          leagueTeamsByName.get(normalizeTeamName(team.team_name));

        return {
          ...team,
          team_name: leagueTeam?.short_name || leagueTeam?.name || team.team_name,
          team_logo: team.team_logo || leagueTeam?.logo_url
        };
      });

    const isPreseasonTable = hydratedStandings.every((team) =>
      [
        team.played,
        team.wins,
        team.draws,
        team.losses,
        team.goals_for,
        team.goals_against,
        team.goal_diff,
        team.points
      ].every((value) => Number(value || 0) === 0)
    );

    hydratedStandings.sort((a, b) => {
      const nameSort = String(a.team_name || "").localeCompare(String(b.team_name || ""), "es", {
        sensitivity: "base"
      });

      if (isPreseasonTable) return nameSort;

      return (
        Number(b.points || 0) - Number(a.points || 0) ||
        Number(b.goal_diff || 0) - Number(a.goal_diff || 0) ||
        Number(b.goals_for || 0) - Number(a.goals_for || 0) ||
        nameSort
      );
    });

    setMatches(matchesData || []);
    setStandings(hydratedStandings);
    setLeagueTeams(leagueTeams);
    setLeagueMatches(hydratedLeagueMatches);
    setCompetitions(competitionsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTrajectoryData();
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    }

    checkAdmin();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const months = useMemo(() => {
    const keys = [...new Set(matches.map((match) => monthKey(match.match_date)))].sort(
      (firstMonth, secondMonth) => firstMonth.localeCompare(secondMonth)
    );
    return keys.length ? keys : [monthKey(new Date())];
  }, [matches]);

  useEffect(() => {
    if (activeMonth || months.length === 0) return;

    const currentMonth = monthKey(new Date());
    setActiveMonth(months.includes(currentMonth) ? currentMonth : months[0]);
  }, [activeMonth, months]);

  const matchesByMonth = useMemo(() => {
    return matches.reduce((acc, match) => {
      const key = monthKey(match.match_date);
      acc[key] = acc[key] || [];
      acc[key].push(match);
      return acc;
    }, {});
  }, [matches]);

  const calendarLegendItems = useMemo(() => {
    const findCompetitionLogo = (className, fallbackPatterns = []) => {
      return competitions.find((competition) => {
        const meta = getCompetitionMeta(competition.name);
        const normalizedName = normalizeTeamName(competition.name);

        return meta.className === className || fallbackPatterns.some((pattern) => normalizedName.includes(pattern));
      })?.logo_url || "";
    };

    return [
      {
        className: "laliga",
        label: "LaLiga EA Sports",
        logo: findCompetitionLogo("laliga", ["laliga", "liga ea"])
      },
      {
        className: "copa",
        label: "Copa del Rey",
        logo: findCompetitionLogo("copa", ["copa"])
      },
      {
        className: "filial",
        label: "Segunda Federacion",
        logo: findCompetitionLogo("filial", ["segunda", "segunda federacion"])
      },
      {
        className: "femenino",
        label: "Liga Femenina Moeve",
        logo: findCompetitionLogo("femenino", ["femenina", "moeve"])
      },
      {
        className: "amistoso",
        label: "Amistosos",
        logo: findCompetitionLogo("default", ["amistoso", "friendly"])
      }
    ];
  }, [competitions]);

  const playedMonths = useMemo(() => {
    return months
      .map((key) => ({
        key,
        matches: (matchesByMonth[key] || []).filter(hasScore)
      }))
      .filter((group) => group.matches.length > 0)
      .reverse();
  }, [matchesByMonth, months]);
  const playedTrajectoryMatches = useMemo(() => {
    return matches
      .filter((match) => match.status === "finished" && hasScore(match))
      .slice()
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  }, [matches]);
  const trajectoryCompetition = useMemo(() => {
    return (
      playedTrajectoryMatches.find((match) => match.competitions)?.competitions ||
      matches.find((match) => match.competitions)?.competitions ||
      competitions.find((competition) => normalizeTeamName(competition.name).includes("laliga")) ||
      null
    );
  }, [competitions, matches, playedTrajectoryMatches]);

  const calendarDays = activeMonth ? getCalendarDays(activeMonth) : [];
  const leagueWeeks = useMemo(() => {
    return [...new Set(leagueMatches.map((match) => match.week))]
      .filter((week) => week != null)
      .sort((a, b) => a - b);
  }, [leagueMatches]);
  const selectedLeagueWeek = activeLeagueWeek ?? leagueWeeks[0] ?? null;
  const selectedLeagueWeekIndex = leagueWeeks.indexOf(selectedLeagueWeek);
  const selectedLeagueMatches = useMemo(() => {
    if (selectedLeagueWeek == null) return [];
    return leagueMatches.filter((match) => match.week === selectedLeagueWeek);
  }, [leagueMatches, selectedLeagueWeek]);
  const alavesTeam = useMemo(() => {
    return leagueTeams.find(
      (team) => isAlavesTeamName(team.name) || isAlavesTeamName(team.short_name)
    );
  }, [leagueTeams]);
  const alavesPointsProgress = useMemo(() => {
    if (!alavesTeam) return [];

    const pointsByWeek = new Map();

    leagueMatches.forEach((match) => {
      if (
        match.status !== "finished" ||
        match.home_score == null ||
        match.away_score == null ||
        (match.home_team_id !== alavesTeam.id && match.away_team_id !== alavesTeam.id)
      ) return;

      const isHome = match.home_team_id === alavesTeam.id;
      const alavesGoals = Number(isHome ? match.home_score : match.away_score);
      const opponentGoals = Number(isHome ? match.away_score : match.home_score);
      const earnedPoints = alavesGoals > opponentGoals ? 3 : alavesGoals === opponentGoals ? 1 : 0;

      pointsByWeek.set(match.week, (pointsByWeek.get(match.week) || 0) + earnedPoints);
    });

    let accumulatedPoints = 0;
    return [...pointsByWeek.entries()]
      .sort(([weekA], [weekB]) => weekA - weekB)
      .map(([week, earnedPoints]) => {
        accumulatedPoints += earnedPoints;
        return { week, earnedPoints, accumulatedPoints };
      });
  }, [alavesTeam, leagueMatches]);
  const alavesChartData = useMemo(() => ({
    labels: alavesPointsProgress.map((item) => `J${item.week}`),
    datasets: [
      {
        data: alavesPointsProgress.map((item) => item.accumulatedPoints),
        backgroundColor: "#1769aa",
        hoverBackgroundColor: "#0f5ca3",
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 44
      }
    ]
  }), [alavesPointsProgress]);
  const alavesChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 650,
      easing: "easeOutQuart"
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} puntos`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#596b80",
          font: { family: "Montserrat", weight: "700" }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#596b80",
          font: { family: "Montserrat", weight: "700" }
        },
        grid: { color: "rgba(16, 42, 67, 0.08)" }
      }
    }
  }), []);

  useEffect(() => {
    if (activeLeagueWeek != null || leagueWeeks.length === 0) return;
    setActiveLeagueWeek(leagueWeeks[0]);
  }, [activeLeagueWeek, leagueWeeks]);

  function changeMonth(direction) {
    if (!activeMonth) return;

    const [year, month] = activeMonth.split("-").map(Number);
    const nextMonth = new Date(year, month - 1 + direction, 1);
    setActiveMonth(monthKey(nextMonth));
  }

  function handleCalendarMatchChange(field, value) {
    setNewCalendarMatch((current) => ({
      ...current,
      [field]: value
    }));
  }

  function resetCalendarMatchForm() {
    setNewCalendarMatch({
      home_team: "Deportivo Alavés",
      away_team: "",
      match_date: "",
      week: "",
      team_section: "first",
      competition_id: "",
      stadium: "",
      match_side: "LOCAL",
      home_score: "",
      away_score: "",
      status: "upcoming"
    });
  }

  async function saveCalendarMatch(event) {
    event.preventDefault();
    setCalendarAdminMessage("");

    if (!newCalendarMatch.home_team.trim() || !newCalendarMatch.away_team.trim() || !newCalendarMatch.match_date) {
      setCalendarAdminMessage("Completa los equipos y la fecha del partido.");
      return;
    }

    if (
      newCalendarMatch.status === "finished" &&
      (newCalendarMatch.home_score === "" || newCalendarMatch.away_score === "")
    ) {
      setCalendarAdminMessage("Un partido finalizado necesita ambos marcadores.");
      return;
    }

    const payload = {
      home_team: newCalendarMatch.home_team.trim(),
      away_team: newCalendarMatch.away_team.trim(),
      match_date: new Date(newCalendarMatch.match_date).toISOString(),
      week: newCalendarMatch.week === "" ? null : Number(newCalendarMatch.week),
      team_section: newCalendarMatch.team_section || "first",
      competition_id: newCalendarMatch.competition_id || null,
      stadium: newCalendarMatch.stadium.trim() || null,
      match_side: newCalendarMatch.match_side || null,
      home_score: newCalendarMatch.home_score === "" ? null : Number(newCalendarMatch.home_score),
      away_score: newCalendarMatch.away_score === "" ? null : Number(newCalendarMatch.away_score),
      status: newCalendarMatch.status
    };

    const { data, error } = await supabase.from("matches").insert(payload).select("id").single();

    if (error || !data?.id) {
      setCalendarAdminMessage(error?.message || "No se ha podido guardar el partido.");
      return;
    }

    setActiveMonth(monthKey(payload.match_date));
    setCalendarAdminMessage("Partido añadido al calendario.");
    resetCalendarMatchForm();
    await loadTrajectoryData();
  }

  function monthlyRecord(monthMatches) {
    return monthMatches.reduce(
      (record, match) => {
        const result = getResultType(match);
        if (result === "win") record.wins += 1;
        if (result === "draw") record.draws += 1;
        if (result === "loss") record.losses += 1;
        return record;
      },
      { wins: 0, draws: 0, losses: 0 }
    );
  }

  function changeLeagueWeek(direction) {
    const nextIndex = selectedLeagueWeekIndex + direction;
    if (nextIndex < 0 || nextIndex >= leagueWeeks.length) return;
    setActiveLeagueWeek(leagueWeeks[nextIndex]);
  }

  function formatLeagueMatchDate(date) {
    if (!date) return "Fecha por confirmar";

    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatLeagueMatchDateParts(date) {
    if (!date) return { date: "Por confirmar", time: "" };

    const value = new Date(date);

    return {
      date: value.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short"
      }),
      time: value.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };
  }

  function getLeagueTeamName(team) {
    return team?.short_name || team?.name || "Equipo";
  }

  function getLeagueTeamCode(team) {
    const cleanName = getLeagueTeamName(team)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(cf|fc|rcd|rc|ud|ca)\s+/i, "")
      .replace(/[^a-z0-9]/gi, "");

    return (cleanName || "EQU").slice(0, 3).toUpperCase();
  }

  function getLeagueGuideLink(team) {
    const slug = slugifyTeamName(getLeagueTeamName(team));
    const guideSlug = LALIGA_GUIDE_SLUGS[slug] || slug;

    return `/laliga-guia?equipo=${guideSlug}`;
  }

  function getLeagueScore(match) {
    if (match.home_score == null || match.away_score == null) return "-";
    return `${match.home_score} - ${match.away_score}`;
  }

  function getLeagueMatchCenterLabel(match) {
    if (match.status === "finished" || match.home_score != null || match.away_score != null) {
      return getLeagueScore(match);
    }

    if (match.status === "live") return "EN DIRECTO";
    return "";
  }

  function handleLeagueMatchChange(field, value) {
    setNewLeagueMatch((current) => ({
      ...current,
      [field]: value
    }));
  }

  function resetLeagueMatchForm(week = "") {
    setEditingLeagueMatchId(null);
    setNewLeagueMatch({
      week,
      match_date: "",
      home_team_id: "",
      away_team_id: "",
      home_score: "",
      away_score: "",
      status: "scheduled"
    });
  }

  function openLeagueCreateForm() {
    setLeagueAdminMessage("");
    const week = selectedLeagueWeek ? String(selectedLeagueWeek) : "";

    if (isLeagueCreateOpen && !editingLeagueMatchId) {
      resetLeagueMatchForm(week);
      setIsLeagueCreateOpen(false);
      return;
    }

    resetLeagueMatchForm(week);
    setIsLeagueCreateOpen(true);
  }

  function formatDateTimeInput(date) {
    if (!date) return "";

    const value = new Date(date);
    const offset = value.getTimezoneOffset();
    const local = new Date(value.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  function editLeagueMatch(match) {
    setLeagueAdminMessage("");
    setIsLeagueCreateOpen(false);
    setEditingLeagueMatchId(match.id);
    setNewLeagueMatch({
      week: String(match.week || ""),
      match_date: formatDateTimeInput(match.match_date),
      home_team_id: match.home_team_id || "",
      away_team_id: match.away_team_id || "",
      home_score: match.home_score == null ? "" : String(match.home_score),
      away_score: match.away_score == null ? "" : String(match.away_score),
      status: match.status || "scheduled"
    });
  }

  async function saveLeagueMatch(event) {
    event.preventDefault();
    setLeagueAdminMessage("");

    if (!newLeagueMatch.week || !newLeagueMatch.home_team_id || !newLeagueMatch.away_team_id) {
      setLeagueAdminMessage("Rellena jornada, local y visitante.");
      return;
    }

    if (newLeagueMatch.home_team_id === newLeagueMatch.away_team_id) {
      setLeagueAdminMessage("El equipo local y visitante no pueden ser el mismo.");
      return;
    }

    if (
      newLeagueMatch.status === "finished" &&
      (newLeagueMatch.home_score === "" || newLeagueMatch.away_score === "")
    ) {
      setLeagueAdminMessage("Un partido finalizado necesita ambos marcadores.");
      return;
    }

    const payload = {
      season: LEAGUE_SEASON,
      week: Number(newLeagueMatch.week),
      match_date: newLeagueMatch.match_date ? new Date(newLeagueMatch.match_date).toISOString() : null,
      home_team_id: newLeagueMatch.home_team_id,
      away_team_id: newLeagueMatch.away_team_id,
      home_score: newLeagueMatch.home_score === "" ? null : Number(newLeagueMatch.home_score),
      away_score: newLeagueMatch.away_score === "" ? null : Number(newLeagueMatch.away_score),
      status: newLeagueMatch.status
    };

    const query = editingLeagueMatchId
      ? supabase.from("league_matches").update(payload).eq("id", editingLeagueMatchId).select("id")
      : supabase.from("league_matches").insert(payload).select("id");

    const { data, error } = await query.single();

    if (error || !data?.id) {
      setLeagueAdminMessage(error?.message || "No se ha confirmado el guardado del partido.");
      return;
    }

    setLeagueAdminMessage(editingLeagueMatchId ? "Partido actualizado." : "Partido añadido.");
    setIsLeagueCreateOpen(false);
    resetLeagueMatchForm(String(payload.week));
    setActiveLeagueWeek(payload.week);
    await loadTrajectoryData();
  }

  async function deleteLeagueMatch(match) {
    const homeTeam = getLeagueTeamName(match.home_team);
    const awayTeam = getLeagueTeamName(match.away_team);
    const confirmed = window.confirm(`¿Eliminar el partido ${homeTeam} - ${awayTeam}?`);

    if (!confirmed) return;

    setLeagueAdminMessage("");

    const { error } = await supabase
      .from("league_matches")
      .delete()
      .eq("id", match.id);

    if (error) {
      setLeagueAdminMessage(error.message || "No se pudo eliminar el partido.");
      return;
    }

    if (editingLeagueMatchId === match.id) {
      resetLeagueMatchForm(String(match.week || selectedLeagueWeek || ""));
    }

    setLeagueAdminMessage("Partido eliminado.");
    await loadTrajectoryData();
  }

  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveTabIcon = tabIcons[activeTabData.id] || CalendarDays;
  const activeTabIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));
  const moveTrajectoryTab = (direction) => {
    const nextIndex = (activeTabIndex + direction + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  };

  async function downloadStandingsJpeg() {
    if (!standingsExportRef.current || isStandingsExporting) return;

    setIsStandingsExporting(true);

    try {
      await document.fonts?.ready;

      const canvas = await html2canvas(standingsExportRef.current, {
        backgroundColor: "#f4f7fb",
        width: 1080,
        height: 1350,
        scale: 1,
        useCORS: true,
        logging: false
      });

      const link = document.createElement("a");
      link.download = "clasificacion-alavesfera.jpeg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } finally {
      setIsStandingsExporting(false);
    }
  }

  async function downloadCalendarJpeg() {
    if (!activeMonth || isCalendarExporting) return;

    setIsCalendarExporting(true);

    try {
      await document.fonts?.ready;

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      const template = await loadCanvasImage(calendarDownloadTemplate);

      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

      const exportDays = getCalendarDays(activeMonth);
      while (exportDays.length < 42) {
        const lastDate = exportDays[exportDays.length - 1]?.date || new Date();
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        exportDays.push({ date: nextDate, currentMonth: false });
      }

      const visibleDays = exportDays.slice(0, 42);
      const monthMatches = matchesByMonth[activeMonth] || [];
      const matchesByDate = monthMatches.reduce((acc, match) => {
        const key = new Date(match.match_date).toDateString();
        acc[key] = acc[key] || [];
        acc[key].push(match);
        return acc;
      }, {});
      const matchLogoUrls = [
        ...new Set(
          monthMatches
            .flatMap((match) => [match.home_logo, match.away_logo, match.competitions?.logo_url])
            .filter(Boolean)
        )
      ];
      const matchLogoEntries = await Promise.all(
        matchLogoUrls.map(async (url) => {
          try {
            return [url, await loadCanvasImage(url)];
          } catch {
            return [url, null];
          }
        })
      );
      const matchLogoImages = new Map(matchLogoEntries);

      const startX = 64;
      const startY = 238;
      const gridWidth = 952;
      const weekdayHeight = 52;
      const gap = 8;
      const cellWidth = (gridWidth - gap * 6) / 7;
      const cellHeight = 142;
      const colors = {
        laliga: "#ff4842",
        copa: "#c65b2e",
        filial: "#e50036",
        femenino: "#003c8f",
        default: "#08bfbf"
      };
      const exportWeekDays = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

      ctx.textAlign = "left";
      ctx.fillStyle = "#000000";
      ctx.font = "900 78px Coluna, Impact, sans-serif";
      ctx.fillText("CALENDARIO", startX, 154);

      const exportMonthLabel = monthLabel(activeMonth).toUpperCase();
      ctx.font = "900 34px Montserrat, Arial, sans-serif";
      const monthPaddingX = 26;
      const monthBadgeWidth = ctx.measureText(exportMonthLabel).width + monthPaddingX * 2;
      const monthBadgeHeight = 58;
      const monthBadgeX = canvas.width - startX - monthBadgeWidth;
      const monthBadgeY = 104;

      drawDiagonalRoundedRect(ctx, monthBadgeX, monthBadgeY, monthBadgeWidth, monthBadgeHeight, 13);
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(exportMonthLabel, monthBadgeX + monthBadgeWidth / 2, monthBadgeY + 39);

      exportWeekDays.forEach((day, index) => {
        const x = startX + index * (cellWidth + gap);
        const weekdayGradient = ctx.createLinearGradient(x, startY, x, startY + weekdayHeight);
        weekdayGradient.addColorStop(0, "#6eceff");
        weekdayGradient.addColorStop(1, "#346acd");

        drawDiagonalRoundedRect(ctx, x, startY, cellWidth, weekdayHeight, 8);
        ctx.fillStyle = weekdayGradient;
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 17px Montserrat, Arial, sans-serif";
        ctx.fillText(day, x + cellWidth / 2, startY + 33);
      });

      visibleDays.forEach((calendarDay, index) => {
        const column = index % 7;
        const row = Math.floor(index / 7);
        const x = startX + column * (cellWidth + gap);
        const y = startY + weekdayHeight + gap + row * (cellHeight + gap);
        const dayMatches = matchesByDate[calendarDay.date.toDateString()] || [];

        drawRoundedRect(ctx, x, y, cellWidth, cellHeight, 8);
        ctx.fillStyle = calendarDay.currentMonth ? "rgba(255, 255, 255, 0.92)" : "rgba(232, 236, 241, 0.86)";
        ctx.fill();
        ctx.strokeStyle = "#d6e2ef";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.fillStyle = calendarDay.currentMonth ? "#08213a" : "#9aa6b4";
        ctx.font = "900 24px Montserrat, Arial, sans-serif";
        ctx.fillText(String(calendarDay.date.getDate()), x + cellWidth - 12, y + 30);

        dayMatches.slice(0, 2).forEach((match, matchIndex) => {
          const matchLabel = getMatchLabel(match);
          const rivalInfo = getMatchRivalInfo(match);
          const calendarMatchText = getCalendarExportMatchText(matchLabel);
          const matchY = y + 42 + matchIndex * 50;
          const cardX = x + 8;
          const cardWidth = cellWidth - 16;
          const cardHeight = 45;
          const matchColor = matchLabel.round === "AMISTOSO"
            ? "#8d98a8"
            : colors[matchLabel.className] || colors.default;

          drawRoundedRect(ctx, cardX, matchY, cardWidth, cardHeight, 7);
          ctx.fillStyle = matchColor;
          ctx.fill();

          drawRoundedRect(ctx, cardX + 5, matchY + 5, 31, cardHeight - 10, 5);
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fill();

          ctx.textAlign = "left";
          ctx.fillStyle = "#ffffff";
          const calendarTextSize = calendarMatchText === "AMISTOSO" ? 10 : 12;
          ctx.font = `900 ${calendarTextSize}px Montserrat, Arial, sans-serif`;
          const roundText = matchLabel.round ? `${matchLabel.round} · ` : "";
          const rival = isAlaves(match.home_team) ? match.away_team : match.home_team;
          const label = fitCanvasText(ctx, `${roundText}${rival}`, cellWidth - 32);
          ctx.fillText(label.toUpperCase(), x + 17, matchY + 16);

          drawRoundedRect(ctx, cardX, matchY, cardWidth, cardHeight, 7);
          ctx.fillStyle = matchColor;
          ctx.fill();

          drawRoundedRect(ctx, cardX + 5, matchY + 5, 31, cardHeight - 10, 5);
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fill();

          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 10px Montserrat, Arial, sans-serif";
          const chipText = matchLabel.round
            ? matchLabel.round.replace("AMISTOSO", "AMI")
            : matchLabel.label.slice(0, 3);
          ctx.fillText(chipText.toUpperCase(), cardX + 20.5, matchY + 22);

          ctx.textAlign = "left";
          ctx.font = "900 12px Montserrat, Arial, sans-serif";
          const readableLabel = fitCanvasText(ctx, rival.toUpperCase(), cardWidth - 48);
          ctx.fillText(readableLabel, cardX + 42, matchY + 22);

          drawRoundedRect(ctx, cardX, matchY, cardWidth, cardHeight, 7);
          ctx.fillStyle = matchColor;
          ctx.fill();

          const rivalLogoUrl = isAlaves(match.home_team) ? match.away_logo : match.home_logo;
          const rivalLogo = rivalLogoUrl ? matchLogoImages.get(rivalLogoUrl) : null;
          if (rivalLogo) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cardX + 31, matchY + cardHeight / 2, 14.5, 0, Math.PI * 2);
            ctx.clip();
            drawCanvasImageCover(ctx, rivalLogo, cardX + 16.5, matchY + cardHeight / 2 - 14.5, 29, 29);
            ctx.restore();
          } else {
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 13px Montserrat, Arial, sans-serif";
            ctx.fillText(fitCanvasText(ctx, rival, 32).slice(0, 3).toUpperCase(), cardX + 31, matchY + 27);
          }

          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 13px Montserrat, Arial, sans-serif";
          ctx.fillText(chipText.toUpperCase(), cardX + cardWidth / 2, matchY + 28);

          ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
          ctx.beginPath();
          ctx.arc(cardX + cardWidth - 23, matchY + cardHeight / 2, 14, 0, Math.PI * 2);
          ctx.fill();
          if (String(match.match_side || "").toUpperCase() === "VISITANTE") {
            drawCanvasPlaneIcon(ctx, cardX + cardWidth - 33, matchY + cardHeight / 2 - 10, 20);
          } else {
            drawCanvasHouseIcon(ctx, cardX + cardWidth - 33, matchY + cardHeight / 2 - 10, 20);
          }

          drawRoundedRect(ctx, cardX, matchY, cardWidth, cardHeight, 7);
          ctx.fillStyle = matchColor;
          ctx.fill();

          const calendarRivalLogo = rivalInfo.logo ? matchLogoImages.get(rivalInfo.logo) : null;
          const isCalendarFriendly = calendarMatchText === "AMISTOSO";
          const calendarCompetitionLogo = isCalendarFriendly && match.competitions?.logo_url
            ? matchLogoImages.get(match.competitions.logo_url)
            : null;
          const calendarLogoSize = 58;
          const calendarCompetitionLogoSize = 38;
          const calendarContentGap = 8;
          const calendarSideIconSize = 23;
          const calendarSideIconGap = 7;
          ctx.font = `900 ${calendarTextSize}px Montserrat, Arial, sans-serif`;
          const calendarReadableLabel = fitCanvasText(
            ctx,
            calendarMatchText.toUpperCase(),
            cardWidth - calendarLogoSize - calendarContentGap - calendarSideIconSize - calendarSideIconGap + 4
          );
          const calendarTextWidth = calendarCompetitionLogo ? calendarCompetitionLogoSize : ctx.measureText(calendarReadableLabel).width;
          const calendarLogoWidth = calendarRivalLogo ? calendarLogoSize + calendarContentGap : 0;
          const calendarSideIconWidth = calendarSideIconSize + calendarSideIconGap;
          const calendarContentWidth = calendarLogoWidth + calendarTextWidth + calendarSideIconWidth;
          let calendarCursorX = cardX + (cardWidth - calendarContentWidth) / 2;

          if (calendarRivalLogo) {
            calendarCursorX = Math.max(cardX - 12, calendarCursorX - 22);
            ctx.save();
            drawRoundedRect(ctx, cardX, matchY, cardWidth, cardHeight, 7);
            ctx.clip();
            drawCanvasImageCoverFadeRight(
              ctx,
              calendarRivalLogo,
              calendarCursorX,
              matchY + (cardHeight - calendarLogoSize) / 2,
              calendarLogoSize,
              calendarLogoSize,
              32
            );
            ctx.restore();
            calendarCursorX += calendarLogoSize + calendarContentGap;
          }

          const calendarMainX = Math.max(cardX + 42, calendarCursorX - 2.5);

          if (calendarCompetitionLogo) {
            drawCanvasImageWhite(
              ctx,
              calendarCompetitionLogo,
              calendarMainX,
              matchY + (cardHeight - calendarCompetitionLogoSize) / 2,
              calendarCompetitionLogoSize,
              calendarCompetitionLogoSize
            );
          } else {
            ctx.textAlign = "left";
            ctx.fillStyle = "#ffffff";
            ctx.font = `900 ${calendarTextSize + 4}px Montserrat, Arial, sans-serif`;
            ctx.fillText(calendarReadableLabel, calendarMainX, matchY + 28);
          }

          const calendarSideIconX = Math.min(
            cardX + cardWidth - calendarSideIconSize - 7,
            calendarMainX + calendarTextWidth + calendarSideIconGap
          );
          const calendarSideIconY = matchY + (cardHeight - calendarSideIconSize) / 2;
          if (String(match.match_side || "").toUpperCase() === "VISITANTE") {
            drawCanvasPlaneIcon(ctx, calendarSideIconX, calendarSideIconY, calendarSideIconSize);
          } else {
            drawCanvasHouseIcon(ctx, calendarSideIconX, calendarSideIconY, calendarSideIconSize);
          }
        });

        if (dayMatches.length > 2) {
          ctx.textAlign = "left";
          ctx.fillStyle = "#596b80";
          ctx.font = "900 12px Montserrat, Arial, sans-serif";
          ctx.fillText(`+${dayMatches.length - 2} eventos`, x + 11, y + 30);
        }
      });

      const link = document.createElement("a");
      link.download = `calendario-alavesfera-${activeMonth}.jpeg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } finally {
      setIsCalendarExporting(false);
    }
  }

  return (
    <main className="trajectory-page">
      <section className="trajectory-header">
        <div className="trajectory-header-actions">
          {isAdmin && activeTab === "calendar" && (
            <button
              className={`calendar-admin-trigger ${isCalendarAdminOpen ? "active" : ""}`}
              type="button"
              onClick={() => {
                setIsCalendarAdminOpen((open) => !open);
                setCalendarAdminMessage("");
              }}
              aria-expanded={isCalendarAdminOpen}
            >
              <Plus size={18} />
              <span>Añadir partido</span>
            </button>
          )}

          <div className="trajectory-tabs" aria-label="Secciones de trayectoria">
            <button
              className="trajectory-tab-arrow"
              type="button"
              onClick={() => moveTrajectoryTab(-1)}
              aria-label="Seccion anterior"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            <div className="trajectory-tab-current" aria-live="polite">
              <span className="trajectory-tab-icon" aria-hidden="true">
                <ActiveTabIcon size={15} />
              </span>
              <span>{getTrajectoryTabLabel(activeTabData.id)}</span>
            </div>

            <button
              className="trajectory-tab-arrow"
              type="button"
              onClick={() => moveTrajectoryTab(1)}
              aria-label="Seccion siguiente"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {isAdmin && activeTab === "calendar" && isCalendarAdminOpen && (
        <section className="calendar-admin-panel" aria-label="Añadir partido al calendario">
          <div className="calendar-admin-heading">
            <div>
              <span>Administración</span>
              <h2>Nuevo partido</h2>
            </div>
            <button type="button" onClick={() => setIsCalendarAdminOpen(false)} aria-label="Cerrar formulario">
              <X size={19} />
            </button>
          </div>

          <form onSubmit={saveCalendarMatch}>
            <div className="calendar-admin-grid">
              <label className="calendar-admin-team">
                Equipo local
                <input
                  type="text"
                  value={newCalendarMatch.home_team}
                  onChange={(event) => handleCalendarMatchChange("home_team", event.target.value)}
                  required
                />
              </label>

              <label className="calendar-admin-team">
                Equipo visitante
                <input
                  type="text"
                  value={newCalendarMatch.away_team}
                  onChange={(event) => handleCalendarMatchChange("away_team", event.target.value)}
                  required
                />
              </label>

              <label className="calendar-admin-date">
                Fecha y hora
                <input
                  type="datetime-local"
                  value={newCalendarMatch.match_date}
                  onChange={(event) => handleCalendarMatchChange("match_date", event.target.value)}
                  required
                />
              </label>

              <label>
                Jornada
                <input
                  type="number"
                  min="1"
                  value={newCalendarMatch.week}
                  onChange={(event) => handleCalendarMatchChange("week", event.target.value)}
                />
              </label>

              <label>
                Seccion Alaves
                <select
                  value={newCalendarMatch.team_section}
                  onChange={(event) => handleCalendarMatchChange("team_section", event.target.value)}
                >
                  {MATCH_TEAM_SECTIONS.map((section) => (
                    <option key={section.id} value={section.id}>{section.label}</option>
                  ))}
                </select>
              </label>

              <label className="calendar-admin-competition">
                Competición
                <select
                  value={newCalendarMatch.competition_id}
                  onChange={(event) => handleCalendarMatchChange("competition_id", event.target.value)}
                >
                  <option value="">Sin competición</option>
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                  ))}
                </select>
              </label>

              <label className="calendar-admin-stadium">
                Estadio
                <input
                  type="text"
                  value={newCalendarMatch.stadium}
                  onChange={(event) => handleCalendarMatchChange("stadium", event.target.value)}
                />
              </label>

              <label>
                Condición
                <select
                  value={newCalendarMatch.match_side}
                  onChange={(event) => handleCalendarMatchChange("match_side", event.target.value)}
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
                  value={newCalendarMatch.home_score}
                  onChange={(event) => handleCalendarMatchChange("home_score", event.target.value)}
                />
              </label>

              <label>
                Goles visitante
                <input
                  type="number"
                  min="0"
                  value={newCalendarMatch.away_score}
                  onChange={(event) => handleCalendarMatchChange("away_score", event.target.value)}
                />
              </label>

              <label>
                Estado
                <select
                  value={newCalendarMatch.status}
                  onChange={(event) => handleCalendarMatchChange("status", event.target.value)}
                >
                  <option value="upcoming">Próximo</option>
                  <option value="finished">Finalizado</option>
                </select>
              </label>
            </div>

            <div className="calendar-admin-footer">
              {calendarAdminMessage && <span>{calendarAdminMessage}</span>}
              <button type="submit">Guardar partido</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="trajectory-loading">Cargando trayectoria...</div>
      ) : (
        <>
          {activeTab === "calendar" && (
            <section className="trajectory-card calendar-card">
              <div className="calendar-toolbar">
                <button type="button" onClick={() => changeMonth(-1)}>
                  <ChevronLeft size={26} />
                  <span>Anterior</span>
                </button>
                <h2>{activeMonth ? monthLabel(activeMonth) : ""}</h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={26} />
                </button>
              </div>

              <div className="month-calendar">
                {weekDays.map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}

                {calendarDays.map((calendarDay, index) => {
                  const dayMatches = matches.filter(
                    (match) => new Date(match.match_date).toDateString() === calendarDay.date.toDateString()
                  );
                  const isToday = calendarDay.date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={`${activeMonth}-${index}`}
                      className={`calendar-day ${calendarDay.currentMonth ? "" : "muted"} ${isToday ? "today" : ""}`}
                    >
                      <span className="calendar-day-number">{calendarDay.date.getDate()}</span>

                      <div className="calendar-match-list">
                        {dayMatches.map((match) => {
                          const matchLabel = getMatchLabel(match);
                          const rivalInfo = getMatchRivalInfo(match);
                          const calendarMatchText = getCalendarMatchText(matchLabel);
                          const isFriendly = matchLabel.round === "AMISTOSO";
                          const matchContent = (
                            <span className="calendar-match-content">
                              <CalendarMatchSideIcon side={match.match_side} />
                              {rivalInfo.logo && (
                                <img src={rivalInfo.logo} alt="" loading="lazy" />
                              )}
                              <strong>{calendarMatchText}</strong>
                            </span>
                          );

                          if (isFriendly) {
                            return (
                              <span
                                key={match.id}
                                className="calendar-match competition-amistoso"
                                title={matchLabel.label}
                                aria-label={`${match.home_team} contra ${match.away_team}`}
                              >
                                {matchContent}
                              </span>
                            );
                          }

                          return (
                            <Link
                              key={match.id}
                              to={`/partido/${match.id}`}
                              state={{ match }}
                              className={`calendar-match competition-${matchLabel.className}`}
                              title={matchLabel.label}
                              aria-label={`Ver ficha del partido ${match.home_team} contra ${match.away_team}`}
                            >
                              {matchContent}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="calendar-legend" aria-label="Leyenda de competiciones y eventos">
                <h3>Leyenda de las competiciones y eventos</h3>
                <div className="calendar-legend-items">
                  {calendarLegendItems.map((item) => (
                    <span key={item.className} className={`competition-${item.className}`}>
                      {item.logo && <img src={item.logo} alt="" loading="lazy" />}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="calendar-download-button"
                type="button"
                onClick={downloadCalendarJpeg}
                disabled={isCalendarExporting || !activeMonth}
              >
                <Download size={17} aria-hidden="true" />
                <span>{isCalendarExporting ? "Generando" : "Descargar calendario"}</span>
              </button>
            </section>
          )}

          {activeTab === "results" && (
            <section className="trajectory-dynamics">
              <header className="trajectory-dynamics-header">
                <div>
                  <h2>Puntos por jornada</h2>
                  <p>Progresión acumulada del Deportivo Alavés durante la temporada.</p>
                </div>

                <div className="trajectory-dynamics-metrics">
                  <span className="points" aria-label="Puntos" title="Puntos">
                    <i aria-hidden="true"><Trophy size={16} /></i>
                    <strong>{alavesPointsProgress.at(-1)?.accumulatedPoints ?? 0}</strong>
                  </span>
                  <span className="weeks" aria-label="Jornadas" title="Jornadas">
                    <i aria-hidden="true"><Flag size={16} /></i>
                    <strong>{alavesPointsProgress.length}</strong>
                  </span>
                </div>
              </header>

              <div className="trajectory-dynamics-chart">
                {alavesPointsProgress.length > 0 ? (
                  <Bar data={alavesChartData} options={alavesChartOptions} />
                ) : (
                  <div className="trajectory-dynamics-empty">
                    Aún no hay partidos finalizados del Alavés para representar.
                  </div>
                )}
              </div>
              {trajectoryCompetition && (
                <div className="trajectory-competition-badge" aria-label="Competicion">
                  {trajectoryCompetition.logo_url && <img src={trajectoryCompetition.logo_url} alt="" aria-hidden="true" />}
                  <span>{trajectoryCompetition.name}</span>
                </div>
              )}
              <div className="trajectory-played-results" aria-label="Partidos jugados">
                {playedTrajectoryMatches.length === 0 ? (
                  <div className="trajectory-played-empty">Aun no hay partidos jugados</div>
                ) : (
                  playedTrajectoryMatches.map((match) => {
                    const result = getResultType(match);
                    const opponent = getAlavesOpponent(match);
                    const alavesHome = isAlaves(match.home_team);
                    const alavesScore = alavesHome ? match.home_score : match.away_score;
                    const opponentScore = alavesHome ? match.away_score : match.home_score;

                    return (
                      <article className={`trajectory-played-row ${result}`} key={match.id}>
                        <span className="trajectory-played-date">{formatShortDate(match.match_date)}</span>
                        <div className="trajectory-played-score">
                          {opponent.logo && <img src={opponent.logo} alt={opponent.name || "Rival"} loading="lazy" />}
                          <strong>{alavesScore} - {opponentScore}</strong>
                        </div>
                        <span className="trajectory-played-opponent">{opponent.name || "Rival"}</span>
                        <span className="trajectory-played-outcome">{getResultLabel(result)}</span>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "results-old" && (
            <section className="trajectory-results">
              {playedMonths.length === 0 ? (
                <div className="trajectory-empty">Todavía no hay resultados registrados.</div>
              ) : (
                playedMonths.map((group) => {
                  const record = monthlyRecord(group.matches);

                  return (
                    <article key={group.key} className="result-month-card">
                      <header>
                        <h2>{monthLabel(group.key)}</h2>
                        <div className="month-record">
                          <span>{record.wins}V</span>
                          <span>{record.draws}E</span>
                          <span>{record.losses}D</span>
                        </div>
                      </header>

                      <div className="result-list">
                        {group.matches.map((match) => (
                          <div key={match.id} className="result-row">
                            <span className="result-date">{formatShortDate(match.match_date)}</span>
                            <span className="result-team">{match.home_team}</span>
                            <strong>{match.home_score} - {match.away_score}</strong>
                            <span className="result-team">{match.away_team}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          )}

          {activeTab === "standings" && (
            <section className="trajectory-standings-layout">
              <div className="standings-column">
                <div className="trajectory-card standings-card">
                  <div className="trajectory-standings">
                    <div className="trajectory-standing-row header">
                      <span className="trajectory-standing-scroll-cue" aria-label="Clasificacion desplazable">
                        <ChevronsUpDown size={18} aria-hidden="true" />
                      </span>
                      <span>Equipo</span>
                      <span>PJ</span>
                      <span>PG</span>
                      <span>PE</span>
                      <span>PP</span>
                      <span>GF</span>
                      <span>GC</span>
                      <span>DG</span>
                      <span>Pts</span>
                    </div>

                  {standings.map((team, index) => (
                    <div
                      key={team.id}
                      className={`trajectory-standing-row ${getStandingZone(index + 1)}`}
                    >
                      <span>{index + 1}</span>
                      <span className="trajectory-team">
                        {team.team_logo && <img src={team.team_logo} alt="" loading="lazy" />}
                        <span>{team.team_name}</span>
                      </span>
                      <span>{team.played}</span>
                      <span>{team.wins}</span>
                      <span>{team.draws}</span>
                      <span>{team.losses}</span>
                      <span>{team.goals_for}</span>
                      <span>{team.goals_against}</span>
                      <span>{team.goal_diff}</span>
                      <strong>{team.points}</strong>
                    </div>
                  ))}
                  </div>
                </div>

                <button
                  className="standings-download-button"
                  type="button"
                  onClick={downloadStandingsJpeg}
                  disabled={isStandingsExporting || standings.length === 0}
                >
                  <Download size={17} aria-hidden="true" />
                  <span>{isStandingsExporting ? "Generando" : "Descargar"}</span>
                </button>

                <div className="standings-export-stage" aria-hidden="true">
                  <div className="standings-export-card" ref={standingsExportRef}>
                    <header className="standings-export-header">
                      <span>Alavesfera</span>
                      <strong>Clasificacion</strong>
                      <em>LaLiga 2026/27</em>
                    </header>

                    <div className="standings-export-table">
                      <div className="standings-export-row standings-export-row-head">
                        <span></span>
                        <span>Equipo</span>
                        <span>PJ</span>
                        <span>PG</span>
                        <span>PE</span>
                        <span>PP</span>
                        <span>GF</span>
                        <span>GC</span>
                        <span>DG</span>
                        <span>PTS</span>
                      </div>

                      {standings.map((team, index) => (
                        <div
                          key={`export-${team.id}`}
                          className={`standings-export-row ${index >= 17 ? "zone-red" : ""}`}
                        >
                          <span>{index + 1}</span>
                          <span className="standings-export-team">
                            {team.team_logo && (
                              <img src={team.team_logo} alt="" crossOrigin="anonymous" loading="eager" />
                            )}
                            <span>{team.team_name}</span>
                          </span>
                          <span>{team.played}</span>
                          <span>{team.wins}</span>
                          <span>{team.draws}</span>
                          <span>{team.losses}</span>
                          <span>{team.goals_for}</span>
                          <span>{team.goals_against}</span>
                          <span>{team.goal_diff}</span>
                          <strong>{team.points}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="trajectory-card league-week-card" aria-label="Resultados por jornada">
                <header className="league-week-header">
                  <button
                    type="button"
                    onClick={() => changeLeagueWeek(-1)}
                    disabled={selectedLeagueWeekIndex <= 0}
                    aria-label="Jornada anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div>
                    <strong>{selectedLeagueWeek ? `Jornada ${selectedLeagueWeek}` : "Sin jornada"}</strong>
                  </div>

                  {isAdmin && (
                    <button
                      className={`league-week-add ${isLeagueCreateOpen && !editingLeagueMatchId ? "active" : ""}`}
                      type="button"
                      onClick={openLeagueCreateForm}
                      aria-label={isLeagueCreateOpen && !editingLeagueMatchId ? "Cerrar creador de partido" : "Añadir partido"}
                      title={isLeagueCreateOpen && !editingLeagueMatchId ? "Cerrar" : "Añadir partido"}
                    >
                      {isLeagueCreateOpen && !editingLeagueMatchId ? <X size={17} /> : <Plus size={17} />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => changeLeagueWeek(1)}
                    disabled={selectedLeagueWeekIndex === -1 || selectedLeagueWeekIndex >= leagueWeeks.length - 1}
                    aria-label="Jornada siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </header>

                {!(isAdmin && (isLeagueCreateOpen || editingLeagueMatchId)) && (
                <div className="league-week-list">
                  {selectedLeagueMatches.length === 0 ? (
                    <div className="league-week-empty">No hay partidos para esta jornada.</div>
                  ) : (
                    selectedLeagueMatches.map((match) => {
                      const matchDateParts = formatLeagueMatchDateParts(match.match_date);
                      const centerLabel = getLeagueMatchCenterLabel(match);
                      const hasLeagueResult =
                        match.status === "finished" || match.home_score != null || match.away_score != null;

                      return (
                        <article key={match.id} className="league-week-match">
                          {isAdmin && (
                            <div className="league-week-actions">
                              <button
                                className="league-week-edit"
                                type="button"
                                onClick={() => editLeagueMatch(match)}
                              >
                                Editar
                              </button>
                              <button
                                className="league-week-delete"
                                type="button"
                                onClick={() => deleteLeagueMatch(match)}
                                aria-label={`Eliminar partido ${getLeagueTeamName(match.home_team)} contra ${getLeagueTeamName(match.away_team)}`}
                                title="Eliminar partido"
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </div>
                          )}

                          <div className="league-week-scoreboard">
                            <Link
                              className="league-week-team home"
                              to={getLeagueGuideLink(match.home_team)}
                              aria-label={`Ver ficha de ${getLeagueTeamName(match.home_team)} en LaLiga Guia`}
                            >
                              {match.home_team?.logo_url && <img src={match.home_team.logo_url} alt="" loading="lazy" />}
                              <span>{getLeagueTeamCode(match.home_team)}</span>
                            </Link>

                            <span className={`league-week-center${hasLeagueResult ? " has-result" : ""}`}>
                              {hasLeagueResult ? (
                                <strong>{centerLabel}</strong>
                              ) : (
                                <>
                                  <small>
                                    <span>{matchDateParts.date}</span>
                                    {matchDateParts.time && <span>{matchDateParts.time}</span>}
                                  </small>
                                  {centerLabel && <strong>{centerLabel}</strong>}
                                </>
                              )}
                            </span>

                            <Link
                              className="league-week-team away"
                              to={getLeagueGuideLink(match.away_team)}
                              aria-label={`Ver ficha de ${getLeagueTeamName(match.away_team)} en LaLiga Guia`}
                            >
                              {match.away_team?.logo_url && <img src={match.away_team.logo_url} alt="" loading="lazy" />}
                              <span>{getLeagueTeamCode(match.away_team)}</span>
                            </Link>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
                )}

                {isAdmin && (isLeagueCreateOpen || editingLeagueMatchId) && (
                  <form className="league-admin-panel" onSubmit={saveLeagueMatch}>
                    <strong>Añadir partido</strong>

                    <div className="league-admin-head">
                      <strong>{editingLeagueMatchId ? "Editar partido" : "Añadir partido"}</strong>
                      <button
                        className="league-admin-cancel"
                        type="button"
                        onClick={() => {
                          setIsLeagueCreateOpen(false);
                          resetLeagueMatchForm(selectedLeagueWeek ? String(selectedLeagueWeek) : "");
                        }}
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="league-admin-grid">
                      <label className="league-admin-small">
                        Jornada
                        <input
                          type="number"
                          min="1"
                          value={newLeagueMatch.week}
                          onChange={(event) => handleLeagueMatchChange("week", event.target.value)}
                          placeholder="1"
                        />
                      </label>

                      <label className="league-admin-date">
                        Fecha
                        <input
                          type="datetime-local"
                          value={newLeagueMatch.match_date}
                          onChange={(event) => handleLeagueMatchChange("match_date", event.target.value)}
                        />
                      </label>

                      <label className="league-admin-team">
                        Local
                        <select
                          value={newLeagueMatch.home_team_id}
                          onChange={(event) => handleLeagueMatchChange("home_team_id", event.target.value)}
                        >
                          <option value="">Equipo local</option>
                          {leagueTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="league-admin-team">
                        Visitante
                        <select
                          value={newLeagueMatch.away_team_id}
                          onChange={(event) => handleLeagueMatchChange("away_team_id", event.target.value)}
                        >
                          <option value="">Equipo visitante</option>
                          {leagueTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="league-admin-small">
                        Goles local
                        <input
                          type="number"
                          min="0"
                          value={newLeagueMatch.home_score}
                          onChange={(event) => handleLeagueMatchChange("home_score", event.target.value)}
                          placeholder="-"
                        />
                      </label>

                      <label className="league-admin-small">
                        Goles visitante
                        <input
                          type="number"
                          min="0"
                          value={newLeagueMatch.away_score}
                          onChange={(event) => handleLeagueMatchChange("away_score", event.target.value)}
                          placeholder="-"
                        />
                      </label>

                      <label className="league-admin-status">
                        Estado
                        <select
                          value={newLeagueMatch.status}
                          onChange={(event) => handleLeagueMatchChange("status", event.target.value)}
                        >
                          <option value="scheduled">Programado</option>
                          <option value="live">En directo</option>
                          <option value="finished">Finalizado</option>
                          <option value="postponed">Aplazado</option>
                        </select>
                      </label>
                    </div>

                    <button type="submit">{editingLeagueMatchId ? "Guardar cambios" : "Guardar partido"}</button>
                    {leagueAdminMessage && <span className="league-admin-message">{leagueAdminMessage}</span>}
                  </form>
                )}
              </aside>
            </section>
          )}
        </>
      )}
    </main>
  );
}

