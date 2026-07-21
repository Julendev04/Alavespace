import React from "react";
import {
  FaNewspaper,
  FaExchangeAlt,
  FaBriefcaseMedical,
  FaList,
  FaMicrophone,
  FaCheckCircle,
  FaChartBar,
  FaInfoCircle,
  FaFutbol,
  FaTrash,
} from "react-icons/fa";

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

export default function NewsCard({ item, onOpen, onEdit, onDelete, isAdmin, ariaHidden }) {
  if (!item) return null;

  const category = item.news_categories;
  const Icon = category?.icon ? iconMap[category.icon] : null;
  const categoryStyle = category?.color
    ? {
        "--news-card-category-color": category.color,
        "--news-card-category-border": darkenHex(category.color, 0.22),
      }
    : undefined;

  return (
    <div className="news-card" onClick={onOpen} aria-hidden={ariaHidden}>
      
      {/* EDIT BUTTON */}
      {isAdmin && (
        <div className="news-card-admin-actions">
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Editar
          </button>
          <button
            className="delete-btn"
            aria-label={`Borrar ${item.title}`}
            title="Borrar noticia"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <FaTrash aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ICON */}
      {category && Icon && (
        <div
          className="news-icon-circle"
          style={categoryStyle}
        >
          <Icon />
        </div>
      )}

      {/* IMAGE */}
      <div className="news-image">
        <img src={item.image_url} alt={item.title} />
      </div>

      {/* CONTENT */}
      <div className="news-content">
        <h4>{item.title}</h4>
        <span>
          {new Date(item.published_at).toLocaleDateString("es-ES")}
        </span>
      </div>
    </div>
  );
}

function normalizeHex(hex) {
  const normalized = String(hex || "").replace("#", "").trim();
  const fullHex = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(fullHex)) {
    return "002f87";
  }

  return fullHex;
}

function darkenHex(hex, amount) {
  const fullHex = normalizeHex(hex);
  const red = parseInt(fullHex.slice(0, 2), 16);
  const green = parseInt(fullHex.slice(2, 4), 16);
  const blue = parseInt(fullHex.slice(4, 6), 16);
  const darken = (value) => Math.max(0, Math.round(value * (1 - amount)));
  const toHex = (value) => value.toString(16).padStart(2, "0");

  return `#${toHex(darken(red))}${toHex(darken(green))}${toHex(darken(blue))}`;
}
