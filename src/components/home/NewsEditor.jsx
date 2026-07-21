import React, { useEffect, useState } from "react";

export default function NewsEditor({
  formData,
  setFormData,
  categories,
  onSave,
  onClose,
  isSaving
}) {
  const [previewUrl, setPreviewUrl] = useState(formData.image_url || "");

  useEffect(() => {
    if (!formData.image_file) {
      setPreviewUrl(formData.image_url || "");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(formData.image_file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.image_file, formData.image_url]);

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    setFormData({ ...formData, image_file: file });
  }

  return (
    <div className="news-modal edit-modal">
      <button className="news-close-admin" onClick={onClose} aria-label="Cerrar editor">
        x
      </button>

      <h2>{formData.id ? "Editar noticia" : "Crear noticia"}</h2>

      <div className="edit-body">
        <input
          type="text"
          placeholder="Titulo"
          value={formData.title}
          onChange={(event) =>
            setFormData({ ...formData, title: event.target.value })
          }
        />

        <label className="news-image-upload">
          <span>Imagen de la noticia</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          <strong>
            {formData.image_file ? formData.image_file.name : "Seleccionar foto"}
          </strong>
        </label>

        {previewUrl && (
          <div className="news-image-preview">
            <img src={previewUrl} alt="Vista previa de la noticia" />
          </div>
        )}

        <textarea
          placeholder="Contenido (Markdown)"
          value={formData.content}
          onChange={(event) =>
            setFormData({ ...formData, content: event.target.value })
          }
        />

        <input
          type="datetime-local"
          value={formData.published_at}
          onChange={(event) =>
            setFormData({ ...formData, published_at: event.target.value })
          }
        />

        <select
          value={formData.category_id}
          onChange={(event) =>
            setFormData({ ...formData, category_id: event.target.value })
          }
        >
          <option value="">Selecciona categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="edit-footer">
        <button onClick={onSave} disabled={isSaving}>
          {isSaving
            ? "Guardando..."
            : formData.id
              ? "Guardar cambios"
              : "Publicar noticia"}
        </button>
      </div>
    </div>
  );
}
