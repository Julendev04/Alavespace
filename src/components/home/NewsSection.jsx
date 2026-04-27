import React from "react";
import NewsCard from "./NewsCard";
import NewsModal from "./NewsModal";
import NewsEditor from "./NewsEditor";

export default function NewsSection({
  news,
  isAdmin,
  openNews,
  setOpenNews,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  categories,
  handleSaveNews,
  onCreateNews
}) {
  return (
    <div className="news-container">

      {/* ADMIN BAR */}
      {isAdmin && (
        <div className="news-admin-bar">
          <button
            className="create-news-btn"
            onClick={onCreateNews}
          >
            + Nueva noticia
          </button>
        </div>
      )}

      {/* SCROLL SECTION */}
      <div className="news-scroll-wrapper">
        <div className="news-scroll">

          {news?.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onOpen={() => setOpenNews(item)}
              onEdit={() => {
                setFormData({
                  id: item.id,
                  title: item.title,
                  content: item.content,
                  image_url: item.image_url,
                  category_id: item.category_id,
                  published_at: item.published_at
                });
                setIsEditing(true);
              }}
            />
          ))}

        </div>
      </div>

      {/* NEWS VIEW MODAL */}
      {openNews && (
        <div className="news-overlay">
          <NewsModal
            news={openNews}
            onClose={() => setOpenNews(null)}
          />
        </div>
      )}

      {/* NEWS EDIT MODAL */}
      {isEditing && (
        <div className="news-overlay">
          <NewsEditor
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onSave={handleSaveNews}
            onClose={() => setIsEditing(false)}
          />
        </div>
      )}

    </div>
  );
}