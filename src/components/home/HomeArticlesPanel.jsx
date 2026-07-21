import React, { useEffect, useState } from "react";
import { PenLine, Plus, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

const emptyForm = {
  title: "",
  intro: "",
  content: "",
  image_url: "",
  tagline: "",
  category: "",
  author: "",
  published_at: ""
};

export default function HomeArticlesPanel({ isAdmin = false }) {
  const [article, setArticle] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    loadArticle(ignore);

    return () => {
      ignore = true;
    };
  }, []);

  async function loadArticle(ignore = false) {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ignore) return;

    if (error) {
      console.error("Error cargando articulo destacado:", error);
      setLoadError(error.message);
      setArticle(null);
      return;
    }

    setLoadError("");
    setArticle(data || null);
  }

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleCreateArticle(event) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setSaveMessage("El titulo es obligatorio.");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    const payload = {
      title: formData.title.trim(),
      intro: formData.intro.trim() || null,
      content: formData.content.trim(),
      image_url: formData.image_url.trim() || null,
      tagline: formData.tagline.trim() || null,
      category: formData.category.trim() || null,
      author: formData.author.trim() || null,
      published_at: formData.published_at
        ? new Date(formData.published_at).toISOString()
        : new Date().toISOString()
    };

    const { error } = await supabase
      .from("articles")
      .insert(payload);

    setSaving(false);

    if (error) {
      console.error("Error creando articulo:", error);
      setSaveMessage(error.message);
      return;
    }

    setFormData(emptyForm);
    setIsCreating(false);
    setSaveMessage("Articulo creado.");
    await loadArticle(false);
  }

  return (
    <section
      className={`home-articles-panel ${isAdmin ? "is-admin" : ""} ${isCreating ? "is-creating" : ""}`}
      aria-label="Articulo destacado"
    >
      {isAdmin && (
        <button
          type="button"
          className="home-articles-admin-btn"
          onClick={() => {
            setIsCreating((current) => !current);
            setSaveMessage("");
          }}
          aria-label={isCreating ? "Cerrar formulario de articulo" : "Crear articulo"}
        >
          {isCreating ? <X size={16} /> : <Plus size={16} />}
        </button>
      )}

      {isAdmin && isCreating && (
        <form className="home-articles-form" onSubmit={handleCreateArticle}>
          <input
            value={formData.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Titulo del articulo"
          />
          <input
            value={formData.intro}
            onChange={(event) => updateField("intro", event.target.value)}
            placeholder="Introduccion"
          />
          <textarea
            value={formData.content}
            onChange={(event) => updateField("content", event.target.value)}
            placeholder="Contenido completo"
            rows={5}
          />
          <input
            value={formData.image_url}
            onChange={(event) => updateField("image_url", event.target.value)}
            placeholder="URL de imagen"
          />
          <div className="home-articles-form-row">
            <input
              value={formData.tagline}
              onChange={(event) => updateField("tagline", event.target.value)}
              placeholder="Etiqueta"
            />
            <input
              value={formData.category}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="Categoria"
            />
          </div>
          <input
            value={formData.author}
            onChange={(event) => updateField("author", event.target.value)}
            placeholder="Autor"
          />
          <input
            type="datetime-local"
            value={formData.published_at}
            onChange={(event) => updateField("published_at", event.target.value)}
            aria-label="Fecha de publicacion"
          />

          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Publicar articulo"}
          </button>
        </form>
      )}

      {saveMessage && (
        <p className="home-articles-save-message">{saveMessage}</p>
      )}

      {article ? (
        <Link to={`/articulos/${article.id}`} className="home-single-article">
          {article.image_url && (
            <img src={article.image_url} alt="" loading="lazy" />
          )}

          <span className="home-article-kicker">
            {article.tagline || article.category || "Alavesfera"}
          </span>

          <h3>{article.title}</h3>
          <p>{article.intro || getExcerpt(article.content)}</p>

          <span className="home-single-article-footer">
            <span className="home-article-meta-badge">
              <small>{formatDate(article.published_at || article.created_at)}</small>
              <i aria-hidden="true" />
              <User size={13} aria-hidden="true" />
              <span>{article.author || "Alavesfera"}</span>
            </span>
          </span>
        </Link>
      ) : (
        <div className="home-articles-empty">
          <PenLine size={20} aria-hidden="true" />
          <p>{loadError ? "No se ha podido cargar el articulo." : "Aun no hay articulos publicados."}</p>
        </div>
      )}

    </section>
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

function getExcerpt(content = "") {
  const plainText = String(content)
    .replace(/[#*_`>[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return "Lectura propia de Alavesfera.";
  return plainText.length > 150 ? `${plainText.slice(0, 150).trim()}...` : plainText;
}
