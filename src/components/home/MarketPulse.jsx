import React, { useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

const fallbackLatestHour = {
  tag: "Ultima hora",
  status: "Venta",
  source: "Fuente por editar",
  date: "2 jun",
  headline: "Edita aqui la ultima hora del mercado",
  text: "Anade aqui el texto de la noticia, el contexto principal y la frase que quieras destacar en la Home.",
  footer: "Mercado Alaves",
  imageUrl: "",
  sourceUrl: "https://www.deportivoalaves.com/"
};

function formatPulseDate(date) {
  if (!date) return fallbackLatestHour.date;

  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short"
  });
}

export default function MarketPulse({ latestHour, setLatestHour, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    tag: "Ultima hora",
    status: "Venta",
    headline: "",
    body: "",
    source: "",
    footer: "Mercado Alaves",
    image_url: "",
    source_url: "",
    published_at: ""
  });

  useEffect(() => {
    const publishedAt = latestHour?.published_at
      ? new Date(new Date(latestHour.published_at).getTime() - new Date(latestHour.published_at).getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";

    setForm({
      tag: latestHour?.tag || "Ultima hora",
      status: latestHour?.status || "Venta",
      headline: latestHour?.headline || "",
      body: latestHour?.body || "",
      source: latestHour?.source || "",
      footer: latestHour?.footer || "Mercado Alaves",
      image_url: latestHour?.image_url || "",
      source_url: latestHour?.source_url || "",
      published_at: publishedAt
    });
  }, [latestHour]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveLatestHour(event) {
    event.preventDefault();
    setMessage("");

    if (!form.headline || !form.body || !form.source) {
      setMessage("Completa titular, texto y fuente.");
      return;
    }

    const payload = {
      ...form,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      is_active: true
    };

    const query = latestHour?.id
      ? supabase.from("home_latest_hour").update(payload).eq("id", latestHour.id).select("*")
      : supabase.from("home_latest_hour").insert(payload).select("*");
    const { data, error } = await query.single();

    if (error || !data) {
      setMessage(error?.message || "No se ha podido guardar.");
      return;
    }

    setLatestHour?.(data);
    setMessage("Cambios guardados.");
    setIsEditing(false);
  }

  const latestBreakingNews = {
    tag: latestHour?.tag || fallbackLatestHour.tag,
    status: latestHour?.status || fallbackLatestHour.status,
    source: latestHour?.source || fallbackLatestHour.source,
    date: formatPulseDate(latestHour?.published_at),
    headline: latestHour?.headline || fallbackLatestHour.headline,
    text: latestHour?.body || latestHour?.text || fallbackLatestHour.text,
    footer: latestHour?.footer || fallbackLatestHour.footer,
    imageUrl: latestHour?.image_url || fallbackLatestHour.imageUrl,
    sourceUrl: latestHour?.source_url || fallbackLatestHour.sourceUrl
  };

  return (
    <div className="market-pulse-shell">
      <a
        className="market-pulse"
        href={latestBreakingNews.sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Abrir fuente: ${latestBreakingNews.headline}`}
      >
        <span className="market-pulse-media">
          {latestBreakingNews.imageUrl ? (
            <img src={latestBreakingNews.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className="market-pulse-avatar" aria-hidden="true">
              {latestBreakingNews.footer.slice(0, 2)}
            </span>
          )}
        </span>

        <span className="market-pulse-body">
          <span className="market-pulse-meta">
            <span>
              <strong>{latestBreakingNews.tag}</strong>
              <time>{latestBreakingNews.date}</time>
            </span>
            <b>{latestBreakingNews.headline}</b>
          </span>

          <span className="market-pulse-text">
            {latestBreakingNews.text}
          </span>
        </span>

        <span className="market-pulse-footer">
          <span className="market-pulse-source">
            <em>{latestBreakingNews.status}</em>
            <strong>{latestBreakingNews.source}</strong>
          </span>
        </span>
      </a>

      {isAdmin && (
        <button
          className="market-pulse-admin-button"
          type="button"
          onClick={() => {
            setMessage("");
            setIsEditing((open) => !open);
          }}
          aria-label="Editar ultima hora"
          title="Editar ultima hora"
        >
          {isEditing ? <X size={17} /> : <Plus size={18} />}
        </button>
      )}

      {isAdmin && isEditing && (
        <form className="market-pulse-editor" onSubmit={saveLatestHour}>
          <div className="market-pulse-editor-head">
            <strong>Editar ultima hora</strong>
            <button type="button" onClick={() => setIsEditing(false)} aria-label="Cerrar editor">
              <X size={16} />
            </button>
          </div>

          <div className="market-pulse-editor-grid">
            <label>Etiqueta<input value={form.tag} onChange={(e) => updateField("tag", e.target.value)} /></label>
            <label>Estado<input value={form.status} onChange={(e) => updateField("status", e.target.value)} /></label>
            <label className="wide">Titular<input value={form.headline} onChange={(e) => updateField("headline", e.target.value)} /></label>
            <label className="wide">Texto<textarea value={form.body} onChange={(e) => updateField("body", e.target.value)} /></label>
            <label>Fuente<input value={form.source} onChange={(e) => updateField("source", e.target.value)} /></label>
            <label>Pie<input value={form.footer} onChange={(e) => updateField("footer", e.target.value)} /></label>
            <label className="wide">URL noticia<input type="url" value={form.source_url} onChange={(e) => updateField("source_url", e.target.value)} /></label>
            <label className="wide">URL imagen<input type="url" value={form.image_url} onChange={(e) => updateField("image_url", e.target.value)} /></label>
            <label className="wide">Fecha<input type="datetime-local" value={form.published_at} onChange={(e) => updateField("published_at", e.target.value)} /></label>
          </div>

          <button className="market-pulse-editor-save" type="submit">
            <Save size={15} /> Guardar cambios
          </button>
          {message && <span className="market-pulse-editor-message">{message}</span>}
        </form>
      )}
    </div>
  );
}
