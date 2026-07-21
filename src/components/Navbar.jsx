import React, { useEffect, useRef, useState } from "react";
import logoParaWeb from "../assets/LogoParaWeb.png";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaChalkboard,
  FaFutbol,
  FaGamepad,
  FaGraduationCap,
  FaGlobeEurope,
  FaMicrophone,
  FaPaperPlane,
  FaShieldAlt,
  FaThList,
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

const navGroups = [
  {
    key: "juegos",
    label: "Juegos",
    icon: FaGamepad,
    items: [
      { label: "Notas", to: "/notas", icon: FaGraduationCap },
      { label: "Lineup", to: "/lineup", icon: FaUsers },
      { label: "Porra", to: "/porra", icon: FaFutbol },
      { label: "Pizarra", to: "/pizarra", icon: FaChalkboard },
      { label: "Tierlist", to: "/tierlist", icon: FaThList }
    ]
  }
];

const worldSections = [
  { label: "Mundo Glorioso", to: "/Plantilla?team=first_team", tone: "first" },
  { label: "Mundo Gloriosas", to: "/Plantilla?team=women_team", tone: "women" },
  { label: "Mundo Miniglorias", to: "/Plantilla?team=b_team", tone: "reserve" }
];

const avatarColors = ["#0d61af", "#e10600", "#18a999", "#8b5cf6", "#d97706", "#0f766e"];

const getAvatarColor = (value = "") => {
  const key = value || "alavesfera-user";
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
        setActiveMenu(null);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }

      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setWorldOpen(false);
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

      const [{ data: profile }, { data: porraUser }] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, role")
          .eq("id", data.user.id)
          .maybeSingle(),
        supabase
          .from("porra_users")
          .select("nombre, avatar")
          .eq("id", data.user.id)
          .maybeSingle()
      ]);

      setUsername(profile?.username || porraUser?.nombre || "");
      setAvatarUrl(porraUser?.avatar || "");
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
    setAvatarUrl("");
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
          <img src={logoParaWeb} className="navbar-logo navbar-logo-full" alt="Alavesfera" />
        </Link>
        <span className="navbar-brand-separator" aria-hidden="true" />

        <div className="dropdown navbar-sections-menu" ref={dropdownRef}>
          {isMobileMenu && (
            <button
              type="button"
              className="dropdown-button"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setActiveMenu(null);
                setUserMenuOpen(false);
                setNotificationsOpen(false);
                setWorldOpen(false);
              }}
              aria-label="Abrir menu"
            >
              <span className="menu-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
          )}

          {!isMobileMenu && (
            <div className="navbar-primary-menus">
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const isOpen = activeMenu === group.key;

                if (group.to) {
                  return (
                    <Link
                      key={group.key}
                      to={group.to}
                      className={`nav-group-button ${group.variant ? `nav-group-button-${group.variant}` : ""}`}
                      onClick={() => {
                        setActiveMenu(null);
                        setMenuOpen(false);
                        setUserMenuOpen(false);
                        setNotificationsOpen(false);
                        setWorldOpen(false);
                      }}
                    >
                      <GroupIcon />
                      <span className="nav-group-divider" aria-hidden="true" />
                      {group.label}
                    </Link>
                  );
                }

                return (
                  <div key={group.key} className="nav-group-dropdown">
                    <button
                      type="button"
                      className={`nav-group-button ${isOpen ? "active" : ""}`}
                      onClick={() => {
                        setActiveMenu(isOpen ? null : group.key);
                        setMenuOpen(false);
                        setUserMenuOpen(false);
                        setNotificationsOpen(false);
                        setWorldOpen(false);
                      }}
                    >
                      <GroupIcon />
                      <span className="nav-group-divider" aria-hidden="true" />
                      {group.label}
                    </button>

                    <ul className={`dropdown-menu nav-submenu ${isOpen ? "show" : ""}`}>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <li key={item.to}>
                            <Link to={item.to} onClick={() => setActiveMenu(null)}>
                              <ItemIcon />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <a
          href="https://www.ivoox.com/"
          className="podcast-right-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setActiveMenu(null);
            setMenuOpen(false);
            setUserMenuOpen(false);
            setNotificationsOpen(false);
            setWorldOpen(false);
          }}
        >
          <FaMicrophone />
          <span>Podcast</span>
        </a>

        <Link
          to="/laliga-guia"
          className="laliga-right-link"
          onClick={() => {
            setActiveMenu(null);
            setMenuOpen(false);
            setUserMenuOpen(false);
            setNotificationsOpen(false);
            setWorldOpen(false);
          }}
        >
          <FaShieldAlt />
          <span>LaLiga Guia</span>
        </Link>

        <button
          type="button"
          className={`world-button ${worldOpen ? "active" : ""}`}
          onClick={() => {
            setWorldOpen(!worldOpen);
            setNotificationsOpen(false);
            setUserMenuOpen(false);
            setMenuOpen(false);
            setActiveMenu(null);
          }}
          aria-expanded={worldOpen}
          aria-controls="navbar-world-strip"
        >
          <FaGlobeEurope />
          <span>Mundo</span>
        </button>

        <div className="notifications-box" ref={notificationsRef}>
          <button
            type="button"
            className={`notification-button ${notificationsOpen ? "active" : ""}`}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setMenuOpen(false);
              setUserMenuOpen(false);
              setActiveMenu(null);
              setWorldOpen(false);
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

        {!user ? (
          <Link to="/auth" className="account-button navbar-avatar-button" aria-label="Iniciar sesion">
            <FaUserCircle />
          </Link>
        ) : (
          <div className="user-box" ref={userRef}>
            <button
              type="button"
              className="user-info navbar-avatar-button"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
                setMenuOpen(false);
                setActiveMenu(null);
                setWorldOpen(false);
              }}
              aria-label="Abrir perfil"
              style={{ "--avatar-color": getAvatarColor(user.id || username) }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={username || "Perfil"} />
              ) : (
                <FaUserCircle />
              )}
            </button>

            <div className={`user-dropdown ${userMenuOpen ? "show" : ""}`}>
              <button onClick={() => navigate("/perfil")}>Ver perfil</button>
              <button onClick={handleLogout}>Cerrar sesion</button>
            </div>
          </div>
        )}
      </div>

      <div
        id="navbar-world-strip"
        className={`navbar-world-strip ${worldOpen ? "show" : ""}`}
        aria-hidden={!worldOpen}
      >
        <div className="navbar-world-inner">
          {worldSections.map((section) => (
            <Link
              key={section.label}
              to={section.to}
              className={`world-section-button world-section-button-${section.tone}`}
              onClick={() => setWorldOpen(false)}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </div>

      {isMobileMenu && (
        <>
          <div
            className={`menu-backdrop ${menuOpen ? "show" : ""}`}
            onClick={() => setMenuOpen(false)}
          />

          <div className={`menu-overlay ${menuOpen ? "show" : ""}`}>
            {navGroups.map((group) => {
              const GroupIcon = group.icon;

              if (group.to) {
                return (
                  <section key={group.key} className="mobile-nav-group mobile-nav-direct-group">
                    <Link
                      to={group.to}
                      className={group.variant ? `mobile-nav-link-${group.variant}` : ""}
                      onClick={() => setMenuOpen(false)}
                    >
                      <GroupIcon />
                      {group.label}
                    </Link>
                  </section>
                );
              }

              return (
                <section key={group.key} className="mobile-nav-group">
                  <h3>{group.label}</h3>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                        <ItemIcon />
                        {item.label}
                      </Link>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
