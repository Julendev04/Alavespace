import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Plus, RotateCcw } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import tierlistTemplate from "../assets/plantilla_tierlist.jpg";
import "./TierList.css";

const tiers = [
  { id: "clave", label: "Jugador clave", color: "#d80616" },
  { id: "se-queda", label: "Se queda", color: "#13930e" },
  { id: "transferible", label: "Transferible", color: "#4669b2" },
  { id: "cantera", label: "Cantera / futuro", color: "#11a9ca" },
  { id: "cedido", label: "Cedido", color: "#6a6a6a" },
  { id: "salida", label: "Salida segura", color: "#111317" },
];

export default function TierList() {
  const [players, setPlayers] = useState([]);
  const [placements, setPlacements] = useState({});
  const [tierRows, setTierRows] = useState(tiers);
  const [tierLabels, setTierLabels] = useState(() => {
    return tiers.reduce((labels, tier) => {
      labels[tier.id] = tier.label;
      return labels;
    }, {});
  });
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [selectedTierId, setSelectedTierId] = useState(tiers[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchPlayers() {
      const { data, error } = await supabase
        .from("jugadores")
        .select("id, name, number, position, team_type, card_url, photo_url")
        .eq("team_type", "first_team")
        .order("number", { ascending: true });

      if (ignore) return;

      if (error) {
        console.error("Error cargando jugadores para tierlist:", error);
        setPlayers([]);
      } else {
        setPlayers(data || []);
      }

      setLoading(false);
    }

    fetchPlayers();
    return () => {
      ignore = true;
    };
  }, []);

  const playersById = useMemo(() => {
    return players.reduce((map, player) => {
      map[String(player.id)] = player;
      return map;
    }, {});
  }, [players]);

  const availablePlayers = players.filter((player) => !placements[String(player.id)]);
  const selectedPlayer = availablePlayers[selectedPlayerIndex] || null;

  useEffect(() => {
    if (selectedPlayerIndex <= availablePlayers.length - 1) return;
    setSelectedPlayerIndex(Math.max(availablePlayers.length - 1, 0));
  }, [availablePlayers.length, selectedPlayerIndex]);

  const movePlayer = (playerId, tierId) => {
    setPlacements((current) => ({
      ...current,
      [playerId]: tierId,
    }));
  };

  const removePlayerFromTier = (playerId) => {
    setPlacements((current) => {
      const next = { ...current };
      delete next[playerId];
      return next;
    });
  };

  const handleDrop = (tierId) => {
    if (!draggedPlayer) return;
    movePlayer(draggedPlayer, tierId);
    setDraggedPlayer(null);
  };

  const handlePoolDrop = () => {
    if (!draggedPlayer) return;
    removePlayerFromTier(draggedPlayer);
    setDraggedPlayer(null);
  };

  const addTierRow = () => {
    const newTier = {
      id: `custom-${Date.now()}`,
      label: "Nueva fila",
      color: "#0f5ca3",
    };

    setTierRows((current) => [...current, newTier]);
    setTierLabels((current) => ({
      ...current,
      [newTier.id]: newTier.label,
    }));
    setSelectedTierId(newTier.id);
  };

  const removeTierRow = (tierId) => {
    if (!tierId.startsWith("custom-")) return;

    setTierRows((current) => current.filter((tier) => tier.id !== tierId));
    setTierLabels((current) => {
      const next = { ...current };
      delete next[tierId];
      return next;
    });
    setPlacements((current) => {
      return Object.entries(current).reduce((next, [playerId, placedTierId]) => {
        if (placedTierId !== tierId) next[playerId] = placedTierId;
        return next;
      }, {});
    });
    setSelectedTierId((current) => (current === tierId ? tiers[0].id : current));
  };

  const showPreviousPlayer = () => {
    if (!availablePlayers.length) return;
    setSelectedPlayerIndex((current) => (current - 1 + availablePlayers.length) % availablePlayers.length);
  };

  const showNextPlayer = () => {
    if (!availablePlayers.length) return;
    setSelectedPlayerIndex((current) => (current + 1) % availablePlayers.length);
  };

  const assignSelectedPlayer = () => {
    if (!selectedPlayer || !selectedTierId) return;
    movePlayer(String(selectedPlayer.id), selectedTierId);
    setSelectedPlayerIndex((current) => Math.min(current, Math.max(availablePlayers.length - 2, 0)));
  };

  const handleDownload = async () => {
    const blob = await createTierlistImage({
      tierRows,
      tierLabels,
      placements,
      playersById
    });

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tierlist-alavesfera.jpg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="tierlist-page">
      <div className="tierlist-layout">
        <div className="tierlist-workspace">
      <header className="tierlist-header">
        <div>
          <h1>Tierlist</h1>
        </div>

        <div className="tierlist-header-actions">
          <button type="button" className="tierlist-action tierlist-download" onClick={handleDownload}>
            <Download size={16} aria-hidden="true" />
            Descargar
          </button>

          <button type="button" className="tierlist-action tierlist-reset" onClick={() => setPlacements({})}>
            <RotateCcw size={16} aria-hidden="true" />
            Restablecer
          </button>
        </div>
      </header>

      <div className="tierlist-board" aria-label="Tierlist de jugadores">
        {tierRows.map((tier) => {
          const tierPlayers = Object.entries(placements)
            .filter(([, tierId]) => tierId === tier.id)
            .map(([playerId]) => playersById[playerId])
            .filter(Boolean);

          return (
            <div
              key={tier.id}
              className="tierlist-row"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(tier.id)}
            >
              <div className="tierlist-label" style={{ backgroundColor: tier.color }}>
                {tier.id.startsWith("custom-") && (
                  <button
                    type="button"
                    className="tierlist-remove-row"
                    onClick={() => removeTierRow(tier.id)}
                    aria-label={`Quitar categoria ${tierLabels[tier.id] || tier.label}`}
                  >
                    x
                  </button>
                )}
                <textarea
                  className="tierlist-label-text"
                  value={tierLabels[tier.id] || ""}
                  rows={2}
                  spellCheck="false"
                  onChange={(event) => {
                    setTierLabels((current) => ({
                      ...current,
                      [tier.id]: event.target.value,
                    }));
                  }}
                  aria-label={`Nombre de categoria ${tier.label}`}
                />
              </div>

              <div className="tierlist-dropzone">
                {tierPlayers.map((player) => (
                  <TierPlayerCard
                    key={player.id}
                    player={player}
                    onDragStart={(event) => {
                      prepareCardDrag(event);
                      setDraggedPlayer(String(player.id));
                    }}
                    onDoubleClick={() => removePlayerFromTier(String(player.id))}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <button type="button" className="tierlist-add-row" onClick={addTierRow}>
          <Plus size={18} aria-hidden="true" />
          Añadir nueva fila
        </button>
      </div>

        </div>

      <section
        className="tierlist-player-pool"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handlePoolDrop}
        aria-label="Jugadores disponibles"
      >
        <div className="tierlist-player-carousel">
          {loading && <p className="tierlist-empty">Cargando jugadores...</p>}
          {!loading && availablePlayers.length === 0 && (
            <p className="tierlist-empty">Todos los jugadores estan colocados.</p>
          )}
          {!loading && selectedPlayer && (
            <>
              <h2 className="tierlist-player-picker-title">Selecciona el jugador</h2>

              <div className="tierlist-carousel-stage">
                <button
                  type="button"
                  className="tierlist-carousel-arrow"
                  onClick={showPreviousPlayer}
                  aria-label="Jugador anterior"
                >
                  <ChevronLeft size={26} aria-hidden="true" />
                </button>

                <div className="tierlist-featured-card">
                  <TierPlayerCard
                    key={selectedPlayer.id}
                    player={selectedPlayer}
                    draggable={false}
                  />
                </div>

                <button
                  type="button"
                  className="tierlist-carousel-arrow"
                  onClick={showNextPlayer}
                  aria-label="Jugador siguiente"
                >
                  <ChevronRight size={26} aria-hidden="true" />
                </button>
              </div>

              <div className="tierlist-category-picker">
                <select
                  value={selectedTierId}
                  onChange={(event) => setSelectedTierId(event.target.value)}
                  aria-label="Categoria destino"
                >
                  {tierRows.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tierLabels[tier.id] || tier.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={assignSelectedPlayer}>
                  Colocar
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      </div>
    </section>
  );
}

function TierPlayerCard({ player, onDragStart, onDoubleClick, draggable = true }) {
  const image = player.card_url || player.photo_url;

  return (
    <button
      type="button"
      className="tier-player-card"
      draggable={draggable}
      onDragStart={onDragStart}
      onDoubleClick={onDoubleClick}
      title={player.name}
    >
      {image ? <img src={image} alt="" loading="lazy" draggable="false" /> : <span>{getInitials(player.name)}</span>}
    </button>
  );
}

function prepareCardDrag(event) {
  const image = event.currentTarget.querySelector("img");

  if (!image || !event.dataTransfer) return;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setDragImage(
    image,
    Math.round(image.offsetWidth / 2),
    Math.round(image.offsetHeight / 2)
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function createTierlistImage({ tierRows, tierLabels, placements, playersById }) {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#f4f8fc";
  context.fillRect(0, 0, width, height);

  const template = await loadCanvasImage(tierlistTemplate).catch(() => null);
  if (template) {
    drawCoverImage(context, template, 0, 0, width, height);
  }

  context.save();
  context.fillStyle = "#0f5ca3";
  context.font = "900 76px Montserrat, Arial, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText("TIERLIST", 64, 92);
  context.restore();

  const rows = tierRows.map((tier) => ({
    ...tier,
    label: tierLabels[tier.id] || tier.label,
    players: Object.entries(placements)
      .filter(([, tierId]) => tierId === tier.id)
      .map(([playerId]) => playersById[playerId])
      .filter(Boolean)
  }));

  const boardX = 64;
  const boardY = 230;
  const boardW = width - boardX * 2;
  const boardBottom = height - 82;
  const rowGap = 10;
  const labelW = 220;
  const rowH = Math.max(112, Math.min(170, (boardBottom - boardY - rowGap * (rows.length - 1)) / Math.max(rows.length, 1)));
  const cardAreaX = boardX + labelW + 24;
  const cardAreaW = boardW - labelW - 24;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const tier = rows[rowIndex];
    const y = boardY + rowIndex * (rowH + rowGap);

    context.fillStyle = tier.color;
    context.fillRect(boardX, y, labelW, rowH);

    context.fillStyle = "#ffffff";
    context.font = "900 25px Montserrat, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    drawWrappedText(context, tier.label, boardX + labelW / 2, y + rowH / 2, labelW - 34, 28);

    context.fillStyle = "rgba(255, 255, 255, 0.62)";
    context.fillRect(cardAreaX, y, cardAreaW, rowH);

    await drawTierPlayers(context, tier.players, cardAreaX + 22, y + 16, cardAreaW - 44, rowH - 32);
  }

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

async function drawTierPlayers(context, players, x, y, width, height) {
  if (!players.length) return;

  const gap = 14;
  const preferredCardW = 164;
  const preferredCardH = 132;
  const cardsPerRow = Math.max(1, Math.floor((width + gap) / (preferredCardW + gap)));
  const cardRows = Math.ceil(players.length / cardsPerRow);
  const cardH = Math.max(54, Math.min(preferredCardH, (height - gap * (cardRows - 1)) / cardRows));
  const cardW = Math.min(preferredCardW, cardH * 1.24);

  for (let index = 0; index < players.length; index += 1) {
    const player = players[index];
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    const cardX = x + col * (cardW + gap);
    const cardY = y + row * (cardH + gap);
    const imageUrl = player.card_url || player.photo_url;

    if (!imageUrl) {
      drawPlayerFallback(context, player.name, cardX, cardY, cardW, cardH);
      continue;
    }

    try {
      const image = await loadCanvasImage(imageUrl);
      drawContainImage(context, image, cardX, cardY, cardW, cardH);
    } catch {
      drawPlayerFallback(context, player.name, cardX, cardY, cardW, cardH);
    }
  }
}

function drawPlayerFallback(context, name, x, y, width, height) {
  context.fillStyle = "#0f5ca3";
  context.fillRect(x, y, width, height);
  context.fillStyle = "#ffffff";
  context.font = "900 22px Montserrat, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(getInitials(name), x + width / 2, y + height / 2);
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCoverImage(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  context.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
}

function drawContainImage(context, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  context.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);

  const visibleLines = lines.slice(0, 3);
  const startY = y - ((visibleLines.length - 1) * lineHeight) / 2;
  visibleLines.forEach((textLine, index) => {
    context.fillText(textLine, x, startY + index * lineHeight);
  });
}
