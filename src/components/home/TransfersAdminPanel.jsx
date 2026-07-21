import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";

export default function TransfersAdminPanel() {
    const [form, setForm] = useState({
        name: "",
        team: "",
        position: "",
        value: "",
        source: "",
        source_url: "",
        transfer_type: "entrada",
        probability: "Medium",
        status: "Rumour",
        teamLogoFile: null,
        playerImageFile: null
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleTeamLogoChange = (e) => {
        setForm({
            ...form,
            teamLogoFile: e.target.files?.[0] || null
        });
    };

    const handlePlayerImageChange = (e) => {
        setForm({
            ...form,
            playerImageFile: e.target.files?.[0] || null
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const safeTeam = form.team
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const safePlayer = form.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const teamLogoUrl = await uploadTransferImage({
            bucket: "transfer-team-logos",
            file: form.teamLogoFile,
            fileName: safeTeam || "team",
            fallbackType: "image/png",
            onError: () => setMessage("Error subiendo el escudo")
        });

        if (teamLogoUrl === false) {
            setLoading(false);
            return;
        }

        const playerImageUrl = await uploadTransferImage({
            bucket: "transfer-player-images",
            file: form.playerImageFile,
            fileName: safePlayer || "player",
            fallbackType: "image/png",
            onError: () => setMessage("Error subiendo la foto del jugador")
        });

        if (playerImageUrl === false) {
            setLoading(false);
            return;
        }

        const { teamLogoFile, playerImageFile, ...transferPayload } = form;

        const { error } = await supabase
            .from("transfers")
            .insert([
                {
                    ...transferPayload,
                    team_logo_url: teamLogoUrl,
                    player_image_url: playerImageUrl,
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error(error);
            setMessage("Error al crear la transferencia");
        } else {
            setMessage("Transferencia creada correctamente");
            setForm({
                name: "",
                team: "",
                position: "",
                value: "",
                source: "",
                source_url: "",
                transfer_type: "entrada",
                probability: "Medium",
                status: "Rumour",
                teamLogoFile: null,
                playerImageFile: null
            });
        }

        setLoading(false);
    };

    return (
        <div className="admin-panel">
            <div className="transfer-admin-heading">
                <h2>Crear transferencia</h2>
                <p>Completa los datos del rumor y sube las imagenes para la tarjeta.</p>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
                <label className="admin-field">
                    <span>Jugador</span>
                    <input
                        type="text"
                        name="name"
                        placeholder="Nombre del jugador"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Foto transparente del jugador</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePlayerImageChange}
                    />
                </label>

                <label className="admin-field">
                    <span>Equipo de origen</span>
                    <input
                        type="text"
                        name="team"
                        placeholder="Equipo actual"
                        value={form.team}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Escudo del equipo</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleTeamLogoChange}
                    />
                </label>

                <label className="admin-field">
                    <span>Posicion</span>
                    <input
                        type="text"
                        name="position"
                        placeholder="FW, CM..."
                        value={form.position}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Valor</span>
                    <input
                        type="text"
                        name="value"
                        placeholder="100M"
                        value={form.value}
                        onChange={handleChange}
                    />
                </label>

                <label className="admin-field">
                    <span>Fuente</span>
                    <input
                        type="text"
                        name="source"
                        placeholder="Sky, Marca..."
                        value={form.source}
                        onChange={handleChange}
                    />
                </label>

                <label className="admin-field">
                    <span>Link de la fuente</span>
                    <input
                        type="text"
                        name="source_url"
                        placeholder="https://..."
                        value={form.source_url}
                        onChange={handleChange}
                    />
                </label>

                <label className="admin-field">
                    <span>Operacion</span>
                    <select
                        name="transfer_type"
                        value={form.transfer_type}
                        onChange={handleChange}
                    >
                        <option value="entrada">Entrada</option>
                        <option value="salida">Salida</option>
                    </select>
                </label>

                <label className="admin-field">
                    <span>Probabilidad</span>
                    <select
                        name="probability"
                        value={form.probability}
                        onChange={handleChange}
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </label>

                <label className="admin-field">
                    <span>Estado</span>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option>Rumour</option>
                        <option>Negotiating</option>
                        <option>Done</option>
                    </select>
                </label>

                <button className="admin-submit" type="submit" disabled={loading}>
                    {loading ? "Creando..." : "Crear"}
                </button>
            </form>

            {message && <p className="admin-message">{message}</p>}
        </div>
    );
}

async function uploadTransferImage({ bucket, file, fileName, fallbackType, onError }) {
    if (!file) return null;

    const extension = file.name.split(".").pop() || "png";
    const filePath = `${fileName}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            contentType: file.type || fallbackType,
            upsert: true
        });

    if (error) {
        console.error(error);
        onError?.();
        return false;
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return data?.publicUrl || null;
}
