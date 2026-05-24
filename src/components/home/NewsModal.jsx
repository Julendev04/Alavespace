import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
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
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { supabase } from "../../services/supabaseClient";

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

export default function NewsModal({ news, onClose, userId }) {
  const category = news.news_categories;
  const CategoryIcon = category?.icon ? iconMap[category.icon] || FaNewspaper : FaNewspaper;
  const [sessionUserId, setSessionUserId] = useState(userId || null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackCounts, setFeedbackCounts] = useState({ up: 0, down: 0 });
  const [feedbackError, setFeedbackError] = useState("");
  const activeUserId = sessionUserId || userId;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const formattedDate = useMemo(() => {
    return new Date(news.published_at).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [news.published_at]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSessionUserId(data?.session?.user?.id || null);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id || null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFeedback() {
      setFeedback(null);
      setFeedbackError("");

      const { data, error } = await supabase
        .from("news_feedback")
        .select("user_id, vote")
        .eq("news_id", news.id);

      if (ignore) return;

      if (error) {
        console.error("Error cargando feedback de noticia:", error);
        return;
      }

      setFeedbackCounts({
        up: data?.filter((item) => item.vote === "up").length || 0,
        down: data?.filter((item) => item.vote === "down").length || 0,
      });

      if (activeUserId) {
        const userVote = data?.find((item) => item.user_id === activeUserId);
        setFeedback(userVote?.vote || null);
      }
    }

    loadFeedback();

    return () => {
      ignore = true;
    };
  }, [news.id, activeUserId]);

  const handleFeedback = async (vote) => {
    if (!activeUserId) return;

    const previousVote = feedback;
    const nextVote = previousVote === vote ? null : vote;
    setFeedbackError("");

    setFeedback(nextVote);
    setFeedbackCounts((counts) => {
      const next = { ...counts };
      if (previousVote === "up") next.up -= 1;
      if (previousVote === "down") next.down -= 1;
      if (nextVote === "up") next.up += 1;
      if (nextVote === "down") next.down += 1;
      return next;
    });

    const { error } = nextVote
      ? await supabase
          .from("news_feedback")
          .upsert(
            {
              news_id: news.id,
              user_id: activeUserId,
              vote: nextVote,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "news_id,user_id" }
          )
      : await supabase
          .from("news_feedback")
          .delete()
          .eq("news_id", news.id)
          .eq("user_id", activeUserId);

    if (error) {
      setFeedback(previousVote);
      setFeedbackCounts((counts) => {
        const next = { ...counts };
        if (nextVote === "up") next.up -= 1;
        if (nextVote === "down") next.down -= 1;
        if (previousVote === "up") next.up += 1;
        if (previousVote === "down") next.down += 1;
        return next;
      });
      console.error("Error guardando feedback de noticia:", error);
      setFeedbackError(error.message);
    }
  };

  return (
    <div className="news-overlay">
      <article className="news-modal">
        <button className="news-close" onClick={onClose} aria-label="Cerrar noticia">
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="news-modal-kicker">Alavesfera</div>

        <div className="news-modal-header">
          {category && (
            <div
              className="news-category"
              style={{ backgroundColor: category.color }}
            >
              <CategoryIcon aria-hidden="true" />
              <span>{category.name}</span>
            </div>
          )}

          <span className="news-overlay-date">
            {formattedDate}
          </span>
        </div>

        <h2 className="news-overlay-title">
          {news.title}
        </h2>

        {news.image_url && (
          <img
            src={news.image_url}
            className="news-overlay-image"
            alt={news.title}
          />
        )}

        <div className="news-overlay-text">
          <ReactMarkdown>
            {news.content}
          </ReactMarkdown>
        </div>

        <div className="news-feedback" aria-label="Feedback de la noticia">
          <div className="news-feedback-copy">
            <strong>Tu lectura cuenta</strong>
            <span>
              {activeUserId
                ? "Valora esta noticia."
                : "Inicia sesion para valorar esta noticia."}
            </span>
          </div>

          <div className="news-feedback-actions">
            <button
              className={`news-feedback-btn like ${feedback === "up" ? "active" : ""}`}
              type="button"
              disabled={!activeUserId}
              onClick={() => handleFeedback("up")}
            >
              <FaThumbsUp aria-hidden="true" />
              <span>{feedbackCounts.up}</span>
            </button>

            <button
              className={`news-feedback-btn dislike ${feedback === "down" ? "active" : ""}`}
              type="button"
              disabled={!activeUserId}
              onClick={() => handleFeedback("down")}
            >
              <FaThumbsDown aria-hidden="true" />
              <span>{feedbackCounts.down}</span>
            </button>
          </div>
        </div>

        {feedbackError && (
          <p className="news-feedback-error">{feedbackError}</p>
        )}
      </article>
    </div>
  );
}
