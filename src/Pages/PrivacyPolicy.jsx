import React from "react";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  return (
    <div className="pp-container">
      <div className="pp-card">
        <header className="pp-header">
          <h1 className="pp-title">Política de Privacidad</h1>
          <p className="pp-last-updated">Última actualización: Abril 2026</p>
        </header>

        <section className="pp-section">
          <h2 className="pp-subtitle">Identificación del responsable</h2>

          <div className="pp-info-block">
            <p><span>Titular:</span> AGENCIA DIGITAL ASTATIK, S.L. (en adelante, “ATLÉTICO STATS”)</p>
            <p><span>Domicilio social:</span> C. de Uruguay, 3 Bis Chamartín, 28016 Madrid, España</p>
            <p><span>C.I.F.:</span> B26621318</p>
            <p><span>E-mail:</span> comunicacion@atleticostats.es</p>
          </div>
        </section>

        {/* RESPONSABLE */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Responsable del tratamiento</h2>
          <p className="pp-text">
            El responsable del tratamiento de los datos personales es el titular del sitio web,
            quien determina los fines y medios del tratamiento de conformidad con la normativa vigente.
            Puede contactar a través del correo electrónico facilitado en la web.
          </p>
        </section>

        {/* INFORMACIÓN */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Información que recopilamos</h2>
          <p className="pp-text">
            Recopilamos datos personales que el usuario proporciona voluntariamente al registrarse,
            suscribirse o interactuar con los formularios del sitio web.
          </p>

          <div className="pp-mini-chart">
            <div className="pp-bar">
              <span>Datos identificativos</span>
              <div className="bar-fill bar-1"></div>
            </div>
            <div className="pp-bar">
              <span>Datos de navegación</span>
              <div className="bar-fill bar-2"></div>
            </div>
            <div className="pp-bar">
              <span>Datos de contacto</span>
              <div className="bar-fill bar-3"></div>
            </div>
          </div>
        </section>

        {/* FINALIDAD */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Finalidad del tratamiento</h2>
          <p className="pp-text">
            Gestión de usuarios, prestación del servicio, soporte técnico, análisis de uso,
            seguridad de la plataforma y comunicaciones relacionadas con el servicio.
          </p>
        </section>

        {/* BASE JURÍDICA */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Base jurídica</h2>
          <p className="pp-text">
            El tratamiento se basa en la ejecución de un contrato, consentimiento del usuario,
            interés legítimo del responsable y cumplimiento de obligaciones legales.
          </p>
        </section>

        {/* ENCARGADOS */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Encargados del tratamiento</h2>
          <p className="pp-text">
            Podrán intervenir proveedores tecnológicos que prestan servicios de hosting, analítica,
            email o procesamiento de pagos, actuando siempre como encargados del tratamiento bajo
            contrato de confidencialidad y cumplimiento del RGPD.
          </p>
        </section>

        {/* TRANSFERENCIAS */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Transferencias internacionales</h2>
          <p className="pp-text">
            Algunos proveedores pueden operar fuera del Espacio Económico Europeo. En estos casos,
            se garantizan niveles adecuados de protección mediante cláusulas contractuales tipo o
            mecanismos reconocidos por la normativa europea.
          </p>
        </section>

        {/* TABLA */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Tratamiento de datos</h2>

          <div className="pp-table-wrapper">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Base legal</th>
                  <th>Finalidad</th>
                  <th>Conservación</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Registro de usuarios</td>
                  <td>Contrato</td>
                  <td>Acceso al servicio</td>
                  <td>Cuenta activa</td>
                </tr>
                <tr>
                  <td>Contacto</td>
                  <td>Consentimiento</td>
                  <td>Atención al usuario</td>
                  <td>12 meses</td>
                </tr>
                <tr>
                  <td>Analítica</td>
                  <td>Interés legítimo</td>
                  <td>Mejora del servicio</td>
                  <td>24 meses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SEGURIDAD */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Seguridad de la información</h2>
          <p className="pp-text">
            Se aplican medidas técnicas y organizativas como cifrado TLS, control de accesos,
            monitorización, copias de seguridad y sistemas de prevención de accesos no autorizados.
          </p>
        </section>

        {/* COMUNICACIONES */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Comunicaciones comerciales</h2>
          <p className="pp-text">
            En caso de envío de comunicaciones comerciales, estas se realizarán únicamente con
            consentimiento previo del usuario, pudiendo este darse de baja en cualquier momento.
          </p>
        </section>

        {/* MENORES */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Menores de edad</h2>
          <p className="pp-text">
            Los servicios no están dirigidos a menores de edad. En caso de detección de datos
            de menores sin consentimiento parental, estos serán eliminados de forma inmediata.
          </p>
        </section>

        {/* DERECHOS */}
        <section className="pp-section">
          <h2 className="pp-subtitle">Derechos del usuario</h2>
          <p className="pp-text">
            El usuario puede ejercer los derechos de acceso, rectificación, supresión, oposición,
            limitación y portabilidad mediante solicitud al correo de contacto. Asimismo, puede
            presentar reclamación ante la Agencia Española de Protección de Datos (AEPD).
          </p>
        </section>
      </div>
    </div>
  );
}