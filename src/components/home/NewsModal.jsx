import React from "react";
import ReactMarkdown from "react-markdown";

export default function NewsModal({ news, onClose }) {
  const category = news.news_categories;

  return (
    <div className="news-overlay">
      <div className="news-modal">

        <button className="news-close" onClick={onClose}>
          ✕
        </button>

        {category && (
          <div
            className="news-category"
            style={{ backgroundColor: category.color }}
          >
            {category.icon}
            <span>{category.name}</span>
          </div>
        )}

        {news.image_url && (
          <img
            src={news.image_url}
            className="news-overlay-image"
            alt=""
          />
        )}

        <h2 className="news-overlay-title">
          {news.title}
        </h2>

        <span className="news-overlay-date">
          {new Date(news.published_at).toLocaleDateString("es-ES")}
        </span>

        <div className="news-overlay-text">
          <ReactMarkdown>
            {news.content}
          </ReactMarkdown>
        </div>

      </div>
    </div>
  );
}