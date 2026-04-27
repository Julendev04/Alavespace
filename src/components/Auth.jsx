import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaInstagram, FaTwitter, FaDiscord, FaHome } from "react-icons/fa";
import "./Auth.css";

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // SLIDESHOW
  const images = [
    "src/assets/SLIDE1.jpg",
    "src/assets/SLIDE2.jpg",
    "src/assets/SLIDE3.jpg",
  ];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Verificar sesión
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate("/home");
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isRegister) {
      if (!username || username.length < 4) {
        setMessage("El username debe tener mínimo 4 caracteres");
        return;
      }

      try {
        // 1️⃣ Registrar en Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setMessage("Ya existe un usuario con ese correo");
          } else {
            setMessage(signUpError.message);
          }
          return;
        }

        const userId = signUpData?.user?.id;
        if (!userId) {
          setMessage("Error creando usuario");
          return;
        }

        // 2️⃣ Crear perfil en "profiles"
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            username,
          });

        if (profileError) {
          setMessage("Error guardando profile: " + profileError.message);
          return;
        }

        // 3️⃣ Crear fila en "porra_users"
        const { error: porraError } = await supabase
          .from("porra_users")
          .insert({
            id: userId,
            nombre: username,
            avatar: null,
            puntos: 0,
          });

        if (porraError) {
          setMessage("Usuario creado pero error en sistema de puntos");
          return;
        }

        // 4️⃣ Redirigir
        navigate("/home");
      } catch (err) {
        console.error(err);
        setMessage("Error inesperado");
      }
    } else {
      // Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setMessage(signInError.message);
        return;
      }

      navigate("/home");
    }
  };

  return (
    <div className="auth-container">
      {/* LADO IZQUIERDO - IMAGEN */}
      <div
        className="auth-left"
        style={{ backgroundImage: `url(${images[currentImage]})` }}
      >
        <div className="overlay-auth">
          <div className="slider-dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={index === currentImage ? "dot active" : "dot"}
              />
            ))}
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              “TOMA UN ESPACIO EN NUESTRA COMUNIDAD”
            </h1>

            <div className="socials-left">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram size={32} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter size={32} />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDiscord size={32} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DERECHO - FORMULARIO */}
      <div className="auth-right">
        <div className="auth-content">
          <div className="auth-box">
            <img src="src/assets/Branding/Logo.png" alt="Logo" className="auth-logo" />
            <h2>{isRegister ? "Crear Cuenta" : "Iniciar Sesión"}</h2>

            <form onSubmit={handleAuth}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}

              <input
                type="email"
                placeholder="Correo electrónico"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit">
                {isRegister ? "Registrarse" : "Ingresar"}
              </button>
            </form>

            {message && <p className="message">{message}</p>}

            <p className="switch">
              {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <span onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? " Inicia sesión" : " Regístrate"}
              </span>
            </p>
          </div>

          <button className="back-btn" onClick={() => navigate("/home")}>
            <FaHome size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}