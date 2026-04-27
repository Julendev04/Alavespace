import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaGamepad,
  FaUsers,
  FaFutbol,
  FaChalkboard
} from "react-icons/fa";
import { supabase } from "../services/SupabaseClient";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  const dropdownRef = useRef(null);
  const userRef = useRef(null);

  const navigate = useNavigate();

  // CLICK OUTSIDE + RELOJ
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

  // USUARIO
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);

          supabase
            .from("profiles")
            .select("username")
            .eq("id", session.user.id)
            .single()
            .then(({ data }) => {
              if (data) setUsername(data.username);
            });
        } else {
          setUser(null);
          setUsername("");
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUsername("");
      navigate("/auth");
    }
  };

  const opcionesFecha = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  };

  const opcionesHora = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid"
  };

  const fechaFormateada = fechaHora.toLocaleDateString("es-ES", opcionesFecha);
  const horaFormateada = fechaHora.toLocaleTimeString("es-ES", opcionesHora);

  const titular =
    "Última hora: El Alavés prepara su gran remontada para la próxima jornada";

  return (
    <nav className="navbar">
      {/* IZQUIERDA */}
      <div className="navbar-left">
        <Link to="/home" className="navbar-brand">
          <img src="src/assets/Branding/Logo.png" alt="logo" className="navbar-logo" />
          <span>Alavesfera</span>
        </Link>

        <span className="fecha-pill">
          {fechaFormateada} | {horaFormateada}h
        </span>

        <div className="ticker-container">
          <div className="ticker">
            <div className="ticker-item">
              <span className="red-dot"></span>
              <span className="ticker-text">{titular}</span>
            </div>
            <div className="ticker-item">
              <span className="red-dot"></span>
              <span className="ticker-text">{titular}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DERECHA */}
      <div className="navbar-right">
        {/* MENÚ */}
        <div className="dropdown" ref={dropdownRef}>
          <button
            className="dropdown-button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
              setUserMenuOpen(false);
            }}
          >
            ⋮
          </button>

          <ul className={`dropdown-menu ${menuOpen ? "show" : ""}`}>
            <li>
              <Link to="/notas" onClick={() => setMenuOpen(false)}>
                <FaGamepad />
                <span>Notas</span>
              </Link>
            </li>
            <li>
              <Link to="/lineup" onClick={() => setMenuOpen(false)}>
                <FaUsers />
                <span>Lineup</span>
              </Link>
            </li>
            <li>
              <Link to="/porra" onClick={() => setMenuOpen(false)}>
                <FaFutbol />
                <span>Porra</span>
              </Link>
            </li>
            <li>
              <Link to="/pizarra" onClick={() => setMenuOpen(false)}>
                <FaChalkboard />
                <span>Pizarra</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* USUARIO */}
        {!user && (
          <Link to="/auth" className="account-button">
            <FaUserCircle />
            <span>TU CUENTA</span>
          </Link>
        )}

        {user && (
          <div className="user-box" ref={userRef}>
            <div
              className="user-info"
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen((prev) => !prev);
                setMenuOpen(false);
              }}
            >
              <FaUserCircle />
              <span>{username || "Usuario"}</span>
            </div>

            <div className={`user-dropdown ${userMenuOpen ? "show" : ""}`}>
              <button onClick={() => navigate("/Perfil")}>
                Ver perfil
              </button>
              <button onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;