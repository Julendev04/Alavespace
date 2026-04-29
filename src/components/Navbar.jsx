import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/Branding/Logo.png";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaGamepad,
  FaUsers,
  FaFutbol,
  FaChalkboard
} from "react-icons/fa";
import { supabase } from "../services/supabaseClient";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  // 🔥 SOLO CONTROL POR BREAKPOINT
  const [isMobileMenu, setIsMobileMenu] = useState(false);

  const navbarRef = useRef(null);
  const dropdownRef = useRef(null);
  const userRef = useRef(null);

  const navigate = useNavigate();

  /* ========================= */
  /* RESPONSIVE BREAKPOINT 1643px */
  /* ========================= */
  useEffect(() => {
    const checkSize = () => {
      setIsMobileMenu(window.innerWidth <= 1643);
    };

    checkSize();
    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  /* ========================= */
  /* CLICK OUTSIDE + RELOJ */
  /* ========================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    const interval = setInterval(() => setFechaHora(new Date()), 1000);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  /* ========================= */
  /* USER AUTH */
  /* ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        if (profile) setUsername(profile.username);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername("");
    navigate("/auth");
  };

  const fechaFormateada = fechaHora.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const horaFormateada = fechaHora.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid"
  });

  const titular =
    "Última hora: El Alavés prepara su gran remontada para la próxima jornada";

  return (
    <nav ref={navbarRef} className="navbar">

      {/* LEFT */}
      <div className="navbar-left">
        <Link to="/home" className="navbar-brand">
          <img src={logo} className="navbar-logo" />
          <span>Alavesfera</span>
        </Link>

        <span className="fecha-pill">
          {fechaFormateada} | {horaFormateada}h
        </span>

        <div className="ticker-container">
          <div className="ticker">
            <div className="ticker-item">
              <span className="red-dot" />
              <span className="ticker-text">{titular}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        {/* MENU BUTTON */}
        <div className="dropdown" ref={dropdownRef}>
          <button
            className="dropdown-button"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setUserMenuOpen(false);
            }}
          >
            ⋮
          </button>

          {/* DESKTOP MENU (solo >1643px) */}
          {!isMobileMenu && (
            <ul className={`dropdown-menu ${menuOpen ? "show" : ""}`}>
              <li><Link to="/notas"><FaGamepad /> Notas</Link></li>
              <li><Link to="/lineup"><FaUsers /> Lineup</Link></li>
              <li><Link to="/porra"><FaFutbol /> Porra</Link></li>
              <li><Link to="/pizarra"><FaChalkboard /> Pizarra</Link></li>
            </ul>
          )}
        </div>

        {/* USER */}
        {!user ? (
          <Link to="/auth" className="account-button">
            <FaUserCircle />
            <span>TU CUENTA</span>
          </Link>
        ) : (
          <div className="user-box" ref={userRef}>
            <div
              className="user-info"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <FaUserCircle />
              <span>{username || "Usuario"}</span>
            </div>

            <div className={`user-dropdown ${userMenuOpen ? "show" : ""}`}>
              <button onClick={() => navigate("/perfil")}>Ver perfil</button>
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </div>
        )}
      </div>

      {/* BACKDROP + OVERLAY (SOLO <=1643px) */}
      {isMobileMenu && (
        <>
          <div
            className={`menu-backdrop ${menuOpen ? "show" : ""}`}
            onClick={() => setMenuOpen(false)}
          />

          <div className={`menu-overlay ${menuOpen ? "show" : ""}`}>
            <Link to="/notas" onClick={() => setMenuOpen(false)}>
              <FaGamepad /> Notas
            </Link>
            <Link to="/lineup" onClick={() => setMenuOpen(false)}>
              <FaUsers /> Lineup
            </Link>
            <Link to="/porra" onClick={() => setMenuOpen(false)}>
              <FaFutbol /> Porra
            </Link>
            <Link to="/pizarra" onClick={() => setMenuOpen(false)}>
              <FaChalkboard /> Pizarra
            </Link>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;