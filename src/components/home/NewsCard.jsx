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

export default function NewsCard({ item, onOpen, onEdit, isAdmin }) {
  if (!item) return null;

  const category = item.news_categories;
  const Icon = category?.icon ? iconMap[category.icon] : null;

  return (
    <div className="news-card" onClick={onOpen}>
      
      {/* EDIT BUTTON */}
      {isAdmin && (
        <button
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Editar
        </button>
      )}

      {/* ICON */}
      {category && Icon && (
        <div
          className="news-icon-circle"
          style={{ backgroundColor: category.color }}
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