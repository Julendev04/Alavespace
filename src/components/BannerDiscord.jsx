import React from "react";
import "./BannerDiscord.css";

const BannerDiscord = ({
  title = "Únete a nuestro Discord",
  description = "Forma parte de la comunidad oficial y entérate de todo antes que nadie.",
  buttonText = "Entrar al servidor",
  discordLink = "#",
  background = "linear-gradient(90deg, #5865F2, #3A45CC)"
}) => {
  return (
    <div className="banner-discord" style={{ background }}>
      <div className="banner-content">
        <h2>{title}</h2>
        <p>{description}</p>
        <a href={discordLink} target="_blank" rel="noopener noreferrer">
          {buttonText}
        </a>
      </div>
    </div>
  );
};

export default BannerDiscord;
