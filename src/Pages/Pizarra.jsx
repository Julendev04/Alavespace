import React, { useEffect, useRef, useState } from "react"; 
import "./Pizarra.css";
import { ArrowRight, MoveRight, Minus, Circle, Type, Trash2, Palette, Square } from "lucide-react";
import pizarraImg from "../assets/Branding/PIZARRA_PLANTILLA.jpg";

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const Pizarra = () => {
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const wrapperRef = useRef(null);

  const [tool, setTool] = useState("line"); // line, rect, circle, arrow, dashed, text
  const [color, setColor] = useState("#0d61af");
  const lineWidth = 4;

  const [elements, setElements] = useState([]);
  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: "",
    id: null,
    fontSize: 24,
  });

  const [hoverTextId, setHoverTextId] = useState(null);
  const [draggingText, setDraggingText] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Mantener proporción 16:9
  useEffect(() => {
    const resize = () => {
      const wrapper = wrapperRef.current;
      const w = wrapper.offsetWidth;
      const h = w * (9 / 16);

      mainRef.current.width = w;
      mainRef.current.height = h;
      overlayRef.current.width = w;
      overlayRef.current.height = h;
      redrawAll();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    redrawAll();
  }, [elements, hoverTextId]);

  const posFromEvent = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const redrawAll = () => {
    const ctx = mainRef.current.getContext("2d");
    ctx.clearRect(0, 0, mainRef.current.width, mainRef.current.height);

    elements.forEach((el) => {
      if (el.type === "shape") drawShape(ctx, el);
      else if (el.type === "text") drawText(ctx, el);
    });

    const octx = overlayRef.current.getContext("2d");
    octx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

    if (hoverTextId) {
      const el = elements.find((x) => x.id === hoverTextId);
      if (el) {
        octx.save();
        octx.strokeStyle = color;
        octx.lineWidth = 1.5;
        octx.setLineDash([4, 4]);
        octx.strokeRect(el.bbox.x - 4, el.bbox.y - 4, el.bbox.w + 8, el.bbox.h + 8);
        octx.restore();
      }
    }
  };

  const drawShape = (ctx, el) => {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.width;
    ctx.setLineDash(el.shape === "dashed" ? [6, 4] : []);

    if (el.shape === "line") {
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
    } else if (el.shape === "rect") {
      ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
    } else if (el.shape === "circle") {
      const r = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
      ctx.beginPath();
      ctx.arc(el.x1, el.y1, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (el.shape === "arrow") {
      drawArrow(ctx, el.x1, el.y1, el.x2, el.y2);
    }

    ctx.restore();
  };

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    const headLen = 12;
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
    ctx.lineTo(x2, y2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawText = (ctx, el) => {
    ctx.save();
    ctx.fillStyle = el.color;
    ctx.font = `${el.fontSize}px Arial`;
    ctx.textBaseline = "top";
    ctx.fillText(el.text, el.x, el.y);
    ctx.restore();
  };

  const computeBBox = (ctx, text, x, y, fontSize) => {
    ctx.font = `${fontSize}px Arial`;
    const w = ctx.measureText(text).width;
    const h = fontSize;
    return { x, y, w, h };
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
        bbox: { x: pos.x, y: pos.y, w: 0, h: fontSize },
      };
      setElements((prev) => [...prev, newText]);
      setTextInput({ visible: true, x: pos.x, y: pos.y, value: "", id: newText.id, fontSize });
    }
  };

  const handlePointerMove = (e) => {
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
      const octx = overlayRef.current.getContext("2d");
      octx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      octx.strokeStyle = color;
      octx.lineWidth = lineWidth;
      octx.setLineDash(tool === "dashed" ? [6, 4] : []);

      const { x: sx, y: sy } = startRef.current;

      if (tool === "line") {
        octx.beginPath();
        octx.moveTo(sx, sy);
        octx.lineTo(pos.x, pos.y);
        octx.stroke();
      } else if (tool === "rect") {
        octx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (tool === "circle") {
        const r = Math.hypot(pos.x - sx, pos.y - sy);
        octx.beginPath();
        octx.arc(sx, sy, r, 0, Math.PI * 2);
        octx.stroke();
      } else if (tool === "arrow") {
        drawArrow(octx, sx, sy, pos.x, pos.y);
      }
    }
  };

  const handlePointerUp = (e) => {
    const pos = posFromEvent(e);

    if (drawingRef.current && tool !== "text") {
      drawingRef.current = false;
      const sx = startRef.current.x;
      const sy = startRef.current.y;

      let newShape = { id: uid(), type: "shape", x1: sx, y1: sy, x2: pos.x, y2: pos.y, color, width: lineWidth, shape: tool };

      setElements((prev) => [...prev, newShape]);
      overlayRef.current.getContext("2d").clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    setDraggingText(false);
  };

  const commitTextInput = () => {
    if (!textInput.visible) return;
    const ctx = mainRef.current.getContext("2d");
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== textInput.id) return el;
        const bbox = computeBBox(ctx, textInput.value, el.x, el.y, el.fontSize);
        return { ...el, text: textInput.value, bbox };
      })
    );
    setTextInput({ visible: false, x: 0, y: 0, value: "", id: null, fontSize: 24 });
  };

  return (
    <div className="pizarra-wrap">
      <h2 className="pizarra-title">Pizarra táctica</h2>

      {/* ================= BARRA DE ICONOS ================= */}
      <div className="barra-moderna">
        <button className={tool === "line" ? "active" : ""} onClick={() => setTool("line")}><Minus size={20} color="#000" /></button>
        <button className={tool === "rect" ? "active" : ""} onClick={() => setTool("rect")}><Square size={20} color="#000" /></button>
        <button className={tool === "circle" ? "active" : ""} onClick={() => setTool("circle")}><Circle size={20} color="#000" /></button>
        <button className={tool === "arrow" ? "active" : ""} onClick={() => setTool("arrow")}><ArrowRight size={20} color="#000" /></button>
        <button className={tool === "dashed" ? "active" : ""} onClick={() => setTool("dashed")}><MoveRight size={20} color="#000" /></button>
        <button className={tool === "text" ? "active" : ""} onClick={() => setTool("text")}><Type size={20} color="#000" /></button>
        <div className="color-picker-wrap">
          <Palette size={20} color="#000" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="color-picker" />
        </div>
        <button className="delete-btn" onClick={() => setElements([])}><Trash2 size={20} /></button>
      </div>

      {/* ================= CANVAS ================= */}
      <div
        className="campo-wrapper"
        ref={wrapperRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <div className="campo-bg" style={{ backgroundImage: `url(${pizarraImg})` }}/>
        <canvas ref={mainRef} className="canvas-main" />
        <canvas ref={overlayRef} className="canvas-overlay" />
        {textInput.visible && (
          <input
            autoFocus
            className="text-floating"
            style={{
              left: textInput.x,
              top: textInput.y,
              fontSize: textInput.fontSize,
              color: color,
            }}
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
            onBlur={commitTextInput}
            onKeyDown={(ev) => { if (ev.key === "Enter") commitTextInput(); }}
          />
        )}
      </div>
    </div>
  );
};

export default Pizarra;
