import React, { useState } from "react";
import { ChevronRight, LayoutList, PanelTop } from "lucide-react";
import podcastCover from "../../assets/Presentacion_NuevoPodcast.jpg";
import fallbackCover from "../../assets/mendizorroza.jpg";

const IVOOX_URL = "https://www.ivoox.com/";

const podcastEpisodes = [
  {
    id: 17,
    episode: "E17",
    title: "El nuevo Alaves que se viene",
    published: "Hace 4 dias",
    duration: "42 min",
    cover: podcastCover,
    url: IVOOX_URL,
  },
  {
    id: 16,
    episode: "E16",
    title: "La previa mas caliente de Mendizorroza",
    published: "Hace 11 dias",
    duration: "38 min",
    cover: fallbackCover,
    url: IVOOX_URL,
  },
  {
    id: 15,
    episode: "E15",
    title: "Mercado, cantera y decisiones clave",
    published: "Hace 16 dias",
    duration: "51 min",
    cover: podcastCover,
    url: IVOOX_URL,
  },
  {
    id: 14,
    episode: "E14",
    title: "Lo que no se vio del ultimo partido",
    published: "Hace 20 dias",
    duration: "34 min",
    cover: fallbackCover,
    url: IVOOX_URL,
  },
];

export default function VideoBanner() {
  const [view, setView] = useState("cover");
  const latestEpisode = podcastEpisodes[0];

  return (
    <div className="podcast-module">
      <h2 className="podcast-section-title">La voz de Alavesfera</h2>
      <section className={`podcast-banner ${view === "cover" ? "is-cover" : "is-list"}`}>
      <div className="podcast-topbar">
        <div className="podcast-view-toggle" aria-label="Cambiar vista del podcast">
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-label="Ver lista de capitulos"
          >
            <LayoutList size={16} />
          </button>
          <button
            type="button"
            className={view === "cover" ? "active" : ""}
            onClick={() => setView("cover")}
            aria-label="Ver episodio destacado"
          >
            <PanelTop size={16} />
          </button>
        </div>
      </div>

      <div className="podcast-stage">
        <div className="podcast-list-view" aria-hidden={view !== "list"}>
          <div className="podcast-list">
            {podcastEpisodes.map((episode) => (
              <article className="podcast-episode" key={episode.id}>
                <img src={episode.cover} alt="" loading="lazy" />

                <div className="podcast-episode-copy">
                  <span>{episode.episode}</span>
                  <h3>{episode.title}</h3>
                  <p>{episode.published} · {episode.duration}</p>
                </div>

                <a
                  className="podcast-row-play"
                  href={episode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Escuchar ${episode.title} en iVoox`}
                >
                  <ChevronRight size={20} />
                </a>
              </article>
            ))}
          </div>
        </div>

        <div className="podcast-cover-view" aria-hidden={view !== "cover"}>
          <img src={latestEpisode.cover} alt="" />
          <div className="podcast-cover-shade" />
        </div>
      </div>
      </section>
    </div>
  );
}
