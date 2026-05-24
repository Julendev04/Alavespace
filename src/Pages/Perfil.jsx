import React, { useEffect, useRef, useState } from "react";
import { FaCamera, FaEnvelope, FaSave, FaSignOutAlt, FaShieldAlt, FaUser } from "react-icons/fa";
import { supabase } from "../services/supabaseClient";
import "./Perfil.css";

const Perfil = () => {
  const fileInputRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const [{ data: profile }, { data: porraUser }] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, created_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("porra_users")
          .select("nombre, avatar, puntos")
          .eq("id", user.id)
          .maybeSingle()
      ]);

      setUsername(profile?.username || porraUser?.nombre || "");
      setCreatedAt(profile?.created_at || user.created_at);
      setAvatarUrl(porraUser?.avatar || "");
      setPoints(porraUser?.puntos ?? 0);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const anoMiembro = createdAt ? new Date(createdAt).getFullYear() : "";

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4200);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    if (!userId || !username.trim()) return;

    setSaving(true);
    const cleanUsername = username.trim();

    const [{ error: profileError }, { error: porraError }] = await Promise.all([
      supabase
        .from("profiles")
        .update({ username: cleanUsername })
        .eq("id", userId),
      supabase
        .from("porra_users")
        .upsert({ id: userId, nombre: cleanUsername, avatar: avatarUrl || null, puntos: points || 0 }, { onConflict: "id" })
    ]);

    setSaving(false);

    if (profileError || porraError) {
      showMessage("error", "No se pudieron actualizar tus datos. Intentalo de nuevo.");
      return;
    }

    showMessage("success", "Perfil actualizado correctamente.");
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      showMessage("error", "Sube una imagen valida para tu perfil.");
      return;
    }

    setUploading(true);
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    let publicUrl = "";

    if (uploadError) {
      publicUrl = await fileToDataUrl(file);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      publicUrl = data?.publicUrl || "";
    }

    const { error: updateError } = await supabase
      .from("porra_users")
      .upsert(
        {
          id: userId,
          nombre: username.trim() || email || "Usuario",
          avatar: publicUrl,
          puntos: points || 0
        },
        { onConflict: "id" }
      );

    setUploading(false);
    event.target.value = "";

    if (updateError || !publicUrl) {
      showMessage("error", "La imagen subio, pero no se pudo guardar en tu perfil.");
      return;
    }

    setAvatarUrl(publicUrl);
    showMessage("success", "Foto de perfil actualizada.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <div className="perfil-page">
        <div className="perfil-loading">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <section className="perfil-hero">
        <div>
          <span>Cuenta Alavesfera</span>
          <h1>Tu perfil</h1>
          <p>Gestiona tus datos, tu imagen y la identidad que aparece en la Porra.</p>
        </div>

        <div className="perfil-hero-badge">
          <FaShieldAlt />
          <span>Miembro desde {anoMiembro || "ahora"}</span>
        </div>
      </section>

      {message && (
        <div className={`perfil-message ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <div className="perfil-grid">
        <section className="perfil-card perfil-identity">
          <div className="avatar-uploader">
            <button
              type="button"
              className="avatar-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Subir foto de perfil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={username || "Avatar"} />
              ) : (
                <FaUser />
              )}
              <span>
                <FaCamera />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="avatar-input"
              onChange={handleAvatarUpload}
            />

            <strong>{username || "Usuario Alavesfera"}</strong>
            <p>{uploading ? "Subiendo imagen..." : "Pulsa en la foto para cambiarla"}</p>
          </div>

          <div className="perfil-stat-row">
            <div>
              <strong>{points}</strong>
              <span>Puntos Porra</span>
            </div>
            <div>
              <strong>Activo</strong>
              <span>Estado</span>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            Cerrar sesion
          </button>
        </section>

        <section className="perfil-card perfil-data">
          <div className="perfil-card-head">
            <span>Datos personales</span>
            <h2>Informacion de usuario</h2>
          </div>

          <label className="profile-field">
            <span>Nombre de usuario</span>
            <div>
              <FaUser />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Tu nombre de usuario"
              />
            </div>
          </label>

          <label className="profile-field">
            <span>Email</span>
            <div>
              <FaEnvelope />
              <input type="email" value={email} disabled />
            </div>
          </label>

          <button className="btn-update" onClick={handleSave} disabled={saving || !username.trim()}>
            <FaSave />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default Perfil;
