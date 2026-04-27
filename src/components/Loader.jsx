// Loader.jsx
import React from "react";
import "./Loader.css";

export default function Loader() {
  return (
    <div className="loading-screen">
      <div className="loader-wrapper">
        <div className="spinner-ring"></div>

        <img
          src="src/assets/Branding/logo2.png"
          alt="Logo"
          className="loader-logo"
        />
      </div>
    </div>
  );
}