// Loader.jsx
import React from "react";
import "./Loader.css";
import logo2 from "../assets/Branding/logo2.png"

export default function Loader() {
  return (
    <div className="loading-screen">
      <div className="loader-wrapper">
        <div className="spinner-ring"></div>

        <img
          src={logo2}
          alt="Logo2"
          className="loader-logo"
        />
      </div>
    </div>
  );
}