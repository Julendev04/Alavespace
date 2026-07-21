import React, { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Radio } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import TransfersAdminPanel from "./TransfersAdminPanel";

export default function TransfersPanel({ showTransfers = false, setShowTransfers, isAdmin, inline = false }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [probFilter, setProbFilter] = useState("all");

  const fetchTransfers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching transfers:", error);
    } else {
      setTransfers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (showTransfers || inline) {
      fetchTransfers();
    }
  }, [showTransfers, inline]);

  useEffect(() => {
    const channel = supabase
      .channel("transfers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transfers" },
        () => {
          if (showTransfers || inline) fetchTransfers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showTransfers, inline]);

  const statusOptions = useMemo(
    () => mergeFilterOptions(["Rumour", "Negotiating", "Done"], transfers.map((transfer) => transfer.status)),
    [transfers]
  );

  const probabilityOptions = useMemo(
    () => mergeFilterOptions(["Low", "Medium", "High"], transfers.map((transfer) => transfer.probability)),
    [transfers]
  );

  const visibleTransfers = useMemo(
    () =>
      transfers.filter((transfer) => {
        const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
        const matchesProbability = probFilter === "all" || transfer.probability === probFilter;

        return matchesStatus && matchesProbability;
      }),
    [transfers, statusFilter, probFilter]
  );

  if (!showTransfers && !inline) return null;

  const content = (
    <>
      <div className="transfers-panel-head">
        <h2>Nuestro mercado de Transferencias</h2>

        <div className="transfers-panel-actions">
          <div className="transfer-chip-filters" aria-label="Filtros del mercado">
            <div className="transfer-chip-group" aria-label="Filtrar por estado">
              <span className="transfer-filter-label">Estado</span>
              {statusOptions.map((status) => (
                <button
                  className={`transfer-filter-chip status ${getBadgeClass(status)} ${statusFilter === status ? "active" : ""}`}
                  type="button"
                  key={status}
                  onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="transfer-chip-group" aria-label="Filtrar por probabilidad">
              <span className="transfer-filter-label">Probabilidad:</span>
              {probabilityOptions.map((probability) => (
                <button
                  className={`transfer-filter-chip prob ${getBadgeClass(probability)} ${probFilter === probability ? "active" : ""}`}
                  type="button"
                  key={probability}
                  onClick={() => setProbFilter(probFilter === probability ? "all" : probability)}
                >
                  {probability}
                </button>
              ))}
            </div>
          </div>

          {isAdmin && (
            <button
              className="admin-btn"
              type="button"
              onClick={() => setShowAdmin(true)}
            >
              Admin
            </button>
          )}
        </div>
      </div>

      {showAdmin && (
        <div className="admin-panel-wrapper">
          <button
            className="transfer-admin-close"
            type="button"
            aria-label="Cerrar panel de admin"
            title="Cerrar"
            onClick={() => setShowAdmin(false)}
          >
            x
          </button>
          <TransfersAdminPanel />
        </div>
      )}

      <div className="transfers-market-board">
        {loading ? (
          <p className="transfers-empty">Cargando mercado...</p>
        ) : visibleTransfers.length ? (
          <div className="transfers-ticker" aria-label="Movimientos de mercado">
            <div className={`transfers-ticker-track ${visibleTransfers.length > 3 ? "is-animated" : ""}`}>
              {[...visibleTransfers, ...visibleTransfers].map((transfer, index) => (
                <TransferCard
                  key={`${transfer.id}-${index}`}
                  transfer={transfer}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="transfers-empty">No hay movimientos con estos filtros.</p>
        )}
      </div>
      <div className="transfers-legend" aria-label="Leyenda del mercado">
        <span><i className="legend-dot entrada" /> Entrada</span>
        <span><i className="legend-dot salida" /> Salida</span>
      </div>
    </>
  );

  if (inline) {
    return (
      <section className="home-transfers-section">
        {content}
      </section>
    );
  }

  return (
    <div className="simulator-overlay">
      <div className="simulator-modal">
        <button
          className="close-btn"
          type="button"
          onClick={() => setShowTransfers?.(false)}
        >
          x
        </button>

        {content}
      </div>
    </div>
  );
}

function getBadgeClass(value = "") {
  return String(value).toLowerCase().replace(/\s+/g, "-");
}

function mergeFilterOptions(baseOptions, values) {
  const options = new Set(baseOptions);
  values.filter(Boolean).forEach((value) => options.add(value));

  return Array.from(options);
}

function TransferCard({ transfer }) {
  const sourceUrl = normalizeUrl(transfer.source_url);
  const CardTag = sourceUrl ? "a" : "article";
  const cardProps = sourceUrl
    ? {
        href: sourceUrl,
        target: "_blank",
        rel: "noreferrer",
        title: `Ir a la fuente: ${transfer.source || "fuente"}`
      }
    : {};

  return (
    <CardTag
      className={`transfer-card transfer-card-${getTransferType(transfer.transfer_type)}`}
      {...cardProps}
    >
      <div className="transfer-card-top">
        <h3>{transfer.name}</h3>
        {transfer.position && (
          <span className="transfer-card-position">{transfer.position}</span>
        )}
      </div>

      <div className="transfer-card-team">
        {transfer.team_logo_url && (
          <img src={transfer.team_logo_url} alt="" loading="lazy" />
        )}
        <strong>{transfer.team}</strong>
      </div>

      <dl className="transfer-card-facts">
        <div>
          <dt aria-label="Valor" title="Valor">
            <CircleDollarSign size={14} />
          </dt>
          <dd>{transfer.value || "-"}</dd>
        </div>
        <div>
          <dt aria-label="Fuente" title="Fuente">
            <Radio size={14} />
          </dt>
          <dd>{transfer.source || "-"}</dd>
        </div>
      </dl>

      <div className="transfer-card-footer">
        <span className={`status ${getBadgeClass(transfer.status)}`}>
          {transfer.status}
        </span>
        <span className={`prob ${getBadgeClass(transfer.probability)}`}>
          {transfer.probability}
        </span>
      </div>
      <time className="transfer-card-date" dateTime={transfer.created_at || transfer.updated_at}>
        {formatTransferDate(transfer.created_at || transfer.updated_at)}
      </time>
      {transfer.player_image_url && (
        <img
          className="transfer-card-player"
          src={transfer.player_image_url}
          alt=""
          loading="lazy"
        />
      )}
    </CardTag>
  );
}

function getTransferType(value = "") {
  return String(value).toLowerCase() === "salida" ? "salida" : "entrada";
}

function normalizeUrl(url = "") {
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatTransferDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
