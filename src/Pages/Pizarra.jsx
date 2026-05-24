import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import "./Pizarra.css";
import {
  ArrowRight,
  Circle,
  Download,
  Eraser,
  Grid3X3,
  ImagePlus,
  MoveRight,
  Minus,
  PaintBucket,
  Search,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { FaFutbol } from "react-icons/fa";
import pizarraImg from "../assets/Branding/PIZARRACOMPLETA.jpg";
import { supabase } from "../services/supabaseClient";

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const tools = [
  { id: "line", label: "Linea", icon: Minus },
  { id: "arrow", label: "Flecha", icon: ArrowRight },
  { id: "dashed", label: "Desmarque", icon: MoveRight },
  { id: "rect", label: "Zona", icon: Square },
  { id: "grid", label: "Cuadricula", icon: Grid3X3 },
  { id: "circle", label: "Radio", icon: Circle },
  { id: "text", label: "Texto", icon: Type }
];

const Pizarra = () => {
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const wrapperRef = useRef(null);
  const imageInputRef = useRef(null);
  const imageUrlsRef = useRef([]);

  const [tool, setTool] = useState("line");
  const [color, setColor] = useState("#0d61af");
  const [lineWidth, setLineWidth] = useState(4);
  const [elements, setElements] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [cardScale, setCardScale] = useState(1);
  const [placedCards, setPlacedCards] = useState([]);
  const [draggingCardId, setDraggingCardId] = useState(null);

  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const cardDragOffset = useRef({ x: 0, y: 0 });

  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: "",
    id: null,
    fontSize: 24
  });

  const [hoverTextId, setHoverTextId] = useState(null);
  const [draggingText, setDraggingText] = useState(false);
  const filteredPlayers = players
    .filter((player) =>
      player.name.toLowerCase().includes(playerSearch.trim().toLowerCase())
    )
    .slice(0, 8);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("jugadores")
        .select("id,name,number,position,team_type,card_url")
        .not("card_url", "is", null)
        .order("number", { ascending: true });

      setPlayers(data || []);
    };

    fetchPlayers();
  }, []);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const resize = () => {
      const wrapper = wrapperRef.current;
      const main = mainRef.current;
      const overlay = overlayRef.current;
      if (!wrapper || !main || !overlay) return;

      const { width, height } = wrapper.getBoundingClientRect();

      main.width = width;
      main.height = height;
      overlay.width = width;
      overlay.height = height;
      redrawAll();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    redrawAll();
  }, [elements, hoverTextId, placedCards]);

  const posFromEvent = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const redrawAll = () => {
    const main = mainRef.current;
    const overlay = overlayRef.current;
    if (!main || !overlay) return;

    const ctx = main.getContext("2d");
    ctx.clearRect(0, 0, main.width, main.height);

    elements.forEach((el) => {
      if (el.type === "shape") drawShape(ctx, el);
      if (el.type === "text") drawText(ctx, el);
    });

    const octx = overlay.getContext("2d");
    octx.clearRect(0, 0, overlay.width, overlay.height);

    if (hoverTextId) {
      const el = elements.find((item) => item.id === hoverTextId);
      if (el) {
        octx.save();
        octx.strokeStyle = color;
        octx.lineWidth = 1.5;
        octx.setLineDash([4, 4]);
        octx.strokeRect(el.bbox.x - 5, el.bbox.y - 5, el.bbox.w + 10, el.bbox.h + 10);
        octx.restore();
      }
    }
  };

  const drawShape = (ctx, el) => {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(el.shape === "dashed" ? [12, 10] : []);

    if (el.shape === "line" || el.shape === "dashed") {
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
    }

    if (el.shape === "rect") {
      ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
    }

    if (el.shape === "grid") {
      drawGridZone(ctx, el.x1, el.y1, el.x2, el.y2);
    }

    if (el.shape === "circle") {
      const r = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
      ctx.beginPath();
      ctx.arc(el.x1, el.y1, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (el.shape === "arrow") {
      drawArrow(ctx, el.x1, el.y1, el.x2, el.y2, el.color);
    }

    ctx.restore();
  };

  const drawGridZone = (ctx, x1, y1, x2, y2) => {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    ctx.strokeRect(left, top, width, height);

    for (let i = 1; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(left + (width / 3) * i, top);
      ctx.lineTo(left + (width / 3) * i, top + height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(left, top + (height / 3) * i);
      ctx.lineTo(left + width, top + (height / 3) * i);
      ctx.stroke();
    }
  };

  const drawArrow = (ctx, x1, y1, x2, y2, arrowColor = color) => {
    const headLen = 15;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = arrowColor;
    ctx.fill();
  };

  const drawText = (ctx, el) => {
    ctx.save();
    ctx.fillStyle = el.color;
    ctx.font = `800 ${el.fontSize}px Space Grotesk, Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(el.text, el.x, el.y);
    ctx.restore();
  };

  const computeBBox = (ctx, text, x, y, fontSize) => {
    ctx.font = `800 ${fontSize}px Space Grotesk, Arial, sans-serif`;
    const width = ctx.measureText(text).width;
    return { x, y, w: width, h: fontSize };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const pos = posFromEvent(e);

    const hovered = elements.find(
      (el) =>
        el.type === "text" &&
        pos.x >= el.bbox.x &&
        pos.x <= el.bbox.x + el.bbox.w &&
        pos.y >= el.bbox.y &&
        pos.y <= el.bbox.y + el.bbox.h
    );

    if (hovered) {
      setDraggingText(true);
      dragOffset.current = { x: pos.x - hovered.x, y: pos.y - hovered.y };
      setHoverTextId(hovered.id);
      return;
    }

    drawingRef.current = true;
    startRef.current = pos;

    if (tool === "text") {
      const fontSize = 24;
      const newText = {
        id: uid(),
        type: "text",
        x: pos.x,
        y: pos.y,
        text: "",
        fontSize,
        color,
        bbox: { x: pos.x, y: pos.y, w: 0, h: fontSize }
      };

      setElements((prev) => [...prev, newText]);
      setTextInput({ visible: true, x: pos.x, y: pos.y, value: "", id: newText.id, fontSize });
    }
  };

  const clampCardPosition = (x, y) => {
    return {
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(8, Math.min(92, y))
    };
  };

  const addPlayerCard = (player) => {
    setPlacedCards((prev) => [
      ...prev,
      {
        id: uid(),
        type: "player",
        playerId: player.id,
        name: player.name,
        number: player.number,
        cardUrl: player.card_url,
        x: 50,
        y: 50
      }
    ]);
  };

  const addBall = () => {
    setPlacedCards((prev) => [
      ...prev,
      {
        id: uid(),
        type: "ball",
        name: "Balon",
        x: 50,
        y: 50
      }
    ]);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const uploadedImages = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      imageUrlsRef.current.push(url);

      return {
        id: uid(),
        type: "image",
        name: file.name || "Imagen",
        cardUrl: url,
        x: 45 + index * 4,
        y: 45 + index * 4
      };
    });

    setPlacedCards((prev) => [...prev, ...uploadedImages]);
    event.target.value = "";
  };

  const revokePlacedImage = (item) => {
    if (item?.type !== "image" || !item.cardUrl) return;
    URL.revokeObjectURL(item.cardUrl);
    imageUrlsRef.current = imageUrlsRef.current.filter((url) => url !== item.cardUrl);
  };

  const clearPlacedMedia = () => {
    placedCards.forEach(revokePlacedImage);
    setPlacedCards([]);
  };

  const removePlacedCard = (card) => {
    revokePlacedImage(card);
    setPlacedCards((prev) => prev.filter((item) => item.id !== card.id));
  };

  const handleCardPointerDown = (e, card) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = wrapperRef.current.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    const currentX = (card.x / 100) * rect.width;
    const currentY = (card.y / 100) * rect.height;

    cardDragOffset.current = {
      x: clientX - rect.left - currentX,
      y: clientY - rect.top - currentY
    };

    setDraggingCardId(card.id);
  };

  const handleCardPointerMove = (e) => {
    if (!draggingCardId) return;
    e.preventDefault();

    const rect = wrapperRef.current.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    const next = clampCardPosition(
      ((clientX - rect.left - cardDragOffset.current.x) / rect.width) * 100,
      ((clientY - rect.top - cardDragOffset.current.y) / rect.height) * 100
    );

    setPlacedCards((prev) =>
      prev.map((card) =>
        card.id === draggingCardId ? { ...card, x: next.x, y: next.y } : card
      )
    );
  };

  const handleCardPointerUp = () => {
    setDraggingCardId(null);
  };

  const handlePointerMove = (e) => {
    if (draggingCardId) {
      handleCardPointerMove(e);
      return;
    }

    const pos = posFromEvent(e);

    if (draggingText && hoverTextId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== hoverTextId) return el;

          const newX = pos.x - dragOffset.current.x;
          const newY = pos.y - dragOffset.current.y;
          const ctx = mainRef.current.getContext("2d");
          const bbox = computeBBox(ctx, el.text, newX, newY, el.fontSize);
          return { ...el, x: newX, y: newY, bbox };
        })
      );
      return;
    }

    if (drawingRef.current && tool !== "text") {
      const overlay = overlayRef.current;
      const octx = overlay.getContext("2d");
      const { x: sx, y: sy } = startRef.current;

      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.strokeStyle = color;
      octx.lineWidth = lineWidth;
      octx.lineCap = "round";
      octx.lineJoin = "round";
      octx.setLineDash(tool === "dashed" ? [12, 10] : []);

      if (tool === "line" || tool === "dashed") {
        octx.beginPath();
        octx.moveTo(sx, sy);
        octx.lineTo(pos.x, pos.y);
        octx.stroke();
      }

      if (tool === "rect") {
        octx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      }

      if (tool === "grid") {
        drawGridZone(octx, sx, sy, pos.x, pos.y);
      }

      if (tool === "circle") {
        const r = Math.hypot(pos.x - sx, pos.y - sy);
        octx.beginPath();
        octx.arc(sx, sy, r, 0, Math.PI * 2);
        octx.stroke();
      }

      if (tool === "arrow") {
        drawArrow(octx, sx, sy, pos.x, pos.y);
      }
    }
  };

  const handlePointerUp = (e) => {
    if (draggingCardId) {
      handleCardPointerUp();
      return;
    }

    if (drawingRef.current && tool !== "text") {
      const pos = posFromEvent(e);
      const sx = startRef.current.x;
      const sy = startRef.current.y;
      const newShape = {
        id: uid(),
        type: "shape",
        x1: sx,
        y1: sy,
        x2: pos.x,
        y2: pos.y,
        color,
        width: lineWidth,
        shape: tool
      };

      setElements((prev) => [...prev, newShape]);
      overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    drawingRef.current = false;
    setDraggingText(false);
  };

  const commitTextInput = () => {
    if (!textInput.visible) return;

    const ctx = mainRef.current.getContext("2d");
    setElements((prev) =>
      prev
        .map((el) => {
          if (el.id !== textInput.id) return el;
          const bbox = computeBBox(ctx, textInput.value, el.x, el.y, el.fontSize);
          return { ...el, text: textInput.value, bbox };
        })
        .filter((el) => el.type !== "text" || el.text.trim())
    );

    setTextInput({ visible: false, x: 0, y: 0, value: "", id: null, fontSize: 24 });
  };

  const undoLast = () => {
    if (placedCards.length) {
      setPlacedCards((prev) => {
        revokePlacedImage(prev.at(-1));
        return prev.slice(0, -1);
      });
      return;
    }

    setElements((prev) => prev.slice(0, -1));
  };

  const exportBoard = async () => {
    const board = wrapperRef.current;
    const main = mainRef.current;
    if (!board || !main) return;

    try {
      const exportCanvas = await html2canvas(board, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      const link = document.createElement("a");
      link.download = "pizarra-alavesfera.png";
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    } catch {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = main.width;
      exportCanvas.height = main.height;

      const ctx = exportCanvas.getContext("2d");
      const image = new Image();
      image.src = pizarraImg;

      image.onload = () => {
        ctx.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(main, 0, 0);

        const link = document.createElement("a");
        link.download = "pizarra-alavesfera.png";
        link.href = exportCanvas.toDataURL("image/png");
        link.click();
      };
    }
  };

  return (
    <div className="pizarra-wrap">
      <div className="pizarra-shell">
        <header className="pizarra-header">
          <div className="pizarra-actions">
            <button
              type="button"
              onClick={undoLast}
              disabled={!elements.length && !placedCards.length}
              title="Deshacer"
            >
              <Undo2 size={18} />
              <span>Deshacer</span>
            </button>
            <button type="button" onClick={exportBoard} title="Exportar">
              <Download size={18} />
              <span>Exportar</span>
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setElements([]);
                clearPlacedMedia();
              }}
              title="Limpiar"
            >
              <Eraser size={18} />
              <span>Limpiar</span>
            </button>
          </div>
        </header>

        <div className="pizarra-studio">
          <div className="board-frame">
            <div className="board-rail top"></div>
            <div
              className="campo-wrapper"
              ref={wrapperRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              <div className="campo-bg" style={{ backgroundImage: `url(${pizarraImg})` }} />
              <canvas ref={mainRef} className="canvas-main" />
              <canvas ref={overlayRef} className="canvas-overlay" />
              <div className="cards-layer">
                {placedCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`placed-player-card placed-${card.type || "player"}`}
                    style={{
                      left: `${card.x}%`,
                      top: `${card.y}%`,
                      ...(card.type === "ball" ? {} : { "--media-scale": cardScale })
                    }}
                    onMouseDown={(e) => handleCardPointerDown(e, card)}
                    onTouchStart={(e) => handleCardPointerDown(e, card)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      removePlacedCard(card);
                    }}
                    aria-label={`Mover ${card.name}`}
                  >
                    {card.type === "ball" ? (
                      <span className="soccer-ball" aria-hidden="true">⚽</span>
                    ) : (
                      <img src={card.cardUrl} alt={card.name} draggable="false" />
                    )}
                  </button>
                ))}
              </div>
              {textInput.visible && (
                <input
                  autoFocus
                  className="text-floating"
                  style={{
                    left: textInput.x,
                    top: textInput.y,
                    fontSize: textInput.fontSize,
                    color
                  }}
                  value={textInput.value}
                  onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
                  onBlur={commitTextInput}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") commitTextInput();
                  }}
                />
              )}
            </div>
            <div className="board-rail bottom"></div>
          </div>

          <aside className="barra-moderna" aria-label="Herramientas de pizarra">
            <div className="tool-section">
              <span className="tool-section-label">Trazo</span>
              <div className="tool-grid">
                {tools.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={tool === id ? "active" : ""}
                    onClick={() => setTool(id)}
                    title={label}
                    aria-label={label}
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            </div>

            <div className="tool-section">
              <span className="tool-section-label">Color</span>
              <label className="color-picker-wrap" style={{ "--selected-color": color }} title="Color">
                <PaintBucket size={18} />
                <span className="color-current" aria-hidden="true" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="color-picker"
                  aria-label="Elegir color"
                />
              </label>
            </div>

            <div className="tool-section">
              <span className="tool-section-label">Grosor</span>
              <div className="stroke-slider">
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  aria-label="Grosor del trazo"
                />
                <span style={{ height: lineWidth }} aria-hidden="true" />
              </div>
            </div>
          </aside>

          <aside className="players-panel">
            <div className="players-panel-head">
              <input
                type="search"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Buscar jugador"
                aria-label="Buscar jugador"
              />
            </div>
            <div className="players-list">
              {playerSearch.trim() ? (
                filteredPlayers.length ? (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="player-card-option"
                      onClick={() => addPlayerCard(player)}
                      title={player.name}
                    >
                      <span>{player.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="players-empty">Sin resultados</p>
                )
              ) : (
                <p className="players-empty">Escribe para buscar cartas</p>
              )}
            </div>

            <div className="media-controls">
              <div className="card-scale-control">
                <Search size={17} />
                <input
                  type="range"
                  min="0.75"
                  max="1.75"
                  step="0.05"
                  value={cardScale}
                  onChange={(e) => setCardScale(Number(e.target.value))}
                  aria-label="Escala de cartas"
                />
              </div>
              <div className="players-panel-actions">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="upload-input"
                  onChange={handleImageUpload}
                />
                <button type="button" onClick={() => imageInputRef.current?.click()}>
                  <ImagePlus size={17} />
                  <span>Añadir imagen</span>
                </button>
                <button type="button" onClick={addBall}>
                  <FaFutbol />
                  <span>Añadir balón</span>
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={clearPlacedMedia}
                  disabled={!placedCards.length}
                >
                  <Trash2 size={17} />
                  <span>Eliminar todo</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Pizarra;
