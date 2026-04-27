import React from "react";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  return (
    <div className="pp-container">
      <div className="pp-card">
        <h1 className="pp-title">Política de Privacidad</h1>
        <p className="pp-last-updated">Última actualización: Abril 2026</p>

        <section className="pp-section">
          <h2 className="pp-subtitle">1. Información que recopilamos</h2>
          <p className="pp-text">
            Recopilamos información personal que usted nos proporciona directamente,
            como su nombre, correo electrónico y cualquier otro dato enviado a través
            de formularios en nuestro sitio web.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-subtitle">2. Uso de la información</h2>
          <p className="pp-text">
            Utilizamos la información recopilada para mejorar nuestros servicios,
            responder a consultas y ofrecer una mejor experiencia de usuario.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-subtitle">3. Protección de datos</h2>
          <p className="pp-text">
            Implementamos medidas de seguridad adecuadas para proteger su información
            personal contra accesos no autorizados o divulgación.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-subtitle">4. Cookies</h2>
          <p className="pp-text">
            Nuestro sitio web puede utilizar cookies para mejorar la experiencia del
            usuario. Puede configurar su navegador para rechazar cookies si lo desea.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-subtitle">5. Derechos del usuario</h2>
          <p className="pp-text">
            Usted tiene derecho a acceder, modificar o eliminar sus datos personales.
            Para ejercer estos derechos, puede contactarnos directamente.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-subtitle">6. Cambios en la política</h2>
          <p className="pp-text">
            Nos reservamos el derecho de actualizar esta política en cualquier
            momento. Se recomienda revisar esta página periódicamente.
          </p>
        </section>

        <section className="pp-section">
          <h2 className="pp-subtitle">7. Contacto</h2>
          <p className="pp-text">
            Si tiene preguntas sobre esta política de privacidad, puede ponerse en
            contacto con nosotros a través de nuestro correo electrónico.
          </p>
        </section>
      </div>
    </div>
  );
}