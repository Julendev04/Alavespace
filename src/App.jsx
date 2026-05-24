import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./Pages/Home";
import Matches from "./Pages/Matches";
import Nosotros from "./Pages/Nosotros";
import Footer from "./components/Footer";
import Lineup from "./Aplications/Lineup";
import Pizarra from "./Pages/Pizarra";
import Notas from "./Aplications/Notas";
import Porra from "./Aplications/Porra";
import Ficha from "./Pages/Ficha";
import Auth from "./components/Auth"; 
import Noticiero from "./Pages/Noticiero"; 
import Plantillas from "./Pages/Plantilla"; 
import Landing from "./Pages/Landing";
import Filial from "./Pages/Filial";
import Perfil from "./Pages/Perfil";
import Contacto from "./Pages/Contacto";
import Privacidad from "./Pages/PrivacyPolicy";
import Coockies from "./Pages/CoockiePolicy";
import Trayectoria from "./Pages/Trayectoria";
import MatchPreview from "./Pages/MatchPreview";

function Layout() {
  const location = useLocation();
  const hideLayout = location.pathname === "/auth" || location.pathname === "/landing"; // 👈 Ocultar Navbar/Footer aquí
   const isAuth = location.pathname === "/auth"; // 👈 ESTA ES LA NUEVA
   const isLanding = location.pathname === "/landing";

  return (
    <>
      <div className="app-container">
      {!hideLayout && <Navbar />}
      <main className={isAuth ? "main-auth" : isLanding ? "main-landing" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} /> {/* 👈 Ruta Auth */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/Matches" element={<Matches />} />
          <Route path="/jugador/:id" element={<Ficha />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/lineup" element={<Lineup />} />
          <Route path="/pizarra" element={<Pizarra />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/porra" element={<Porra />} />
          <Route path="/noticiero" element={<Noticiero />} />
          <Route path="/Plantilla" element={<Plantillas />} />
          <Route path="/filial" element={<Filial />} />
          <Route path="/Perfil" element={<Perfil />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/politica-privacidad" element={<Privacidad />} />
          <Route path="/coockies" element={<Coockies />} />
          <Route path="/trayectoria" element={<Trayectoria />} />
          <Route path="/partido/:id" element={<MatchPreview />} />
        </Routes>
      </main>
    </div>
    {!hideLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
