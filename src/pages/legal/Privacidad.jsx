import { Link } from 'react-router-dom';

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-dark-base text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Legal</p>
          <h1 className="text-3xl md:text-4xl font-black">Política de privacidad</h1>
          <p className="text-sm text-gray-400">
            Documento orientativo para España (RGPD + LOPDGDD). Sustituye los campos entre corchetes.
          </p>
        </header>

        <section className="space-y-4 bg-[#1A1A2E] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-black">1. Responsable del tratamiento</h2>
          <p className="text-sm text-gray-300">
            Responsable: <strong>[Nombre / Razón social]</strong><br />
            NIF/CIF: <strong>[NIF/CIF]</strong><br />
            Contacto: <strong>[Email]</strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">2. Datos que tratamos</h2>
          <p className="text-sm text-gray-400">
            Podemos tratar: datos identificativos y de contacto (nombre, email, teléfono), datos de uso del servicio
            (reservas, historial), y otros datos opcionales que aportes (DNI/NIE, dirección, fecha de nacimiento).
          </p>

          <h2 className="text-lg font-black">3. Finalidades</h2>
          <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
            <li>Gestionar el alta de usuario, autenticación y mantenimiento de la cuenta.</li>
            <li>Gestionar reservas e incidencias relacionadas con el servicio.</li>
            <li>Atender consultas y soporte.</li>
            <li>Seguridad, prevención de fraude y auditoría.</li>
          </ul>

          <h2 className="text-lg font-black">4. Base jurídica</h2>
          <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
            <li>Ejecución de un contrato o medidas precontractuales.</li>
            <li>Cumplimiento de obligaciones legales.</li>
            <li>Interés legítimo (seguridad y mejora del servicio).</li>
            <li>Consentimiento (cuando proceda, p. ej. comunicaciones opcionales).</li>
          </ul>

          <h2 className="text-lg font-black">5. Conservación</h2>
          <p className="text-sm text-gray-400">
            Los datos se conservarán mientras exista relación con el usuario y durante los plazos legales aplicables.
          </p>

          <h2 className="text-lg font-black">6. Encargados y terceros</h2>
          <p className="text-sm text-gray-400">
            El servicio puede apoyarse en proveedores (p. ej. Supabase para autenticación y base de datos) que actúan
            como encargados del tratamiento. Se formalizarán acuerdos y medidas de seguridad adecuadas.
          </p>

          <h2 className="text-lg font-black">7. Derechos</h2>
          <p className="text-sm text-gray-400">
            Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad
            escribiendo a <strong>[Email]</strong>. También puedes reclamar ante la AEPD.
          </p>
        </section>

        <div className="pt-4 border-t border-white/5 text-sm text-gray-400">
          <Link className="text-brand-lime font-bold hover:underline" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

