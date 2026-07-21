import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBriefcaseMedical,
  FaChartBar,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaExchangeAlt,
  FaFutbol,
  FaInfoCircle,
  FaList,
  FaMicrophone,
  FaNewspaper,
} from "react-icons/fa";
import NewsCard from "./NewsCard";
import NewsModal from "./NewsModal";
import NewsEditor from "./NewsEditor";

const iconMap = {
  FaNewspaper,
  FaExchangeAlt,
  FaBriefcaseMedical,
  FaList,
  FaMicrophone,
  FaCheckCircle,
  FaChartBar,
  FaInfoCircle,
  FaFutbol,
};

export default function NewsSection({
  news,
  isAdmin,
  openNews,
  setOpenNews,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  categories,
  handleSaveNews,
  handleDeleteNews,
  onCreateNews,
  isSavingNews,
  userId,
  matches = []
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const categoryOptions = useMemo(() => [
    { id: "all", name: "Todas las categorias", icon: "FaNewspaper", color: "#002f87" },
    ...(categories || []).map((category) => ({
      id: String(category.id),
      name: category.name,
      icon: category.icon,
      color: category.color
    }))
  ], [categories]);

  const activeCategoryIndex = Math.max(
    0,
    categoryOptions.findIndex((category) => category.id === categoryFilter)
  );
  const activeCategory = categoryOptions[activeCategoryIndex] || categoryOptions[0];
  const ActiveCategoryIcon = iconMap[activeCategory?.icon] || FaNewspaper;

  function rotateCategory(direction) {
    if (!categoryOptions.length) return;

    const nextIndex =
      (activeCategoryIndex + direction + categoryOptions.length) % categoryOptions.length;

    setCategoryFilter(categoryOptions[nextIndex].id);
  }

  function formatDateTimeLocal(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }

  const filteredNews = useMemo(() => {
    const now = new Date();

    return (news || []).filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || String(item.category_id) === categoryFilter;

      if (!matchesCategory) return false;
      if (dateFilter === "all") return true;

      const publishedAt = new Date(item.published_at);
      const daysAgo = Number(dateFilter);
      const minDate = new Date(now);
      minDate.setDate(now.getDate() - daysAgo);

      return publishedAt >= minDate;
    });
  }, [news, categoryFilter, dateFilter]);

  const scrollingNews = filteredNews.length > 1 ? [...filteredNews, ...filteredNews] : filteredNews;
  const nextMatchTags = useMemo(() => getNextMatchTags(matches, now), [matches, now]);

  return (
    <div className="news-container">
      <div className="news-toolbar">
        <div className="news-next-matches" aria-label="Proximos partidos">
          {nextMatchTags.map((matchTag) => (
            <Link
              key={`${matchTag.type}-${matchTag.id}`}
              to={`/partido/${matchTag.id}`}
              state={{ match: matchTag.match }}
              className={`news-next-match news-next-match-${matchTag.type}`}
              aria-label={`${matchTag.label}: ${matchTag.alavesName} contra ${matchTag.rivalName}, ${matchTag.countdown}`}
            >
              <MatchTagShield team={matchTag.leftTeam} />

              <span className="news-next-countdown">
                <small>{matchTag.label}</small>
                <strong>{matchTag.countdown}</strong>
              </span>

              <MatchTagShield team={matchTag.rightTeam} />
            </Link>
          ))}
        </div>

        <div className="news-filters" aria-label="Filtrar noticias">
          {isAdmin && (
            <button
              className="create-news-btn"
              onClick={onCreateNews}
            >
              + Nueva noticia
            </button>
          )}

          <div className="news-category-carousel" aria-label="Filtrar por categoria">
            <button
              className="news-category-arrow"
              type="button"
              onClick={() => rotateCategory(-1)}
              aria-label="Categoria anterior"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>

            <div className="news-category-current" aria-live="polite">
              <span
                className="news-category-icon"
                style={{ backgroundColor: activeCategory?.color || "#002f87" }}
                aria-hidden="true"
              >
                <ActiveCategoryIcon />
              </span>
              <span>{activeCategory?.name || "Todas las categorias"}</span>
            </div>

            <button
              className="news-category-arrow"
              type="button"
              onClick={() => rotateCategory(1)}
              aria-label="Categoria siguiente"
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>

          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filtrar por fecha"
          >
            <option value="all">Todas las fechas</option>
            <option value="7">Ultimos 7 dias</option>
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* SCROLL SECTION */}
      <div className="news-scroll-wrapper">
        <div className={`news-scroll ${filteredNews.length > 1 ? "is-animated" : ""}`}>

          {scrollingNews.map((item, index) => (
            <NewsCard
              key={`${item.id}-${index}`}
              item={item}
              isAdmin={isAdmin}
              ariaHidden={index >= filteredNews.length}
              onOpen={() => setOpenNews(item)}
              onEdit={() => {
                setFormData({
                  id: item.id,
                  title: item.title,
                  content: item.content,
                  image_url: item.image_url,
                  image_file: null,
                  category_id: item.category_id,
                  published_at: formatDateTimeLocal(item.published_at)
                });
                setIsEditing(true);
              }}
              onDelete={() => handleDeleteNews(item)}
            />
          ))}

          {!filteredNews.length && (
            <div className="news-empty-state">
              No hay noticias con estos filtros.
            </div>
          )}

        </div>
      </div>

      {/* NEWS VIEW MODAL */}
      {openNews && (
        <NewsModal
          news={openNews}
          userId={userId}
          onClose={() => setOpenNews(null)}
        />
      )}

      {/* NEWS EDIT MODAL */}
      {isEditing && (
        <div className="news-overlay">
          <NewsEditor
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onSave={handleSaveNews}
            onClose={() => setIsEditing(false)}
            isSaving={isSavingNews}
          />
        </div>
      )}

    </div>
  );
}

