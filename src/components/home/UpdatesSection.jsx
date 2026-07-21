import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

const fallbackUpdates = [
  {
    id: "fallback-2026-04-07",
    date: "2026-04-07",
    text: "Nueva seccion de enciclopedia de jugadores con filtros avanzados.",
  },
  {
    id: "fallback-2026-04-05",
    date: "2026-04-05",
    text: "Rediseno del modulo de proximos partidos.",
  },
  {
    id: "fallback-2026-04-02",
    date: "2026-04-02",
    text: "Optimizacion del sistema de noticias.",
  },
  {
    id: "fallback-2026-03-30",
    date: "2026-03-30",
    text: "Mejora de rendimiento general.",
  },
];

export default function UpdatesSection({ isAdmin = false }) {
  const [updates, setUpdates] = useState(fallbackUpdates);
  const [isOpen, setIsOpen] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    text: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchUpdates() {
      const { data, error } = await supabase
        .from("home_updates")
        .select("id, date, text")
        .order("date", { ascending: false });

      if (!isMounted || error || !data?.length) return;
      setUpdates(data);
    }

    fetchUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const cleanText = form.text.trim();
    if (!form.date || !cleanText) {
      setMessage("Anade una fecha y el texto de la novedad.");
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from("home_updates")
      .insert({ date: form.date, text: cleanText })
      .select("id, date, text")
      .single();

    setIsSaving(false);

    if (error || !data) {
      setMessage("No se pudo guardar. Revisa que exista la tabla home_updates.");
      return;
    }

    setUpdates((current) => [data, ...current].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setForm({ date: new Date().toISOString().slice(0, 10), text: "" });
    setIsFormOpen(false);
  };

  return (
    <section className="updates-section">
      <div className="updates-container">
        <header className="updates-heading">
          <button
            type="button"
            className="updates-title-toggle"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span>Mejoras en la web</span>
          </button>
          <div className="updates-heading-actions">
            <span className="updates-kicker">Novedades</span>
            <span>{updates.length} actualizaciones</span>
            {isAdmin && (
              <button
                type="button"
                className="updates-admin-toggle"
                onClick={() => setIsFormOpen((current) => !current)}
              >
                {isFormOpen ? <X size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                {isFormOpen ? "Cerrar" : "Anadir novedad"}
              </button>
            )}
          </div>
        </header>

        {isOpen && isAdmin && isFormOpen && (
          <form className="updates-admin-form" onSubmit={handleSubmit}>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            />
            <input
              value={form.text}
              onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
              placeholder="Texto de la novedad"
            />
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            {message && <span>{message}</span>}
          </form>
        )}

        {isOpen && (
          <div className="updates-log">
            {updates.map((update, index) => (
              <article className={`updates-entry ${index === 0 ? "is-latest" : ""}`} key={update.id || update.date}>
                <span className="updates-latest-dot" aria-hidden="true" />
                <time dateTime={update.date}>
                  {formatUpdateDate(update.date)}
                </time>

                <div className="updates-entry-copy">
                  <p>{update.text}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatUpdateDate(date) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
