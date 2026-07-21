import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./Articles.css";

export default function Articles() {
  const { id } = useParams();
  const [articles, setArticles] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadArticles() {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false });

      if (ignore) return;

      if (error) {
        console.error("Error cargando articulos:", error);
        setLoadError(error.message);
        setArticles([]);
        return;
      }

      setLoadError("");
      setArticles(data || []);
    }

    loadArticles();

    return () => {
      ignore = true;
    };
  }, []);

  const activeArticle = useMemo(() => {
    if (!articles.length) return null;
    return articles.find((article) => String(article.id) === String(id)) || articles[0];
  }, [articles, id]);

  const otherArticles = useMemo(() => {
    if (!activeArticle) return articles;
    return articles.filter((article) => article.id !== activeArticle.id);
  }, [articles, activeArticle]);

  return (
    <main className="articles-page">
      {activeArticle ? (
        <section className="articles-shell">
          <section className="articles-reader-layout">
            <article className="article-reader">
              <header className="article-reader-header">
                <span>{activeArticle.tagline || activeArticle.category || "Articulo"}</span>
                <h2>{activeArticle.title}</h2>
                {activeArticle.intro && <p>{activeArticle.intro}</p>}
              <p className="article-reader-meta">
                Publicado el{" "}
                <time dateTime={activeArticle.published_at || activeArticle.created_at}>
                  {formatDate(activeArticle.updated_at || activeArticle.published_at || activeArticle.created_at)}
                </time>{" "}
                por <strong>{activeArticle.author || activeArticle.tagline || "Alavesfera"}</strong>
              </p>
            </header>

            </article>

            {activeArticle.image_url && (
              <figure className="article-reader-image" aria-label="Imagen del articulo">
                <img src={activeArticle.image_url} alt="" loading="lazy" />
              </figure>
            )}
          </section>

          <section className="article-reader-lower">
            <div className="article-reader-body">
              <ReactMarkdown>{activeArticle.content || ""}</ReactMarkdown>
            </div>

            <aside className="articles-sidebar" aria-label="Articulos recientes">
              <h3>Articulos recientes</h3>

              <div className="articles-sidebar-list">
                {otherArticles.map((article) => (
                  <Link key={article.id} to={`/articulos/${article.id}`} className="articles-sidebar-link">
                    <strong>{article.title}</strong>
                    <p>{getArticlePreview(article)}</p>
                  </Link>
                ))}

                {!otherArticles.length && (
                  <p className="articles-empty-small">No hay mas articulos por ahora.</p>
                )}
              </div>
            </aside>
          </section>
        </section>
      ) : (
        <p className="articles-empty">
          {loadError ? "No se han podido cargar los articulos." : "Aun no hay articulos publicados."}
        </p>
      )}
    </main>
  );
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getArticlePreview(article) {
  const source = article.intro || article.content || "";
  const plainText = source
    .replace(/[#*_`>[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= 210) return plainText;
  return `${plainText.slice(0, 210).trim()}...`;
}