function MatchTagShield({ team }) {
  return (
    <span className={`news-next-shield ${team.isAlaves ? "news-next-shield-alaves" : "news-next-shield-rival"}`}>
      {team.logo ? (
        <img src={team.logo} alt="" loading="lazy" />
      ) : (
        <span>{team.isAlaves ? "ALA" : abbreviateTeam(team.name)}</span>
      )}
    </span>
  );
}

function getNextMatchTags(matches, now) {
  const buckets = [
    { type: "first", label: "Primer equipo", match: null },
    { type: "female", label: "Femenino", match: null },
    { type: "reserve", label: "Filial", match: null }
  ];

  const upcomingMatches = (matches || [])
    .filter((match) => {
      const matchDate = new Date(match.match_date);
      return matchDate > now && String(match.status || "").toLowerCase() !== "finished";
    })
    .sort((firstMatch, secondMatch) => new Date(firstMatch.match_date) - new Date(secondMatch.match_date));

  upcomingMatches.forEach((match) => {
    const type = getMatchTeamType(match);
    const bucket = buckets.find((item) => item.type === type);

    if (bucket && !bucket.match) {
      bucket.match = match;
    }
  });

  return buckets
    .filter((bucket) => bucket.match)
    .map((bucket) => {
      const match = bucket.match;
      const alavesSide = getAlavesSide(match);
      const alavesName = alavesSide === "away" ? match.away_team : match.home_team;
      const rivalName = alavesSide === "away" ? match.home_team : match.away_team;
      const leftTeam = {
        name: match.home_team,
        logo: match.home_logo,
        isAlaves: alavesSide === "home"
      };
      const rightTeam = {
        name: match.away_team,
        logo: match.away_logo,
        isAlaves: alavesSide === "away"
      };

      return {
        id: match.id,
        type: bucket.type,
        label: bucket.label,
        match,
        alavesName,
        rivalName,
        leftTeam,
        rightTeam,
        countdown: formatCountdown(new Date(match.match_date) - now)
      };
    });
}

function getMatchTeamType(match) {
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

function getAlavesSide(match) {
  const homeIsAlaves = isAlavesTeam(match.home_team, match.home_logo);
  const awayIsAlaves = isAlavesTeam(match.away_team, match.away_logo);

  if (homeIsAlaves && !awayIsAlaves) return "home";
  if (awayIsAlaves && !homeIsAlaves) return "away";

  const matchSide = String(match.match_side || "").toUpperCase();

  if (matchSide === "LOCAL") return "home";
  if (matchSide === "VISITANTE") return "away";

  return "home";
}

function isAlavesTeam(name = "", logo = "") {
  const text = normalizeText(`${name} ${logo}`);

  return (
    text.includes("alaves") ||
    text.includes("alaves fem") ||
    text.includes("alaves femenino") ||
    text.includes("deportivo alaves") ||
    text.includes("deportivo alaves b") ||
    text.includes("gloriosas") ||
    text.includes("miniglorias")
  );
}

function formatCountdown(diff) {
  if (diff <= 0) return "En juego";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;

  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function abbreviateTeam(name = "") {
  return normalizeText(name)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
}

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
