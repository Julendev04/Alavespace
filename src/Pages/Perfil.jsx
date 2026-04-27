import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "./Perfil.css";

const Perfil = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setEmail(data.user.email);

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, created_at")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setUsername(profile.username);
          setCreatedAt(profile.created_at);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const añoMiembro = createdAt
    ? new Date(createdAt).getFullYear()
    : "";

  return (
    <div className="perfil-container">

      {/* IZQUIERDA */}
      <div className="card datos">
        <h1>MIS DATOS</h1>

        <div className="form-group">
          <label>Username*</label>
          <div className="input-icon">
            <input type="text" value={username} disabled />
            <span>@</span>
          </div>
        </div>

        <div className="form-group">
          <label>Email*</label>
          <div className="input-icon">
            <input type="text" value={email} disabled />
            <span>✉</span>
          </div>
        </div>

        <button className="btn-update">Actualizar Datos</button>
      </div>

      {/* DERECHA */}
      <div className="card perfil">
        <div className="avatar"></div>

        <h2>{username}</h2>
        <p className="rol">Miembro</p>

        <div className="stats">
          <div>
            <strong>Activo</strong>
            <span>Status</span>
          </div>

          <div>
            <strong>{añoMiembro}</strong>
            <span>Miembro desde</span>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>

    </div>
  );
};

export default Perfil;