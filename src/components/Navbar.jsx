import React, { useEffect, useRef, useState } from "react";
import logo from "../assets/Branding/Logo.png";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaChalkboard,
  FaFutbol,
  FaGamepad,
  FaPaperPlane,
  FaUserCircle,
  FaUsers
} from "react-icons/fa";
import { supabase } from "../services/supabaseClient";
import "./Navbar.css";

const fallbackNotifications = [
  {
    id: "welcome",
    title: "Centro de avisos",
    message: "Aqui apareceran los eventos importantes de la web y los anuncios del equipo.",
    created_at: new Date().toISOString()
  }
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState(fallbackNotifications);
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [isMobileMenu, setIsMobileMenu] = useState(false);

  const navbarRef = useRef(null);
  const dropdownRef = useRef(null);
  const userRef = useRef(null);
  const notificationsRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSize = () => {
      setIsMobileMenu(window.innerWidth <= 1643);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      setUser(data.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", data.user.id)
        .single();

      setUsername(profile?.username || "");
      setIsAdmin(profile?.role === "admin");
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("site_notifications")
        .select("id,title,message,created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data?.length) {
        setNotifications(data);
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername("");
    setIsAdmin(false);
    navigate("/auth");
  };

  const publishAnnouncement = async () => {
    const cleanMessage = announcementDraft.trim();
    if (!cleanMessage) return;

    const newNotification = {
      title: "Aviso de Alavesfera",
      message: cleanMessage,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("site_notifications")
      .insert({
        ...newNotification,
        created_by: user?.id || null
      })
      .select("id,title,message,created_at")
      .single();

    setNotifications((prev) => [
      error ? { ...newNotification, id: Date.now() } : data,
      ...prev
    ].slice(0, 8));
    setAnnouncementDraft("");
  };

  return (
    <nav ref={navbarRef} className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-brand">
          <img src={logo} className="navbar-logo" alt="Alavesfera" />
          <span>Alavesfera</span>
        </Link>

        <div className="dropdown navbar-sections-menu" ref={dropdownRef}>
          <button
            type="button"
            className="dropdown-button"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setUserMenuOpen(false);
              setNotificationsOpen(false);
            }}
            aria-label="Abrir menu"
          >
            <span className="menu-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>

          {!isMobileMenu && (
            <ul className={`dropdown-menu ${menuOpen ? "show" : ""}`}>
              <li><Link to="/notas"><FaGamepad /> Notas</Link></li>
              <li><Link to="/lineup"><FaUsers /> Lineup</Link></li>
              <li><Link to="/porra"><FaFutbol /> Porra</Link></li>
              <li><Link to="/pizarra"><FaChalkboard /> Pizarra</Link></li>
            </ul>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {!user ? (
          <Link to="/auth" className="account-button">
            <FaUserCircle />
            <span>TU CUENTA</span>
          </Link>
        ) : (
          <div className="user-box" ref={userRef}>
            <button
              type="button"
              className="user-info"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
                setMenuOpen(false);
              }}
            >
              <FaUserCircle />
              <span>{username || "Usuario"}</span>
            </button>

            <div className={`user-dropdown ${userMenuOpen ? "show" : ""}`}>
              <button onClick={() => navigate("/perfil")}>Ver perfil</button>
              <button onClick={handleLogout}>Cerrar sesion</button>
            </div>
          </div>
        )}

        <div className="notifications-box" ref={notificationsRef}>
          <button
            type="button"
            className={`notification-button ${notificationsOpen ? "active" : ""}`}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setMenuOpen(false);
              setUserMenuOpen(false);
            }}
            aria-label="Abrir notificaciones"
          >
            <FaBell />
            {notifications.length > 0 && <span className="notification-dot" />}
          </button>

          <div className={`notifications-panel ${notificationsOpen ? "show" : ""}`}>
            <div className="notifications-head">
              <strong>Notificaciones</strong>
              <span>Eventos y avisos</span>
            </div>

            <div className="notifications-list">
              {notifications.map((item) => (
                <article key={item.id} className="notification-item">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <time>
                    {new Date(item.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </time>
                </article>
              ))}
            </div>

            {isAdmin && (
              <div className="notification-admin">
                <textarea
                  value={announcementDraft}
                  onChange={(event) => setAnnouncementDraft(event.target.value)}
                  placeholder="Anunciar mensaje a los usuarios"
                  rows="3"
                />
                <button type="button" onClick={publishAnnouncement}>
                  <FaPaperPlane />
                  Publicar aviso
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

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
