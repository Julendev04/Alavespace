export default function VideoBanner() {

  return (
    <div className="youtube-video-banner">

      <video
        className="youtube-bg-video"
        src="/video/preview.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="youtube-overlay">

        <a
          href="https://www.youtube.com/watch?v=TU_VIDEO_ID"
          target="_blank"
          rel="noopener noreferrer"
          className="youtube-video-thumbnail"
        >
          <img
            src="src/assets/mendizorroza.jpg"
            alt="Latest video"
          />

          <div className="youtube-thumb-overlay">
            <div className="play-icon">▶</div>
          </div>

        </a>

      </div>

      <div className="youtube-video-info">

        <h3>Resumen del partido en Mendizorroza</h3>

        <div className="youtube-video-meta">
          <span className="live-dot"></span>
          <span className="new-video-text">Nuevo vídeo</span>
        </div>

      </div>

    </div>
  );
}