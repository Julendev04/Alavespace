import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";

export default function TransfersAdminPanel() {

    const [form, setForm] = useState({
        name: "",
        team: "",
        position: "",
        value: "",
        source: "",
        probability: "Medium",
        status: "Rumour"
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // 🔥 manejar inputs
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // 🚀 submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const { error } = await supabase
            .from("transfers")
            .insert([
                {
                    ...form,
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error(error);
            setMessage("❌ Error adding transfer");
        } else {
            setMessage("✅ Transfer added!");
            setForm({
                name: "",
                team: "",
                position: "",
                value: "",
                source: "",
                probability: "Medium",
                status: "Rumour"
            });
        }

        setLoading(false);
    };

    return (
        <div className="admin-panel">

            <h2>Añadir Transfer</h2>

            <form onSubmit={handleSubmit} className="admin-form">

                <input
                    type="text"
                    name="name"
                    placeholder="Player name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="team"
                    placeholder="Current team"
                    value={form.team}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="position"
                    placeholder="Position (FW, CM...)"
                    value={form.position}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="value"
                    placeholder="Value (€100M)"
                    value={form.value}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="source"
                    placeholder="Source (Sky, Marca...)"
                    value={form.source}
                    onChange={handleChange}
                />

                <select
                    name="probability"
                    value={form.probability}
                    onChange={handleChange}
                >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </select>

                <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                >
                    <option>Rumour</option>
                    <option>Negotiating</option>
                    <option>Done</option>
                </select>

                <button type="submit" disabled={loading}>
                    {loading ? "Añadiendo..." : "Añadir"}
                </button>

            </form>

            {message && <p className="admin-message">{message}</p>}

        </div>
    );
}