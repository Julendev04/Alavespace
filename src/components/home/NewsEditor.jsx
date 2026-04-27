import React from "react";

export default function NewsEditor({
  formData,
  setFormData,
  categories,
  onSave,
  onClose
}) {
  return (
    <div className="news-overlay">
      <div className="news-modal edit-modal">

        <button className="news-close-admin" onClick={onClose}>
          ✕
        </button>

        <h2>
          {formData.id ? "Editar noticia" : "Crear noticia"}
        </h2>

        <div className="edit-body">

          <input
            type="text"
            placeholder="Título"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="URL imagen"
            value={formData.image_url}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
          />

          <textarea
            placeholder="Contenido (Markdown)"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
          />

          <input
            type="datetime-local"
            value={formData.published_at}
            onChange={(e) =>
              setFormData({ ...formData, published_at: e.target.value })
            }
          />

          <select
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
          >
            <option value="">Selecciona categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

        </div>

        <div className="edit-footer">
          <button onClick={onSave}>
            {formData.id ? "Guardar cambios" : "Publicar noticia"}
          </button>
        </div>

      </div>
    </div>
  );
}